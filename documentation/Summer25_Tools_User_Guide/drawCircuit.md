## Main idea:

This exercise generates a truth table and asks the user to make the corresponding circuit.
To generate the truth table, it uses Bohou's circuit generation functions, then converts the result to a truth table.

There are two modes:
1. Two inputs and one outputs. You can only use basic gates
2. Three inputs and two outputs. You can use the full set of gates, including XOR and NAND

The circuit rendering/interactivity is powered by GOjs.

## Prepopulating

You can prepopulate the exercise by passing in JSON to the component.
Here are two examples: 

```html
<div class="ptx-runestone-container">
    <div class="runestone">
        <div data-component="drawCircuit" data-question_label="1" id="drawCircuit3">
            <script type="application/json">
                {
                    "truthTable" : [[0,0,1],[0,1,0], [1,0,0], [1,1,1]],
                    "numOutputs" : 1,
                    "numInputs" : 2,
                    "advancedGates" : false,
                    "allowAMA" : true
                  
                }
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

```html
<div class="ptx-runestone-container">
    <div class="runestone">
        <div data-component="drawCircuit" data-question_label="1" id="drawCircuit3">
            <script type="application/json">
                {
                    "truthTable" : [[0,0,0,1,1],[0,0,1,0,1], [0,1,0,0,1], [0,1,1,0,1], [1,0,0,0,1], [1,0,1,0,1], [1,1,0,0,1], [1,1,1,1,1]],
                    "numOutputs" : 2,
                    "numInputs" : 3,
                    "advancedGates" : false,
                    "allowAMA" : true
                }
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
There are 5 parameters:
truthTable: a 2d array specifying the truth table you want to prepopulate the exercise with. Each subarray represents a row of the truth table.
numInputs: the number of outputs in the circuit
numInputs: the number of inputs to the circuit
advancedGates: true if the user can use gates like XOR and NAND. Otherwise, they will not be available to the user
allowAMA: true if the user can generate new questions afterwards

I've my best to validate the input within the code itself, though it might not catch all possible misinputs.