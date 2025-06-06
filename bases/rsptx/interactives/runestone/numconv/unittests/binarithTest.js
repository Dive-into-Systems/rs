///generate every possible binary number for 0000 to 1111
// this doewsn't work
let FourBitNums = []

generateAllMatchings = (arr1, arr2) => {
    target = [];
    arr1.forEach(e1 => {
        arr2.forEach(e2 => {
            if(e1.length > 1 && e2.length > 1){
                target.push([...e1,...e2])
            }
            else if(e1.length > 1){
                target.push([...e1, e2])
            }
            if(e2.length > 1){
                target.push([e1,...e2])
            }
            else{
                target.push([e1,e2])
            }
            
        })
    });
    return target;
}

NBitNums = (n=4) => {
    let temp = [1,0]
    for(let i = 0; i < (n-1);  i++){
        temp = generateAllMatchings([1,0], temp)
    }
    return temp
}

console.log(NBitNums())

