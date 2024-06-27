/* This function draws process hierarchy tree with D3 and Graphviz. */ 

// import * as d3 from "d3";
import { csvParse, stratify, select } from "d3";
import { graphviz } from "d3-graphviz";
import "@hpcc-js/wasm";

export function drawHTree(linksCsv) {

    const links = csvParse(linksCsv);
    console.log(links);

    const childColumn = links.columns[0];
    const parentColumn = links.columns[1];

    const tree = stratify()
        .id(d => d[childColumn])
        .parentId(d => d[parentColumn]);

    const root = tree(links);
    console.log(root.data);

    var digraphString = 'digraph {';
    digraphString += 'node [shape=circle, color=black, style=filled, fillcolor=lightblue];';
    digraphString += 'edge [color=black, penwidth=2.0];';

    for (var i = 0; i < links.length; i++) {
        var c = links[i][childColumn];
        var p = links[i][parentColumn];
        if (p) { digraphString += `${p} -> ${c};` }
    }
    digraphString += "}";

    console.log(digraphString);

    select("#graph").graphviz()
        .renderDot(digraphString);
}
