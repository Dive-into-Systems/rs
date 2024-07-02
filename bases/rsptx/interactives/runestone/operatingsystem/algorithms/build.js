export class ForkNode {
    constructor(id = 0, parent = 0, value = "", left = null, right = null) {
        this.id = id;
        this.parent = parent;
        this.value = value;
        this.left = left;
        this.right = right;
    }
}
const INDENT_SPC = 2;
const DASH = "─";
const BAR = "|";
const SPC = "&#8195;";
const NEWLINE = "<br>";
let nodeCounter = 1;

export function randomFloat32() {
    return window.crypto.getRandomValues(new Uint32Array(1))[0]/(2**32);
    // return Math.random();
}

export function parseForkArgs(code, forkIndex) {
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

    if (!topLevelComma) return [code.substring(start, end), '', end + 1];
    return [
        code.substring(start, topLevelComma),
        code.substring(topLevelComma + 1, end),
        end + 1 // next index
    ];
}

export function buildTree(code, id = 0, time = 0, childCt = 0) {
    code = code.trim();
    if (code.length === 0) {
        return new ForkNode(
            id,
            time,
            "",
            null, null
        );
    }

    const exitIndex = code.indexOf("x");
    let forkIndex = code.indexOf('f(');
    let hasFork = true;
    if (forkIndex === -1) {
        hasFork = false;
        forkIndex = code.length; // no fork, plain print node
    }

    if (exitIndex!==-1 && exitIndex < forkIndex) {
        forkIndex = exitIndex+1;
        code = code.substring(0, exitIndex+1); // capture exit char
    }
    // return new ForkNode(id, time, code);
    let [leftCode, rightCode, end] = parseForkArgs(code, forkIndex);
    leftCode += code.substring(end).trim(); // remaining code
    rightCode += code.substring(end).trim(); // remaining code
    // childCt += rightCode?1:0;
    childCt += (hasFork)?1:0;
    console.log(code, hasFork);
    const leftNode = hasFork?buildTree(leftCode, id, time+1, childCt):null;
    const rightNode = hasFork?buildTree(rightCode, (id*10)+childCt, 0):null;
    return new ForkNode(
        id,
        time,
        code.substring(0, forkIndex).trim() ?? "",
        leftNode,
        rightNode
    );
}

export function transpileToC(code, indent = 0) {
    let result = "";
    let ptr = 0;
    let leftCode, rightCode;
    let prefix = SPC.repeat(indent);
    const lineC = (text) => {return(SPC.repeat(indent) + text + NEWLINE)};
    while (ptr < code.length) {
        if (code[ptr] !== 'f' || (ptr + 1 < code.length && code[ptr + 1] !== '(')) {
            let start = ptr;
            while (ptr < code.length && (code[ptr] !== 'f' || (ptr + 1 < code.length && code[ptr + 1] !== '('))) {
                ptr++;
            }
            let text = code.substring(start, ptr).trim();
            for (let i = 0; i < text.length; i++) {
                result += lineC(`printf("${text[i]}");`);
            }
        }

        if (code[ptr] === 'f' && code[ptr + 1] === '(') {
            [leftCode, rightCode, ptr] = parseForkArgs(code, ptr);
            if (!leftCode && !rightCode) {
                result += lineC("fork();");
                continue;
            }
            if (leftCode) {
                result += lineC("if (fork()) {");
                result += transpileToC(leftCode, indent + INDENT_SPC);
                result += lineC((rightCode?"} else {":"}"));
            }
            if (rightCode) {
                result += leftCode?"":lineC("if (fork()==0) {");
                result += transpileToC(rightCode, indent + INDENT_SPC);
                result += lineC("}");
            }
        }
    }
    return result;
}

function output(node) {
    if (!node) return "";
    return node.value + output(node.left) + output(node.right);
}

export function getAnswer(node) {
    let answer = output(node);
    let map = {};
    for (let i = 0; i < answer.length; i++) {
        if (answer[i] in map) { map[answer[i]] += 1; }
        else { map[answer[i]] = 1; }
    }
    return map;
}

// function printTree (node, prefix = "", isRight = true) {
//     if (!node) return "";
//     let result = "";
//     const indentBlank = SPC.repeat(3);
//     const indentStick = BAR+SPC.repeat(2);
//     const indentDown = `└─ `;
//     const indentUp = `┌─ `;
//     result += printTree(node.left, prefix + (isRight ? indentStick : indentBlank), false);
//     result += prefix + (isRight ? indentDown : indentUp) + (node.id) + "." + (node.timestep) + ":"+ node.value + "\n";
//     result += printTree(node.right, prefix + (isRight ? indentBlank : indentStick), true);
//     return result;
// }

function printTreeVert(node, isRoot = true) {
    const nullChar = "\\";
    // if (!node) return [nullChar]; // show forked processes that does nothing
    if (!node) return [];
    
    const leftSubtree = printTreeVert(node.left, false);
    const rightSubtree = printTreeVert(node.right, false);

    const hasLeft = leftSubtree.length > 0;
    const hasRight = rightSubtree.length > 0;
    
    const selfValue = (`${node.id}.${node.timestep}`)+ ":"+(node.value?node.value:nullChar);
    
    // spacing for subtrees
    const leftWidth = leftSubtree.length > 0 ? Math.max(...leftSubtree.map(item => item.length)) : 0;
;
    const indentRight = (hasLeft ? "|" : " ") + " ".repeat(Math.max(selfValue.length, leftWidth));
    
    const result = [];
    result.push(`${selfValue}${hasRight ? DASH.repeat(Math.max(selfValue.length, leftWidth)-selfValue.length+1) + rightSubtree[0] : ""}`);
    rightSubtree.slice(1).forEach(line => result.push(`${indentRight}${line}`));
    // if (hasLeft) result.push(BAR);
    leftSubtree.forEach(line => result.push(line+SPC.repeat(leftWidth-line.length)));

    return isRoot ? result.join("\n") : result;
}


const formatNode = (node) => `${node.id}${node.timestep}${node.value}`;

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

function nodeCount(root) {
    if (!root) return 1;
    return 1+nodeCount(root.left)+nodeCount(root.right);
}

function randInsert(mainStr, insertStr, anySlot = false) {
    let validPositions = [];

    for (let i = 0; i < mainStr.length-1; i++) {
        if (mainStr[i] !== '(') {
            if (anySlot || (mainStr[i] !== '-' && mainStr[i-1] !== '-')) {
                validPositions.push(i);
            }
        }
    }
    const insertPosition = validPositions[Math.floor(randomFloat32() * validPositions.length)]; // Pick a valid position
    return mainStr.slice(0, insertPosition) + insertStr + mainStr.slice(insertPosition);
}

export function genRandSourceCode(numForks, numPrints, printContent) {
    let code = "";

    // Generate forking locations
    for (let i = 0; i < numForks; i++) {
        code = randInsert(code, "f(,)");
    }
    
    // Generate print statement locations
    for (let i = 0; i < numPrints; i++) {
        code = randInsert(code, "-");
    }
    // code  = "f(a,)f(f(f(,),b)f(f(,c)f(,),)f(,)f(df(,),),)"; // super insane mode, 59 leaves, 69 prints
    let i = 0;
    const replaceChar = () => {
        const char = String.fromCharCode('a'.charCodeAt(0) + i % 26);
        i++;
        return char;
    };
    return code.replace(/-/g, replaceChar);
}