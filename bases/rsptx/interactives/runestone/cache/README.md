# Caching Exercise Components

This folder contains three caching-exercise-related Runestone components: ```cacheinfo```, ```cachepartition```, and ```cachetable```.
Each component is capable of automatically generating a question prompt based on reader's choices and checking answers on the fly. 


## cacheinfo
For the prompt, based on user's choice of ```cache organization``` and ```address length```, this component randomly generates a ```memory address```, represented in binary,
and the bit-length respectively for the tag, index, and offset. 
- ```cache organization``` for choice includes ```Direct-Mapped```, ```2-Way Set Associative```, and ```4-Way Set Associative```.
- ```address length``` for choice includes ```4 bits```, ```8 bits```, and ```16 bits```.

To answer the question, the reader should determine the size of cache data block (in bytes), the number of entries, and the number of lines in the given cache structure
organization.

### **Example 1**: 
#### Exercise creation with customized parameters

```html
<section id="cache-info">
<h1>cacheinfo example 1</h1>
    <!-- creation of the exercise -->
    <div class="runestone ">
    <div data-component="cacheinfo" data-question_label="1" id="example_cache_info_1"  style="visibility: hidden;">
        <!-- parameter setting of the exercise -->
        <script type="application/json">
            {
            "num_bits": 8, 
            "cache_org" : ["Direct-Mapped", "2-Way Set Associative", "4-Way Set Associative"], 
            }
        </script>
    </div>
    </div>
</section>
```

### **Example 2**: 
#### Exercise creation with default parameters
```html
<section id="cache-info">
<h1>cacheinfo example 2</h1>
    <!-- creation of the exercise -->
    <div class="runestone ">
    <div data-component="cacheinfo" data-question_label="2" id="example_cache_info_2"  style="visibility: hidden;">
        <!-- parameter setting of the exercise -->
        <script type="application/json">
            {}
        </script>
    </div>
    </div>
</section>
```

## cachepartition
The question asks the reader to partition a memory address into the tag, index, and offset. 

For the prompt, again, reader should select ```cache organization``` and ```address length``` from the menu. Based on the selection, 
this component randomly generates a ```memory address```.

- ```cache organization``` for choice includes ```Direct-Mapped```, ```2-Way Set Associative```, and ```4-Way Set Associative```.
- ```address length``` for choice includes ```4 bits```, ```8 bits```, and ```16 bits```.

To answer the question, user should use their cursor and drag through the part that they want to highlight, and click on the button to set
the highlighted part to a certain tag. The highlighting color for the tag, index, and offset are red, blue, and yellow, respectively.

### **Example 1**: 
#### Exercise creation with customized parameters
```html
<section id="caching partition-example-1">
<h1>cachepartition example 1</h1>
    <!-- creation of the exercise -->
    <div class="runestone ">
    <div data-component="cachepartition" data-question_label="1" id="example_cache_partition_1"  style="visibility: hidden;">
        <!-- parameter setting of the exercise -->
        <script type="application/json">
            {
            "num_bits": 8, 
            "cache_org" : "2-Way Set Associative", 
            }
        </script>
    </div>
    </div>
</section>
```

### **Example 2**: 
#### Exercise creation with default parameters
```html
<section id="caching partition-example-2">
<h1>cachepartition example 2</h1>
    <!-- creation of the exercise -->
    <div class="runestone ">
    <div data-component="cachepartition" data-question_label="2" id="example_cache_partition_2"  style="visibility: hidden;">
        <!-- parameter setting of the exercise -->
        <script type="application/json">
            {
                "cache-org": "2-Way Set Associative"
            }
        </script>
    </div>
    </div>
</section>

```

## cachetable
The question asks the reader to read a cache table, and figure out how a read or write to a memory address will change the cache table.  

To answer the question, user should select whether one memeory address is hit or miss, and fill in the corresponding Index,
LRU(in 2-way set associative), Valid bit, Dirty bit and Tag bit. 

Readers cannot make any configuration. The author should be responsible for the configurations. Available configurable options include:

- ```cache-org``` : the cache organization, which is a string of either ```Direct-Mapped``` or ```2-Way Set Associative```. Default is ```Direct-Mapped```. 
- ```bits``` : the length of the memory addresses, which is a positive integer. Default is ```8```.
- ```offset``` : the number of offset bits, which is a positive integer. Default is ```2```.
- ```index``` : the number of index bits, which is a positive integer. Default is ```2```.
- ```num-references``` : the number of memory address reference will be generated, which is a positive integer. Default is ```8```.
- ```init-valid-rate``` : the probability for a cache line to be valid in the beginning, which is a float number between ```0``` and ```1```. Default is ```0.3```. 
- ```debug``` : a boolean value. If it is true, then the program will print out some information in the console, including the seed. Default is ```false```.
- ```algorithm``` : a string representing the random algorithm, which can be either ```"boost"``` or ```"hitNmiss"```. Default is ```"boost"```.
- ```fixed``` : a boolean value. If it is true, then the initial cache table layout and list of references will be fixed, and the author should give the initial cache table as ```init-cache-table``` and the list of references as ```reference-list``` (see description below). Default is ```false```.
- ```init-cache-table```: a list that tells the initial lines of the cache table. Each of its element should be a dictionary that contains the information of a cache set. 
    - When ```cache-org``` is ```Direct-Mapped```, each dictionary should include:
        * ```index```: a decimal number, the index of the cache set. (required)
        * ```valid```: the valid bit, either ```0``` or  ```1```. (optional, default is ```0```)
        * ```dirty```: the dirty bit, either ```0``` or  ```1```. (optional, default is ```0```)
        * ```tag```: the tag bits, which should be a binary string of length ```bits-offset-index```. (optional, default is the empty string) 
    - When ```cache-org``` is ```2-Way Set Associative```, each dictionary should include:
        * ```index```: a decimal number, the index of the cache set. (required)
        * ```lru```: the LRU bit, either ```0``` or  ```1```. (optional, default is ```0```)
        * ```left```: the information of the left cache line. It should be a dictionary that contains optional ```valid```, ```dirty``` and ```tag```. (optional)
        * ```right```: the information of the right cache line. It should be a dictionary that contains optional ```valid```, ```dirty``` and ```tag```. (optional)
    - Note: ```init-cache-table``` is only valid when the parameter ```fixed``` is ```true```. 

- ```reference-list```: an array that contains the reference list. It should have exact the length of ```num-references```. Each of its element should be an array of ```2``` elements, in which the first one is the address and the second one is the RW. The address should be a binary string of length ```bits```, and the RW should be a string of either ```R``` or ```W```.
    - Note: ```reference-list``` is only valid when the parameter ```fixed``` is ```true```. 


### **Example 1**: 
#### Direct Mapped
```html
<section id="cachetable-example-1">
<h1>Direct Mapped Example</h1>
    <!-- creation of the exercise -->
    <div class="runestone ">
    <div data-component="cachetable" data-question_label="1" id="example_cache_table_1"  style="visibility: hidden;">
        <!-- parameter setting of the exercise -->
        <script type="application/json">
            {
                "ref": 8, 
                "index": 3,
                "init-valid-rate": 0.2,
                "algorithm": "boost"
            }
        </script>
    </div>
    </div>
</section>
```

### **Example 2**: 
#### 2-Way Set Associative 
```html
<section id="cachetable-example-2">
<h1>2-Way Set Associative Example</h1>
    <!-- creation of the exercise -->
    <div class="runestone ">
    <div data-component="cachetable" data-question_label="2" id="example_cache_table_2"  style="visibility: hidden;">
        <!-- parameter setting of the exercise -->
        <script type="application/json">
            {
              "cache-org": "2-Way Set Associative",
              "init-valid-rate": 0.3,
            }
        </script>
    </div>
    </div>
</section>

```

### **Example 3**: 
#### Fixed initial cache table and list of references
```html
<section id="cachetable-example-3">
<h1>Fixed initial cache table and list of references</h1>
    <!-- creation of the exercise -->
    <div class="runestone ">
    <div data-component="cachetable" data-question_label="3" id="example_cache_table_3"  style="visibility: hidden;">
        <!-- parameter setting of the exercise -->
        <script type="application/json">
          {
            "cache-org": "2-Way Set Associative",
            "offset": 1,
            "index": 2,
            "debug": true,
            "fixed": true,
            "init-cache-table": 
            [
              {
                "index": 0,
                "lru": 1,
                "left": {
                  "valid":1,
                  "tag":"1010"
                }
              } ,
              {
                "index": 3,
                "lru": 1,
                "right": {
                  "valid":1,
                  "dirty":1,
                  "tag":"1111"
                }
              } 
            ],
            "reference-list":
            [
              ["00101010", "R"],
              ["00101011", "W"],
              ["11001100", "R"],
              ["11001010", "R"],
              ["11001011", "R"],
              ["00111101", "W"],
              ["00111100", "R"],
              ["00101100", "W"]
            ]
          }
        </script>     
    </div>
    </div>
</section>

```