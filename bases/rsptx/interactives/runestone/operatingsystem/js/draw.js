/* This function draws process hierarchy tree with D3 and Graphviz. */ 

// import * as d3 from "d3";
import { csvParse, stratify, select } from "d3";
import { graphviz } from "d3-graphviz";
import "@hpcc-js/wasm";


function getHierarchyAttr(links, labels) {

    var nodeDef = "";
    var edgeDef = "";

    // console.log("Labels: " + labels);
    // console.log("Links: " + links);
    for (let i = 0; i < labels.length; i++) {
        let [ID, val] = labels[i].split(':');
        // console.log("Val: ", val);
        let prints = val.trim().slice(1,-1).split(',').join('');
        // console.log("Prints: " + prints);
        // nodeDef.push(`${ID} [label="${prints}"];`);
        nodeDef += (`${ID} [label="${prints}"];`);
    }

    links.forEach(e => {
        const c = e.child;
        const p = e.parent;

        if (p) { edgeDef += (`${p} -> ${c};`); }
    });

    // console.log("Node def: " + nodeDef);
    // console.log("Edge def: " + edgeDef);
    return [nodeDef, edgeDef];
}

export function drawHierarchy(linksCsv, labels) {

    const links = csvParse(linksCsv);
    console.log(links);

    var digraphString = (
        'digraph {' + 
        'bgcolor = "transparent";' + 
        'node [shape=circle, color=black, style=filled, fillcolor=lightblue, fixedsize=true, width=0.7];' +
        'edge [color=black, penwidth=2.0];'
    );

    const [nodeDef, edgeDef] = getHierarchyAttr(links, labels);

    digraphString += nodeDef;
    digraphString += edgeDef;

    digraphString += "}";

    console.log(digraphString);

    select("#hierarchy_graph").graphviz()
        .renderDot(digraphString);
}

export function drawTimeline(linksCsv) {

    const links = csvParse(linksCsv);
    console.log(links);

    // select("#timeline_graph").graphviz()
    //     .renderDot(digraphString);
}