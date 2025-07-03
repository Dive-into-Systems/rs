// x = 3
// Side 1

// int y = 2;
// if(x > 2){
//     x = 4
// }
// else{
//     y = 2
// }

//side 2

// int y = 3
// if(x < 4){
//     x = 1
// }
// else{
//     y = 5;
// }


const thread1 = [
        (state) => {
            
            if(state.x > 2){
                state.inIf1 = true
                
            }
            else{
                state.inIf1 = false;
            }
            
            return state
        },
        
        (state) => {

            if(state.inIf1){
                
                state.x = 4
            }
            else{
                
                state.y1 = 2
            }
            return state
        },
    ]

const thread2 = [
    
    (state) =>{
        
        if(state.x < 4){
            state.inIf2 = true
        }
        else{
            state.inIf2 = false
        }
        return state
    },
    
    (state) => {
        if(state.inIf2){
            state.x = 1
        }
        else{
            state.y2 = 5
        }
        return state
    }
]


let state = {x : 3, y1: 2, y2:3, inIf1: false, inIf2: false}



// function stateChange(state){
//     let arr = [[]]

//     arr[0][0] = state

//     //first cordinate is x, second is y
//     // side 1 is on x axis, side 2 is on y
//     arr[1][0] = thread1[0](arr[0][0])
//     arr[0][1] = thread2[0](arr[0][0])
    
//     let result = []
//     for(elem of arr[1][0]){
//         result.push(thread2[0](elem))
//     }
//     for(elem of arr[0][1]){
//         result.push(thread1[0](elem))
//     }

//     arr[1][1] = result

//     for(let i = 0; i< thread1.length; i++){
        
//         for (let j = 0; j<thread2.length; j++){
//             if(i == 0){
//                 //continue through thread 1
                
//             }
//             if(j == 0){
//                 //conitue through thread 2
//             }

//                 let arr = [[]]

                
//                 arr[0][0] = state

//                 //first cordinate is x, second is y
//                 // side 1 is on x axis, side 2 is on y
//                 arr[1][0] = thread1[0](arr[0][0])
//                 arr[0][1] = thread2[0](arr[0][0])
                
//                 let result = []
//                 for(elem of arr[1][0]){
//                     result.push(thread2[0](elem))
//                 }
//                 for(elem of arr[0][1]){
//                     result.push(thread1[0](elem))
//                 }
            
//     }
//     }
// }

// (1) start at an index we have the value of
// (2) get the result of thread1() going one unit to the right
// (3) get the reuslt of thread2() going one unit down
// perform thread(1) on the result of thread2() and vice versa. Put the result in the square one down and one to the right (do necessary flattennig)
// 

function stateChange(state){
    let arr = [];
    for(let n = 0; n<thread1.length; n++){
        let temp = [];
        for (let m = 0; m < thread2.length; m++){
            temp.push('')
        }
        arr.push(temp)
    }

    arr[0][0] = [JSON.stringify(state)]

    let i;
    let j;
    for(i = 0; i< thread1.length; i++){

        for (j = 0; j<thread2.length; j++){
            if(i==0 && j==0){
                continue;
            }
            else if(i == 0){
                //continue through thread 1
                arr[0][j] = [];
                arr[0][j-1].forEach((elem)=>{arr[0][j].push(JSON.stringify(thread1[j-1](JSON.parse(elem))))})
                arr[0][j] = arr[0][j].flat()
                
            }
            else if(j == 0){   

                arr[i][0] = [];
                arr[i-1][0].forEach((elem)=>{arr[i][0].push(JSON.stringify(thread2[i-1](JSON.parse(elem))))})
                arr[i][0] = arr[i][0].flat()

            }
            else{
                let temp = []; 
                arr[i-1][j].forEach((elem)=>{temp.push(JSON.stringify(thread1[i](JSON.parse(elem))))})
                temp = temp.flat();
                
                let temp2 = []; 
                arr[i][j-1].forEach((elem)=>{temp2.push(JSON.stringify(thread1[i](JSON.parse(elem))))})
                temp2 = temp2.flat();

                arr[i][j] = []
                arr[i][j].push(temp);
                arr[i][j] = arr[i][j].flat();

                arr[i][j].push(temp2);
                arr[i][j] = arr[i][j].flat();      
            }
        }
        

    }
    for(i = 0; i< 2; i++){
        for(j=0; j<2; j++)[
            console.log(arr[i][j])
        ]
    }
    return arr
}

stateChange(state)