##Circuit Truth
Circuit truth generates a circuit and asks the user to fill in a truth table. It generates the circuit using the
circuit_generator class found in circuit_generate.js, which has detailed comments about usage and functionality. 

This component has two modes:
1. Generates two inputs and 2-3 gates.
2. Generates three inputs and 3-5 gates.

Due to gate placement constraints, the following are invariants:
1. Gate A will be one of the gates generated.
2. The boolean statement represented by the circuit will not be of the form "INPUT1 GATE INPUT1", i.e., the same
input will not appear on both sides of a gate.
3. The boolean statemend represented by the circuit will not be of the form "A GATE (A GATE C)", or i.e.,
the A and C cannot appear as both an input to an expression and an input to a subexpression.

