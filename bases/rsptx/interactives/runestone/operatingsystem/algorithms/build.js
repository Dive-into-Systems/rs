
const INDENT_SPC = 2;
const DASH = "─";
// const BAR = "|";
const SPC = "&#8195;";
const SPC1 = " ";
const NEWLINE = "<br>";
const EXIT_CHAR = "x";
const nullChar = "\\";

function randomFloat32() {
    // return window.crypto.getRandomValues(new Uint32Array(1))[0]/(2**32);
    return Math.random();
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

class ForkNode {
    constructor(id = 0, childCt = 0, active = true, value = "", left = null, right = null) {
        this.id = id;
        this.childCt = childCt;
        this.active = active;
        this.value = value;
        this.left = left;
        this.right = right;
    }

    
    getChildrenInfo() {
        // left id, left ct, right id, right ct
        return [this.id, this.childCt+1, this.id*10+this.childCt+1, 0];
    }


    print(text) {
        if (!this.active) return;
        if (this.right) this.right.print(text); // you have a child, it also print
        if (this.left) { // "future" self, print
            this.left.print(text);
        } else {
            this.value+= text;
        }
    }

    exit() {
        if (!this.active) return;
        
        if (this.right) this.right.exit(); // you have a child, it also exit
        if (this.left) { // "future" self, exit
            this.left.exit();
        }
        else {
            // this.print("X");
            this.active = false;
        }
    }


    fork(leftCode, rightCode, indent) {
        if (!this.active) {
            // let temp = 
            return (new ForkNode()).fork(leftCode,rightCode, indent);
        }
        // you have a child, it also forks
        if (this.right) {
            this.right.fork(leftCode, rightCode, indent);
        }
        let leftResult, rightResult;
        if (this.left) { // if "future" self exist, that one executes instead
            [leftResult, rightResult] = this.left.fork(leftCode, rightCode, indent);
        } else {
            let [leftID, leftCt, rightID, rightCt] = this.getChildrenInfo();
            this.left = new ForkNode(leftID, leftCt);
            leftResult = this.left.pushCode(leftCode, indent);
            this.left.right = new ForkNode(rightID, rightCt);
            rightResult = this.left.right.pushCode(rightCode, indent);
        }
        return [leftResult, rightResult];
    }
    
    pushCode(code, indent = 0) {
        let result = [];
        let ptr = 0;
        let leftCode, rightCode;
        let leftProc, rightProc;
        let leftResult, rightResult;
        let [leftID, leftCt, rightID, rightCt] = [0,0,0,0];
        
        function addLine(line, extraProc = []) {
            // result.push(`${SPC.repeat(indent)}${line} // ${liveProcesses.join(' + ')} , ${extraProc.join(' + ')}`);
            result.push(`${SPC.repeat(indent)}${line}`);
        }

        for (let ptr = 0; ptr < code.length; ptr++) {
            if (code[ptr]!= "F" && code[ptr]!= EXIT_CHAR) {
                addLine(`printf("${code[ptr]}");`);
                this.print(code[ptr])
                continue;
            }
            if (code[ptr] == EXIT_CHAR) {
                addLine(`exit();`);
                this.exit();
                // break
            }
            if (code[ptr] == "F") {
                [leftCode, rightCode, ptr] = parseForkArgs(code, ptr);
                [leftResult, rightResult] = this.fork(leftCode, rightCode, indent + INDENT_SPC);
                if (!leftCode && !rightCode) addLine("fork();");
                if (leftCode) {
                    addLine("if (fork()) {");
                    result = result.concat(leftResult);
                    addLine(rightCode ? "} else {" : "}");
                }
                if (rightCode) {
                    if (!leftCode) addLine("if (fork() == 0) {");
                    result = result.concat(rightResult);
                    addLine("}");
                }
            }
            
        }
        return result;
    }
    
    serialize() {
        const obj = {
            id: this.id,
            childCt: this.childCt,
            value: this.value,
            children: []
        };
        if (this.left) obj.children.push(this.left.serialize());
        if (this.right) obj.children.push(this.right.serialize());
        if (obj.children.length === 0) delete obj.children;
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

// function nodeCount(root) {
//     if (!root) return 1;
//     return 1+nodeCount(root.left)+nodeCount(root.right);
// }

function randInsert(mainStr, insertStr, anySlot = false, minSlot = 0) {
    let validPositions = [];

    for (let i = minSlot; i < mainStr.length-1; i++) {
        if (mainStr[i] !== '(') {
            if (anySlot || (mainStr[i] !== '-' && mainStr[i-1] !== '-')) {
                validPositions.push(i);
            }
        }
    }
    const insertPosition = validPositions[Math.floor(randomFloat32() * validPositions.length)]; // Pick a valid position
    return mainStr.slice(0, insertPosition) + insertStr + mainStr.slice(insertPosition);
}

export function genRandSourceCode(numForks, numPrints, hasNest, hasExit, hasElse, hasLoop) {
    
    let code = "";
    const fork = hasElse?"F(,)":"F()";

    if (!hasNest) {
        code = fork.repeat(numForks);
    }
    else {
        // Generate forking locations
        for (let i = 0; i < numForks; i++) {
            code = randInsert(code, fork, true);
        }
    }

    if (hasExit) {
        code = randInsert(code, EXIT_CHAR, false, code.length / 4);
    }
    for (let i = 0; i < numPrints; i++) {
        code = randInsert(code, "-", false);
    }

    let i = 0;
    const replaceChar = () => {
        const char = String.fromCharCode('a'.charCodeAt(0) + i % 26);
        i++;
        return char;
    };
    let t = code.replace(/-/g, replaceChar); 
    console.log(t);
    return t;
}

export function buildAndTranspile(code) {
    let tree = new ForkNode();
    let codeC = tree.pushCode(code).join(NEWLINE);
    return [tree, codeC]
}
