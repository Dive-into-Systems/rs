const thread1 = [
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
                if (info.operand1 == "x"){
                    state.x = eval(info.change1)
                }else{
                    state.y1 = eval(info.change1)
                }
            }
            else{
                if (info.operand2 == "x"){
                    state.x = eval(info.change2)
                }else{
                    state.y1 = eval(info.change2)
                }
            }
            return state
        },
    ]

const thread2 = [
    
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
            if (info.operand1 == "x"){
                console.log("x:" + x);
                console.log("y:" + y)
                state.x = eval(info.change1);
                console.log("info.change:" + info.change1)
                console.log("state.x:" + state.x)
            }else{
                state.y2= eval(info.change1);
            }
        }
        else{
            if (info.operand2 == "x"){
                state.x = eval(info.change2);
            }else{
                state.y2 = eval(info.change2);
            }
        }
        return state
    },
]


let state = {x : 3, y1: 2, y2:3, inIf1: false, inIf2: false}
const thread1Info = generateThreadInfo()
const thread2Info = generateThreadInfo()

function generateText(state, thread1Info, thread2Info){
    let initialText = `int x = ${state.x};\n`

    let thread1Text = `int y = ${state.y1};\n`
    thread1Text += `if (${thread1Info.comp}){\n`
    thread1Text += `    ${thread1Info.operand1} = ${thread1Info.change1};\n`
    thread1Text += `} else{\n   ${thread1Info.operand2} = ${thread1Info.change2};\n}\n`
    thread1Text += `print("%d %d", x, y);`

    let thread2Text = `int y = ${state.y2};\n`
    thread2Text += `if (${thread2Info.comp}){\n`
    thread2Text += `    ${thread2Info.operand1} = ${thread2Info.change1};\n`
    thread2Text += `} else{\n   ${thread2Info.operand2} = ${thread2Info.change2};\n}\n`
    thread2Text += `print("%d %d", x, y);`

    return {initial: initialText, t1: thread1Text, t2: thread2Text};
}

function generateThreadInfo(){
    let comp;
    let operand1;
    let operand2;
    let change1;
    let change2;

    const operatorComp = ["=", "<=", ">=", "<", ">", "!"];
    let operatorChange = ["+", "-", "="]
    let operands = ["x", "y", "const"];

    const compareOP = operatorComp[Math.floor(Math.random()*operatorComp.length)];
    const OPcompare1 = operands[Math.floor(Math.random()*(operands.length-1))];
    let temp = operands.filter(item => item!=OPcompare1);
    let OPcompare2 = temp[Math.floor(Math.random()*temp.length)];

    if(OPcompare2 == "const"){
        OPcompare2 = Math.floor(Math.random()*10);
    }

    const changeOP1 = operatorChange[Math.floor(Math.random()*operatorChange.length)];
    operatorChange = operatorChange.filter(item=>item!=changeOP1);

    const changeOP2 = operatorChange[Math.floor(Math.random()*operatorChange.length)];

    const op1 = operands[Math.floor(Math.random()*(operands.length-1))];
    temp = operands.filter(item => item!=op1);
    let op2 = temp[Math.floor(Math.random()*temp.length)];

    if(op2 == "const"){
        op2 = Math.floor(Math.random()*(9+1))+1;
    }

    if(compareOP == "!"){
        comp = `!${OPcompare1}`
    }else{
        comp = `${OPcompare1} ${compareOP} ${OPcompare2}`
    }

    operand1 = op1
    if (changeOP1 == "="){
        change1 = `${op2}`
    }else{
        change1 = `${op1} ${changeOP1} ${op2}`
    }

    operands = operands.filter(item =>item!=op1);
    const op3 = operands[Math.floor(Math.random()*(operands.length-1))];
    operand2 = op3
    temp = operands.filter(item => item!=op3);
    let op4 = temp[Math.floor(Math.random()*temp.length)]

    if(op4 == "const"){
        op4 = Math.floor(Math.random()*(9+1))+1;
    }

    if (changeOP2 == "="){
        change2 = `${op4}`
    }else{
        change2 = `${op3} ${changeOP2} ${op4}`
    }

    

    const thread = {comp: comp, operand1: operand1, operand2: operand2, change1: change1, change2: change2}
    return thread
}

function generateInitialState(){

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

function stateChange(state){
    let arr = [];
    for(let n = 0; n<=thread1.length; n++){
        let temp = [];
        for (let m = 0; m <=thread2.length; m++){
            temp.push('')
        }
        arr.push(temp)
    }

    arr[0][0] = [JSON.stringify(state)]

    let i;
    let j;
    for(i = 0; i <= thread1.length; i++){

        for (j = 0; j<= thread2.length; j++){
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
                console.log("break")
                arr[i-1][j].forEach((elem)=>{
                    console.log("elem: " + elem);
                    temp.push(JSON.stringify(thread2[i-1](JSON.parse(elem), thread2Info)))})
                console.log("temp: " + temp)
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
    // for(i = 0; i< 3; i++){
    //     for(j=0; j<3; j++)[
    //         console.log(arr[i][j])
    //     ]
    // }
    return arr
}

let stateArr =stateChange(state)
let text = generateText(state, thread1Info, thread2Info)

console.log(text.initial)
console.log(text.t1)
console.log(text.t2)

console.log(stateArr)