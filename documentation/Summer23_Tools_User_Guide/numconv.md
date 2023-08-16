# Data Representation Exercises

For the Binary and Data Representation section of the book, we have created the Number Conversion component, it has the keyword `data-component = numberconversion`.

It is capable of automatically generating a question prompt based on reader's choices and checking answers on the fly.

This file describes what each question type does and includes a guide on how to use them. You can find the source code for them in the `./rs/bases/rsptx/interactives/runstone/numconv` directory.

<br>

## Number Conversion: `numconv`

This question requires users to convert a numeric value from `number system A` into `number system B`. Users can select these two number systems from the drop-down menus provided in the question prompt. By default, the numeric value is no larger than 4 bits, but instructors can always manually define bit-length in the `.ptx` file.

When using this components, some configurable options you might want to set up are:
- `"bits"`: specifies the number of binary bits in the exercise questions that user want to give to their students. The default number of bits is `4`.
- `"from-options"`: specifies the selectable number systems given in the prompt. By default, every option is granted, including `["binary", "decimal-unsigned", "decimal-signed", "hexadecimal"]`.
- `"to-options"`: specifies the selectable number systems given as an answer. By default, every option is granted, including `["binary", "decimal-unsigned", "decimal-signed", "hexadecimal"]`.

<br>

Here are some examples of how to use it:

### **Example 1 (with customized parameters)**
```html
<section id="number-conversion">
<h1>Number Conversion with Customized Parameters</h1>
    <!-- creating the exercise -->
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

### **Example 2 (with default parameters)**:
```html
<section id="number-conversion-2">
<h1>Number Conversion with Default Parameters</h1>
    <!-- creating the exercise -->
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