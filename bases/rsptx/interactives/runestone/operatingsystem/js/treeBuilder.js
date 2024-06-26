class ForkNode {
    constructor(id = 0, parent = 0, value = "", left = null, right = null) {
        this.id = id;
        this.parent = parent;
        this.value = value;
        this.left = left;
        this.right = right;
    }
}
const INDENT_SPC = 2;
const SPC = " ";
const NEWLINE = "\n";
let nodeCounter = 1;

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

    if (!topLevelComma) return [code.substring(start, end), '', end + 1];
    return [
        code.substring(start, topLevelComma),
        code.substring(topLevelComma + 1, end),
        end + 1 // next index
    ];
}

function buildTree(code, id = 1, parent = 0, childCt = 0) {
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

function transpileToC(code, indent = 0) {
    let result = "";
    let ptr = 0;
    let leftCode, rightCode;
    prefix = SPC.repeat(indent);
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

function countPrints(node, printContent) {
    if (!node) return 0;
    let count = (node.value.includes(`printf("${printContent}")`)) ? 1 : 0;
    count += countPrints(node.left, printContent);
    count += countPrints(node.right, printContent);
    return count;
}

function printTree (node, prefix = "", isRight = true) {
    if (!node) return "";
    let result = "";
    const indentBlank = SPC.repeat(3);
    const indentStick = "|"+SPC.repeat(2);
    const indentDown = `└─ `;
    const indentUp = `┌─ `;
    result += printTree(node.left, prefix + (isRight ? indentStick : indentBlank), false);
    result += prefix + (isRight ? indentDown : indentUp) + (node.id) + " | " + (node.parent) + " | "+ node.value + "\n";
    // result += prefix + (isRight ? indentDown : indentUp) + node.value + "\n";
    result += printTree(node.right, prefix + (isRight ? indentBlank : indentStick), true);
    return result;
}

function getTreeArr(root) {
    if (!root) return [];
    const result = (root.id!=root.parent)?[`${root.id},${root.parent}`]:[]
    return [
        ...result,
        ...getTreeArr(root.left),
        ...getTreeArr(root.right)
    ];
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

function genRandSourceCode(numForks, numPrints) {
    let code = "";

    // Generate forking locations
    for (let i = 0; i < numForks; i++) {
        code = randInsert(code, "f(,)", true);
    }
    
    // Generate print statement locations
    for (let i = 0; i < numPrints; i++) {
        code = randInsert(code, "-");
    }
    // code  = "f(a,)f(f(f(,),b)f(f(,c)f(,),)f(,)f(df(,),),)" // super insane mode, 59 leaves, 69 prints
    // replace dashes with alphabets
    let i = 0;
    const replaceChar = () => {
        const char = String.fromCharCode('a'.charCodeAt(0) + i % 26);
        i++;
        return char;
    };
    return code.replace(/-/g, replaceChar);
}

function main() {
    let code = genRandSourceCode(3,4);
    console.log(code);
    console.log("-".repeat(10));
    console.log(transpileToC(code));
    console.log("-".repeat(10));
    
    let tree = buildTree(code);
    console.log(getTreeArr(tree).length);
    console.log(printTree(tree));
    console.log("-".repeat(10));
    console.log("EXPECTED OUTPUT: <"+output(tree).split("").sort().join("")+">")
    console.log("EXPECTED OUTPUT: <"+output(tree).length+">")
    console.log(getTreeArr(tree).join("\n"));
}

main();