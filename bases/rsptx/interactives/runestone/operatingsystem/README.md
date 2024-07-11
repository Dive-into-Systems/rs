# Fork

The Fork problem can randomly generate a block of C-code with calls to `fork()`, `wait()`, `exit()`. The purpose is to help students understand concepts such as process state and hierarchy. With that goal, this component supports drawing process hierarchy trees and execution timelines from the C-code.

## How to get it built

We need some support from the D3.js library (already added to dependencies), so make sure to run `npm install` again if you're using an older version of the node modules.

## Tunable parameters

There are two places where you can adjust how this component behaves. 

### In user interface

If the webpage successfully builds, you'll see that you can generate question from complexity level **1**, **2**, and **3**. Here's what they mean:

- **Level 1**: 2 `fork()` calls, 2-3 `printf`, with `if` statements but not `else`.
- **Level 2**: 3-4 `fork()` calls, 3-4 `printf`, with `if-else` statements and `exit`.
- **Level 3**: 3-4 `fork()` calls, 3-4 `printf` with `for` loops and `exit`.

*Please note that the number of forks and prints is what will show up in the C code, **not** how many of these operations will actually be executed in execution.*

### In PreTeXt file

You can also limit the flexibilities given to the user by making changes to `<script>` in `.ptx` files. There is an example below.
Please note that if you do not define `complexityLevel`, you will **have to define** all the other parameters listed below.

- complexityLevel: (string) it could be either `'1'`, or `'2'`, or `'3'`. Setting this parameter means that you will take the pre-config modes illustrated above. 

- numForks: (int, or a array of int) indicates how many `fork()` calls you want to have in C-code. 
- numPrints: (int, or a array of int) indicates how many print statements you want to have C-code.
- hasElse: (boolean) indicates if you want have an `else` following a `if` block. (We will always at least have some `if` blocks)
- hasExit: (boolean) indicates if you want call(s) to `exit()`.
- hasLoop: (boolean) indicates if you want `for` structures.

## Examples

### A basic example

```html
<div class="ptx-runestone-container">
  <div class="runestone">
    <div data-component="fork" data-question_label="1" id="test_fork"></div>
  </div> <!--runestone-->
</div> <!--ptx-runestone-container-->
```

You don't have to have the `<script>` section, like this example. It will generate the default complexity level menu and options from which users can choose.

### A more colorful example

Making these changes in `<script>` generates you a question that contains 2 forks, 3 or 4 prints, with `else` block(s), call(s) to `exit()`, and for-loop structure.
```html
<div class="ptx-runestone-container">
  <div class="runestone">
    <div data-component="fork" data-question_label="1" id="test_fork"></div>
    <script type="application/json">
      {
        "numForks": 2,
        "numPrints": [3, 4], 
        "hasExit": true,
        "hasElse": false,
        "hasLoop": true.
      }
    </script>
  </div> <!--runestone-->
</div> <!--ptx-runestone-container-->
```