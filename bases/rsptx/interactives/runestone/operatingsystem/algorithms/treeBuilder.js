class ForkNode {
    constructor(id = 0, timestep = 0, value = "", left = null, right = null) {
        this.id = id;
        this.timestep = timestep;
        this.value = value;
        this.left = left;
        this.right = right;
    }
}
const INDENT_SPC = 4;
const DASH = "-";
const BAR = "|";
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

function transpileToC(code, indent = 0, activeProcesses = ["0"]) {
    let result = [];
    let ptr = 0;
    let nextF;
    let leftCode, rightCode;

    function addLine(line) {
        result.push(`${SPC.repeat(indent)}${line}`);
    }

    while (ptr < code.length) {
        nextF = code.indexOf('f(', ptr);
        if (nextF === -1 || nextF > ptr) {
            // print plain text until 'f(' or end of string
            let end = nextF === -1 ? code.length : nextF;
            let text = code.substring(ptr, end);
            for (let i = 0; i < text.length; i++) {
                addLine(`printf("${text[i]}");`);
            }
            ptr = end;
        }

        if (nextF !== -1 && ptr === nextF) {
            [leftCode, rightCode, ptr] = parseForkArgs(code, ptr);
            if (!leftCode && !rightCode) addLine("fork();");
            if (leftCode) {
                addLine("if (fork()) {");
                result = result.concat(transpileToC(leftCode, indent + INDENT_SPC));
                addLine(rightCode ? "} else {" : "}");
            }
            if (rightCode) {
                if (!leftCode) addLine("if (fork() == 0) {");
                result = result.concat(transpileToC(rightCode, indent + INDENT_SPC));
                addLine("}");
            }
        }
    }
    return result;
}


function buildTree(code, id = 0, time = 0, childCt = 0) {
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
    // console.log(code, hasFork);
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

function output(node) {
    if (!node) return "";
    return node.value + output(node.left) + output(node.right);
}

// function printTree (node, prefix = "", isRight = true) {
//     if (!node) return "";
//     let result = "";
//     const indentBlank = SPC.repeat(3);
//     const indentStick = BAR+SPC.repeat(2);
//     const indentDown = `└─ `;
//     const indentUp = `┌─ `;
//     result += printTree(node.left, prefix + (isRight ? indentStick : indentBlank), false);
//     result += prefix + (isRight ? indentDown : indentUp) + formatNode(node) "\n";
//     result += printTree(node.right, prefix + (isRight ? indentBlank : indentStick), true);
//     return result;
// }

function printTreeVert(node, isRoot = true) {
    const nullChar = "[]";
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

    console.log(isRoot ? result.join("\n") : result);
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

function getTreeCSV(root) {
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
    // code  = "f(a,)f(f(f(,),b)f(f(,c)f(,),)f(,)f(df(,),),)"; // super insane mode, 59 leaves, 69 prints
    let i = 0;
    const replaceChar = () => {
        const char = String.fromCharCode('a'.charCodeAt(0) + i % 26);
        i++;
        return char;
    };
    return code.replace(/-/g, replaceChar);
}

// function histo(n, func) {
//     let counts = {};
//     let min = Infinity;
//     let max = -Infinity;

//     // Gather counts and dynamically find the min and max
//     for (let i = 0; i < n; i++) {
//         let result = func();
//         min = Math.min(min, result);
//         max = Math.max(max, result);
//         counts[result] = (counts[result] || 0) + 1;
//     }

//     // Calculate percentages and print histogram
//     // console.log("Histogram:");
//     for (let num = min; num <= max; num++) {
//         let count = counts[num] || 0;
//         let percentage = (count / n * 100).toFixed(2);
//         // Right-align the percentage and the number, scale bar length
//         console.log(`${num.toString().padStart(2, ' ')} (${percentage.padStart(6, ' ')}%): ${'-'.repeat(Math.round(percentage))}`);
//     }
// }
// const fork = 3;
// const print = 5;
// function randTreeCt() {
//     const code = genRandSourceCode(fork,print);
//     const tree = buildTree(code);
//     return nodeCount(tree);
// }

// function randTreeLen() {
//     const code = genRandSourceCode(fork,print);
//     const tree = buildTree(code);
//     return output(tree).length;
// }

function main() {
    // let code = genRandSourceCode(4,4);
    let code = "f(,f(a,)b)cf(d,)";
    // code = "f()af(,b)cf(f(,)f(,)f(,f(d,)),)";
    console.log(code);
    console.log("-".repeat(10));
    console.log(transpileToC(code).join(NEWLINE));
    console.log("-".repeat(10));
   
    let tree = buildTree(code);
    // console.log(printTree(tree));
    console.log(printTreeVert(tree));
    console.log("-".repeat(10));
    console.log("EXPECTED OUTPUT: <"+output(tree).split("").sort().join("")+">")
    console.log("EXPECTED OUTPUT: <"+output(tree).length+">")
    const { csv: childParCSV, valuesList: labels } = getTreeCSV(tree);
    console.log(childParCSV);
    console.log(labels);
}

main();