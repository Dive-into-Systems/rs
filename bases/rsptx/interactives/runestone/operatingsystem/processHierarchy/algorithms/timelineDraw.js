import "../css/timeline.css";
import "./build.js";
import * as d3 from "d3";
// import { select, hierarchy, tree, linkHorizontal } from "d3";

class TimelineNode {
    constructor(x, y, printsAfter = "", fork_node=false, exit_node=false, wait_node=false, solid_link = false) {
        this.x = x;
        this.y = y;
        this.fork_node = fork_node;
        this.exit_node = exit_node;
        this.wait_node = wait_node;
        this.printsAfter = printsAfter;
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
    // console.log(trace);
}

function recursivePlanTimeline(sequenceList, prev_node_arg, y_btm = 1, nodes = [], graph_depth = 0, recursion_depth = 0) {
    // Add protection against infinite recursion
    const MAX_RECURSION_DEPTH = 100;
    if (recursion_depth > MAX_RECURSION_DEPTH) {
        console.warn("Maximum recursion depth reached in recursivePlanTimeline - preventing infinite recursion");
        // Return a simple terminal node to prevent crashes
        let emergency_node = new TimelineNode(prev_node_arg.x + 1, prev_node_arg.y);
        emergency_node.name = "emergency_stop ";
        nodes.push(emergency_node);
        prev_node_arg.addChild(emergency_node);
        return emergency_node;
    }
    
    // prev_node_arg is the node to which the current sequence (or its first item) will be attached.

    if (!Array.isArray(sequenceList) || sequenceList.length === 0) {
        // BASE CASE
        // If the sequence is empty, consistently return a new node that is one step after prev_node_arg.
        let new_tail_node_for_empty_seq = new TimelineNode(prev_node_arg.x + 1, prev_node_arg.y);
        new_tail_node_for_empty_seq.name = "tail ";
        nodes.push(new_tail_node_for_empty_seq);
        prev_node_arg.addChild(new_tail_node_for_empty_seq);
        return new_tail_node_for_empty_seq;
    }

    // This variable tracks the node to which the *next* item in the sequenceList
    let current_attach_point_node = prev_node_arg;

    for (let i = 0; i < sequenceList.length; i++) {
        const item = sequenceList[i];
        // console.log(item);
        if (typeof item === 'string') { // activity: print nodes
            if (item.length === 0) {
                continue;
            }
            current_attach_point_node.printsAfter = item;
            let new_activity_node = new TimelineNode(current_attach_point_node.x + 1, current_attach_point_node.y);
            new_activity_node.name += "activity ";
            nodes.push(new_activity_node);
            current_attach_point_node.addChild(new_activity_node);
            if (graph_depth === 0) {
                current_attach_point_node.solid_link = true;
            }
            current_attach_point_node = new_activity_node;
        } else if (typeof item === 'object') {
            // fork: beforeWait, child, afterWait
            let fork_origin_node;

            // console.log(current_attach_point_node);
            if (!current_attach_point_node.fork_node && !current_attach_point_node.wait_node && current_attach_point_node.printsAfter.length === 0){
                // reuse the current node as the fork point
                // console.log("merge fork");
                fork_origin_node = current_attach_point_node;
            } else {
                // create a new, separate node for the fork.
                fork_origin_node = new TimelineNode(current_attach_point_node.x + 1, current_attach_point_node.y);
                nodes.push(fork_origin_node);
                current_attach_point_node.addChild(fork_origin_node);
            }
            
            fork_origin_node.fork_node = true;
            fork_origin_node.name += "fork ";

            // Process beforeWait branch.
            let beforeWaitEnd = recursivePlanTimeline(item.beforeWait, fork_origin_node, (fork_origin_node.y + y_btm) / 2, nodes, graph_depth + 1, recursion_depth + 1);
            beforeWaitEnd.wait_node = true;

            // Process child branch.
            // Child branch starts "parallel" to beforeWait, originating from the same fork_origin_node but on a different y.
            let childBranchStartNode = new TimelineNode(fork_origin_node.x, (fork_origin_node.y + y_btm) / 2);
            childBranchStartNode.name += "child ";
            // childBranchStartNode.fork_node = true;
            nodes.push(childBranchStartNode);
            fork_origin_node.addChild(childBranchStartNode);
            // childEnd will be a "fresh" tail node from its recursive call.
            let childBranchEnd = recursivePlanTimeline(item.child, childBranchStartNode, y_btm, nodes, graph_depth + 1, recursion_depth + 1);
            // childBranchEnd.wait_node = true;
            childBranchEnd.exit_node = true;

            // Align beforeWaitEnd with childBranchEnd's and connect them
            if (childBranchEnd.x > beforeWaitEnd.x) {
                beforeWaitEnd.x = childBranchEnd.x;
            } else {
                childBranchEnd.x = beforeWaitEnd.x;
            }
            childBranchEnd.addChild(beforeWaitEnd);

            // Process afterWait branch
            let afterWaitEnd;
            if (item.afterWait.length === 0) {
                afterWaitEnd = beforeWaitEnd;
            } else {
                afterWaitEnd = recursivePlanTimeline(item.afterWait, beforeWaitEnd, y_btm, nodes, graph_depth, recursion_depth + 1);
            }
            afterWaitEnd.name += "afterWaitEnd ";
            current_attach_point_node = afterWaitEnd; // This becomes attach point for next iteration or final tail
        }
    }

    // After the loop, current_attach_point_node is the last node derived from processing sequenceList items.
    // Consistent with the overall function design (and original non-empty case),
    // add one final "tail" node and return it.
    // let final_overall_tail_node = new TimelineNode(current_attach_point_node.x + 1, current_attach_point_node.y);
    // if (!nodes.includes(final_overall_tail_node)) {
    //     nodes.push(final_overall_tail_node);
    // }
    // current_attach_point_node.addChild(final_overall_tail_node);
    return current_attach_point_node;
}

function planTimeline(sequenceList) {
    let start_node = new TimelineNode(0, 0); // Initial node
    start_node.solid_link = true;
    let first_node = new TimelineNode(1, 0);
    start_node.addChild(first_node);
    let nodes = [start_node, first_node]; // Add start_node to the list of all nodes
    
    // Call recursivePlanTimeline. The returned node is the final tail of the entire sequence.
    // The start_node itself is the beginning, and recursivePlanTimeline attaches the sequence to it.
    let merge_node = recursivePlanTimeline(sequenceList, first_node, 1, nodes, 0); 
    merge_node.solid_link = true;
    let lastNode = new TimelineNode(merge_node.x + 1, merge_node.y);
    nodes.push(lastNode);
    merge_node.addChild(lastNode);
    
    // For debugging:
    // console.log("Generated Nodes:");
    // nodes.forEach(node => {
    //     console.log(`Node at (${node.x}, ${node.y}), Children: ${node.children.length}, Label: ${node.printsAfter}`);
    // });
    return nodes;
}

function regularizeTimelineXY(nodes, x_left, x_right, y_top, y_btm) {
    // find sorted unique x and y values
    let all_x = nodes.map(node => node.x);
    let all_y = nodes.map(node => node.y);
    let unique_x = [...new Set(all_x)];
    let unique_y = [...new Set(all_y)];
    unique_x.sort((a, b) => a - b);
    unique_y.sort((a, b) => a - b);
    // find the x and y gap and offset
    const x_gap =
        unique_x.length > 1 ? (x_right - x_left) / (unique_x.length - 1) : 0;
    console.log("x_gap", x_gap);
    const y_gap =
        Math.min(unique_y.length > 1 ? (y_btm - y_top) / (unique_y.length - 1) : 0, 100);
    let x_offset = x_left;
    let y_offset = y_top;
    // create x and y mapping
    let x_mapping = {};
    let y_mapping = {};
    for (let i = 0; i < unique_x.length; i++) {
        x_mapping[unique_x[i]] = x_offset + i * x_gap;
    }
    for (let i = 0; i < unique_y.length; i++) {
        y_mapping[unique_y[i]] = y_offset + i * y_gap;
    }
    // regularize the x and y
    for (const node of nodes) {
        node.x = x_mapping[node.x];
        node.y = y_mapping[node.y];
        console.log(node);
    }
}

export function drawTimeline(
    sequenceList,
    tl_width = 600,
    tl_height = 400,
    margin = { top: 20, right: 20, bottom: 20, left: 40 }
) {
    /* ------------------------------------------------------------------
     * 1. Build the timeline nodes and map their x/y positions to canvas
     * ------------------------------------------------------------------ */
    const nodes = planTimeline(sequenceList);
    regularizeTimelineXY(
        nodes,
        margin.left,
        tl_width - margin.right,
        margin.top,
        tl_height - margin.bottom
    );

    /* ------------------------------------------------------------------
     * 2. Build an array of link objects  { source, target, label }
     *    – `label` is the optional "printsAfter" string stored on source
     * ------------------------------------------------------------------ */
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

    /* ------------------------------------------------------------------
     * 3. Set‑up the SVG canvas
     * ------------------------------------------------------------------ */
    const svg = d3
        .create("svg")
        .attr("width", tl_width)
        .attr("height", tl_height);

    const g = svg.append("g"); // no pan / zoom yet, so no transform

    /* ------------------------------------------------------------------
     * 4. Arrow‑head definitions with unique IDs to prevent conflicts
     *    – arrowRight  ➔ for horizontal edges
     *    – arrowDown   ↓ for vertical edges
     * ------------------------------------------------------------------ */
    // Generate unique ID suffix to prevent conflicts with multiple timelines
    const uniqueId = Math.random().toString(36).substr(2, 9);
    const defs = svg.append("defs");

    // ➔ (right‑pointing)
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

    // ↓ (down‑pointing)
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

    /* ------------------------------------------------------------------
     * 5. Draw the edges only (no explicit nodes)
     *    – Vertical (same x)  : solid, arrowDown
     *    – Horizontal (right) : dashed & labelled
     * ------------------------------------------------------------------ */
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
            // horizontal rightward edge
            return d3.linkHorizontal()({
                source: [d.source.x, d.source.y],
                target: [d.target.x, d.target.y],
            });
        })
        .attr("marker-end", (d) =>
            d.source.x === d.target.x ? `url(#arrowRight_${uniqueId})` : null
        );

    /* ------------------------------------------------------------------
     * 6. Add "print after" labels on horizontal links that have a label
     * ------------------------------------------------------------------ */
    g.selectAll("text.linkLabel")
        .data(links.filter((l) => l.source.x !== l.target.x && l.label))
        .enter()
        .append("text")
        .attr("class", "linkLabel")
        .attr("text-anchor", "middle")
        .attr("dy", "-0.35em")
        .attr("x", (d) => (d.source.x + d.target.x) / 2)
        .attr("y", (d) => (d.source.y + d.target.y) / 2)
        .text((d) => d.label);

    /* ------------------------------------------------------------------
     * 7. Add node labels for fork, exit, and wait nodes
     * ------------------------------------------------------------------ */
    g.selectAll("text.nodeLabel")
        .data(nodes)
        .enter()
        .append("text")
        .attr("class", "nodeLabel")
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

    /* ------------------------------------------------------------------
     * 8. Return a jQuery‑wrapped SVG node (keeps caller API unchanged)
     * ------------------------------------------------------------------ */
    return $(svg.node());
}

// export function drawTimeline(tree, tl_width, tl_height, margin) {
//     console.log(tree)
//     const data = tree.serialize();
//     const width = tl_width - margin.right - margin.left;
//     const height = tl_height - margin.top - margin.bottom;
//     const x_gap = (width) / (tree.timelineLen()+1);
//     const y_gap = (height) / (tree.timelineCt());
    
//     let timelineSvg = d3.create("svg");
//     timelineSvg.attr("width", tl_width)
//                .attr("height", tl_height)
//                .append("g")
//                .attr("transform", `translate(${margin.left},${margin.top})`);

//     const root = d3.hierarchy(data);
//     const treeLayout = d3.tree().size([height, width]);
//     treeLayout(root);
//     nodeSpacing(root, x_gap, y_gap, margin.left, margin.top);

//     let locked = null;

//     const links = timelineSvg.selectAll(".link-group")
//         .data(root.links())
//         .enter()
//     .append("g")
//         .attr("class", "link-group")
//         .on("mouseover", function(event, d) {
//             event.stopPropagation();
//             if (!locked) {
//                 highlightPath(d.target, links);
//             }
//         })
//         .on("mouseout", function(d) {
//             if (!locked) {
//                 links.classed("active", false);
//             }
//         })
//         .on("click", function(event, d) {
//             event.stopPropagation();
//             if (locked !== d.target) {
//                 locked = d.target;
//                 highlightPath(d.target, links);
//             } else {
//                 locked = null;
//             }
//         });

    
//     links.append("path")
//         .attr("class", "link-hitbox")
//         .attr("d", function(d) {
//             return d3.linkHorizontal()({
//                 source: [d.source.x, d.source.y],
//                 target: [d.target.x, d.target.y]
//             });
//         });
    


//     links.append("path")
//         .attr("class", d => "link " + ((d.source.data.id === d.target.data.id) ? "concurrent" : "sequential"))
//         .attr("d", function(d) {
//             // Calculate the total distance and the cropped segments
//             const dx = d.target.x - d.source.x;
//             const dy = d.target.y - d.source.y;
//             const length = Math.sqrt(dx * dx + dy * dy);
//             const scale = (length - 10) / length; // total length minus 10 pixels
    
//             const startX = d.source.x + (dx * 5 / length);
//             const startY = d.source.y + (dy * 5 / length);
//             const endX = d.source.x + (dx * scale);
//             const endY = d.source.y + (dy * scale);
    
//             return d3.linkHorizontal()({
//                 source: [startX, startY],
//                 target: [endX, endY]
//             });
//         })
//         .attr('marker-end', (d, i) => 'url(#arrow' + i + ')');
    
//     const ARROW_SIZE = 6;
//     links.each(function(d, i) {
//         d3.select(this).append('marker')
//             .attr('id', 'arrow' + i)  // Unique ID for each marker
//             .attr('viewBox', [-ARROW_SIZE, -ARROW_SIZE, 3*ARROW_SIZE, 3*ARROW_SIZE])
//             .attr('refX', 0)
//             .attr('refY', 0)
//             .attr('markerWidth', ARROW_SIZE)
//             .attr('markerHeight', ARROW_SIZE)
//             .attr('orient', 'auto-start-reverse')
//         .append('path')
//             .attr("d", d3.symbol().type(d3.symbolTriangle).size(ARROW_SIZE))
//             .attr("transform", "rotate(90)")
//         }
//     )
    
//     links.append("text")
//         .attr("x", d => (d.source.x + d.target.x) / 2)
//         .attr("y", d => (d.source.y + d.target.y) / 2)
//         .attr("dy", "-0.35em")
//         .text(d => (d.target.data.childCt == 0)?"":d.source.data.value);
//         // .text(function(d) { return (d.source.data.id == d.target.data.id)?"":(d.source.x+"|"+d.source.y+":")+d.source.data.value; });

//     const nodes = timelineSvg.selectAll('.node')
//         .data(root.descendants())
//         .enter()
//         .append('g')
//         .attr('class', 'node')
//         .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
        
//     nodes.append('text')
//         .attr("dy", "-.4em")
//         .attr("x" , ".4em")
//         .style("text-anchor", "start")
//         // .text(function(d) { return nodeID(d)+":"+(d.x+"|"+d.y+":"+d.data.value )});
//         .text(function(d) { return (d.children && d.children[0].data.id == d.data.id)?"":d.data.value; });

//     nodes.append('circle')
//         .attr('r', 15)
//         .attr('fill', 'transparent')
//         .attr('pointer-events', 'all')
//         .on("mouseover", function(event, d) {
//             if (!locked) {
//                 highlightPath(d, links);
//             }
//         })
//         .on("mouseout", function(d) {
//             if (!locked) {
//                 links.classed("active", false);
//             }
//         })
//         .on("click", function(event, d) {
//             event.stopPropagation();
//             if (locked !== d) {
//                 locked = d;
//                 highlightPath(d, links);
//             } else {
//                 locked = null;
//             }
//         });



//     return $(timelineSvg.node());
// }