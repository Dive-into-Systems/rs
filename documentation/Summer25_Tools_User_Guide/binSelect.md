
<h2>BinSelect</h2>

This component is intended to help students practice binary arithmetic.

It can be prepopulated! If you don't want it to be prepopulated, simply leave the curly braces empty: {} .

Here are two examples"

```xml
          <div class="runestone">
          <div data-component="binselect" data-question_label="2" id="test_operator_select">
            <script type="application/json">
              {
                "operand1" : "0001",
                "operand2" : "0001",
                "result" : "0010",
                "allowedOps" : [true, true, false, true, false, false, false, false],
                "num_bits" : 4,
                "operation" : "ADDITION",
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
```
Looks like


<img width="690" height="471" alt="image" src="https://github.com/user-attachments/assets/e07f237d-cdfa-476c-9ec0-df455a15abbb" />


```xml
          <div class="runestone">
          <div data-component="binselect" data-question_label="2" id="test_operator_select">
            <script type="application/json">
              {
                "operand1" : "0001",
                "operand2" : "0001",
                "result" : "0010",
                "allowedOps" : [false, true, true, true, false, true, false, false],
                "num_bits" : 4,
                "operation" : "SUBTRACTION",
                "allowAMA" : false
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
```


Looks like


<img width="690" height="559" alt="image" src="https://github.com/user-attachments/assets/a1bed9c7-7905-416f-b51e-cea6e211709d" />

<h3>Parameters</h3>

There are a couple things to note: This component supports a limited amount of operations:
"ADDITION", "SUBTRACTION", "AND", "OR", "XOR", "Left Shift", "Right Shift(Logical)", "Right Shift(Arithmetic)"
This is also the order that they show up in the operations select box.

Here are the parameters
<ol>
          <li>operand1: the first (top) operand in binary</li>
          <li>operand2: the second (bottom) operand in binary</li>
          <li>result: the result in binary.</li>
          <li>allowedOps: an array of which operations will be allowed at the start. True if allowed, false if not allowed. The ordering of the values in the array correspond to the operations above</li>
          <li>num_bits: the number of bits needed to represent the values. Either 4, 6, or 8.</li>
          <li>operation: I've made this parameter manditory (though I guess it's somewhat unecessary). This is the operation you did to obtain the result from the two numbers. It must be one of the strings listed above (I'd just copy paste from there)</li>
          <li>allowAMA: true if the user is allowed to generate new questions afterwards.</li>
</ol>

