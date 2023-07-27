const toBinary = require("./toBinary")
const toBinary2 = require("./toBinary")
var num_bits = 8;
for ( var i = 0 ; i <= 255 ; i ++ ) {
    test("Test to Binary", () => {
        expect(toBinary2(i)).toBe(toBinary(i));
    });
}