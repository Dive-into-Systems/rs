import "../css/timeline.css";
import "./build.js";
import * as d3 from "d3";
// import { select, hierarchy, tree, linkHorizontal } from "d3";


const nodeID = (node) => `${node.data.id}.${node.data.childCt}`;
function nodeSpacing(d, x_gap, y_gap, x_start, y_start, maxWidth) {
    let down_indent = 0; // bump timelines down
    if (!d.children || d.children.length === 0) {
        return 0;
    }
    if (nodeID(d) == "0.0") {
        d.x = x_start;
        d.y = y_start;
    }
    for (const child of d.children) {
        if (child.x == 0 && child.y == 0) {
            if (child.data.id == d.data.id) {
                child.x = (child.data.childCt==-1)?maxWidth:(d.x+x_gap);
                child.y = d.y;
                down_indent += nodeSpacing(child, x_gap, y_gap, x_start, y_start, maxWidth);
            }
            else {
                child.x = d.x;
                child.y = d.y + down_indent + y_gap;
                down_indent += nodeSpacing(child, x_gap, y_gap, x_start, y_start, maxWidth)+y_gap;
            }
        }
    }
    return down_indent;
}
function zeroSpace(d) {
    for (const child of d.children) {
        child.x = 0;
        child.y = 0;
        zeroSpace(child)
    }
}


function clearPath(links, traceArray, refreshCode, extra_trace) {
    links.classed("active", false); // Turn off all active links
    traceArray.length = 0;
    extra_trace.value  = "";
    refreshCode();
}

function highlightPath(node, links, traceArray, refreshCode, extra_trace) {
    clearPath(links, traceArray, refreshCode, extra_trace);
    // let skip = false;
    // let temp_arr = [];
    // for (const anc of node.ancestors()) {
    //     if (skip) break;
    //     links.filter(l => l.target === anc).classed("active", true);
    //     if (nodeID(anc)!=nodeID(node)) temp_arr.push(nodeID(anc)); // last node technically hasnt happened yet
    //     if (anc.data.childCt == 0) skip = true;
    // }
    // const fullTrace = true;
    // if (node.data.childCt ==0) {
    //     extra_trace.value  = nodeID(node);
    // } else {
    //     traceArray.push(...(fullTrace?temp_arr:temp_arr.slice(0,1)));
    // }
    // console.log(traceArray);
    // console.log(extra_trace);
    refreshCode();
}


export function drawTimeline(tree, tl_width, tl_height, margin, traceArray, extra_trace, refreshCode) {
    const data = tree.serialize();
    const width = tl_width - margin.right - margin.left;
    const height = tl_height - margin.top - margin.bottom;
    const x_gap = (width) / (tree.timelineLen()+1);
    const y_gap = (height) / (tree.timelineCt());
    
    let timelineSvg = d3.create("svg");
    timelineSvg.attr("width", tl_width)
               .attr("height", tl_height)
               .append("g")
               .attr("transform", `translate(${margin.left},${margin.top})`);

    const root = d3.hierarchy(data);
    const treeLayout = d3.tree().size([height, width]);
    treeLayout(root);
    zeroSpace(root);
    nodeSpacing(root, x_gap, y_gap, margin.left, margin.top, (tl_width - margin.right));

    let locked = null;

    const links = timelineSvg.selectAll(".link-group")
        .data(root.links())
        .enter()
    .append("g")
        .attr("class", "link-group")
        .on("mouseover", function(event, d) {
            event.stopPropagation();
            if (!locked) {
                highlightPath(d.target, links, traceArray, refreshCode, extra_trace);
            }
        })
        .on("mouseout", function(d) {
            if (!locked) clearPath(links, traceArray, refreshCode, extra_trace);
        })
        .on("click", function(event, d) {
            event.stopPropagation();
            if (locked !== d.target) {
                locked = d.target;
                highlightPath(d.target, links, traceArray, refreshCode, extra_trace);
            } else {
                locked = null;
            }
        });

    
    links.append("path")
        .attr("class", "link-hitbox")
        .attr("d", function(d) {
            return d3.linkHorizontal()({
                source: [d.source.x, d.source.y],
                target: [d.target.x, d.target.y]
            });
        });
    


    links.append("path")
        .attr("class", d => "link " + ((d.source.data.id === d.target.data.id) ? "concurrent" : "sequential"))
        .attr("d", function(d) {
            // Calculate the total distance and the cropped segments
            const dx = d.target.x - d.source.x;
            const dy = d.target.y - d.source.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const scale = (length - 10) / length; // total length minus 10 pixels
    
            const startX = d.source.x + (dx * 5 / length);
            const startY = d.source.y + (dy * 5 / length);
            const endX = d.source.x + (dx * scale);
            const endY = d.source.y + (dy * scale);
    
            return d3.linkHorizontal()({
                source: [startX, startY],
                target: [endX, endY]
            });
        })
        .attr('marker-end', (d, i) => 'url(#arrow' + i + ')');
    
    const ARROW_SIZE = 6;
    links.each(function(d, i) {
        d3.select(this).append('marker')
            .attr('id', 'arrow' + i)  // Unique ID for each marker
            .attr('viewBox', [-ARROW_SIZE, -ARROW_SIZE, 3*ARROW_SIZE, 3*ARROW_SIZE])
            .attr('refX', 0)
            .attr('refY', 0)
            .attr('markerWidth', ARROW_SIZE)
            .attr('markerHeight', ARROW_SIZE)
            .attr('orient', 'auto-start-reverse')
        .append('path')
            .attr("d", d3.symbol().type(d3.symbolTriangle).size(ARROW_SIZE))
            .attr("transform", "rotate(90)")
        }
    )
    
    links.append("text")
        .attr("x", d => (d.source.x + d.target.x) / 2)
        .attr("y", d => (d.source.y + d.target.y) / 2)
        .attr("dy", "-0.35em")
        .text(d => (d.target.data.childCt == 0)?"":d.source.data.value);
        // .text(function(d) { return (d.source.data.id == d.target.data.id)?"":(d.source.x+"|"+d.source.y+":")+d.source.data.value; });

    // const nodes = timelineSvg.selectAll('.node')
    //     .data(root.descendants())
    //     .enter()
    //     .append('g')
    //     .attr('class', 'node')
    //     .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

    return $(timelineSvg.node());
}