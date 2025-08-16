/**
 * @file timelineDraw.js
 * @brief Timeline graph drawing utilities for process execution visualization
 * 
 * This module creates interactive timeline diagrams showing:
 * - Process execution flow over time (horizontal axis = time)
 * - Fork points where processes split into parent/child
 * - Wait points where parent blocks until child exits
 * - Exit points where processes terminate
 * - Print operations and their timing relationships
 * 
 * Key concepts:
 * - Timeline nodes represent execution states (fork, wait, exit, print)
 * - Horizontal edges show time progression within a process
 * - Vertical edges show fork/wait/exit relationships between processes
 * - The visualization helps students understand process synchronization
 * 
 * Uses D3.js for SVG rendering and assumes simple forking structure
 * (no forking before wait to avoid timeline ambiguities)
 * 
 * @author Tony Cao, Luyuan Fan (Summer 2024, Initiation), Zhengfei Li (Summer 2025, improvements)
 */

import "../css/timeline.css";
import "./build.js";
import {PrintItem, ForkItem} from "./build.js"
import * as d3 from "d3";

// ============================================================================
// TIMELINE NODE CLASS - REPRESENTS EXECUTION STATES
// ============================================================================

/**
 * Represents a single point in the process execution timeline.
 * Each node can represent different types of execution events:
 * - Fork events (process splits into parent/child)
 * - Wait events (parent blocks for child)
 * - Exit events (process terminates)
 * - Print events (process outputs text)
 * - Simple continuation points
 */
class TimelineNode {
    /**
     * Creates a new timeline node representing an execution state.
     * 
     * @param {number} x - Horizontal position (represents time)
     * @param {number} y - Vertical position (represents process/thread)
     * @param {string} printsAfter - Text printed after this execution point
     * @param {boolean} fork_node - Whether this node represents a fork() call
     * @param {boolean} exit_node - Whether this node represents an exit() call  
     * @param {boolean} wait_node - Whether this node represents a wait() call
     * @param {boolean} child_node - Whether this node represents child process start
     * @param {boolean} solid_link - Whether outgoing edges should be solid (vs dashed)
     */
    constructor(x, y, printsAfter = "", fork_node=false, exit_node=false, wait_node=false, child_node=false, solid_link = false) {
        // Spatial coordinates for visualization
        this.x = x;                    // Horizontal position (time axis)
        this.y = y;                    // Vertical position (process axis)
        
        // Node type flags - what kind of execution event this represents
        this.fork_node = fork_node;    // Represents fork() system call
        this.fork_idx = null;          // Index in execution sequence for fork
        this.exit_node = exit_node;    // Represents exit() system call
        this.exit_idx = null;          // Index in execution sequence for exit
        this.wait_node = wait_node;    // Represents wait() system call
        this.wait_idx = null;          // Index in execution sequence for wait
        this.child_node = child_node;  // Represents start of child process
        this.child_idx = null;         // Index in execution sequence for child start
        
        // Output and visualization properties
        this.printsAfter = printsAfter; // Text printed after this execution point
        this.print_idx = null;          // Index in execution sequence for print
        this.solid_link = solid_link;   // Whether edges from this node are solid
        this.children = [];             // Connected timeline nodes (execution flow)
        this.name = "";                 // Debug name for this node
    }

    /**
     * Adds a child node to represent continued execution flow.
     * 
     * @param {TimelineNode} child - The next node in execution sequence
     */
    addChild(child) {
        this.children.push(child);
    }
}

// ============================================================================
// CORE TIMELINE PLANNING ALGORITHM
// ============================================================================

/**
 * Recursively builds a timeline graph from process execution constraints.
 * This is the core algorithm that transforms abstract execution constraints
 * into a concrete timeline visualization with proper node positioning.
 * 
 * The algorithm handles:
 * - Sequential execution (print operations)
 * - Fork operations (process splitting)
 * - Wait operations (parent blocks for child)
 * - Exit operations (process termination)
 * - Concurrent execution visualization
 * 
 * @param {Array} constraints - Array of PrintItem and ForkItem objects representing execution
 * @param {TimelineNode} prev_node_arg - Previous node to attach to (represents execution state)
 * @param {number} y_btm - Bottom Y coordinate boundary for layout
 * @param {Array} nodes - Accumulator array for all created timeline nodes
 * @param {number} graph_depth - Current depth in the execution graph (for visualization)
 * @param {number} recursion_depth - Current recursion depth (for infinite loop protection)
 * @returns {TimelineNode} The final node representing the end of this execution sequence
 */
function recursivePlanTimeline(constraints, prev_node_arg, y_btm = 1, nodes = [], graph_depth = 0, recursion_depth = 0) {
    // Prevent infinite recursion in malformed input
    const MAX_RECURSION_DEPTH = 100;
    if (recursion_depth > MAX_RECURSION_DEPTH) {
        console.warn("Maximum recursion depth reached in recursivePlanTimeline - preventing infinite recursion");
        let emergency_node = new TimelineNode(prev_node_arg.x + 1, prev_node_arg.y);
        emergency_node.name = "emergency_stop ";
        nodes.push(emergency_node);
        prev_node_arg.addChild(emergency_node);
        return emergency_node;
    }
    
    // BASE CASE: No more execution constraints to process
    if (!Array.isArray(constraints) || constraints.length === 0) {
        let new_tail_node_for_empty_seq = new TimelineNode(prev_node_arg.x + 1, prev_node_arg.y);
        new_tail_node_for_empty_seq.name = "tail ";
        nodes.push(new_tail_node_for_empty_seq);
        prev_node_arg.addChild(new_tail_node_for_empty_seq);
        return new_tail_node_for_empty_seq;
    }

    // Track the current point in the timeline where new nodes should attach
    let current_attach_point_node = prev_node_arg;

    // Process each execution constraint in order
    for (let i = 0; i < constraints.length; i++) {
        const item = constraints[i];
        
        if (item instanceof PrintItem) {
            // PRINT OPERATION: Simple sequential execution that outputs text
            if (item.printChar.length === 0) {
                continue; // Skip empty print operations
            }
            
            // Attach print info to current node and create continuation
            current_attach_point_node.printsAfter = item.printChar;
            current_attach_point_node.print_idx = item.executionIndex;
            
            // Create next node in timeline (represents state after print)
            let new_activity_node = new TimelineNode(current_attach_point_node.x + 1, current_attach_point_node.y);
            new_activity_node.name += "activity ";
            nodes.push(new_activity_node);
            current_attach_point_node.addChild(new_activity_node);
            
            // Main process timeline should have solid links
            if (graph_depth === 0) {
                current_attach_point_node.solid_link = true;
            }
            
            // Move attachment point forward
            current_attach_point_node = new_activity_node;
        } else if (item instanceof ForkItem) {
            // FORK OPERATION: Process splits into parent and child execution paths
            // This is the most complex case as it creates branching execution
            let fork_origin_node;

            // Decide whether to reuse current node or create new fork node
            if (!current_attach_point_node.fork_node && !current_attach_point_node.wait_node && 
                !current_attach_point_node.child_node && current_attach_point_node.printsAfter.length === 0) {
                // Current node is "clean" - reuse it as the fork point
                fork_origin_node = current_attach_point_node;
            } else {
                // Current node has other purposes - create new dedicated fork node
                fork_origin_node = new TimelineNode(current_attach_point_node.x + 1, current_attach_point_node.y);
                nodes.push(fork_origin_node);
                current_attach_point_node.addChild(fork_origin_node);
            }
            
            // Mark this node as representing a fork operation
            fork_origin_node.fork_node = true;
            fork_origin_node.fork_idx = item.forkExecutionIndex;
            fork_origin_node.name += "fork ";

            // Process beforeWait branch
            let beforeWaitEnd = recursivePlanTimeline(item.beforeWait, fork_origin_node, (fork_origin_node.y + y_btm) / 2, nodes, graph_depth + 1, recursion_depth + 1);
            if (item.parentWaited) {
                beforeWaitEnd.wait_node = true;
                beforeWaitEnd.wait_idx = item.waitExecutionIndex;
            }

            // Process child branch
            let childBranchStartNode = new TimelineNode(fork_origin_node.x, (fork_origin_node.y + y_btm) / 2);
            fork_origin_node.addChild(childBranchStartNode);
            nodes.push(childBranchStartNode);
            childBranchStartNode.name += "child ";
            childBranchStartNode.child_node = true;
            let childBranchEnd = recursivePlanTimeline(item.child, childBranchStartNode, y_btm, nodes, graph_depth + 1, recursion_depth + 1);
            let child_attach_point;
            if (childBranchEnd.fork_node || childBranchEnd.wait_node || childBranchEnd.child_node || childBranchEnd.printsAfter.length !== 0) {
                if (item.childExited) {
                    child_attach_point = new TimelineNode(childBranchEnd.x + 1, childBranchEnd.y);
                    childBranchEnd.addChild(child_attach_point);
                    nodes.push(child_attach_point);
                }
            } else {
                child_attach_point = childBranchEnd;
            }

            // Only merge child back to parent if child has exited
            if (item.childExited) {
                child_attach_point.exit_node = true;
                child_attach_point.exit_idx = item.exitExecutionIndex;

                // Align and connect child and wait ends
                if (child_attach_point.x > beforeWaitEnd.x) {
                    beforeWaitEnd.x = child_attach_point.x;
                } else {
                    child_attach_point.x = beforeWaitEnd.x;
                }
                child_attach_point.addChild(beforeWaitEnd);

                if (graph_depth === 0) {
                    beforeWaitEnd.solid_link = true;
                }
            }

            // Process afterWait branch
            if (item.childExited) {
                let afterWaitEnd;
                if (item.afterWait.length === 0) {
                    afterWaitEnd = beforeWaitEnd;
                } else {
                    afterWaitEnd = recursivePlanTimeline(item.afterWait, beforeWaitEnd, y_btm, nodes, graph_depth, recursion_depth + 1);
                }
                afterWaitEnd.name += "afterWaitEnd ";
                current_attach_point_node = afterWaitEnd;
            } else {
                current_attach_point_node = beforeWaitEnd;
            }
        }
    }

    return current_attach_point_node;
}

/**
 * Creates a complete timeline graph from process execution constraints.
 * This is the main entry point for timeline generation that sets up the initial
 * structure and delegates the complex recursive planning to recursivePlanTimeline.
 * 
 * The function establishes the timeline's foundation by:
 * 1. Creating a starting node at the origin (time=0, process=0)
 * 2. Creating the first execution node where actual program logic begins
 * 3. Connecting them to represent program startup
 * 4. Invoking the recursive planner to build the rest of the timeline
 * 
 * Timeline structure:
 * - X-axis represents time progression (left to right)
 * - Y-axis represents different processes/threads (top to bottom)
 * - Nodes represent execution states (fork, wait, exit, print)
 * - Edges represent execution flow and synchronization
 * 
 * @param {Array} constraints - Array of PrintItem and ForkItem objects representing
 *                             the complete execution sequence to visualize
 * @returns {Array<TimelineNode>} Complete array of timeline nodes ready for visualization.
 *                               Includes all nodes created during recursive planning.
 */
function planTimeline(constraints) {
    // Create the root node representing program start (time=0, main process)
    let start_node = new TimelineNode(0, 0); // Initial node
    start_node.solid_link = true; // Main execution path should be solid
    
    // Create the first actual execution node where program logic begins
    let first_node = new TimelineNode(1, 0);
    start_node.addChild(first_node); // Connect startup to first execution
    
    // Initialize the nodes array with our foundation nodes
    let nodes = [start_node, first_node];
    
    // Recursively build the complete timeline from the constraints
    // - first_node: starting point for execution
    // - 1: bottom Y boundary for child process placement
    // - nodes: accumulator array for all created nodes
    // - 0: initial graph depth (main process level)
    let merge_node = recursivePlanTimeline(constraints, first_node, 1, nodes, 0);
    
    // Return all nodes created during timeline planning
    return nodes;
}

/**
 * Normalizes and scales timeline node positions to fit within specified boundaries.
 * This function transforms the logical coordinate system used during timeline planning
 * into the physical coordinate system needed for SVG rendering.
 * 
 * The algorithm works in three phases:
 * 1. DISCOVERY: Find all unique X and Y coordinates used by timeline nodes
 * 2. MAPPING: Create evenly-spaced physical coordinates within the target boundaries
 * 3. APPLICATION: Transform all node coordinates using the computed mappings
 * 
 * Key benefits:
 * - Ensures timeline fits perfectly within the visualization area
 * - Maintains relative positioning and relationships between nodes
 * - Provides consistent spacing regardless of the complexity of the timeline
 * - Handles edge cases like single points or empty timelines gracefully
 * 
 * Coordinate system:
 * - X-axis: Time progression (left = earlier, right = later)
 * - Y-axis: Process hierarchy (top = parent, bottom = child processes)
 * 
 * @param {Array<TimelineNode>} nodes - All timeline nodes to be repositioned
 * @param {number} x_left - Left boundary of the target visualization area
 * @param {number} x_right - Right boundary of the target visualization area  
 * @param {number} y_top - Top boundary of the target visualization area
 * @param {number} y_btm - Bottom boundary of the target visualization area
 */
function regularizeTimelineXY(nodes, x_left, x_right, y_top, y_btm) {
    // PHASE 1: DISCOVERY - Extract all coordinate values used by timeline nodes
    let all_x = nodes.map(node => node.x); // All X coordinates (time values)
    let all_y = nodes.map(node => node.y); // All Y coordinates (process levels)
    
    // Find unique coordinate values and sort them to maintain ordering
    let unique_x = [...new Set(all_x)]; // Remove duplicates from X coordinates
    let unique_y = [...new Set(all_y)]; // Remove duplicates from Y coordinates
    unique_x.sort((a, b) => a - b); // Sort X ascending (time order)
    unique_y.sort((a, b) => a - b); // Sort Y ascending (process hierarchy)
    
    // PHASE 2: MAPPING - Calculate evenly-spaced physical coordinates
    // Compute spacing between consecutive coordinate positions
    const x_gap = unique_x.length > 1 ? (x_right - x_left) / (unique_x.length - 1) : 0;
    const y_gap = Math.min(unique_y.length > 1 ? (y_btm - y_top) / (unique_y.length - 1) : 0, 100);
    let x_offset = x_left; // Starting X position in physical space
    let y_offset = y_top;  // Starting Y position in physical space
    
    // Build coordinate transformation mappings
    // Map each logical coordinate to its corresponding physical coordinate
    let x_mapping = {}; // logical_x -> physical_x
    let y_mapping = {}; // logical_y -> physical_y
    
    // Create X-axis mapping (time dimension)
    for (let i = 0; i < unique_x.length; i++) {
        x_mapping[unique_x[i]] = x_offset + i * x_gap;
    }
    
    // Create Y-axis mapping (process dimension)  
    for (let i = 0; i < unique_y.length; i++) {
        y_mapping[unique_y[i]] = y_offset + i * y_gap;
    }
    
    // PHASE 3: APPLICATION - Transform all node coordinates using the mappings
    for (const node of nodes) {
        node.x = x_mapping[node.x]; // Transform logical X to physical X
        node.y = y_mapping[node.y]; // Transform logical Y to physical Y
    }
}

/**
 * Creates an interactive SVG timeline visualization of process execution flow.
 * This is the main rendering function that transforms abstract execution constraints
 * into a complete visual diagram showing process forking, synchronization, and output.
 * 
 * The function orchestrates the entire visualization pipeline:
 * 1. PLANNING: Convert constraints into positioned timeline nodes
 * 2. LAYOUT: Scale and position nodes within the target canvas area
 * 3. LINKS: Create connection objects representing execution flow
 * 4. RENDERING: Generate SVG elements with D3.js for interactive display
 * 
 * Visual Elements Created:
 * - Nodes: Circles representing execution states (fork, wait, exit, print)
 * - Horizontal Edges: Time progression within a process (solid/dashed based on certainty)
 * - Vertical Edges: Fork/wait relationships between parent and child processes
 * - Text Labels: Process state indicators ("fork", "wait", "exit") and print output
 * - Arrows: Direction indicators for execution flow and synchronization
 * 
 * Visualization Conventions:
 * - X-axis: Time progression (left to right)
 * - Y-axis: Process hierarchy (parent above, children below)
 * - Solid lines: Certain execution paths (main process)
 * - Dashed lines: Uncertain execution paths (child processes)
 * - Arrows: Show direction of execution flow and process relationships
 * 
 * @param {Array} constraints - Array of PrintItem and ForkItem objects representing
 *                             the complete execution sequence to visualize
 * @param {number} tl_width - Total width of the SVG canvas in pixels (default: 600)
 * @param {number} tl_height - Total height of the SVG canvas in pixels (default: 400)
 * @param {Object} margin - Spacing around the timeline visualization
 * @param {number} margin.top - Top margin in pixels (default: 20)
 * @param {number} margin.right - Right margin in pixels (default: 20)
 * @param {number} margin.bottom - Bottom margin in pixels (default: 20)
 * @param {number} margin.left - Left margin in pixels (default: 40)
 * @param {string} blockId - Unique identifier for the HTML block (currently unused but may be needed for event handling)
 * @returns {jQuery} jQuery-wrapped SVG DOM element ready for insertion into the page
 */
export function drawTimeline(
    constraints,
    tl_width = 600,
    tl_height = 400,
    margin = { top: 20, right: 20, bottom: 20, left: 40 },
    blockId
) {
    // =======================================================================
    // PHASE 1: TIMELINE PLANNING AND LAYOUT
    // =======================================================================
    
    // Build timeline nodes from execution constraints using recursive planning algorithm
    const nodes = planTimeline(constraints);
    
    // Transform logical coordinates to physical SVG coordinates within margins
    // This ensures the timeline fits perfectly in the available canvas space
    regularizeTimelineXY(
        nodes,
        margin.left,                    // Left boundary of drawing area
        tl_width - margin.right,        // Right boundary of drawing area
        margin.top,                     // Top boundary of drawing area
        tl_height - margin.bottom       // Bottom boundary of drawing area
    );

    // =======================================================================
    // PHASE 2: BUILD LINK DATA STRUCTURES
    // =======================================================================
    
    // Create link objects representing all edges in the timeline graph
    // Each link connects a source node to a target node and may carry a label
    const links = [];
    for (const src of nodes) {
        for (const tgt of src.children) {
            links.push({
                source: src,                    // Source timeline node
                target: tgt,                    // Target timeline node
                label: src.printsAfter ?? null, // Text printed on this edge (if any)
            });
        }
    }

    // =======================================================================
    // PHASE 3: SVG CANVAS SETUP
    // =======================================================================
    
    // Create the main SVG element that will contain the entire timeline
    const svg = d3
        .create("svg")
        .attr("width", tl_width)        // Set canvas width
        .attr("height", tl_height);     // Set canvas height

    // Create a group element to hold all timeline elements
    // This allows for potential transformations of the entire timeline
    const g = svg.append("g");

    // =======================================================================
    // PHASE 4: ARROW MARKER DEFINITIONS
    // =======================================================================
    
    // Generate unique IDs to avoid conflicts when multiple timelines exist on the same page
    const uniqueId = Math.random().toString(36).substr(2, 9);
    const defs = svg.append("defs"); // SVG definitions section for reusable elements

    // Define right-pointing arrow marker for horizontal edges (time progression)
    defs
        .append("marker")
        .attr("id", `arrowRight_${uniqueId}`)   // Unique identifier
        .attr("viewBox", "0 -5 10 10")          // Coordinate system for the arrow
        .attr("refX", 10)                       // X position where line connects to arrow
        .attr("refY", 0)                        // Y position where line connects to arrow
        .attr("markerWidth", 6)                 // Rendered width of arrow
        .attr("markerHeight", 6)                // Rendered height of arrow
        .attr("orient", "auto")                 // Auto-rotate arrow to match line direction
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")            // Arrow shape: triangle pointing right
        .attr("stroke", "none");                // No outline, just fill

    // Define down-pointing arrow marker for vertical edges (fork/wait relationships)
    defs
        .append("marker")
        .attr("id", `arrowDown_${uniqueId}`)    // Unique identifier
        .attr("viewBox", "-5 0 10 10")          // Coordinate system for the arrow
        .attr("refX", 0)                        // X position where line connects to arrow
        .attr("refY", 10)                       // Y position where line connects to arrow
        .attr("markerWidth", 6)                 // Rendered width of arrow
        .attr("markerHeight", 6)                // Rendered height of arrow
        .attr("orient", "auto")                 // Auto-rotate arrow to match line direction
        .append("path")
        .attr("d", "M-5,0L0,10L5,0")            // Arrow shape: triangle pointing down
        .attr("stroke", "none");                // No outline, just fill

    // =======================================================================
    // PHASE 5: EDGE RENDERING
    // =======================================================================
    
    // Create path elements for all timeline edges (execution flow connections)
    g.selectAll("path.link")
        .data(links)                            // Bind link data to path elements
        .enter()
        .append("path")
        .attr("class", "link")                  // CSS class for styling
        .attr("fill", "none")                   // Paths should not be filled
        .attr("stroke", "#333")                 // Dark gray stroke color
        .attr("stroke-width", 2)                // Line thickness
        .attr("stroke-dasharray", (d) =>
            // Apply dashed style to uncertain execution paths
            d.source.x === d.target.x ? null :     // Vertical edges are always solid
            d.source.solid_link ? null : "2,4"     // Horizontal: solid if certain, dashed if uncertain
        )
        .attr("d", (d) => {
            // Generate path data based on edge type
            if (d.source.x === d.target.x) {
                // VERTICAL EDGE: Fork/wait relationship (same time, different processes)
                return `M${d.source.x},${d.source.y} L${d.target.x},${d.target.y}`;
            } else {
                // HORIZONTAL EDGE: Time progression within same process
                // Use D3's linkHorizontal for smooth curved connections
                return d3.linkHorizontal()({
                    source: [d.source.x, d.source.y],
                    target: [d.target.x, d.target.y],
                });
            }
        })
        .attr("marker-end", (d) =>
            // Add arrows only to vertical edges (process relationships)
            // Horizontal edges show time flow implicitly through layout
            d.source.x === d.target.x ? `url(#arrowRight_${uniqueId})` : null
        );

    // =======================================================================
    // PHASE 6: PRINT OUTPUT LABELS
    // =======================================================================
    
    // Add text labels showing print output on horizontal edges
    g.selectAll("text.linkLabel")
        .data(links.filter((l) => l.source.x !== l.target.x && l.label)) // Only horizontal edges with labels
        .enter()
        .append("text")
        .attr("class", "linkLabel")             // CSS class for styling
        .attr("text-anchor", "middle")          // Center text horizontally
        .attr("dy", "-0.35em")                  // Offset text above the edge
        .attr("x", (d) => (d.source.x + d.target.x) / 2)    // Position at midpoint of edge
        .attr("y", (d) => (d.source.y + d.target.y) / 2)    // Position at midpoint of edge
        .text((d) => d.label);                  // Display the print output text

    // =======================================================================
    // PHASE 7: NODE STATE LABELS
    // =======================================================================
    
    // Add text labels identifying the type of each timeline node
    g.selectAll("text.nodeLabel")
        .data(nodes)                            // Bind node data to text elements
        .enter()
        .append("text")
        .attr("class", "nodeLabel")             // CSS class for styling
        .attr("text-anchor", "middle")          // Center text horizontally on node
        .attr("dy", "0.35em")                   // Vertically center text on node
        .attr("x", (d) => d.x)                  // Position at node X coordinate
        .attr("y", (d) => d.y)                  // Position at node Y coordinate
        .text((d) => {
            // Determine label text based on node type
            if (d.fork_node) return "fork";     // Process splitting point
            if (d.exit_node) return "exit";     // Process termination point
            if (d.wait_node) return "wait";     // Parent waiting for child
            return "";                          // No label for regular execution points
        });

    // =======================================================================
    // PHASE 8: RETURN COMPLETED VISUALIZATION
    // =======================================================================
    
    // Convert D3 SVG element to jQuery object for compatibility with existing code
    // This allows the timeline to be easily inserted into the DOM
    return $(svg.node());
}