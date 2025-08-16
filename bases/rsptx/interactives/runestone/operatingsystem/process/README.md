# Fork

This module provides two interactive educational components for teaching operating systems concepts related to processes:

1. **Process Hierarchy Component** (`processHierarchy`) - Helps students understand parent-child relationships between processes
2. **Process Timeline Component** (`processTimeline`) - Focuses on execution order, synchronization, and output sequences

Both components generate random C-code with calls to `fork()`, `wait()`, and `exit()` to help students understand process creation, synchronization, and termination.

## How to get it built

We need some support from the D3.js library (already added to dependencies), so make sure to run `npm install` again if you're using an older version of the node modules.

You can use the keywords `processHierarchy` and `processTimeline` to refer to these tools in a `.ptx` file. (Examples are provided below).

## Component Types and Educational Goals

### Process Hierarchy Component (`processHierarchy`)
- **Purpose**: Students answer "how many times" each letter will be printed
- **Focus**: Understanding parent-child process relationships and process creation
- **Visualization**: Interactive process hierarchy trees
- **Question Type**: Fill-in-the-blank numeric answers

### Process Timeline Component (`processTimeline`) 
- **Purpose**: Students identify possible output sequences
- **Focus**: Understanding execution order, synchronization, and race conditions
- **Visualization**: Timeline diagrams showing concurrent execution
- **Question Type**: Multiple choice checkboxes for possible outputs

## Configuration Options

Both components can be configured in several ways to control the generated C-code and user interface.

### User Interface Modes

When `preset-params` is `false` or unspecified, users can select from predefined complexity modes:

#### Process Hierarchy Modes:
- **Mode 1**: 2 `fork()` calls, 2-3 `printf`, with `if` statements but not `else`
- **Mode 2**: 3 `fork()` calls, 3-4 `printf`, with `if-else` statements and nested conditions  
- **Mode 3**: 4 `fork()` calls, 4 `printf`, everything in previous modes plus `for` loops and `exit`

#### Process Timeline Modes:
- **Mode 1**: 2 forks, child process may or may not exit
- **Mode 2**: 2 forks, child process guaranteed to exit within code snippet
- **Mode 3**: 3 forks, more complex scenarios with guaranteed child exit

### Configuration Parameters

#### Core Parameters:
- `preset-params`: (boolean) If `true`, hides the mode menu and uses manual parameter settings
- `regeneration`: (boolean) If `true`, shows "Generate Another Question" button
- `instruction`: (string) Custom instruction text (optional)
- `source`: (string) Hard-coded source string for manual C-code generation (optional)

#### Process Generation Parameters (for `preset-params: true`):
- `numForks`: (integer) Number of `fork()` calls in the C-code
- `numPrints`: (integer) Number of print statements in the C-code
- `hasElse`: (boolean) Include `else` clauses with `if` blocks (hierarchy only)
- `hasNest`: (boolean) Include nested if-else structures (hierarchy only)  
- `hasExit`: (boolean) Include `exit()` calls (hierarchy only)
- `hasLoop`: (boolean) Include `for` loop structures (hierarchy only)

*Note: The number of forks and prints specified is what appears in the C code, not necessarily how many operations are executed during runtime.*

## Examples

### Process Hierarchy Component Examples

#### 1. Basic Process Hierarchy with Default Modes

Creates a component with user-selectable complexity modes (1, 2, 3):

```xml
<exercise label="fork-default">
  <title>Processes</title>
  <interactive xml:id="interactive-fork-default" platform="javascript" width="115%" aspect="4:10"
    source="dist/jquery.js dist/runestone/runestone.js dist/runestone/vendors.js dist/runestone/runtime.js"
    css="dist/runestone/runestone.css dist/runestone/vendors.css">
    <slate xml:id="fork-default" surface="html" aspect="4:10">
      <div class="ptx-runestone-container">
        <div class="runestone">
          <div data-component="processHierarchy" data-question_label="1" id="fork_default">
            <script type="application/json">
              {
                "preset-params": false,
                "componentLoggingID": 16
              }
            </script>
          </div>
        </div>
      </div>
    </slate>
  </interactive>
</exercise>
```

You can even omit the `<script>` section entirely - it will generate the default complexity level menu.

#### 2. Process Hierarchy with Preset Parameters

Fixed complexity settings without user mode selection:

```xml
<exercise label="fork-preset-params">
  <title>Processes</title>
  <interactive xml:id="interactive-fork-preset-params" platform="javascript" width="115%" aspect="4:10"
    source="dist/jquery.js dist/runestone/runestone.js dist/runestone/vendors.js dist/runestone/runtime.js"
    css="dist/runestone/runestone.css dist/runestone/vendors.css">
    <slate xml:id="fork-preset-params" surface="html" aspect="4:10">
      <div class="ptx-runestone-container">
        <div class="runestone">
          <div data-component="processHierarchy" data-question_label="2" id="fork_preset_params">
            <script type="application/json">
              {
                "preset-params": true,
                "numForks": 3,
                "numPrints": 5,
                "hasElse": true,
                "hasNest": false,
                "hasExit": true,
                "hasLoop": true,
                "componentLoggingID": 16
              }
            </script>
          </div>
        </div>
      </div>
    </slate>
  </interactive>
</exercise>
```

#### 3. Process Hierarchy with Hard-coded Source

Manually specified C-code using source string format:

```xml
<exercise label="fork-preset-code">
  <title>Processes</title>
  <interactive xml:id="interactive-fork-preset-code" platform="javascript" width="115%" aspect="4:10"
    source="dist/jquery.js dist/runestone/runestone.js dist/runestone/vendors.js dist/runestone/runtime.js"
    css="dist/runestone/runestone.css dist/runestone/vendors.css">
    <slate xml:id="fork-preset-code" surface="html" aspect="4:10">
      <div class="ptx-runestone-container">
        <div class="runestone">
          <div data-component="processHierarchy" data-question_label="3" id="fork_preset_code">
            <script type="application/json">
              {
                "instruction": "This question has manually written code with a customized instruction.",
                "source": "aF(,F(bX))",
                "regeneration": true,
                "preset-params": true,
                "numForks": 2,
                "numPrints": 2,
                "hasElse": false,
                "hasExit": true,
                "hasLoop": false,
                "hasNest": true,
                "componentLoggingID": 16
              }
            </script>
          </div>
        </div>
      </div>
    </slate>
  </interactive>
</exercise>
```

### Process Timeline Component Examples

#### 4. Basic Process Timeline with Default Modes

Creates a timeline component with user-selectable modes:

```xml
<exercise label="fork-timeline-default">
  <title>Process Timeline</title>
  <interactive xml:id="interactive-fork-timeline-default" platform="javascript" width="115%" aspect="4:10"
    source="dist/jquery.js dist/runestone/runestone.js dist/runestone/vendors.js dist/runestone/runtime.js"
    css="dist/runestone/runestone.css dist/runestone/vendors.css">
    <slate xml:id="fork-timeline-default" surface="html" aspect="4:10">
      <div class="ptx-runestone-container">
        <div class="runestone">
          <div data-component="processTimeline" data-question_label="5" id="fork_timeline_default">
            <script type="application/json">
              {"componentLoggingID": 38}
            </script>
          </div>
        </div>
      </div>
    </slate>
  </interactive>
</exercise>
```

#### 5. Process Timeline with Hard-coded Source (Regeneration Enabled)

Timeline component with custom code that allows regeneration:

```xml
<exercise label="fork-timeline-presetcode-regen">
  <title>Process Timeline</title>
  <interactive xml:id="interactive-fork-timeline-presetcode-regen" platform="javascript" width="115%" aspect="4:10"
    source="dist/jquery.js dist/runestone/runestone.js dist/runestone/vendors.js dist/runestone/runtime.js"
    css="dist/runestone/runestone.css dist/runestone/vendors.css">
    <slate xml:id="fork-timeline-presetcode-regen" surface="html" aspect="4:10">
      <div class="ptx-runestone-container">
        <div class="runestone">
          <div data-component="processTimeline" data-question_label="6" id="fork_timeline_presetcode_regen">
            <script type="application/json">
              {
                "instruction": "This timeline question demonstrates wait-exit synchronization patterns.",
                "source": "F(aWb,cX)F()d",
                "regeneration": true,
                "preset-params": true,
                "numForks": 2,
                "numPrints": 6,
                "componentLoggingID": 38
              }
            </script>
          </div>
        </div>
      </div>
    </slate>
  </interactive>
</exercise>
```

#### 6. Process Timeline with Fixed Source (No Regeneration)

Static timeline question that cannot be regenerated:

```xml
<exercise label="fork-timeline-presetcode-noregen">
  <title>Process Timeline</title>
  <interactive xml:id="interactive-fork-timeline-presetcode-noregen" platform="javascript" width="115%" aspect="4:10"
    source="dist/jquery.js dist/runestone/runestone.js dist/runestone/vendors.js dist/runestone/runtime.js"
    css="dist/runestone/runestone.css dist/runestone/vendors.css">
    <slate xml:id="fork-timeline-presetcode-noregen" surface="html" aspect="4:10">
      <div class="ptx-runestone-container">
        <div class="runestone">
          <div data-component="processTimeline" data-question_label="7" id="fork_timeline_presetcode_noregen">
            <script type="application/json">
              {
                "instruction": "Analyze this specific fork-wait-exit pattern.",
                "source": "F(aWb,cX)F()d",
                "regeneration": false,
                "componentLoggingID": 38
              }
            </script>
          </div>
        </div>
      </div>
    </slate>
  </interactive>
</exercise>
```

## Source String Format

When using the `source` parameter to manually specify C-code, use this compact string format:

### Basic Elements:
- **`F()`**: Simple fork call → generates `fork();`
- **`F(parent_code,child_code)`**: Fork with conditional execution
  - Everything before the comma executes in the parent process
  - Everything after the comma executes in the child process
  - Example: `F(a,b)` generates:
    ```c
    if (fork()) {
        printf("a");
    } else {
        printf("b");
    }
    ```
- **`W`**: Wait call → generates `wait(NULL);` (timeline component only)
- **`X`**: Exit call → generates `exit(0);`
- **Any letter (a-z)**: Print statement → generates `printf("letter");`

### Examples:
- `"aF()b"` → Print 'a', fork, print 'b' (both processes print 'b')
- `"F(a,bX)"` → Fork; parent prints 'a', child prints 'b' then exits
- `"F(aWb,cX)F()d"` → Complex timeline with wait/exit synchronization

**Important**: Do NOT include spaces in the source string.

### Understanding the Examples:

#### Process Hierarchy Examples:
- **Example 1** (`fork-default`): Basic component with mode selection menu
- **Example 2** (`fork-preset-params`): Fixed parameters, no user menu, specific complexity
- **Example 3** (`fork-preset-code`): Hard-coded source with regeneration enabled

#### Process Timeline Examples:
- **Example 4** (`fork-timeline-default`): Basic timeline with mode selection
- **Example 5** (`fork-timeline-presetcode-regen`): Custom source with regeneration button
- **Example 6** (`fork-timeline-presetcode-noregen`): Static question, no regeneration

## Key Differences Between Components

| Feature | Process Hierarchy | Process Timeline |
|---------|------------------|------------------|
| **Question Type** | "How many times will X print?" | "Which output sequences are possible?" |
| **Answer Format** | Numeric input boxes | Multiple choice checkboxes |
| **Visualization** | Interactive process tree | Execution timeline graph |
| **Focus** | Parent-child relationships | Temporal execution order |
| **Supported Operations** | fork, exit, if-else, loops | fork, wait, exit |
| **Complexity Features** | Nested conditions, loops | Synchronization patterns |

Both components help students understand process concepts but from different perspectives - hierarchy focuses on the **structure** of process relationships while timeline focuses on the **sequence** of execution events.


## Component Features and Capabilities

### Interactive Features

#### Process Hierarchy Component:
- **Question Generation**: Three complexity modes with configurable parameters
- **Interactive Visualization**: Clickable process hierarchy trees
- **Step-by-step Tracing**: Click on code blocks to see tree construction
- **Real-time Feedback**: Immediate validation of numeric answers
- **Help System**: Contextual help with external textbook references

#### Process Timeline Component:
- **Timeline Visualization**: Horizontal process execution timelines with fork/wait/exit relationships
- **Multiple Choice Interface**: Checkbox selection for possible output sequences
- **Synchronization Focus**: Emphasis on wait() and exit() coordination
- **Complexity Analysis**: Statistical analysis of execution patterns

## Technical Implementation

### Data Structure Overview
The components use a tree-based data structure to model process relationships:
- **Left children**: Represent future timesteps of the same process
- **Right children**: Represent newly created child processes
- **Node labeling**: Format `processID.timestep` (e.g., `0.1`, `1.0`)

### Code Generation
- **Internal Format**: Compact string representation for easier processing
- **Transpilation**: Convert internal format to displayable C code
- **Randomization**: Configurable complexity and feature combinations
- **Validation**: Ensure generated code produces meaningful questions

### Algorithm Components
- **`build.js`**: Core tree construction and C code generation
- **`hierarchyDraw.js`**: SVG-based process hierarchy visualization
- **`timelineDraw.js`**: Timeline diagram rendering with D3.js
- **`timeline_statistics.js`**: Analysis of execution sequence complexity

### Future Enhancement Opportunities
1. **Extended Synchronization**: Support for additional synchronization primitives
2. **Grandchild Processes**: Support for more complex process hierarchies
3. **Performance Metrics**: Timing analysis and performance comparison
4. **Advanced Visualization**: Interactive timeline scrubbing and animation
5. **Adaptive Difficulty**: Machine learning-based complexity adjustment
