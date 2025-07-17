
"use strict";

import RunestoneBase from "../../common/js/runestonebase.js";
import { Pass } from "codemirror";
import "../css/circuitdraw.css"
import { updateHeight } from "../../../utils/updateHeight.js";

export var CVList = {}; // Object containing all instances of CV that aren't a child of a timed assessment.


export default class CV extends RunestoneBase {
   constructor(opts) {
       super(opts);



       var orig = opts.orig; // entire <p> element
       this.useRunestoneServices = opts.useRunestoneServices;
       this.origElem = orig;
       this.divid = orig.id;




        //config:
        //Num inputs/outputsgets set by the code, but it's here for convenience
        this.numInputs;
        this.numOutputs;
        // The proceudrally generated truth table to base the question on
        this.truthTable = []
        //I'm using this to avoid reloading GoJS nastyness
        this.loaded = false
        //did the user get it correct
        this.correct;
        //history/mode stuff
        this.modeOutput = 2;
        this.prevCircuit = null;

       // Default configuration settings
       //For somereason the default code uses colors (and not a separate variable) to update the circuit
        this.red = '#115222ff';
        this.red2 = '#1a642eff';
        this.green = '#0deb48ff';
        this.green2 = '#33ff66ff';
     
        this.gray = '#cbd5e1';
        this.darkGray = '#334155';

        this.diagramReady = false;
        this.myDiagram
        this.userAnswerLabelledTruthTable = [];
        this.userAnswerTruthTable = []
        this.inputAndOutputLabels = []


        this.letters = ["A", "B", "C", "D", "E"]


       // Fields for logging data

       this.initCVElement();

       if (typeof Prism !== "undefined") {
           Prism.highlightAllUnder(this.containerDiv);
       }
       updateHeight(window, document, this, true, 882)
       this.sendData(0);
   }

   // Find the script tag containing JSON in a given root DOM node.
   scriptSelector(root_node) {
       return $(root_node).find(`script[type="application/json"]`);
   }

   //Pretty self-explanatory
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

   //This function sets up everything.
    initCVElement() {



        // This JSON is used initialie the digram.
        this.startJson = ``;

        if(this.modeOutput == 1){
            this.startJson = `
                    { "class": "GraphLinksModel",
                    "isReadOnly": true,
                    "linkFromPortIdProperty": "fromPort",
                    "linkToPortIdProperty": "toPort",
                    "nodeDataArray": [
                    {"category":"input","isOn":false,"key":-1,"loc":"-960 -438","text":"S0"},
                    {"category":"input","isOn":false,"key":-2,"loc":"-1008.9070294784581 -388.90702947845807","text":"S1"},
                    {"category":"output","key":-5,"loc":"-483 -237","isOn":false,"text":"X"},
                    {"category":"input","key":-7,"loc":"-1034 -277","isOn":false,"text":"A"},
                    {"category":"input","key":-8,"loc":"-1037 -176","isOn":false,"text":"B"},
                    {"category":"input","key":-9,"loc":"-1038.030518086086 -85.03051808608606","isOn":false,"text":"C"},
                    {"category":"input","key":-10,"loc":"-1038.5062691544877 -6","isOn":false,"text":"D"},
                    {"category":"threeInputAnd","key":-11,"loc":"-660 -290"},
                    {"category":"threeInputAnd","key":-12,"loc":"-660 -190"},
                    {"category":"threeInputAnd","key":-13,"loc":"-660 -100"},
                    {"category":"threeInputAnd","key":-14,"loc":"-660 -20"},
                    {"category":"junction","key":-16,"loc":"-890 -80","fillColor":"#b91c1c"},
                    {"category":"junction","key":-17,"loc":"-890 -370","fillColor":"#b91c1c"},
                    {"category":"junction","key":-15,"loc":"-890 0","fillColor":"#b91c1c"},
                    {"category":"junction","key":-19,"loc":"-827 -269","fillColor":"#15803d"},
                    {"category":"junction","key":-20,"loc":"-828 -170","fillColor":"#15803d"},
                    {"category":"junction","key":-21,"loc":"-760 -420","fillColor":"#b91c1c"},
                    {"category":"junction","key":-22,"loc":"-760 -13","fillColor":"#15803d"},
                    {"category":"junction","key":-23,"loc":"-761 -183","fillColor":"#b91c1c"},
                    {"category":"junction","key":-26,"loc":"-680 -284","fillColor":"#b91c1c"},
                    {"category":"fourInputOr","key":-27,"loc":"-540 -170"},
                    {"category":"junction","key":-25,"loc":"-680 -94","fillColor":"#b91c1c"},
                    {"category":"not","mode1":true,"key":-28,"loc":"-729 -435"},
                    {"category":"not","mode1":true,"key":-24,"loc":"-875 -386"}
                    ],
                    "linkDataArray": [
                    {"from":-7,"to":-11,"fromPort":"","toPort":"in3"},
                    {"from":-8,"to":-12,"fromPort":"","toPort":"in3"},
                    {"from":-9,"to":-13,"fromPort":"","toPort":"in3"},
                    {"from":-10,"to":-14,"fromPort":"","toPort":"in3"},
                    {"from":-17,"to":-16,"fromPort":"out2","toPort":"in1"},
                    {"from":-16,"to":-15,"fromPort":"out2","toPort":"in1"},
                    {"from":-15,"to":-14,"fromPort":"out2","toPort":"in2"},
                    {"from":-16,"to":-13,"fromPort":"out2","toPort":"in2"},
                    {"from":-19,"to":-11,"fromPort":"out2","toPort":"in2"},
                    {"from":-19,"to":-20,"fromPort":"out2","toPort":"in1"},
                    {"from":-20,"to":-12,"fromPort":"out2","toPort":"in2"},
                    {"from":-1,"to":-21,"fromPort":"","toPort":"in1"},
                    {"from":-21,"to":-23,"fromPort":"out2","toPort":"in1"},
                    {"from":-23,"to":-22,"fromPort":"out2","toPort":"in1"},
                    {"from":-22,"to":-14,"fromPort":"out2","toPort":"in1"},
                    {"from":-26,"to":-11,"fromPort":"out2","toPort":"in1"},
                    {"from":-11,"to":-27,"fromPort":"out","toPort":"in1"},
                    {"from":-12,"to":-27,"fromPort":"out","toPort":"in2"},
                    {"from":-13,"to":-27,"fromPort":"out","toPort":"in3"},
                    {"from":-14,"to":-27,"fromPort":"out","toPort":"in4"},
                    {"from":-27,"to":-5,"fromPort":"out","toPort":""},
                    {"from":-2,"to":-17,"fromPort":"","toPort":"in1"},
                    {"from":-23,"to":-12,"fromPort":"out2","toPort":"in1"},
                    {"from":-25,"to":-13,"fromPort":"out2","toPort":"in1"},
                    {"from":-26,"to":-25,"fromPort":"out2","toPort":"in1"},
                    {"from":-21,"to":-28,"fromPort":"out2","toPort":"in"},
                    {"from":-28,"to":-26,"fromPort":"out","toPort":"in1"},
                    {"from":-17,"to":-24,"fromPort":"out2","toPort":"in"},
                    {"from":-24,"to":-19,"fromPort":"out","toPort":"in1"}
                    ]}
            `        
        }
        else if (this.modeOutput == 2){
            this.startJson = `
                { "class": "GraphLinksModel",
                "isReadOnly": true,
                "linkFromPortIdProperty": "fromPort",
                "linkToPortIdProperty": "toPort",
                "nodeDataArray": [
                {"category":"input","isOn":true,"key":-1,"loc":"-755 -330","text":"R"},
                {"category":"input","isOn":true,"key":-2,"loc":"-756 -200","text":"S"},
                {"category":"nand","key":-3,"loc":"-544 -320"},
                {"category":"nand","key":-4,"loc":"-610 -205"},
                {"category":"output","key":-5,"loc":"-355 -360","isOn":false,"text":"X"},
                {"category":"output","key":-6,"loc":"-358 -222","isOn":true,"text":"Y"}
                ],
                "linkDataArray": [
                {"from":-1,"to":-3,"fromPort":"","toPort":"in1"},
                {"from":-2,"to":-4,"fromPort":"","toPort":"in2"},
                {"from":-3,"to":-4,"fromPort":"out","toPort":"in1"},
                {"from":-4,"to":-3,"fromPort":"out","toPort":"in2"},
                {"from":-4,"to":-6,"fromPort":"out","toPort":""},
                {"from":-3,"to":-5,"fromPort":"out","toPort":""}
                ]}
            `
        }
        else{
            this.startJson = `
                { "class": "GraphLinksModel",
                "isReadOnly": true,
                "linkFromPortIdProperty": "fromPort",
                "linkToPortIdProperty": "toPort",
                "nodeDataArray": [
                {"category":"input","isOn":true,"key":-1,"loc":"-783 -361","text":"D"},
                {"category":"input","isOn":true,"key":-2,"loc":"-708.8095238095239 -198.7619047619048","text":"WE"},
                {"category":"output","key":-5,"loc":"-317.14285714285717 -360.9047619047619","isOn":true,"text":"X"},
                {"category":"output","key":-6,"loc":"-301.7142857142857 -207.42857142857144","isOn":false,"text":"Y"},
                {"category":"nand","key":-7,"loc":"-421.14285714285717 -307.9047619047619"},
                {"category":"nand","key":-8,"loc":"-484.7142857142857 -209.42857142857144"},
                {"category":"nand","key":-9,"loc":"-585.7142857142858 -132.85714285714286"},
                {"category":"nand","key":-10,"loc":"-590 -360"},
                {"category":"not","key":-11,"loc":"-675.2329608725884 -88.53921262033009"}
                ],
                "linkDataArray": [
                {"from":-11,"to":-9,"fromPort":"out","toPort":"in2"},
                {"from":-1,"to":-10,"fromPort":"","toPort":"in1"},
                {"from":-1,"to":-11,"fromPort":"","toPort":"in"},
                {"from":-9,"to":-8,"fromPort":"out","toPort":"in2"},
                {"from":-10,"to":-7,"fromPort":"out","toPort":"in1"},
                {"from":-2,"to":-10,"fromPort":"","toPort":"in2"},
                {"from":-2,"to":-9,"fromPort":"","toPort":"in1"},
                {"from":-7,"to":-8,"fromPort":"out","toPort":"in1"},
                {"from":-8,"to":-7,"fromPort":"out","toPort":"in2"},
                {"from":-7,"to":-5,"fromPort":"out","toPort":""},
                {"from":-8,"to":-6,"fromPort":"out","toPort":""}
                ]}
            `
        }

        console.log(this.startJson)

        console.log(JSON.parse(this.startJson))


        // this.generateATruthTable()
        
        //Render the main html
        this.renderCVPromptAndInput();
        



        // replaces the intermediate HTML for this component with the rendered HTML of this component
        if(!this.loaded){
            $(this.origElem).replaceWith(this.containerDiv);
            this.loadExternalScripts()

            this.loaded = true;
        }else{
            this.init()

        }





   }

   highlightATableRow(){

        if(!this.table){
            return
        }

        let inputVals = [];
        this.myDiagram.nodes.each(n=>{
        if(n.category == "input"){
            inputVals.push(n.data.isOn ? 1 : 0)
        }
        })

        let outputRow
        for(let i = 0; i < this.userAnswerTruthTable.length; i++){
            let match = true;
            for(let x = 0; x < inputVals.length; x++){
                if(this.userAnswerTruthTable[i][x] != inputVals[x]){
                    match = false;
                }

            }
            if(match){
                outputRow = i
            }
            
        }

        //need to set back to normal
        for(let i = 1; i < this.table.rows.length; i++){
            if(i == outputRow+1){
                this.table.rows.item(i).style.background = "rgba(178, 255, 187, 0.5)" 

            }
            else{
                this.table.rows.item(i).style.background = "white"
            }
        }

   }



   renderCircuitTable(){
    
    this.tdH3 = document.createElement("div")
    this.tdH3.textContent = "Truth Table:"
    this.answerDiv.append(this.tdH3)

    this.tableDiv = document.createElement("div")
    this.tableDiv.className = 'tables-container'

    this.getTruthTable()
    
    
    this.table = document.createElement("table")
    this.table.className = 'register-table'
    const th = document.createElement("tr")
    let thInnerHTML = ""
    for(let i = 0; i < this.numInputs+this.numOutputs; i++){
        thInnerHTML += `<th style='text-align:center;'>${this.inputAndOutputLabels[i]}</th>`
    }

    th.innerHTML = thInnerHTML
    this.table.appendChild(th)

    let tableDataHTML = ""
    for(let i = 0; i < 2**this.numInputs; i++){
        let trInnerHTML = "<tr>"
        for(let j = 0; j < this.numInputs + this.numOutputs; j++){
            trInnerHTML += `<td> ${this.userAnswerTruthTable[i][j]} </td>`
        }
        trInnerHTML += "</tr>"
        tableDataHTML += trInnerHTML;
    }
    this.table.innerHTML += tableDataHTML

    this.tableDiv.appendChild(this.table)
    this.answerDiv.append(this.tableDiv)
   }

   renderMUXTable(){
    this.tdH3 = document.createElement("div")
    this.tdH3.textContent = "Truth Table:"
    this.answerDiv.append(this.tdH3)

    this.MUXTable = document.createElement("table")
    this.MUXTable.className = 'register-table'
    
    this.tableDiv = document.createElement("div")
    this.tableDiv.className = 'tables-container'

    this.MUXTable.innerHTML = 
    `
    <tr>  <th>S0</th> <th>S1</th>  <th>Output Selected</th>   </tr>
    <tr> <td>0</td> <td>0</td> <td>A</td> </tr>
    <tr> <td>1</td> <td>0</td> <td>B</td> </tr>
    <tr> <td>0</td> <td>1</td> <td>C</td> </tr>
    <tr> <td>1</td> <td>1</td> <td>D</td> </tr>
    `

    this.tableDiv.appendChild(this.MUXTable)
    this.answerDiv.append(this.tableDiv)
   }

   highlightMUXTable(){
    if(!this.MUXTable){
        return
    }

    let inputVals = [];
    this.myDiagram.nodes.each(n=>{
    if(n.category == "input"){
        inputVals.push(n.data.isOn ? 1 : 0)
    }
    })

    let outputRow;
    if(!inputVals[0] && !inputVals[1]){
        outputRow = 0;
    }
    else if(inputVals[0] && !inputVals[1]){
        outputRow = 1;
    }
    else if(!inputVals[0] && inputVals[1]){
        outputRow = 2;
    }
    else{
        outputRow = 3
    }

    //need to set back to normal
    for(let i = 1; i < this.table.rows.length; i++){
        if(i == outputRow+1){
            this.MUXTable.rows.item(i).style.background = "rgba(178, 255, 187, 0.5)" 

        }
        else{
            this.MUXTable.rows.item(i).style.background = "white"
        }
    }
   }

       
    renderCVPromptAndInput() {

        if(!this.containerDiv){
            this.containerDiv = document.createElement("div"); 
        }

        //Creating this div as a subdiv of container div, since deleting container div to generate another question leads to weird problems
        this.wrapperDiv = document.createElement("div")





        this.containerDiv.id = this.divid;


        //HTML stuff
        this.statementDiv = document.createElement("div")
        this.statementDiv.className = "statement-div";

        this.instructionNode = document.createElement("div");
        this.instructionNode.style.paddingBottom = "2px";
        this.instructionNode.innerHTML = "<span style='font-weight:bold'><u>Instructions</u></span>: Draw a circuit that produces the truth table below. "

        this.wrapperDiv.appendChild(this.instructionNode);

        const modeDiv= document.createElement('div')
        modeDiv.className = 'outputModeDiv'
        //Configure question: Select a mode to determine what type of instructions are generated.
        // modeDiv.innerHTML  = `<span style='font-weight:bold'><u>Configure Question</u></span>: Select a mode to determine what type of instructions are generated. <br> 
        // <ul> <li> Mode 1 Lorem Ipsum Dolor Sit Amen </li> 
        // <li>Mode 2 Amen Sit Dolor Ipsum Lorem </li></ul>`

        // <select class="form-control fork-inline mode"><option value="1" selected="selected">1</option><option value="2">2</option><option value="3">3</option></select>
        this.modeSelect = document.createElement("select")

        this.modeSelect.className = "form-control fork-inline mode outputSelect"
        this.mode1Option = document.createElement("option")
        this.mode1Option.value = "1"
        this.mode1Option.textContent = "Multiplexer"

        this.mode2Option = document.createElement("option")
        this.mode2Option.value = "2"
        this.mode2Option.textContent = "RS Latch"

        this.mode3Option = document.createElement("option")
        this.mode3Option.value = "3"
        this.mode3Option.textContent = "Gated D-Latch"

        this.modeSelect.addEventListener("change", ()=>{ this.modeOutput = Number(this.modeSelect.value); this.genFunc()})

        this.modeSelectText = document.createElement("div")
        this.modeSelectText.append(document.createTextNode('Select a component to visualize'))

        this.modeSelect.append(this.mode1Option)
        this.modeSelect.append(this.mode2Option)
        this.modeSelect.append(this.mode3Option)

        if(this.modeOutput == 1){
            this.mode1Option.selected = "selected"
        }
        else if (this.modeOutput == 2){
            this.mode2Option.selected = "selected"

        }
        else{
            this.mode3Option.selected = "selected"
        }

        modeDiv.append(this.modeSelectText)
        modeDiv.append(this.modeSelect)

        this.statementDiv.append(modeDiv)
        this.wrapperDiv.append(this.statementDiv)

        this.wrapperDiv.append(document.createElement("br"))




        //BTW, GoJS typically looks for a div with a pre-specified ID to set itself up in
        this.gojsDiv = document.createElement("div")

        this.circuitDiv = document.createElement("div")
        const html = "<div id='sample'>"+
            "<div style='width: 100%; display: flex; justify-content: space-between'>" +
            //Palette Stuff
            //"<div id='palette' style='width: 100px; height: 600px; margin-right: 2px; background-color: white; border: solid 1px black;'>" +
            "</div>"+
            "<div id='myDiagramDiv' class='myDiagramDiv' style='background-color: white; flex-grow: 1; height: 500px; border: solid 1px black'></div>"+
            "</div>"
        this.circuitDiv.innerHTML = html
        this.textArea = document.createElement("textarea")





        this.gojsDiv.append(this.circuitDiv)
        this.wrapperDiv.append(this.gojsDiv)







        //more HTML stuff
        this.answerDiv = document.createElement("div")
        this.wrapperDiv.append(this.answerDiv)








        this.containerDiv.append(this.wrapperDiv)

        $(this.origElem).children().clone().appendTo(this.containerDiv);

    }


    genFunc(){
        this.removeEverything()
        this.initCVElement()
    }

    //This function is no longer used
    //Actually I'm grateful it isn't because the code was heinous
    generateATruthTable = () => {
        
        let toggleArray = []
        this.truthTable = []
        //copying this over because can't use pointers in js :(
        // Really I wouldn't if there was pointers :(
        //Hopefully this doesn't cause any problems in the future
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
        //util
        const ZeroOrOne = () => Math.floor(Math.random() * 2)

        //
        for(let elem of toggleArray){
            let outputVals = []
            for(let i = 0; i < this.numOutputs; i++){
                outputVals.push(ZeroOrOne())
            }
            this.truthTable.push([...elem, ...outputVals])
        }
        console.log(this.truthTable)
    }
    

    //This does the HTML stuff to render the user's truth table in feedback div
    renderFeedbackTruthTable () {

        const tDiv = document.createElement("div")
        tDiv.className = 'tables-container'

        const table = document.createElement("table")
        table.className = "feedbackTable"
        table.className = 'register-table'
        const th = document.createElement("tr")
        let thInnerHTML = ""
        for(let i = 0; i < this.numInputs; i++){
            thInnerHTML += `<th style='text-align:center;'>${this.letters[i]}</th>`
        }
        for(let i = 0; i < this.numOutputs; i++){
            thInnerHTML += `<th style='text-align:center;'>Output ${i+1}</th>`
        }
        th.innerHTML = thInnerHTML
        table.appendChild(th)

        let tableDataHTML = ""
        for(let i = 0; i < 2**this.numInputs; i++){
            let trInnerHTML = "<tr>"
            for(let j = 0; j < this.numInputs + this.numOutputs; j++){
                trInnerHTML += `<td> ${this.userAnswerTruthTable[i][j]} </td>`
            }
            trInnerHTML += "</tr>"
            tableDataHTML += trInnerHTML;
        }
        table.innerHTML += tableDataHTML

        tDiv.appendChild(table)

        const tableLabel = document.createElement("div")
        tableLabel.textContent = "Your circuit's truth table:"
        this.feedbackDiv.append(tableLabel)

        this.feedbackDiv.append(table)
    }


    //Handel the HTML side of the feedback 
    renderCVFeedbackDiv() {
        if(this.feedbackDiv){
            this.feedbackDiv.remove()
        }
        this.feedbackDiv = document.createElement("div")


        const correctDiv = document.createElement("div")

        const msg = this.feedbackHTML ? this.feedbackHTML : 'no msg :('
        correctDiv.innerHTML = msg

        if (this.correct) {
            $(this.feedbackDiv).attr("class", "alert alert-info");
        } else {
            $(this.feedbackDiv).attr("class", "alert alert-danger");
        }

        this.feedbackDiv.append(correctDiv)
        this.renderFeedbackTruthTable()


        this.wrapperDiv.append(this.feedbackDiv)
    }

    sendData(actionId) {
       
    }

    //This loads in the GOJs script tags
    //Figures jS needs go js to work, hence the delayed import 
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
                loadScript("https://gojs.net/latest/extensions/AvoidsLinksRouter.js", function() {
                    go.Diagram.licenseKey =
                    "2b8647e1b2604fc702d90676423d6bbc5cf07d34cd960ef6590015f5ec5b6f40729be17906dad8c4d3f04df9487ac6d9ddc26c2ac31b003fe165d2df10f096ffb26424b2165b47daa40321c390f22ca0a97078f7cbb374a3dd7ed9f0effbc5985abcf2d740c95cb3792d0635066cbf4ce2abdf7bab52cd5d7b6e99a4fef6a856fa";
                import('./figures.js').then(()=>self.init())
                });
            });
        });

    }


    //I'm using this to programmatically toggle the inuts and outputs
    simulatedClickFunction = (obj, val) => {
        
        if (this.myDiagram instanceof go.Palette) return;
        this.myDiagram.startTransaction('Toggle Input');
        const isOn = val;
        this.myDiagram.model.setDataProperty(obj.data, 'isOn', isOn);

        this.updateStates();
        this.updateStates();
        this.updateStates();
        this.updateStates();
        this.updateStates();

        this.myDiagram.commitTransaction('Toggle Input');


    }

    //Deprecated (and of somewhat dubious utillity)
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
            "undoManager.isEnabled": true,
            'grid.visible': true

        });


        this.myDiagram.toolManager.draggingTool.isGridSnapEnabled = false

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

        //Palette Stuff
        // const palette = new go.Palette('palette'); // create a new Palette in the HTML DIV element "palette"
        // palette.contentAlignment = go.Spot.Center;

        if(this.modeOutput != 1){
            this.myDiagram.linkTemplate = new go.Link({
                routing: go.Link.AvoidsNodes,
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
            this.myDiagram.routers.add(new AvoidsLinksRouter());

        }
        else{
            this.myDiagram.linkTemplate = new go.Link({
                routing: go.Link.Normal,
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
        }

        // creates relinkable Links that will avoid crossing Nodes when possible and will jump over other Links in their paths


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
        const threeAndStyle = () => {
            return {
                name: 'NODESHAPE',
                fill: this.gray,
                stroke: this.darkGray,
                desiredSize: new go.Size(55, 55),
                strokeWidth: 2
            };
        }
        const notStyle = () => {
            return {
                name: 'NODESHAPE',
                fill: this.gray,
                stroke: this.darkGray,
                desiredSize: new go.Size(30, 30),
                strokeWidth: 2
            };
        }
        const junctionStyle = () => {
            return {
                name: 'NODESHAPE',
                fill: this.gray,
                stroke: this.darkGray,
                desiredSize: new go.Size(8, 8),
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

        const junctionPortStyle = (input, spot) => {
            return {
                figure: 'Rectangle',
                desiredSize: new go.Size(1, 1),
                fill: this.darkGray,
                stroke: 'transparent',
                strokeWidth: 6,
                fromLinkable: !input,
                fromSpot: spot ?? go.Spot.Center,
                toSpot: spot ?? go.Spot.Center,
                toLinkable: input,
                toMaxLinks: 1,
                cursor: 'pointer'
            };
        }

        const notPortStyle = (input, spot) => {
            if(this.modeOutput == 1){
                return {
                    figure: 'Rectangle',
                    desiredSize: new go.Size(2, 2),
                    fill: this.darkGray,
                    stroke: 'transparent',
                    strokeWidth: 6,
                    fromLinkable: !input,
                    toSpot: spot ?? new go.Spot(0.5, 0.2),
                    fromSpot: spot ?? new go.Spot(0.5 ,0.8 ),
                    toLinkable: input,
                    toMaxLinks: 1,
                    cursor: 'pointer',
                    opacity: 0
                };
            }
            else{
                return {
                    figure: 'Rectangle',
                    desiredSize: new go.Size(2, 2),
                    fill: this.darkGray,
                    stroke: 'transparent',
                    strokeWidth: 6,
                    fromLinkable: !input,
                    fromSpot: spot ?? new go.Spot(1, 0.5),
                    toSpot: spot ?? new go.Spot(0, 0.5),
                    toLinkable: input,
                    toMaxLinks: 1,
                    cursor: 'pointer',
                    opacity: 0,
                };                
            }
        }
        // define templates for each type of node

        const nodeOnClickFunction = (e, obj) => {
            if (e.diagram instanceof go.Palette) return;
            e.diagram.startTransaction('Toggle Input');

            const isOn = !obj.data.isOn;
            this.myDiagram.model.setDataProperty(obj.data, 'isOn', isOn);
            if(this.modeOutput != 1){
                this.highlightATableRow()
            }
            else{
                this.highlightMUXTable()
            }

            this.updateStates();
            e.diagram.commitTransaction('Toggle Input');
            console.log(this.myDiagram.model.toJson())
        }

        const BottomLabelAlignment = new go.Spot(0.5, 1, 0, 10);

        //The text bindings are how I get the number/category type on the input. What's weird is that margin doesn't seem to work
        //changing this will be a pain.
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
        new go.Shape('inputTemplate', {
                name: 'NODESHAPE',
                fill: this.gray,
                stroke: this.darkGray,
                strokeWidth: 2
            })
                .set({
                    fill: go.Brush.lighten(this.green),
                    margin: 3,
                    strokeWidth: 1.5,
                    desiredSize: new go.Size(40, 40),
                    scale: 1,
                })
            .bind('fill', 'isOn', isOn => go.Brush.lighten(isOn ? this.green : this.red)),
        new go.Shape(portStyle(false)) // the only port
                .set({
                opacity: 1,
                portId: '',
                alignment: new go.Spot(1, 0.5, -2.5, 0),
            })
            .bind("fill", "isOn", isOn => isOn ? "black": "white"),
        new go.TextBlock({margin: 4, alignment: new go.Spot(0.5, 1, 0, 10)}).bind("text", "text", text => `Input ${text}`),
        new go.TextBlock({margin: 4, alignment: new go.Spot(0.5, 0.5, -5, 3), font: '20px mono', stroke: 'white'}).bind("text", "isOn", isOn => isOn ? "1" : "0").bind("stroke", "isOn", isOn => isOn ? "black": "white"),

        );



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
            new go.Shape('OutputTemplate', {
                fill: 'transparent',
                parameter1: Infinity,
                parameter2: 0b0011, // top rounded
                width: 44,
                height: 38,
                strokeWidth: 2,
                shadowVisible: false
            })
            .set({ fill: go.Brush.lighten(this.green)})
            .bind('fill', 'isOn', isOn => go.Brush.lighten(isOn ? this.green : this.red)),


            ),
        new go.Shape(portStyle(true, new go.Spot(0, 0.5, 0, 0))).set({
            // the only port
            portId: '',
            alignment: new go.Spot(0, 0.5, 5, 0),
        })
        .bind("fill", "isOn", isOn => isOn ? "black": "white"),
        new go.TextBlock({margin: 4, alignment: new go.Spot(0.5, 1, 0, 10)}).bind("text", "text", text => `Output ${text}`),
        new go.TextBlock({margin: 4, alignment: new go.Spot(0.5, 0.5, -3, 3),  font: '15px mono', stroke: 'white'}).bind("text", "isOn", isOn => isOn ? "1" : "0").bind("stroke", "isOn", isOn => isOn ? "black": "white"),
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
        )
        .add(new go.TextBlock({ margin: new go.Margin(10,2,2,2), alignment: BottomLabelAlignment }).bind('text', '', (d) => d.category))
        ;

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

        )
        .add(new go.TextBlock({ margin: 2, alignment: BottomLabelAlignment }).bind('text', '', (d) => d.category))
        ;

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
        )
        .add(new go.TextBlock({ margin: new go.Margin(2,2,2,2), alignment: BottomLabelAlignment }).bind('text', '', (d) => d.category))
        ;

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
        )
        .add(new go.TextBlock({ margin: new go.Margin(2,2,2,2), alignment: BottomLabelAlignment }).bind('text', '', (d) => d.category))
        ;


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
        )
        .add(new go.TextBlock({ margin: new go.Margin(2,2,2,2), alignment: BottomLabelAlignment}).bind('text', '', (d) => d.category))
        ;

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
        )
        .add(new go.TextBlock({ margin: new go.Margin(2,2,2,2), alignment: BottomLabelAlignment }).bind('text', '', (d) => d.category))
        ;


        const threeInputAndTemplate = applyNodeBindings(new go.Node('Spot', threeAndStyle()))
        .add(
        new go.Shape('AndGate', shapeStyle()),
        new go.Shape(portStyle(true)).set({
            portId: 'in1',
            alignment: new go.Spot(0, 0.3)
        }),
        new go.Shape(portStyle(true)).set({
            portId: 'in2',
            alignment: new go.Spot(0, 0.6)
        }),
        new go.Shape(portStyle(true)).set({
            portId: 'in3',
            alignment: new go.Spot(0, 0.9)
        }),
        new go.Shape(portStyle(false)).set({
            portId: 'out',
            alignment: new go.Spot(1, 0.5)
        })
        )
        // .add(new go.TextBlock({ margin: new go.Margin(10,2,2,2), background:'white', alignment: go.Spot.Bottom }).bind('text', '', (d) => d.category))
        ;



        const fourInputOrTemplate = applyNodeBindings(new go.Node('Spot', nodeStyle()))
        .add(
        new go.Shape('OrGate', shapeStyle()),
        new go.Shape(portStyle(true)).set({
            portId: 'in1',
            alignment: new go.Spot(0.16, 0.3)
        }),
        new go.Shape(portStyle(true)).set({
            portId: 'in2',
            alignment: new go.Spot(0.16, 0.5)
        }),
        new go.Shape(portStyle(true)).set({
            portId: 'in3',
            alignment: new go.Spot(0.16, 0.7)
        }),
        new go.Shape(portStyle(true)).set({
            portId: 'in4',
            alignment: new go.Spot(0.16, 0.9)
        }),
        new go.Shape(portStyle(false)).set({
            portId: 'out',
            alignment: new go.Spot(1, 0.5)
        })

        )
        //.add(new go.TextBlock({ margin: 2, background:'white', alignment: go.Spot.Bottom }).bind('text', '', (d) => d.category))
        ;



        const junctionTemplate = applyNodeBindings(new go.Node('Spot', nodeStyle()))
        .add(
        new go.Shape('Circle', junctionStyle())
        .bindTwoWay("fill", "fillColor"),
        new go.Shape(junctionPortStyle(true)).set({
            portId: 'in1',
            alignment: new go.Spot(0.5, 0.5)
        }),
        new go.Shape(junctionPortStyle(false)).set({
            portId: 'out1',
            opacity: 0,
            alignment:  new go.Spot(0.5, 0.5)
        }),
        new go.Shape(junctionPortStyle(false)).set({
            portId: 'out2',
            opacity: 0,
            alignment:  go.Spot.Center
        }),
        )
        //.add(new go.TextBlock({ margin: new go.Margin(2,2,2,2), background:'white', alignment: go.Spot.Bottom }).bind('text', '', (d) => d.category))
        ;


        // add the templates created above to this.myDiagram and palette
        this.myDiagram.nodeTemplateMap.add('input', inputTemplate);
        this.myDiagram.nodeTemplateMap.add('output', outputTemplate);

        this.myDiagram.nodeTemplateMap.add('and', andTemplate);
        this.myDiagram.nodeTemplateMap.add('threeInputAnd', threeInputAndTemplate);
        this.myDiagram.nodeTemplateMap.add('or', orTemplate);
        this.myDiagram.nodeTemplateMap.add('fourInputOr', fourInputOrTemplate);

        this.myDiagram.nodeTemplateMap.add('not', notTemplate);

        this.myDiagram.nodeTemplateMap.add('xor', xorTemplate);
        this.myDiagram.nodeTemplateMap.add('nand', nandTemplate);
        this.myDiagram.nodeTemplateMap.add('nor', norTemplate);
        this.myDiagram.nodeTemplateMap.add('junction', junctionTemplate);


        // share the template map with the Palette
        //make a map for palette
        const paletteMap = this.myDiagram.nodeTemplateMap;
        // paletteMap.remove('input')
        // paletteMap.remove('output')

        //Palette Stuff
        // palette.nodeTemplateMap = paletteMap;

        let ndArr = []
        ndArr.push({ category: 'input' })
        ndArr.push({ category: 'output' })

        ndArr.push({ category: 'and' })
        ndArr.push({ category: 'threeInputAnd' })

        ndArr.push({ category: 'or' })
        ndArr.push({ category: 'fourInputOr' })

        ndArr.push({ category: 'not', mode1 : (this.modeOutput == 1 ? true : false) })

        ndArr.push({ category: 'nor' })
        ndArr.push({ category: 'nand' })
        ndArr.push({ category: 'xor' })
        ndArr.push({ category: 'junction' })


        //Palette Stuff
        //palette.model.nodeDataArray = ndArr
        // load the initial diagram
        this.load();

        this.diagramReady = true;

        if(this.modeOutput != 1){
            this.renderCircuitTable()
        }
        else{
            this.renderMUXTable()
        }
        // continually update the diagram
        this.loop();

      }

    //Periodicall update states (this is reduntant, but I think it's redundant in a good way)
    loop() {
        this.timeoutId = setTimeout(() => {
        this.updateStates();
        this.loop();
        }, 340);
    }

    //Updates the circuit states
    //Note: this doesn't necessarily update in the right order, so it can be good to call update states a couple times if the result is important
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
            case 'threeInputAnd':
                this.doAnd(node);
                break;
            case 'or':
                this.doOr(node);
                break;
            case 'fourInputOr':
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
            case 'junction':
                this.doJunction(node);
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
    const color = linksInto.count > 0 && linksInto.all(this.linkIsTrue) ? this.green : this.red;
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

    //node.linksconnecetd is an iterator so I have to count it like this x(
    let i = 0;
    node.linksConnected.each((link) => {
      this.myDiagram.model.setDataProperty(node.data, 'isOn', link.findObject('SHAPE').stroke == this.green);
      i++
    });
    if(i == 0){
        this.myDiagram.model.setDataProperty(node.data, 'isOn', false);
    }
  }

doJunction = (node) => {
    const color = node.findLinksInto().any(this.linkIsTrue) ? this.green : this.red;
    this.setOutputLinks(node, color);
    this.myDiagram.model.setDataProperty(node.data, 'fillColor', color);
}


load = () => {
    this.myDiagram.model = go.Model.fromJson(this.startJson);
    //Palette Stuff
    this.myDiagram.model.isReadOnly = true

  }


//Toggle thorugh the user inputs and see what the outputs are
//Build a truth table out of this  
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
  
    
    //Generate all possibile combinations of n two bit inputs
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
      

      //Redundant, but necessary because sometimes the updates don't happen in the right order
      //I'm not sure what the upper bound on how many updates might be needed, but beyond 3 seems to make no changes
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

    this.inputAndOutputLabels = []
    for(let elem of inputNodes){
        this.inputAndOutputLabels.push(elem.data.text)
    }
    for(let elem of outputNodes){
        this.inputAndOutputLabels.push(elem.data.text)
    }

    this.numInputs = inputNodes.length
    this.numOutputs = outputNodes.length

    console.log(this.inputAndOutputLabels)
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
        $("[data-component=circuitVis]").each(function (index) {
            var opts = {
                orig: this,
                useRunestoneServices: eBookConfig.useRunestoneServices,
            };
            if ($(this).closest("[data-component=timedAssessment]").length == 0) {
                // If this element exists within a timed component, don't render it here
                try {
                    CVList[this.id] = new CV(opts);
                } catch (err) {
                    console.log(
                        `Error rendering Bitwise Operation Problem ${this.id}
                            Details: ${err}`
                    );
                }
            }
        });
    });
