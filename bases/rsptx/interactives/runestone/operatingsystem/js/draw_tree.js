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

    var nodeDef = new Set();
    var edgeDef = [];

    var digraphString = (
        'digraph {' + 
        'bgcolor = "transparent";' + 
        'node [shape=circle, color=black, style=filled, fillcolor=lightblue];' +
        'edge [color=black, penwidth=2.0];'
    );

    var nodeDef = new Set();
    var edgeDef = [];
    
    for (var i = 0; i < links.length; i++) {
        const child = links[i].child.split('@');
    const parent = links[i].parent.split('@');

    const cId = child[0];
    let cP = (child[1] === undefined || child[1] === "null") ? " " : child[1];
    const pId = parent[0];
    let pP = (parent[1] === undefined || parent[1] === "null") ? " " : parent[1];

    console.log(cId + " " + cP + "==" + pId + " " + pP);

       	if (pId) {
        	nodeDef.add(`${pId} [label="${pP}"];`);
        }
        
        if (cId) {
        	nodeDef.add(`${cId} [label="${cP}"];`);
        }

        if (pId) {
            edgeDef.push(`${pId} -> ${cId};`);
        }
    }
    
	console.log(nodeDef);
    
    for (let value of nodeDef) {
      digraphString += value;
    }

    for (var i = 0; i < edgeDef.length; i++) {
        digraphString += edgeDef[i];
    }

    digraphString += "}";

    console.log(digraphString);

    select("#graph").graphviz()
        .renderDot(digraphString);
}
