/**
 * @file hierarchyDraw.js
 * @brief Process hierarchy visualization using Graphviz and D3
 * 
 * This module creates directed graph visualizations showing parent-child
 * relationships between processes created by fork() operations. The visualization
 * helps students understand:
 * - How fork() creates process hierarchies
 * - Which processes are parents vs children
 * - What output each process produces
 * - Which processes exit vs continue running
 * 
 * Key features:
 * - Uses Graphviz for automatic graph layout
 * - Color codes nodes based on process state (exited vs running)
 * - Shows process output within each node
 * - Connects parent and child processes with directed edges
 * 
 * @author Tony Cao, Luyuan Fan (Summer 2024)
 */

import { csvParse, stratify, select } from "d3";
import {EXIT_CHAR} from "./build.js";
import { graphviz } from "d3-graphviz";
import "@hpcc-js/wasm";

// ============================================================================
// HIERARCHY VISUALIZATION FUNCTIONS
// ============================================================================

/**
 * Processes hierarchy data to generate Graphviz node and edge definitions.
 * This function converts the process hierarchy data into Graphviz DOT notation
 * for rendering as a directed graph.
 * 
 * @param {Array} links - Array of parent-child relationships from CSV data
 *                        Each object should have 'parent' and 'child' properties
 * @param {Array} labels - Array of process labels with format "processID: [output1,output2,...]"
 * @returns {Array} [nodeDefinitions, edgeDefinitions] - Strings containing Graphviz DOT notation
 */
function getHierarchyAttr(links, labels) {
    var nodeDef = "";  // Accumulate Graphviz node definitions
    var edgeDef = "";  // Accumulate Graphviz edge definitions

    // Parse and sort labels by process ID for consistent ordering
    let parsedLabels = labels.map(label => {
        let [key, value] = label.split(":");
        return {
            key: parseInt(key.trim()),    // Process ID as number
            value: value.trim()           // Process output data
        };
    });
    
    // Sort by process ID to ensure deterministic node ordering
    parsedLabels.sort((a, b) => a.key - b.key);
    let sortedLabels = parsedLabels.map(label => `${label.key}: ${label.value}`);

    // Group parent-child links by parent for consistent edge ordering
    const groupedByParent = links.reduce((acc, obj) => {
        if (!acc[obj.parent]) {
            acc[obj.parent] = [];
        }
        acc[obj.parent].push(obj);
        return acc;
    }, {});
    
    // Sort children by ID within each parent group
    for (let parent in groupedByParent) {
        groupedByParent[parent].sort((a, b) => parseInt(a.child) - parseInt(b.child));
    }
    
    // Flatten back to sorted array
    let sortedArray = [];
    for (let parent in groupedByParent) {
        sortedArray = [...sortedArray, ...groupedByParent[parent]];
    }

    // Generate Graphviz node definitions with styling
    sortedLabels.forEach(label => {
        let [ID, val] = label.split(':');
        // Extract actual print characters, removing array brackets
        let prints = val.trim().slice(1,-1).split(',').join('');
        // Color nodes differently if process has exited (contains EXIT_CHAR)
        let color = prints.includes(EXIT_CHAR) ? '#fba69d' : '#c6d9f1';
        // Remove exit markers from display (they're shown by color)
        prints = prints.replace(new RegExp(EXIT_CHAR, 'g'), '');
        // Create Graphviz node definition
        nodeDef += (`${ID} [label="${prints}", fillcolor="${color}"];`);
    });

    // Generate Graphviz edge definitions
    sortedArray.forEach(e => {
        const c = e.child;   // Child process ID
        const p = e.parent;  // Parent process ID

        // Only create edge if parent exists (root node has no parent)
        if (p) { 
            edgeDef += (`${p} -> ${c};`); 
        }
    });

    return [nodeDef, edgeDef];
}

/**
 * Main function to render a process hierarchy graph using Graphviz.
 * This function takes process relationship data and creates an interactive
 * directed graph visualization showing the parent-child process structure.
 * 
 * The visualization uses:
 * - Circular nodes to represent processes
 * - Node colors to indicate process state (blue=running, red=exited)
 * - Node labels to show process output
 * - Directed edges to show parent-child relationships
 * - Automatic layout via Graphviz for optimal positioning
 * 
 * @param {string} linksCsv - CSV string containing parent-child relationships
 *                            Expected format: "child,parent\n1,0\n2,1\n..."
 * @param {Array} labels - Array of strings with process output data
 *                         Expected format: ["0: [a,b]", "1: [c]", "2: [d,X]"]
 */
export function drawHierarchy(linksCsv, labels) {
    // Parse CSV data into structured objects
    const links = csvParse(linksCsv);

    // Build Graphviz DOT notation string
    var digraphString = (
        'digraph {' + 
        'bgcolor = "transparent";' +  // Transparent background for web integration
        // Default node styling: circular, blue, fixed size
        'node [shape=circle, color="#5986ba", style=filled, fixedsize=true, width=1];' +
        // Default edge styling: black, thick lines
        'edge [color=black, penwidth=2.0];'
    );

    // Generate specific node and edge definitions for this hierarchy
    const [nodeDef, edgeDef] = getHierarchyAttr(links, labels);

    // Combine all parts of the DOT notation
    digraphString += nodeDef;  // Add specific node definitions with custom labels/colors
    digraphString += edgeDef;  // Add specific edge definitions for parent-child links
    digraphString += "}";      // Close the digraph

    // Render the graph using d3-graphviz
    // This will create an SVG visualization in the #hierarchy_graph element
    select("#hierarchy_graph").graphviz()
        .renderDot(digraphString);
}
