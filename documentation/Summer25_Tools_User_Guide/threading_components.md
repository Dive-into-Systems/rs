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
3. Use XML special characters for < (&#60), >(&#62), &(&#38), and "(&#34).

### Details for answer key and distractor fields
1. Each entry should be a state represented by an array of three items, which are the values of x, y (thread1), y (thread2) in that order. For example,
"answerArr" : [[3,5,5], [2,5,5]] indicates that there are two possible final states. The first state has values (x=3, y1=5. y2=5) and the second state
has values (x=2, y1=5, y2=5).
2. For questionType 2, answerArr can be any length and distractors can be left empty.
3. For questionType 1, the total length of answerArr and distractors should not exceed 5 for mode 2 and should not exceed 4 for mode 1.

## Examples:
### threading_race type 2 prepopulating problem only
```html
<div class="ptx-runestone-container">
            <div class="runestone">
              <div data-component="threading_race" data-question_label="1" id="threading_race">
                <script type="application/json">
                  {
                    "preset-questionType": false,
                    "preset-mode": false,
                    "preset-problem" : true,
                    "disable-generate" : false,
                    "questionType": 2,
                    "mode": 2,
                    "initialText" : "int x = 5;\n",
                    "thread1Text" : "void *thread(void *arg) {\n    int y = 5;\n    if (x >= 9){\n        y = 9;\n    } else{\n        x = x + y;\n    }\n    print('%d %d', x, y);\n    return NULL;\n}",
                    "thread2Text" : "void *thread(void *arg) {\n    int y = 7;\n    if (x >= y){\n        y = 1;\n    } else{\n        x = 1;\n    }\n    print('%d %d', x, y);\n    return NULL;\n}",
                    "answerArr" : [[10,5,1],[1,5,7],[10,5,7],[6,5,7]],
                    "distractors" : [[10,5,21]]
                    
                  }
                </script>
              </div> <!-- this component -->
            </div> <!--runestone-->
```

<img width="662" height="957" alt="image" src="https://github.com/user-attachments/assets/3c113689-196b-4268-aaf1-f770a7cbc732" />

### threading_race type 2 not prepopulating problem while disabling mode selection, question type selection, question generation
```html
<div class="ptx-runestone-container">
            <div class="runestone">
              <div data-component="threading_race" data-question_label="1" id="threading_race">
                <script type="application/json">
                  {
                    "preset-questionType": true,
                    "preset-mode": true,
                    "preset-problem" : false,
                    "disable-generate" : true,
                    "questionType": 2,
                    "mode": 2,
                    "initialText" : "int x = 5;\n",
                    "thread1Text" : "void *thread(void *arg) {\n    int y = 5;\n    if (x >= 9){\n        y = 9;\n    } else{\n        x = x + y;\n    }\n    print('%d %d', x, y);\n    return NULL;\n}",
                    "thread2Text" : "void *thread(void *arg) {\n    int y = 7;\n    if (x >= y){\n        y = 1;\n    } else{\n        x = 1;\n    }\n    print('%d %d', x, y);\n    return NULL;\n}",
                    "answerArr" : [[10,5,1],[1,5,7],[10,5,7],[6,5,7]],
                    "distractors" : [[10,5,21]]
                    
                  }
                </script>
              </div> <!-- this component -->
            </div> <!--runestone-->
```

<img width="648" height="807" alt="image" src="https://github.com/user-attachments/assets/d0f385fa-fe9e-4cdb-ab0b-08c6da693452" />

### threading_mutex type 1 prepopulating problem and setting question type
```html
<div data-component="threading_mutex" data-question_label="1" id="threading_mutex">
                <script type="application/json">
                  {
                    "preset-questionType": true,
                    "preset-mode": false,
                    "preset-problem" : true,
                    "disable-generate" : false,
                    "questionType": 1,
                    "mode": 2,
                    "initialText" : "int x = 5;\nint pthread_mutex_lock(pthread_mutex_t *mutex);",
                    "thread1Text" : "int y = 6;\npthread_mutex_lock(&#38;mutex);\nif (x >= 7){\n     x = x - y;\n     y = y + x;\n     pthread_mutex_unlock(&#38;mutex);\n}\nelse{\n     pthread_mutex_unlock(&#38;mutex);\n     y = y + x;\n}\nprint('%d %d', x, y);\nreturn NULL;",
                    "thread2Text" : "int y = 6;\npthread_mutex_lock(&#38;mutex);\nif (x >= 7){\n     x = x - y;\n     y = y + x;\n     pthread_mutex_unlock(&#38;mutex);\n}\nelse{\n     pthread_mutex_unlock(&#38;mutex);\n     y = y + x;\n}\nprint('%d %d', x, y);\nreturn NULL;",
                    "answerArr" : [[5,11,11]],
                    "distractors" : [[1,2,3],[2,3,4],[3,4,5],[4,5,6]]
                  }
                </script>
              </div> <!-- this component -->
            </div> <!--runestone-->
```
<img width="641" height="991" alt="image" src="https://github.com/user-attachments/assets/1adaf890-ce05-4985-8912-2c9058780942" />

