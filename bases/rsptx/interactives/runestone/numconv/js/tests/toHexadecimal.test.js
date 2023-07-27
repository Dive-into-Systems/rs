const toHexadecimal = require("./toHexadecimal")
const toHexadecimal2 = require("./toHexadecimal")
var num_bits = 8;
for ( var i = 0 ; i <= 255 ; i ++ ) {
    test("Test to Hexadecimal", () => {
        expect(toHexadecimal2(i)).toBe(toHexadecimal(i));
    });
}