import "../css/timeline.css";
import "./build.js";
import * as d3 from "d3";
// import { select, hierarchy, tree, linkHorizontal } from "d3";


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


export function drawTimeline(tree, tl_width, tl_height, margin) {
    console.log(tree)
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
    nodeSpacing(root, x_gap, y_gap, margin.left, margin.top);

    let locked = null;

    const links = timelineSvg.selectAll(".link-group")
        .data(root.links())
        .enter()
    .append("g")
        .attr("class", "link-group")
        .on("mouseover", function(event, d) {
            event.stopPropagation();
            if (!locked) {
                highlightPath(d.target, links);
            }
        })
        .on("mouseout", function(d) {
            if (!locked) {
                links.classed("active", false);
            }
        })
        .on("click", function(event, d) {
            event.stopPropagation();
            if (locked !== d.target) {
                locked = d.target;
                highlightPath(d.target, links);
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

    const nodes = timelineSvg.selectAll('.node')
        .data(root.descendants())
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
        
    nodes.append('text')
        .attr("dy", "-.4em")
        .attr("x" , ".4em")
        .style("text-anchor", "start")
        // .text(function(d) { return nodeID(d)+":"+(d.x+"|"+d.y+":"+d.data.value )});
        .text(function(d) { return (d.children && d.children[0].data.id == d.data.id)?"":d.data.value; });

    nodes.append('circle')
        .attr('r', 15)
        .attr('fill', 'transparent')
        .attr('pointer-events', 'all')
        .on("mouseover", function(event, d) {
            if (!locked) {
                highlightPath(d, links);
            }
        })
        .on("mouseout", function(d) {
            if (!locked) {
                links.classed("active", false);
            }
        })
        .on("click", function(event, d) {
            event.stopPropagation();
            if (locked !== d) {
                locked = d;
                highlightPath(d, links);
            } else {
                locked = null;
            }
        });



    return $(timelineSvg.node());
}