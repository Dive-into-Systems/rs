// test toBinary
function toBinary(num, num_bits) {
    var str = num.toString(2);
    if (str.length < num_bits) {
        var leading_zeros = "";
        for ( var i = str.length ; i < num_bits; i ++ ) {
            leading_zeros += "0";
        }
        str = leading_zeros + str;
    }
    return str;
}

function toBinary2(num) {
    ans = ""
    while (num > 0) {
        if (num % 2 == 1) {
            ans += "1"
            num = (num-1)/2
        } else {
            ans += "0"
            num = num / 2
        }
    }
    return ans
}
module.exports = toBinary
module.exports = toBinary2

// var num_bits = 8;
// for ( var i = 0 ; i <= 255 ; i ++ ) {
//     // test("Test to Binary", () => {
//     //     expect(toBinary(i, num_bits)).toBe(toBinary2(i));
//     // });
//     console.log(toBinary(i, num_bits));
// }

// <!DOCTYPE html>
// <html>
// <body>

// <h1>JavaScript Functions</h1>

// <p>Call a function which performs a calculation and returns the result:</p>

// <p id="demo"></p>

// <script>
// let x = myFunction(4, 3);decimal 
// document.getElementById("demo").innerHTML = x;

// function myFunction(a, b) {
//   return a * b;
// }
// </script>

// </body>
// </html>
