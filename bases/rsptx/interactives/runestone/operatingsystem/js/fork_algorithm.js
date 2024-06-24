export class Node {
    constructor(value, left = null, right = null) {
        this.value = value;
        this.left = left;
        this.right = right;
    }
}
export const INDENT_SPC = 2;

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

export function buildTree(code) {
    code = code.trim();
    if (code.length === 0) return null;

    let forkIndex = code.indexOf('f(');
    if (forkIndex === -1) {
        return new Node(code); // no fork, plain print node
    }
    let [leftCode, rightCode, end] = parseForkArgs(code, forkIndex);
    leftCode += code.substring(end).trim(); // remaining code
    rightCode += code.substring(end).trim(); // remaining code
    return new Node(
        code.substring(0, forkIndex).trim() ?? '',
        buildTree(leftCode),
        buildTree(rightCode)
    );
}

export function transpileToC(code, indent = 0) {
    let result = "";
    let ptr = 0;
    let leftCode, rightCode;
    while (ptr < code.length) {
        if (code[ptr] !== 'f' || (ptr + 1 < code.length && code[ptr + 1] !== '(')) {
            let start = ptr;
            while (ptr < code.length && (code[ptr] !== 'f' || (ptr + 1 < code.length && code[ptr + 1] !== '('))) {
                ptr++;
            }
            let text = code.substring(start, ptr).trim();
            for (let i = 0; i < text.length; i++) {
                result += '&#8195;'.repeat(indent) + `printf("${text[i]}");<br>`;
            }
        }

        if (code[ptr] === 'f' && code[ptr + 1] === '(') {
            [leftCode, rightCode, ptr] = parseForkArgs(code, ptr);
            if (!leftCode && !rightCode) {
                result += '&#8195;'.repeat(indent) +"fork();<br>";
                continue;
            }
            if (leftCode) {
                result += '&#8195;'.repeat(indent) + "if (fork()) {<br>";
                result += transpileToC(leftCode, indent + INDENT_SPC);
                result += '&#8195;'.repeat(indent) + (rightCode?"} else {<br>":"}<br>");
            }
            if (rightCode) {
                result += leftCode?"":('&#8195;'.repeat(indent)+ "if (fork()==0) {<br>");
                result += transpileToC(rightCode, indent + INDENT_SPC);
                result += '&#8195;'.repeat(indent) + "}<br>";
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
    if (node.left) printTree(node.left, prefix + (isRight ? "|   " : "    "), false);
    console.log(prefix + (isRight ? "└── " : "┌── ") + node.value);
    if (node.right) printTree(node.right, prefix + (isRight ? "    " : "|   "), true);
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

export function genRandSourceCode(numFork, numPrints, printContent) {
    let code = "";

    // Generate forking locations
    for (let i = 0; i < numFork; i++) {
        code = randInsert(code, "f(,)");
        console.log(code);
    }
    
    // Generate print statement locations
    for (let i = 0; i < numPrints; i++) {
        code = randInsert(code, printContent);
        console.log(code);
    }

    return code;
}