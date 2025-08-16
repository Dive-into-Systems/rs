/**
 * @file timeline_statistics.js
 * @brief Statistical analysis utilities for process execution timelines
 * 
 * This module provides functions to analyze process execution constraints
 * and calculate various metrics that help determine optimal visualization
 * parameters for timeline graphs.
 * 
 * Key metrics calculated:
 * - Execution depth (how deeply nested are the fork operations)
 * - Execution width (how many concurrent operations occur)
 * - Print distribution across different execution phases
 * - Fork complexity metrics
 * 
 * These statistics are used to:
 * - Size timeline visualizations appropriately
 * - Optimize layout algorithms
 * - Provide complexity feedback to educators
 * - Validate generated test cases
 * 
 * @author Zhengfei Li (Summer 2025)
 */

import {PrintItem, ForkItem} from "./build.js"

/**
 * Recursively analyzes a sequence of execution constraints to collect statistics.
 * This function traverses the entire execution constraint tree and accumulates
 * various metrics that describe the complexity and structure of the execution.
 * 
 * The analysis helps determine:
 * - How much screen space the timeline visualization will need
 * - Whether the generated test case has appropriate complexity
 * - How to balance different types of execution patterns
 * 
 * @param {Array} constraints - Array of PrintItem and ForkItem objects representing execution
 * @param {number} depth - Current recursion depth (used for calculating max nesting)
 * @returns {Object} Statistics object with various metrics about the execution
 */
export function analyzeSequenceList(constraints, depth = 0) {
    // Initialize statistics accumulator
    let stats = {
        beforeWaitPrints: 0,    // Print operations before wait() calls
        afterWaitPrints: 0,     // Print operations after wait() calls  
        childPrints: 0,         // Print operations in child processes
        otherPrints: 0,         // Print operations in main/other contexts
        maxDepth: depth,        // Maximum nesting depth of fork operations
        maxWidth: 0,            // Maximum concurrent execution width
        totalForks: 0           // Total number of fork operations
    };

    // Analyze each constraint in the sequence
    for (const item of constraints) {
        if (item instanceof PrintItem) {
            // PRINT OPERATION: Simple sequential execution
            stats.otherPrints++;     // Count this print operation
            stats.maxWidth++;        // Contributes to execution width
        } else if (item instanceof ForkItem) {
            // FORK OPERATION: Complex branching execution
            stats.totalForks++;     // Count this fork operation
            
            // Recursively analyze the three execution branches:
            // 1. beforeWait: Parent execution before wait() call
            const beforeWaitStats = analyzeSequenceList(item.beforeWait, depth + 1);
            // 2. afterWait: Parent execution after wait() call  
            const afterWaitStats = analyzeSequenceList(item.afterWait, depth);
            // 3. child: Child process execution
            const childStats = analyzeSequenceList(item.child, depth + 1);

            // Aggregate beforeWait print statistics
            stats.beforeWaitPrints += beforeWaitStats.otherPrints;
            stats.beforeWaitPrints += beforeWaitStats.beforeWaitPrints;
            stats.beforeWaitPrints += afterWaitStats.beforeWaitPrints;
            stats.beforeWaitPrints += childStats.beforeWaitPrints;

            // Aggregate afterWait print statistics  
            stats.afterWaitPrints += afterWaitStats.otherPrints;
            stats.afterWaitPrints += beforeWaitStats.afterWaitPrints;
            stats.afterWaitPrints += afterWaitStats.afterWaitPrints;
            stats.afterWaitPrints += childStats.afterWaitPrints;

            // Aggregate child print statistics
            stats.childPrints += childStats.otherPrints;
            stats.childPrints += beforeWaitStats.childPrints;
            stats.childPrints += afterWaitStats.childPrints;
            stats.childPrints += childStats.childPrints;
            
            // Update maximum depth (deepest nesting level)
            stats.maxDepth = Math.max(stats.maxDepth, beforeWaitStats.maxDepth, 
                                    afterWaitStats.maxDepth, childStats.maxDepth);
            
            // Update maximum width (concurrent execution complexity)
            // Parent and child can execute concurrently, afterWait is sequential
            stats.maxWidth += Math.max(beforeWaitStats.maxWidth, childStats.maxWidth);
            stats.maxWidth += afterWaitStats.maxWidth;
            
            // Aggregate total fork counts
            stats.totalForks += beforeWaitStats.totalForks + afterWaitStats.totalForks + childStats.totalForks;
        }
    }

    return stats;
}