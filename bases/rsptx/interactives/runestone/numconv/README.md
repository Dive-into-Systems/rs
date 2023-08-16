# numberconversion
Number Conversion is a RuneStone component that can **automatically generate** exercises on **number representation conversion**.

## Usage
Notice: Currently only works in ```.html```. It hasn't implemented in ```.rst``` or ```.ptx```.
- keyword: ```data-component = numberconversion```
- passing parameter: Use JSON to pass in optional parameters 
    - ```"bits"```: specifies the number of binary bits in the exercise questions that user want to give to their students. The default number of bits is **8**.
    - ```"from-options"```: specifies the selectable number representations given in the prompt. By default, every option is granted, including ```["binary", "decimal-unsigned", "decimal-signed", "hexadecimal"]```.
    - ```"to-options"```: specifies the selectable number representations given as an answer. By default, every option is granted, including ```["binary", "decimal-unsigned", "decimal-signed", "hexadecimal"]```.

### Usage Example
**Example 1**: Exercise creation with personalized parameters
```html
<section id="number-conversion">
<h1>number Conversion</h1>
    <p>Test 1 - test the number conversion component.</p>

    <!-- creation of the exercise -->
    <div class="runestone ">
    <div data-component="numberconversion" data-question_label="1" id="test_number_conversion"  style="visibility: hidden;">
        <!-- parameter setting of the exercise -->
        <script type="application/json">
            {
                "bits": 16, 
                "from-options" : ["binary", "decimal-unsigned", "decimal-signed"], 
                "to-options" : ["binary", "hexadecimal"]
                }
        </script>
    </div>
    </div>
</section>
```

**Example 2**: Exercise creation with default parameters
```html
<section id="number-conversion-2">
<h1>number Conversion 2</h1>
    <p>Test 2 - test the number conversion component.</p>

    <!-- creation of the exercise -->
    <div class="runestone ">
    <div data-component="numberconversion" data-question_label="2" id="test_number_conversion"  style="visibility: hidden;">
        <!-- parameter setting of the exercise -->
        <script type="application/json">
            {}
        </script>
    </div>
    </div>
</section>
```