// test toHexadecimal
function toHexadecimal(num) {
    var str = num.toString(16);
    var target_len = Math.ceil(this.num_bits / 4);
    if (str.length < target_len) {
        var leading_zeros = "";
        for ( var i = str.length ; i < target_len; i ++ ) {
            leading_zeros += "0";
        }
        str = leading_zeros + str;
    }
    return str;
}

function toHexadecimal2(num) {
    ans = ""
    while (num > 0) {
        const remainder = num % 16;
        const digit = 
            remainder < 10 ? String(remainder) : String.fromCharCode(remainder + 87);
        ans = digit + ans;
        num = Math.floor(num / 16);
    }
    return ans
}

module.exports = toHexadecimal
module.exports = toHexadecimal2