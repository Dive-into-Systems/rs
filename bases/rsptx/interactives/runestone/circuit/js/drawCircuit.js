
"use strict";

import RunestoneBase from "../../common/js/runestonebase.js";
import { Pass } from "codemirror";
import circuitAST from "./circuit_AST/circuitAST.js";
import circuit_generator from "./circuit_generate.js";
import "../css/circuitdraw.css"
import { updateHeight } from "../../../utils/updateHeight.js";
import '../../../utils/tabbedHelpBox.js'
import { tabbedHelpBox } from "../../../utils/tabbedHelpBox.js";

export var DCList = {}; // Object containing all instances of DC that aren't a child of a timed assessment.



/*
\
Pretext params:
truth table: the truth table you want to pre populate the exercise with
numOuputs: the number of outputs in the circuit (either one or two)
numInputs: the number of inputs to the circuit (correspondingly only two or three)
//advancedGates: allow XOR, NAND, NOR, ...
//allowAMA: true if the user is allowed to generate new questiosn afterwards

Example params (passed into pretext) :

                {

                  "truthTable" : [[0,0,1],[0,1,0], [1,0,0], [1,1,1]],
                  "numOutputs" : 1,
                  "numInputs" : 2,
                  "advancedGates" : false,
                  "allowAMA" : true
                  
                }


Example w 2 ouputs:

        {
            "truthTable" : [[0,0,0,1,1],[0,0,1,0,1], [0,1,0,0,1], [0,1,1,0,1], [1,0,0,0,1], [1,0,1,0,1], [1,1,0,0,1], [1,1,1,1,1]],
            "numOutputs" : 2,
            "numInputs" : 3,
            "advancedGates" : false,
            "allowAMA" : true
        }
*/

export default class DC extends RunestoneBase {
   constructor(opts) {
       super(opts);




       //Runestone stuff
       var orig = opts.orig; // entire <p> element
       this.useRunestoneServices = opts.useRunestoneServices;
       this.origElem = orig;
       this.divid = orig.id;

       this.componentId =  this.getCID()




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

        //GOJS related stuff
        this.diagramReady = false;
        this.myDiagram

        //Stores the truth tabel that the user submitted in two forms: labelled object and unlaelled array
        this.userAnswerLabelledTruthTable = [];
        this.userAnswerTruthTable = []

        //Variables related to prepopulating everything
        this.PrePopulatedValues = undefined;
        this.allowAMA = true;
        this.firstQuestionLoaded = false;


        //Grab any params from pretext
        this.setCustomizedParams()

        //validate the truth table: it needs to either have two inputs and one output or three inputs and two outputs

        //So far, this only supports either 2 inputs and 1 output or 3 inputs and 2 outputs. I've tried to make it clear how the parameters are supposed to be passed with the alerts
        if(this.PrePopulatedValues != undefined ){
            if(!((this.PrePopulatedValues.numInputs == 3 && this.PrePopulatedValues.numOutputs == 2) || (this.PrePopulatedValues.numInputs == 2 && this.PrePopulatedValues.numOutputs == 1))){
                alert(`The prepopulated values for this question must either have 2 inputs and 1 output or 3 inputs and 2 outputs. Currently reading ${this.PrePopulatedValues.numInputs} and ${this.PrePopulatedValues.numOutputs}`)
                return;
            }
            if(this.PrePopulatedValues.truthTable.length != 2**this.PrePopulatedValues.numInputs){
                alert(`The truth table is not long enough. Expect length of ${2**this.PrePopulatedValues.numInputs} but instead got ${this.PrePopulatedValues.truthTable.length}`)
            }
            this.truthTable = this.PrePopulatedValues.truthTable;
            this.allowAMA = this.PrePopulatedValues.allowAMA != undefined? this.PrePopulatedValues.allowAMA : true ;
        }
        else{
            //If there are no prepopulating values, we can just generate a new truth table on load
            this.generateRandomTruthTable()
        }



        // Setting outputs based of prepopulated values
       if(this.PrePopulatedValues && !this.firstQuestionLoaded){
            this.numInputs = this.PrePopulatedValues.numInputs;
            this.numOutputs = this.PrePopulatedValues.numOutputs;

            //Presumably one output would imply mode 1
            if(this.numOutputs == 1){
                this.modeOutput = 1;
            }
       }





       this.initDCElement();


       //Sizing the iframe on load
       console.log("about to update height");
        updateHeight(window, document, this, true);
       if (typeof Prism !== "undefined") {
           Prism.highlightAllUnder(this.containerDiv);
       }
       
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


   //The functio that grabs params from pretext
    setCustomizedParams() {
            const currentOptions = JSON.parse(this.scriptSelector(this.origElem).html());
            if (currentOptions["truthTable"] !== undefined) {
                this.PrePopulatedValues = {truthTable: currentOptions["truthTable"], numInputs: currentOptions["numInputs"], numOutputs: currentOptions["numOutputs"], advancedGates : currentOptions["advancedGates"], allowAMA : currentOptions["allowAMA"] }
            }
    }


   /*===========================================
   ====   Functions generating final HTML   ====
   ===========================================*/
   // Component initialization

   //This function sets up everything.



    generateRandomTruthTable = () => {


        //The circuit generator script only supports one output, so we need to make two circuits and 'merge' them to have two outputs

        //generate circuit 1
        let c1;
        if(this.modeOutput == 1){
            c1 = new circuit_generator(["A", "B"], ["AND", "OR", "NOR", "XOR", "NOT"],4,2, true, this.prevCircuit);
        }
        else{
            c1 = new circuit_generator(["A", "B", "C"], ["AND", "OR", "NOR", "XOR", "NOT"],4,2, true, this.prevCircuit);
        }
        //get the boolean algebra for circuit 1
        const s1 = c1.generateStatement();
        this.prevCircuit = s1
        //circuit 1's truth table in array format
        const tt1 = c1.getTruthTable();
 
        //same thing for c2
        const c2 = new circuit_generator(["A", "B", "C"].slice(0,c1.getInformation().numInputs), ["AND", "OR", "NOR", "XOR", "NOT"], 4,2, true, s1)
        const s2 = c2.generateStatement();
        const tt2 = c2.getTruthTable()

        console.log(`Draw Circuits's statements: 1 => ${s1};  2 => ${s2}`)


        //Because the modeSelect HTML gets deleted on generate
        this.numOutputs = this.modeOutput
        
        //Merge the two truth tables into one if necessary
        if(this.numOutputs == 2){

            for(let i = 0; i < tt1.length; i++){
                tt1[i].push(tt2[i][(tt2[i].length-1)])
            }
            this.truthTable = tt1;
            const d1intputs = c1.getInformation().numInputs
            const d2inputs = c2.getInformation().numInputs
            this.numInputs = (d1intputs > d2inputs) ? d1intputs : d2inputs

        }
        else{
            this.truthTable = tt1;
            const d1intputs = c1.getInformation().numInputs
            this.numInputs = d1intputs
        }

        console.log(tt1)
    }

    initDCElement() {


        //Only generate a truth table in two cases
        // (1) No preopulated value
        // (2) Allow AMA is true and the first question has already been loaded
        if(!this.PrePopulatedValues || (this.firstQuestionLoaded && this.allowAMA)){
            this.generateRandomTruthTable()
        }

        // This JSON is used initialie the digram.
        this.startJson = `{ "class": "GraphLinksModel",
        "linkFromPortIdProperty": "fromPort",
        "linkToPortIdProperty": "toPort",
        "nodeDataArray": [`

        //This is how I get the inputs to be labelled A B C D and spaced equally
        //The outputs are number 1 2 3 ...
        this.letters = ['A','B','C','D','E']
        this.outputLetters = [ 'X', 'Y', 'Z']
        for(let i = 0; i < this.numInputs; i++){
            if(i < this.numInputs - 1){
                this.startJson += `{"category":"input","isOn":true,"key":-2,"loc":"${-750} ${-740 + i*80}", "text": "${this.letters[i]}"},`
            }
            else{
                this.startJson += `{"category":"input","isOn":true,"key":-2,"loc":"${-750} ${-740 + i*80}", "text": "${this.letters[i]}"},`
            }

        }
        for(let i = 0; i < this.numOutputs; i++){
            if(i < this.numOutputs - 1){
                this.startJson += `{"category":"output","key":-8,"loc":"${-330 } ${-720 + (i*90)}","isOn":false, "text" : "${this.outputLetters[i]}"},`
            }
            else{
                this.startJson += `{"category":"output","key":-8,"loc":"${-330} ${-720 + (i*90)}","isOn":false, "text" : "${this.outputLetters[i]}"}`
            }

        }
        this.startJson += '], "linkDataArray":[]}'

        console.log(this.startJson)

        console.log(JSON.parse(this.startJson))


        
        //Render the main html
        this.renderDCPromptAndInput();
        



        // replaces the intermediate HTML for this component with the rendered HTML of this component
        if(!this.loaded){
            $(this.origElem).replaceWith(this.containerDiv);
            this.loadExternalScripts()
            this.loaded = true;
        }else{
            this.init()
        }

        this.firstQuestionLoaded = true;


   }

   checkAnswer(){
    //Elem by Elem comparison for the user and answer truth table
    let correct = true;
    for(let i = 0; i < this.userAnswerTruthTable.length; i++){
        for(let j = 0; j < this.userAnswerTruthTable[0].length; j++){
            if(this.userAnswerTruthTable[i][j] != this.truthTable[i][j]){
                correct = false;
            }
        }
    }

    this.correct = correct;

    // Feedback stuff
    const msg = `Anwer is ${correct ? 'correct' : 'incorrect'}`
    console.log(msg)
    this.feedbackHTML = `${msg}`
    this.renderDCFeedbackDiv()
    this.sendData(this.a2ID(correct ? 'correct' : 'incorrect'))
   }
       
    renderDCPromptAndInput() {

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
        this.instructionNode.innerHTML = "<span style='font-weight:bold'><u>Instructions</u></span>: Given the randomly-generated truth table shown below, with inputs [A, B, C, ...] and outputs [1, 2, ...], draw a circuit that implements the truth table.  Select gates from the bank on the left and drag them onto the canvas.  Connect inputs, gates, and outputs to one another by clicking and dragging from the connection points between them."

        this.wrapperDiv.appendChild(this.instructionNode);

        //This the help box you see on the page
        tabbedHelpBox(4, this.wrapperDiv, ["Adding Gates", "Making Connections", "Deleting Gates", "Toggling Inputs"], ["/source/resources/GIFs/AddingGIF.gif", "/source/resources/GIFs/ConnectionGIF.gif", "/source/resources/GIFs/DeletePicture.png", "/source/resources/GIFs/TogglingGIF.gif"])

        const modeDiv= document.createElement('div')
        modeDiv.className = 'outputModeDiv'

        //This is more HTML stuff. It would be a lot more readable in regular HTML format but it needs to be this way so we can access the values
        this.modeSelect = document.createElement("select")

        this.modeSelect.className = "form-control fork-inline mode outputSelect"
        this.mode1Option = document.createElement("option")
        this.mode1Option.value = "1"
        this.mode1Option.textContent = "1"

        this.mode2Option = document.createElement("option")
        this.mode2Option.value = "2"
        this.mode2Option.textContent = "2"


        //If the user is allowed to generate another, then we let mode changes trigger a generate
        if(this.allowAMA){
            this.modeSelect.addEventListener("change", ()=>{ this.modeOutput = Number(this.modeSelect.value); this.generateButton.click()})
        }

        this.modeSelectText = document.createElement("div")
        this.modeSelectText.innerHTML = `<div style="margin-right: 2px;"> <span style='font-weight:bold'><u>Configure Question</u></span>: Select the number of outputs in the circuit: </div>`

        this.modeSelect.append(this.mode1Option)
        this.modeSelect.append(this.mode2Option)


        // Output mode persists despite new uestion generation
        if(this.modeOutput == 1){
            this.mode1Option.selected = "selected"
        }
        else if( (this.allowAMA && this.PrePopulatedValues) || !this.PrePopulatedValues){
            this.mode2Option.selected = "selected"
        }

        modeDiv.append(this.modeSelectText)
        modeDiv.append(this.modeSelect)

        this.statementDiv.append(modeDiv)
        this.wrapperDiv.append(this.statementDiv)

        this.wrapperDiv.append(document.createElement("br"))


        //Configure mode/outputs if numOutputs is prepopulated
        if(this.PrePopulatedValues && !this.firstQuestionLoaded){
            if(this.PrePopulatedValues.numOutputs == 1){
                this.mode1Option.selected = "selected"
                this.numOutputs = 1
            }
            else if(this.PrePopulatedValues.numOutputs == 2){
                this.mode2Option.selected = "selected"
                this.numOutputs = 2
            }
            else{
                alert(`Error in prepopulated num outputs. Expeceted 1 or 2 but got ${this.PrePopulatedValues.numOutputs}`)
            }

        }

        //BTW, GoJS typically looks for a div with a pre-specified ID to set itself up in
        this.gojsDiv = document.createElement("div")

        this.circuitDiv = document.createElement("div")
        const html = "<div id='sample'>"+
            "<div style='width: 100%; display: flex; justify-content: space-between'>" +
            "<div id='palette' style='width: 100px; height: 500px; margin-right: 2px; background-color:rgb(255, 255, 255); border: solid 1px black;'" +
            "></div>"+
            "<div id='myDiagramDiv' class='myDiagramDiv' style='background-color:rgb(255, 255, 255); flex-grow: 1; height: 500px; border: solid 1px black'></div>"+
            "</div>"
        this.circuitDiv.innerHTML = html
        this.textArea = document.createElement("textarea")













        //more HTML stuff
        this.answerDiv = document.createElement("div")

        this.tdH3 = document.createElement("div")
        this.tdH3.textContent = "Truth Table:"
        this.answerDiv.append(this.tdH3)

        this.tableDiv = document.createElement("div")
        this.tableDiv.className = 'tables-container'


        //render out the truth table to prompt the user
        const table = document.createElement("table")
        table.className = 'register-table'
        const th = document.createElement("tr")
        let thInnerHTML = ""
        for(let i = 0; i < this.numInputs; i++){
            thInnerHTML += `<th style='text-align:center;'>${this.letters[i]}</th>`
        }
        for(let i = 0; i < this.numOutputs; i++){
            thInnerHTML += `<th style='text-align:center;'>Output ${this.outputLetters[i]}</th>`
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
        this.gojsDiv.style.marginBottom = "5px"
        this.gojsDiv.append(this.circuitDiv)
        this.answerDiv.append(this.gojsDiv)
        this.wrapperDiv.append(this.answerDiv)


        this.checkButton = document.createElement("button")
        this.checkButton.textContent = "Check Answer"
        this.checkButton.className = 'btn btn-success'


        //check function: get the user cirucit's truth table => check it
        this.checkButton.addEventListener("click", ()=>{
            this.getTruthTable()
            this.checkAnswer()
        })

        this.generateButton = document.createElement("button")
        this.generateButton.textContent = "Generate another question"
        this.generateButton.className = 'btn btn-success'


        if(this.allowAMA){
            this.answerDiv.appendChild(this.generateButton)
            //generate function
            this.generateButton.addEventListener("click", ()=>{
                this.removeEverything()
                this.initDCElement()
                this.sendData(this.a2ID('generate'))
        })
        }
        this.answerDiv.appendChild(this.checkButton)




        this.containerDiv.append(this.wrapperDiv)

        $(this.origElem).children().clone().appendTo(this.containerDiv);

    }


    

    //This does the HTML stuff to render the user's truth table in feedback div
    renderFeedbackTruthTable () {


        //This is almost a 1-1 analog of the code from earlier to render to front-facing truth table in the prompt, but this uses
        // the truth table from the user's circuit

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
            thInnerHTML += `<th style='text-align:center;'>Output ${this.outputLetters[i]}</th>`
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


    //Handles the HTML side of the feedback 
    renderDCFeedbackDiv() {

        //clean up the old feedback div to make space for the new one
        // It's like the circle of life but for a pretext component 
        if(this.feedbackDiv){
            this.feedbackDiv.remove()
        }
        this.feedbackDiv = document.createElement("div")


        const correctDiv = document.createElement("div")

        //The second case should never be taken
        const msg = this.feedbackHTML ? this.feedbackHTML : ''
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


    //TODO: at some point in the future
    sendData(actionId) {
       
        let details = {}


        if(this.id2A(actionId) == 'correct' || this.id2A(actionId) == 'incorrect'){
            details.answers = this.truthTable;
        }
        if(this.id2A(actionId) == 'incorrect'){
            details.userAnswers = this.userAnswerTruthTable
        }

        details.config = {}

        details.config.mode = this.modeSelect.value


        this.logData(null, details, actionId, this.componentId);
    }

    //This loads in the GOJs script tags
    //Figures.js needs go js to work, hence the delayed import 
    //I apologize for how diabolical the nested .then s are.
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
                go.Diagram.licenseKey =
"2b8647e1b2604fc702d90676423d6bbc5cf07d34cd960ef6590015f5ec5b6f40729be17906dad8c4d3f04df9487ac6d9ddc26c2ac31b003fe165d2df10f096ffb26424b2165b47daa40321c390f22ca0a97078f7cbb374a3dd7ed9f0effbc5985abcf2d740c95cb3792d0635066cbf4ce2abdf7bab52cd5d7b6e99a4fef6a856fa";
                import('./figures.js').then(()=>self.init())
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

        //The default sizing/colors for nodes
        const shapeStyle = () => {
            return {
                name: 'NODESHAPE',
                fill: this.gray,
                stroke: this.darkGray,
                desiredSize: new go.Size(40, 40),
                strokeWidth: 2
            };
        }

        //Default position, shape, etc. of ports (the things you drag connections to)
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

        const BottomLabelAlignment = new go.Spot(0.5, 1, 0, 10);


        //The text bindings are how I get the number/category type on the input. What's weird is that margin doesn't seem to work
        //changing this will be a pain.

        //Basically, the way this works is that you
        // (1) Set basic styl aspects of the template
        // (2) Add any necessary shape/art
        // (3) Add text and bidnings
        // *Binding binds the value of some feature of the template to a variable
        //For example, one of the text blocks below is bound to the input value

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

        // add the templates created above to this.myDiagram and palette
        this.myDiagram.nodeTemplateMap.add('input', inputTemplate);
        this.myDiagram.nodeTemplateMap.add('output', outputTemplate);

        this.myDiagram.nodeTemplateMap.add('and', andTemplate);
        this.myDiagram.nodeTemplateMap.add('or', orTemplate);
        this.myDiagram.nodeTemplateMap.add('not', notTemplate);


        if((this.modeOutput == 2 && !this.PrePopulatedValues) || (this.PrePopulatedValues && this.PrePopulatedValues.advancedGates) ){
            this.myDiagram.nodeTemplateMap.add('xor', xorTemplate);
            this.myDiagram.nodeTemplateMap.add('nand', nandTemplate);
            this.myDiagram.nodeTemplateMap.add('nor', norTemplate);
        }


        // share the template map with the Palette
        //make a map for palette
        const paletteMap = this.myDiagram.nodeTemplateMap;
        // paletteMap.remove('input')
        // paletteMap.remove('output')


        palette.nodeTemplateMap = paletteMap;

        let ndArr = []
        ndArr.push({ category: 'and' })
        ndArr.push({ category: 'or' })
        ndArr.push({ category: 'not' })

        if((this.modeOutput == 2 && !this.PrePopulatedValues) || (this.PrePopulatedValues && this.PrePopulatedValues.advancedGates) ){
            ndArr.push({ category: 'nor' })
            ndArr.push({ category: 'nand' })
            ndArr.push({ category: 'xor' })
        }

        palette.model.nodeDataArray = ndArr
        // load the initial diagram
        this.load();

        this.diagramReady = true;


        // continually update the diagram
        this.loop();

      }

    //Periodicall update states (this is reduntant, but I think it's redundant in a good way)
    loop() {
        this.timeoutId = setTimeout(() => {
        this.updateStates();
        this.loop();
        }, 750);
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


    load = () => {
        this.myDiagram.model = go.Model.fromJson(this.startJson);
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
