// Timeline graph drawing utilities
// Uses d3.js to render process timeline visualization
// Assumes simple forking structure (no forking before wait)
import "../css/timeline.css";
import "./build.js";
import {PrintItem, ForkItem} from "./build.js"
import * as d3 from "d3";

class TimelineNode {
    constructor(x, y, printsAfter = "", fork_node=false, exit_node=false, wait_node=false, solid_link = false) {
        this.x = x;
        this.y = y;
        this.fork_node = fork_node;
        this.fork_idx = null;
        this.exit_node = exit_node;
        this.exit_idx = null;
        this.wait_node = wait_node;
        this.wait_idx = null;
        this.printsAfter = printsAfter;
        this.print_idx = null;
        this.solid_link = solid_link;
        this.children = [];
        this.name = "";
    }

    addChild(child) {
        this.children.push(child);
    }
}

const nodeID = (node) => `${node.data.id}.${node.data.childCt}`;

function nodeSpacing(d, x_gap, y_gap, x_start, y_start) {
    let down_indent = 0; // bump timelines down
    if (!d.children || d.children.length === 0) {
        return 0;
    }
    if (nodeID(d) == "0.0") {
        d.x = x_start;
        d.y = y_start;
    }
    for (const child of d.children) {
        if (child.data.id == d.data.id) {
            child.x = d.x+x_gap;
            child.y = d.y;
            down_indent += nodeSpacing(child, x_gap, y_gap, x_start, y_start);
        }
        else {
            child.x = d.x;
            child.y = d.y + down_indent + y_gap;
            down_indent += nodeSpacing(child, x_gap, y_gap, x_start, y_start)+y_gap;
        }
    }
    return down_indent;
}

function highlightPath(node, links) {
    links.classed("active", false); // Turn off all active links
    const trace = [];
    node.ancestors().forEach(anc => {
        trace.push(nodeID(anc));
        links.filter(l => l.target === anc).classed("active", true);
    });
}

function recursivePlanTimeline(constraints, prev_node_arg, y_btm = 1, nodes = [], graph_depth = 0, recursion_depth = 0) {
    // Prevent infinite recursion
    const MAX_RECURSION_DEPTH = 100;
    if (recursion_depth > MAX_RECURSION_DEPTH) {
        console.warn("Maximum recursion depth reached in recursivePlanTimeline - preventing infinite recursion");
        let emergency_node = new TimelineNode(prev_node_arg.x + 1, prev_node_arg.y);
        emergency_node.name = "emergency_stop ";
        nodes.push(emergency_node);
        prev_node_arg.addChild(emergency_node);
        return emergency_node;
    }
    
    if (!Array.isArray(constraints) || constraints.length === 0) {
        // BASE CASE: empty sequence
        let new_tail_node_for_empty_seq = new TimelineNode(prev_node_arg.x + 1, prev_node_arg.y);
        new_tail_node_for_empty_seq.name = "tail ";
        nodes.push(new_tail_node_for_empty_seq);
        prev_node_arg.addChild(new_tail_node_for_empty_seq);
        return new_tail_node_for_empty_seq;
    }

    let current_attach_point_node = prev_node_arg;

    for (let i = 0; i < constraints.length; i++) {
        const item = constraints[i];
        if (item instanceof PrintItem) { // activity: print nodes
            if (item.printChar.length === 0) {
                continue;
            }
            current_attach_point_node.printsAfter = item.printChar;
            current_attach_point_node.print_idx = item.executionIndex;
            let new_activity_node = new TimelineNode(current_attach_point_node.x + 1, current_attach_point_node.y);
            new_activity_node.name += "activity ";
            nodes.push(new_activity_node);
            current_attach_point_node.addChild(new_activity_node);
            if (graph_depth === 0) {
                current_attach_point_node.solid_link = true;
            }
            current_attach_point_node = new_activity_node;
        } else if (item instanceof ForkItem) {
            // fork: beforeWait, child, afterWait
            let fork_origin_node;

            if (!current_attach_point_node.fork_node && !current_attach_point_node.wait_node && current_attach_point_node.printsAfter.length === 0){
                // reuse the current node as the fork point
                fork_origin_node = current_attach_point_node;
            } else {
                // create new node for the fork
                fork_origin_node = new TimelineNode(current_attach_point_node.x + 1, current_attach_point_node.y);
                nodes.push(fork_origin_node);
                current_attach_point_node.addChild(fork_origin_node);
            }
            
            fork_origin_node.fork_node = true;
            fork_origin_node.fork_idx = item.forkExecutionIndex
            fork_origin_node.name += "fork ";

            // Process beforeWait branch
            let beforeWaitEnd = recursivePlanTimeline(item.beforeWait, fork_origin_node, (fork_origin_node.y + y_btm) / 2, nodes, graph_depth + 1, recursion_depth + 1);
            beforeWaitEnd.wait_node = true;
            beforeWaitEnd.wait_idx = item.waitExecutionIndex;

            // Process child branch
            let childBranchStartNode = new TimelineNode(fork_origin_node.x, (fork_origin_node.y + y_btm) / 2);
            childBranchStartNode.name += "child ";
            nodes.push(childBranchStartNode);
            fork_origin_node.addChild(childBranchStartNode);
            let childBranchEnd = recursivePlanTimeline(item.child, childBranchStartNode, y_btm, nodes, graph_depth + 1, recursion_depth + 1);
            let child_attach_point;
            if (childBranchEnd.fork_node || childBranchEnd.wait_node || childBranchEnd.printsAfter.length !== 0) {
                child_attach_point = new TimelineNode(childBranchEnd.x + 1, childBranchEnd.y);
                childBranchEnd.addChild(child_attach_point);
                nodes.push(child_attach_point);
            } else {
                child_attach_point = childBranchEnd;
            }
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

            // Process afterWait branch
            let afterWaitEnd;
            if (item.afterWait.length === 0) {
                afterWaitEnd = beforeWaitEnd;
            } else {
                afterWaitEnd = recursivePlanTimeline(item.afterWait, beforeWaitEnd, y_btm, nodes, graph_depth, recursion_depth + 1);
            }
            afterWaitEnd.name += "afterWaitEnd ";
            current_attach_point_node = afterWaitEnd;
        }
    }

    return current_attach_point_node;
}

function planTimeline(constraints) {
    let start_node = new TimelineNode(0, 0); // Initial node
    start_node.solid_link = true;
    let first_node = new TimelineNode(1, 0);
    start_node.addChild(first_node);
    let nodes = [start_node, first_node];
    
    let merge_node = recursivePlanTimeline(constraints, first_node, 1, nodes, 0); 
    merge_node.solid_link = true;
    let lastNode = new TimelineNode(merge_node.x + 1, merge_node.y);
    nodes.push(lastNode);
    merge_node.addChild(lastNode);
    
    return nodes;
}

function regularizeTimelineXY(nodes, x_left, x_right, y_top, y_btm) {
    // Get sorted unique x and y values
    let all_x = nodes.map(node => node.x);
    let all_y = nodes.map(node => node.y);
    let unique_x = [...new Set(all_x)];
    let unique_y = [...new Set(all_y)];
    unique_x.sort((a, b) => a - b);
    unique_y.sort((a, b) => a - b);
    
    // Calculate gaps and offsets
    const x_gap = unique_x.length > 1 ? (x_right - x_left) / (unique_x.length - 1) : 0;
    const y_gap = Math.min(unique_y.length > 1 ? (y_btm - y_top) / (unique_y.length - 1) : 0, 100);
    let x_offset = x_left;
    let y_offset = y_top;
    
    // Create mappings
    let x_mapping = {};
    let y_mapping = {};
    for (let i = 0; i < unique_x.length; i++) {
        x_mapping[unique_x[i]] = x_offset + i * x_gap;
    }
    for (let i = 0; i < unique_y.length; i++) {
        y_mapping[unique_y[i]] = y_offset + i * y_gap;
    }
    
    // Apply mappings
    for (const node of nodes) {
        node.x = x_mapping[node.x];
        node.y = y_mapping[node.y];
    }
}

export function drawTimeline(
    constraints,
    tl_width = 600,
    tl_height = 400,
    margin = { top: 20, right: 20, bottom: 20, left: 40 },
    blockId
) {
    // Build timeline nodes and map positions
    const nodes = planTimeline(constraints);
    regularizeTimelineXY(
        nodes,
        margin.left,
        tl_width - margin.right,
        margin.top,
        tl_height - margin.bottom
    );

    // Build link objects
    const links = [];
    for (const src of nodes) {
        for (const tgt of src.children) {
            links.push({
                source: src,
                target: tgt,
                label: src.printsAfter ?? null,
            });
        }
    }

    // Setup SVG canvas
    const svg = d3
        .create("svg")
        .attr("width", tl_width)
        .attr("height", tl_height);

    const g = svg.append("g");

    // Arrow definitions with unique IDs
    const uniqueId = Math.random().toString(36).substr(2, 9);
    const defs = svg.append("defs");

    // Right arrow
    defs
        .append("marker")
        .attr("id", `arrowRight_${uniqueId}`)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 10)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("stroke", "none");

    // Down arrow
    defs
        .append("marker")
        .attr("id", `arrowDown_${uniqueId}`)
        .attr("viewBox", "-5 0 10 10")
        .attr("refX", 0)
        .attr("refY", 10)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M-5,0L0,10L5,0")
        .attr("stroke", "none");

    // Draw edges
    g.selectAll("path.link")
        .data(links)
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("fill", "none")
        .attr("stroke", "#333")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", (d) =>
            d.source.x === d.target.x ? null : d.source.solid_link ? null : "2,4"
        )
        .attr("d", (d) => {
            // vertical edge
            if (d.source.x === d.target.x) {
                return `M${d.source.x},${d.source.y} L${d.target.x},${d.target.y}`;
            }
            // horizontal edge
            return d3.linkHorizontal()({
                source: [d.source.x, d.source.y],
                target: [d.target.x, d.target.y],
            });
        })
        .attr("marker-end", (d) =>
            d.source.x === d.target.x ? `url(#arrowRight_${uniqueId})` : null
        );

    // Add print labels on horizontal links
    g.selectAll("text.linkLabel")
        .data(links.filter((l) => l.source.x !== l.target.x && l.label))
        .enter()
        .append("text")
        .attr("class", (d) => {
            let classes = "linkLabel";
            if (d.source.print_idx === blockId) {
                classes += " glow-yellow";
            }
            return classes;
        })
        .attr("text-anchor", "middle")
        .attr("dy", "-0.35em")
        .attr("x", (d) => (d.source.x + d.target.x) / 2)
        .attr("y", (d) => (d.source.y + d.target.y) / 2)
        .text((d) => d.label);

    // Add node labels
    g.selectAll("text.nodeLabel")
        .data(nodes)
        .enter()
        .append("text")
        .attr("class", (d) => {
            let classes = "nodeLabel";
            if ((d.fork_node && d.fork_idx === blockId) ||
                (d.exit_node && d.exit_idx === blockId) ||
                (d.wait_node && d.wait_idx === blockId)) {
                classes += " glow-yellow";
            }
            return classes;
        })
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("x", (d) => d.x)
        .attr("y", (d) => d.y)
        .text((d) => {
            if (d.fork_node) return "fork";
            if (d.exit_node) return "exit";
            if (d.wait_node) return "wait";
            return "";
        });

    return $(svg.node());
}