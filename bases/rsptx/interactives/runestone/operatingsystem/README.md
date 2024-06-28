# Fork

The Fork problem can randomly generate a block of C-code with calls to `fork()`, `wait()`, `exit()`. The purpose is to help students understand concepts such as process state and hierarchy. With that goal, this component supports drawing process hierarchy trees and execution timelines from the C-code.


## How to get it built

We need some support from the D3.js library (already added to dependencies), so make sure to run `npm install` again if you're using an older version of the node modules.

## Tunable parameters

There are two places where you can adjust how this component behaves. 

### In user interface

If the webpage successfully builds, you'll see that you can generate question from **easy**, **medium**, and **hard** modes. Here's what they mean:

- easy: 2 `fork()` calls, `if` statements without `else`.
- medium: 3 `fork()` calls, `if-else` statements, `exit`.
- hard: 3 `fork()` calls, `for` loops, `exit`.

### In PreTeXt file

You can also disable / limit the flexibilities given to the user by making changes to the `<script>` section in `.ptx` files. There is an example below.

- numForks: (int) indicates how many `fork()` calls you want to have in C-code. 
- numPrints: (int) indicates how many print statements you want to have C-code.
- printContents: (array of strings) sets `printf` contents (array's length should match numPrints)
- ifStatements: (boolean) indicates if you want `if` structures. 
- elseStatements: (boolean) indicates if you want `else` following `if`.
- forLoops: (boolean) indicates if you want `for` structures.
- mode: (string) it could be either `'easy'`, or `'medium'`, or `'hard'`. Setting this param will hide the menu for modes.

## Examples

### A basic example

```html
<div class="ptx-runestone-container">
  <div class="runestone">
    <div data-component="fork" data-question_label="1" id="test_fork_1"></div>
  </div> <!--runestone-->
</div> <!--ptx-runestone-container-->
```

You don't have to have the `<script>` section, like this example. It will generate the default mode menu and options from which users can choose.

### A more colorful example

```html
<div class="ptx-runestone-container">
  <div class="runestone">
    <div data-component="fork" data-question_label="1" id="test_fork_1"></div>
    <script type="application/json">
      {
        "numForks": 2,
        "numPrints": 3,
        "printContents": ["1", "2", "3"],
      }
    </script>
  </div> <!--runestone-->
</div> <!--ptx-runestone-container-->
```

### A fully customized example

```html
<div class="ptx-runestone-container">
  <div class="runestone">
    <div data-component="fork" data-question_label="1" id="test_fork_1"></div>
    <script type="application/json">
      {
        <!--put things here-->
      }
    </script>
  </div> <!--runestone-->
</div> <!--ptx-runestone-container-->

```