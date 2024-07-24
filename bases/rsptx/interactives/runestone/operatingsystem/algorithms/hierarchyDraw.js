/* This function draws process hierarchy tree with D3 and Graphviz. */ 

// import * as d3 from "d3";
import { csvParse, stratify, select } from "d3";
import { graphviz } from "d3-graphviz";
import "@hpcc-js/wasm";

function getHierarchyAttr(links, labels) {

    var nodeDef = "";
    var edgeDef = "";

    // console.log("Labels are", labels);

    let parsedLabels = labels.map(label => {
        let [key, value] = label.split(":");
        return {
            key: parseInt(key.trim()),
            value: value.trim()
        };
    });
    
    parsedLabels.sort((a, b) => a.key - b.key);

    let sortedLabels = parsedLabels.map(label => `${label.key}: ${label.value}`);

    // console.log("Sorted labels are", sortedLabels);
    // console.log("Links: " + links);
    for (let i = 0; i < sortedLabels.length; i++) {
        let [ID, val] = sortedLabels[i].split(':');
        // console.log("Val: ", val);
        let prints = val.trim().slice(1,-1).split(',').join('');
        // console.log("Prints: " + prints);
        // nodeDef.push(`${ID} [label="${prints}"];`);
        nodeDef += (`${ID} [label="${prints}"];`);
    }
    // console.log("Labels: " + sortedLabels);

    // console.log("Links are", links);

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
    
    // console.log("Sorted Array is", sortedArray);

    sortedArray.forEach(e => {
        const c = e.child;
        const p = e.parent;

        if (p) { edgeDef += (`${p} -> ${c};`); }
    });

    return [nodeDef, edgeDef];
}

export function drawHierarchy(linksCsv, labels) {

    const links = csvParse(linksCsv);
    // console.log(links);

    var digraphString = (
        'digraph {' + 
        'bgcolor = "transparent";' + 
        'node [shape=circle, color="#5986ba", style=filled, fillcolor="#c6d9f1", fixedsize=true, width=1];' +
        'edge [color=black, penwidth=2.0];'
    );

    const [nodeDef, edgeDef] = getHierarchyAttr(links, labels);

    digraphString += nodeDef;
    digraphString += edgeDef;

    digraphString += "}";

    // console.log(digraphString);

    select("#hierarchy_graph").graphviz()
        .renderDot(digraphString);
}