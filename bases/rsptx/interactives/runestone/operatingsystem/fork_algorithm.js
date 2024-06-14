class Node {
    constructor(value, left = null, right = null) {
        this.value = value;
        this.left = left;
        this.right = right;
    }
}

function parseToTree(code) {
    function splitFunctionContents(funcContents) {
        let balance = 0, splitIndex = -1;
        for (let i = 0; i < funcContents.length; i++) {
            if (funcContents[i] === '(') balance++;
            if (funcContents[i] === ')') balance--;
            if (balance === 0 && funcContents[i] === ',') {
                splitIndex = i;
                break;
            }
        }
        return [funcContents.substring(0, splitIndex), funcContents.substring(splitIndex + 1)];
    }

    code = code.trim();
    if (code.length === 0) return null;

    let funcIndex = code.indexOf('f(');
    if (funcIndex === -1) {
        return new Node(code); // no fork, plain print node
    }

    // code before 'fork' kept by current node, values after are passed to children
    let beforeFunc = code.substring(0, funcIndex).trim();
    let start = funcIndex + 2; // Skip 'f('
    let balance = 1
    let end;
    for (end = start; end < code.length; end++) {
        if (code[end] === '(') balance++;
        if (code[end] === ')') balance--;
        if (balance === 0) break;
    }

    let funcContents = code.substring(start, end);
    let [leftContent, rightContent] = splitFunctionContents(funcContents);
    leftContent += code.substring(end + 1).trim(); //  remaining code to left child
    rightContent += code.substring(end + 1).trim(); // remaining code to right child

    let left = parseToTree(leftContent);
    let right = parseToTree(rightContent);

    return new Node(beforeFunc || '', left, right);
}

function output(node) {
    let result = "";
    if (node) {
        result += node.value;
        if (node.right) result += output(node.right);
        if (node.right) result += output(node.left);
    }
    return result;
}

function printTree(node, prefix = "", isLeft = true) {
    if (node.right) {
        printTree(node.right, prefix + (isLeft ? "|   " : "    "), false);
    }
    console.log(prefix + (isLeft ? "└── " : "┌── ") + node.value);
    if (node.left) {
        printTree(node.left, prefix + (isLeft ? "    " : "|   "), true);
    }
}

function transpile(code, indent = 0) {
    let result = "";
    let i = 0;
    while (i < code.length) {
        if (code[i] !== 'f' || (i + 1 < code.length && code[i + 1] !== '(')) {
            // Direct print of characters until a fork or end of string
            let start = i;
            while (i < code.length && (code[i] !== 'f' || (i + 1 < code.length && code[i + 1] !== '('))) {
                i++;
            }
            let text = code.substring(start, i).trim();
            if (text.length > 0) {
                result += ' '.repeat(indent) + `foo("${text}");\n`;
            }
            continue;
        }

        if (code[i] === 'f' && code[i + 1] === '(') {
            // Handle fork
            let balance = 1;
            let start = i + 2;
            i += 2; // Move past 'f('
            while (i < code.length && balance > 0) {
                if (code[i] === '(') balance++;
                if (code[i] === ')') balance--;
                i++;
            }

            let funcContents = code.substring(start, i - 1);
            let splitIndex = findSplitIndex(funcContents);
            let leftCode = funcContents.substring(0, splitIndex);
            let rightCode = funcContents.substring(splitIndex + 1);

            // Generate if-else block
            result += ' '.repeat(indent) + "if (fork()) {\n";
            result += transpile(leftCode, indent + 4);
            result += ' '.repeat(indent) + "} else {\n";
            result += transpile(rightCode, indent + 4);
            result += ' '.repeat(indent) + "}\n";
        }
    }
    return result;
}

function findSplitIndex(funcContents) {
    let balance = 0;
    for (let i = 0; i < funcContents.length; i++) {
        if (funcContents[i] === '(') balance++;
        if (funcContents[i] === ')') balance--;
        if (balance === 0 && funcContents[i] === ',') {
            return i;
        }
    }
    return -1; // Not found, ideally should handle error
}

// Example usage:
let codeString = 'a f(z,y) f(f(x,t),d)';
console.log(transpile(codeString));
let tree = parseToTree(codeString);
console.log("EXPECTED OUTPUT:")
console.log(output(tree).split("").sort().join(""));
printTree(tree);