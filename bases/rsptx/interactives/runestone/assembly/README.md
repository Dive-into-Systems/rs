# Assembly Exercise Components

Under this folder lives one Assembly related question types:
```assembly```

## Assembly Operations ```assembly```
The question provides users with: 
- Assembly language instructions with ```operators``` and ```operants```
and requires users to answer whether the given instructions are:
- Valid
- or Invalid

It supports ```IA32 (including X86_32 and X86_64)``` and ```ARM64```. 

### **Example (IA32 X86_32)**
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

### **Example (IA32 X86_64)**
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

### **Example (ARM64)**
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