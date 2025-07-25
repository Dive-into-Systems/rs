# threading_race and threading_mutex
Both components operate in similar ways, sharing most of the underlying models and functionality. The component generates an intiial register state
and two threads of code (in the case of threading_mutex the threads are identical), each thread having an ifElse evaluation. The program then evaluates
concurrent execution of both threads and enumerates all possible final register states. The student is then asked to identify final states, which is
compared against the programmically determined ones to check answers. This component has two modes and two question types, making a total of 4 possible
combinations. The default setting is currently on mode 2 question type 2.

Modes:
1. Each if/else body contains at most one expression.
2. Each if/else body contains up to two expressions.

Question Types:
1. Multiple choice: students are asked to select all the possible states from a selection of options.
2. Fill in the blanks: students are asked to fill in the possible state in a table.

## Examples:
### Mode 1 Question type 1 threading_race
<img width="640" height="966" alt="image" src="https://github.com/user-attachments/assets/80a1883f-adbb-405a-a7f3-456825165bf7" />

### Mode 2 Question type 2 threading_race
<img width="629" height="957" alt="image" src="https://github.com/user-attachments/assets/54e5e140-c34c-4503-af5b-953450414b2e" />

### Mode 2 Question type 1 threading_mutex
<img width="642" height="987" alt="image" src="https://github.com/user-attachments/assets/0daf9d77-f0ef-4fa6-bf4b-0ee5da7412f0" />

### Mode 1 Question type 2 threading_mutex
<img width="626" height="954" alt="image" src="https://github.com/user-attachments/assets/b0f0d1ed-2b1e-4f2c-a808-ab21293049e7" />

## Prepopulating the question
Instructors can prepopulate the question by passing in a JSON object with the following fields:
1. "preset-questionType" : boolean that disables question type selection if set to true. If set to true, must provide a value for "questionType".
2. "preset-mode" : boolean that disables mode selection if set to true. If set to true, must provide a value for "mode".
3. "preset-problem" : boolean that determines whether to prepopulate the question with instructor-set code. If set to true, must provide values for "initialText",
"thread1Text", "thread2Text", and "answerArr". If the prepopulated question is for mode 1, a value must be provided for "distractors".
5. "disable-generate" : boolean that determines whether to disable the generate-another functionality.
6. "questionType" : integer that should be set to 1 or 2 depending on which question type is desired.
7. "mode" : integer that should be set to 1 or 2 depending on which mode is desired.
8. "initialText" : string that is displayed under "shared global variables"
9. "thread1Text" : string that is displayed under "thread 1"
10. "thread2Text" : string that is displayed under "thread 2"
11. "answerArr" : an array of arrays that is used as the answer key.
12. "distractors" : an array of arrays that is used as distractor answers for multiple choice questions.

### Details for text fields
1. Lines breaks should be indicated using the "\n" symbol.
2. Indentation and spacing is preserved.
3. Use XML special characters for < (&#60;), >(&#62;), &(&#38;), and "(&#34;). 
