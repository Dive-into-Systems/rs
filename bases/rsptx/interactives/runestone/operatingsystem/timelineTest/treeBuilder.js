const INDENT_SPC = 2;
const DASH = "-";
// const DASH = "─";
const BAR = "|";
const SPC = " ";
const NEWLINE = "\n";
// const SPC = "&#8195;";
// const NEWLINE = "<br>";
let nodeCounter = 1;
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

    fork(leftCode, rightCode, indent) {
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
    
    exit() {
        if (!this.active) return;
        if (this.right) this.right.exit(); // you have a child, it also exit
        if (this.left) { // "future" self, exit
            this.left.exit();
        }
        if (!this.left && !this.right) {
            this.print("X");
            this.active = false;
        }
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
                // break;
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

function getAnswer(node) {
    let answer = output(node);
    let map = {};
    for (let i = 0; i < answer.length; i++) {
        if (answer[i] in map) { map[answer[i]] += 1; }
        else { map[answer[i]] = 1; }
    }
    return map;
}


const formatNode = (node) => `${node.id}.${node.childCt}`+ ":"+(node.value?node.value:nullChar);
function printTreeVert(node, isRoot = true) {
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
    rightSubtree.forEach(line => result.push(line+SPC.repeat(rightWidth-line.length)));

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

function genRandSourceCode(numForks, numPrints, hasNest, hasExit, hasElse, hasLoop) {

    // TODO: make sure exit is not the first few instructions (at least not prior the first fork)
    let code = "";
    const fork = hasElse?"F(,)":"F()";

    // Generate forking locations
    for (let i = 0; i < numForks; i++) {
        code = randInsert(code, fork, true);
    }
    if (!hasNest) code = fork.repeat(numForks);
    // Generate print statement locations
    for (let i = 0; i < numPrints; i++) {
        code = randInsert(code, "-");
    }
   
    code = randInsert(code, hasExit?EXIT_CHAR:"");
    // code  = "F(a,)F(F(F(,),b)F(F(,c)F(,),)F(,)F(dF(,),),)"; // super insane mode
    let i = 0;
    const replaceChar = () => {
        const char = String.fromCharCode('a'.charCodeAt(0) + i % 26);
        i++;
        return char;
    };
    return code.replace(/-/g, replaceChar);
}

function buildAndTranspile(code) {
    tree = new ForkNode();
    codeC = tree.pushCode(code).join(NEWLINE);
    // tree = new ForkNode(id = 0, childCt = 0, active = true, value = "", left = new ForkNode(0,1), right = null);
    // codeC = tree.left.pushCode(code).join(NEWLINE);
    // tree = new ForkNode(0, 1);
    // let codeC = tree.pushCode(code);
    return [tree, codeC]
}


// function main() {
//     let code = genRandSourceCode(4,4, true, true, true);
//     code = "F(,)F(aF(b,cF(,d)),)"
//     console.log(code);
//     let [tree, codeC] = buildAndTranspile(code);
//     console.log(codeC);
//     console.log("-".repeat(10));
//     console.log(printTreeVert(tree));
//     console.log("-".repeat(10));
//     console.log("EXPECTED OUTPUT: <"+output(tree).split("").sort().join("")+">")
//     console.log("TOTAL: <"+output(tree).length+">")
//     // const { csv: childParCSV, valuesList: labels } = getTreeCSV(tree);
//     // console.log(childParCSV);
//     // console.log(labels);
// }

// main();
