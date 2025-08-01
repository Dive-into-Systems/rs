// *********
// numconv.js
// *********
// This file contains the JS for the Runestone numberconversion component. It was created By Luyuan Fan, Zhengfei Li, and Yue Zhang, 06/01/2023
"use strict";


import RunestoneBase from "../../common/js/runestonebase.js";
import aj_x86 from "./AJ_ISAs/aj_x86class.js";
import aj_arm64 from "./AJ_ISAs/aj_arm64class.js";
import aj_ia32 from "./AJ_ISAs/aj_ia32class.js"
import { nanoid } from 'nanoid/non-secure';
import "./assembly-i18n.en.js";
// import "./NC-i18n.pt-br.js";
import "../css/assembly_jump.css";
import { Pass } from "codemirror";
export var AJList = {}; // Object containing all instances of NC that aren't a child of a timed assessment.
import {MinSelectBox} from "../../../utils/MinSelectBox.js";
import { updateHeight } from "../../../utils/updateHeight.js";

// NC constructor
export default class AJ extends RunestoneBase {
    constructor(opts) {
        super(opts);
        var orig = opts.orig; // entire <p> element
        this.useRunestoneServices = opts.useRunestoneServices;
        this.origElem = orig;
        this.divid = orig.id;

        // Default configuration settings
        this.correct = null;
        this.num_bits = 8;
        this.prev_num = -1;
        
        // Fields for logging data
        this.componentId = this.getCID();
        this.questionId = 1;
        this.userId = this.getUserId();

        //unit test stuff
        this.runUnitTests = false;
        this.UTRax = 0;
        this.UTRcx = 0;
        this.jump = 0;

        //for prepopulating
        this.prePopulatedValues = undefined;
        this.firstQuestionFinished = false;
        this.setCustomizedParams();


        this.createAJElement();

        // this.addCaption("runestone");
        // this.checkServer("nc", true);
        if (typeof Prism !== "undefined") {
            Prism.highlightAllUnder(this.containerDiv);
        }

        this.contWrong = 0;
        updateHeight(window, document, this, true);
        this.sendData(this.a2ID("load"));
    }
    // Find the script tag containing JSON in a given root DOM node.
    scriptSelector(root_node) {
        return $(root_node).find(`script[type="application/json"]`);
    }
    /*===========================================
    ====   Functions generating final HTML   ====
    ===========================================*/
    // Create the NC Element

    //This is the function that grabs JSON parameters from pretext
    setCustomizedParams() {
        const currentOptions = JSON.parse(this.scriptSelector(this.origElem).html());
        //the ISA parameter (architecture)
        if (currentOptions["architecture"] !== undefined) {
            this.archSelect = currentOptions["architecture"];
        }

        // parameters related to prepopulating the question
        if(currentOptions["instructions"] && currentOptions["mode"]){
            this.prePopulatedValues = {}
            this.prePopulatedValues.instructions = currentOptions["instructions"]
            this.prePopulatedValues.mode = currentOptions['mode']
            this.prePopulatedValues.r1InitVal = currentOptions['r1InitVal']
            this.prePopulatedValues.r2InitVal = currentOptions['r2InitVal']
            this.prePopulatedValues.allowAMA = currentOptions['allowAMA'] ? currentOptions['allowAMA'] : false;
            if(this.prePopulatedValues.mode == 1){
                this.prePopulatedValues.jumpTaken = currentOptions['jumpTaken']
            }
            else{
                this.prePopulatedValues.r1Val = currentOptions['r1Val']
                this.prePopulatedValues.r2Val = currentOptions['r2Val']
            }
        }

        //assuming no preopopulation, this sets the ISA of the class used to generate instructions
        switch (this.archSelect) {
            case "X86_64":
                this.arch = new aj_x86();
                this.regA = "rax";
                this.regB = "rcx";
                break;
            case "ia_32":
                this.arch = new aj_ia32();
                this.regA = "eax";
                this.regB = "ecx";
                break;
            case "arm_64":
                this.arch = new aj_arm64();
                this.regA = "X0";
                this.regB = "X1";
                break;
            default:
                throw new Error("Invalid architecture option");
        }
    };

    //Master functoin that renders everything
    createAJElement() {
        this.renderAJPromptAndInput();
        if(!this.prePopulatedValues || (this.prePopulatedValues && this.prePopulatedValues.allowAMA && this.firstQuestionFinished)){
            this.renderAnswerDiv();
        }
        else{
            this.renderAnswerDivPrepopulated()
        }
        this.renderAJButtons();
        this.renderAJFeedbackDiv();
        // replaces the intermediate HTML for this component with the rendered HTML of this component
        $(this.origElem).replaceWith(this.containerDiv);
    }

    //renders prompt and input

    //this function does all the HTML stuff for the prompt and input
    renderAJPromptAndInput() {

        // Generate the two dropdown menus for number conversion
        this.containerDiv = document.createElement("div");
        this.containerDiv.id = this.divid;

        this.statementDiv = document.createElement("div");

        this.instructionNode = document.createElement("div");
        this.instructionNode.style.padding = "10px";
        this.instructionNode.innerHTML = "<span style='font-weight:bold'><u>Instructions</u></span>: Given two register values and a small block of assembly code containing a jump instruction, determine:"
        this.configHelperText = document.createElement("div");
        this.configHelperText.innerHTML = "<span style='font-weight:bold'><u>Configure question</u></span>:";
        this.containerDiv.appendChild(this.instructionNode);
        this.statementDiv.appendChild(this.configHelperText);
        this.containerDiv.appendChild(this.statementDiv);
        this.containerDiv.append(document.createElement("br"))

        //I don't think this is used anywhere anymore, but it used to let you choose an ISA
        this.X86Option = document.createElement("option")
        this.X86Option.value = "X86_64"
        this.X86Option.textContent = "X86_64"

        this.IA32Option = document.createElement("option")
        this.IA32Option.value = "ia_32"
        this.IA32Option.textContent = "ia_32"
        
        this.ARM64Option = document.createElement("option")
        this.ARM64Option.value = "arm_64"
        this.ARM64Option.textContent = "arm_64"


        this.statementDiv.className = "statement-div";


        //MOde descriptions
        const modeDiv= document.createElement('div')
        modeDiv.innerHTML  = 'Please choose a mode <br> <ul> <li>Mode 1: whether or not the jump instruction will be taken.</li> <li>Mode 2: the values of the registers after the code block executes.</li></ul>'
        this.statementDiv.appendChild(modeDiv)

        this.modeStatementNode = document.createTextNode("Select a mode:")
        this.statementDiv.appendChild(this.modeStatementNode);
        
        this.modeSelect = document.createElement("select")
        this.modeSelect.className = "form-control fork-inline mode"
        this.mode1Option = document.createElement("option")
        this.mode1Option.value = "1"
        this.mode1Option.textContent = "1"
        this.modeSelect.append(this.mode1Option)

        this.mode2Option = document.createElement("option")
        this.mode2Option.value = "2"
        this.modeSelect.append(this.mode2Option)
        this.mode2Option.textContent = "2"



        //To set a default mode if there are prepopulated values
        if(this.prePopulatedValues && !this.firstQuestionFinished){
            if(this.prePopulatedValues.mode == 1){
                this.mode1Option.selected = 'selected'
            }
            else{
                this.mode2Option.selected = 'selected'
            }
        }
        else{
            this.mode2Option.selected = "selected"
        }

        //Changing the mode generates a new question
        if((this.prePopulatedValues && this.prePopulatedValues.allowAMA) || !this.prePopulatedValues){
            this.modeSelect.addEventListener("change", ()=>this.generateButton.click())
        }


        this.statementDiv.append(this.modeSelect)

        this.statementDiv.append(document.createElement("br"))

        this.comparisonOptionsDiv = document.createElement("div")
        this.comparisonOptionsDiv.className = "compOptionsDiv"
        this.comparisonOptionsText = document.createElement("span")
        this.comparisonOptionsText.textContent = "Choose which types of comparison instructions should appear:"

        if((this.prePopulatedValues && this.prePopulatedValues.allowAMA) || !this.prePopulatedValues){
        this.comparisonOptionsDiv.append(this.comparisonOptionsText)
            this.checkBoxes = MinSelectBox(this.comparisonOptionsDiv, 1, ["cmpBox", "testBox"], ["cmp", "test"], [true, false], "Pick Comparison Instruction");
            this.statementDiv.appendChild(this.comparisonOptionsDiv)
        }
        // create the node for the prompt
        this.promptDiv = document.createElement("div");
        this.promptDiv.style.fontSize = "x-large";


        

        this.containerDiv.appendChild(this.promptDiv);
        this.containerDiv.appendChild(document.createElement("br"));



        this.feedbackDiv = document.createElement("div");
        this.feedbackDiv.setAttribute("id", this.divid + "_feedback");

        // Copy the original elements to the container holding what the user will see.
        $(this.origElem).children().clone().appendTo(this.containerDiv);

        // Remove the script tag.
        this.scriptSelector(this.containerDiv).remove();
        // Set the class for the text inputs, then store references to them.
        let ba = $(this.containerDiv).find(":input");
        ba.attr("class", "form form-control selectwidthauto");
        ba.attr("aria-label", "input area");
        this.blankArray = ba.toArray();
        // Set the style of code
        $(this.containerDiv).find("code").attr("class","tex2jax_ignore");
        // When a blank is changed mark this component as interacted with.
        // And set a class on the component in case we want to render components that have been used
        // differently
        for (let blank of this.blankArray) {
            $(blank).change(this.recordAnswered.bind(this));
        }
    }

    //the div that contains the instructions, answer
    renderAnswerDiv(){
        console.log(this.modeSelect.value)


        //starting value of rax/rcx
        const raxInitValue = this.arch.rax ? this.arch.rax : this.rax
        const rcxInitValue = this.arch.rcx ? this.arch.rcx : this.rcx
        
        this.r1InitVal = raxInitValue;
        this.r2InitVal = rcxInitValue;


        //different HTML for modes 2 and 3
        //Not going to comment this up since it's fairly straightforward (I think/I hope/ I'll feel really bad if this ends up being a problem later)
        if(this.modeSelect.value == 2){
            const tableHTML ="<div class='tables-container'><div class='table-wrapper'>" +
            "<table class='register-table'><caption>Registers:</caption><thead>"+
            "<tr><th>Register</th><th>Current Value</th><th>Post Instruction Value</th></tr>"+
            "</thead>" +
            `<tbody><tr><td>${this.regA}</td><td>${this.arch.rax}</td>`+
            `<td><input class="raxInput" type='text' placeholder='${raxInitValue}'></td></tr>`+
            `<tr><td>${this.regB}</td><td>${this.arch.rcx}</td>`+ 
            `<td><input class="rcxInput" type='text' placeholder='${rcxInitValue}'></td></tr>`+
            `</tbody></table>`+
            "</div></div>"
    
            
            this.answerDiv = document.createElement('div')
            this.answerDiv.className = "answerDiv"
    
    
            this.codeDiv = document.createElement('div')
            this.codeDiv.className = "codeDiv"
            this.answerDiv.append(this.codeDiv);
    
            this.codeBox = document.createElement('code')
            this.codeBox.style = "padding: 0px;"
            
            this.codeBox.innerHTML = this.generateCode();
            this.codeDiv.append(this.codeBox);
            
            this.inputsDiv = document.createElement("div")
            this.inputsDiv.className = "inputsDiv"
            this.inputsDiv.innerHTML = tableHTML;
    
    
            this.RAXInput = this.inputsDiv.getElementsByClassName("raxInput")[0]
            this.RAXInput.name = "rax"
            this.RAXInput.placeholder = "%rax's value"
            this.RAXInput.style = " margin-bottom: 3%;"
    
    
            this.RCXInput = this.inputsDiv.getElementsByClassName("rcxInput")[0]
            this.RCXInput.name = "rcx"
            this.RCXInput.placeholder = "%rcx's value"
    
    
            
    
    
            this.answerDiv.append(this.inputsDiv)
    
            this.containerDiv.append(this.answerDiv)
        }
        else{

            const tableHTML ="<div class='tables-container'><div class='table-wrapper'>" +
            "<table class='register-table'><caption>Registers:</caption><thead>"+
            "<tr><th>Register</th><th>Current Value</th><th><em>Jump Taken?</em></th></tr>"+
            "</thead>" +
            `<tbody><tr><td>${this.regA}</td><td>${this.arch.rax}</td>`+
            `<td rowspan='2' class="radioLocation"></td></tr>`+
            `<tr><td>${this.regB}</td><td>${this.arch.rcx}</td>`+ 
            `</tr>`+
            `</tbody></table>`+
            "</div></div>"

            this.inputsDiv = document.createElement("div")
            this.inputsDiv.className = "inputsDiv"
            this.inputsDiv.innerHTML = tableHTML;

            this.answerDiv = document.createElement('div')
            this.answerDiv.className = "answerDiv"

                
            this.codeDiv = document.createElement('div')
            this.codeDiv.className = "codeDiv"
            this.answerDiv.append(this.codeDiv);
    
            this.codeBox = document.createElement('code')
            
            this.codeBox.innerHTML = this.generateCodeMode1();
            this.codeDiv.append(this.codeBox);
            



            this.radioLocation = this.inputsDiv.getElementsByClassName("radioLocation")[0]
            this.subRadioLocation = document.createElement("div")
            this.subRadioLocation.className = "subRadioLocation"
            this.yesDiv = document.createElement("div")
            this.yesDiv.className = "radioDiv"
            this.rYes = document.createElement("input")
            this.rYes.type = "radio"
            this.rYes.className = `radioYes`
            this.rYes.value = `radioYes`
            this.rYes.name = `radio`
            this.rYesLabel = document.createElement("label")
            this.rYesLabel.setAttribute("for", `radioYes`)
            this.rYesLabel.textContent = "yes"
            this.rYesLabel.className = "rLabel"


            this.noDiv = document.createElement("div")
            this.noDiv.className = "radioDiv"
            this.rNo = document.createElement("input")
            this.rNo.value = `radioNo`
            this.rNo.type = "radio"
            this.rYes.className = `radioNo`
            this.rNo.name = `radio`
            this.rNoLabel = document.createElement("label")
            this.rNoLabel.setAttribute("for", `radioNo`)
            this.rNoLabel.textContent = "no"
            this.rNoLabel.className = "rLabel"

            this.yesDiv.append(this.rYesLabel)
            this.yesDiv.append(this.rYes)
            this.noDiv.append(this.rNoLabel)
            this.noDiv.append(this.rNo)

            this.subRadioLocation.append(this.yesDiv)
            this.subRadioLocation.append(this.noDiv)

            this.radioLocation.append(this.subRadioLocation)

            this.inputsDiv.className = "radioInputDiv"

            this.answerDiv.append(this.inputsDiv)
            this.containerDiv.append(this.answerDiv)
        }
        

    }


    //Opted to just use a different function if there's prepopulated values
    //I have it that way because all the values come from a completely different source when prepopulated
    // This gets called if the first question hasn't been finished and prepoulated values is defined
    renderAnswerDivPrepopulated(){
        console.log(this.modeSelect.value)


        const raxInitValue = this.prePopulatedValues.r1InitVal
        const rcxInitValue = this.prePopulatedValues.r2InitVal
        



        if(this.prePopulatedValues.mode == 2){
            const tableHTML ="<div class='tables-container'><div class='table-wrapper'>" +
            "<table class='register-table'><caption>Registers:</caption><thead>"+
            "<tr><th>Register</th><th>Current Value</th><th>Post Instruction Value</th></tr>"+
            "</thead>" +
            `<tbody><tr><td>${this.regA}</td><td>${raxInitValue}</td>`+
            `<td><input class="raxInput" type='text' placeholder='${raxInitValue}'></td></tr>`+
            `<tr><td>${this.regB}</td><td>${rcxInitValue}</td>`+ 
            `<td><input class="rcxInput" type='text' placeholder='${rcxInitValue}'></td></tr>`+
            `</tbody></table>`+
            "</div></div>"
    
            
            this.answerDiv = document.createElement('div')
            this.answerDiv.className = "answerDiv"
    
    
            this.codeDiv = document.createElement('div')
            this.codeDiv.className = "codeDiv"
            this.answerDiv.append(this.codeDiv);
    
            this.codeBox = document.createElement('code')
            this.codeBox.style = "padding: 0px;"
            
            this.codeBox.innerHTML = this.prePopulatedValues.instructions;
            this.codeDiv.append(this.codeBox);
            
            this.inputsDiv = document.createElement("div")
            this.inputsDiv.className = "inputsDiv"
            this.inputsDiv.innerHTML = tableHTML;
    
    
            this.RAXInput = this.inputsDiv.getElementsByClassName("raxInput")[0]
            this.RAXInput.name = "rax"
            this.RAXInput.placeholder = "%rax's value"
            this.RAXInput.style = " margin-bottom: 3%;"
    
    
            this.RCXInput = this.inputsDiv.getElementsByClassName("rcxInput")[0]
            this.RCXInput.name = "rcx"
            this.RCXInput.placeholder = "%rcx's value"
    
    
            
    
    
            this.answerDiv.append(this.inputsDiv)
    
            this.containerDiv.append(this.answerDiv)
        }
        else{

            const tableHTML ="<div class='tables-container'><div class='table-wrapper'>" +
            "<table class='register-table'><caption>Registers:</caption><thead>"+
            "<tr><th>Register</th><th>Current Value</th><th><em>Jump Taken?</em></th></tr>"+
            "</thead>" +
            `<tbody><tr><td>${this.regA}</td><td>${this.prePopulatedValues.r1InitVal}</td>`+
            `<td rowspan='2' class="radioLocation"></td></tr>`+
            `<tr><td>${this.regB}</td><td>${this.prePopulatedValues.r2InitVal}</td>`+ 
            `</tr>`+
            `</tbody></table>`+
            "</div></div>"

            this.inputsDiv = document.createElement("div")
            this.inputsDiv.className = "inputsDiv"
            this.inputsDiv.innerHTML = tableHTML;

            this.answerDiv = document.createElement('div')
            this.answerDiv.className = "answerDiv"

                
            this.codeDiv = document.createElement('div')
            this.codeDiv.className = "codeDiv"
            this.answerDiv.append(this.codeDiv);
    
            this.codeBox = document.createElement('code')
            
            this.codeBox.innerHTML = this.prePopulatedValues.instructions;
            this.codeDiv.append(this.codeBox);
            



            this.radioLocation = this.inputsDiv.getElementsByClassName("radioLocation")[0]
            this.subRadioLocation = document.createElement("div")
            this.subRadioLocation.className = "subRadioLocation"
            this.yesDiv = document.createElement("div")
            this.yesDiv.className = "radioDiv"
            this.rYes = document.createElement("input")
            this.rYes.type = "radio"
            this.rYes.className = `radioYes`
            this.rYes.value = `radioYes`
            this.rYes.name = `radio`
            this.rYesLabel = document.createElement("label")
            this.rYesLabel.setAttribute("for", `radioYes`)
            this.rYesLabel.textContent = "yes"
            this.rYesLabel.className = "rLabel"


            this.noDiv = document.createElement("div")
            this.noDiv.className = "radioDiv"
            this.rNo = document.createElement("input")
            this.rNo.value = `radioNo`
            this.rNo.type = "radio"
            this.rYes.className = `radioNo`
            this.rNo.name = `radio`
            this.rNoLabel = document.createElement("label")
            this.rNoLabel.setAttribute("for", `radioNo`)
            this.rNoLabel.textContent = "no"
            this.rNoLabel.className = "rLabel"

            this.yesDiv.append(this.rYesLabel)
            this.yesDiv.append(this.rYes)
            this.noDiv.append(this.rNoLabel)
            this.noDiv.append(this.rNo)

            this.subRadioLocation.append(this.yesDiv)
            this.subRadioLocation.append(this.noDiv)

            this.radioLocation.append(this.subRadioLocation)

            this.inputsDiv.className = "radioInputDiv"

            this.answerDiv.append(this.inputsDiv)
            this.containerDiv.append(this.answerDiv)
        }
        

    }


    //get rid of all the buttons
    clearButtons(){
        this.generateButton.remove()
        this.submitButton.remove()
        this.helpButton.remove()
        if(this.runUnitTests && this.unitTestButton){
            this.unitTestButton.remove()
        }
    }

    // TBH Not sure what this one does
    recordAnswered() {
        this.isAnswered = true;
    }



    //renders the buttons. There's some weird logic in some of the event listeners to ensure that the right logic get's called
    // if there are prepopulated values
    renderAJButtons() {
        // "check me" button and "generate a number" button
        this.submitButton = document.createElement("button");
        this.submitButton.textContent = $.i18n("Check Answer");
        $(this.submitButton).attr({
            class: "btn btn-success",
            name: "answer",
            type: "button",
        });
        // check the answer when the conversion is valid
        this.submitButton.addEventListener("click", () => {
            if(this.feedbackDiv){
                this.feedbackDiv.remove()
            }
            this.clearHelp()

            if(!this.prePopulatedValues || (this.prePopulatedValues && this.prePopulatedValues.allowAMA && this.firstQuestionFinished)){
                this.checkCurrentAnswer();
            }
            else{
                this.checkCurrentAnswerPrepopulated()
            }
            this.logCurrentAnswer();
    
        });

        this.generateButton = document.createElement("button");
        this.generateButton.textContent = $.i18n("Generate another question");
        $(this.generateButton).attr({
            class: "btn btn-success",
            name: "generate a number",
            type: "button",
        });
        // generate a new number for conversion 
        this.generateButton.addEventListener("click", () => {

            //if the generate button has been pressed, the prepopulated question is guaranteed to be gone for good
            this.firstQuestionFinished = true;

            this.clearAnswer();

            //No longer relevant, but I'm not going to delete this incase we later need it
            if(!this.runUnitTests){
                if (this.archSelect == "X86_64"){
                    this.arch = new aj_x86();
                    this.regA = "rax";
                    this.regB = "rcx";
                } else if (this.archSelect == "ia_32"){
                    this.arch = new aj_ia32();
                    this.regA = "eax";
                    this.regB = "ecx";
                } else if (this.archSelect == "arm_64"){
                    this.arch = new aj_arm64();
                    this.regA = "X0";
                    this.regB = "X1";
                }
            }
            else{
                if (this.archSelect == "X86_64"){
                    this.arch = new aj_x86(this.runUnitTests, this.UTRax, this.UTRcx, this.jump);
                    this.regA = "rax";
                    this.regB = "rcx";
                } else if (this.archSelect == "ia_32"){
                    this.arch = new aj_ia32(this.runUnitTests, this.UTRax, this.UTRcx, this.jump);
                    this.regA = "eax";
                    this.regB = "ecx";
                } else if (this.archSelect == "arm_64"){
                    this.arch = new aj_arm64(this.runUnitTests, this.UTRax, this.UTRcx, this.jump);
                    this.regA = "X0";
                    this.regB = "X1";
                }
            }


            if(!this.prePopulatedValues || (this.prePopulatedValues && this.prePopulatedValues.allowAMA && this.firstQuestionFinished)){
                this.renderAnswerDiv();
            }
            else{
                this.renderAnswerDivPrepopulated()
            }
            this.renderAJButtons()

            this.sendData(this.a2ID("generate"))
            
        });



        //the show help button
        this.helpButton = document.createElement("button");
        this.helpButton.textContent = $.i18n("Get Help");
        $(this.helpButton).attr({
            class: "btn btn-success",
            name: "Get Help",
            type: "button",
        });
        this.helpButton.addEventListener("click", ()=>{this.renderHelp(); this.sendData(this.a2ID("help"))})

        this.unitTestButton = document.createElement("button")
        this.unitTestButton.textContent = "Unit Test!"
        this.unitTestButton.addEventListener("click", ()=>this.UnitTest())
        if(this.runUnitTests){
            this.containerDiv.append(this.unitTestButton)
        }



        if(!this.prePopulatedValues || (this.prePopulatedValues && this.prePopulatedValues.allowAMA )){
            this.containerDiv.appendChild(this.generateButton);
        }
        this.containerDiv.appendChild(this.helpButton)
        this.containerDiv.appendChild(this.submitButton);


    }

    renderAJFeedbackDiv() {
        // this.containerDiv.appendChild(document.createElement("br"));
        this.containerDiv.appendChild(this.feedbackDiv);
    }

    // clear the input field
    clearAnswer() {
        this.feedbackDiv.remove();
        this.answerDiv.remove();
        this.clearHelp()
        this.clearButtons()
    }

    // Convert an integer to its binary expression with leading zeros as a string.
    // The string always has length of this.num_bits
    toBinary(num) {
        var str = num.toString(2);
        if (str.length < this.num_bits) {
            var leading_zeros = "";
            for ( var i = str.length ; i < this.num_bits; i ++ ) {
                leading_zeros += "0";
            }
            str = leading_zeros + str;
        }
        return str;
    }
    // Convert an integer to its hexadecimal expression with leading zeros as a string.
    // The string always has length of this.num_bits / 4
    toHexadecimal(num) {
        var str = num.toString(16);
        var target_len = Math.ceil(this.num_bits / 4);
        if (str.length < target_len) {
            var leading_zeros = "";
            for ( var i = str.length ; i < target_len; i ++ ) {
                leading_zeros += "0";
            }
            str = leading_zeros + str;
        }
        return str;
    }

    generateCodeMode1 (){
        let codeBlock = "";
        let CmpOrTst = 0;
        if(this.checkBoxes[0].checked && this.checkBoxes[1].checked){
            CmpOrTst = Math.floor(Math.random() * 2);
        } else if (!this.checkBoxes[0].checked){
            CmpOrTst = 1;
        }
        if(CmpOrTst == 0){
            codeBlock += this.arch.compare();
            codeBlock += "<br>";
        }else{
            codeBlock += this.arch.test();
            codeBlock += "<br>";
        }  
        this.jumpInfo = this.arch.jumps();
        codeBlock += this.jumpInfo.code;
        if(this.archSelect == "X86_64"){
            codeBlock += " label1<br>add $1, %rax<br><br>label1:<br>add $2, %rax "; 
        } else if (this.archSelect == "ia_32"){
            codeBlock += " label1<br>add $1, %eax<br><br>label1:<br>add $2, %eax "; 
        } else {
            codeBlock += " label1<br>add X0, X0, #1<br><br>label1:<br>add X0, X0, #2"; 
        }
        
        this.rax = this.arch.rax;
        this.rcx = this.arch.rcx;

        return codeBlock;
        
    }
    generateCode() {
        let codeBlock = "";
        let CmpOrTst = 0;
        if(this.checkBoxes[0].checked && this.checkBoxes[1].checked){
            CmpOrTst = Math.floor(Math.random() * 2);
        } else if (!this.checkBoxes[0].checked){
            CmpOrTst = 1;
        }

        let AddOrSub = Math.floor(Math.random() * 2);
        let IfElseOrder = Math.floor(Math.random()*2)
        this.rax = this.arch.rax;
        this.rcx = this.arch.rcx;

        let locrax = this.arch.rax;
        let locrcx = this.arch.rcx;

        
        if(CmpOrTst == 0){
            codeBlock += this.arch.compare();
            codeBlock += "<br>";
        }else{
            codeBlock += this.arch.test();
            codeBlock += "<br>";
        }  
        this.jumpInfo = this.arch.jumps();
        codeBlock += this.jumpInfo.code;
        if(IfElseOrder == 0){
            codeBlock += " label1<br>"; 
        } else{
            codeBlock += " label2<br><br>label1:<br>"
        }
        if (AddOrSub == 0){
            codeBlock += this.arch.operations["add"]();
            codeBlock += "<br>";
        }else{
            codeBlock += this.arch.operations["sub"]();
            codeBlock += "<br>";
        }  
        if(this.jumpInfo.result == true){
            this.arch.rax = locrax;
            this.arch.rcx = locrcx;
        }
        if(this.jumpInfo.result == false){
            locrax = this.arch.rax ;
            locrcx = this.arch.rcx;
        }
        if(this.archSelect != "arm_64"){
            codeBlock += "jmp DONE"
        }
        else{
            codeBlock += "b DONE"
        }
        if(IfElseOrder == 0){
            codeBlock += " <br><br>label1: <br>"; 
        } else{
            codeBlock += " <br><br>label2: <br>"
        }
        AddOrSub = Math.floor(Math.random() * 2);
        if (AddOrSub == 0){
            codeBlock += this.arch.operations["add"]();
            codeBlock += "<br>";
        }else{
            codeBlock += this.arch.operations["sub"]();
            codeBlock += "<br>";
        }
        codeBlock += "DONE:";

        if(this.jumpInfo.result == false){
            this.arch.rax = locrax ;
            this.arch.rcx = locrcx ;
        }
    
        return codeBlock
        
    }


    // check if the conversion is valid  
    checkValidConversion() {
        this.hideFeedback();

        
    }
    
    // check if the answer is correct
    checkCurrentAnswer() {
        this.correct = false;
        console.log("rax:" + this.arch.rax);
        console.log("rcx:" + this.arch.rcx);
        if(this.modeSelect.value == "2"){
            this.feedback_msg = "";

            if(this.RAXInput.value == this.arch.rax && this.RCXInput.value == this.arch.rcx){
                this.correct = true;
                this.feedback_msg += $.i18n("msg_asm_correct");
            } else{
                this.feedback_msg += $.i18n("msg_asm_incorrect");

                
            }
            this.renderFeedback();
        }
        else{
            this.feedback_msg = "";
            let linkISA = "x86_64";

            if(this.archSelect == "X86_64"){
                linkISA = "x86_64"
            }
            else if(this.archSelect == "ia_32"){
                linkISA = "x86"
            }
            else if(this.archSelect == "arm_64"){
                linkISA = "arm64"
            }
            if(this.jumpInfo.result && this.rYes.checked && !this.rNo.checked){
                this.correct = true;
                this.feedback_msg += $.i18n("msg_asm_correct");
            }
            else if(!this.jumpInfo.result && !this.rYes.checked  && this.rNo.checked){
                this.correct = true;
                this.feedback_msg += $.i18n("msg_asm_correct");
            }
            else{

                let raxVal;
                let rcxVal;

                if(this.prePopulatedValues && !this.firstQuestionFinished){
                    raxVal = this.prePopulatedValues.r1InitVal;
                    rcxVal = this.prePopulatedValues.r2InitVal;
                }
                else{
                    raxVal = this.rax;
                    rcxVal = this.rcx;
                }

                this.feedback_msg += $.i18n("msg_asm_incorrect");
                let asmLink = `https://asm.diveintosystems.org/arithmetic/${linkISA}/`
                // asmLink += this.codeBox.innerHTML.split("<br>").join("%0A").split(",").join("%2C").split("%").join("%25").split(":").join("%3A").split(' ').join("%20")
                asmLink += encodeURIComponent(this.codeBox.innerHTML.split("<br>").join("\n"))
                asmLink += `/0/0/0/0/${raxVal}/${rcxVal}/0`
                console.log(asmLink)
                this.feedback_msg += `<a className="asmLink" href='${asmLink}' target='_blank'> Try it in ASM Visualizer! </a>`
                


            }
            this.renderFeedback();
        }
        
        if(this.correct){
            this.sendData(this.a2ID("correct"))
        }
        else{
            this.sendData(this.a2ID("incorrect"))
        }

    }


    //different source of answers when preopulated
    checkCurrentAnswerPrepopulated(){

        this.correct = false;
        console.log("rax:" + this.prePopulatedValues.r1Val);
        console.log("rcx:" + this.prePopulatedValues.r2Val);
        if(this.prePopulatedValues.mode == "2"){
            this.feedback_msg = "";

            if(this.RAXInput.value == this.prePopulatedValues.r1Val && this.RCXInput.value == this.prePopulatedValues.r2Val){
                this.correct = true;
                this.feedback_msg += $.i18n("msg_asm_correct");
            } else{
                this.feedback_msg += $.i18n("msg_asm_incorrect");

                
            }
            this.renderFeedback();
        }
        else{
            this.feedback_msg = "";
            let linkISA = "x86_64";

            if(this.archSelect == "X86_64"){
                linkISA = "x86_64"
            }
            else if(this.archSelect == "ia_32"){
                linkISA = "x86"
            }
            else if(this.archSelect == "arm_64"){
                linkISA = "arm64"
            }
            if(this.prePopulatedValues.jumpTaken && this.rYes.checked && !this.rNo.checked){
                this.correct = true;
                this.feedback_msg += $.i18n("msg_asm_correct");
            }
            else if(!this.prePopulatedValues.jumpTaken && !this.rYes.checked  && this.rNo.checked){
                this.correct = true;
                this.feedback_msg += $.i18n("msg_asm_correct");
            }
            else{
                this.feedback_msg += $.i18n("msg_asm_incorrect");
                let asmLink = `https://asm.diveintosystems.org/arithmetic/${linkISA}/`
                // asmLink += this.codeBox.innerHTML.split("<br>").join("%0A").split(",").join("%2C").split("%").join("%25").split(":").join("%3A").split(' ').join("%20")
                asmLink += encodeURIComponent(this.codeBox.innerHTML.split("<br>").join("\n"))
                asmLink += `/0/0/0/0/${this.rax}/${this.rcx}/0`
                console.log(asmLink)
                this.feedback_msg += `<a className="asmLink" href='${asmLink}' target='_blank'> Try it in ASM Visualizer! </a>`
                
            }
            this.renderFeedback();
        }
        
    }


    // log the answer and other info to the server (in the future)
    async logCurrentAnswer(sid) {

    }

    sendData(actionId) {
        let details = {}
        details.data = {}

        details.operations = {cmp : this.checkBoxes[0].checked, test: this.checkBoxes[1].checked}
        details.mode = this.modeSelect.value;

        details.data.initialValues = [this.r1InitVal, this.r2InitVal]

        if(this.id2A(actionId) == "correct" || this.id2A(actionId) == "incorrect"){
            if(!(this.prePopulatedValues && !this.firstQuestionFinished)){
                details.data.answers = [this.arch.rax, this.arch.rcx]

                if(this.modeSelect.value == 1){
                    details.data.jumpTaken = this.jumpInfo.result;
                }

                if(!this.correct){
                    details.data.userAnswer = [this.RAXInput.value, this.RCXInput.value]
                }
            }
            else{
                details.data.answers = [this.prePopulatedValues.r1Val, this.prePopulatedValues.r2Val]

                if(this.modeSelect.value == 1){
                    details.data.jumpTaken = this.prePopulatedValues.jumpTaken;
                }


                if(!this.correct){
                    details.data.userAnswer = [this.RAXInput.value, this.RCXInput.value]
                }  
            }
        }

        details.prompt = this.codeBox.textContent

        this.logData(null, details, actionId, this.componentId);
    }

    /*===================================
    === Checking/loading from storage ===
    ===================================*/
    restoreAnswers(data) {
        // pass;
    }
    checkLocalStorage() {
        // pass;
    }
    setLocalStorage(data) {
        // pass;
    }
    hideFeedback() {
        this.feedbackDiv.remove();
    }

    displayFeedback() {
        this.feedbackDiv.style.visibility = "visible";
    }

    renderFeedback() {
        this.feedbackDiv = document.createElement("div");
        this.feedbackDiv.setAttribute("id", this.divid + "_feedback");
        this.containerDiv.appendChild(this.feedbackDiv);

        // only the feedback message needs to display
        var feedback_html = "<dev>" + this.feedback_msg + "</dev>";
        if (this.correct) {
            $(this.feedbackDiv).attr("class", "alert alert-info");
        } else {
            $(this.feedbackDiv).attr("class", "alert alert-danger");
        }
        
        this.feedbackDiv.innerHTML = feedback_html;
        this.displayFeedback();

        if(this.feedbackDiv.getElementsByTagName("a").length > 0){
            this.feedbackDiv.getElementsByTagName("a")[0].addEventListener('click', ()=>this.sendData(this.a2ID("asmVis")))
        }


        if (typeof MathJax !== "undefined") {
            this.queueMathJax(document.body);
        }
    }

    renderHelp(){
        this.clearHelp()
        this.helpDiv = document.createElement("div");
        this.helpDiv.setAttribute("id", this.divid + "_helpDiv");
        this.containerDiv.appendChild(this.helpDiv);

        let linkISA = "x86_64";
    
        if(this.archSelect == "X86_64"){
            linkISA = "x86_64"
        }
        else if(this.archSelect == "ia_32"){
            linkISA = "x86"
        }
        else if(this.archSelect == "arm_64"){
            linkISA = "arm64"
        }

        let raxVal;
        let rcxVal;

        if(this.prePopulatedValues && !this.firstQuestionFinished){
            raxVal = this.prePopulatedValues.r1InitVal;
            rcxVal = this.prePopulatedValues.r2InitVal;
        }
        else{
            raxVal = this.rax;
            rcxVal = this.rcx;
        }

        //this is what makes the asm vis link. You have to parse it specially so that the special characetrs get encoded correctly

        let asmLink = `https://asm.diveintosystems.org/arithmetic/${linkISA}/`
        // asmLink += this.codeBox.innerHTML.split("<br>").join("%0A").split(",").join("%2C").split("%").join("%25").split(":").join("%3A").split(' ').join("%20")
        asmLink += encodeURIComponent(this.codeBox.innerHTML.split("<br>").join("\n"))
        asmLink += `/0/0/0/0/${raxVal}/${rcxVal}/0`
        this.helpmsg = `<a className="asmLink" href='${asmLink}' target='_blank'> Try it in ASM Visualizer! </a>`
        
        var help_html = "<dev>" + this.helpmsg + "</dev>";

        $(this.helpDiv).attr("class", "alert alert-info");


        this.helpDiv.innerHTML = help_html;


        this.helpDiv.getElementsByTagName("a")[0].addEventListener('click', ()=>this.sendData(this.a2ID("asmVis")))


        if (typeof MathJax !== "undefined") {
            this.queueMathJax(document.body);
        }
    }

    clearHelp(){
        if(this.helpDiv){
            this.helpDiv.remove()
        }
    }



    //hopefully doesn't need to be used in the future
    UnitTest(){
        //rax rcx

        // //case 1: negative
        // this.UTRax = 0
        // this.UTRcx = -10

        // //case 2: zero
        // this.UTRax = 0
        // this.UTRcx = 0

        // //case 3 : positive
        // this.UTRax = 0
        // this.UTRcx = 10

        const values = [[0, -10], [0, 0], [0,10]]

        let result = `rax value, rcx value, jump type, jump taken \n`
        //this.jumpresult.code

        
        for(let i = 0; i < 7; i++){
            for(let elem of values){
                this.UTRax = elem[0]
                this.UTRcx = elem[1]
                this.jump = i;
                this.generateButton.click()
                this.submitButton.click()
                let row = `${this.UTRax}, ${this.UTRcx}, ${this.jumpInfo.code}, ${this.jumpInfo.result}\n`
                result += row;

            }
        }

        const blob = new Blob([result], {type: "text/csv;charset=utf-8"});
        const blobUrl = URL.createObjectURL(blob);
        
        // Create a link to download the file
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = "data.csv";
        link.innerHTML = "Click here to download the file";
        this.containerDiv.appendChild(link);
        
        console.log(result);


    }

}

/*=================================
== Find the custom HTML tags and ==
==   execute our code on them    ==
=================================*/
$(document).on("runestone:login-complete", function () {
    $("[data-component=assembly_jump]").each(function (index) {
        var opts = {
            orig: this,
            useRunestoneServices: eBookConfig.useRunestoneServices,
        };
        if ($(this).closest("[data-component=timedAssessment]").length == 0) {
            // If this element exists within a timed component, don't render it here
            try {
                AJList[this.id] = new AJ(opts);
            } catch (err) {
                console.log(
                    `Error rendering Number Conversion Problem ${this.id}
                     Details: ${err}\n Stack Trace: ${err.stack}`
                );
            }
        }
    });
});