# Virtual Memory Exercise Components

Under this folder lives four virtual memory related question types:
```vo```, ```vminfo```, ```vmpartition```, and ```vmtable```.

## Virtual memory operations ```vo```
The question provides users with: 
- Assembly language instructions with ```operators``` and ```operants```
and requires users to answer whether the given instructions could cause:
- Page fault
- Cache miss
- Dirty bit in cache to be set to 1

It supports ```IA32``` and ```ARM64```. 

### **Example (IA32 with load effective address instructions)**
```html
<section id="virtual memory operations (IA32)">
  <h1>Virtual Memory Operations (IA32)<a class="headerlink" href="#number-conversion" title="Permalink to this heading">¶</a></h1>
            <p>Test 8 - test the vm operations.</p>
        <div class="runestone ">
        <div data-component="vo" data-question_label="2" id="test_vm_operations_IA32"  style="visibility: hidden;">
          <script type="application/json">
            {
              "architecture": "IA32",
              "num_of_question_in_one_group": 4,
              "mem_access_chance": 0.6,
              "load_effective_address": true
            }
          </script>
        </div>
        </div>
</section>
```

### **Example (ARM64)**
```html
<section id="virtual memory operations (ARM64)">
  <h1>Virtual Memory Operations (ARM64)<a class="headerlink" href="#number-conversion" title="Permalink to this heading">¶</a></h1>
            <p>Test 9 - test the vm operations.</p>
        <div class="runestone ">
        <div data-component="vo" data-question_label="4" id="test_vm_operations_ARM64"  style="visibility: hidden;">
          <script type="application/json">
            {
              "architecture": "ARM64",
              "num_of_question_in_one_group": 3,
              "mem_access_chance": 0.5
            }
          </script>
        </div>
        </div>
</section>
```

## Virtual memory information ```vminfo```
The question provides users with: 
- number of virtual address bits
- number of frames in physical address
- page/frame size (in bytes)
and requires the user to answer:
- physical memory size (in bytes)
- virtual memory size (in bytes)

There is one configurable option:
- ```num-bits-list```: list of possible number of bits of the virtual memory address. Should be an array of integers. Default is ```[8, 12, 16]```.

### **Example**
<section id="virtual memory information">
  <h1>Virtual Memory Info<a class="headerlink" href="#vm-info" title="Permalink to this heading">¶</a></h1>
            <p>Test 10 - test the virtual memory info component. </p>

        <div class="runestone ">
        <div data-component="vminfo" data-question_label="9" id="test_virtual_memory_info"  style="visibility: hidden;">
        </div>
        </div>
</section>

## Virtual memory partition ```vmpartition```
The question provides users with: 
- number of virtual address bits
- number of frames in physical address
- page/frame size (in bytes)
and requires the user to select and highlight the offsets in a given address. (Note: we default the non-offset part of the address as page)

There is one configurable option:
- ```num-bits-list```: list of possible number of bits of the virtual memory address. Should be an array of integers. Default is ```[8, 12, 16]```.

### **Example**
```html
<section id="virtual address partition">
  <h1>Virtual Address Partition<a class="headerlink" href="#vm-info" title="Permalink to this heading">¶</a></h1>
            <p>Test 11 - test the virtual address partition. </p>

        <div class="runestone ">
        <div data-component="vmpartition" data-question_label="10" id="test_virtual_address_partition"  style="visibility: hidden;">
        </div>
        </div>
</section>
```

## Virtual memory table ```vmtable```
This question provides students with an information table:
- number of virtual address bits
- number of frames in physical address
- page/frame size (in bytes)
- replacement algorithm
As well as two other assistive tables:
- RAM Content table
- Page table

In the question, students need to read the address references from **Memory Operations Table** and suggest changes to the page table in **Effects from Memory Reference table** (the answer area).

The question writer can have the option to configure
- ```num-references```: number of memory references. Should be an integer. Default is ```8```.
- ```bits```:   total number of bits. Should be an integer. Default is ```8```.
- ```offset```: number offset bits. Should be an integer less than ```bits```. Default is ```4```.
- ```frames```: number of frames. Should be an integer. Default is ```4```.
- ```displayed-pages```: number of displayed pages in page table. Should be an integer less than ```bits```. Default is ```5```.
- ```min-index```: the starting point of the displayed pages. Should be an integer. If not specified, it will be a random valid integer. 
- ```redo```: a boolean value tells whether to allow students to redo questions if they need. Default is ```false```. 
- ```fixed``` : a boolean value. If it is true, then the initial cache table layout and list of references will be fixed, and the author should give the initial cache table as ```init-page-table``` and the list of references as ```reference-list``` (see description below). Default is ```false```.
- ```init-page-table```: a list that tells the initial lines of the cache table. Each of its element should be a dictionary that contains the information of a page, including. 
    * ```page```:   the page number, which is a decimal number. (required)
    * ```valid```:  the valid bit, either ```0``` or  ```1```. (optional, default is ```0```)
    * ```dirty```:  the dirty bit, either ```0``` or  ```1```. (optional, default is ```0```)
    * ```frame```:  this frame number, which is a decimal numbr. (required)
    - Note: ```init-page-table``` is only valid when the parameter ```fixed``` is ```true```. 

- ```reference-list```: an array that contains the reference list. It should have exact the length of ```num-references```. Each of its element should be an array of ```2``` elements, in which the first one is the address and the second one is the RW. The address should be a binary string of length ```bits```, and the RW should be a string of either ```R``` or ```W```.
    - Note: ```reference-list``` is only valid when the parameter ```fixed``` is ```true```. 

### Example 1:
#### Virtual Memory table generation with default setting
```html
<section id="virtual memory table">
  <h1>Virtual Memory Table<a class="headerlink" href="#vm-table" title="Permalink to this heading">¶</a></h1>
            <p>Test 9 - test the virtual memory table component.</p>

        <div class="runestone ">
        <div data-component="vmtable" data-question_label="8" id="test_virtual_memory_table_1"  style="visibility: hidden;">
          <script type="application/json">
          </script>   
        </div>
        </div>
</section>
```

### Example 2:
#### Virtual Memory table with configuration
```html
<section id="virtual memory table">
  <h1>Virtual Memory Table with configuration<a class="headerlink" href="#vm-table" title="Permalink to this heading">¶</a></h1>
            <p>Virtual Memory Table with configuration</p>

        <div class="runestone ">
        <div data-component="vmtable" data-question_label="8" id="test_virtual_memory_table_2"  style="visibility: hidden;">
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

### Example 3:
#### Virtual Memory table with fixed page table and reference list
```html
<section id="virtual memory table">
  <h1>Virtual Memory Table with fixed page table and reference list<a class="headerlink" href="#vm-table" title="Permalink to this heading">¶</a></h1>
            <p>Virtual Memory Table with fixed page table and reference list</p>

        <div class="runestone ">
        <div data-component="vmtable" data-question_label="8" id="test_virtual_memory_table_3"  style="visibility: hidden;">
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