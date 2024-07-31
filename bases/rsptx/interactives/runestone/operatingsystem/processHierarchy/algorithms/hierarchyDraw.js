// import * as d3 from "d3";
import { csvParse, stratify, select } from "d3";
import {EXIT_CHAR} from "./build.js";
import { graphviz } from "d3-graphviz";
import "@hpcc-js/wasm";

function getHierarchyAttr(links, labels) {
    var nodeDef = "";
    var edgeDef = "";

    let parsedLabels = labels.map(label => {
        let [key, value] = label.split(":");
        return {
            key: parseInt(key.trim()),
            value: value.trim()
        };
    });
    
    parsedLabels.sort((a, b) => a.key - b.key);

    let sortedLabels = parsedLabels.map(label => `${label.key}: ${label.value}`);

    const groupedByParent = links.reduce((acc, obj) => {
        if (!acc[obj.parent]) {
            acc[obj.parent] = [];
        }
        acc[obj.parent].push(obj);
        return acc;
    }, {});
    
    for (let parent in groupedByParent) {
        groupedByParent[parent].sort((a, b) => parseInt(a.child) - parseInt(b.child));
    }
    
    let sortedArray = [];
    for (let parent in groupedByParent) {
        sortedArray = [...sortedArray, ...groupedByParent[parent]];
    }

    sortedLabels.forEach(label => {
        let [ID, val] = label.split(':');
        let prints = val.trim().slice(1,-1).split(',').join('');
        let color = prints.includes(EXIT_CHAR) ? '#fba69d' : '#c6d9f1'; // Change color if 'X' is present
        prints = prints.replace(new RegExp(EXIT_CHAR, 'g'), '');
        nodeDef += (`${ID} [label="${prints}", fillcolor="${color}"];`);
    });

    sortedArray.forEach(e => {
        const c = e.child;
        const p = e.parent;

        if (p) { edgeDef += (`${p} -> ${c};`); }
    });

    return [nodeDef, edgeDef];
}

export function drawHierarchy(linksCsv, labels) {
    const links = csvParse(linksCsv);

    var digraphString = (
        'digraph {' + 
        'bgcolor = "transparent";' + 
        'node [shape=circle, color="#5986ba", style=filled, fixedsize=true, width=1];' +
        'edge [color=black, penwidth=2.0];'
    );

    const [nodeDef, edgeDef] = getHierarchyAttr(links, labels);

    digraphString += nodeDef;
    digraphString += edgeDef;

    digraphString += "}";

    select("#hierarchy_graph").graphviz()
        .renderDot(digraphString);
}
