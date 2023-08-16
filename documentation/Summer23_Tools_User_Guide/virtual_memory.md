# Virtual Memory Exercises

For the Virtual Memory section, we have devised four related types of questions: 
- Virtual memory operations, with the keyword `data-component = vo`
- Virtual memory information, with the keyword `data-component = vminfo`
- Virtual memory partition, with the keyword `data-component = vmpartition`
- Virtual memory table, with the keyword `data-component = vmtable`

Each component is capable of automatically generating a question prompt based on reader's choices and checking answers on the fly.

This file describes what each question type does and includes a guide on how to use them. You can find the source code for them in the `./rs/bases/rsptx/interactives/runstone/virtualmemory` directory.

<br>

## Virtual memory operations: `vo`
This question presents users with a set of Assembly instructions, with `operators` and `operants`. Users are then asked to determine whether the given instructions **could** result in any of the following scenarios: 
- Page fault
- Cache miss
- Dirty bit in cache to be set to 1

The prompts are grouped together to provide students with a convenient comparison of how to different operation can have varying effects on memory. Sub-questions that students answered correctly would be disabled. 

By clicking on the `Check` button, students can receive individual feedback for each sub-question. The `Ask me another` button generates an entirely new group of questions.

When using this components, some configurable options you might want to set up are:
- Assembly language: we currently support `IA32` and `ARM64`. Choose one of these for the `architecture` setup. 
- Number of sub-question in one group: you can set this to any number you want using the `num_of_question_in_one_group` option. 
- Chance of memory access: the default value is `0.5`.
- Load effective address: choose `true` or `false` to determine whether this class of instructions will appear. 

<br>

Here are some examples of how to use it: 


### **Example 1 (IA32 with load effective address instructions)**
```html
<section id="virtual memory operations (IA32)">
  <h1>Virtual Memory Operations (IA32)<a class="headerlink" href="#vo-1" title="Permalink to this heading">¶</a></h1>
  <!-- creating the exercise --><!-- parameter setting of the exercise -->
    <div class="runestone ">
    <div data-component="vo" data-question_label="1" id="test_vm_operations_IA32"  style="visibility: hidden;">
      <script type="application/json">
        {
          "architecture": "IA32",
          "num_of_question_in_one_group": 4,
          "mem_access_chance": 0.5,
          "load_effective_address": true
        }
      </script>
    </div>
    </div>
</section>
```

### **Example 2 (ARM64)**
```html
<section id="virtual memory operations (ARM64)">
  <h1>Virtual Memory Operations (ARM64)<a class="headerlink" href="#vo-2" title="Permalink to this heading">¶</a></h1>
    <!-- creating the exercise --><!-- parameter setting of the exercise -->
    <div class="runestone ">
    <div data-component="vo" data-question_label="2" id="test_vm_operations_ARM64"  style="visibility: hidden;">
      <script type="application/json">
        {
          "architecture": "ARM64",
          "num_of_question_in_one_group": 3,
          "mem_access_chance": 0.4
        }
      </script>
    </div>
    </div>
</section>
```

<br>

## Virtual memory information: `vminfo`

The question presents users with: 
- number of virtual address bits
- number of frames in physical address
- page/frame size (in bytes)

and requires the user to answer:
- physical memory size (in bytes)
- virtual memory size (in bytes)

When using this components, the configurable option you might want to set up is:
  - `num-bits-list`: list of possible number of bits of the virtual memory address. Should be an array of integers. Default is `[8, 12, 16]`.

<br>

Here is an example of how to use it: 

### **Example**
```html
<section id="virtual memory information">
  <h1>Virtual Memory Information<a class="headerlink" href="#vm-info-1" title="Permalink to this heading">¶</a></h1>
    <!-- creating the exercise -->
    <div class="runestone ">
    <div data-component="vminfo" data-question_label="3" id="test_virtual_memory_info"  style="visibility: hidden;">
    </div>
    </div>
</section>
```

<br>

## Virtual memory partition `vmpartition`
The question provides users with: 
- number of virtual address bits
- number of frames in physical address
- page/frame size (in bytes)
and requires the user to highlight the offsets in the given address. (Note: we default the non-offset part of the address as page)

When using this components, the configurable option you might want to set up is:
  - `num-bits-list`: list of possible number of bits of the virtual memory address. Should be an array of integers. Default is `[8, 12, 16]`.

<br>

Here is an example of how to use it: 

### **Example (with default parameters)**
```html
<section id="virtual address partition">
  <h1>Virtual Address Partition<a class="headerlink" href="#vm-info-2" title="Permalink to this heading">¶</a></h1>
    <!-- creating the exercise -->
    <div class="runestone ">
    <div data-component="vmpartition" data-question_label="4" id="test_virtual_address_partition"  style="visibility: hidden;">
    </div>
    </div>
</section>
```

<br>

## Virtual memory table: `vmtable`
This question provides students with an information table:
- number of virtual address bits
- number of frames in physical address
- page/frame size (in bytes)
- replacement algorithm
As well as two other assistive tables:
- RAM Content table
- Page table

In the question, students need to read the address references from **Memory Operations Table** and suggest changes to the page table in **Effects from Memory Reference table** (the answer area).

<br>

When using this components, the configurable option you might want to set up is:
  - `num-references`: number of memory references. Should be an integer. Default is `8`.
  - `bits`:   total number of bits. Should be an integer. Default is `8`.
  - `offset`: number offset bits. Should be an integer less than `bits`. Default is `4`.
  - `frames`: number of frames. Should be an integer. Default is `4`.
  - `displayed-pages`: number of displayed pages in page table. Should be an integer less than `bits`. Default is `5`.
  - `min-index`: the starting point of the displayed pages. Should be an integer. If not specified, it will be a random valid integer. 
  - `redo`: a boolean value tells whether to allow students to redo questions if they need. Default is `false`. 
  - `fixed` : a boolean value. If it is true, then the initial cache table layout and list of references will be fixed, and the author should give the initial cache table as `init-page-table` and the list of references as `reference-list` (see description below). Default is `false`.
  - `replacement-algo`: a string that specifies the replacement algorithm. It can be `"FIFO"`, `"LRU"`, or `"reference"`. Default is `"FIFO"`. 
  - `init-page-table`: a list that tells the initial lines of the cache table. Each of its element should be a dictionary that contains the information of a page, including. 
      * `page`:   the page number, which is a decimal number. (required)
      * `valid`:  the valid bit, either `0` or  `1`. (optional, default is `0`)
      * `dirty`:  the dirty bit, either `0` or  `1`. (optional, default is `0`)
      * `frame`:  this frame number, which is a decimal numbr. (required)
      - Note: `init-page-table` is only valid when the parameter `fixed` is `true`. 

  - `reference-list`: an array that contains the reference list. It should have exact the length of `num-references`. Each of its element should be an array of `2` elements, in which the first one is the address and the second one is the RW. The address should be a binary string of length `bits`, and the RW should be a string of either `R` or `W`.
      - Note: `reference-list` is only valid when the parameter `fixed` is `true`. 


<br>

Here are some examples of how to use it: 

### **Example 1 (with default parameters)**
```html
<section id="virtual memory table">
  <h1>Virtual Memory Table<a class="headerlink" href="#vm-table-1" title="Permalink to this heading">¶</a></h1>
    <div class="runestone ">
    <div data-component="vmtable" data-question_label="5" id="test_virtual_memory_table_1"  style="visibility: hidden;">
      <script type="application/json">
        {}
      </script>   
    </div>
    </div>
</section>
```

**Example 2 (with customized parameters)**
```html
<section id="virtual memory table">
  <h1>Virtual Memory Table with configuration<a class="headerlink" href="#vm-table-2" title="Permalink to this heading">¶</a></h1>
    <div class="runestone ">
    <div data-component="vmtable" data-question_label="6" id="test_virtual_memory_table_2"  style="visibility: hidden;">
      <script type="application/json">
        {
        "offset": 2,
        "frames": 3,
        "displayed-pages": 5,
        "min-index": 47,
        "redo": true
        }
      </script>   
    </div>
    </div>
</section>
```

**Example 3 (prepolulated with fixed content)**
```html
<section id="virtual memory table">
  <h1>Virtual Memory Table with fixed page table and reference list<a class="headerlink" href="#vm-table-3" title="Permalink to this heading">¶</a></h1>
    <div class="runestone ">
    <div data-component="vmtable" data-question_label="7" id="test_virtual_memory_table_3"  style="visibility: hidden;">
      <script type="application/json">
        {
          "offset": 2,
          "frames": 4,
          "displayed-pages": 6,
          "min-index": 17,
          "redo": true,
          "fixed": true,
          "reference-list":
          [
            ["01000101","W"],
            ["01000101","R"],
            ["01001100","W"],
            ["01001101","R"],
            ["01001000","W"],
            ["01001101","R"],
            ["01000101","W"],
            ["01010001","R"]
          ],
          "init-page-table": 
          [
            {
              "page": 20,
              "valid": 1,
              "frame": 0
            } 
          ]
        }
      </script>   
    </div>
    </div>
</section>
```

### Notes on Algorithm analysis
Currently, `vmAlgoStats.py` hosts `vmAlgo` class. Each file would generate an instance of this `vmAlgo` class.
In the future, a better algorithm testing structure might be having a hierachical class for `vmAlgo` as an abstract class and others as subclass.