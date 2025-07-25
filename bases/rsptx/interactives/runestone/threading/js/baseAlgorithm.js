//a dictionary of functions that emulates code execution for thread1
const threadTemplate1 = {
        ["evalIf"]: (state,info) => {
            let x = state.readFromx;
            let y = state.y1;
            if(eval(info.comp)){
                state.inIf1 = true
                
            }
            else{
                state.inIf1 = false;
            }
            
            return state
        },
    
        ["changeIf"]: (state, info, i) => {
            let x = state.readFromx;
            let y = state.y1;
            if(state.inIf1){
                if (info.operandIf[i] == "x"){
                    state.writeTox = eval(info.changeIf[i])
                }else{
                    state.y1 = eval(info.changeIf[i])
                }
            }
            return state;
        },
    
        ["changeElse"]: (state, info, i) => {
            let x = state.readFromx;
            let y = state.y1;
            if(!state.inIf1){
                if (info.operandElse[i] == "x"){
                    state.writeTox = eval(info.changeElse[i])
                }else{
                    state.y1 = eval(info.changeElse[i])
                }
            }
            return state
        },
    
        ["update"]: (state, info) => {
            state.readFromx = state.writeTox
            return state;
        }
    
}

//a dictionary of functions that emulates code execution for thread2
const threadTemplate2 = {
    ["evalIf"]: (state,info) => {
        let x = state.readFromx;
        let y = state.y2;
        if(eval(info.comp)){
            state.inIf2 = true
            
        }
        else{
            state.inIf2 = false;
        }
        
        return state
    },

    ["changeIf"]: (state, info, i) => {
        let x = state.readFromx;
        let y = state.y2;
        if(state.inIf2){
            if (info.operandIf[i] == "x"){
                state.writeTox = eval(info.changeIf[i])
            }else{
                state.y2 = eval(info.changeIf[i])
            }
        }
        return state;
    },

    ["changeElse"]: (state, info, i) => {
        let x = state.readFromx;
        let y = state.y2;
        if(!state.inIf2){
            if (info.operandElse[i] == "x"){
                state.writeTox = eval(info.changeElse[i])
            }else{
                state.y2 = eval(info.changeElse[i])
            }
        }
        return state
    },

    ["update"]: (state, info) => {
        state.readFromx = state.writeTox
        return state;
    }
}

//the function that generates the text which is displayed
function generateText(state, thread1Info, thread2Info){
    //the text for the global variables
    let initialText = `<pre style="font-size: 18px; width:130px;">int x = ${state.readFromx};</pre><br>`

    //determines the line sizes of each thread
    let thread1Size = thread1Info.lineSizeIf+thread1Info.lineSizeElse;
    let thread2Size = thread2Info.lineSizeIf+thread2Info.lineSizeElse;


    let thread1Text = '<pre style="font-size: 18px;">void *thread(void *arg) {<br>';
    let thread2Text = '<pre style="font-size: 18px;">void *thread(void *arg) {<br>'

    //adds in spacing to the thread with a smaller size for more consistent displayss
    if(thread1Size > thread2Size){
        thread1Text += `    int y = ${state.y1};<br>`
        thread2Text += `    int y = ${state.y2};<br><br>`
    } else if(thread2Size>thread1Size){
        thread1Text += `    int y = ${state.y1};<br><br>`
        thread2Text += `    int y = ${state.y2};<br>`
    }else{
        thread1Text += `    int y = ${state.y1};<br>`
        thread2Text += `    int y = ${state.y2};<br>`
    }
    
    //generating the text for thread1's if block
    thread1Text += `    if (${thread1Info.comp}){<br>`
    switch (thread1Info.lineSizeIf){
        case 1:
            thread1Text += `        ${thread1Info.operandIf[0]} = ${thread1Info.changeIf[0]};<br>`
            break;
        case 2:
            thread1Text += `        ${thread1Info.operandIf[0]} = ${thread1Info.changeIf[0]};<br>`
            thread1Text += `        ${thread1Info.operandIf[1]} = ${thread1Info.changeIf[1]};<br>`
            break;
    }
    
    thread1Text += `    } else{<br>`
    
    //generating the text for thread1's else block
    switch (thread1Info.lineSizeElse){
        case 1:
            thread1Text += `        ${thread1Info.operandElse[0]} = ${thread1Info.changeElse[0]};<br>    }<br>`
            break
        case 2:
            thread1Text += `        ${thread1Info.operandElse[0]} = ${thread1Info.changeElse[0]};<br>`
            thread1Text += `        ${thread1Info.operandElse[1]} = ${thread1Info.changeElse[1]};<br>    }<br>`
    }
    thread1Text += `    print("%d %d", x, y);<br>    return NULL;<br>}</pre>`

    //generating the text for thread2's if block
    thread2Text += `    if (${thread2Info.comp}){<br>`
    switch (thread2Info.lineSizeIf){
        case 1: 
            thread2Text += `        ${thread2Info.operandIf[0]} = ${thread2Info.changeIf[0]};<br>`
            break;
        case 2:
            thread2Text += `        ${thread2Info.operandIf[0]} = ${thread2Info.changeIf[0]};<br>`
            thread2Text += `        ${thread2Info.operandIf[1]} = ${thread2Info.changeIf[1]};<br>`
            break;
    }
    
    thread2Text += `    } else{<br>`
    
    //generating the text for thread2's else block
    switch (thread2Info.lineSizeElse){
        case 1:
            thread2Text += `        ${thread2Info.operandElse[0]} = ${thread2Info.changeElse[0]};<br>    }<br>`
            break
        case 2:
            thread2Text += `        ${thread2Info.operandElse[0]} = ${thread2Info.changeElse[0]};<br>`
            thread2Text += `        ${thread2Info.operandElse[1]} = ${thread2Info.changeElse[1]};<br>    }<br>`
    }
    thread2Text += `    print("%d %d", x, y);<br>    return NULL;<br>}</pre>`


    return {initial: initialText, t1: thread1Text, t2: thread2Text};
}

//the function that handles generating the read-modify-write pattern for an if/else block.
//params: 
//      operatorChange: array of strings that represent possible operations ("<", ">", etc.)
//      operandIf: array of strings that are the variabes being modified by each line, e.g.,
//      ["x", "y"] would mean the first line rmw x and the second line rmw y.
//      operands: list of available operands, which are ["x", "y"]
//      lineSizeIf: integer representation of the number of lines in the if/else block
function generateChange(operatorChange, operandIf, operands, lineSizeIf){
    let opIf1;
    let opIf2;
    let changeIf = []
    //randomly chooses the first operation.
    const changeOPIf1 = operatorChange[Math.floor(Math.random()*operatorChange.length)];

    let temp = operatorChange.filter(item=>item!=changeOPIf1);

    //excludes the first operation from available choices and then randomly chooses second operation.
    const changeOPIf2 = temp[Math.floor(Math.random()*temp.length)];

    //gets the first operator
    opIf1 = operandIf[0];
    temp = operands.filter(item => item!=opIf1);

    //chooses the second operator which is guarenteed to be different from the first one
    opIf2 = temp[Math.floor(Math.random()*temp.length)];
    if(opIf2 == "const"){
        opIf2 = Math.floor(Math.random()*10)
    }

    //generates the change statements based on the lineSize
    switch (lineSizeIf){
        case 1:
            if (changeOPIf1 == "="){
                changeIf.push(`${opIf2}`)
            }else{
                changeIf.push(`${opIf1} ${changeOPIf1} ${opIf2}`)
            }
            break;

        case 2:
            let opIf3 = operandIf[1];
            
            let opIf4 = (opIf3 == "x") ? "y":"x";
            // temp = operands.filter(item => item!=opIf3);
            // let opIf4 = temp[Math.floor(Math.random()*temp.length)]
            // if(opIf4 == "const"){
            //     opIf4 = Math.floor(Math.random()*10)
            // }

            if (changeOPIf1 == "="){
                changeIf.push(`${opIf2}`)
            }else{
                changeIf.push(`${opIf1} ${changeOPIf1} ${opIf2}`)
            }

            if (changeOPIf2 == "="){
                changeIf.push(`${opIf4}`)
            }else{
                changeIf.push(`${opIf3} ${changeOPIf2} ${opIf4}`)
            }
            break;

    }
    return changeIf;
}

//This function generates the information used for executing the thread evaluations
function generateThreadInfo(mode, limitLineSize=false){

    let lineSizeIf
    let lineSizeElse
    //determines the line size based on mode. If limitLineSize is set to true, i.e., another block already has two lines,
    //sets lineSize to 1
    if (mode == 1){
        lineSizeIf = 1;
        lineSizeElse = 1;
    }else{
        lineSizeIf = (!limitLineSize && (Math.floor(Math.random()*7))<2) ? 2:1
        lineSizeElse = ((lineSizeIf == 1 && !limitLineSize) && Math.floor(Math.random()*2)) ? 2:1
    }
    let operandIf = []
    let operandElse = []
    let changeIf;
    let changeElse;
    let comp;

    //determines the operands to rmw to for the if block
    if(lineSizeIf == 2){
        operandIf.push(Math.floor(Math.random()*2) ? "x":"y");
        operandIf.push((operandIf[0] == "x")?"y":"x");
    }else{
        operandIf.push(Math.floor(Math.random()*2) ? "x":"y");
    }
    //determines the operands to rmw to for the else blocks
    if(lineSizeElse == 2){
        operandElse.push(Math.floor(Math.random()*2) ? "x":"y");
        operandElse.push((operandElse[0] == "x")?"y":"x");
    }else{
        operandElse.push((operandIf[0] == "x")? "y":"x");
    }

    const operatorComp = ["<=", ">=", "<", ">"];
    let operatorChange = ["+", "-", "="]
    let operands = ["x", "y", "const"];

    //generates the expression used in the conditional evaluation
    const compareOP = operatorComp[Math.floor(Math.random()*operatorComp.length)];
    const OPcompare1 = operands[Math.floor(Math.random()*(operands.length-1))];
    let temp = operands.filter(item => item!=OPcompare1);
    let OPcompare2 = temp[Math.floor(Math.random()*temp.length)];
    if(OPcompare2 == "const"){
        OPcompare2 = Math.floor(Math.random()*10);
    }

    comp = `${OPcompare1} ${compareOP} ${OPcompare2}`

    //generates the rmw pattens for the if and else blocks
    changeIf = generateChange(operatorChange, operandIf, operands, lineSizeIf);
    changeElse = generateChange(operatorChange, operandElse, operands, lineSizeElse);

    
    const thread = {comp: comp, operandIf: operandIf, operandElse: operandElse, changeIf: changeIf, changeElse: changeElse, lineSizeIf: lineSizeIf, lineSizeElse: lineSizeElse}
    return thread
}

//This function randomly generates the initial state
function generateInitialState(){
    //x is set to a random number between 3 and 7
    let readFromx = Math.floor(Math.random()*(7-2))+3;
    let coinFlip = Math.floor(Math.random()*2);

    //either y1 or y2 will be between 1 and 6 will the other will be between 9 and 5
    let y1 = coinFlip ? Math.floor(Math.random()*(6))+1 : Math.floor(Math.random()*(9-4))+5;
    let y2 = coinFlip ? Math.floor(Math.random()*(9-4))+5 : Math.floor(Math.random()*(6))+1;
    return {readFromx: readFromx, writeTox: readFromx, y1:y1, y2:y2, inIf1: false, inIf2: false}
}


//converts the stateArr (which store states as strings) to an array that stores states as JSON objects
function toState(stateArr){
    let states = []

    
    stateArr.forEach((elem)=>{
        let item = []
        elem.forEach((state)=>{
            let substate = []
            state.forEach(entry=>{
                
                entry = JSON.parse(entry)
                substate.push(entry)
                
            })
            item.push(substate)
        })
        states.push(item)
    })
    return states
}

//this function handles enumerating the possible final states.
/*
params:
    state: a JSON object that stores information about the initial state
    thread1Info: information about the comparisons, size, and changes of thread1
    thread2Info: information about the comparisons, size, and changes of thread2
    thread1: an array of strings that represent instructions for thread1's execution
    thread2: an array of strings that represents instructions for thread2's execution
*/
export function stateChange(state, thread1Info, thread2Info, thread1, thread2){
    let arr = [];

    //changes the length of the threads depending on the lineSize
    if(thread1Info.lineSizeElse == 1){
        thread1.splice(7, 2)
    }
    if(thread1Info.lineSizeIf == 1){
        thread1.splice(3, 2)
    }

    if(thread2Info.lineSizeElse == 1){
        thread2.splice(7, 2)
    }
    if(thread2Info.lineSizeIf == 1){
        thread2.splice(3, 2)
    }

    //initialize the array which stores the states
    for(let n = 0; n<=thread2.length; n++){
        let temp = [];
        for (let m = 0; m <=thread1.length; m++){
            temp.push('')
        }
        arr.push(temp)
    }
    //makes a deep copy of the initial state and stores at the initial position of the 2D array
    arr[0][0] = [JSON.stringify(state)]

    let i;
    let j;
    const regex = /\d/;


    for(i = 0; i <= thread2.length; i++){

        for (j = 0; j<= thread1.length; j++){

            //skips the starting position as it is already filled
            if(i==0 && j==0){
                continue;
            }
            //fills in the first row of the 2D array
            else if(i == 0){
                //continue through thread 1
                arr[0][j] = [];
                
                arr[0][j-1].forEach((elem)=>{
                    
                    if(regex.test(thread1[j-1])){ //if this instruction is a rmw instruction
                        arr[0][j].push(JSON.stringify(threadTemplate1[thread1[j-1].slice(1,thread1[j-1].length)](JSON.parse(elem), thread1Info, parseInt(thread1[j-1]))))
                    }else{ //if this instruction is a comparison or update instruction
                        arr[0][j].push(JSON.stringify(threadTemplate1[thread1[j-1]](JSON.parse(elem), thread1Info)))
                    }
                    
                })
                arr[0][j] = arr[0][j].flat()

                
            }
            else if(j == 0){   //fills in the first column of the 2D array

                arr[i][0] = [];
                arr[i-1][0].forEach((elem)=>{
                    if(regex.test(thread2[i-1])){
                        arr[i][0].push(JSON.stringify(threadTemplate2[thread2[i-1].slice(1, thread2[i-1].length)](JSON.parse(elem), thread2Info, parseInt(thread2[i-1]))))
                    }else{
                        arr[i][0].push(JSON.stringify(threadTemplate2[thread2[i-1]](JSON.parse(elem), thread2Info)))
                    }
                    
                })
                arr[i][0] = arr[i][0].flat()


            }
            else{ //fills in the rest of the array
                let temp = []; 

                arr[i-1][j].forEach((elem)=>{

                    let next;

                    if(regex.test(thread2[i-1])){
                        next =threadTemplate2[thread2[i-1].slice(1, thread2[i-1].length)](JSON.parse(elem), thread2Info, parseInt(thread2[i-1]))
                    }else{
                        next = threadTemplate2[thread2[i-1]](JSON.parse(elem), thread2Info)
                    }
                    
                    temp.push(JSON.stringify(next))

                })

                temp = temp.flat();
                
                let temp2 = []; 
                arr[i][j-1].forEach((elem)=>{

                    let next;

                    if(regex.test(thread1[j-1])){
                        next =threadTemplate1[thread1[j-1].slice(1, thread1[j-1].length)](JSON.parse(elem), thread1Info, parseInt(thread1[j-1]))
                    }else{
                        next = threadTemplate1[thread1[j-1]](JSON.parse(elem), thread1Info)
                    }
                    
                    temp2.push(JSON.stringify(next))

                })

                temp2 = temp2.flat();


                arr[i][j] = []
                arr[i][j].push(temp);
                arr[i][j] = arr[i][j].flat();

                arr[i][j].push(temp2);
                arr[i][j] = arr[i][j].flat();      
            }
        }
        

    }
  
    return arr
}
export function initialize(mode){


    let thread1 = ["evalIf", "0changeIf", "update", "1changeIf", "update", "0changeElse", "update", "1changeElse", "update"]
    let thread2 = ["evalIf", "0changeIf", "update", "1changeIf", "update", "0changeElse", "update", "1changeElse", "update"]

    const state = generateInitialState();//{x: 4, y1:9, y2:3, inIf1: false, inIf2: false}
    const thread1Info = generateThreadInfo(mode);//{comp: "x==1", operand1: "x", operand2: "y", change1: "x-y", change2: "y+1"}
    let flag = false;
    if(thread1Info.lineSizeIf == 2||thread1Info.lineSizeElse ==2){
        flag = true
    }
    const thread2Info = generateThreadInfo(mode, flag);//{comp: "y==6", operand1: "y", operand2: "x", change1: "y=x", change2: "x+9"}

    let text = generateText(state, thread1Info, thread2Info);

    return {state: state, text: text, thread1Info: thread1Info, thread2Info: thread2Info, thread1: thread1, thread2: thread2, threadTemplate1: threadTemplate1, threadTemplate2: threadTemplate2};
}

export function possibleFinalStates(stateArr, thread1Length, thread2Length){
    let finalState = stateArr[thread2Length][thread1Length];
    let ret = []

    for (let i = 0; i < finalState.length; i++){
        finalState[i] = JSON.parse(finalState[i]);
        finalState[i] = {readFromx: finalState[i].readFromx, y1: finalState[i].y1, y2: finalState[i].y2};
        finalState[i] = JSON.stringify(finalState[i])
    }

    while(finalState.length > 0){
        let state = finalState[0];
        ret.push(state);
        finalState = finalState.filter(item=>item!=state);
    }

    return ret;
}

function gatherGenerationStatistics(){
    let finalStateCount = []
    let finalStates = []
    for (let i = 0; i<1000; i++){
        let problem = initialize();
        let stateArr = stateChange(problem.state, problem.thread1Info, problem.thread2Info, problem.thread1, problem.thread2);
        console.log(problem.text.initial)
        console.log(problem.text.t1);
        console.log(problem.text.t2);
        let finalState = possibleFinalStates(stateArr, problem.thread1.length, problem.thread2.length)
        console.log(finalState)
        finalStateCount.push(finalState.length)
        finalState.push(finalState)
    }

    let stateFrequencies = [0,0,0,0,0,0,0,0,0,0]

    finalStateCount.forEach(item=>{
        stateFrequencies[item-1]++
    })
    
    return stateFrequencies
}

// console.log(gatherGenerationStatistics())

// let problem = initialize();

// let stateArr = stateChange(problem.state, problem.thread1Info, problem.thread2Info, problem.thread1, problem.thread2, problem.thread)
// let finalState = possibleFinalStates(stateArr, problem.thread1.length, problem.thread2.length)

// console.log(stateArr)
// console.log(finalState)
// console.log(problem.text.initial)
// console.log(problem.text.t1)
// console.log(problem.text.t2)