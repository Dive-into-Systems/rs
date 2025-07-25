<h2>Bin Arith</h2>

This component is designed to help students practice binary addition/subtraction. It can be prepopulated! Here are code examples:

```xml
    <div class="runestone">
    <div data-component="binarith" data-question_label="2" id="test_bitwise_arithmetic">
      <script type="application/json">
        {
          "operand1" : "0101",
          "operand2" : "0101",
          "operation" : "SUBTRACTION",
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

<img width="690" height="388" alt="image" src="https://github.com/user-attachments/assets/16696ca9-2eb0-42a1-a490-f44af617a121" />

```xml
    <div class="runestone">
      <div data-component="binarith" data-question_label="2" id="test_bitwise_arithmetic">
        <script type="application/json">
          {
            "operand1" : "000001",
            "operand2" : "100000",
            "operation" : "ADDITION",
            "num_bits" : 6,
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
<img width="690" height="697" alt="image" src="https://github.com/user-attachments/assets/2b7582d4-c8df-4816-98de-f87e389580a5" />

<h4> Parameters</h4>
There are four parameters that are necessary for prepopulating the component. If you aren't prepopulating, you can pass in an empty JSON object to the component.

<ol>
  <li>operand1: A string containing the first operand in binary</li>
  <li>operand2: A string containing the second operand in binary</li>
  <li>operation: the operation that will be performed in the prepopulated question. Two possible values: "ADDITION" or "SUBTRACTION" </li>
  <li>allowAMA: true if the user allowed to generate new questions afterwards</li>
</ol>

