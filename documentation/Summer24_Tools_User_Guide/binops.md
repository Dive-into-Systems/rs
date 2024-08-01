# binops (bitwise operation)
This tool tests the user knowledge on bitwise operation. The user will be given random bitwise operation problems with a list of bitwise operators that the user can choose from and check their answer. 

Source code is at `rs/bases/rsptx/interactives/runestone/numconv/js/binops.js`.

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
