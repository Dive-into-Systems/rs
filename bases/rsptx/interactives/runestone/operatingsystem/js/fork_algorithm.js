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
const SPC = "&#8195;";
const NEWLINE = "<br>";
let nodeCounter = 1;

export function countPrints(node, printContent) {
    if (!node) return 0;
    let count = (node.value.includes(`printf("${printContent}")`)) ? 1 : 0;
    count += countPrints(node.left, printContent);
    count += countPrints(node.right, printContent);
    return count;
}

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

export function buildTree(code, id = 1, parent = 0, childCt = 0) {
    code = code.trim();
    if (code.length === 0) return null;

    let forkIndex = code.indexOf('f(');
    if (forkIndex === -1) {
        return new ForkNode(id, parent, code); // no fork, plain print node
    }
    let [leftCode, rightCode, end] = parseForkArgs(code, forkIndex);
    leftCode += code.substring(end).trim(); // remaining code
    rightCode += code.substring(end).trim(); // remaining code
    
    const leftNode = buildTree(leftCode, id+1, id);
    // childCt += rightCode?1:0;
    const rightNode = buildTree(rightCode, id*10, id);
    return new ForkNode(
        id,
        parent,
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

export function output(node) {
    if (!node) return "";
    return node.value + output(node.left) + output(node.right);
}

export function printTree(node, prefix = "", isRight = true) {
    if (!node) return "";

    let result = "";

    const childPrefix = prefix + (isRight ? "&emsp;&emsp;" : "&emsp;|&emsp;");

    if (node.left) {
        result += printTree(node.left, childPrefix, false);
    }

    result += prefix + (isRight ? "└─ " : "┌─ ") + node.value + "<br>";

    if (node.right) {
        result += printTree(node.right, childPrefix, true);
    }

    return result;
}

export function getTreeArr(root, parentVal="") {
    if (!root) return [];
   	let result, p1, p2;
    if (root.id != root.parent) {
    	p1 = (root.value == "") ? null : root.value;
        p2 = (parentVal == "") ? null : parentVal;
        result = [`${root.id}@${p1},${root.parent}@${p2}`];
    } else {
        result = [];
    }
    return [
        ...result,
        ...getTreeArr(root.left, root.value),
        ...getTreeArr(root.right, root.value)
    ];
}

export function getTreeCSV(root) {
    console.log('child,parent\na,\nb,a\nc,a\nd,a\ne,b\nf,c\ng,c\nh,d\ni,h');
    console.log("child,parent\n0\n"+getTreeArr(root).join("\n"));
    return "child,parent\n0\n"+getTreeArr(root).join("\n");
}

export function randInsert(mainStr, insertStr) {
    let validPositions = [];

    for (let i = 0; i <= mainStr.length; i++) {
        if (mainStr[i] !== '(') {
            validPositions.push(i);
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
        code = randInsert(code, printContent[i]);
    }

    return code;
}