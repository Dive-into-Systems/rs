
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
        },

        ["changeIfMutex"]: (state, info, i) =>{
            let x = state.readFromx;
            let y = state.y1;
            if(state.inIf1){
                if (info.operandIf[i] == "x"){
                    state.writeTox = eval(info.changeIf[i])
                }else{
                    state.y1 = eval(info.changeIf[i])
                }
            }
            state.readFromx = state.writeTox
            return state;
        },
        
        ['changeElseMutex']: (state, info, i) => {
            let x = state.readFromx;
            let y = state.y1;
            if(!state.inIf1){
                if (info.operandElse[i] == "x"){
                    state.writeTox = eval(info.changeElse[i])
                }else{
                    state.y1 = eval(info.changeElse[i])
                }
            }
            state.readFromx = state.writeTox
            return state

        },

        ["evalIfMutex"]: (state, info, numLines)=>{

            let x = state.readFromx;
            let y = state.y1;
            if(eval(info.comp)){
                state.inIf1 = true
                for(let i = 0; i<numLines+1; i++){
                    state = threadTemplate1["changeIfMutex"](state, info, i);
                }
                
            }
            else{
                state.inIf1 = false;
            }
            
            return state
        },

        ["ifElseMutex"]: (state, info, numLinesIf, numLinesElse)=>{
            let x = state.readFromx;
            let y = state.y1;
            state = threadTemplate1["evalIfMutex"](state, info, numLinesIf);
            for (let i = 0; i<numLinesElse+1; i++){
                state = threadTemplate1["changeElseMutex"](state, info, numLinesElse);
            }
            return state;
        }
    
    }

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
        },

        ["changeIfMutex"]: (state, info, i) =>{
            let x = state.readFromx;
            let y = state.y2;
            if(state.inIf2){
                if (info.operandIf[i] == "x"){
                    state.writeTox = eval(info.changeIf[i])
                }else{
                    state.y2 = eval(info.changeIf[i])
                }
            }
            state.readFromx = state.writeTox
            return state;
        },
        
        ['changeElseMutex']: (state, info, i) => {
            let x = state.readFromx;
            let y = state.y2;
            if(!state.inIf2){
                if (info.operandElse[i] == "x"){
                    state.writeTox = eval(info.changeElse[i])
                }else{
                    state.y2 = eval(info.changeElse[i])
                }
            }
            state.readFromx = state.writeTox
            return state

        },

        ["evalIfMutex"]: (state, info, numLines)=>{
            let x = state.readFromx;
            let y = state.y2;
            if(eval(info.comp)){
                state.inIf2 = true
                for(let i = 0; i<numLines+1; i++){
                    state = threadTemplate2["changeIfMutex"](state, info, i);
                }
                
            }
            else{
                state.inIf2 = false;
            }
            
            return state
        },

        ["ifElseMutex"]: (state, info, numLinesIf, numLinesElse)=>{
            let x = state.readFromx;
            let y = state.y2;
            state = threadTemplate2["evalIfMutex"](state, info, numLinesIf);
            for (let i = 0; i<numLinesElse+1; i++){
                state = threadTemplate2["changeElseMutex"](state, info, numLinesElse);
            }
            return state;
        }
    }

function generateText(state, thread1Info, thread){

    let initialText = `<pre style="font-size: 18px; width:100%;">int x = ${state.readFromx};<br>int pthread_mutex_lock(pthread_mutex_t *mutex);</pre><br>`
    let threadText = `<pre style="font-size: 16px;">int y = ${state.y1};<br>`
    let firstElse = true;
    let unlockInstance = -1;
    let addMut = false;
    let inIf = false;
    let inElse = false;
    let evalIfMutex = false;
    const mut = new RegExp("Mutex");
    const ci = new RegExp("changeIf");
    const ce = new RegExp("changeElse")
    const mutIf = new RegExp("evalIf")
    let changeNumber;
    let allChanged = false;
    let i;

    thread = thread.filter(item=>item!="update");
    console.log(thread)
    for (i = 0; i<thread.length; i++){

        if(thread[i] == "ifElseMutex"){

            threadText += "pthread_mutex_lock(&mutex);<br>";
            thread[0] = "evalIf";
            let j = 0;
            for(j; j<thread1Info.lineSizeIf; j++){
                thread.splice(i+1+j, 0, `${j}changeIf`);
            }
            for(let k = 0; k<thread1Info.lineSizeElse; k++){
                thread.splice(i+1+k+j, 0, `${k}changeElse`);
            }
            unlockInstance = thread.length;
            allChanged = true;
            i--;
            continue;
        }


        if(ci.test(thread[i])||ce.test(thread[i])||(mutIf.test(thread[i])&&mut.test(thread[i]))){
            changeNumber = Number(thread[i].slice(0,1))
            thread[i] = thread[i].slice(1, thread[i].length);
        }

        if(mut.test(thread[i])){
            addMut = true;
            thread[i]=thread[i].replace("Mutex", "");
            if(ci.test(thread[i])||ce.test(thread[i])){
                unlockInstance = i+1;
                evalIfMutex = false;
            }else if (mutIf.test(thread[i])){
                unlockInstance = i+changeNumber+2
                evalIfMutex = true;
                for(let j = 0; j<thread1Info.lineSizeIf; j++){
                    thread.splice(i+1+j, 0, `${j}changeIf`)
                }
            }
        }

        if(firstElse && ce.test(thread[i])&&!(unlockInstance==i)){
            threadText += "}else{<br>"
            firstElse = false;
        }else if (firstElse && ce.test(thread[i])&&(unlockInstance==i)&&evalIfMutex){
            threadText += "     pthread_mutex_unlock()<br>}<br>else{<br>     pthread_mutex_unlock()<br>"
            firstElse = false;
            unlockInstance = -1;
        }else if (firstElse && ce.test(thread[i])&&(unlockInstance==i)&&!evalIfMutex){
            threadText += "     pthread_mutex_unlock()<br>}<br>else{<br>"
            firstElse = false;
            unlockInstance = -1;
        }

        if(addMut && !(inIf||inElse)){
            threadText += "pthread_mutex_lock(&mutex);<br>"
            addMut = false;
        }

        if(addMut && (inIf||inElse)){
            threadText += "     pthread_mutex_lock(&mutex);<br>"
            addMut = false;
        }

        if((i == unlockInstance) &&!(inIf||inElse)){
            threadText += "pthread_mutex_unlock();<br>"
            unlockInstance = -1
        }

        if((i == unlockInstance) &&(inIf||inElse)){
            threadText += "     pthread_mutex_unlock();<br>"
            unlockInstance = -1
        }

        switch(thread[i]){
            case "evalIf":
                threadText += `if (${thread1Info.comp}){<br>`;
                inIf = true;
                break;
            case "changeIf":
                threadText += `     ${thread1Info.operandIf[changeNumber]} = ${thread1Info.changeIf[changeNumber]};<br>`;
                break;
            case "changeElse":
                inIf=false;
                inElse = true
                threadText += `     ${thread1Info.operandElse[changeNumber]} = ${thread1Info.changeElse[changeNumber]};<br>`
        }


    }

    if(unlockInstance == i&&!allChanged){
        threadText += "     pthread_mutex_unlock();<br>"
        unlockInstance = -1
    }
    threadText += `}<br>print("%d %d", x, y);<br>`

    if(unlockInstance == i&&allChanged){
        threadText += "pthread_mutex_unlock();<br>"
        unlockInstance = -1
    }
    threadText+="return NULL;</pre>"

    return {initial: initialText, t1: threadText, t2: threadText};
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

function generateThreadInfo(mode, limitLineSize=false){

    let lineSizeIf
    let lineSizeElse
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

    if(lineSizeIf == 2){
        operandIf.push(Math.floor(Math.random()*2) ? "x":"y");
        operandIf.push((operandIf[0] == "x")?"y":"x");
    }else{
        operandIf.push(Math.floor(Math.random()*2) ? "x":"y");
    }

    if(lineSizeElse == 2){
        operandElse.push(Math.floor(Math.random()*2) ? "x":"y");
        operandElse.push((operandElse[0] == "x")?"y":"x");
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
    let readFromx = Math.floor(Math.random()*(7-2))+3;
    let coinFlip = Math.floor(Math.random()*2);
    let y1 = coinFlip ? Math.floor(Math.random()*(6))+1 : Math.floor(Math.random()*(9-4))+5;

    return {readFromx: readFromx, writeTox: readFromx, y1:y1, y2:y1, inIf1: false, inIf2: false}
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


export function stateChange(state, thread1Info, thread2Info, thread1, thread2){
    let arr = [];
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
    const regex = /\d/;
    for(i = 0; i <= thread2.length; i++){

        for (j = 0; j<= thread1.length; j++){
            if(i==0 && j==0){
                continue;
            }
            else if(i == 0){
                //continue through thread 1
                arr[0][j] = [];
                
                arr[0][j-1].forEach((elem)=>{

                    if(regex.test(thread1[j-1])){
                        arr[0][j].push(JSON.stringify(threadTemplate1[thread1[j-1].slice(1,thread1[j-1].length)](JSON.parse(elem), thread1Info, parseInt(thread1[j-1]))))
                    }else{
                        arr[0][j].push(JSON.stringify(threadTemplate1[thread1[j-1]](JSON.parse(elem), thread1Info)))
                    }
                    
                })
                arr[0][j] = arr[0][j].flat()

                
            }
            else if(j == 0){   

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
            else{
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


    const state = generateInitialState();//{x: 4, y1:9, y2:3, inIf1: false, inIf2: false}

    const thread1Info = generateThreadInfo(mode);//{comp: "x==1", operand1: "x", operand2: "y", change1: "x-y", change2: "y+1"}


    const thread2Info = thread1Info;

    let evalPossibilities = ["evalIf", "evalIfMutex"];

    let flag1 = Math.floor(Math.random()*2)
    let flag2 = Math.floor(Math.random()*2)
    let thread = [];
    thread.push(evalPossibilities[Math.floor(Math.random()*2)]);
    if(thread[0] == "evalIf"){
        for(let i = 0; i< thread1Info.lineSizeIf; i++){
            if(flag1){
                if(flag2){
                    thread.push(`${i}changeIf`);
                    thread.push(`update`);
                }else{
                    thread.push(`${i}changeIfMutex`);
                }
                flag2 = !flag2  
            }else{
                thread.push(`${i}changeIf`);
                thread.push(`update`);
            }
        }
        flag1 = !flag1
        for(let i = 0; i< thread1Info.lineSizeElse; i++){
            if(flag1){
                if(flag2){
                    thread.push(`${i}changeElse`);
                    thread.push(`update`);
                }else{
                    thread.push(`${i}changeElseMutex`);
                }
                flag2 = !flag2  
            }else{
                thread.push(`${i}changeElse`);
                thread.push(`update`);
            }
        }
    }else{
        thread[0] = `${thread1Info.lineSizeIf-1}evalIfMutex`
        for(let i = 0; i< thread1Info.lineSizeElse; i++){
            thread.push(`${i}changeElse`);
            thread.push(`update`);
        }
    }

    let mutFlag = false;
    const regEx = new RegExp("Mutex")
    for (let i = 0; i< thread.length; i++){
        if(regEx.test(thread[i])){
            mutFlag = true;
        }
    }
    if(!mutFlag){
        let random = Math.floor(Math.random()*thread.length)
        let string = thread[random]
        while(string == "update"){
            random = Math.floor(Math.random()*thread.length)
            string = thread[random]
        }
        if(string == "evalIf"){
            string = `${thread1Info.lineSizeIf-1}`+string;
            const CI = new RegExp("changeIf");
            for(let z = 0; z<thread.length; z++){
                if(CI.test(thread[z])){
                    thread.splice(z,1);
                }
            }
        }
        string = string+"Mutex";
        thread[random] = string;
    }

    
    const allRate = 0.15;
    if(Math.random()<allRate){
        thread = ["ifElseMutex"]
    }

    let text = generateText(state, thread1Info, thread);


    return {state: state, text: text, thread1Info: thread1Info, thread2Info: thread2Info, thread1: thread, thread2: thread};
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
        let stateArr = stateChange(problem.state, problem.thread1Info, problem.thread2Info, problem.thread1, problem.thread2, problem.threadTemplate1, problem.threadTemplate2);
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


let problem = initialize("2")
let stateArr = stateChange(problem.state, problem.thread1Info, problem.thread2Info, problem.thread1, problem.thread2)
let finalState = possibleFinalStates(stateArr, problem.thread1.length, problem.thread2.length)

console.log(stateArr)
console.log(finalState)
console.log(problem.text.initial)
console.log(problem.text.t1)