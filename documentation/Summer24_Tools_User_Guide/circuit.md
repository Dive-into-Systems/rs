# circuit (Logic Circuit)
This tool tests the user knowledge on logic gates. Ideally, the component randomly generates a logic gate circuit with visualization and the user needs to fill out the truth table that the circuit will output. 

Source code is at `rs/bases/rsptx/interactives/runestone/circuit/circuit.js`. I added many in-line explanation and how I designed the whole component in the `js` file.

If you want to visualize the component for now: https://codepen.io/Yana-Yuan/pen/XWLbKwJ?editors=1011 (this is an online JS/CSS/HTML compiler that allows you to see real-time changes)

Sample of the GoJS library used: https://gojs.net/latest/samples/logicCircuit.html

GoJS's github source code: https://github.com/NorthwoodsSoftware/GoJS/blob/master/samples/logicCircuit.html



## How to get it built

This is not a complete runestone component yet. It only has functions that support the functionality of the component. Need to add the keyword `circuit` in the `.ptx` file after the complete component is built.

## Tunable parameters

Currently, the tunable parameters are set below. But everything is adjustable.
- `gates = ['AND', 'OR', 'XOR', 'NAND', 'NOR']`: The gates that might appear in the circuit. It is currently defined as `const` in the source code, but it supports removal of gates. If wanting to add more gates, many functions need to be modified in the source code.
- `maxGates`: by setting exactGates to 0, program is able to generate a circuit with max number of gates determined by maxGates variable.
- `exactGates`: set exactly how many gates will be generated in the circuit. Doesn't matter what maxGates is set to.
- `notGateChance = 0.5`: Chance of not generating any gates in the cicuit expression when generating subexpression.
- `notChance = 0.08`: Chance of generating a NOT gate in the cicuit expression when generating subexpression.
