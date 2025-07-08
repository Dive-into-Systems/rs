function generateText(state, thread1Info, thread2Info){
    let initialText = `int x = ${state.x};\n`
    
    let thread1Text = `int y = ${state.y1};\n`
    thread1Text += `if (${thread1Info.comp}){\n`
    switch (thread1Info.lineSizeIf){
        case 1: 
            thread1Text += `   ${thread1Info.operandIf[0]} = ${thread1Info.changeIf[0]};\n`
            break;
        case 2:
            thread1Text += `    ${thread1Info.operandIf[0]} = ${thread1Info.changeIf[0]};\n`
            thread1Text += `    ${thread1Info.operandIf[1]} = ${thread1Info.changeIf[1]};\n`
            break;
    }
    
    thread1Text += `} else{\n`
    
    switch (thread1Info.lineSizeElse){
        case 1:
            thread1Text += `   ${thread1Info.operandElse[0]} = ${thread1Info.changeElse[0]};\n}\n`
            break
        case 2:
            thread1Text += `   ${thread1Info.operandElse[0]} = ${thread1Info.changeElse[0]};\n`
            thread1Text += `   ${thread1Info.operandElse[1]} = ${thread1Info.changeElse[1]};\n}\n`
    }
    thread1Text += `print("%d %d", x, y);`

    let thread2Text = `int y = ${state.y2};\n`

    thread2Text += `if (${thread2Info.comp}){\n`
    switch (thread2Info.lineSizeIf){
        case 1: 
            thread2Text += `    ${thread2Info.operandIf[0]} = ${thread2Info.changeIf[0]};\n`
            break;
        case 2:
            thread2Text += `    ${thread2Info.operandIf[0]} = ${thread2Info.changeIf[0]};\n`
            thread2Text += `    ${thread2Info.operandIf[1]} = ${thread2Info.changeIf[1]};\n`
            break;
    }
    
    thread2Text += `} else{\n`
    
    switch (thread2Info.lineSizeElse){
        case 1:
            thread2Text += `   ${thread2Info.operandElse[0]} = ${thread2Info.changeElse[0]};\n}\n`
            break
        case 2:
            thread2Text += `   ${thread2Info.operandElse[0]} = ${thread2Info.changeElse[0]};\n`
            thread2Text += `   ${thread2Info.operandElse[1]} = ${thread2Info.changeElse[1]};\n}\n`
    }
    thread2Text += `print("%d %d", x, y);`

    return {initial: initialText, t1: thread1Text, t2: thread2Text};
}


function generateChange(operatorChange, operandIf, operands, lineSizeIf){
    let opIf1;
    let opIf2;
    let changeIf = []
    const changeOPIf1 = operatorChange[Math.floor(Math.random()*operatorChange.length)];
    let temp = operatorChange.filter(item=>item!=changeOPIf1);
    const changeOPIf2 = temp[Math.floor(Math.random()*temp.length)];
    opIf1 = operandIf[0];
    temp = operands.filter(item => item!=opIf1);
    opIf2 = temp[Math.floor(Math.random()*temp.length)];
    if(opIf2 == "const"){
        opIf2 = Math.floor(Math.random()*10)
    }

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

function generateThreadInfo(limitLineSize=false){
    
    let lineSizeIf = (!limitLineSize && (Math.floor(Math.random()*7))<2) ? 2:1
    let lineSizeElse = ((lineSizeIf == 1 && !limitLineSize) && Math.floor(Math.random()*2)) ? 2:1
    let operandIf = []
    let operandElse = []
    let changeIf;
    let changeElse;
    let comp;

    if(lineSizeIf == 2){
        operandIf.push(Math.floor(Math.random()*2) ? "x":"y");
        operandIf.push((operandIf[0] == "x")?"y":"x");
    }else{
        operandIf.push(Math.floor(Math.random()*2) ? "x":"y");
    }

    if(lineSizeElse == 2){
        operandElse.push(Math.floor(Math.random()*2) ? "x":"y");
        operandElse.push((operandIf[0] == "x")?"y":"x");
    }else{
        operandElse.push((operandIf[0] == "x")? "y":"x");
    }

    const operatorComp = ["<=", ">=", "<", ">"];
    let operatorChange = ["+", "-", "="]
    let operands = ["x", "y", "const"];

    const compareOP = operatorComp[Math.floor(Math.random()*operatorComp.length)];
    const OPcompare1 = operands[Math.floor(Math.random()*(operands.length-1))];
    let temp = operands.filter(item => item!=OPcompare1);
    let OPcompare2 = temp[Math.floor(Math.random()*temp.length)];
    if(OPcompare2 == "const"){
        OPcompare2 = Math.floor(Math.random()*10);
    }

    comp = `${OPcompare1} ${compareOP} ${OPcompare2}`

    changeIf = generateChange(operatorChange, operandIf, operands, lineSizeIf);
    changeElse = generateChange(operatorChange, operandElse, operands, lineSizeElse);

    
    const thread = {comp: comp, operandIf: operandIf, operandElse: operandElse, changeIf: changeIf, changeElse: changeElse, lineSizeIf: lineSizeIf, lineSizeElse: lineSizeElse}
    return thread
}

function generateInitialState(){
    let x = Math.floor(Math.random()*(7-2))+3;
    let coinFlip = Math.floor(Math.random()*2);
    let y1 = coinFlip ? Math.floor(Math.random()*(6))+1 : Math.floor(Math.random()*(9-4))+5;
    let y2 = Math.floor(Math.random()*10)
    return {x: x, y1:y1, y2:y2, inIf1: false, inIf2: false}
}

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

function stateChange(state, thread1Info, thread2Info, thread1, thread2){
    let arr = [];

    if(thread1Info.lineSizeElse == 1){
        thread1.splice(4, 1)
    }
    if(thread1Info.lineSizeIf == 1){
        thread1.splice(2, 1)
    }

    if(thread2Info.lineSizeElse == 1){
        thread2.splice(4, 1)
    }
    if(thread2Info.lineSizeIf == 1){
        thread2.splice(2, 1)
    }


    for(let n = 0; n<=thread2.length; n++){
        let temp = [];
        for (let m = 0; m <=thread1.length; m++){
            temp.push('')
        }
        arr.push(temp)
    }

    arr[0][0] = [JSON.stringify(state)]

    let i;
    let j;
    for(i = 0; i <= thread2.length; i++){

        for (j = 0; j<= thread1.length; j++){
            if(i==0 && j==0){
                continue;
            }
            else if(i == 0){
                //continue through thread 1
                arr[0][j] = [];
                arr[0][j-1].forEach((elem)=>{arr[0][j].push(JSON.stringify(thread1[j-1](JSON.parse(elem), thread1Info)))})
                arr[0][j] = arr[0][j].flat()

                
            }
            else if(j == 0){   

                arr[i][0] = [];
                arr[i-1][0].forEach((elem)=>{arr[i][0].push(JSON.stringify(thread2[i-1](JSON.parse(elem), thread2Info)))})
                arr[i][0] = arr[i][0].flat()


            }
            else{
                let temp = []; 

                arr[i-1][j].forEach((elem)=>{

                    temp.push(JSON.stringify(thread2[i-1](JSON.parse(elem), thread2Info)))})

                temp = temp.flat();
                
                let temp2 = []; 
                arr[i][j-1].forEach((elem)=>{temp2.push(JSON.stringify(thread1[j-1](JSON.parse(elem), thread1Info)))})
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

function initialize(){
    let thread1 = [
        (state,info) => {
            let x = state.x;
            let y = state.y1;
            if(eval(info.comp)){
                state.inIf1 = true
                
            }
            else{
                state.inIf1 = false;
            }
            
            return state
        },

        (state, info) => {
            let x = state.x;
            let y = state.y1;
            if(state.inIf1){
                if (info.operandIf[0] == "x"){
                    state.x = eval(info.changeIf[0])
                }else{
                    state.y1 = eval(info.changeIf[0])
                }
            }
            return state
        },

        (state, info) => {
            let x = state.x;
            let y = state.y1;
            if(state.inIf1){
                if (info.operandIf[1] == "x"){
                    state.x = eval(info.changeIf[1])
                }else{
                    state.y1 = eval(info.changeIf[1])
                }
            }
            return state
        },
        
        (state, info) => {
            let x = state.x;
            let y = state.y1;
            if(!state.inIf1){
                if (info.operandElse[0] == "x"){
                    state.x = eval(info.changeElse[0])
                }else{
                    state.y1 = eval(info.changeElse[0])
                }
            }
            return state
        },

        (state, info) => {
            let x = state.x;
            let y = state.y1;
            if(!state.inIf1){
                if (info.operandElse[1] == "x"){
                    state.x = eval(info.changeElse[1])
                }else{
                    state.y1 = eval(info.changeElse[1])
                }
            }
            return state
        }
    ]

    let thread2 = [
        
        (state,info) => {
            let x = state.x;
            let y = state.y2;
            if(eval(info.comp)){
                state.inIf2 = true
                
            }
            else{
                state.inIf2 = false;
            }
            
            return state
        },

        (state, info) => {
            let x = state.x;
            let y = state.y2;
            
            if(state.inIf2){
                if (info.operandIf[0] == "x"){
                    state.x = eval(info.changeIf[0]);
                }else{
                    state.y2= eval(info.changeIf[0]);
                }
            }
            return state
        },

        (state, info) => {
            let x = state.x;
            let y = state.y2;
            
            if(state.inIf2){
                if (info.operandIf[1] == "x"){
                    state.x = eval(info.changeIf[1]);
                }else{
                    state.y2= eval(info.changeIf[1]);
                }
            }
            return state
        },

        (state, info) => {
            let x = state.x;
            let y = state.y2;
            if(!state.inIf2){
                if (info.operandElse[0] == "x"){
                    state.x = eval(info.changeElse[0]);
                }else{
                    state.y2 = eval(info.changeElse[0]);
                }
            }
            return state
        },

        (state, info) => {
            let x = state.x;
            let y = state.y2;
            if(!state.inIf2){
                if (info.operandElse[1] == "x"){
                    state.x = eval(info.changeElse[1]);
                }else{
                    state.y2 = eval(info.changeElse[1]);
                }
            }
            return state
        }
    ]
    const state = generateInitialState();//{x: 4, y1:9, y2:3, inIf1: false, inIf2: false}
    const thread1Info = generateThreadInfo();//{comp: "x==1", operand1: "x", operand2: "y", change1: "x-y", change2: "y+1"}
    let flag = false;
    if(thread1Info.lineSizeIf == 2||thread1Info.lineSizeElse ==2){
        flag = true
    }
    const thread2Info = generateThreadInfo(flag);//{comp: "y==6", operand1: "y", operand2: "x", change1: "y=x", change2: "x+9"}

    let text = generateText(state, thread1Info, thread2Info);

    return {state: state, text: text, thread1Info: thread1Info, thread2Info: thread2Info, thread1: thread1, thread2: thread2};
}

function possibleFinalStates(stateArr, thread1Length, thread2Length){
    let finalState = stateArr[thread2Length][thread1Length];
    let ret = []

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

console.log(gatherGenerationStatistics())

// let problem = initialize();

// let stateArr = stateChange(problem.state, problem.thread1Info, problem.thread2Info, problem.thread1, problem.thread2)
// let finalState = possibleFinalStates(stateArr, problem.thread1.length, problem.thread2.length)
// console.log(problem.text.initial)
// console.log(problem.text.t1)
// console.log(problem.text.t2)
// console.log(stateArr)
// console.log(finalState)