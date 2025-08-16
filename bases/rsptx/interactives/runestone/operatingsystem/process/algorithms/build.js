/**
 * @file build.js
 * @brief Core utilities for constructing and simulating process hierarchies
 *        with fork, wait, and exit operations.
 * 
 * This file contains the fundamental algorithms for:
 * - Parsing fork expressions from compact notation (e.g., "F(abc,def)")
 * - Building process trees that simulate fork/wait/exit behavior
 * - Generating C code from the compact notation
 * - Creating print sequence constraints for timeline analysis
 * - Generating random test cases with configurable complexity
 * 
 * Key concepts:
 * - Compact notation: F(left_code, right_code) represents fork with parent and child code
 * - Process trees: Binary tree structure representing fork relationships
 * - Print sequences: Valid orderings of output considering process synchronization
 * 
 * @author Tony Cao, Luyuan Fan (Summer 2024), Zhengfei Li (Summer 2025, bug fixes and improvements)
 */

// ============================================================================
// CONSTANTS AND GLOBAL STATE
// ============================================================================

/** Indentation spacing for generated C code */
const INDENT_SPC = 2;
/** Unicode dash character for tree visualization */
const DASH = "─";
/** HTML space entity for formatting */
const SPC = "&#8195;";
/** Regular space character */
const SPC1 = " ";
/** Character representing wait() in compact notation */
const WAIT_CHAR = "W";
/** HTML line break for code formatting */
const NEWLINE = "<br>";
/** Character representing exit() in compact notation */
export const EXIT_CHAR = "X";
/** Placeholder character for print statements in compact notation */
const PRINT_CHAR = "-";
/** Character representing null/empty processes in tree visualization */
const nullChar = "\\";

// Global state for tracking code generation patterns (used for weighted random generation)
/** Whether previous generated code had child processes */
let prev_code_child = false;
/** Whether previous generated code had after-wait sections */
let prev_code_afterwait = false;
/** Whether previous generated code had parallel sections */
let prev_code_parallel = false;
/** Whether current generated code has child processes */
let current_code_child = false;
/** Whether current generated code has after-wait sections */
let current_code_afterwait = false;
/** Whether current generated code has parallel sections */
let current_code_parallel = false;

// ============================================================================
// UTILITY FUNCTIONS FOR RANDOMIZATION AND DATA MANIPULATION
// ============================================================================

/**
 * Generate a uniform random float in [0, 1) using crypto.getRandomValues for strong randomness.
 * Uses cryptographically secure random number generation instead of Math.random()
 * for better randomness quality in educational content generation.
 * 
 * @returns {number} A random float between 0 (inclusive) and 1 (exclusive)
 */
function randomFloat32() {
    return window.crypto.getRandomValues(new Uint32Array(1))[0]/(2**32);
    // return Math.random(); // Fallback option, but crypto is preferred
}

/**
 * Selects a random index from an array using uniform distribution.
 * 
 * @param {Array} arr - The array to select from
 * @returns {number} A random index between 0 and arr.length-1
 */
function unifPickId(arr) {
    return Math.floor(randomFloat32() * arr.length);
}

/**
 * Selects a random item from one or more arrays using uniform distribution.
 * Flattens all input arrays and picks uniformly from the combined result.
 * 
 * @param {...Array} items - One or more arrays to select from
 * @returns {*} A randomly selected item from the combined arrays
 * @throws {Error} If no arrays provided or all arrays are empty
 */
function unifPickItem(...items) {
    const combinedArray = items.flat();
    if (!combinedArray.length) throw new Error("No arrays provided or all are empty.");
    return combinedArray[unifPickId(combinedArray)];
}

/**
 * Selects an index from an array of weights using weighted random selection.
 * Higher weights have proportionally higher chance of being selected.
 * 
 * @param {number[]} odds - Array of weights (non-negative numbers)
 * @returns {number} Index of the selected element based on weights
 */
function weightedPickId(odds) {
    const total = odds.reduce((sum, a) => sum + a, 0);
    let seed = randomFloat32() * total;
    return odds.findIndex((odds, i) => (seed -= odds) < 0);
}

/**
 * Fisher-Yates shuffle algorithm to randomly shuffle an array in-place.
 * Used for randomizing answer choices and other list orderings.
 * 
 * @param {Array} array - The array to shuffle (modified in-place)
 * @returns {Array} The same array, now shuffled
 */
function shuffle(array) {
    var tmp, current, top = array.length;

    if(top) while(--top) {
        current = Math.floor(Math.random() * (top + 1));
        tmp = array[current];
        array[current] = array[top];
        array[top] = tmp;
    }

    return array;
}

/**
 * Counts the frequency of each unique element in an array.
 * Returns a Map with elements as keys and their counts as values.
 * 
 * @param {Array} arr - The array to analyze
 * @returns {Map} Map where keys are unique elements and values are their counts
 */
function findCountElement(arr) {
    const map = new Map();
    for (const element of arr) {
        if (map.has(element)) {
            map.set(element, map.get(element) + 1);
        } else {
            map.set(element, 1);
        }
    }
    return map;
}

/**
 * Randomly interleaves two arrays to simulate concurrent execution.
 * This is crucial for modeling how print statements from different processes
 * can be interleaved during concurrent execution.
 * 
 * Example: randomWeave([1,2,3], [a,b,c]) might produce [1,a,2,b,3,c] or [a,1,b,2,c,3]
 * 
 * @param {Array} arr1 - First array (e.g., parent process prints)
 * @param {Array} arr2 - Second array (e.g., child process prints)
 * @returns {Array} Randomly interleaved combination of both arrays
 */
function randomWeave(arr1, arr2) {
    // Ensure the inputs are arrays to handle edge cases
    arr1 = arr1 || [];
    arr2 = arr2 || [];
    const result = [];
    let i = 0, j = 0;
  
    // Continue until both arrays are exhausted
    while (i < arr1.length || j < arr2.length) {
      if (i < arr1.length && j < arr2.length) {
        // Both arrays have elements - randomly choose which to take from
        if (Math.random() < 0.5) {
          result.push(arr1[i]);
          i++;
        } else {
          result.push(arr2[j]);
          j++;
        }
      } else if (i < arr1.length) {
        // Only arr1 has elements left
        result.push(arr1[i]);
        i++;
      } else if (j < arr2.length) {
        // Only arr2 has elements left
        result.push(arr2[j]);
        j++;
      }
    }
    return result;
}



// ============================================================================
// PARSING FUNCTIONS FOR COMPACT NOTATION
// ============================================================================

/**
 * Parses the arguments of a fork expression from compact notation.
 * Handles nested parentheses to correctly identify parent and child code blocks.
 * 
 * Compact notation: F(parent_code, child_code) where either can be empty
 * Examples: 
 *   F(abc,def) -> parent: "abc", child: "def"
 *   F(,abc) -> parent: "", child: "abc" 
 *   F(abc) -> parent: "abc", child: ""
 * 
 * @param {string} code - The complete source code string
 * @param {number} forkIndex - Index of 'F' character starting the fork expression
 * @returns {Array} [parentCode, childCode, nextIndex] where nextIndex points after closing ')'
 */
function parseForkArgs(code, forkIndex) {
    let balance = 1; // Track parentheses nesting level
    let topLevelComma = null; // Position of the comma separating parent and child code
    let [start, end] = [forkIndex + 2, forkIndex + 2]; // Start after 'F('
    
    // Add protection against infinite loops in malformed input
    const maxIterations = code.length + 100; // Safety margin beyond code length
    let iterationCount = 0;
    
    // Find the matching closing parenthesis
    while (end < code.length && iterationCount < maxIterations) {
        if (code[end] === '(') balance++;      // Nested opening
        if (code[end] === ')') balance--;      // Closing parenthesis
        if (balance === 0) break;              // Found matching closing bracket
        if (balance === 1 && code[end] === ',') topLevelComma ??= end; // Only the first top-level comma
        end++;
        iterationCount++;
    }
    
    // Log warning if we hit the safety limit (indicates malformed input)
    if (iterationCount >= maxIterations) {
        console.warn("Potential infinite loop detected in parseForkArgs - breaking after", maxIterations, "iterations");
    }

    // Return parsed components
    if (!topLevelComma) return [code.substring(start, end), '', end];
    return [
        code.substring(start, topLevelComma),           // Parent code
        code.substring(topLevelComma + 1, end),         // Child code  
        end // Next index to continue parsing
    ];
}

/**
 * Splits code at the first top-level wait() call.
 * Used to separate "before wait" and "after wait" execution phases.
 * 
 * @param {string} code - Code string that may contain wait operations
 * @returns {Array} [beforeWaitCode, afterWaitCode] - empty afterWaitCode if no wait found
 */
function parseForkWait(code) {
    let balance = 0;     // Track parentheses nesting
    let start = 0, i = 0, wait = -1;
    
    // Find first top-level wait character
    while (i < code.length) {
        if (code[i] === '(') balance++;
        if (code[i] === ')') balance--;
        if (balance === 0 && code[i] === WAIT_CHAR) {
            wait = i;
            break;
        }
        i++;
    }

    // Split at wait position or return original code if no wait found
    if (wait === -1) return [code, ''];
    return [
        code.substring(start, wait),           // Code before wait
        code.substring(wait + 1, code.length)  // Code after wait
    ];
}

/**
 * Extracts code up to and including the first top-level exit() call.
 * Used to determine the portion of child code that actually executes before exit.
 * 
 * @param {string} code - Code string that may contain exit operations
 * @returns {string} Code from start up to and including the first exit, or full code if no exit
 */
function parseForkExit(code) {
    let balance = 0;      // Track parentheses nesting
    let start = 0, end = 0;
    
    // Find first top-level exit character
    while (end < code.length) {
        if (code[end] === '(') balance++;
        if (code[end] === ')') balance--;
        if (balance === 0 && code[end] === EXIT_CHAR) {
            end++; // Include the exit character
            break;
        }
        end++;
    }
    return code.substring(start, end);
}

// ============================================================================
// HELPER FUNCTIONS AND DATA STRUCTURES
// ============================================================================

/**
 * Creates a blank info object for tracking code generation results.
 * This structure is used throughout the tree building process to accumulate:
 * - Generated C code lines
 * - Execution traces for visualization
 * - Active process information
 * - Historical process data
 * 
 * @returns {Object} Blank info object with empty arrays
 */
function blankInfo() {
    return {
        cCode: [],    // Generated C code lines
        trace: [],    // Execution trace for timeline visualization
        proc: [],     // Currently active processes
        hist: []      // Historical process information
    };
}

/**
 * Concatenates multiple arrays into a single array.
 * Used for combining results from different execution branches.
 * 
 * @param {...Array} arrays - Variable number of arrays to concatenate
 * @returns {Array} Single array containing all elements from input arrays
 */
function concat(...arrays) {
    return arrays.reduce((acc, curr) => [...acc, ...curr], []);
}

// ============================================================================
// FORK NODE CLASS - CORE PROCESS TREE STRUCTURE
// ============================================================================

/**
 * Represents a node in the process execution tree for simulating UNIX fork() behavior.
 * 
 * @class ForkNode
 * @description 
 * This class models the execution tree created by fork() system calls in UNIX-like systems.
 * Each node represents a distinct process state in the execution timeline, forming a binary
 * tree where left children represent process continuation and right children represent
 * newly forked child processes.
 * 
 * **Tree Structure Semantics:**
 * - **Left child (this.left)**: Represents the parent process continuing execution after fork()
 * - **Right child (this.right)**: Represents the child process created by fork()
 * - **Leaf nodes**: Terminal states where processes have exited or reached end of execution
 * 
 * **Process Identification:**
 * Uses a hierarchical numbering system where:
 * - Root process starts with ID 0
 * - Child processes get IDs like: 1, 2, 11, 12, 21, 22, etc.
 * - Process IDs are displayed as "parentID.childCount" (e.g., "0.1", "1.2")
 * 
 * **Execution Model:**
 * - fork() creates two execution paths from a single point
 * - Parent process continues with knowledge of child's PID
 * - Child process starts fresh with fork() returning 0
 * - Both processes can execute concurrently (simulated as parallel branches)
 * 
 * **State Tracking:**
 * - `active`: Whether the process is still executing (false = exited)
 * - `value`: Accumulated output from printf() calls in this process
 * - `waited`: Whether this process has called wait() (for synchronization)
 * - `childCt`: Number of child processes this process has spawned
 * 
 * @example
 * // Creating a simple process tree for: F(a,b)
 * let root = new ForkNode(0, 0, true, "");
 * // After processing fork with left="a", right="b":
 * // root.left = process continuing with "a" (parent)
 * // root.right = new child process executing "b"
 * 
 * @example
 * // Process hierarchy visualization:
 * //     Root (0.0)
 * //    /          \
 * //   Parent      Child
 * //   (0.1)       (1.0)
 * //   |           |
 * //   continues   executes
 * //   with code   child code
 */
class ForkNode {
    /**
     * Creates a new process node in the execution tree.
     * 
     * @param {number} [id=0] - Numeric process identifier used for hierarchical naming.
     *                         Combined with childCt to create human-readable process IDs.
     * @param {number} [childCt=0] - Count of child processes this process has spawned.
     *                              Used to generate unique child process IDs.
     * @param {boolean} [active=true] - Whether this process is currently executing.
     *                                 Set to false when process calls exit() or terminates.
     * @param {string} [value=""] - Accumulated output from printf() statements executed by this process.
     *                             Represents the observable output in the terminal.
     * @param {ForkNode|null} [left=null] - Reference to the continuation of this process after fork().
     *                                     Represents the parent process's continued execution.
     * @param {ForkNode|null} [right=null] - Reference to the child process created by fork().
     *                                      Represents the new process spawned by this fork call.
     * 
     * @example
     * // Create root process
     * let root = new ForkNode(0, 0, true, "");
     * 
     * @example
     * // Create child process with specific output
     * let child = new ForkNode(1, 0, true, "Child output: ");
     * 
     * @example
     * // Create terminated process
     * let dead = new ForkNode(2, 1, false, "abc");
     */
    constructor(id = 0, childCt = 0, active = true, value = "", left = null, right = null) {
        this.id = id;              // Numeric process identifier
        this.childCt = childCt;    // Number of children created by this process
        this.active = active;      // Whether process is still running
        this.value = value;        // Accumulated print output
        this.left = left;          // Parent continuation after fork
        this.right = right;        // Child process created by fork
        this.waited = false;       // Whether this process has called wait()
    }

    /**
     * Calculates the process IDs and child counts for the next fork operation.
     * 
     * @description
     * Uses a hierarchical numbering scheme to generate unique identifiers for
     * parent and child processes after a fork() call. The numbering ensures
     * that each process in the execution tree has a unique identifier that
     * reflects its position in the process hierarchy.
     * 
     * **Algorithm:**
     * - Parent continues with same ID but incremented child count
     * - Child gets new ID: (parent_id * 10 + parent_child_count + 1)
     * - Child starts with child count of 0
     * 
     * @returns {number[]} A 4-element array containing:
     *   - [0] parentID: Process ID for the continuing parent process
     *   - [1] parentChildCount: Updated child count for parent (childCt + 1)
     *   - [2] childID: Process ID for the newly created child process
     *   - [3] childChildCount: Initial child count for child process (always 0)
     * 
     * @example
     * // Root process (id=0, childCt=0) forks for the first time
     * let root = new ForkNode(0, 0);
     * let [parentID, parentCt, childID, childCt] = root.getChildrenInfo();
     * // Returns: [0, 1, 1, 0]
     * // Parent: ID=0, childCt=1 | Child: ID=1, childCt=0
     * 
     * @example
     * // Process (id=1, childCt=2) forks again
     * let proc = new ForkNode(1, 2);
     * let info = proc.getChildrenInfo();
     * // Returns: [1, 3, 13, 0]
     * // Parent: ID=1, childCt=3 | Child: ID=13, childCt=0
     */
    getChildrenInfo() {
        // Parent continues with incremented child count
        // Child gets a new ID based on parent's ID and child index
        return [this.id, this.childCt+1, this.id*10+this.childCt+1, 0];
    }

    /**
     * Generates human-readable process IDs for parent and child after fork.
     * 
     * @description
     * Converts the numeric process identifiers into human-readable strings
     * that are displayed in the UI. The format clearly shows the relationship
     * between parent and child processes and their fork history.
     * 
     * **Format:** "processID.childCount" 
     * - processID: The hierarchical numeric identifier
     * - childCount: Number of children this process has spawned
     * 
     * @returns {string[]} A 2-element array containing:
     *   - [0] parentProcessID: Human-readable ID for the parent process
     *   - [1] childProcessID: Human-readable ID for the child process
     * 
     * @example
     * // Root process forks for first time
     * let root = new ForkNode(0, 0);
     * let [parentID, childID] = root.getChildrenID();
     * // Returns: ["0.1", "1.0"]
     * // Parent shows it now has 1 child, child shows it has 0 children
     * 
     * @example
     * // Process that has already forked twice
     * let proc = new ForkNode(12, 2);
     * let [parentID, childID] = proc.getChildrenID();
     * // Returns: ["12.3", "123.0"]
     * // Parent shows 3rd child, child gets hierarchical ID 123
     * 
     * @see {@link getChildrenInfo} For the underlying numeric calculation
     */
    getChildrenID() {
        const [leftID, leftCt, rightID, rightCt] = this.getChildrenInfo();
        const leftChildID = `${leftID}.${leftCt}`;
        const rightChildID = `${rightID}.${rightCt}`;
        return [leftChildID, rightChildID];
    }
    
    /**
     * Calculates the maximum execution timeline length in this subtree.
     * 
     * @description
     * Recursively traverses the process tree to find the longest execution
     * path from this node to any terminal state. This is used by the timeline
     * visualization component to determine the required canvas width.
     * 
     * The calculation considers:
     * - Parent continuation path (left subtree + 1 for current node)
     * - Child process paths (right subtree, no +1 since child starts parallel)
     * 
     * @returns {number} Maximum timeline length considering all execution branches.
     *                  Returns 0 for terminal nodes (no children).
     * 
     * @example
     * // Simple fork: F(a,b) 
     * // Parent timeline: fork -> a (length 2)
     * // Child timeline: b (length 1)
     * // Returns: max(2, 1) = 2
     * 
     * @example
     * // Nested fork: F(F(a,b),c)
     * // Parent path: fork -> fork -> a (length 3)
     * // Child paths: fork -> b (length 2), c (length 1)
     * // Returns: max(3, 2, 1) = 3
     * 
     * @see {@link timelineCt} For counting the number of timelines
     */
    timelineLen() {
        // Compare continuation timeline vs child timeline, take the longer one
        return Math.max(this.left?(this.left.timelineLen()+1):0, this.right?(this.right.timelineLen()):0);
    }

    /**
     * Counts the total number of execution timelines in this subtree.
     * 
     * @description
     * Recursively counts all distinct execution paths (timelines) that originate
     * from this node. Each terminal node (leaf) in the tree represents one
     * complete execution timeline. This is used by the visualization system
     * to determine how many horizontal tracks are needed to display all timelines.
     * 
     * **Counting Logic:**
     * - Terminal nodes (no children): count as 1 timeline
     * - Non-terminal nodes: sum of left subtree + right subtree timeline counts
     * - Left child (parent continuation): always contributes at least 1
     * - Right child (forked child): contributes 0 if doesn't exist, otherwise its count
     * 
     * @returns {number} Total count of distinct execution timelines in this subtree.
     *                  Always returns at least 1 for any non-null node.
     * 
     * @example
     * // Simple fork: F(a,b)
     * // Creates 2 timelines: parent path and child path
     * // Returns: 2
     * 
     * @example
     * // Nested fork: F(F(a,b),c)  
     * // Parent side creates 2 timelines, child side creates 1
     * // Returns: 2 + 1 = 3
     * 
     * @example
     * // Sequential operations: abc (no forks)
     * // Single timeline from start to finish
     * // Returns: 1
     * 
     * @see {@link timelineLen} For calculating timeline length
     */
    timelineCt() {
        // Count timelines: parent continuation + child processes
        return ( this.left?this.left.timelineCt():1 ) + ( this.right?this.right.timelineCt():0 );
    }

    /**
     * Propagates a print operation to all active processes in this subtree.
     * 
     * @description
     * Simulates the printf() system call by propagating print operations through
     * the process tree. This models the real-world behavior where multiple processes
     * can print to stdout concurrently after a fork() call.
     * 
     * **Propagation Rules:**
     * 1. Inactive (exited) processes cannot print - operation is ignored
     * 2. Active processes with children propagate to both left (parent) and right (child)
     * 3. Terminal active processes (no children) accumulate the text in their value
     * 4. Non-terminal active processes pass the operation to their children
     * 
     * **Real-world Analogy:**
     * After fork(), both parent and child processes can call printf(). Each process
     * has its own execution context but shares the same stdout, so both outputs
     * are visible (though order may vary due to scheduling).
     * 
     * @param {string} text - The text to print/append to process output.
     *                       Usually a single character from the compact notation.
     * 
     * @example
     * // Process tree after F(a,b):
     * //   root
     * //   ├── parent (continues)
     * //   └── child (new process)
     * // 
     * // root.print("x") will:
     * // - Send "x" to both parent and child
     * // - Both will show "x" in their output streams
     * 
     * @example
     * // Sequential prints on simple tree:
     * let root = new ForkNode();
     * root.print("a");  // Only root prints "a"
     * // After fork occurs...
     * root.print("b");  // Both parent and child print "b"
     * 
     * @see {@link exit} For terminating processes
     */
    print(text) {
        if (this.right) this.right.print(text); // Child process also prints
        if (!this.active) return; // Dead processes don't print
        if (this.left) { 
            // Continue propagation to future execution states
            this.left.print(text);
        } else {
            // Terminal node: actually accumulate the output
            this.value += text;
        }
    }

    /**
     * Propagates an exit operation to all active processes in this subtree.
     * 
     * @description
     * Simulates the exit() system call by terminating all active processes
     * in this subtree. This models the real-world behavior where calling
     * exit() terminates the current process immediately, and any child
     * processes also receive the termination signal.
     * 
     * **Termination Rules:**
     * 1. Inactive (already exited) processes are unaffected
     * 2. Active processes with children propagate exit to both left and right subtrees
     * 3. Terminal active processes mark themselves as inactive and record "X" in output
     * 4. Non-terminal active processes pass the exit signal to their children
     * 
     * **Visual Indicator:**
     * The "X" character is added to the process output to indicate termination,
     * which appears in timeline visualizations to show when processes exit.
     * 
     * **Real-world Analogy:**
     * In UNIX systems, exit() terminates the calling process and notifies the
     * parent via wait(). Child processes become orphaned and are adopted by init.
     * This simulation simplifies by terminating entire subtrees.
     * 
     * @example
     * // Process tree before exit:
     * //   root (active)
     * //   ├── parent (active, value="ab")
     * //   └── child (active, value="c")
     * //
     * // root.exit() results in:
     * //   root (inactive)
     * //   ├── parent (inactive, value="abX")
     * //   └── child (inactive, value="cX")
     * 
     * @example
     * // Partial exit - only affects active processes:
     * // If child was already exited, only parent gets terminated
     * 
     * @see {@link print} For output operations
     * @see {@link active} Property that tracks process state
     */
    exit() {
        if (this.right) this.right.exit(); // Child process also exits
        if (!this.active) return; // Already dead processes are unaffected
        if (this.left) {
            // Propagate exit to future execution states
            this.left.exit();
        }
        else {
            // Terminal node: mark as exited and record exit in output
            this.print("X");
            this.active = false;
        }
    }

    /**
     * Executes a fork operation, creating parent and child execution branches.
     * 
     * @description
     * This is the core method that simulates the fork() system call by creating
     * two execution paths from a single point. It recursively processes the
     * process tree and generates both the execution trace and the corresponding
     * C code structure.
     * 
     * **Fork Semantics:**
     * - Creates two processes from one: parent (left) and child (right)
     * - Parent continues with leftCode and gets child's PID
     * - Child starts fresh with rightCode and fork() returns 0
     * - Both processes can execute concurrently from the fork point
     * 
     * **Code Generation:**
     * - Generates appropriate if/else blocks for conditional execution
     * - Handles indentation for nested fork structures
     * - Tracks process information for timeline visualization
     * - Merges execution traces from multiple branches
     * 
     * **Return Structure:**
     * Returns execution info objects containing:
     * - cCode: Generated C code lines
     * - trace: Process execution timeline data
     * - proc: Currently active process identifiers
     * - hist: Historical process information
     * 
     * @param {string} leftCode - Code to execute in parent process after fork
     * @param {string} rightCode - Code to execute in child process after fork
     * @param {number} indent - Current indentation level for code generation
     * @param {number} terminate - Maximum number of operations to process (prevents infinite loops)
     * 
     * @returns {Array} A 3-element array containing:
     *   - [0] leftResult: Execution info for parent process continuation
     *   - [1] rightResult: Execution info for child process
     *   - [2] exitingProc: Reference to the child process node (for further operations)
     * 
     * @example
     * // Simple fork: F(a,b)
     * let root = new ForkNode(0, 0, true, "");
     * let [leftInfo, rightInfo, childNode] = root.fork("a", "b", 0, 10);
     * // leftInfo contains parent execution with "a"
     * // rightInfo contains child execution with "b"
     * // childNode points to the child process
     * 
     * @example
     * // Generated C code structure for F(a,b):
     * // if (fork()) {
     * //     printf("a");
     * // } else {
     * //     printf("b");
     * // }
     * 
     * @throws {Error} Implicitly handles malformed input through safety limits
     * @see {@link pushCode} For processing individual operations
     * @see {@link getChildrenInfo} For process ID generation
     */
    fork(leftCode, rightCode, indent, terminate) {
        function concat2D(array1, array2) {
            let result = [];
            for (let i = 0; i < Math.max(array1.length, array2.length); i++) {
                let row1 = array1[i] || [];
                let row2 = array2[i] || [];
                result.push(row1.concat(row2));
            }
        
            return result;
        }

        function mergeInfo(a, b) {
            if (b.cCode && !a.cCode) a.cCode = b.cCode;
            a.proc.push(...b.proc);
            a.hist.push(...b.hist);
            a.trace = concat2D(a.trace, b.trace);
        }

        function purge(a) {
            a.trace.fill("");
            a.hist = [];
            a.proc = [];
        }
        let left = blankInfo();
        let right = blankInfo();
        let temp1 = blankInfo();
        let temp2 = blankInfo();
        let exitingProc;
        if (!this.active) {
            [left, temp1] = (new ForkNode(0, 0, true, "", null, null)).fork(leftCode, rightCode, indent, terminate);
            purge(left);
            purge(temp1); // basically, make no changes to current tree
        }
        else {
            if (this.left) {
                [left, temp1] = this.left.fork(leftCode, rightCode, indent, terminate);
            } else {
                // self exec, BASE CASE
                let leftTerm = terminate-1; // adjust for F(
                const [leftID, leftCt, rightID, rightCt] = this.getChildrenInfo();
                this.left = new ForkNode(leftID, leftCt, true, "", null, null);
                left = this.left.pushCode(leftCode, indent, leftTerm);

                let rightTerm = leftTerm;
                if (left.cCode.length>0) {
                    rightTerm = leftTerm - 1 - left.cCode.length;
                }
                // ordering matters here! , left.right can only be created after left push is done
                this.left.right = new ForkNode(rightID, rightCt, true, "", null, null);
                temp1 = this.left.right.pushCode(rightCode, indent, rightTerm);
                exitingProc = this.left.right;
                // Add protection against infinite loops
                let maxIterations = 1000; // Safety limit to prevent infinite loops
                let iterationCount = 0;
                while (exitingProc.left && iterationCount < maxIterations) {
                    exitingProc = exitingProc.left;
                    iterationCount++;
                }
                // Log warning if we hit the safety limit
                if (iterationCount >= maxIterations) {
                    console.warn("Potential infinite loop detected in exitingProc chain - breaking after", maxIterations, "iterations");
                }
            }

        }
        if (this.right) [temp2, right] = this.right.fork(leftCode, rightCode, indent, terminate);
        right.cCode = temp1.cCode;
        // left.hist.push(temp2.hist);
        mergeInfo(left, temp2);
        mergeInfo(right, temp1);

        return [left, right, exitingProc];
    }

    /**
     * Processes a sequence of operations and generates corresponding C code and execution trace.
     * 
     * @description
     * This method is the main interpreter for the compact notation language. It processes
     * a string of operations character by character and generates:
     * 1. Equivalent C code with proper structure and indentation
     * 2. Execution trace data for timeline visualization
     * 3. Process tracking information for hierarchy display
     * 
     * **Supported Operations:**
     * - Regular characters (a-z): Converted to printf() statements
     * - 'F': Fork operation with optional parent/child code blocks
     * - 'X': Exit operation (terminates current process)
     * - 'W': Wait operation (synchronization primitive)
     * 
     * **Code Generation:**
     * - Maintains proper indentation for nested structures
     * - Tracks active processes for each operation
     * - Handles termination limits to prevent infinite loops
     * - Generates execution traces for visualization
     * 
     * **Process Tracking:**
     * - Updates live process lists as operations execute
     * - Maintains historical process information
     * - Tracks which processes are active at each step
     * 
     * @param {string} code - Compact notation string to process (e.g., "aF(b,c)dX")
     * @param {number} [indent=0] - Initial indentation level for generated code
     * @param {number} [terminate] - Maximum operations to process (defaults to code.length)
     *                             Used to prevent infinite recursion and control execution depth
     * 
     * @returns {Object} Execution information object containing:
     *   - cCode: Array of generated C code lines with proper indentation
     *   - trace: 2D array tracking which processes are active for each operation
     *   - proc: Array of currently active process identifiers
     *   - hist: Array of historical process information
     * 
     * @example
     * // Simple sequence: "abc"
     * let node = new ForkNode(0, 0, true, "");
     * let result = node.pushCode("abc");
     * // result.cCode = ["printf(\"a\");", "printf(\"b\");", "printf(\"c\");"]
     * // result.trace = [["0.0"], ["0.0"], ["0.0"]]
     * 
     * @example
     * // Fork operation: "F(a,b)"
     * let result = node.pushCode("F(a,b)");
     * // Generates C code with if/else structure
     * // Creates separate execution paths for parent and child
     * 
     * @example
     * // Complex nested: "aF(bF(c,d),e)f"
     * // Generates nested if/else blocks with proper indentation
     * // Tracks multiple concurrent process timelines
     * 
     * @see {@link fork} For fork operation implementation
     * @see {@link print} For printf simulation
     * @see {@link exit} For process termination
     */
    pushCode(code, indent = 0, terminate) {
        terminate ??= code.length;
        let leftResult = blankInfo();
        let rightResult = blankInfo();
        let liveProcesses = this.active?[`${this.id}.${this.childCt}`]:[""];
        let cCode = [];
        let trace = [];
        let hist = [];

        let leftCode, rightCode;
        let exitingProc;

        function addLine(line, active, extraProc) {
            terminate--;
            trace.push(active?(extraProc||liveProcesses):([]));
            cCode.push(`${SPC.repeat(indent)}${line}`);
        }

        function emptyStrOnly(arr) {
            return !Array.isArray(arr) || arr.every(str => typeof str !== 'string' || str.trim() === '');
        }
        for (let ptr = 0; ptr < code.length; ptr++) {
            if (terminate < 0) {
                break;
            }
            if (code[ptr] == EXIT_CHAR) {
                addLine(`exit();`, this.active);
                // hist.push(...liveProcesses);
                liveProcesses = [""];
                this.exit();
                continue;
            }
            if (code[ptr] == WAIT_CHAR) {
                addLine(`wait(NULL);`, this.active);
                continue;
            }
            if (code[ptr]!= "F") {
                addLine(`printf("${code[ptr]}");`, this.active);
                this.print(code[ptr]);
                continue;
            }
            // if you're fixing this section i apologize ;-; - tony
            if (code[ptr] == "F") {
                [leftCode, rightCode, ptr] = parseForkArgs(code, ptr);
                [leftResult, rightResult, exitingProc] = this.fork(leftCode, rightCode, indent + INDENT_SPC, terminate);

                let leftPre = emptyStrOnly(leftResult.hist)?leftResult.proc:leftResult.hist;
                let rightPre = emptyStrOnly(rightResult.hist)?rightResult.proc:rightResult.hist;
                // let rightPre = rightResult.hist;

                if (!leftCode && !rightCode) addLine("fork();", this.active, concat(leftPre, rightPre)); // odd
                if (leftCode) {
                    addLine("if (fork()) {", this.active, concat(leftPre, rightPre));
                    terminate -= leftResult.cCode.length;
                    cCode.push(...leftResult.cCode);
                    trace.push(...leftResult.trace);
                    if (rightCode)  addLine("} else {", this.active, rightPre);
                    else            addLine("}", this.active, concat(leftResult.proc, rightResult.proc));
                }
                if (rightCode) {
                    if (!leftCode) addLine("if (fork() == 0) {", this.active, concat(leftPre, rightPre));
                    terminate -= rightResult.cCode.length;
                    cCode.push(...rightResult.cCode);
                    trace.push(...rightResult.trace);
                    addLine("}", this.active, concat(leftResult.proc, rightResult.proc));
                }
                if (this.active) {
                    // hist.push(...liveProcesses, ...leftResult.hist);
                    hist.push(...liveProcesses);
                    liveProcesses = concat(leftResult.proc, rightResult.proc);
                }
            }
            // - end
        }

        let result = blankInfo();
        result.cCode = cCode;
        result.trace = trace;
        result.proc = liveProcesses;
        result.hist = hist; // processes that we created but eventually "killed"
        return result;
    }

    /**
     * Converts the process tree to a serializable JSON-compatible object.
     * 
     * @description
     * Recursively traverses the process tree and creates a plain JavaScript object
     * that can be JSON-serialized for storage, transmission, or debugging purposes.
     * This is useful for saving process tree states, sending data to visualization
     * components, or persisting execution results.
     * 
     * **Serialization Rules:**
     * - Preserves process ID, child count, and accumulated output value
     * - Recursively serializes left (parent continuation) and right (child) subtrees
     * - Terminal nodes (no left child) are marked with special "EXIT" entries
     * - Maintains tree structure for reconstruction or analysis
     * 
     * **Output Structure:**
     * Each node becomes an object with:
     * - id: Process identifier
     * - childCt: Number of children spawned (-1 for EXIT markers)
     * - value: Accumulated output or "EXIT" for termination markers
     * - children: Array containing serialized child nodes
     * 
     * **EXIT Markers:**
     * Terminal nodes (leaf processes) are represented with a special child
     * entry that has childCt=-1 and value="EXIT" to indicate process termination.
     * 
     * @returns {Object} A JSON-serializable object representing the process tree structure.
     *                  Contains id, childCt, value, and children array properties.
     * 
     * @example
     * // Simple process tree for F(a,b):
     * // Returns structure like:
     * // {
     * //   id: 0, childCt: 1, value: "",
     * //   children: [
     * //     { id: 0, childCt: 1, value: "a", children: [...] },  // parent
     * //     { id: 1, childCt: 0, value: "b", children: [...] }   // child
     * //   ]
     * // }
     * 
     * @example
     * // Terminal process serialization:
     * // { id: 2, childCt: -1, value: "EXIT", children: [] }
     * 
     * @example
     * // Usage for debugging or storage:
     * let tree = new ForkNode();
     * // ... build tree with operations ...
     * let serialized = tree.serialize();
     * console.log(JSON.stringify(serialized, null, 2));
     * 
     * @see {@link JSON.stringify} For converting result to JSON string
     */
    serialize() {
        const obj = {
            id: this.id,
            childCt: this.childCt,
            value: this.value,
            children: []
        };
        if (this.left) {
            obj.children.push(this.left.serialize());
        } else {
            obj.children.push({
                id: this.id,
                childCt: -1,
                value: "EXIT",
                children: []
            });
        }
        if (this.right) obj.children.push(this.right.serialize());
        return obj;
    }
}

/**
 * Represents a print operation with dependency tracking for correct sequence generation.
 * 
 * @class PrintItem
 * @description
 * This class models individual printf() operations in the process execution timeline.
 * It tracks dependencies between print operations to ensure correct ordering when
 * multiple processes can print concurrently. The dependency system implements a
 * topological sort approach to determine valid print sequences.
 * 
 * **Dependency System:**
 * - Each print operation can depend on other print operations that must execute first
 * - Dependencies are established based on process synchronization (fork/wait/exit)
 * - The dependency count is maintained for efficient topological sorting
 * 
 * **Use Cases:**
 * - Generating correct print sequences for educational examples
 * - Validating user-provided print sequences against process constraints
 * - Creating multiple-choice questions with plausible incorrect answers
 * 
 * **Timeline Integration:**
 * - executionIndex links prints to specific points in the execution timeline
 * - printed flag tracks completion status during sequence verification
 * - printChar contains the actual character/string to be printed
 * 
 * @example
 * // Simple print with no dependencies
 * let print1 = new PrintItem('a', 0, [], false);
 * 
 * @example
 * // Print that depends on another print
 * let print2 = new PrintItem('b', 1, [print1], false);
 * // print2 can only execute after print1 is completed
 * 
 * @example
 * // Complex dependency chain for F(a,Wb)c:
 * // - 'a' has no dependencies
 * // - 'b' depends on parent's wait() call
 * // - 'c' depends on both 'a' and 'b' completing
 */
export class PrintItem {
    /**
     * Creates a new print operation with dependency tracking.
     * 
     * @param {string} printChar - The character or string to be printed by this operation.
     *                            Usually a single character from the compact notation.
     * @param {number} executionIndex - Position in the global execution timeline.
     *                                 Was used for highlighting code and timeline -- deprecated.
     * @param {PrintItem[]} [dependencies=[]] - Array of PrintItem objects that must
     *                                         complete before this print can execute.
     * @param {boolean} [printed=false] - Whether this print operation has been executed.
     *                                   Used during sequence verification: (like visited).
     * 
     * @example
     * // Create a print operation for character 'a' at timeline position 5
     * let printA = new PrintItem('a', 5, [], false);
     * 
     * @example
     * // Create a dependent print operation
     * let printB = new PrintItem('b', 6, [printA], false);
     * // printB cannot execute until printA is completed
     */
    constructor(printChar, executionIndex, dependencies = [], printed = false) {
        /** @type {string} The character or string to print */
        this.printChar = printChar;
        /** @type {number} Position in execution timeline */
        this.executionIndex = executionIndex;
        /** @type {PrintItem[]} Array of prerequisite print operations */
        this.dependencies = dependencies;
        /** @type {number} Cached count of dependencies for efficient sorting */
        this.dependencyCount = dependencies.length;
        /** @type {boolean} Whether this operation has been executed */
        this.printed = printed;
    }

    /**
     * Adds one or more dependency relationships to this print operation.
     * 
     * @description
     * Establishes prerequisite relationships by adding other PrintItem objects
     * that must complete before this print can execute. Automatically handles
     * both single dependencies and arrays of dependencies, ensuring no duplicates
     * are added to maintain integrity of the dependency graph.
     * 
     * **Duplicate Prevention:**
     * Only adds dependencies that don't already exist to prevent circular
     * dependencies and maintain a clean dependency graph structure.
     * 
     * **Dependency Count Maintenance:**
     * Automatically updates the dependencyCount property after adding
     * dependencies, which is used for efficient topological sorting.
     * 
     * @param {PrintItem|PrintItem[]} input - Either a single PrintItem object
     *                                       or an array of PrintItem objects
     *                                       to add as dependencies.
     * 
     * @example
     * // Add a single dependency
     * let printA = new PrintItem('a', 0);
     * let printB = new PrintItem('b', 1);
     * printB.addDependency(printA);
     * // printB now depends on printA
     * 
     * @example
     * // Add multiple dependencies at once
     * let printC = new PrintItem('c', 2);
     * printC.addDependency([printA, printB]);
     * // printC now depends on both printA and printB
     * 
     * @example
     * // Duplicate dependencies are ignored
     * printB.addDependency(printA); // No effect - already exists
     * console.log(printB.dependencyCount); // Still 1
     * 
     * @see {@link dependencyCount} For accessing the number of dependencies
     */
    addDependency(input) {
        if (Array.isArray(input)) {
            for (let item of input) {
                if (!this.dependencies.includes(item)) {
                    this.dependencies.push(item);
                }
            }
        } else {
            if (!this.dependencies.includes(input)) {
                this.dependencies.push(input);
            }
        }
        this.dependencyCount = this.dependencies.length;
    }
}

/**
 * Represents a fork operation with associated process synchronization tracking.
 * 
 * @class ForkItem
 * @description
 * This class models a complete fork() operation including the synchronization
 * behavior between parent and child processes. It tracks the execution sequences
 * before and after wait() calls, child process execution, and the various
 * synchronization points that affect print operation ordering.
 * 
 * **Process Synchronization Model:**
 * - **beforeWait**: Operations executed by parent before calling wait()
 * - **afterWait**: Operations executed by parent after wait() returns
 * - **child**: Operations executed by the child process
 * - **parentWaited**: Whether parent calls wait() (affects afterWait execution)
 * - **childExited**: Whether child calls exit() (affects wait() return)
 * 
 * **Execution Timeline:**
 * 1. Fork occurs at forkExecutionIndex
 * 2. Parent and child execute concurrently (beforeWait vs child)
 * 3. Parent may call wait() at waitExecutionIndex
 * 4. Child may call exit() at exitExecutionIndex
 * 5. Parent continues with afterWait only if child exits
 * 
 * **Synchronization Rules:**
 * - Parent's afterWait only executes if parentWaited AND childExited
 * - If parent waits but child doesn't exit, parent blocks indefinitely
 * - Child operations are independent of parent's wait status
 * 
 * @example
 * // Fork operation F(aWb,cX) creates:
 * // - beforeWait: [a]
 * // - afterWait: [b] (only if child exits)
 * // - child: [c] (child exits with X)
 * // - parentWaited: true, childExited: true
 * 
 * @example
 * // Fork operation F(a,b) creates:
 * // - beforeWait: [a]
 * // - afterWait: [] (no wait called)
 * // - child: [b]
 * // - parentWaited: false, childExited: false
 *
 */
export class ForkItem {
    /**
     * Creates a new fork operation with synchronization tracking.
     * 
     * @param {number} forkExecutionIndex - Position in execution timeline where fork() occurs.
     *                                     Used to coordinate with other operations and visualizations.
     * 
     * @example
     * // Create a fork operation at timeline position 5
     * let fork = new ForkItem(5);
     * // Initially all synchronization flags are false/null
     * // and all operation arrays are empty
     */
    constructor(forkExecutionIndex) {
        /** @type {number} Timeline position where fork() occurs: used for highlighting code and timeline -- deprecated. */
        this.forkExecutionIndex = forkExecutionIndex;
        /** @type {number|null} Timeline position where parent calls wait() (null if no wait): used for highlighting code and timeline -- deprecated. */
        this.waitExecutionIndex = null;
        /** @type {number|null} Timeline position where child calls exit() (null if no exit): used for highlighting code and timeline -- deprecated. */
        this.exitExecutionIndex = null;
        /** @type {boolean} Whether parent process calls wait() for synchronization */
        this.parentWaited = false;
        /** @type {boolean} Whether child process calls exit() to terminate */
        this.childExited = false;
        /** @type {Array} Sequence of operations (PrintItem/ForkItem) executed by parent before wait() */
        this.beforeWait = [];
        /** @type {Array} Sequence of operations (PrintItem/ForkItem) executed by parent after wait() returns */
        this.afterWait = [];
        /** @type {Array} Sequence of operations (PrintItem/ForkItem) executed by child process */
        this.child = [];
    }
}

/**
 * Analyzes compact notation code and builds a hierarchical structure of print operation constraints.
 * 
 * @description
 * This function is the core constraint analyzer that parses compact notation and creates
 * a nested structure of PrintItem and ForkItem objects representing the synchronization
 * relationships between different print operations. It recursively processes fork operations
 * and tracks parent-child process interactions including wait() and exit() synchronization.
 * 
 * **Parsing Strategy:**
 * - Regular characters (a-z) become PrintItem objects with execution indices
 * - 'F' triggers fork parsing with parent/child code separation
 * - 'W' represents wait() operations for synchronization
 * - 'X' represents exit() operations for process termination
 * 
 * **Constraint Structure:**
 * The resulting structure mirrors the fork hierarchy:
 * - Each ForkItem contains beforeWait, afterWait, and child operation arrays
 * - Nested forks create recursive constraint structures
 * - Execution indices track temporal ordering for dependency resolution
 * 
 * **Synchronization Analysis:**
 * - Determines if parent processes call wait() (affects afterWait execution)
 * - Tracks if child processes call exit() (affects wait() behavior)
 * - Establishes execution dependencies between parent and child operations
 * 
 * @param {string} code - Compact notation string to analyze (e.g., "aF(bWc,dX)e")
 * @param {string} [continuation=''] - Additional code that continues after current segment.
 *                                   Used internally for recursive parsing.
 * @param {Object} [executionIndex={index:0}] - Mutable object tracking global execution position.
 *                                             Shared across recursive calls for consistent numbering.
 * @param {number} [depth=0] - Current recursion depth for infinite loop protection.
 * @param {boolean} [isChild=false] - Whether current code is executing in a child process context.
 * 
 * @returns {Array<PrintItem|ForkItem>} Hierarchical array of constraint objects representing
 *                                     the execution structure and synchronization dependencies.
 * 
 * @example
 * // Simple sequence: "abc"
 * let constraints = printSequenceConstraints("abc");
 * // Returns: [PrintItem('a'), PrintItem('b'), PrintItem('c')]
 * 
 * @example
 * // Fork with synchronization: "aF(bWc,dX)e"
 * let constraints = printSequenceConstraints("aF(bWc,dX)e");
 * // Returns: [
 * //   PrintItem('a'),
 * //   ForkItem({
 * //     beforeWait: [PrintItem('b')],
 * //     afterWait: [PrintItem('c')],
 * //     child: [PrintItem('d')],
 * //     parentWaited: true,
 * //     childExited: true
 * //   }),
 * //   PrintItem('e')
 * // ]
 * 
 * @example
 * // Nested forks: "F(aF(b,c),d)"
 * // Creates nested ForkItem structure with recursive constraints
 * 
 * @throws {Error} Implicitly handles malformed input through recursion depth limits
 * @see {@link PrintItem} For individual print operation representation
 * @see {@link ForkItem} For fork operation and synchronization tracking
 * @see {@link parseForkArgs} For parsing fork arguments
 * @see {@link parseForkWait} For analyzing wait() patterns
 * @see {@link parseForkExit} For analyzing exit() patterns
 */
export function printSequenceConstraints(code, continuation = '', executionIndex = {index : 0}, depth = 0, isChild = false) {
    // Add protection against infinite recursion
    const MAX_RECURSION_DEPTH = 100;
    if (depth > MAX_RECURSION_DEPTH) {
        console.warn("Maximum recursion depth reached in printSequenceConstraints - preventing infinite recursion");
        return [];
    }

    let sequenceList = [];
    let ptr = 0;
    while (ptr < code.length) {
        const char = code[ptr];
        if (char === "F") {
            // Assume these helper functions return the expected values.
            let forkItem = new ForkItem(executionIndex.index++);
            let [leftCode, rightCode, newPtr] = parseForkArgs(code, ptr);
            ptr = newPtr + 1;
            let hasElse = rightCode.length > 0;
            continuation = code.substring(ptr) + continuation;
            let [leftWaitCode, rightWaitCode] = parseForkWait(leftCode + continuation);
            const childCode = parseForkExit(rightCode + continuation);
            forkItem.parentWaited = rightWaitCode.length > 0;
            forkItem.childExited = childCode[childCode.length - 1] === EXIT_CHAR;

            forkItem.beforeWait = printSequenceConstraints(leftWaitCode, '', executionIndex, depth + 1, isChild);
            forkItem.waitExecutionIndex = executionIndex.index++;
            forkItem.afterWait = printSequenceConstraints(rightWaitCode, '', executionIndex, depth + 1, isChild);

            if (hasElse) {
                executionIndex.index++; // for the } else {
            }
            
            forkItem.child = printSequenceConstraints(childCode, '', executionIndex, depth + 1, true);
            if (forkItem.childExited) {
                forkItem.exitExecutionIndex = executionIndex.index++;
                executionIndex.index += (rightCode.length - 1 - childCode.length);
            }
            if (leftCode || rightCode) {
                executionIndex.index++; // for the closing }
            }

            sequenceList.push(forkItem);
            break;
        } else {
            if (char === WAIT_CHAR) {
                executionIndex.index++;
            } else if (char === EXIT_CHAR) {
                executionIndex.index++;
            } else if (char !== ' ') { // Assuming other chars are prints
                let printItem = new PrintItem(code[ptr], executionIndex.index++, [], false);
                sequenceList.push(printItem);
            }
        }
        ptr++;
    }
    return sequenceList;
}

/**
 * Generates one valid print sequence from the given constraint structure.
 * 
 * @description
 * This function takes the hierarchical constraint structure created by printSequenceConstraints
 * and generates a single valid execution sequence that respects all process synchronization
 * rules. It handles fork operations by randomly weaving parent and child outputs while
 * respecting wait/exit synchronization constraints.
 * 
 * **Generation Strategy:**
 * - PrintItem objects are directly converted to their print characters
 * - ForkItem objects are processed by weaving parent and child sequences
 * - Parent afterWait operations only execute if child exits
 * - Random weaving simulates concurrent execution scheduling
 * 
 * **Synchronization Rules Applied:**
 * - Parent beforeWait and child operations execute concurrently (random weave)
 * - Parent afterWait only executes if parentWaited AND childExited
 * - If parent waits but child doesn't exit, afterWait operations are omitted
 * 
 * **Non-Exhaustive Nature:**
 * This function generates only ONE possible valid sequence, not all possible
 * sequences. For exhaustive generation, multiple calls with different random
 * seeds would be needed.
 * 
 * @param {Array<PrintItem|ForkItem>} sequenceList - Hierarchical constraint structure
 *                                                  from printSequenceConstraints()
 * @param {number} [depth=0] - Current recursion depth for infinite loop protection
 * 
 * @returns {string[]} Array of characters representing one valid print sequence
 *                    that respects all synchronization constraints
 * 
 * @example
 * // Simple sequence with no forks
 * let constraints = printSequenceConstraints("abc");
 * let sequence = getPrintSequence(constraints);
 * // Returns: ['a', 'b', 'c']
 * 
 * @example
 * // Fork with synchronization: F(aWb,cX)
 * let constraints = printSequenceConstraints("F(aWb,cX)");
 * let sequence = getPrintSequence(constraints);
 * // Possible returns: ['a', 'c', 'b'] or ['c', 'a', 'b']
 * // 'b' always comes after both 'a' and 'c' due to wait/exit synchronization
 * 
 * @example
 * // Fork without child exit: F(aW,b)
 * let constraints = printSequenceConstraints("F(aW,b)");
 * let sequence = getPrintSequence(constraints);
 * // Returns: ['a', 'b'] or ['b', 'a'] 
 * // afterWait is empty since child doesn't exit
 * 
 * @see {@link printSequenceConstraints} For creating the input constraint structure
 * @see {@link randomWeave} For concurrent execution simulation
 * @see {@link getPrintSequenceIncorrect} For generating incorrect sequences
 */
export function getPrintSequence(sequenceList, depth = 0) {
    // Add protection against infinite recursion
    const MAX_RECURSION_DEPTH = 100;
    if (depth > MAX_RECURSION_DEPTH) {
        console.warn("Maximum recursion depth reached in getPrintSequence - preventing infinite recursion");
        return [];
    }
    
    if (!Array.isArray(sequenceList) || sequenceList.length === 0) {
        return [];
    }
    let correctPrint = [];
    for (let i = 0; i < sequenceList.length; i++) {
        if (sequenceList[i] instanceof PrintItem) {
            correctPrint.push(sequenceList[i].printChar);
        } else if (sequenceList[i] instanceof ForkItem) {
            let beforeWait = getPrintSequence(sequenceList[i].beforeWait, depth + 1);
            let afterWait = sequenceList[i].childExited ? getPrintSequence(sequenceList[i].afterWait, depth + 1) : [];
            let child = getPrintSequence(sequenceList[i].child, depth + 1);
            
            let temp = [
                ...randomWeave(beforeWait, child),
                ...afterWait
            ];

            correctPrint.push(...temp);
        }
    }
    return correctPrint;
}

/**
 * Generates print sequences with probabilistic error injection for educational testing.
 * 
 * @description
 * This function creates print sequences that may be correct or contain deliberate errors
 * to test student understanding of process synchronization. It uses probabilistic error
 * injection to create plausible but incorrect sequences that violate wait/exit semantics
 * or process execution ordering rules.
 * 
 * **Error Injection Strategies:**
 * 1. **Wait/Exit Violations**: Parent afterWait executes when child doesn't exit
 * 2. **Missing Child Operations**: Child operations are truncated when child doesn't exit
 * 3. **Extra Child Operations**: Child operations appear when child should have exited
 * 4. **Ordering Violations**: AfterWait operations execute before child completion
 * 
 * **Probability-Based Generation:**
 * - Multiple random checks determine whether to inject errors
 * - Different error types have different probability thresholds
 * - Error injection can be disabled by setting exit_disambig to false
 * 
 * **Educational Purpose:**
 * The generated incorrect sequences represent common student misconceptions about:
 * - When wait() calls block vs. return immediately
 * - Whether child processes continue after parent exits
 * - How process synchronization affects print ordering
 * 
 * @param {Array<PrintItem|ForkItem>} sequenceList - Hierarchical constraint structure
 *                                                  from printSequenceConstraints()
 * @param {number} [depth=0] - Current recursion depth for infinite loop protection
 * @param {boolean} [exit_disambig=false] - Whether to enable exit disambiguation error injection.
 *                                        When true, adds errors related to child exit behavior.
 * 
 * @returns {[string[], boolean]} Tuple containing:
 *   - [0] Array of characters representing the generated print sequence
 *   - [1] Boolean indicating whether errors were injected (true = incorrect sequence)
 * 
 * @example
 * // Correct sequence generation
 * let constraints = printSequenceConstraints("F(aWb,cX)");
 * let [sequence, hasError] = getPrintSequenceIncorrect(constraints, 0, false);
 * // Possible returns: [['a', 'c', 'b'], false] - correct sequence
 * 
 * @example
 * // Error injection enabled
 * let [sequence, hasError] = getPrintSequenceIncorrect(constraints, 0, true);
 * // Possible returns: [['a', 'b'], true] - missing child 'c' 
 * // or: [['a', 'c', 'b', 'b'], true] - extra afterWait operation
 * 
 * @example
 * // Complex error: F(aW,b) with error injection
 * // Correct: ['a', 'b'] (no afterWait since child doesn't exit)
 * // Error: ['a', 'b', 'afterWaitOp'] (afterWait incorrectly executes)
 * 
 * @see {@link getPrintSequence} For generating only correct sequences
 * @see {@link verifyPrintSequence} For validating sequence correctness
 * @see {@link printSequenceConstraints} For creating constraint structures
 */
export function getPrintSequenceIncorrect(sequenceList, depth = 0, exit_disambig = false) {
    // Add protection against infinite recursion
    const MAX_RECURSION_DEPTH = 100;
    let child_exited = false;
    let forked = false;
    if (depth > MAX_RECURSION_DEPTH) {
        console.warn("Maximum recursion depth reached in getPrintSequenceIncorrect - preventing infinite recursion");
        return [[], false];
    }
    
    let error_injected = false;
    if (!Array.isArray(sequenceList) || sequenceList.length === 0) {
        return [[], error_injected];
    }
    let print = [];
    for (let i = 0; i < sequenceList.length; i++) {
        if (sequenceList[i] instanceof PrintItem) {
            print.push(sequenceList[i].printChar);
        } else if (sequenceList[i] instanceof ForkItem) {
            forked = true;
            let beforeWait, afterWait, child, temp_injected, temp;
            [beforeWait, temp_injected] = getPrintSequenceIncorrect(sequenceList[i].beforeWait, depth + 1, exit_disambig);
            error_injected ||= temp_injected;
            
            // Error injection logic on afterwait:
            // no error: parent afterwait prints when child exits
            // no error: parent is put on infinite wait and afterwait is empty 
            //           (not printed in the scope of our code) when child does not exit
            // error injection: parent afterwait prints when child does not exit,
            //                  (when parent should be put on infinite wait)
            if (sequenceList[i].childExited) {
                [afterWait, temp_injected] = getPrintSequenceIncorrect(sequenceList[i].afterWait, depth + 1, exit_disambig);
                error_injected ||= temp_injected;
            } else if (exit_disambig && Math.random() < 0.5 && sequenceList[i].afterWait.length > 0) {
                // error injection: parent afterwait prints when child does not exit
                console.log("error injection: parent afterwait prints when child does not exit");
                [afterWait, temp_injected] = getPrintSequenceIncorrect(sequenceList[i].afterWait, depth + 1, exit_disambig);
                error_injected = true;
                exit_disambig = false;
            } else {
                afterWait = [];
            }

            // Error injection logic on child:
            // no error: child prints what it should print
            // error injection when child exited (possible when we need exit disambiguation):
            //      child prints what it should print, but we inject the last afterwait print (should not be printed)
            // error injection when child did not exit:
            //      child prints what it should print, but we remove the last print char
            [child, temp_injected] = getPrintSequenceIncorrect(sequenceList[i].child, depth + 1, exit_disambig);
            error_injected ||= temp_injected;
            child_exited ||= sequenceList[i].childExited;  
            if (exit_disambig) {
                if (afterWait.length > 0 && sequenceList[i].childExited) {
                    error_injected = true;
                    child.push(afterWait[afterWait.length - 1]);
                } else if (child.length > 0 && !sequenceList[i].childExited) {
                    error_injected = true;
                    child.pop();
                }
            }
            
            // Error injection logic putting together beforewait, afterwait, and child
            // no error: weave(beforewait, child), then afterwait
            // error injection: put one of afterwait print char before last child print char
            if ((!error_injected || Math.random() < 0.25) && afterWait.length > 0 && child.length > 0 && Math.random() < 0.5) {
                // inject error
                error_injected = true;
                let beforePreweave = [...beforeWait, afterWait[0]]
                temp = [...randomWeave(beforePreweave, child.slice(0, -1)),
                            child[child.length - 1],
                            ...afterWait.slice(1)
                ]
            } else {
                // no error
                temp = [
                    ...randomWeave(beforeWait, child),
                    ...afterWait
                ];
            }

            print.push(...temp);
        }
    }
    let sequence_verified;
    if (depth === 0) {  
        sequence_verified = verifyPrintSequence(print, sequenceList);
        error_injected = !sequence_verified;
    }
    return [print, error_injected];
}

/**
 * Builds dependency relationships between print operations based on process synchronization.
 * 
 * @description
 * This function analyzes the hierarchical constraint structure and establishes explicit
 * dependency relationships between PrintItem objects. The dependencies ensure that
 * print operations execute in valid orders that respect process synchronization rules
 * including fork(), wait(), and exit() semantics.
 * 
 * **Dependency Rules:**
 * 1. **Sequential Dependencies**: Later prints depend on earlier prints in same process
 * 2. **Fork Dependencies**: Child and parent beforeWait inherit dependencies from previous operations
 * 3. **Wait Dependencies**: Parent afterWait depends on all parent beforeWait AND all child operations
 * 4. **Exit Synchronization**: AfterWait dependencies only apply if child exits
 * 
 * **Dependency Chain Construction:**
 * - Tracks "previousPrints" as dependency sources for new operations
 * - ForkItem operations split dependencies into parallel parent/child branches
 * - AfterWait operations depend on completion of both parent and child branches
 * - Non-exiting children prevent afterWait operations from having dependencies
 * 
 * **Use Cases:**
 * - Input validation for user-provided print sequences
 * - Topological sorting for correct sequence generation
 * - Educational feedback on synchronization violations
 * 
 * @param {Array<PrintItem|ForkItem>} sequenceList - Hierarchical constraint structure
 *                                                  from printSequenceConstraints()
 * 
 * @returns {PrintItem[]} Flat array of all PrintItem objects with established dependencies.
 *                       Each PrintItem's dependencies array is populated with prerequisite prints.
 * 
 * @example
 * // Simple sequence: "abc"
 * let constraints = printSequenceConstraints("abc");
 * let dependencies = getPrintDependencies(constraints);
 * // Returns: [PrintItem('a'), PrintItem('b', deps:[a]), PrintItem('c', deps:[b])]
 * 
 * @example
 * // Fork with wait: "F(aWb,c)"
 * let constraints = printSequenceConstraints("F(aWb,c)");
 * let dependencies = getPrintDependencies(constraints);
 * // Returns: [
 * //   PrintItem('a', deps:[]),           // no dependencies
 * //   PrintItem('c', deps:[]),           // parallel with 'a'
 * //   PrintItem('b', deps:[a, c])        // depends on both parent and child
 * // ]
 * 
 * @example
 * // Sequential with fork: "xF(a,b)y"
 * // 'x' has no deps, 'a' and 'b' depend on 'x', 'y' depends on both 'a' and 'b'
 * 
 * @see {@link PrintItem.addDependency} For dependency addition mechanism
 * @see {@link verifyPrintSequence} For using dependencies in validation
 * @see {@link printSequenceConstraints} For creating input constraint structure
 */
export function getPrintDependencies(sequenceList) {
    let printItems = [];
    let previousPrints = [];
    for (let i = 0; i < sequenceList.length; i++) {
        if (sequenceList[i] instanceof PrintItem) {
            for (let print of previousPrints) {
                sequenceList[i].addDependency(print);
            }
            previousPrints.length = 0;
            previousPrints.push(sequenceList[i]);
            printItems.push(sequenceList[i]);
        } else if (sequenceList[i] instanceof ForkItem) {
            let beforeWaitPrints = getPrintDependencies(sequenceList[i].beforeWait);
            for (let print of beforeWaitPrints) {
                for (let prevPrint of previousPrints) {
                    print.addDependency(prevPrint);
                }
            }
            let childPrints = getPrintDependencies(sequenceList[i].child);
            for (let print of childPrints) {
                for (let prevPrint of previousPrints) {
                    print.addDependency(prevPrint);
                }
            }
            let afterWaitPrints = [];
            if (sequenceList[i].parentWaited && sequenceList[i].childExited) {
                afterWaitPrints = getPrintDependencies(sequenceList[i].afterWait);
                for (let print of afterWaitPrints) {
                    for (let beforeWaitPrint of beforeWaitPrints) {
                        print.addDependency(beforeWaitPrint);
                    }
                    for (let childPrint of childPrints) {
                        print.addDependency(childPrint);
                    }
                }
            }
            previousPrints.length = 0;
            if (sequenceList[i].parentWaited && sequenceList[i].childExited) {
                previousPrints.push(...afterWaitPrints);
                printItems.push(...beforeWaitPrints, ...childPrints, ...afterWaitPrints);
            } else {
                previousPrints.push(...beforeWaitPrints, ...childPrints);
                printItems.push(...beforeWaitPrints, ...childPrints);
            }
        }
    }
    return printItems;
}

/**
 * Creates a deep copy of PrintItem array with preserved dependency relationships.
 * 
 * @description
 * This function creates completely independent copies of PrintItem objects while
 * maintaining the correct dependency relationships between them. It's essential
 * for validation operations that need to modify dependency counts without
 * affecting the original constraint structure.
 * 
 * **Two-Pass Algorithm:**
 * 1. **First Pass**: Create new PrintItem objects with copied basic properties
 * 2. **Second Pass**: Rebuild dependency relationships using new object references
 * 
 * **Dependency Preservation:**
 * - Maps original dependencies to corresponding new objects
 * - Maintains referential integrity within the new object set
 * - Prevents interference between multiple validation operations
 * 
 * **Use Cases:**
 * - Creating independent copies for sequence validation
 * - Parallel processing of multiple validation attempts
 * - Preserving original constraint structure during testing
 * 
 * @param {PrintItem[]} printItems - Array of PrintItem objects to copy.
 *                                  All objects should have established dependencies.
 * 
 * @returns {PrintItem[]} New array of PrintItem objects with identical properties
 *                       and preserved dependency relationships using new references.
 * 
 * @example
 * // Original items with dependencies
 * let original = [printA, printB, printC]; // printC depends on printA, printB
 * let copy = deepCopyPrintItems(original);
 * // copy[2] depends on copy[0] and copy[1] (not original objects)
 * 
 * @example
 * // Safe validation without affecting originals
 * let dependencies = getPrintDependencies(constraints);
 * let validationCopy = deepCopyPrintItems(dependencies);
 * // Modify validationCopy during validation, original remains intact
 * 
 * @see {@link PrintItem} For the copied object structure
 * @see {@link verifyPrintSequence} For primary use case
 * @see {@link getPrintDependencies} For creating the input dependency structure
 */
function deepCopyPrintItems(printItems) {
    // First pass: create new objects
    const newItems = printItems.map(item => {
        if (item instanceof PrintItem) {
            return new PrintItem(item.printChar, item.executionIndex, [], item.printed);
        }
    });
    
    // Second pass: map dependencies to new objects
    for (let i = 0; i < printItems.length; i++) {
        if (printItems[i] instanceof PrintItem) {
            for (let dep of printItems[i].dependencies) {
                // Find the corresponding new object for this dependency
                const depIndex = printItems.findIndex(item => item === dep);
                if (depIndex !== -1) {
                    newItems[i].addDependency(newItems[depIndex]);
                }
            }
        }
    }
    
    return newItems;
}

/**
 * Finds a PrintItem in the execution frontier that matches the given character.
 * 
 * @description
 * This helper function searches for a PrintItem with the specified character that
 * is ready for execution (in the frontier). A PrintItem is in the frontier if:
 * 1. It matches the target character
 * 2. It hasn't been printed yet
 * 3. It has no unsatisfied dependencies (dependencyCount === 0)
 * 
 * **Frontier Concept:**
 * The frontier represents the set of operations that can be executed immediately
 * without violating any synchronization constraints. This implements the core
 * logic for topological sorting in sequence validation.
 * 
 * **Search Strategy:**
 * - Linear search through the PrintItem array
 * - Returns first match (order doesn't matter for correctness)
 * - Early termination on first valid match
 * 
 * @param {PrintItem[]} printItems - Array of PrintItem objects to search through.
 * @param {string} char - Character to find in the frontier.
 * 
 * @returns {number} Index of the matching PrintItem in the frontier, or -1 if:
 *                  - No PrintItem matches the character
 *                  - Matching PrintItem is already printed
 *                  - Matching PrintItem has unsatisfied dependencies
 * 
 * @example
 * // Finding executable operation
 * let items = [printA, printB, printC]; // printB depends on printA
 * let idx = findPrintItemIdxFromFrontier(items, 'a');
 * // Returns: 0 (printA has no dependencies)
 * 
 * @example
 * // Character not in frontier
 * let idx = findPrintItemIdxFromFrontier(items, 'b');
 * // Returns: -1 (printB depends on printA, which isn't printed yet)
 * 
 * @example
 * // After executing printA
 * printA.printed = true;
 * printB.dependencyCount = 0; // dependencies satisfied
 * let idx = findPrintItemIdxFromFrontier(items, 'b');
 * // Returns: 1 (printB now in frontier)
 * 
 * @see {@link verifyPrintSequence} For primary use case
 * @see {@link PrintItem} For dependency tracking structure
 */
function findPrintItemIdxFromFrontier(printItems, char) {
    for (let i = 0; i < printItems.length; i++) {
        if (printItems[i].printChar === char && !printItems[i].printed && printItems[i].dependencyCount === 0) {
            return i;
        }
    }
    return -1;
}

/**
 * Validates whether a given print sequence respects all process synchronization constraints.
 * 
 * @description
 * This function implements a topological sort with backtracking to verify that a proposed
 * print sequence is valid according to the process synchronization rules. It uses the
 * dependency relationships established by getPrintDependencies() to ensure that each
 * print operation only executes after all its prerequisites have completed.
 * 
 * **Validation Algorithm:**
 * 1. Build dependency graph from constraint structure
 * 2. For each character in the proposed sequence:
 *    - Find corresponding PrintItem with no unsatisfied dependencies (frontier)
 *    - Mark the PrintItem as printed
 *    - Decrease dependency counts for items that depended on it
 * 3. Verify all PrintItems were successfully printed
 * 
 * **Validation Rules:**
 * - Each character must correspond to a PrintItem in the frontier (no pending dependencies)
 * - All PrintItems must be consumed exactly once
 * - No dependencies can remain unsatisfied
 * 
 * **Educational Use:**
 * - Provides immediate feedback on student-submitted print sequences
 * - Identifies specific synchronization violations
 * - Supports automated grading of process synchronization exercises
 * 
 * @param {string[]} printSequence - Array of characters representing the proposed print sequence
 *                                  to validate (e.g., ['a', 'b', 'c'])
 * @param {Array<PrintItem|ForkItem>} sequenceList - Hierarchical constraint structure
 *                                                  from printSequenceConstraints()
 * 
 * @returns {boolean} True if the print sequence is valid and respects all synchronization
 *                   constraints, false if any constraint violations are detected.
 * 
 * @example
 * // Valid sequence verification
 * let constraints = printSequenceConstraints("F(aWb,c)");
 * let isValid = verifyPrintSequence(['a', 'c', 'b'], constraints);
 * // Returns: true (respects wait/exit synchronization)
 * 
 * @example
 * // Invalid sequence verification
 * let isValid = verifyPrintSequence(['b', 'a', 'c'], constraints);
 * // Returns: false ('b' cannot execute before 'a' and 'c' due to wait dependency)
 * 
 * @example
 * // Sequential verification
 * let constraints = printSequenceConstraints("abc");
 * let isValid = verifyPrintSequence(['a', 'c', 'b'], constraints);
 * // Returns: false ('c' cannot execute before 'b' in sequential code)
 * 
 * @example
 * // Incomplete sequence
 * let isValid = verifyPrintSequence(['a', 'c'], constraints);
 * // Returns: false (missing 'b' - not all operations completed)
 * 
 * @see {@link getPrintDependencies} For dependency relationship construction
 * @see {@link printSequenceConstraints} For constraint structure creation
 * @see {@link deepCopyPrintItems} For creating independent validation copies
 */
export function verifyPrintSequence(printSequence, sequenceList) {
    let printItems = getPrintDependencies(sequenceList);
    printItems = deepCopyPrintItems(printItems);

    // use topological sort with backtracking to verify the print sequence    
    for (let char of printSequence) {
        let candidateIdx = findPrintItemIdxFromFrontier(printItems, char);
        if (candidateIdx === -1) {
            return false;
        }
        let candidateItem = printItems[candidateIdx];
        candidateItem.printed = true;
        for (let item of printItems) {
            if (item.dependencyCount > 0) {
                if (item.dependencies.includes(candidateItem)) {
                    item.dependencyCount--;
                }
            }
        }
    }
    // check everything is printed
    for (let item of printItems) {
        if (!item.printed) {
            return false;
        }
    }
    return true;
}

/**
 * Recursively extracts and concatenates output from all nodes in a process tree.
 * 
 * @description
 * This helper function performs a depth-first traversal of the process tree,
 * collecting the accumulated output (value property) from each node. The
 * concatenation order follows the tree structure: current node, then left
 * subtree, then right subtree.
 * 
 * **Traversal Order:**
 * - Current node's value first
 * - Left subtree output (parent continuation)
 * - Right subtree output (child processes)
 * 
 * **Use Cases:**
 * - Extracting final program output for answer generation
 * - Debugging process tree execution results
 * - Converting tree structures to linear output strings
 * 
 * @param {ForkNode|null} node - Root node of the tree to extract output from.
 *                              Returns empty string if node is null/undefined.
 * 
 * @returns {string} Concatenated output from all nodes in the subtree.
 * 
 * @example
 * // Simple tree: root="a", left="b", right="c"
 * let result = output(root);
 * // Returns: "abc"
 * 
 * @example
 * // Complex nested tree with multiple levels
 * // Results in concatenation following tree traversal order
 * 
 * @see {@link ForkNode} For tree node structure
 * @see {@link getAnswer} For using output in frequency analysis
 */
function output(node) {
    if (!node) return "";
    return node.value + output(node.left) + output(node.right);
}

/**
 * Generates answer statistics by counting character frequencies in process output.
 * 
 * @description
 * This function extracts the final output from a process tree and creates a frequency
 * map counting how many times each print character appears. It's used to generate
 * answer keys for questions about final program output, supporting educational
 * exercises that test understanding of process execution and output generation.
 * 
 * **Output Extraction:**
 * - Recursively traverses the entire process tree
 * - Concatenates output from all processes (current node + left + right subtrees)
 * - Only counts characters that appear in the alphabet (a-z)
 * 
 * **Frequency Counting:**
 * - Maps each alphabet character to its occurrence count
 * - Supports up to 26 different characters (a-z)
 * - Ignores non-alphabetic characters (like 'X' for exit markers)
 * 
 * **Educational Use:**
 * - Generates correct answers for "how many times does X appear" questions
 * - Supports multiple choice questions about program output
 * - Provides reference data for automated grading systems
 * 
 * @param {ForkNode} node - Root node of the process tree to analyze.
 *                         Should be fully executed with all output accumulated.
 * @param {number} numPrints - Maximum number of distinct print characters to count.
 *                            Typically matches the number of different characters in the program.
 * 
 * @returns {Object} Frequency map where keys are characters (a-z) and values are occurrence counts.
 *                  Only includes characters that appear in the first numPrints alphabet positions.
 * 
 * @example
 * // Process tree with output "aabcc"
 * let node = new ForkNode(0, 0, false, "aabcc");
 * let answer = getAnswer(node, 3);
 * // Returns: {'a': 2, 'b': 1, 'c': 2}
 * 
 * @example
 * // Complex tree with multiple processes
 * // Root: "a", Left child: "bb", Right child: "ac"
 * // Total output: "abb" + "ac" = "abbac"
 * let answer = getAnswer(complexNode, 3);
 * // Returns: {'a': 2, 'b': 2, 'c': 1}
 * 
 * @example
 * // Process with exit markers
 * // Output: "abXcX" (X's are exit markers, not counted)
 * let answer = getAnswer(nodeWithExits, 3);
 * // Returns: {'a': 1, 'b': 1, 'c': 1}
 * 
 * @see {@link output} For the output extraction helper function
 * @see {@link ForkNode} For process tree structure
 */
export function getAnswer(node, numPrints) {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    let map = {}
    for (let i = 0; (i < numPrints) && (i < 26); i++) {
        map[alphabet[i]] = 0;
    }
    
    
    let answer = output(node);
    for (let i = 0; i < answer.length; i++) {
        if (answer[i] in map) { map[answer[i]] += 1; }
        else { map[answer[i]] = 1; }
    }
    return map;
}

// Generate the options for our question
// Return at least 1 correct and at least 1 incorrect
// returned options <= 4
// If there are two few options returned (1/2), the case would be handled
// in fork-timeline genQuestionInfo function
/**
 * Generates multiple print sequences with correctness validation for educational question creation.
 * 
 * @description
 * This function creates a collection of different print sequences (both correct and incorrect)
 * from a compact notation source and maps each sequence to its correctness status. It's designed
 * to generate diverse answer choices for multiple-choice questions about process execution
 * output sequences and their validation results.
 * 
 * **Generation Strategy:**
 * - Creates 20 different sequences using probabilistic generation
 * - Mixes correct sequences with error-injected sequences
 * - Optional exit disambiguation adds specific error types
 * - Maps each sequence to boolean indicating correctness
 * 
 * **Error Injection Control:**
 * - Uses getPrintSequenceIncorrect() with controlled error probability
 * - exit_disambig parameter enables/disables specific error types
 * - Balances correct vs. incorrect sequences for educational value
 * 
 * **Correctness Mapping:**
 * - Maps sequence strings to boolean correctness indicators
 * - true = incorrect sequence (error was injected)
 * - false = correct sequence (follows proper synchronization rules)
 * - Enables easy filtering of correct vs. incorrect answer choices
 * 
 * **Educational Applications:**
 * - Multiple choice question generation with correct/incorrect labeling
 * - Educational feedback showing which sequences violate synchronization rules
 * 
 * @param {string} source - Compact notation string to analyze (e.g., "F(aWb,cX)")
 * @param {boolean} [exit_disambig=false] - Whether to enable exit disambiguation error injection.
 *                                        Adds specific errors related to child process termination.
 * 
 * @returns {Object} Map where keys are sequence strings and values are boolean correctness indicators:
 *   - false: sequence is correct (follows proper synchronization)
 *   - true: sequence is incorrect (contains synchronization violations)
 * 
 * @example
 * // Simple fork analysis
 * let results = getAnswerSequence("F(a,b)");
 * // Returns correctness map like:
 * // {
 * //   "ab": false,    // Correct: parent then child
 * //   "ba": false,    // Correct: child then parent  
 * //   "a": true,      // Incorrect: missing child output
 * //   "b": true       // Incorrect: missing parent output
 * // }
 * 
 * @example
 * // Complex synchronization with errors
 * let results = getAnswerSequence("F(aWb,cX)", true);
 * // Includes exit disambiguation errors:
 * // {
 * //   "acb": false,   // Correct: child exits, parent continues after wait
 * //   "abc": true,    // Incorrect: afterWait executes before child completion
 * //   "ac": true      // Incorrect: missing afterWait due to child exit confusion
 * // }
 * 
 * @example
 * // Sequential code (no concurrency)
 * let results = getAnswerSequence("abc");
 * // Should consistently return {"abc": false} since sequence is always correct
 * 
 * @see {@link getPrintSequenceIncorrect} For sequence generation with errors
 * @see {@link printSequenceConstraints} For constraint analysis
 * @see {@link verifyPrintSequence} For sequence validation
 */
export function getAnswerSequence(source, exit_disambig = false) {
    let constraints = printSequenceConstraints(source);
    let map = {};
    let incorrect_cnt = 0;
    let exit_disambig_cnt = 0;
    if (exit_disambig) {
        exit_disambig_cnt = 2;
    }
    for (let i = 0; i < 20; i++) {
        if (exit_disambig_cnt > 0) {
            exit_disambig = true;
        } else {
            exit_disambig = false;
        }
        let [sequence, bool_incorrect] = getPrintSequenceIncorrect(constraints, 0, exit_disambig);
        let sequenceStr = sequence.join("");
        if (!(sequenceStr in map)) {
            if (exit_disambig_cnt > 0 && bool_incorrect) {
                exit_disambig_cnt--;
            }
            if (bool_incorrect) {
                incorrect_cnt++;
            } else if (Object.keys(map).length === 3 && incorrect_cnt === 0) {
                continue;
            }
            map[sequenceStr] = bool_incorrect;
        }
        if (Object.keys(map).length >= 4) {
            break;
        } else if (Object.keys(map).length >= 3 && (incorrect_cnt === Object.keys(map).length)) {
            let sequence = getPrintSequence(constraints);
            let sequenceStr = sequence.join("");
            if (!(sequenceStr in map)) {
                map[sequenceStr] = false;
            }
            break;
        }
    }
    return [map, shuffle(Object.keys(map))];
}

/**
 * Formats a process node for display in tree visualizations.
 * 
 * @description
 * Creates a human-readable representation of a process node showing its
 * hierarchical ID, child count, and accumulated output value. Uses null
 * character placeholder for nodes with no output.
 * 
 * @param {ForkNode} node - Process node to format
 * @returns {string} Formatted string in format "id.childCount:value"
 * 
 * @example
 * // Node with ID=1, childCount=2, value="abc"
 * formatNode(node) // Returns: "1.2:abc"
 * 
 * @example  
 * // Node with no output value
 * formatNode(emptyNode) // Returns: "0.0:\"
 */
const formatNode = (node) => `${node.id}.${node.childCt}`+ ":"+(node.value?node.value:nullChar);

/**
 * Generates a vertical ASCII tree representation of the process hierarchy.
 * 
 * @description
 * Creates a visual tree structure showing process relationships using ASCII
 * characters. The tree displays parent-child relationships with connecting
 * lines and proper indentation for nested structures.
 * 
 * **Tree Structure Display:**
 * - Root node appears at the top
 * - Left children (parent continuations) connected with horizontal lines
 * - Right children (forked processes) appear as separate branches
 * - Null children are omitted for cleaner visualization
 * 
 * **Formatting Rules:**
 * - Uses formatNode() for consistent node labeling
 * - Calculates proper spacing and indentation
 * - Handles variable-width node labels
 * - Returns string for root calls, array for recursive calls
 * 
 * **Educational Use:**
 * - Visual debugging of process trees
 * - Student exercises in understanding hierarchy
 * - Textual representation for documentation
 * 
 * @param {ForkNode} node - Root node of the tree to visualize
 * @param {boolean} [isRoot=true] - Whether this is the root call (affects return type)
 * 
 * @returns {string|Array} For root calls: formatted tree string.
 *                        For recursive calls: array of tree lines.
 * 
 * @example
 * // Simple tree visualization
 * let tree = buildProcessTree("F(a,b)c");
 * console.log(printTreeVert(tree));
 * // Output:
 * // 0.1:ac─1.0:a
 * // |     
 * // 2.0:b
 * 
 * @see {@link formatNode} For node formatting logic
 * @see {@link buildAndTranspile} For creating process trees
 */
export function printTreeVert(node, isRoot = true) {
    const nullChar = "\\";
    // if (!node) return [nullChar]; // show forked processes that does nothing
    if (!node) return [];
    
    const rightSubtree = printTreeVert(node.right, false);
    const leftSubtree = printTreeVert(node.left, false);

    const hasRight = rightSubtree.length > 0;
    const hasLeft = leftSubtree.length > 0;
    
    const selfValue = formatNode(node);
    
    // spacing for subtrees
    // width of right tree is the longest right line
    const rightWidth = rightSubtree.length > 0 ? Math.max(...rightSubtree.map(item => item.length)) : 0;
    const indentLeft = (hasRight ? "|" : " ") + " ".repeat(Math.max(selfValue.length, rightWidth));
    
    const result = [];
    
    result.push(`${selfValue}${hasLeft ? DASH.repeat(Math.max(selfValue.length, rightWidth)-selfValue.length+1) + leftSubtree[0] : ""}`);
    leftSubtree.slice(1).forEach(line => result.push(`${indentLeft}${line}`));
    rightSubtree.forEach(line => result.push(line+SPC1.repeat(rightWidth-line.length)));

    return isRoot ? result.join("\n") : result;
}

/**
 * Recursively extracts parent-child relationships and process values from a tree structure.
 * 
 * @description
 * This function performs a depth-first traversal of the process tree to collect
 * all parent-child relationships and aggregate process output values by ID.
 * The relationships are stored in a format suitable for CSV export or graph
 * analysis tools.
 * 
 * **Traversal Strategy:**
 * - Recursive depth-first exploration of left and right subtrees
 * - Tracks parent-child relationships as "child,parent" pairs
 * - Aggregates multiple output values for processes with the same ID
 * - Uses Set for relationships to prevent duplicates
 * 
 * **Data Collection:**
 * - Relationship pairs suitable for graph visualization tools
 * - Value aggregation for processes that appear multiple times
 * - Compatible with CSV export and network analysis formats
 * 
 * @param {ForkNode} root - Current node being processed
 * @param {string} [parentVal=""] - Parent node identifier for relationship tracking
 * @param {Set} [result=new Set()] - Accumulator for parent-child relationship strings
 * @param {Map} [valuesMap=new Map()] - Accumulator for process ID to values mapping
 * 
 * @returns {Object} Processing results containing:
 *   - treeSet: Set of "child,parent" relationship strings
 *   - valuesMap: Map from process IDs to arrays of their output values
 * 
 * @example
 * // Process tree analysis
 * let tree = buildProcessTree("F(a,b)c");
 * let {treeSet, valuesMap} = getTreeArr(tree);
 * // treeSet contains: {"1,0", "2,0", ...}
 * // valuesMap contains: {0: ["ac"], 1: ["a"], 2: ["b"]}
 * 
 * @see {@link getTreeCSV} For converting results to CSV format
 * @see {@link printTreeVert} For visual tree representation
 */
function getTreeArr(root, parentVal = "", result = new Set(), valuesMap = new Map()) {
    if (!root) return { treeSet: result, valuesMap };

    // Add the parent-child entry to the set if IDs are different
    const entry = `${root.id}${parentVal ? ("," + parentVal) : ""}`;
    if (root.id.toString() !== parentVal) {
        result.add(entry);
    }

    // Aggregate values by ID in a Map
    if (valuesMap.has(root.id)) {
        valuesMap.get(root.id).push(root.value);
    } else {
        valuesMap.set(root.id, [root.value]);
    }

    // Recursive calls to traverse left and right children
    getTreeArr(root.left, `${root.id}`, result, valuesMap);
    getTreeArr(root.right, `${root.id}`, result, valuesMap);

    return { treeSet: result, valuesMap };
}

/**
 * Converts process tree to CSV format for data export and external analysis.
 * 
 * @description
 * This function transforms the hierarchical process tree structure into a CSV
 * representation that can be imported into spreadsheets, graphing tools, or
 * data analysis software. It extracts parent-child relationships and process
 * output values for comprehensive tree analysis.
 * 
 * **Output Format:**
 * - CSV string with "child,parent" header followed by relationship pairs
 * - Values list showing accumulated output for each process ID
 * - Compatible with standard CSV parsing tools and libraries
 * 
 * **Use Cases:**
 * - Exporting tree data for external visualization tools
 * - Academic research on process hierarchy patterns
 * - Integration with data analysis workflows
 * - Educational reporting and assessment systems
 * 
 * @param {ForkNode} root - Root node of the process tree to export
 * 
 * @returns {Object} Export data containing:
 *   - csv: CSV string with child-parent relationships
 *   - valuesList: Array of strings showing process outputs by ID
 * 
 * @example
 * // Process tree with parent-child relationships
 * let tree = buildProcessTree("F(a,b)c");
 * let export_data = getTreeCSV(tree);
 * // export_data.csv = "child,parent\n1,0\n2,0\n..."
 * // export_data.valuesList = ["0: [ac]", "1: [a]", "2: [b]"]
 * 
 * @see {@link getTreeArr} For the underlying tree traversal logic
 */
export function getTreeCSV(root) {
    const { treeSet, valuesMap } = getTreeArr(root);
    const csvString = "child,parent\n" + Array.from(treeSet).join("\n");
    const valuesArray = Array.from(valuesMap, ([id, values]) => `${id}: [${values.join(",")}]`);
    return { csv: csvString, valuesList: valuesArray };
}

/**
 * Inserts a string at a randomly selected valid position within compact notation.
 * 
 * @description
 * This helper function finds valid insertion points in compact notation strings
 * and randomly selects one for string insertion. It ensures the resulting
 * compact notation remains syntactically valid by avoiding problematic positions.
 * 
 * **Position Validation Rules:**
 * - Never insert before opening parentheses '(' (breaks fork syntax)
 * - Avoid consecutive print placeholders (unless anySlot=true)
 * - Don't insert after exit characters 'X' (unless anySlot=true)
 * - Respect boundary constraints (minSlot and maxOffset)
 * 
 * **Insertion Strategy:**
 * - Scans the string for valid positions within the specified range
 * - Uses uniform random selection among valid positions
 * - Returns modified string with inserted content
 * 
 * @param {string} mainStr - Original compact notation string to modify
 * @param {string} insertStr - String to insert (e.g., "F()", "-", "X")
 * @param {boolean} [anySlot=false] - If true, relaxes validation rules for maximum flexibility
 * @param {number} [minSlot=0] - Minimum position index for insertion (inclusive)
 * @param {number} [maxOffset=0] - Offset from end to exclude from consideration
 * 
 * @returns {string} Modified compact notation string with inserted content
 * 
 * @example
 * // Insert fork at random valid position
 * let code = "abc";
 * let result = randInsert(code, "F()", false, 0, 0);
 * // Possible results: "F()abc", "aF()bc", "abF()c", "abcF()"
 * 
 * @example
 * // Insert with position constraints
 * let result = randInsert("abcd", "-", false, 1, 1);
 * // Only inserts between positions 1 and 2: "a-bcd" or "ab-cd"
 * 
 * @example
 * // Flexible insertion (anySlot=true)
 * let result = randInsert("a-X", "-", true, 0, 0);
 * // Can insert anywhere, even after X or between consecutive prints
 * 
 * @see {@link randInsertFork_notBeforeWait} For specialized fork insertion
 */
function randInsert(mainStr, insertStr, anySlot = false, minSlot = 0, maxOffset = 0) {
    let validPositions = [];

    // Find all valid insertion positions within the specified range
    for (let i = minSlot; i < (mainStr.length+1-maxOffset); i++) {
        if (mainStr[i] !== '(') {
            if (anySlot || (mainStr[i] !== '-' && mainStr[i-1] !== '-' && mainStr[i-1] !== EXIT_CHAR)) {
                validPositions.push(i);
            }
        }
    }
    
    // Randomly select one valid position for insertion
    const insertPosition = validPositions[Math.floor(randomFloat32() * validPositions.length)];
    
    // Insert the string at the selected position
    return mainStr.slice(0, insertPosition) + insertStr + mainStr.slice(insertPosition);
}

/**
 * Inserts fork operations while avoiding positions that create timeline ambiguity.
 * 
 * @description
 * This specialized insertion function prevents fork operations from being placed
 * immediately before wait() calls, which would create ambiguous execution timelines.
 * It implements sophisticated position tracking to distinguish between different
 * execution contexts and applies weighted selection for educational diversity.
 * 
 * **Timeline Ambiguity Prevention:**
 * The core issue: if we insert F() right before W in "aWb", creating "aF()Wb",
 * it becomes unclear which child process (the new fork or the original) should
 * exit to satisfy the wait. This ambiguity breaks educational clarity.
 * 
 * **Position Classification System:**
 * - **parallel**: Positions at the main timeline level (no nested forks)
 * - **child{N}**: Positions within child process code at nesting level N
 * - **afterwait**: Positions in parent code after wait() calls
 * 
 * **Weighted Selection Logic:**
 * Uses inverse frequency weighting combined with diversity tracking to ensure
 * varied question generation while maintaining educational balance.
 * 
 * **State Tracking:**
 * - `pastParanthesisLevel`: Current nesting depth in fork structure
 * - `pastWaitLevel`: How many wait operations have been encountered
 * - `pastChildLevel`: Current child process nesting level
 * - `waitedStack`: Tracks whether each nesting level has called wait()
 * 
 * @param {string} mainStr - Compact notation string to modify
 * @param {string} insertStr - Fork operation to insert (typically "F(-W-,-X)")
 * @param {boolean} [anySlot=false] - If true, relaxes some validation rules
 * @param {number} [minSlot=0] - Minimum position index for insertion
 * @param {number} [maxOffset=0] - Offset from end to exclude from consideration
 * 
 * @returns {string} Modified compact notation with fork inserted at appropriate position
 * 
 * @example
 * // Safe fork insertion avoiding wait ambiguity
 * let code = "aWb";
 * let result = randInsertFork_notBeforeWait(code, "F(-W-,-X)", false, 0, 0);
 * // Possible results: "F(-W-,-X)aWb" or "aWbF(-W-,-X)"
 * // Never: "aF(-W-,-X)Wb" (would create ambiguity)
 * 
 * @example
 * // Complex nested structure
 * let code = "F(aWb,c)d";
 * // Function analyzes nesting levels and wait positions
 * // Classifies positions as parallel, child1, or afterwait
 * // Uses weighted selection for educational diversity
 * 
 * @see {@link randInsert} For simpler insertion without wait analysis
 * @see {@link weightedPickId} For the weighted selection algorithm
 * @see {@link findCountElement} For position frequency counting
 */
function randInsertFork_notBeforeWait(
    mainStr,
    insertStr,
    anySlot = false,
    minSlot = 0,
    maxOffset = 0
) {
    const validPositions = [];
    const position_type = [];
    let pastParanthesisLevel = 0;
    let pastWaitLevel = 0;
    let pastChildLevel = 0;
    let waitedStack = [false];

    const upperBound = mainStr.length + 1 - maxOffset;   // "+" lets us insert at the very end
    for (let i = 0; i < upperBound; i++) {

        /* ---------- 1. record a valid slot (only after minSlot) ---------- */
        if (i >= minSlot) {
            if (
                mainStr[i] !== WAIT_CHAR &&           // never put it *on* the W
                mainStr[i] !== '(' &&                 // never before an opening "("
                pastParanthesisLevel === pastWaitLevel &&
                (anySlot || mainStr[i - 1] !== EXIT_CHAR)
            ) {
                validPositions.push(i);
                if (pastChildLevel === pastParanthesisLevel) {
                    if (pastParanthesisLevel === 0) {
                        position_type.push("parallel");
                    } else {
                        position_type.push(`child${pastParanthesisLevel}`);
                    }
                } else {
                    position_type.push("afterwait");
                }
            }
        }

        /* ---------- 2. update bookkeeping counters ---------- */
        switch (mainStr[i]) {
            case '(':
                pastParanthesisLevel++;
                waitedStack.push(false);
                break;
            case WAIT_CHAR:
                pastWaitLevel++;
                waitedStack[pastParanthesisLevel] = true;
                break;
            case ',':
                const waitedCurrent = waitedStack[pastParanthesisLevel];
                pastWaitLevel += waitedCurrent ? 0 : 1;
                pastChildLevel++;
                waitedStack[pastParanthesisLevel] = false;
                break;
            case ')':
                pastParanthesisLevel--;
                pastWaitLevel--;
                pastChildLevel--;
                waitedStack.pop();
                break;
        }
    }

    /* ---------- 3. calculate weighted probabilities for insertion slots ---------- */
    // Count how many positions of each type we have available
    const countMap = findCountElement(position_type);
    const oddsMap = {};
    
    // Calculate inverse-frequency weighted odds for each position type
    // This ensures diversity by making rare position types more likely to be chosen
    for (const [key, value] of countMap.entries()) {
        if (key.startsWith("child")) {
            // Child positions get base weight 10, reduced if we've used child positions recently
            oddsMap[key] = 10/value/(prev_code_child?2:1);
        } else if (key.startsWith("afterwait")) {
            // AfterWait positions get base weight 8, reduced if used in previous or current generation
            oddsMap[key] = 8/value/(prev_code_afterwait?2:1)/(current_code_afterwait?2:1);
        } else if (key.startsWith("parallel")) {
            // Parallel positions get base weight 2, reduced if used recently
            oddsMap[key] = 2/value/(prev_code_parallel?2:1)/(current_code_parallel?2:1);
        }
    }
    // Map position types to their calculated odds for weighted selection
    const position_odds = position_type.map(type => oddsMap[type]);

    /* ---------- 4. pick a slot (or fall back to end) ---------- */
    if (validPositions.length === 0) {
        // No valid positions found - append to end as fallback
        return mainStr + insertStr;
    }
    
    // Use weighted random selection to pick an insertion position
    const choiceIndex = weightedPickId(position_odds);
    const insertPos = validPositions[choiceIndex];
    
    // Update global state tracking for future diversity weighting
    if (position_type[choiceIndex].startsWith("child")) {
        current_code_child = true;
    } else if (position_type[choiceIndex] === "afterwait") {
        current_code_afterwait = true;
    } else if (position_type[choiceIndex] === "parallel") {
        current_code_parallel = true;
    }

    // Insert the string at the selected position
    return mainStr.slice(0, insertPos) + insertStr + mainStr.slice(insertPos);
}

/**
 * Adjusts the number of print operations in compact notation to match a target count.
 * This function fine-tunes the complexity of generated code by adding or removing
 * print placeholders ('-') to achieve exact educational specifications.
 * 
 * The function handles two scenarios:
 * 1. Too many prints: Randomly removes excess placeholders to avoid bias
 * 2. Too few prints: Randomly inserts new placeholders in valid positions
 * 
 * Random placement ensures:
 * - Educational variety in question generation
 * - Avoidance of predictable patterns
 * - Balanced distribution of print operations across the code
 * 
 * @param {string} str - Compact notation string with print placeholders (-)
 * @param {number} targetCount - Desired number of print operations
 * @returns {string} Adjusted compact notation with exact target print count
 */
function adjustPrints(str, targetCount) {
    let currentCount = (str.match(/-/g) || []).length;
    let result = str;
  
    if (currentCount > targetCount) {
        // REMOVAL PHASE: Too many print placeholders
        const removals = currentCount - targetCount;
        for (let i = 0; i < removals; i++) {
            // Collect all current placeholder positions
            const positions = [];
            for (let j = 0; j < result.length; j++) {
                if (result[j] === '-') positions.push(j);
            }
            // Randomly select one position to remove (ensures variety)
            const randIdx = Math.floor(Math.random() * positions.length);
            const removePos = positions[randIdx];
            // Remove the selected placeholder
            result = result.slice(0, removePos) + result.slice(removePos + 1);
        }
    } else if (currentCount < targetCount) {
        // ADDITION PHASE: Not enough print placeholders
        const additions = targetCount - currentCount;
        for (let i = 0; i < additions; i++) {
            // Insert new placeholder at a random valid position
            // Uses randInsert with anySlot=true for maximum flexibility
            result = randInsert(result, PRINT_CHAR, true, 0, 1);
        }
    }
    // If currentCount == targetCount, no adjustment needed
  
    return result;
}

/**
 * Inserts a print-exit sequence at a random closing parenthesis position.
 * This function adds educational complexity by creating processes that print
 * a final message before terminating, demonstrating exit() behavior.
 * 
 * The function strategically places exit operations:
 * - Only at closing parentheses (end of code blocks)
 * - Avoids the very beginning and end of the string
 * - Includes a print before exit for educational visibility
 * 
 * Pattern inserted: "-X" where:
 * - "-" becomes a print statement showing the process is about to exit
 * - "X" represents the exit() system call
 * 
 * Educational purpose:
 * - Demonstrates process termination behavior
 * - Shows the difference between processes that exit vs continue
 * - Creates scenarios for testing student understanding of process lifecycle
 * 
 * @param {string} mainStr - Compact notation string to modify
 * @returns {string} Modified string with print-exit sequence inserted at random position
 */
function exitInsert(mainStr) {
    let validPositions = [];
    
    // Find all closing parentheses that could be valid exit points
    // Skip positions too close to string boundaries to ensure valid insertion
    for (let i = 2; i < (mainStr.length - 3); i++) {
        if (mainStr[i] == ')') {
            validPositions.push(i);
        }
    }
    
    // Randomly select one valid position for exit insertion
    const insertPosition = validPositions[Math.floor(randomFloat32() * validPositions.length)];
    
    // Insert print-exit sequence: process prints then exits
    return mainStr.slice(0, insertPosition) + PRINT_CHAR + EXIT_CHAR + mainStr.slice(insertPosition);
}

/**
 * Generates randomized compact notation for educational fork/wait/exit exercises.
 * 
 * @description
 * This function creates varied process hierarchy code with controlled complexity
 * for educational purposes. It supports different generation modes and features
 * to create appropriate challenges for students learning process concepts.
 * 
 * **Generation Features:**
 * - **hasNest**: Controls whether forks can be nested (creates complex hierarchies)
 * - **hasExit**: Adds process termination for exit() behavior demonstration
 * - **hasElse**: Creates if/else fork patterns vs. simple fork calls
 * 
 * **Complexity Control:**
 * - numForks: Exact number of fork operations to include
 * - numPrints: Target number of print operations (adjusted during generation)
 * - Balances educational value with manageable complexity
 * 
 * **Generation Strategy:**
 * - Non-nested: Places forks sequentially with optional print integration
 * - Nested: Uses random insertion for complex hierarchical structures
 * - Exit integration: Adds process termination scenarios
 * - Character replacement: Converts placeholders to alphabetic sequence
 * 
 * **Educational Applications:**
 * - Beginner exercises with simple fork structures
 * - Advanced problems with nested process hierarchies
 * - Exit behavior demonstration and testing
 * - Varied difficulty progression
 * 
 * @param {number} numForks - Exact number of fork operations to generate
 * @param {number} numPrints - Target number of print operations to include
 * @param {boolean} hasNest - Whether to allow nested fork structures
 * @param {boolean} hasExit - Whether to include process exit operations
 * @param {boolean} hasElse - Whether to use if/else fork patterns
 * 
 * @returns {string} Compact notation string with print placeholders replaced by letters (a, b, c, ...)
 * 
 * @example
 * // Simple sequential forks
 * let code = genRandSourceCode(2, 3, false, false, true);
 * // Possible result: "F(a,b)F(c,d)e"
 * 
 * @example
 * // Complex nested structure with exit
 * let code = genRandSourceCode(2, 4, true, true, false);
 * // Possible result: "aF(bF(c)d,eX)f"
 * 
 * @example
 * // Educational progression
 * // Beginner: genRandSourceCode(1, 2, false, false, true)
 * // Intermediate: genRandSourceCode(2, 3, true, false, true)  
 * // Advanced: genRandSourceCode(3, 4, true, true, true)
 * 
 * @see {@link randInsert} For random insertion logic
 * @see {@link exitInsert} For exit operation placement
 */
export function genRandSourceCode(numForks, numPrints, hasNest, hasExit, hasElse) {
    let code = "";
    const fork = hasElse?"F(,)":"F()";

    if (!hasNest) {
        if (hasElse) {
            code = fork.repeat(numForks); // we have enough diversity already
        } else { // forced diversity, this cause us to weigh it more to have forks
            for (let i = 0; i < numForks; i++) {
                if (randomFloat32() < 0.5 && numPrints > 0) {
                    numPrints--;
                    code +=`F(${PRINT_CHAR})`;
                }
                else {
                    code += fork;
                }
            }
        }
    }
    else {
        // Generate forking locations
        for (let i = 0; i < numForks; i++) {
            code = randInsert(code, fork, true);
        }
    }

    if (hasExit) {
        code = exitInsert(code);
    }

    for (let i = 0; i < numPrints-1 - (hasExit?1:0); i++) {
        code = randInsert(code, PRINT_CHAR, false, 0, 1);
    }
    
    if (numPrints > 0) {
        code += PRINT_CHAR;
    }

    let i = 0;
    const replaceChar = () => {
        const char = String.fromCharCode('a'.charCodeAt(0) + i % 26);
        i++;
        return char;
    };
    let t = code.replace(new RegExp(PRINT_CHAR, 'g'), replaceChar); 
    return t;
}

/**
 * Generates a structured wait code pattern with exact fork and print counts.
 * This function creates more complex process hierarchies with proper synchronization
 * patterns, used for intermediate and advanced difficulty modes.
 * 
 * Key characteristics of generated code:
 * - Every fork operation has a corresponding wait operation (parent waits for child)
 * - Child processes explicitly exit to ensure proper synchronization
 * - Nested fork structures create deeper process hierarchies
 * - Exact control over complexity through fork and print parameters
 * 
 * The base pattern used: F(-W-,-X) where:
 * - First '-' becomes a print before wait
 * - W represents the wait() system call
 * - Second '-' becomes a print after wait (when child exits)
 * - Third '-' becomes a print in the child process
 * - X represents the exit() system call in child
 * 
 * Example progression:
 * - numForks=1: F(aWb,cX) 
 * - numForks=2: F(aWbF(dWe,fX)g,hX)
 * 
 * @param {number} numForks - Exact number of fork operations to generate
 * @param {number} numPrints - Exact number of print operations to include
 * @returns {string} Compact notation string with proper wait/exit synchronization
 */
export function genSimpleWaitCode(numForks, numPrints) {
    let code = ""; // Start with empty string (main parent doesn't exit)
    
    // Base fork pattern: parent prints, waits, prints again; child prints and exits
    const fork = `F(${PRINT_CHAR}${WAIT_CHAR}${PRINT_CHAR},${PRINT_CHAR}${EXIT_CHAR})`;
    
    // Generate nested fork structure by inserting forks at valid positions
    for (let i = 0; i < numForks; i++) {
        // Insert fork avoiding placement before wait operations (prevents timeline ambiguity)
        code = randInsertFork_notBeforeWait(code, fork, false, 2, 0);
        // Clean up any consecutive print placeholders that may have been created
        code = code.replace(/-+/g, '-');
    }

    // Adjust the total number of print operations to match the target
    code = adjustPrints(code, numPrints);

    // Character replacement function for converting print placeholders to letters
    let i = 0;
    const replaceChar = () => {
        const char = String.fromCharCode('a'.charCodeAt(0) + i % 26);
        i++;
        return char;
    };

    // Replace all print placeholders (-) with sequential letters (a, b, c, ...)
    code = code.replace(new RegExp("-", 'g'), replaceChar);

    // Update global state tracking for weighted random generation
    // This maintains diversity in subsequent question generation
    prev_code_child = current_code_child;
    prev_code_afterwait = current_code_afterwait;
    prev_code_parallel = current_code_parallel;

    // Reset current state flags for next generation cycle
    current_code_child = false;
    current_code_afterwait = false;
    current_code_parallel = false;

    return code;
}

/**
 * Generates predefined simple wait code patterns for Mode 1 difficulty.
 * This function provides a curated set of fork/wait/exit patterns that are
 * specifically designed for educational clarity and complexity appropriate
 * for beginning students.
 * 
 * Mode 1 patterns focus on:
 * - Simple fork structures with clear wait/exit relationships
 * - Scenarios where child process may or may not exit
 * - Educational clarity over complexity
 * - Predictable behavior patterns for learning
 * 
 * Pattern notation:
 * - F() = fork with no specific code
 * - F(parent_code, child_code) = fork with specific execution paths
 * - W = wait() system call
 * - X = exit() system call
 * - - = placeholder for print statement (replaced with letters)
 * 
 * @returns {string} Randomly selected compact notation code with print placeholders replaced by letters
 */
export function genSimpleWaitCodeMode1() {
    // Predefined patterns for Mode 1 (beginner level)
    // Each pattern represents a different fork/wait/exit scenario for educational diversity
    // Some patterns are repeated for higher selection probability: generation probability control.
    let code_candidates = [
        "F()F(-W-,-X)-",           // Basic fork with wait/exit pattern
        "F()F(-W-,-X)-",           // Duplicate for higher selection probability
        "F(-W-F()-,-X)-",          // Nested fork within wait section
        "F(-W-,-X)F()-",           // Fork after wait section
        "F()F(-W-,-X)-",           // Repeat basic pattern
        "F()F(-W-,-X)-",           // Repeat basic pattern
        "F(-W-F()-,-X)-",          // Repeat nested pattern
        "F(-W-,-X)F()-",           // Repeat post-wait fork
        "F()F(-W-,-)-",            // Wait without child exit
        "F()F(-W-,-)-",            // Repeat no-exit pattern
        "F(-W-,-)F()-",            // No-exit with post-wait fork
        "F()F(-,-)-",              // Simple fork without wait/exit
        "F()F(-,-)-",              // Repeat simple pattern
        "F(-,-)F()-",              // Simple with post-fork
        "F(-W,-F(-W,-)-X)-",       // Complex nested wait pattern
        "F(-W,-F(-W,-)-X)-",       // Repeat complex pattern
    ];
    
    // Randomly select one of the predefined patterns
    let code = unifPickItem(code_candidates);

    // Character replacement function to convert placeholders to letters
    let i = 0;
    const replaceChar = () => {
        const char = String.fromCharCode('a'.charCodeAt(0) + i % 26);
        i++;
        return char;
    };

    // Replace all print placeholders (-) with sequential letters (a, b, c, ...)
    code = code.replace(new RegExp("-", 'g'), replaceChar);

    // Update global state tracking for weighted random generation
    // This helps maintain diversity in subsequent question generation
    prev_code_child = current_code_child;
    prev_code_afterwait = current_code_afterwait;
    prev_code_parallel = current_code_parallel;

    // Reset current state flags for next generation cycle
    current_code_child = false;
    current_code_afterwait = false;
    current_code_parallel = false;

    return code;
}

// ============================================================================
// HIGH-LEVEL COMPILATION AND TREE BUILDING FUNCTIONS
// ============================================================================

/**
 * Main compilation function that converts compact notation to process tree and C code.
 * This is the primary entry point for transforming educational fork expressions
 * into both executable simulation and displayable C code.
 * 
 * The function performs:
 * 1. Creates a root process node
 * 2. Parses and executes the compact notation
 * 3. Generates corresponding C code with interactive labels
 * 4. Returns both the simulation tree and formatted code
 * 
 * @param {string} code - Compact notation string (e.g., "F(aWb,cX)d")
 * @returns {Array} [processTree, labeledCCode] - Complete simulation and display code
 */
export function buildAndTranspile(code) {
    let tree = new ForkNode();                    // Create root process node
    let result = tree.pushCode(code);             // Parse and build the execution tree
    let labeledCodeC = labelLines(result.cCode);  // Add interactive labels to generated C code
    return [tree, labeledCodeC];
}

/**
 * Adds interactive HTML labels to C code lines for step-by-step visualization.
 * Each line of generated C code gets wrapped in spans with data attributes
 * that enable interactive highlighting and tracing functionality.
 * 
 * The labeling system allows students to:
 * - Click on code lines to see corresponding tree states
 * - Follow execution flow through process hierarchy
 * - Understand the relationship between code and process behavior
 * 
 * Special handling:
 * - Closing braces (}) are not labeled as they don't represent execution steps
 * - Each executable line gets a unique block ID for interaction tracking
 * 
 * @param {Array} code - Array of C code strings from tree compilation
 * @returns {string} HTML string with interactive span elements and line breaks
 */
function labelLines(code) {
    let annotated = [];
    
    for (let i = 0; i < code.length; i++) {
        if (code[i].indexOf("}") === -1) {
            // Executable code line - wrap with interactive span
            let prefix = `<span data-block="${i}">`;
            let suffix = `</span>`;
            annotated.push(`${prefix}${code[i]}${suffix}`);
        } else {
            // Closing brace - no interaction needed
            annotated.push(`${code[i]}`);
        }
    }
    
    // Join all lines with HTML line breaks for web display
    let joinedAnnotated = annotated.join(NEWLINE);
    return joinedAnnotated;
}

/**
 * Creates a partial execution trace of the process tree up to a specific point.
 * This function enables step-by-step visualization by building the process tree
 * only up to a specified termination point, allowing students to see how the
 * hierarchy develops incrementally.
 * 
 * Used for:
 * - Interactive code stepping through execution
 * - Showing partial tree states during visualization
 * - Educational demonstration of process creation order
 * - Debugging and understanding execution flow
 * 
 * @param {string} code - Compact notation string to execute
 * @param {number} terminate - Execution step to stop at (for partial traces)
 * @returns {ForkNode} Process tree representing execution up to termination point
 */
export function traceTree(code, terminate) {
    let tree = new ForkNode();              // Create root process node
    tree.pushCode(code, 0, terminate);     // Execute up to termination point
    return tree;
}