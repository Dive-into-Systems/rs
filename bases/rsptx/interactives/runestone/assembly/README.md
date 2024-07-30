# Assembly Exercise Components

Under this folder lives three Assembly related question types:
- `assembly`
- `assembly_state`
- `assembly_flag`

## Assembly Operations

### `assembly`

The question provides users with:
- Assembly language instructions with `operators` and `operands` and requires users to answer whether the given instructions are:
  - Valid
  - or Invalid

It supports `IA32 (including X86_32 and X86_64)` and `ARM64`.

#### **Example (IA32 X86_32)**

```html
<section id="assembly operations (IA32)">
  <h1>Assembly Operations (IA32)<a class="headerlink" href="#number-conversion" title="Permalink to this heading">¶</a></h1>
            <p>Test 1 - test assembly operations.</p>
        <div class="runestone ">
        <div data-component="assembly_syntax" data-question_label="1" id="q_test_x86_32"  style="visibility: hidden;">
          <script type="application/json">
                {
                  "bits": 4,
                  "architecture" : "X86_32"
                }
          </script>
        </div>
        </div>
</section>
```

#### **Example (IA32 X86_64)**

```html
<section id="assembly operations (IA32)">
  <h1>Assembly Operations (IA32)<a class="headerlink" href="#number-conversion" title="Permalink to this heading">¶</a></h1>
            <p>Test 2 - test assembly operations.</p>
        <div class="runestone ">
        <div data-component="assembly_syntax" data-question_label="2" id="q_test_x86_64"  style="visibility: hidden;">
          <script type="application/json">
                {
                  "bits": 4,
                  "architecture" : "X86_64"
                }
          </script>
        </div>
        </div>
</section>
```

#### **Example (ARM64)**

```html
<section id="assembly operations (ARM64)">
  <h1>Virtual Memory Operations (ARM64)<a class="headerlink" href="#number-conversion" title="Permalink to this heading">¶</a></h1>
            <p>Test 3 - test assembly operations.</p>
        <div class="runestone ">
        <div data-component="assembly_syntax" data-question_label="3" id="q_test_arm64"  style="visibility: hidden;">
          <script type="application/json">
                {
                  "bits": 4,
                  "architecture" : "ARM64"
                }
          </script>
        </div>
        </div>
</section>
```

## Assembly State Exercise

### `assembly_state`

The Assembly State Exercise provides users with a set of assembly language instructions, registers, and memory states. Users need to analyze the given state and instructions to determine the final state of the system. It supports both IA32 (including X86_32 and X86_64) and ARM64 architectures.

#### **Example (IA32 X86_64)**

This is an customized compoenent which is tunable, for this to work, you need to have all four of instructions, registers, memory, and selection for it to work. Without these four, you will get a normal ask me another component with the checkboxes being rendered.

```html
<div data-component="assembly_state" data-question_label="1" id="test-assembly-state-ia64-div-unique-2" style="visibility: hidden;">
  <script type="application/json">
    {
      "bits": 4,
      "architecture" : "X86_64",
      "instructions" : [
        "sub -0x10(%ebp), %ebx",
        "add $4, %ebx",
        "add -0x10(%ebp), %ecx"
      ],
      "registers" : [
        { "register": "eax", "value": "15", "type": "regular" },
        { "register": "ebx", "value": "9", "type": "regular" },
        { "register": "ecx", "value": "12", "type": "regular" },
        { "register": "esp", "value": "0x250", "type": "memory" },
        { "register": "ebp", "value": "0x260", "type": "memory" }
      ],
      "memory" : [
        { "address": "0x244", "location": "-56", "value": "11" },
        { "address": "0x248", "location": "-48", "value": "7" },
        { "address": "0x24C", "location": "-40", "value": "9" },
        { "address": "0x250", "location": "-32", "value": "9" },
        { "address": "0x254", "location": "-24", "value": "9" },
        { "address": "0x258", "location": "-16", "value": "14" },
        { "address": "0x25C", "location": "-8", "value": "14" },
        { "address": "0x260", "location": "", "value": "5" }
      ],
      "selection" : [true, true, true]
    }
  </script>
</div>
```

## Assembly Flag Exercise

### `assembly_flag`

The Assembly Flag Exercise focuses on the status flags in assembly programming. Users are presented with assembly instructions and need to determine the state of various flags after the execution of these instructions. This component supports IA32 (including X86_32 and X86_64) architectures.

#### **Example (IA32 X86_64)**

```html
<div data-component="assembly_flag" data-question_label="1" id="test-assembly-flag-ia64-div" style="visibility: hidden;">
  <script type="application/json">
    {
      "bits": 4,
      "architecture" : "X86_64"
    }
  </script>
</div>
```

These components provide interactive exercises for students to practice and understand assembly language concepts, including syntax validation, state analysis, and flag manipulation.