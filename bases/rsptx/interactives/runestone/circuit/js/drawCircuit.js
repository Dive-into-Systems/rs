// *********
// binops21.js
// *********
// This file contains the JS for the Runestone numberconversion component. It was created By Luyuan Fan, Zhengfei Li, and Yue Zhang, 06/01/2023
"use strict";

import RunestoneBase from "../../common/js/runestonebase.js";
import { Pass } from "codemirror";
import circuitAST from "./circuit_AST/circuitAST.js";
import circuit_generator from "./circuit_generate.js";

export var DCList = {}; // Object containing all instances of NC that aren't a child of a timed assessment.


export default class DC extends RunestoneBase {
   constructor(opts) {
       super(opts);



       var orig = opts.orig; // entire <p> element
       this.useRunestoneServices = opts.useRunestoneServices;
       this.origElem = orig;
       this.divid = orig.id;




        //config

        this.numInputs;
        this.numOutputs;
        this.truthTable = []
        this.loaded = false

       // Default configuration settings
        this.red = '#b91c1c';
        this.red2 = '#fca5a5';
        this.green = '#15803d';
        this.green2 = '#86efac';
     
        this.gray = '#cbd5e1';
        this.darkGray = '#334155';

        this.diagramReady = false;
        this.myDiagram
        this.userAnswerLabelledTruthTable = [];
        this.userAnswerTruthTable = []





       // Fields for logging data

       this.initDCElement();

       if (typeof Prism !== "undefined") {
           Prism.highlightAllUnder(this.containerDiv);
       }
       this.sendData(0);
   }

   // Find the script tag containing JSON in a given root DOM node.
   scriptSelector(root_node) {
       return $(root_node).find(`script[type="application/json"]`);
   }

   removeEverything = () => {
    clearTimeout(this.timeoutId)
    this.myDiagram = null
    this.wrapperDiv.remove()
    this.wrapperDiv = null;

    if(this.feedbackDiv){
        this.feedbackDiv.remove()
    }
    // this.containerDiv.remove()
   }

   /*===========================================
   ====   Functions generating final HTML   ====
   ===========================================*/
   // Component initialization
    initDCElement() {
        const generateRandom = (n) => (Math.floor(Math.random()*n))

        // this.numInputs = 2 + generateRandom(2);
        // this.numOutputs = 1 + generateRandom(2)

        const c1 = new circuit_generator(["A", "B", "C"], ["AND", "OR", "NOR", "XOR", "NOT"],4,2)
        const s1 = c1.generateStatement()
        const a1 = new circuitAST()
        a1.insert(s1)
        const tt1 = a1.getTruthTable()
 
        const c2 = new circuit_generator(["A", "B", "C"].slice(0,a1.getInformation().numInputs), ["AND", "OR", "NOR", "XOR", "NOT"], 4,2, true )
        const s2 = c2.generateStatement()
        const a2 = new circuitAST()
        a2.insert(s2)
        const tt2 = a2.getTruthTable()


        
        this.numOutputs = 1 + generateRandom(2)
        
        if(this.numOutputs == 2){

            for(let i = 0; i < tt1.length; i++){
                tt1[i].push(tt2[i][(tt2[i].length-1)])
            }
            this.truthTable = tt1;
            const d1intputs = a1.getInformation().numInputs
            const d2inputs = a2.getInformation().numInputs
            this.numInputs = (d1intputs > d2inputs) ? d1intputs : d2inputs

        }
        else{
            this.truthTable = tt1;
            const d1intputs = a1.getInformation().numInputs
            this.numInputs = d1intputs
        }

        console.log(tt1)



        this.startJson = `{ "class": "GraphLinksModel",
        "linkFromPortIdProperty": "fromPort",
        "linkToPortIdProperty": "toPort",
        "nodeDataArray": [`

        this.letters = ['A','B','C','D','E']
        for(let i = 0; i < this.numInputs; i++){
            if(i < this.numInputs - 1){
                this.startJson += `{"category":"input","isOn":true,"key":-2,"loc":"${-750 + (i*15)} ${-500- i*80}", "text": "${this.letters[i]}"},`
            }
            else{
                this.startJson += `{"category":"input","isOn":true,"key":-2,"loc":"${-750 + (i*15)} ${-500 - i*80}", "text": "${this.letters[i]}"},`
            }

        }
        for(let i = 0; i < this.numOutputs; i++){
            if(i < this.numOutputs - 1){
                this.startJson += `{"category":"output","key":-8,"loc":"${-330 + i*10} ${-510+(i*90)}","isOn":true, "text" : "${this.letters[i]}"},`
            }
            else{
                this.startJson += `{"category":"output","key":-8,"loc":"${-330 + i*10} ${-510+(i*90)}","isOn":true, "text" : "${this.letters[i]}"}`
            }

        }
        this.startJson += '], "linkDataArray":[]}'

        console.log(this.startJson)

        console.log(JSON.parse(this.startJson))


        // this.generateATruthTable()
        this.renderDCPromptAndInput();
        
        this.renderDCButtons();



        // replaces the intermediate HTML for this component with the rendered HTML of this component
        

        if(!this.loaded){
            $(this.origElem).replaceWith(this.containerDiv);
            this.loadExternalScripts()
            this.loaded = true;
        }else{
            this.init()
        }



   }

   checkAnswer(){
    let correct = true;
    for(let i = 0; i < this.userAnswerTruthTable.length; i++){
        for(let j = 0; j < this.userAnswerTruthTable[0].length; j++){
            if(this.userAnswerTruthTable[i][j] != this.truthTable[i][j]){
                correct = false;
            }
        }
    }

    const msg = `Anwer is ${correct ? 'correct' : 'incorrect'}`
    console.log(msg)
    this.feedbackHTML = `${msg}`
    this.renderDCFeedbackDiv()
   }
       
    renderDCPromptAndInput() {
    // parse options from the JSON script inside

                // Generate the dropdown menu for bitwise operation
        if(!this.containerDiv){
            this.containerDiv = document.createElement("div"); 
        }

        this.wrapperDiv = document.createElement("div")


        this.containerDiv.id = this.divid;

        this.gojsDiv = document.createElement("div")

        this.circuitDiv = document.createElement("div")
        const html = "<div id='sample'>"+
            "<div style='width: 100%; display: flex; justify-content: space-between'>" +
            "<div id='palette' style='width: 100px; height: 600px; margin-right: 2px; background-color: #f3f4f6; border: solid 1px black;'" +
            "></div>"+
            "<div id='myDiagramDiv' class='myDiagramDiv' style='background-color: #f3f4f6; flex-grow: 1; height: 500px; border: solid 1px black'></div>"+
            "</div>"
        this.circuitDiv.innerHTML = html
        this.textArea = document.createElement("textarea")


        this.gojsDiv.append(this.circuitDiv)
        this.wrapperDiv.append(this.gojsDiv)

        this.answerDiv = document.createElement("div")
        this.wrapperDiv.append(this.answerDiv)

        this.checkButton = document.createElement("button")
        this.checkButton.textContent = "Check"

        this.answerDiv.appendChild(this.checkButton)

        this.checkButton.addEventListener("click", ()=>{
            this.getTruthTable()
            this.checkAnswer()
        })

        this.generateButton = document.createElement("button")
        this.generateButton.textContent = "Generate Another QUestion"

        this.answerDiv.appendChild(this.generateButton)

        this.generateButton.addEventListener("click", ()=>{
            this.removeEverything()
            this.initDCElement()
        })

        this.tableDiv = document.createElement("div")

        const table = document.createElement("table")
        const th = document.createElement("tr")
        let thInnerHTML = ""
        for(let i = 0; i < this.numInputs; i++){
            thInnerHTML += `<th>${this.letters[i]}</th>`
        }
        for(let i = 0; i < this.numOutputs; i++){
            thInnerHTML += `<th>${this.letters[i]}</th>`
        }
        th.innerHTML = thInnerHTML
        table.appendChild(th)

        let tableDataHTML = ""
        for(let i = 0; i < 2**this.numInputs; i++){
            let trInnerHTML = "<tr>"
            for(let j = 0; j < this.numInputs + this.numOutputs; j++){
                trInnerHTML += `<td> ${this.truthTable[i][j]} </td>`
            }
            trInnerHTML += "</tr>"
            tableDataHTML += trInnerHTML;
        }
        table.innerHTML += tableDataHTML

        this.tableDiv.appendChild(table)
        this.answerDiv.append(table)


        this.containerDiv.append(this.wrapperDiv)

        $(this.origElem).children().clone().appendTo(this.containerDiv);

    }


    generateATruthTable = () => {
        
        let toggleArray = []
        this.truthTable = []
        //copying this over because can't use pointers in js :(
        const recursiveToggle = (n, param) => {
            n= n;
            if(n == 0){
              toggleArray.push([...param, 0])
              toggleArray.push([...param, 1])
        
            }
            else if(param.length > 0){
              recursiveToggle(n-1, [...param, 0])
              recursiveToggle(n-1, [...param, 1])
        
            }
            else{
              recursiveToggle(n-1, [0])
              recursiveToggle(n-1, [1])
        
            }
          }
        
        recursiveToggle(this.numInputs-1, [])
        const ZeroOrOne = () => Math.floor(Math.random() * 2)
        for(let elem of toggleArray){
            let outputVals = []
            for(let i = 0; i < this.numOutputs; i++){
                outputVals.push(ZeroOrOne())
            }
            this.truthTable.push([...elem, ...outputVals])
        }
        console.log(this.truthTable)
    }
    
   

    configInputDiv(opt) {
       
    }



    renderDCButtons() {
       
    }






    renderDCFeedbackDiv() {
        if(this.feedbackDiv){
            this.feedbackDiv.remove()
        }

        this.feedbackDiv = document.createElement("div")
        const msg = this.feedbackHTML ? this.feedbackHTML : 'no msg :('
        this.feedbackDiv.innerHTML = msg

        this.wrapperDiv.append(this.feedbackDiv)
    }

    sendData(actionId) {
       
    }

    loadExternalScripts() {
        const self = this
        function loadScript(src, callback) {
            const s = document.createElement("script");
            s.src = src;
            s.onload = callback;
            s.onerror = () => console.error("Error loading script:", src);
            document.head.appendChild(s);
        }

        loadScript("https://cdn.jsdelivr.net/npm/gojs/release/go-debug.js", function() {
            loadScript("https://gojs.net/latest/extensions/PortShiftingTool.js", function() {
                import('./figures.js').then(()=>self.init())
            });
        });

    }



    simulatedClickFunction = (obj, val) => {
        
        if (this.myDiagram instanceof go.Palette) return;
        this.myDiagram.startTransaction('Toggle Input');
        const isOn = val;
        this.myDiagram.model.setDataProperty(obj.data, 'isOn', isOn);

        this.updateStates();
        this.myDiagram.commitTransaction('Toggle Input');
    }

    log = data => {
        console.log()
    }


    init = () => {
        var $ = go.GraphObject.make; // for conciseness in defining templates

        const myDiagramDiv = this.containerDiv.getElementsByClassName('myDiagramDiv')[0]
        this.myDiagram = $(go.Diagram, "myDiagramDiv", { // create a new Diagram in the HTML DIV element "diagramDiv"
            initialContentAlignment: go.Spot.Center,
            allowDrop: true,
            "draggingTool.isGridSnapEnabled": true,
            "undoManager.isEnabled": true
        });

        this.myDiagram.allowClipboard = false

        // when the document is modified, add a "*" to the title and enable the "Save" button
        this.myDiagram.addDiagramListener('Modified', (e) => {
        const button = document.getElementById('saveModel');
        if (button) button.disabled = !myDiagram.isModified;
        const idx = document.title.indexOf('*');
        if (this.myDiagram.isModified) {
        if (idx < 0) document.title += '*';
        } else {
        if (idx >= 0) document.title = document.title.slice(0, idx);
        }
        });

        const palette = new go.Palette('palette'); // create a new Palette in the HTML DIV element "palette"

        // creates relinkable Links that will avoid crossing Nodes when possible and will jump over other Links in their paths
        this.myDiagram.linkTemplate = new go.Link({
        curve: go.Curve.JumpOver,
        corner: 3,
        relinkableFrom: true,
        relinkableTo: true,
        selectionAdorned: false, // Links are not adorned when selected so that their color remains visible.
        shadowOffset: new go.Point(0, 0),
        shadowBlur: 5,
        shadowColor: 'blue',
        layerName: 'Background'
        })
        .bindObject('isShadowed', 'isSelected')
        .add(new go.Shape({ name: 'SHAPE', strokeWidth: 3, stroke: this.red }));

        // node template helpers
        const sharedToolTip = go.GraphObject.build('ToolTip', {
        'Border.figure': 'RoundedRectangle'
        }).add(new go.TextBlock({ margin: 2 }).bind('text', '', (d) => d.category));

        // define some common property settings
        function nodeStyle() {

    

        return {
        selectionAdorned: false,
        shadowOffset: new go.Point(0, 0),
        shadowBlur: 15,
        shadowColor: 'blue',
        toolTip: sharedToolTip
        };
        }

        function applyNodeBindings(node) {
        node.bindTwoWay('location', 'loc', go.Point.parse, go.Point.stringify);
        node.bindObject('isShadowed', 'isSelected');
        return node;
        }

        const shapeStyle = () => {
            return {
                name: 'NODESHAPE',
                fill: this.gray,
                stroke: this.darkGray,
                desiredSize: new go.Size(40, 40),
                strokeWidth: 2
            };
        }

        const portStyle = (input, spot) => {
            return {
                figure: 'Rectangle',
                desiredSize: new go.Size(4, 4),
                fill: this.darkGray,
                stroke: 'transparent',
                strokeWidth: 6,
                fromLinkable: !input,
                fromSpot: spot ?? new go.Spot(1, 0.5, -3, 0),
                toSpot: spot ?? new go.Spot(0, 0.5, 3, 0),
                toLinkable: input,
                toMaxLinks: 1,
                cursor: 'pointer'
            };
        }

        // define templates for each type of node

        const nodeOnClickFunction = (e, obj) => {
            if (e.diagram instanceof go.Palette) return;
            e.diagram.startTransaction('Toggle Input');

            const isOn = !obj.data.isOn;
            this.myDiagram.model.setDataProperty(obj.data, 'isOn', isOn);

            this.updateStates();
            e.diagram.commitTransaction('Toggle Input');
        }



        const inputTemplate = applyNodeBindings(new go.Node('Spot', nodeStyle()))
            .set({
                cursor: 'pointer',
                margin: new go.Margin(-15, 0, 0, 0),
                click: (e, obj) => {
                    nodeOnClickFunction(e, obj)
                },
                deletable : false,
                movable : true,
            })
        .add(
        new go.Shape(shapeStyle())
                .set({
                    fill: go.Brush.lighten(this.green),
                    margin: 3,
                    strokeWidth: 1.5,
                    desiredSize: new go.Size(NaN, NaN),
                    scale: 1.75,
                    geometry: go.Geometry.parse('F M19.5 3 L19.875 3 C20.4963 3 21 3.5037000000000003 21 4.125 L21 6.375 C21 6.9963 20.4963 7.5 19.875 7.5 L19.5 7.5 M2.25 10.5 L17.25 10.5 C18.4926 10.5 19.5 9.4926 19.5 8.25 L19.5 2.25 C19.5 1.0073600000000003 18.4926 0 17.25 0 L2.25 0 C1.0073599999999998 0 0 1.0073600000000003 0 2.25 L0 8.25 C0 9.4926 1.0073599999999998 10.5 2.25 10.5z', true)
                })
            .bind('fill', 'isOn', isOn => go.Brush.lighten(isOn ? this.green : this.red)),
        new go.Shape('BpmnEventError', {
            alignment: new go.Spot(0.5, 0.5, -1, 0),
            width: 18,
            height: 10,
            fill: this.green2,
            strokeWidth: 0
        })
            .bind('fill', 'isOn', isOn => isOn ? this.green2 : this.red2),
        new go.Shape(portStyle(false)) // the only port
                .set({
                opacity: 0,
                portId: '',
                alignment: new go.Spot(1, 0.5, -2, 0)
            }),
        new go.TextBlock({margin: 4}).bind("text", "text"),
        );

        const switchTemplate = applyNodeBindings(new go.Node('Spot', nodeStyle()))
            .set({
                shadowOffset: new go.Point(0, 0),
                shadowBlur: 5,
                margin: new go.Margin(-35, 0, 0, 0)
            })
        .add(
        new go.Panel('Horizontal', {
            // this prevents the ports from moving when the shape rotates
            minSize: new go.Size(42, 60)
        })
            .add(
                new go.Panel('Spot', {
                    isClipping: true
                })
                    .add(
                    new go.Shape({fill: 'blue', strokeWidth: 0}),
                    new go.Panel({
                        alignment: go.Spot.Left,
                        alignmentFocus: go.Spot.Center,
                        angle: 359.99 // rotate counter clock wise
                    })
                        .add(
                            new go.Shape({width: 1, height: 1}),
                            new go.Shape(shapeStyle())
                                .set({
                                strokeWidth: 0,
                                fill: this.green,
                                width: 40,
                                height: 4,
                                position: new go.Point(40,0),
                                shadowVisible: false
                                })
                        )
                    .bind('angle', 'isOn', isOn => isOn ? 359.99 : 359.99 - 30)
                    .trigger('angle', {
                    duration: 250,
                    easing: go.Animation.EaseOutQuad,
                    finished: this.updateStates
                    })
                )
            ),
        // this rectangle is the clickable area
        new go.Shape('Rectangle', {
            fill: 'transparent',
            // fill: 'skyblue',
            // opacity: 0.6,
            strokeWidth: 0,
            width: 40,
            height: 30,
            alignment: go.Spot.Center,
            alignmentFocus: new go.Spot(0.5, 1, 0, -8),
            cursor: 'pointer',
            click: (e, obj) => {
            if (e.diagram instanceof go.Palette) return;
            e.diagram.startTransaction('Toggle Switch');

            while (obj.part && obj.part !== obj) obj = obj.part; // find node
            const shp = obj.findObject('NODESHAPE');
            const isOn = !obj.data.isOn;
            this.myDiagram.model.setDataProperty(obj.data, 'isOn', isOn);

            e.diagram.commitTransaction('Toggle Switch');
            if (!obj.data.isOn)
                this.updateStates();
            }
        }),
        // ports
        new go.Shape(portStyle(false)) // the only port
            .set({
            portId: 'out',
            desiredSize: new go.Size(5, 5),
            alignment: new go.Spot(1, 0.5)
            }),
        new go.Shape(portStyle(true)) // the only port
            .set({
            portId: 'in',
            desiredSize: new go.Size(5, 5),
            alignment: new go.Spot(0, 0.5)
            })
        );

        // brush for the "light" in the LED
        const outBrush = new go.Brush('Radial', {
        0.0: 'rgba(255, 255, 255, 0.2)',
        0.5: 'rgba(0,255,0,0.8)',
        0.75: 'rgba(0,255,0,0.3)',
        0.85: 'rgba(0,255,0,0.1)',
        0.95: 'rgba(0,255,0,0.05)',
        1: 'rgba(0,255,0,0)',
        start: new go.Spot(0.5, 0.8)
        })

        const outputTemplate = new go.Node('Spot', nodeStyle())
        .set({
        isShadowed: true,
        deletable : false,
        movable : true,
        })
        .bindTwoWay('location', 'loc', go.Point.parse, go.Point.stringify)
        .add(
        new go.Panel('Spot')
            .add(
            new go.Shape('RoundedRectangle', {
                fill: 'transparent',
                parameter1: Infinity,
                parameter2: 0b0011, // top rounded
                width: 25,
                height: 22,
                strokeWidth: 2,
                shadowVisible: false
            }),
            new go.Shape('Rectangle', {
                alignment: go.Spot.Bottom,
                alignmentFocus: new go.Spot(0.5, 0.8),
                strokeWidth: 0,
                fill: null,
                width: 40,
                height: 43
            })
                .bind('fill', 'isOn', isOn => isOn ? outBrush : 'transparent'),
            new go.Shape('Rectangle', shapeStyle())
                .set({
                width: 32,
                height: 15,
                alignment: go.Spot.Bottom,
                alignmentFocus: new go.Spot(0.5, 0, 0, 2)
                })
                .bindObject('shadowVisible', 'isSelected'),
                new go.TextBlock({margin: 4}).bind("text", "text"),

            ),
        new go.Shape(portStyle(true, new go.Spot(0.5, 1, 0, -3))).set({
            // the only port
            portId: '',
            alignment: new go.Spot(0.5, 1)
        }),

        );

        const andTemplate = applyNodeBindings(new go.Node('Spot', nodeStyle()))
        .add(
        new go.Shape('AndGate', shapeStyle()),
        new go.Shape(portStyle(true)).set({
            portId: 'in1',
            alignment: new go.Spot(0, 0.3)
        }),
        new go.Shape(portStyle(true)).set({
            portId: 'in2',
            alignment: new go.Spot(0, 0.7)
        }),
        new go.Shape(portStyle(false)).set({
            portId: 'out',
            alignment: new go.Spot(1, 0.5)
        })
        );

        const orTemplate = applyNodeBindings(new go.Node('Spot', nodeStyle()))
        .add(
        new go.Shape('OrGate', shapeStyle()),
        new go.Shape(portStyle(true)).set({
            portId: 'in1',
            alignment: new go.Spot(0.16, 0.3)
        }),
        new go.Shape(portStyle(true)).set({
            portId: 'in2',
            alignment: new go.Spot(0.16, 0.7)
        }),
        new go.Shape(portStyle(false)).set({
            portId: 'out',
            alignment: new go.Spot(1, 0.5)
        })
        );

        const xorTemplate = applyNodeBindings(new go.Node('Spot', nodeStyle()))
        .add(
        new go.Shape('XorGate', shapeStyle()),
        new go.Shape(portStyle(true)).set({
            portId: 'in1',
            alignment: new go.Spot(0.26, 0.3)
        }),
        new go.Shape(portStyle(true)).set({
            portId: 'in2',
            alignment: new go.Spot(0.26, 0.7)
        }),
        new go.Shape(portStyle(false)).set({
            portId: 'out',
            alignment: new go.Spot(1, 0.5)
        })
        );

        const norTemplate = applyNodeBindings(new go.Node('Spot', nodeStyle()))
        .add(
        new go.Shape('NorGate', shapeStyle()),
        new go.Shape(portStyle(true)).set({
            portId: 'in1',
            alignment: new go.Spot(0.16, 0.3)
        }),
        new go.Shape(portStyle(true)).set({
            portId: 'in2',
            alignment: new go.Spot(0.16, 0.7)
        }),
        new go.Shape(portStyle(false)).set({
            portId: 'out',
            opacity: 0,
            alignment: new go.Spot(1, 0.5, -5, 0)
        })
        );

        const xnorTemplate = applyNodeBindings(new go.Node('Spot', nodeStyle()))
        .add(
        new go.Shape('XnorGate', shapeStyle()),
        new go.Shape(portStyle(true)).set({
            portId: 'in1',
            alignment: new go.Spot(0.26, 0.3)
        }),
        new go.Shape(portStyle(true)).set({
            portId: 'in2',
            alignment: new go.Spot(0.26, 0.7)
        }),
        new go.Shape(portStyle(false)).set({
            portId: 'out',
            opacity: 0,
            alignment: new go.Spot(1, 0.5, -5, 0)
        })
        );

        const nandTemplate = applyNodeBindings(new go.Node('Spot', nodeStyle()))
        .add(
        new go.Shape('NandGate', shapeStyle()),
        new go.Shape(portStyle(true)).set({
            portId: 'in1',
            alignment: new go.Spot(0, 0.3)
        }),
        new go.Shape(portStyle(true)).set({
            portId: 'in2',
            alignment: new go.Spot(0, 0.7)
        }),
        new go.Shape(portStyle(false)).set({
            portId: 'out',
            opacity: 0,
            alignment: new go.Spot(1, 0.5, -5, 0)
        })
        );

        const notTemplate = applyNodeBindings(new go.Node('Spot', nodeStyle()))
        .add(
        new go.Shape('Inverter', shapeStyle()),
        new go.Shape(portStyle(true)).set({
            portId: 'in',
            alignment: new go.Spot(0, 0.5)
        }),
        new go.Shape(portStyle(false)).set({
            portId: 'out',
            opacity: 0,
            alignment: new go.Spot(1, 0.5, -5, 0)
        })
        );

        // add the templates created above to this.myDiagram and palette
        this.myDiagram.nodeTemplateMap.add('input', inputTemplate);
        this.myDiagram.nodeTemplateMap.add('output', outputTemplate);

        this.myDiagram.nodeTemplateMap.add('and', andTemplate);
        this.myDiagram.nodeTemplateMap.add('or', orTemplate);
        this.myDiagram.nodeTemplateMap.add('xor', xorTemplate);
        this.myDiagram.nodeTemplateMap.add('not', notTemplate);
        this.myDiagram.nodeTemplateMap.add('nand', nandTemplate);
        this.myDiagram.nodeTemplateMap.add('nor', norTemplate);
        this.myDiagram.nodeTemplateMap.add('xnor', xnorTemplate);

        // share the template map with the Palette
        //make a map for palette
        const paletteMap = this.myDiagram.nodeTemplateMap;
        // paletteMap.remove('input')
        // paletteMap.remove('output')


        palette.nodeTemplateMap = paletteMap;

        palette.model.nodeDataArray = [
        { category: 'and' },
        { category: 'or' },
        { category: 'xor' },
        { category: 'not' },
        { category: 'nand' },
        { category: 'nor' },
        { category: 'xnor' }
        ];

        // load the initial diagram
        this.load();

        this.diagramReady = true;


        // continually update the diagram
        this.loop();

      }

    loop() {
        this.timeoutId = setTimeout(() => {
        this.updateStates();
        this.loop();
        }, 250);
    }

    updateStates() {
        const oldskip = this.myDiagram.skipsUndoManager;
        this.myDiagram.skipsUndoManager = true;
        // do all "input" nodes first
        this.myDiagram.nodes.each((node) => {
            if (node.category === 'input') {
            this.doInput(node);
            }
        });
        // now we can do all other kinds of nodes
        this.myDiagram.nodes.each((node) => {
            switch (node.category) {
            case 'switch':
                this.doSwitch(node);
                break;
            case 'and':
                this.doAnd(node);
                break;
            case 'or':
                this.doOr(node);
                break;
            case 'xor':
                this.doXor(node);
                break;
            case 'not':
                this.doNot(node);
                break;
            case 'nand':
                this.doNand(node);
                break;
            case 'nor':
                this.doNor(node);
                break;
            case 'xnor':
                this.doXnor(node);
                break;
            case 'output':
                this.doOutput(node);
                break;
            case 'input':
                break; // doInput already called, above
            }
        });
        this.myDiagram.skipsUndoManager = oldskip;
        }
    
// helper predicate
 linkIsTrue = (link) => {
    // assume the given Link has a Shape named "SHAPE"
    return link.findObject('SHAPE').stroke === this.green;
  }

  // helper function for propagating results
setOutputLinks = (node, color) => {
    node.findLinksOutOf().each((link) => (link.findObject('SHAPE').stroke = color));
  }

  // update nodes by the specific function for its type
  // determine the color of links coming out of this node based on those coming in and node type

doInput = (node) => {
    this.setOutputLinks(node, node.data.isOn ? this.green : this.red);
  }

doSwitch = (node) => {
    const linksInto = node.findLinksInto();
    const color = linksInto.count > 0 && linksInto.all(this.linkIsTrue) ? this.green : this.red;
    node.findObject('NODESHAPE').fill = color;
    let ang = node.findObject('NODESHAPE').panel.angle;
    let isGoodAngle = ang >= 357 || ang <= 3;
    this.setOutputLinks(node, node.data.isOn && isGoodAngle ? color : this.red);
  }

doAnd = (node) => {
    const linksInto = node.findLinksInto();
    const color = linksInto.count > 0 && linksInto.all(this.linkIsTrue) && linksInto.count % 2 == 0 ? this.green : this.red;
    this.setOutputLinks(node, color);
  }
doNand = (node) => {
    const color = !node.findLinksInto().all(this.linkIsTrue) ? this.green : this.red;
    this.setOutputLinks(node, color);
  }
doNot = (node) => {
    const color = !node.findLinksInto().all(this.linkIsTrue) ? this.green : this.red;
    this.setOutputLinks(node, color);
  }

doOr = (node) => {
    const color = node.findLinksInto().any(this.linkIsTrue) ? this.green : this.red;
    this.setOutputLinks(node, color);
  }
doNor = (node) => {
    const color = !node.findLinksInto().any(this.linkIsTrue) ? this.green : this.red;
    this.setOutputLinks(node, color);
  }

doXor = (node) => {
    let truecount = 0;
    node.findLinksInto().each((link) => {
      if (this.linkIsTrue(link)) truecount++;
    });
    const color = truecount % 2 !== 0 ? this.green : this.red;
    this.setOutputLinks(node, color);
  }
doXnor = (node) => {
    let truecount = 0;
    node.findLinksInto().each((link) => {
      if (this.linkIsTrue(link)) truecount++;
    });
    const color = truecount % 2 === 0 ? this.green : this.red;
    this.setOutputLinks(node, color);
  }

doOutput = (node) => {
    // assume there is just one input link
    // we just need to update the node's data.isOn
    node.linksConnected.each((link) => {
      this.myDiagram.model.setDataProperty(node.data, 'isOn', link.findObject('SHAPE').stroke == this.green);
    });
  }


load = () => {
    this.myDiagram.model = go.Model.fromJson(this.startJson);
  }


  
getTruthTable = () => {

    this.userAnswerLabelledTruthTable = []
    this.userAnswerTruthTable = []

    let inputNodes = [];
    this.myDiagram.nodes.each(n=>{
      if(n.category == "input"){
        inputNodes.push({"obj":n, "data":n.data})
      }
    })
    
    let outputNodes = [];
        this.myDiagram.nodes.each(n=>{
      if(n.category == "output"){
        outputNodes.push({"obj":n, "data":n.data})
      }
    })
  
    
  
  
    const toggleArray = [];
    const recursiveToggle = (n, param) => {
        n= n;
        if(n == 0){
          toggleArray.push([...param, 0])
          toggleArray.push([...param, 1])
    
        }
        else if(param.length > 0){
          recursiveToggle(n-1, [...param, 0])
          recursiveToggle(n-1, [...param, 1])
    
        }
        else{
          recursiveToggle(n-1, [0])
          recursiveToggle(n-1, [1])
    
        }
      }
    
    recursiveToggle(inputNodes.length-1, [])
    
    let truthTable = []
    for(let elem of toggleArray){

        let inputData = [];

      for(let i = 0; i < elem.length; i++){
        const val = elem[i] == 1 ? true : false
        this.simulatedClickFunction(inputNodes[i].obj, val)
        inputData.push({"text":inputNodes[i].data.text, "value": elem[i]})
      }
      

      this.myDiagram.redraw()
      this.updateStates()
      this.myDiagram.redraw()
      this.updateStates()
      this.myDiagram.redraw()
      this.updateStates()
  
        
      let outputValues = [];
      let outputNumbers = []
      outputNodes.forEach(e => {
        outputValues.push({"label": e.data.text,"value":e.data.isOn ? 1 : 0})
        outputNumbers.push(e.data.isOn ? 1 : 0)
      })
      truthTable.push([inputData, outputValues])
      this.userAnswerTruthTable.push([...elem, ...outputNumbers])
      

    }

    console.log(truthTable)
    console.log(this.userAnswerTruthTable)
    this.userAnswerLabelledTruthTable = truthTable


    
  //   simulatedClickFunction(inputNodes[0].obj, false)
  //     simulatedClickFunction(inputNodes[1].obj, true)
    
  //   console.log(inputNodes[0].data.isOn)
  //     console.log(inputNodes[1].data.isOn)
  //   updateStates()
  //   console.log(outputNodes[0].data.isOn)
  //     console.log(outputNodes[1].data.isOn)
  
  
  }





}









    /*=================================
    == Find the custom HTML tags and ==
    ==   execute our code on them    ==
    =================================*/
    $(document).on("runestone:login-complete", function () {
        $("[data-component=drawCircuit]").each(function (index) {
            var opts = {
                orig: this,
                useRunestoneServices: eBookConfig.useRunestoneServices,
            };
            if ($(this).closest("[data-component=timedAssessment]").length == 0) {
                // If this element exists within a timed component, don't render it here
                try {
                    DCList[this.id] = new DC(opts);
                } catch (err) {
                    console.log(
                        `Error rendering Bitwise Operation Problem ${this.id}
                            Details: ${err}`
                    );
                }
            }
        });
    });
