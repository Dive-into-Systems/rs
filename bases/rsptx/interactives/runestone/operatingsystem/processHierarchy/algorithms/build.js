/**
 * @file build.js
 * @brief Utilities for constructing and simulating process hierarchies
 *        with fork, wait, and exit operations.
 */
const INDENT_SPC = 2;
const DASH = "─";
// const BAR = "|";
const SPC = "&#8195;";
const SPC1 = " ";
const WAIT_CHAR = "W";
const NEWLINE = "<br>";
export const EXIT_CHAR = "X";
const PRINT_CHAR = "-";
const nullChar = "\\";

// Generate a uniform random float in [0, 1) using crypto.getRandomValues for strong randomness.
function randomFloat32() {
    return window.crypto.getRandomValues(new Uint32Array(1))[0]/(2**32);
    // return Math.random();
}

// Selects a random index from an array using uniform distribution
function unifPickId(arr) {
    return Math.floor(randomFloat32() * arr.length);
}

// Selects a random item from one or more arrays using uniform distribution
function unifPickItem(...items) {
    const combinedArray = items.flat();
    if (!combinedArray.length) throw new Error("No arrays provided or all are empty.");
    return combinedArray[unifPickId(combinedArray)];
}

// Randomly weave two arrays:
// Example: randomWeave(123456, abcdef) = 1ab2cd345ef6
// This utility helps weave prints in concurrent parts of fork
function randomWeave(arr1, arr2) {
    // Ensure the inputs are arrays.
    arr1 = arr1 || [];
    arr2 = arr2 || [];
    const result = [];
    let i = 0, j = 0;
  
    while (i < arr1.length || j < arr2.length) {
      if (i < arr1.length && j < arr2.length) {
        if (Math.random() < 0.5) {
          result.push(arr1[i]);
          i++;
        } else {
          result.push(arr2[j]);
          j++;
        }
      } else if (i < arr1.length) {
        result.push(arr1[i]);
        i++;
      } else if (j < arr2.length) {
        result.push(arr2[j]);
        j++;
      }
    }
    return result;
  }

// merge two dictionaries (objects)
// This utility helps us merge printing constraints for dictionaries
// that specifies previous prints
// example: merge({a: b}, {c:d, a:e}) = {a:be, c:d}
function mergeDicts(...dicts) {
    const result = {};
    for (const dict of dicts) {
        for (const key in dict) {
            if (result.hasOwnProperty(key)) {
                result[key].push(...dict[key]);
            } else {
                result[key] = dict[key];
            }
        }
    }
    return result;
}

function parseForkArgs(code, forkIndex) {
    let balance = 1;
    let topLevelComma = null; // position of first top-level comma
    let [start, end] = [forkIndex + 2, forkIndex + 2]; // after 'f('
    while (end < code.length) {
        if (code[end] === '(') balance++;
        if (code[end] === ')') balance--;
        if (balance === 0) break; // found closing bracket
        if (balance === 1 && code[end] === ',') topLevelComma ??= end; // only assigns top comma once
        end++;
    }

    if (!topLevelComma) return [code.substring(start, end), '', end];
    return [
        code.substring(start, topLevelComma),
        code.substring(topLevelComma + 1, end),
        end // next index
    ];
}

function parseForkWait(code) {
    let balance = 0;
    let start = 0, i = 0, wait = -1;
    while (i < code.length) {
        if (code[i] === '(') balance++;
        if (code[i] === ')') balance--;
        if (balance === 0 && code[i] === WAIT_CHAR) {
            wait = i;
            break
        };
        i++;
    }

    if (wait === -1) return [code, ''];
    return [
        code.substring(start, wait),
        code.substring(wait + 1, code.length)
    ];
}

function parseForkExit(code) {
    let balance = 0;
    let start = 0, end = 0;
    while (end < code.length) {
        if (code[end] === '(') balance++;
        if (code[end] === ')') balance--;
        if (balance === 0 && code[end] === EXIT_CHAR) {
            break
        };
        end++;
    }
    return code.substring(start, end);
}

function blankInfo() {
    return {
        cCode: [],
        trace: [],
        proc: [],
        hist: []
    };
}

function concat(...arrays) {
    return arrays.reduce((acc, curr) => [...acc, ...curr], []);
}

// ProcessGraph records fork- and wait-edges
class ProcessGraph {
    constructor() {
      this.forkEdges = [];
      this.waitEdges = [];
    }
    addForkEdge(parentID, childID) {
      this.forkEdges.push({ parentID, childID });
    }
    addWaitEdge(fromExitID, toWaitID) {
      this.waitEdges.push({ fromExitID, toWaitID });
    }
  }

class ForkNode {
    constructor(id = 0, childCt = 0, active = true, value = "", left = null, right = null, graph = null) {
        this.id = id;
        this.childCt = childCt;
        this.active = active;
        this.value = value;
        this.left = left;
        this.right = right;
        this.waited = false;
        if (graph === null) {
            this.graph = new ProcessGraph();
        } else {
            this.graph = graph;
        }
    }

    getChildrenInfo() {
        // left id, left ct, right id, right ct
        return [this.id, this.childCt+1, this.id*10+this.childCt+1, 0];
    }

    getChildrenID() {
        const [leftID, leftCt, rightID, rightCt] = this.getChildrenInfo();
        const leftChildID = `${leftID}.${leftCt}`;
        const rightChildID = `${rightID}.${rightCt}`;
        return [leftChildID, rightChildID];
    }
    
    timelineLen() {
        // whichever timeline is longer
        return Math.max(this.left?(this.left.timelineLen()+1):0, this.right?(this.right.timelineLen()):0);
    }

    timelineCt() {
        // add 1 timeline if we reach the end
        return ( this.left?this.left.timelineCt():1 ) + ( this.right?this.right.timelineCt():0 );
    }

    print(text) {
        if (this.right) this.right.print(text); // you have a child, it also print
        if (!this.active) return;
        if (this.left) { // "future" self, print
            this.left.print(text);
        } else {
            this.value+= text;
        }
    }

    exit() {
        if (this.right) this.right.exit(); // you have a child, it also exit
        if (!this.active) return;
        if (this.left) {
            this.left.exit();
        }
        else {
            this.print("X");
            this.active = false;
            // this.left = new ForkNode(this.id, -1, false);
        }
    }

    fork(leftCode, rightCode, indent, terminate) {
        function concat2D(array1, array2) {
            let result = [];
            for (let i = 0; i < Math.max(array1.length, array2.length); i++) {
                let row1 = array1[i] || [];
                let row2 = array2[i] || [];
                result.push(row1.concat(row2));
            }
        
            return result;
        }

        function mergeInfo(a, b) {
            if (b.cCode && !a.cCode) a.cCode = b.cCode;
            a.proc.push(...b.proc);
            a.hist.push(...b.hist);
            a.trace = concat2D(a.trace, b.trace);
        }

        function purge(a) {
            a.trace.fill("");
            a.hist = [];
            a.proc = [];
        }
        let left = blankInfo();
        let right = blankInfo();
        let temp1 = blankInfo();
        let temp2 = blankInfo();
        let exitingProc;
        if (!this.active) {
            [left, temp1] = (new ForkNode(0, 0, true, "", null, null, this.graph)).fork(leftCode, rightCode, indent, terminate);
            purge(left);
            purge(temp1); // basically, make no changes to current tree
        }
        else {
            if (this.left) {
                [left, temp1] = this.left.fork(leftCode, rightCode, indent, terminate);
            } else {
                // self exec, BASE CASE
                let leftTerm = terminate-1; // adjust for F(
                const [leftID, leftCt, rightID, rightCt] = this.getChildrenInfo();
                this.left = new ForkNode(leftID, leftCt, true, "", null, null, this.graph);
                left = this.left.pushCode(leftCode, indent, leftTerm);

                let rightTerm = leftTerm;
                if (left.cCode.length>0) {
                    rightTerm = leftTerm - 1 - left.cCode.length;
                }
                // ordering matters here! , left.right can only be created after left push is done
                this.left.right = new ForkNode(rightID, rightCt, true, "", null, null, this.graph);
                temp1 = this.left.right.pushCode(rightCode, indent, rightTerm);
                exitingProc = this.left.right;
                while (exitingProc.left) {
                    exitingProc = exitingProc.left;
                }
            }

        }
        if (this.right) [temp2, right] = this.right.fork(leftCode, rightCode, indent, terminate);
        right.cCode = temp1.cCode;
        // left.hist.push(temp2.hist);
        mergeInfo(left, temp2);
        mergeInfo(right, temp1);

        return [left, right, exitingProc];
    }

    pushCode(code, indent = 0, terminate) {
        terminate ??= code.length;
        let leftResult = blankInfo();
        let rightResult = blankInfo();
        let liveProcesses = this.active?[`${this.id}.${this.childCt}`]:[""];
        let cCode = [];
        let trace = [];
        let hist = [];

        let leftCode, rightCode;
        let exitingProc;

        function addLine(line, active, extraProc) {
            terminate--;
            trace.push(active?(extraProc||liveProcesses):([]));
            cCode.push(`${SPC.repeat(indent)}${line}`);
        }

        function emptyStrOnly(arr) {
            return !Array.isArray(arr) || arr.every(str => typeof str !== 'string' || str.trim() === '');
        }
        for (let ptr = 0; ptr < code.length; ptr++) {
            if (terminate < 0) {
                break;
            }
            if (code[ptr] == EXIT_CHAR) {
                addLine(`exit();`, this.active);
                // hist.push(...liveProcesses);
                liveProcesses = [""];
                this.exit();
                continue;
            }
            if (code[ptr] == WAIT_CHAR) {
                addLine(`wait(NULL);`, this.active);
                if (this.active && exitingProc) {
                    this.graph.addWaitEdge(exitingProc.id, this.id);
                }
                continue;
            }
            if (code[ptr]!= "F") {
                addLine(`printf("${code[ptr]}");`, this.active);
                this.print(code[ptr]);
                continue;
            }
            // if you're fixing this section i apologize ;-; - tony
            if (code[ptr] == "F") {
                [leftCode, rightCode, ptr] = parseForkArgs(code, ptr);
                [leftResult, rightResult, exitingProc] = this.fork(leftCode, rightCode, indent + INDENT_SPC, terminate);

                let leftPre = emptyStrOnly(leftResult.hist)?leftResult.proc:leftResult.hist;
                let rightPre = emptyStrOnly(rightResult.hist)?rightResult.proc:rightResult.hist;
                // let rightPre = rightResult.hist;

                if (!leftCode && !rightCode) addLine("fork();", this.active, concat(leftPre, rightPre)); // odd
                if (leftCode) {
                    addLine("if (fork()) {", this.active, concat(leftPre, rightPre));
                    terminate -= leftResult.cCode.length;
                    cCode.push(...leftResult.cCode);
                    trace.push(...leftResult.trace);
                    if (rightCode)  addLine("} else {", this.active, rightPre);
                    else            addLine("}", this.active, concat(leftResult.proc, rightResult.proc));
                }
                if (rightCode) {
                    if (!leftCode) addLine("if (fork() == 0) {", this.active, concat(leftPre, rightPre));
                    terminate -= rightResult.cCode.length;
                    cCode.push(...rightResult.cCode);
                    trace.push(...rightResult.trace);
                    addLine("}", this.active, concat(leftResult.proc, rightResult.proc));
                }
                if (this.active) {
                    // hist.push(...liveProcesses, ...leftResult.hist);
                    hist.push(...liveProcesses);
                    liveProcesses = concat(leftResult.proc, rightResult.proc);
                    this.graph.addForkEdge(this.id, this.left.id);
                    this.graph.addForkEdge(this.id, this.left.right.id);
                }
            }
            // - end
        }

        let result = blankInfo();
        result.cCode = cCode;
        result.trace = trace;
        result.proc = liveProcesses;
        result.hist = hist; // processes that we created but eventually "killed"
        return result;
    }

    serialize() {
        const obj = {
            id: this.id,
            childCt: this.childCt,
            value: this.value,
            children: []
        };
        if (this.left) {
            obj.children.push(this.left.serialize());
        } else {
            obj.children.push({
                id: this.id,
                childCt: -1,
                value: "EXIT",
                children: []
            });
        }
        if (this.right) obj.children.push(this.right.serialize());
        return obj;
    }
}

// Processes the code recursively and builds a structure of print constraints.
// The process print structure may be nested (like how forks are nested)
// example {beforeWait: ab, afterWait: c{beforeWait:, afterWait:d, child: e}, child: f}
export function printSequenceConstraints(code) {
    let sequenceList = [];
    let ptr = 0;
    while (ptr < code.length) {
    if (code[ptr] !== "F") {
        sequenceList.push(code[ptr]);
    } else {
        // Assume these helper functions return the expected values.
        let [leftCode, rightCode, newPtr] = parseForkArgs(code, ptr);
        ptr = newPtr;
        let [leftWaitCode, rightWaitCode] = parseForkWait(leftCode);
        rightCode = parseForkExit(rightCode);

        let currProcessPrint = {
        beforeWait: printSequenceConstraints(leftWaitCode),
        afterWait: printSequenceConstraints(rightWaitCode),
        child: printSequenceConstraints(rightCode)
        };

        sequenceList.push(currProcessPrint);
    }
    ptr++;
    }
    return sequenceList;
}

// This function always generate ONE correct print sequence
// This function does not give exhausive results
// One correct print sequence is returned as an array
export function getPrintSequence(sequenceList) {
    if (!Array.isArray(sequenceList) || sequenceList.length === 0) {
        return [];
    }
    let correctPrint = [];
    for (let i = 0; i < sequenceList.length; i++) {
        if (typeof sequenceList[i] === 'string') {
            correctPrint.push(sequenceList[i]);
        } else if (typeof sequenceList[i] === 'object') {
            let beforeWait = getPrintSequence(sequenceList[i].beforeWait);
            let afterWait = getPrintSequence(sequenceList[i].afterWait);
            let child = getPrintSequence(sequenceList[i].child);
            
            let temp = [
                ...randomWeave(beforeWait, child),
                ...afterWait
            ];

            correctPrint.push(...temp);
        }
    }
    return correctPrint;
}

// This function generates print sequence: may be correct or incorrect
// wrong parts are generated by probability
// Returns a tuple: [array of print sequence, whether error is injected (incorrect)]
export function getPrintSequenceIncorrect(sequenceList) {
    let error_injected = false;
    if (!Array.isArray(sequenceList) || sequenceList.length === 0) {
        return [[], error_injected];
    }
    let print = [];
    for (let i = 0; i < sequenceList.length; i++) {
        if (typeof sequenceList[i] === 'string') {
            print.push(sequenceList[i]);
        } else if (typeof sequenceList[i] === 'object') {
            let beforeWait, afterWait, child, temp_injected, temp;
            [beforeWait, temp_injected] = getPrintSequenceIncorrect(sequenceList[i].beforeWait);
            error_injected ||= temp_injected;
            [afterWait, temp_injected] = getPrintSequenceIncorrect(sequenceList[i].afterWait);
            error_injected ||= temp_injected;
            [child, temp_injected] = getPrintSequenceIncorrect(sequenceList[i].child);
            error_injected ||= temp_injected;
            
            if ((!error_injected || Math.random() < 0.25) && afterWait.length > 0 && child.length > 0 && Math.random() < 0.5) {
                // inject error
                error_injected = true;
                let beforePreweave = [...beforeWait, afterWait[0]]
                temp = [...randomWeave(beforePreweave, child.slice(0, -1)),
                            child[child.length - 1],
                            ...afterWait.slice(1)
                ]
            } else {
                // no error
                temp = [
                    ...randomWeave(beforeWait, child),
                    ...afterWait
                ];
            }

            print.push(...temp);
        }
    }
    return [print, error_injected];
}

// returns a dictionary
// key is a char, item is a list of chars that needs to come before key
// dict[after_char] = [before_char1, before_char2]
// Not used for now, thought would be used for topological sort
export function getPrintDirection(sequenceList) {
    if (!Array.isArray(sequenceList) || sequenceList.length === 0) {
        return {};
    }
    let printDirection = [];
    for (let i = 0; i < sequenceList.length; i++) {
        if (typeof sequenceList[i] === 'string') {
            temp = {};
            temp[sequenceList[i]] = [];
            printDirection.push(temp);
        } else if (typeof sequenceList[i] === 'object') {
            let beforeWait = getPrintDirection(sequenceList[i].beforeWait);
            let afterWait = getPrintDirection(sequenceList[i].afterWait);
            let child = getPrintDirection(sequenceList[i].child);
            
            let temp = mergeDicts(beforeWait, afterWait, child);
            for (const keyB in beforeWait) {
                for (const keyA in afterWait) {
                    if (temp.hasOwnProperty(keyA)) {
                        temp[keyA].push(keyB);
                    } else {
                        temp[keyA] = [keyB];
                    }
                }
            }

            for (const keyB in child) {
                for (const keyA in afterWait) {
                    if (temp.hasOwnProperty(keyA)) {
                        temp[keyA].push(keyB);
                    } else {
                        temp[keyA] = [keyB];
                    }
                }
            }

            printDirection.push(...temp);
        }
        if (i > 0) {
            for (const keyB in printDirection[i-1]) {
                for (const keyA in printDirection[i]) {
                    if (printDirection[i].hasOwnProperty(keyA)) {
                        printDirection[i][keyA].push(keyB);
                    } else {
                        printDirection[i][keyA] = [keyB];
                    }
                }

            }
        }
    }
    return mergeDicts(...printDirection);
}

function output(node) {
    if (!node) return "";
    return node.value + output(node.left) + output(node.right);
}

export function getAnswer(node, numPrints) {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    let map = {}
    for (let i = 0; (i < numPrints) && (i < 26); i++) {
        map[alphabet[i]] = 0;
    }
    
    
    let answer = output(node);
    for (let i = 0; i < answer.length; i++) {
        if (answer[i] in map) { map[answer[i]] += 1; }
        else { map[answer[i]] = 1; }
    }
    return map;
}

// Generate the options for our question
// Return at least 1 correct and at least 1 incorrect
// returned options <= 4
// If there are two few options returned (1/2), the case would be handled
// in fork-timeline genQuestionInfo function
export function getAnswerSequence(source) {
    let constraints = printSequenceConstraints(source);
    let map = {};
    let incorrect_cnt = 0;
    for (let i = 0; i < 20; i++) {
        let [sequence, bool_incorrect] = getPrintSequenceIncorrect(constraints);
        let sequenceStr = sequence.join("");
        if (!(sequenceStr in map)) {
            if (bool_incorrect) {
                incorrect_cnt++;
            } else if (Object.keys(map).length === 3 && incorrect_cnt === 0) {
                continue;
            }
            map[sequenceStr] = bool_incorrect;
        }
        if (Object.keys(map).length >= 4) {
            break;
        } else if (Object.keys(map).length >= 3 && (incorrect_cnt === Object.keys(map).length)) {
            let sequence = getPrintSequence(constraints);
            let sequenceStr = sequence.join("");
            if (!(sequenceStr in map)) {
                map[sequenceStr] = false;
            }
            break;
        }
    }
    return [map, Object.keys(map)];
}

const formatNode = (node) => `${node.id}.${node.childCt}`+ ":"+(node.value?node.value:nullChar);

export function printTreeVert(node, isRoot = true) {
    const nullChar = "\\";
    // if (!node) return [nullChar]; // show forked processes that does nothing
    if (!node) return [];
    
    const rightSubtree = printTreeVert(node.right, false);
    const leftSubtree = printTreeVert(node.left, false);

    const hasRight = rightSubtree.length > 0;
    const hasLeft = leftSubtree.length > 0;
    
    const selfValue = formatNode(node);
    
    // spacing for subtrees
    // width of right tree is the longest right line
    const rightWidth = rightSubtree.length > 0 ? Math.max(...rightSubtree.map(item => item.length)) : 0;
    const indentLeft = (hasRight ? "|" : " ") + " ".repeat(Math.max(selfValue.length, rightWidth));
    
    const result = [];
    
    result.push(`${selfValue}${hasLeft ? DASH.repeat(Math.max(selfValue.length, rightWidth)-selfValue.length+1) + leftSubtree[0] : ""}`);
    leftSubtree.slice(1).forEach(line => result.push(`${indentLeft}${line}`));
    rightSubtree.forEach(line => result.push(line+SPC1.repeat(rightWidth-line.length)));

    return isRoot ? result.join("\n") : result;
}

function getTreeArr(root, parentVal = "", result = new Set(), valuesMap = new Map()) {
    if (!root) return { treeSet: result, valuesMap };

    // Add the parent-child entry to the set if IDs are different
    const entry = `${root.id}${parentVal ? ("," + parentVal) : ""}`;
    if (root.id.toString() !== parentVal) {
        result.add(entry);
    }

    // Aggregate values by ID in a Map
    if (valuesMap.has(root.id)) {
        valuesMap.get(root.id).push(root.value);
    } else {
        valuesMap.set(root.id, [root.value]);
    }

    // Recursive calls to traverse left and right children
    getTreeArr(root.left, `${root.id}`, result, valuesMap);
    getTreeArr(root.right, `${root.id}`, result, valuesMap);

    return { treeSet: result, valuesMap };
}

export function getTreeCSV(root) {
    const { treeSet, valuesMap } = getTreeArr(root);
    const csvString = "child,parent\n" + Array.from(treeSet).join("\n");
    const valuesArray = Array.from(valuesMap, ([id, values]) => `${id}: [${values.join(",")}]`);
    return { csv: csvString, valuesList: valuesArray };
}

function randInsert(mainStr, insertStr, anySlot = false, minSlot = 0, maxOffset = 0) {
    let validPositions = [];

    for (let i = minSlot; i < (mainStr.length+1-maxOffset); i++) {
        if (mainStr[i] !== '(') {
            if (anySlot || (mainStr[i] !== '-' && mainStr[i-1] !== '-' && mainStr[i-1] !== EXIT_CHAR)) {
                validPositions.push(i);
            }
        }
    }
    // validPositions.push(mainStr.length);
    const insertPosition = validPositions[Math.floor(randomFloat32() * validPositions.length)]; // Pick a valid position
    return mainStr.slice(0, insertPosition) + insertStr + mainStr.slice(insertPosition);
}

// A variation of randInsert
// We do not want to fork before wait because for the sake of fork timeline,
// there would be abiguity between which one of the two concurrent children exits.
function randInsertFork_notBeforeWait(mainStr, insertStr, anySlot = false, minSlot = 0, maxOffset = 0) {
    let validPositions = [];
    let pastParanthesisLevel = 0, pastWaitLevel = 0, waited = false;

    for (let i = minSlot; i < (mainStr.length+1-maxOffset); i++) {
        // console.log("i", i, "pastParanthesisLevel", pastParanthesisLevel, "pastWaitLevel", pastWaitLevel, "waited", waited);
        if (mainStr[i] == WAIT_CHAR) {
            waited = true;
        } else if (mainStr[i] !== '(' && pastParanthesisLevel === pastWaitLevel) {
            // do not insert before left paranthesis or wait
            if (anySlot || (mainStr[i-1] !== EXIT_CHAR)) {
                validPositions.push(i);
            }
        }
        switch (mainStr[i]) {
            case '(': pastParanthesisLevel += 1; break;
            case WAIT_CHAR: pastWaitLevel += 1; break;
            case ',': pastWaitLevel += (waited ? 0 : 1); waited = false; break;
            case ')': pastParanthesisLevel -= 1; pastWaitLevel -= 1; break;
        }
    }
    // console.log("valid positions", validPositions, "mainStr len", mainStr.length);
    const insertPosition = validPositions[Math.floor(randomFloat32() * validPositions.length)]; // Pick a valid position
    return mainStr.slice(0, insertPosition) + insertStr + mainStr.slice(insertPosition);
}

// Adjust the number of prints
function adjustPrints(str, targetCount) {
    let currentCount = (str.match(/-/g) || []).length;
    let result = str;
  
    if (currentCount > targetCount) {
      // Remove excess hyphens one by one at random positions
      const removals = currentCount - targetCount;
      for (let i = 0; i < removals; i++) {
        // Collect indices of all hyphens
        const positions = [];
        for (let j = 0; j < result.length; j++) {
          if (result[j] === '-') positions.push(j);
        }
        // Pick a random index from positions
        const randIdx = Math.floor(Math.random() * positions.length);
        const removePos = positions[randIdx];
        // Remove the hyphen at removePos
        result = result.slice(0, removePos) + result.slice(removePos + 1);
      }
    } else if (currentCount < targetCount) {
      // Add hyphens via callback until reaching the target
      const additions = targetCount - currentCount;
      for (let i = 0; i < additions; i++) {
        result = randInsert(result, PRINT_CHAR, true, 0, 1);
      }
    }
  
    return result;
  }

function exitInsert(mainStr) {
    let validPositions = [];
    // console.log(mainStr);
    // console.log(mainStr.slice(Math.floor(mainStr.length /4), mainStr.length-Math.floor(mainStr.length /5)));
    for (let i = 2; i < (mainStr.length-3); i++) {
        if (mainStr[i] == ')') {
            validPositions.push(i);
        }
    }
    // validPositions.push(mainStr.length);
    // if (validPositions.length == 0) {
    //     console.log("COOOKED")
    // }
    const insertPosition = validPositions[Math.floor(randomFloat32() * validPositions.length)]; // Pick a valid position
    return mainStr.slice(0, insertPosition) + PRINT_CHAR + EXIT_CHAR + mainStr.slice(insertPosition);
}

export function genRandSourceCode(numForks, numPrints, hasNest, hasExit, hasElse) {
    let code = "";
    const fork = hasElse?"F(,)":"F()";

    if (!hasNest) {
        if (hasElse) {
            code = fork.repeat(numForks); // we have enough diversity already
        } else { // forced diversity, this cause us to weigh it more to have forks
            for (let i = 0; i < numForks; i++) {
                if (randomFloat32() < 0.5 && numPrints > 0) {
                    numPrints--;
                    code +=`F(${PRINT_CHAR})`;
                }
                else {
                    code += fork;
                }
            }
        }
    }
    else {
        // Generate forking locations
        for (let i = 0; i < numForks; i++) {
            code = randInsert(code, fork, true);
        }
    }

    if (hasExit) {
        code = exitInsert(code);
    }

    for (let i = 0; i < numPrints-1 - (hasExit?1:0); i++) {
        code = randInsert(code, PRINT_CHAR, false, 0, 1);
    }
    
    if (numPrints > 0) {
        code += PRINT_CHAR;
    }

    let i = 0;
    const replaceChar = () => {
        const char = String.fromCharCode('a'.charCodeAt(0) + i % 26);
        i++;
        return char;
    };
    let t = code.replace(new RegExp(PRINT_CHAR, 'g'), replaceChar); 
    return t;
}

// Generate a sumple wait code
// Output have exact number of forks and prints
// It is assumed that every fork has a wait: numForks = numWaits
// Example output: F(aWbF(c,d)e,f)
export function genSimpleWaitCode(numForks, numPrints) {
    let code = ""; // so that main parent does not exit
    const fork = `${PRINT_CHAR}F(${PRINT_CHAR}${WAIT_CHAR}${PRINT_CHAR},${PRINT_CHAR}${EXIT_CHAR})${PRINT_CHAR}`
    
    // Nested Fork
    for (let i = 0; i < numForks; i++) {
        code = randInsertFork_notBeforeWait(code, fork, false, 2, 0);
        code = code.replace(/-+/g, '-');
    }

    code = adjustPrints(code, numPrints);

    let i = 0;
    const replaceChar = () => {
        const char = String.fromCharCode('a'.charCodeAt(0) + i % 26);
        i++;
        return char;
    };

    code = code.replace(new RegExp("-", 'g'), replaceChar);

    return code;
}

export function buildAndTranspile(code) {
    let tree = new ForkNode();
    let result = tree.pushCode(code);
    let labeledCodeC = labelLines(result.cCode);
    return [tree, labeledCodeC];
}

function labelLines(code) {
    let annotated = [];
    for (let i = 0; i < code.length; i++) {
        if (code[i].indexOf("}")===-1) {
            let prefix = `<span data-block="${i}">`;
            let suffix = `</span>`;
            annotated.push(`${prefix}${code[i]}${suffix}`);
        } else {
            annotated.push(`${code[i]}`);
        }
    }
    let joinedAnnotated = annotated.join(NEWLINE);
    return joinedAnnotated;
}

export function traceTree(code, terminate) {
    let tree = new ForkNode();
    tree.pushCode(code, 0, terminate);
    return tree;
}