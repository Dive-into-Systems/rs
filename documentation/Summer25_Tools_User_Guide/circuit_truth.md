## Circuit Truth
Circuit truth generates a circuit and asks the user to fill in a truth table. It generates the circuit using the
circuit_generator class found in circuit_generate.js, which has detailed comments about usage and functionality. 

This component has two modes:
1. Generates two inputs and 2-3 gates.
2. Generates three inputs and 3-5 gates.

## Constraints
Due to gate placement constraints, the following are invariants:
1. Gate A will be one of the gates generated.
2. The boolean statement represented by the circuit will not be of the form "INPUT1 GATE INPUT1", i.e., the same
input will not appear on both sides of a gate.
3. The boolean statemend represented by the circuit will not be of the form "A GATE (A GATE C)", or i.e.,
the A and C cannot appear as both an input to an expression and an input to a subexpression.

## Prepopulating circuits
Users are able to prepopulate the exercise by passing in a JSON object.
There are two fields:
1. "statement": a boolean algebra statement (string) that is represented by the circuit.
2. "disable-generate" " a boolean that disables the generate another function if set to true.

The following are constraints should be observed when prepopulating circuits:
1. The available gates that may be used are "AND, OR, XOR, NAND, NOR, NOT".
2. The available inputs that may be used are "A, B, C".
3. The circuit tool supports up to 7 gates with readable placement. Additional gates will still function
but may be hard to read.
4. For good circuit placement, abide by the same invariants as outlined in the previous section.

## Examples of prepopulating the circuit
```html
<div class="ptx-runestone-container">
            <div class="runestone">
            <div data-component="test_circuittruth" data-question_label="1" id="test_circuittruth">
            <script type="application/json">
                {"statement": "(A AND B) NOR (B XOR C)",
                "disable-generate": false}
              </script>

              <style>
                body{
                  overflow-y: hidden;
                  overflow-x: hidden;
                }
              </style>

          </div>
          </div> <!--runestone-->
</div> <!--ptx-runestone-container-->
```
