# threading_race and threading_mutex
Both components operate in similar ways, sharing most of the underlying models and functionality. The component generates an intiial register state
and two threads of code (in the case of threading_mutex the threads are identical), each thread having an ifElse evaluation. The program then evaluates
concurrent execution of both threads and enumerates all possible final register states. The student is then asked to identify final states, which is
compared against the programmically determined ones to check answers. This component has two modes and two question types, making a total of 4 possible
combinations.

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
<img width="641" height="987" alt="image" src="https://github.com/user-attachments/assets/3d040784-5f93-4472-9283-2124c2d16000" />

### Mode 2 Question type 1 threading_mutex
<img width="642" height="987" alt="image" src="https://github.com/user-attachments/assets/0daf9d77-f0ef-4fa6-bf4b-0ee5da7412f0" />

### Mode 1 Question type 2 threading_mutex
<img width="626" height="954" alt="image" src="https://github.com/user-attachments/assets/b0f0d1ed-2b1e-4f2c-a808-ab21293049e7" />




