///generate every possible binary number for 0000 to 1111
// this doewsn't work
let FourBitNums = []

generateAllMatchings = (arr1, arr2, func) => {
    arr1.forEach(e1 => {
        arr2.forEach(e2 => {
            func(e1, e2)
        })
    });
}
joinAndPush = (o1, o2) => {
    target = FourBitNums
    if(o1.length > 1 && o2.length > 1){
        target.push([...o1,...o2])
    }
    else if(o1.length > 1){
        target.push([...o1, o2])
    }
    if(o2.length > 1){
        target.push([o1,...o2])
    }
}

generateAllMatchings([0,1],[0,1], joinAndPush)
FourBitNums.forEach(e => console.log(e));