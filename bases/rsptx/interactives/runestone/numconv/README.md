# numberconversion
Number Conversion is a RuneStone component that can **automatically generate** exercises on **number representation conversion**.

## Usage
Notice: Currently only works in ```.html```. It hasn't implemented in ```.rst``` or ```.ptx```.
- keyword: ```data-component = numberconversion```
- passing parameter: Use JSON to pass in optional parameters 
    - ```"bits"```: specifies the number of binary bits in the exercise questions that user want to give to their students. The default number of bits is **8**.
    - ```"from-options"```: specifies the selectable number representations given in the prompt. By default, every option is granted, including ```["binary", "decimal-unsigned", "decimal-signed", "hexadecimal"]```.
    - ```"to-options"```: specifies the selectable number representations given as an answer. By default, every option is granted, including ```["binary", "decimal-unsigned", "decimal-signed", "hexadecimal"]```.

### Usage Example
**Example 1**: Exercise creation with personalized parameters
```html
<section id="number-conversion">
<h1>number Conversion</h1>
    <p>Test 1 - test the number conversion component.</p>

    <!-- creation of the exercise -->
    <div class="runestone ">
    <div data-component="numberconversion" data-question_label="1" id="test_number_conversion"  style="visibility: hidden;">
        <!-- parameter setting of the exercise -->
        <script type="application/json">
            {
                "bits": 16, 
                "from-options" : ["binary", "decimal-unsigned", "decimal-signed"], 
                "to-options" : ["binary", "hexadecimal"]
                }
        </script>
    </div>
    </div>
</section>
```

**Example 2**: Exercise creation with default parameters
```html
<section id="number-conversion-2">
<h1>number Conversion 2</h1>
    <p>Test 2 - test the number conversion component.</p>

    <!-- creation of the exercise -->
    <div class="runestone ">
    <div data-component="numberconversion" data-question_label="2" id="test_number_conversion"  style="visibility: hidden;">
        <!-- parameter setting of the exercise -->
        <script type="application/json">
            {}
        </script>
    </div>
    </div>
</section>
```

# binops
This tool helps the user to test their knowledge on bitwise operation. The user will be given random problems with selected bitwise operators and check their answer. 

## How to get it built

You can use the keyword `binops` to refer to this tool in a `.ptx` file. (An example is provided below).

## Tunable parameters

- `num_bits`: An integer that controls the length of numbers generated in the prompt. (default: 4)
- `fromOpt`: A list of bitwise operators among which the user can select. We currently support `AND`, `OR`, `XOR`, `NOT`, `Left Shift`, `Right Shift (Arithmetic)`, `Right Shift (Logical)`. You can only choose a sub-array from them.
- `toOpt`: A list that contains different numbers of bits the numbers in the prompt can be. We currently support `4`, `6`, `8`. You can choose integers other than the three listed.

## Usage example

### A basic example

```html
<div class="ptx-runestone-container">
  <div class="runestone">
    <!--the 'binops' keyword below is what you need to refer to the tool-->
    <div data-component="binops" data-question_label="1" id="test_bitwise_operation"></div>
  </div> <!--runestone-->
</div> <!--ptx-runestone-container-->
```

### An example with tunable parameters

```html
<div class="ptx-runestone-container">
  <div class="runestone">
    <div data-component="binops" data-question_label="1" id="test_bitwise_operation"></div>
    <script type="application/json">
      {
        "num_bits": 6,
        "fromOpt": [`AND`, `OR`, `NOT`, `XOR'],
        "toOpt": [4, 5, 6]
      }
    </script>
  </div> <!--runestone-->
</div> <!--ptx-runestone-container-->
```


# bincalc
This tool is a specialized binary calculator. It allows users to do bitwise operations on 6-bit binary numbers (configurable) and to see the result.

## How to get it built

You can use the keyword `bincalc` to refer to this tool in a `.ptx` file. (An example is provided below).

## Tunable parameters

- `numBits`: (int) It controls the length of both binary numbers generated. (default: 6)
- `operatorList`: We currently support `AND (&)`, `OR (|)`, `XOR (^)`, `NOT (~)`, `Left shift (<<)`, `Logical right shift (>>)`, `Arithmetic right shift (>>)`. You can choose a sub-array from them. (default listed above)
- `bitShiftList`: In the shift operations, we can choose how many bits to shift by. Please keep in mind that this list should contain values reasonable with respect to your chosen `numBits`. (default: `[1, 2, 3, 4, 5]`)

## Usage example

### A basic example

```html
<div class="ptx-runestone-container">
  <div class="runestone">
    <!--the 'bincalc' keyword below is what you need to refer to the tool-->
    <div data-component="bincalc" data-question_label="1" id="binary_calculator"></div>
  </div> <!--runestone-->
</div> <!--ptx-runestone-container-->
```

You don't have to have the `<script>` section, like in this example. It will generate the question with all the tunable parameters in their default values.

### A more colorful example

```html
<div class="ptx-runestone-container">
  <div class="runestone">
    <div data-component="bincalc" data-question_label="1" id="binary_calculator"></div>
    <script type="application/json">
      {
        "numBits": 8,
        "operatorList": [`Left shift (<<)`, `Logical right shift (>>)`, `Arithmetic right shift (>>)`],
        "bitShiftList": [2, 3, 4]
      }
    </script>
  </div> <!--runestone-->
</div> <!--ptx-runestone-container-->
```

Making these changes in `<script>` allows you to generate one 8-bit binary number, with `Left shift (<<)`, `Logical right shift (>>)`, and `Arithmetic right shift (>>)` appearing as allowed operations in the menu, where you can explore the results by shifting the binary number by 2, 3, or 4.

