
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

function randomFloat32() {
    return window.crypto.getRandomValues(new Uint32Array(1))[0]/(2**32);
    // return Math.random();
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
            [left, temp1] = (new ForkNode()).fork(leftCode, rightCode, indent, terminate);
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
                this.left = new ForkNode(leftID, leftCt);
                left = this.left.pushCode(leftCode, indent, leftTerm);

                let rightTerm = leftTerm;
                if (left.cCode.length>0) {
                    rightTerm = leftTerm - 1 - left.cCode.length;
                }
                // ordering matters here! , left.right can only be created after left push is done
                this.left.right = new ForkNode(rightID, rightCt);
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
                this.wait(exitingProc);
                // this.exit();
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
    code += PRINT_CHAR;

    let i = 0;
    const replaceChar = () => {
        const char = String.fromCharCode('a'.charCodeAt(0) + i % 26);
        i++;
        return char;
    };
    let t = code.replace(new RegExp(PRINT_CHAR, 'g'), replaceChar); 
    return t;
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