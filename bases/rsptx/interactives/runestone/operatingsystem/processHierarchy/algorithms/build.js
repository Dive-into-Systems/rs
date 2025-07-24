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
let prev_code_child = false;
let prev_code_afterwait = false;
let prev_code_parallel = false;
let current_code_child = false;
let current_code_afterwait = false;
let current_code_parallel = false;

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

// Selects an index from an array of odds (weights) using weighted random selection
function weightedPickId(odds) {
    const total = odds.reduce((sum, a) => sum + a, 0);
    let seed = randomFloat32() * total;
    return odds.findIndex((odds, i) => (seed -= odds) < 0);
}

function shuffle(array) {
    var tmp, current, top = array.length;

    if(top) while(--top) {
        current = Math.floor(Math.random() * (top + 1));
        tmp = array[current];
        array[current] = array[top];
        array[top] = tmp;
    }

    return array;
}

// Finds unique elements in an array and count them
// returns a map of element to count
function findCountElement(arr) {
    const map = new Map();
    for (const element of arr) {
        if (map.has(element)) {
            map.set(element, map.get(element) + 1);
        } else {
            map.set(element, 1);
        }
    }
    return map;
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
    
    // Add protection against infinite loops
    const maxIterations = code.length + 100; // Safety margin
    let iterationCount = 0;
    
    while (end < code.length && iterationCount < maxIterations) {
        if (code[end] === '(') balance++;
        if (code[end] === ')') balance--;
        if (balance === 0) break; // found closing bracket
        if (balance === 1 && code[end] === ',') topLevelComma ??= end; // only assigns top comma once
        end++;
        iterationCount++;
    }
    
    // Log warning if we hit the safety limit
    if (iterationCount >= maxIterations) {
        console.warn("Potential infinite loop detected in parseForkArgs - breaking after", maxIterations, "iterations");
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
            end++;
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

class ForkNode {
    constructor(id = 0, childCt = 0, active = true, value = "", left = null, right = null) {
        this.id = id;
        this.childCt = childCt;
        this.active = active;
        this.value = value;
        this.left = left;
        this.right = right;
        this.waited = false;
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
            [left, temp1] = (new ForkNode(0, 0, true, "", null, null)).fork(leftCode, rightCode, indent, terminate);
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
                this.left = new ForkNode(leftID, leftCt, true, "", null, null);
                left = this.left.pushCode(leftCode, indent, leftTerm);

                let rightTerm = leftTerm;
                if (left.cCode.length>0) {
                    rightTerm = leftTerm - 1 - left.cCode.length;
                }
                // ordering matters here! , left.right can only be created after left push is done
                this.left.right = new ForkNode(rightID, rightCt, true, "", null, null);
                temp1 = this.left.right.pushCode(rightCode, indent, rightTerm);
                exitingProc = this.left.right;
                // Add protection against infinite loops
                let maxIterations = 1000; // Safety limit to prevent infinite loops
                let iterationCount = 0;
                while (exitingProc.left && iterationCount < maxIterations) {
                    exitingProc = exitingProc.left;
                    iterationCount++;
                }
                // Log warning if we hit the safety limit
                if (iterationCount >= maxIterations) {
                    console.warn("Potential infinite loop detected in exitingProc chain - breaking after", maxIterations, "iterations");
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

export class PrintItem {
    constructor(printChar, executionIndex, dependencies = [], printed = false) {
        this.printChar = printChar;
        this.executionIndex = executionIndex;
        this.dependencies = dependencies;
        this.dependencyCount = dependencies.length;
        this.printed = printed;
    }

    addDependency(input) {
        if (Array.isArray(input)) {
            for (let item of input) {
                if (!this.dependencies.includes(item)) {
                    this.dependencies.push(item);
                }
            }
        } else {
            if (!this.dependencies.includes(input)) {
                this.dependencies.push(input);
            }
        }
        this.dependencyCount = this.dependencies.length;
    }
}

export class ForkItem {
    constructor(forkExecutionIndex) {
        this.forkExecutionIndex = forkExecutionIndex;
        this.waitExecutionIndex = null;
        this.exitExecutionIndex = null;
        this.parentWaited = false;
        this.childExited = false;
        this.beforeWait = [];
        this.afterWait = [];
        this.child = [];
    }
}

// Processes the code recursively and builds a structure of print constraints.
// The process print structure may be nested (like how forks are nested)
// example {beforeWait: ab, afterWait: c{beforeWait:, afterWait:d, child: e}, child: f}
export function printSequenceConstraints(code, continuation = '', executionIndex = {index : 0}, depth = 0, isChild = false) {
    // Add protection against infinite recursion
    const MAX_RECURSION_DEPTH = 100;
    if (depth > MAX_RECURSION_DEPTH) {
        console.warn("Maximum recursion depth reached in printSequenceConstraints - preventing infinite recursion");
        return [];
    }

    let sequenceList = [];
    let ptr = 0;
    while (ptr < code.length) {
        const char = code[ptr];
        if (char === "F") {
            // Assume these helper functions return the expected values.
            let forkItem = new ForkItem(executionIndex.index++);
            let [leftCode, rightCode, newPtr] = parseForkArgs(code, ptr);
            ptr = newPtr + 1;
            let hasElse = rightCode.length > 0;
            continuation = code.substring(ptr) + continuation;
            let [leftWaitCode, rightWaitCode] = parseForkWait(leftCode + continuation);
            const childCode = parseForkExit(rightCode + continuation);
            forkItem.parentWaited = rightWaitCode.length > 0;
            forkItem.childExited = childCode[childCode.length - 1] === EXIT_CHAR;

            forkItem.beforeWait = printSequenceConstraints(leftWaitCode, '', executionIndex, depth + 1, isChild);
            forkItem.waitExecutionIndex = executionIndex.index++;
            forkItem.afterWait = printSequenceConstraints(rightWaitCode, '', executionIndex, depth + 1, isChild);

            if (hasElse) {
                executionIndex.index++; // for the } else {
            }
            
            forkItem.child = printSequenceConstraints(childCode, '', executionIndex, depth + 1, true);
            if (forkItem.childExited) {
                forkItem.exitExecutionIndex = executionIndex.index++;
                executionIndex.index += (rightCode.length - 1 - childCode.length);
            }
            if (leftCode || rightCode) {
                executionIndex.index++; // for the closing }
            }

            sequenceList.push(forkItem);
            break;
        } else {
            if (char === WAIT_CHAR) {
                executionIndex.index++;
            } else if (char === EXIT_CHAR) {
                executionIndex.index++;
            } else if (char !== ' ') { // Assuming other chars are prints
                let printItem = new PrintItem(code[ptr], executionIndex.index++, [], false);
                sequenceList.push(printItem);
            }
        }
        ptr++;
    }
    return sequenceList;
}

// This function always generate ONE correct print sequence
// This function does not give exhausive results
// One correct print sequence is returned as an array
export function getPrintSequence(sequenceList, depth = 0) {
    // Add protection against infinite recursion
    const MAX_RECURSION_DEPTH = 100;
    if (depth > MAX_RECURSION_DEPTH) {
        console.warn("Maximum recursion depth reached in getPrintSequence - preventing infinite recursion");
        return [];
    }
    
    if (!Array.isArray(sequenceList) || sequenceList.length === 0) {
        return [];
    }
    let correctPrint = [];
    for (let i = 0; i < sequenceList.length; i++) {
        if (sequenceList[i] instanceof PrintItem) {
            correctPrint.push(sequenceList[i].printChar);
        } else if (sequenceList[i] instanceof ForkItem) {
            let beforeWait = getPrintSequence(sequenceList[i].beforeWait, depth + 1);
            let afterWait = sequenceList[i].childExited ? getPrintSequence(sequenceList[i].afterWait, depth + 1) : [];
            let child = getPrintSequence(sequenceList[i].child, depth + 1);
            
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
export function getPrintSequenceIncorrect(sequenceList, depth = 0) {
    // Add protection against infinite recursion
    const MAX_RECURSION_DEPTH = 100;
    let child_exited = false;
    let forked = false;
    if (depth > MAX_RECURSION_DEPTH) {
        console.warn("Maximum recursion depth reached in getPrintSequenceIncorrect - preventing infinite recursion");
        return [[], false];
    }
    
    let error_injected = false;
    if (!Array.isArray(sequenceList) || sequenceList.length === 0) {
        return [[], error_injected];
    }
    let print = [];
    for (let i = 0; i < sequenceList.length; i++) {
        if (sequenceList[i] instanceof PrintItem) {
            print.push(sequenceList[i].printChar);
        } else if (sequenceList[i] instanceof ForkItem) {
            forked = true;
            let beforeWait, afterWait, child, temp_injected, temp;
            [beforeWait, temp_injected] = getPrintSequenceIncorrect(sequenceList[i].beforeWait, depth + 1);
            error_injected ||= temp_injected;
            if (sequenceList[i].childExited) {
                [afterWait, temp_injected] = getPrintSequenceIncorrect(sequenceList[i].afterWait, depth + 1);
                error_injected ||= temp_injected;
            } else if (Math.random() < 0.3) {
                [afterWait, temp_injected] = getPrintSequenceIncorrect(sequenceList[i].afterWait, depth + 1);
                error_injected = true;
            } else {
                afterWait = [];
            }
            [child, temp_injected] = getPrintSequenceIncorrect(sequenceList[i].child, depth + 1);
            error_injected ||= temp_injected;
            child_exited ||= sequenceList[i].childExited;       
            
            // following code injects error by making one of afterwait prints placed before child prints
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
    let sequence_verified;
    if (depth === 0) {
        if (forked && !child_exited) {
            if (Math.random() < 0.3) {
                error_injected = true;
                const last_char = print[print.length - 1];
                const char_cnt = print.filter(item => item === last_char).length;
                if (char_cnt >= 4) {
                    print.pop();
                } else if (char_cnt <= 2) {
                    print.push(last_char);
                } else {
                    if (Math.random() < 0.5) {
                        print.push(last_char);
                    } else {
                        print.pop();
                    }
                }
            }
        }    
        sequence_verified = verifyPrintSequence(print, sequenceList);
        error_injected = !sequence_verified;
    }
    return [print, error_injected];
}

export function getPrintDependencies(sequenceList) {
    let printItems = [];
    let previousPrints = [];
    for (let i = 0; i < sequenceList.length; i++) {
        if (sequenceList[i] instanceof PrintItem) {
            for (let print of previousPrints) {
                sequenceList[i].addDependency(print);
            }
            previousPrints.length = 0;
            previousPrints.push(sequenceList[i]);
            printItems.push(sequenceList[i]);
        } else if (sequenceList[i] instanceof ForkItem) {
            let beforeWaitPrints = getPrintDependencies(sequenceList[i].beforeWait);
            for (let print of beforeWaitPrints) {
                for (let prevPrint of previousPrints) {
                    print.addDependency(prevPrint);
                }
            }
            let childPrints = getPrintDependencies(sequenceList[i].child);
            for (let print of childPrints) {
                for (let prevPrint of previousPrints) {
                    print.addDependency(prevPrint);
                }
            }
            let afterWaitPrints = [];
            if (sequenceList[i].parentWaited && sequenceList[i].childExited) {
                afterWaitPrints = getPrintDependencies(sequenceList[i].afterWait);
                for (let print of afterWaitPrints) {
                    for (let beforeWaitPrint of beforeWaitPrints) {
                        print.addDependency(beforeWaitPrint);
                    }
                    for (let childPrint of childPrints) {
                        print.addDependency(childPrint);
                    }
                }
            }
            previousPrints.length = 0;
            if (sequenceList[i].parentWaited && sequenceList[i].childExited) {
                previousPrints.push(...afterWaitPrints);
                printItems.push(...beforeWaitPrints, ...childPrints, ...afterWaitPrints);
            } else {
                previousPrints.push(...beforeWaitPrints, ...childPrints);
                printItems.push(...beforeWaitPrints, ...childPrints);
            }
        }
    }
    return printItems;
}

function deepCopyPrintItems(printItems) {
    // First pass: create new objects
    const newItems = printItems.map(item => {
        if (item instanceof PrintItem) {
            return new PrintItem(item.printChar, item.executionIndex, [], item.printed);
        }
    });
    
    // Second pass: map dependencies to new objects
    for (let i = 0; i < printItems.length; i++) {
        if (printItems[i] instanceof PrintItem) {
            for (let dep of printItems[i].dependencies) {
                // Find the corresponding new object for this dependency
                const depIndex = printItems.findIndex(item => item === dep);
                if (depIndex !== -1) {
                    newItems[i].addDependency(newItems[depIndex]);
                }
            }
        }
    }
    
    return newItems;
}

function findPrintItemIdxFromFrontier(printItems, char) {
    for (let i = 0; i < printItems.length; i++) {
        if (printItems[i].printChar === char && !printItems[i].printed && printItems[i].dependencyCount === 0) {
            return i;
        }
    }
    return -1;
}

export function verifyPrintSequence(printSequence, sequenceList) {
    let printItems = getPrintDependencies(sequenceList);
    printItems = deepCopyPrintItems(printItems);

    // use topological sort with backtracking to verify the print sequence    
    for (let char of printSequence) {
        let candidateIdx = findPrintItemIdxFromFrontier(printItems, char);
        if (candidateIdx === -1) {
            return false;
        }
        let candidateItem = printItems[candidateIdx];
        candidateItem.printed = true;
        for (let item of printItems) {
            if (item.dependencyCount > 0) {
                if (item.dependencies.includes(candidateItem)) {
                    item.dependencyCount--;
                }
            }
        }
    }
    // check everything is printed
    for (let item of printItems) {
        if (!item.printed) {
            return false;
        }
    }
    return true;
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
    return [map, shuffle(Object.keys(map))];
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
function randInsertFork_notBeforeWait(
    mainStr,
    insertStr,
    anySlot = false,
    minSlot = 0,
    maxOffset = 0
) {
    const validPositions = [];
    const position_type = [];
    let pastParanthesisLevel = 0;
    let pastWaitLevel = 0;
    let pastChildLevel = 0;
    let waitedStack = [false];

    const upperBound = mainStr.length + 1 - maxOffset;   // "+" lets us insert at the very end
    for (let i = 0; i < upperBound; i++) {

        /* ---------- 1. record a valid slot (only after minSlot) ---------- */
        if (i >= minSlot) {
            if (
                mainStr[i] !== WAIT_CHAR &&           // never put it *on* the W
                mainStr[i] !== '(' &&                 // never before an opening "("
                pastParanthesisLevel === pastWaitLevel &&
                (anySlot || mainStr[i - 1] !== EXIT_CHAR)
            ) {
                validPositions.push(i);
                if (pastChildLevel === pastParanthesisLevel) {
                    if (pastParanthesisLevel === 0) {
                        position_type.push("parallel");
                    } else {
                        position_type.push(`child${pastParanthesisLevel}`);
                    }
                } else {
                    position_type.push("afterwait");
                }
            }
        }

        /* ---------- 2. update bookkeeping counters ---------- */
        switch (mainStr[i]) {
            case '(':
                pastParanthesisLevel++;
                waitedStack.push(false);
                break;
            case WAIT_CHAR:
                pastWaitLevel++;
                waitedStack[pastParanthesisLevel] = true;
                break;
            case ',':
                const waitedCurrent = waitedStack[pastParanthesisLevel];
                pastWaitLevel += waitedCurrent ? 0 : 1;
                pastChildLevel++;
                waitedStack[pastParanthesisLevel] = false;
                break;
            case ')':
                pastParanthesisLevel--;
                pastWaitLevel--;
                pastChildLevel--;
                waitedStack.pop();
                break;
        }
    }
    // TODO
    const countMap = findCountElement(position_type);
    const oddsMap = {};
    for (const [key, value] of countMap.entries()) {
        if (key.startsWith("child")) {
            oddsMap[key] = 10/value/(prev_code_child?2:1);
        } else if (key.startsWith("afterwait")) {
            oddsMap[key] = 8/value/(prev_code_afterwait?2:1)/(current_code_afterwait?2:1);
        } else if (key.startsWith("parallel")) {
            oddsMap[key] = 2/value/(prev_code_parallel?2:1)/(current_code_parallel?2:1);
        }
    }
    const position_odds = position_type.map(type => oddsMap[type]);


    /* ---------- 3. pick a slot (or fall back to end) ---------- */
    if (validPositions.length === 0) {
        return mainStr + insertStr;
    }
    const choiceIndex = weightedPickId(position_odds);
    const insertPos =
        validPositions[choiceIndex];
    if (position_type[choiceIndex].startsWith("child")) {
        current_code_child = true;
    } else if (position_type[choiceIndex] === "afterwait") {
        current_code_afterwait = true;
    } else if (position_type[choiceIndex] === "parallel") {
        current_code_parallel = true;
    }

    return mainStr.slice(0, insertPos) + insertStr + mainStr.slice(insertPos);
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
    for (let i = 2; i < (mainStr.length-3); i++) {
        if (mainStr[i] == ')') {
            validPositions.push(i);
        }
    }
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
    const fork = `F(${PRINT_CHAR}${WAIT_CHAR}${PRINT_CHAR},${PRINT_CHAR}${EXIT_CHAR})`;
    
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

    prev_code_child = current_code_child;
    prev_code_afterwait = current_code_afterwait;
    prev_code_parallel = current_code_parallel;

    current_code_child = false;
    current_code_afterwait = false;
    current_code_parallel = false;

    return code;
}

export function genSimpleWaitCodeMode1() {
    let code_candidates = [
        "F()F(-W-,-X)-",
        "F()F(-W-,-X)-",
        "F(-W-F()-,-X)-",
        "F(-W-,-X)F()-",
        "F()F(-W-,-X)-",
        "F()F(-W-,-X)-",
        "F(-W-F()-,-X)-",
        "F(-W-,-X)F()-",
        "F()F(-W-,-)-",
        "F()F(-W-,-)-",
        "F(-W-,-)F()-",
        "F()F(-,-)-",
        "F()F(-,-)-",
        "F(-,-)F()-",
        "F(-W,-F(-W,-)-X)-",
        "F(-W,-F(-W,-)-X)-",
    ]
    let code = unifPickItem(code_candidates);

    let i = 0;
    const replaceChar = () => {
        const char = String.fromCharCode('a'.charCodeAt(0) + i % 26);
        i++;
        return char;
    };

    code = code.replace(new RegExp("-", 'g'), replaceChar);

    prev_code_child = current_code_child;
    prev_code_afterwait = current_code_afterwait;
    prev_code_parallel = current_code_parallel;

    current_code_child = false;
    current_code_afterwait = false;
    current_code_parallel = false;

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