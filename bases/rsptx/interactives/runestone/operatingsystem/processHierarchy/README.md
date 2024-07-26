# Fork

The Fork problem can randomly generate a block of C-code with calls to `fork()`, `wait()`, `exit()`. The purpose is to help students understand concepts such as process state and hierarchy. With that goal, this component supports drawing **interactive** process hierarchy trees and execution timelines from the C-code.

## How to get it built

We need some support from the D3.js library (already added to dependencies), so make sure to run `npm install` again if you're using an older version of the node modules.

You can use the keyword `fork` to refer to this tool in a `.ptx` file. (Examples are provided below).

## Tunable parameters

The main way to control how this component behaves is by manipulating what the block of C-code contains. There are two places you can get it done. 

### In user interface

![image info](./pictures/fork-default.png)

This is how the component looks like, in general. You can generate question from 3 modes. 

- **Mode 1**: 2 `fork()` calls, 2-3 `printf`, with `if` statements but not `else`.
- **Mode 2**: 3 `fork()` calls, 3-4 `printf`, with `if-else` statements and nested conditions.
- **Mode 3**: 4 `fork()` calls, 4 `printf`, everything in the previous modes, with `for` loops and `exit`.

*Please note that the number of forks and prints is what will show up in the C code, **not** how many of these operations will actually be executed in execution.*

### In PreTeXt file

You can also limit the flexibilities given to the user by making changes to `<script>` in `.ptx` files.

Again, the goal is to control what C-code we generate. Broadly, there are three approaches:

1. Generate a default question with 3 preset modes (see example 1). 
    - To do this, you don't need to add anything to `<script>`.
  
2. Generate a question with some preset parameters (see example 2).
    - To do this, you want to set `numForks`, `numPrints`, `hasElse`, `hasNest`, `hasExit`, and `hasLoop`.
    - *Note*: make sure that you pass in valid parameters in correct type, otherwise you'll get an error.
  
3. Generate a completely static question with a manually written C-code source string (see example 3).
    - To do this, you want to write a source string (format will be explain shortly), and you **must specify** `numForks` and `numPrints` for this string. 

Here are the specifics:
- `numForks`: (int, or a array of int) indicates how many `fork()` calls you want to have in C-code. 
- `numPrints`: (int, or a array of int) indicates how many print statements you want to have C-code.
- `hasElse`: (boolean) indicates if you want an `else` following a `if` block.
- `hasNest`: (boolean) indicates if you want if-else structures nested in another one. 
- `hasExit`: (boolean) indicates if you want call(s) to `exit()`.
- `hasLoop`: (boolean) indicates if you want `for` structures.

## Examples

### 1. A basic example

![image-fork-default](./pictures/fork-default.png)

```html
<div class="ptx-runestone-container">
  <div class="runestone">
    <div data-component="fork" data-question_label="1" id="test_fork">
      <script type="application/json">
      </script>
    </div>
  </div>
</div>
```

You don't even need the `<script>` section. It will generate the default complexity level menu and options from which users can choose.

### 2. An example with preset parameters

![image-fork-preset-params](./pictures/fork-preset-params.png)

```html
<div class="ptx-runestone-container">
  <div class="runestone">
    <div data-component="fork" data-question_label="2" id="fork_preset_params">
      <script type="application/json">
        {
          "preset-params": true,
          "numForks" : 3,
          "numPrints" : 5,
          "hasElse" : true,
          "hasNest" : false,
          "hasExit" : true,
          "hasLoop" : true
        }
      </script>
    </div>
  </div> 
</div>
```

### 3. An example with hard-coded C-code

![image-fork-preset-code](./pictures/fork-preset-code.png)

```html
<div class="ptx-runestone-container">
  <div class="runestone">
    <div data-component="fork" data-question_label="2" id="fork_preset_code">
      <script type="application/json">
        {
          "source" : "aF(,F(bx))",
          "numForks" : 2,
          "numPrints" : 2
        }
      </script>
    </div>
  </div> 
</div>
```

To write the `source` string:
  - `F()` means a fork call, it itself generates `fork();` in the C-code.
  - `F(,)` is also a fork call, but everything that comes before the comma is what the parent executes, and everything after the comma is what the child executes.
    - For example `F(a,b)` generates:
      ```C
      if (fork()) {
        printf("a");
      } else {
        printf("b");
      }
      ```
  - `x` means exit.
  - A letter that is not `F` nor `x` is what gets printed with `printf()`.

*Note*: DO NOT include any spaces in this source string. 