// *********
// binops.js
// *********
/*
 * - This file contains the JS for the Runestone bitwiseoperation component.
 * - Inputs are read from this.menuNode2 (set number of bits, 4/6/8), this.menuNode1 (dropdown checklist of
 *   bitwise operators), and this.inputNode (text box for answer). 
 * - Every time the user clicks on "generate another question", the component reads if there is any changes
 *   to the aforementioned input readers and make corresponding actions, such as generatePrompt and generateAnswer.
 * - The component randomizes values by Math library based on the number of bits in the generateNumber function.
 * - The component validates answer by first generating answer in generateAnswer function and compare the
 *   calculated asnwer with the user input answer.
 * - TODO:
 *     this.menuNode1: the dropdown checkbox list doesn't support checking items when clicking on the text. 
 *                     Currently it's clicking on the box only which is a bit inconvenient.  
*/
"use strict";

import RunestoneBase from "../../common/js/runestonebase.js";
import { nanoid } from 'nanoid/non-secure';
import "./nc-i18n.en.js"; //file that includes msg messages, usually appear in feedback
import "../css/binselect.css"; //css file that describes formatting of the component
import { Pass } from "codemirror";
import { MinSelectBox } from "../../../utils/MinSelectBox.js";
import { updateHeight } from "../../../utils/updateHeight.js";

export var BSList = {}; // Object containing all instances of NC that aren't a child of a timed assessment.


// BitwiseOperation constructor
export default class BS extends RunestoneBase {
   constructor(opts) {
        super(opts);
        var orig = opts.orig; // entire <p> element
        this.useRunestoneServices = opts.useRunestoneServices;
        this.origElem = orig;
        this.divid = orig.id;

        // Default configuration settings
        this.correct = null;
        this.num_bits = 4;
        this.fromOpt = ["AND", "OR", "XOR", "NOT", "Left Shift", "Right Shift(Logical)", "Right Shift(Arithmetic)"];
        this.toOpt = ["4", "6", "8"];
        this.checkedValues = [];

        //Unit Testing Values
        this.runUT = false;
        this.UTAnswers
        this.UTOperand1 = 0
        this.UTOperand2 = 0
        this.UTOp = "ADDITION"


        // Fields for logging data
        this.componentId = "4.2";
        this.questionId = 1;
        this.contWrong = 0;
        this.userId = this.getUserId();
        
        // Behaviors when page is loaded
        this.createBSElement();
        this.getCheckedValues();
        this.controlAnswerVisibillity()
        this.clearAnswer();

        // Only generate new prompt when there are items selected
        if (this.checkedValues.length != 0){
            this.generateOperands();
            this.generateTargNum();
            this.generateAnswer();
        } 
        this.checkValidConversion();
        updateHeight(window, document, this, true);
        if (typeof Prism !== "undefined") {
            Prism.highlightAllUnder(this.containerDiv);
        }
    }
    // Find the script tag containing JSON in a given root DOM node.
    scriptSelector(root_node) {
        return $(root_node).find(`script[type="application/json"]`);
    }
    /*===========================================
    ====   Functions generating final HTML   ====
    ===========================================*/
    
    // Create the NC Element
    createBSElement() {
        this.renderBSPromptAndInput();
        this.renderBSButtons();
        this.renderBSFeedbackDiv();
        // replaces the intermediate HTML for this component with the rendered HTML of this component
        $(this.origElem).replaceWith(this.containerDiv);
    }

   // Generate the layout of the prompt and input
   renderBSPromptAndInput() {
        // Create the parent div which contains everything
        this.containerDiv = document.createElement("div");
        this.containerDiv.id = this.divid;

        // Create the statement div
        this.statementDiv = document.createElement("div");
        this.statementDiv.className = "statement-div";
        
        this.instruction = document.createElement("div");
        this.instruction.innerHTML = "<span style='font-weight:bold'><u>Instructions</u></span>: " +
            "Select all possible operators that could have produced the given result.";
        this.instruction.style.padding = "10px";

        this.configHelperText = document.createElement("div");
        this.configHelperText.innerHTML = "<span style='font-weight:bold'><u>Configure question</u></span>:";

        this.statementNode1 = document.createTextNode(" Choose operators: ");

        // Create the container for the dropdown checkbox list
        this.menuNode1 = document.createElement("div");
        this.menuNode1.id = 'list1';
        this.menuNode1.className = 'dropdown-check-list';
        this.menuNode1.tabIndex = 100;  // Set tabindex to make the div focusable

        // Build the inner HTML using template literals
        // Inner HTML defines the items in the dropdown
        
        const binSelectBox = MinSelectBox(this.menuNode1, 2, ["addBoxSelect", "subBoxSelect","andBoxSelect", "orBoxSelect", "xorBoxSelect", "lShiftBoxSelect", "lrShiftBoxSelect", "arShiftBoxSelect"], ["ADDITION", "SUBTRACTION", "AND", "OR", "XOR", "Left Shift", "Right Shift(Logical)", "Right Shift(Arithmetic)"], [true, true, true, true, true, false, false, false], "Operators", this.generateButton)
        // var html =   "<span class='anchor'>Select Operators</span>"+
        // "<ul class='items'>"+
        // "  <li><input class='addBoxSelect' type='checkbox' value='ADDITION' checked/>Addition </li>"+ //pre checked item
        // "  <li><input  class='subBoxSelect' type='checkbox' value='SUBTRACTION' checked/>Subtraction </li>"+
        // "  <li><input class='andBoxSelect' type='checkbox' value='AND' checked/>And </li>"+
        // "  <li><input class='orBoxSelect' type='checkbox' value='OR' checked/>Or </li>"+
        // "  <li><input class='xorBoxSelect' type='checkbox' value='XOR' checked/>Exclusive Or </li>"+
        // "  <li><input class='lShiftBoxSelect' type='checkbox' value='Left Shift' uncheck/>Left Shift</li>"+
        // "  <li><input class='lrShiftBoxSelect' type='checkbox' value='Right Shift(Logical)' uncheck/>Logical Right Shift</li>"+
        // "  <li><input class='arShiftBoxSelect' type='checkbox' value='Right Shift(Arithmetic)' uncheck/>Arithmetic Right Shift</li>"+

        // "</ul>"
        
        // Assign the built HTML to innerHTML of the this.menuNode1 container
        // this.menuNode1.innerHTML = html;

        this.addBoxSelect = this.menuNode1.getElementsByClassName("addBoxSelect")[0]
        this.subBoxSelect = this.menuNode1.getElementsByClassName("subBoxSelect")[0]
        this.andBoxSelect = this.menuNode1.getElementsByClassName("andBoxSelect")[0]
        this.orBoxSelect = this.menuNode1.getElementsByClassName("orBoxSelect")[0]
        this.xorBoxSelect = this.menuNode1.getElementsByClassName("xorBoxSelect")[0]
        this.lShiftBoxSelect = this.menuNode1.getElementsByClassName("lShiftBoxSelect")[0]
        this.lrShiftBoxSelect = this.menuNode1.getElementsByClassName("lrShiftBoxSelect")[0]
        this.arShiftBoxSelect = this.menuNode1.getElementsByClassName("arShiftBoxSelect")[0]


        this.countSelected = 5;
        
        
        const boxCheckHandler = (box) => {
            if(!box.checked && (this.countSelected-1) < 2){
                box.checked = true;
            }
            else if(!box.checked){
                this.countSelected --;
            }
            else{
                this.countSelected++;
            }
            console.log(this.countSelected) 
        }
        this.addBoxSelect.addEventListener('change',() => boxCheckHandler(this.addBoxSelect) )
        this.subBoxSelect.addEventListener('change',() => boxCheckHandler(this.subBoxSelect) )
        this.andBoxSelect.addEventListener('change',() => boxCheckHandler(this.andBoxSelect) )
        this.orBoxSelect.addEventListener('change',() => boxCheckHandler(this.orBoxSelect) )
        this.xorBoxSelect.addEventListener('change',() => boxCheckHandler(this.xorBoxSelect) )
        this.lShiftBoxSelect.addEventListener('change',() => boxCheckHandler(this.lShiftBoxSelect) )
        this.lrShiftBoxSelect.addEventListener('change',() => boxCheckHandler(this.lrShiftBoxSelect) )
        this.arShiftBoxSelect.addEventListener('change',() => boxCheckHandler(this.arShiftBoxSelect) )


        // Access the anchor for adding click event
        var anchor = this.menuNode1.getElementsByClassName('anchor')[0];
        anchor.onclick = function() {
            if (this.menuNode1.classList.contains('visible'))
                this.menuNode1.classList.remove('visible');
            else
                this.menuNode1.classList.add('visible');
        }.bind(this);

        // Event lister that shrinks the dropdown whenever clicking outside of it
        document.addEventListener('click', function (e) {
            if (!this.menuNode1.contains(e.target) && this.menuNode1.classList.contains('visible')) {
                this.menuNode1.classList.remove('visible');
            }
        }.bind(this), false);

        // addEventListener define functions to be executed when menuNode1 has any changes
        this.menuNode1.addEventListener("change",
        function () {
            this.getCheckedValues();
        }.bind(this),
        false);
      
        this.statementNode2 = document.createTextNode(" Select the number of bits: ");

        // Assign the items in the menuNode2
        this.menuNode2 = document.createElement("select");
        for (var i = 0; i < this.toOpt.length; i++) {
            var option = document.createElement("option");
            option.value = this.toOpt[i];
            option.text = this.toOpt[i];
            this.menuNode2.appendChild(option);
        }

        // Assign the class of menuNode2. form-control is a class inherited from pretext
        this.menuNode2.setAttribute("class", "form form-control selectwidthauto");
        // When the value of menuNode2 is changed, do these...
        this.menuNode2.addEventListener("change",
            function () {
                    var random = this.randomItem;
                    this.getCheckedValues();
                    this.generateOperands();
                    this.clearAnswer();
                    this.generateTargNum();
                    this.generateAnswer();
                    this.checkValidConversion();
                    this.contWrong = 0;
            }.bind(this),
            false);

        // Render the statement
        this.containerDiv.append(this.instruction);
        this.configDiv = document.createElement("div");
        this.configDiv.appendChild(this.configHelperText);
        this.configDiv.appendChild(this.statementNode2);
        this.configDiv.appendChild(this.menuNode2);
        this.configDiv.appendChild(this.statementNode1);
        this.configDiv.appendChild(this.menuNode1);

        // Append configDiv to statementDiv
        this.statementDiv.appendChild(this.configDiv);
        this.containerDiv.appendChild(this.statementDiv);
        this.containerDiv.appendChild(document.createElement("br"));
        // create the div node for the prompt
        this.promptDiv = document.createElement("div");
        this.promptDiv.className = "prompt-div threeColGrid";
        this.promptDiv.style.paddingRight = '0px';

        // create the node for the number being displayed
        this.promptDivTextNode = document.createElement("code");
        this.promptDivTextNode.style = "margin: auto";
        // this.promptDivTextNode.className = "binops-inline code";

        const appendEl = (mainDiv, elType) => {mainDiv.append(document.createElement(elType))}

        appendEl(this.promptDiv, "p")
        this.promptDiv.appendChild(this.promptDivTextNode);
        appendEl(this.promptDiv, "p")


        this.promptDiv.appendChild(document.createElement("br"));
        
        // render the input field
        this.answerDiv = document.createElement("div");
        this.statementNode11 = document.createTextNode("Your answer: ");
        this.answerDiv.appendChild(this.statementNode11);
        
        this.checkListDiv = document.createElement("div")
        const checkListDivHTML = "<ul class='items'>"+
        "  <div class='resultBo'><input class='addBoxResult' type='checkbox' value='ADDITION' uncheck>Addition</input> <br></div> "+ //pre checked item
        "  <div><input  class='subBoxResult' type='checkbox' value='SUBTRACTION' uncheck>Subtraction </input>  <br></div>"+
        "  <div><input class='andBoxResult' type='checkbox' value='AND' uncheck>And </input>  <br></div>"+
        "  <div><input class='orBoxResult' type='checkbox' value='OR' uncheck>Or  </input> <br></div>"+
        "  <div><input class='xorBoxResult' type='checkbox' value='XOR' uncheck>Exclusive Or </input>  <br></div>"+
        "  <div><input class='lShiftBoxResult' type='checkbox' value='lShift' uncheck>Left Shift </input>  <br></div>"+
        "  <div><input class='lrShiftBoxResult' type='checkbox' value='lrShift' uncheck>Logical Right Shift </input>  <br></div>"+
        "  <div><input class='arShiftBoxResult' type='checkbox' value='arShift' uncheck>Arithmetic Right Shift </input>  <br></div>"+

        "</ul>";
        this.checkListDiv.innerHTML = checkListDivHTML;
        this.answerDiv.append(this.checkListDiv)
        //this.addbox.checked gets you the value
        this.addBoxResult = this.checkListDiv.getElementsByClassName("addBoxResult")[0]


        this.subBoxResult = this.checkListDiv.getElementsByClassName("subBoxResult")[0]


        this.andBoxResult = this.checkListDiv.getElementsByClassName("andBoxResult")[0]


        this.orBoxResult = this.checkListDiv.getElementsByClassName("orBoxResult")[0]


        this.xorBoxResult = this.checkListDiv.getElementsByClassName("xorBoxResult")[0]


        this.lShiftBoxResult = this.checkListDiv.getElementsByClassName("lShiftBoxResult")[0]

        
        this.lrShiftBoxResult = this.checkListDiv.getElementsByClassName("lrShiftBoxResult")[0]


        this.arShiftBoxResult = this.checkListDiv.getElementsByClassName("arShiftBoxResult")[0]



        // this.containerDiv.appendChild(document.createElement("br"));
        this.containerDiv.appendChild(this.promptDiv);
        this.containerDiv.appendChild(document.createElement("br"));
        this.containerDiv.appendChild(this.answerDiv);

        // prompt is invisible by default
        this.promptDiv.style.visibility = "hidden";

        // create the feedback div
        this.feedbackDiv = document.createElement("div");
        this.feedbackDiv.setAttribute("id", this.divid + "_feedback");

        // Copy the original elements to the container holding what the user will see.
        $(this.origElem).children().clone().appendTo(this.containerDiv);


        // Remove the script tag.
        this.scriptSelector(this.containerDiv).remove();
        // Set the class for the text inputs, then store references to them.
        let ba = $(this.containerDiv).find(":input");
        // ba.attr("class", "form form-control selectwidthauto");
        ba.attr("aria-label", "input area");
        this.blankArray = ba.toArray();
        // Set the style of code
        // When a blank is changed mark this component as interacted with.
        // And set a class on the component in case we want to render components that have been used
        // differently
        for (let blank of this.blankArray) {
            $(blank).change(this.recordAnswered.bind(this));
        }
   }

    // Get the list of operators being checked
    getCheckedValues(){
        this.checkedValues = [];
        // if there is item being checked, randomly select an operator
        if(this.addBoxSelect.checked){
            this.checkedValues.push(this.addBoxSelect.value);
        }
        if(this.subBoxSelect.checked){
            this.checkedValues.push(this.subBoxSelect.value);
        }
        if(this.andBoxSelect.checked){
            this.checkedValues.push(this.andBoxSelect.value);
        }
        if(this.orBoxSelect.checked){
            this.checkedValues.push(this.orBoxSelect.value);
        }
        if(this.xorBoxSelect.checked){
            this.checkedValues.push(this.xorBoxSelect.value);
        }
        if(this.lShiftBoxSelect.checked){
            this.checkedValues.push(this.lShiftBoxSelect.value);
        }
        if(this.lrShiftBoxSelect.checked){
            this.checkedValues.push(this.lrShiftBoxSelect.value);
        }
        if(this.arShiftBoxSelect.checked){
            this.checkedValues.push(this.arShiftBoxSelect.value);
        }
        console.log(this.checkedValues);
        if (this.checkedValues.length > 0){
            this.getRandomItem(this.checkedValues);
        }
    }

    // Keep track whether the user answer the question
    recordAnswered() {
        this.isAnswered = true;
    }

    controlAnswerVisibillity(){
        if(!this.addBoxSelect.checked){this.addBoxResult.parentElement.style.display = "none"}
        else{this.addBoxResult.parentElement.style.display = 'revert'}
        if(!this.subBoxSelect.checked){this.subBoxResult.parentElement.style.display = "none"}
        else{this.subBoxResult.parentElement.style.display = 'revert'}
        if(!this.andBoxSelect.checked){this.andBoxResult.parentElement.style.display = "none"}
        else{this.andBoxResult.parentElement.style.display = 'revert'}
        if(!this.orBoxSelect.checked){this.orBoxResult.parentElement.style.display = "none"}
        else{this.orBoxResult.parentElement.style.display = 'revert'}
        if(!this.xorBoxSelect.checked){this.xorBoxResult.parentElement.style.display = "none"}
        else{this.xorBoxResult.parentElement.style.display = 'revert'}
        if(!this.lShiftBoxSelect.checked){this.lShiftBoxResult.parentElement.style.display = "none"}
        else{this.lShiftBoxResult.parentElement.style.display = 'revert'}
        if(!this.lrShiftBoxSelect.checked){this.lrShiftBoxResult.parentElement.style.display = "none"}
        else{this.lrShiftBoxResult.parentElement.style.display = 'revert'}
        if(!this.arShiftBoxSelect.checked){this.arShiftBoxResult.parentElement.style.display = "none"}
        else{this.arShiftBoxResult.parentElement.style.display = 'revert'}

        this.countSelected = this.checkedValues.length;

    }

    // Create the buttons
    renderBSButtons() {
        // "check answer" button
        this.submitButton = document.createElement("button");
        this.submitButton.textContent = $.i18n("msg_NC_check_me");
        $(this.submitButton).attr({
            class: "btn btn-success",
            name: "do answer",
            type: "button",
        });
        // check the answer
        this.submitButton.addEventListener(
            "click",
            function () {
                this.checkValidConversion();
                if ( this.valid_conversion ) {
                    this.generateAnswer();
                    this.checkCurrentAnswer();
                    this.sendData(1)
                    this.logCurrentAnswer();
                }
            }.bind(this),
            false
        );
        this.generateButton = document.createElement("button");
        this.generateButton.textContent = $.i18n("msg_NC_generate_a_number");
        $(this.generateButton).attr({
            class: "btn btn-success",
            name: "generate a number",
            type: "button",
        });

        // Generate a new prompt
        this.generateButton.addEventListener(
            "click",
            function () {
                this.clearAnswer();
                this.getCheckedValues();
                // only generate new prompt when there is item selected
                if (this.checkedValues.length != 0){
                    this.generateOperands();
                    this.generateTargNum();
                    this.generateAnswer();
                }
                this.controlAnswerVisibillity()
                console.log(this.randomItem);
                console.log("target_num_string:" + this.target_num_string);
                console.log("op1: " + this.displayed_num_string);
                console.log("op2: " + this.displayed_num_string2);
                this.checkValidConversion();
                this.sendData(3);
            }.bind(this),
            false
        );

        // Add the buttons in the container
        this.containerDiv.appendChild(document.createElement("br"));
        this.containerDiv.appendChild(this.generateButton);
        this.containerDiv.appendChild(this.submitButton);

        if(this.runUT){
            this.UTButton = document.createElement("button")
            this.UTButton.textContent = "Run unit tests"
            this.containerDiv.append(this.UTButton)
            this.UTButton.addEventListener("click", () => this.UnitTest())
        }
        
   }

    // Add the feedback in the container
    renderBSFeedbackDiv() {
        this.containerDiv.appendChild(document.createElement("br"));
        this.containerDiv.appendChild(this.feedbackDiv);
    }

    // clear the input field
    clearAnswer() {
        this.addBoxResult.checked = false;
        this.subBoxResult.checked = false;
        this.andBoxResult.checked = false;
        this.orBoxResult.checked = false;
        this.xorBoxResult.checked = false;
        this.lShiftBoxResult.checked = false;
        this.lrShiftBoxResult.checked = false;
        this.arShiftBoxResult.checked = false;
        this.feedbackDiv.remove();
    }

    // Select an item among the operators selected
    getRandomItem(array){
        if (!array || array.length == 0){
            console.error("The array is empty or undefined.");
            return;
        }
        var index = Math.floor(Math.random() * array.length);
        this.randomItem = array[index];
        if(this.runUT){
            this.randomItem = this.UTOp
        }
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
        if (str.length > this.num_bits){
                str = str.slice(str.length-this.num_bits);
        }
        return str;
    }

    // generate a random number or two random numbers from 0 to 2^(this.num_bits)-1 based
    // on different operators and set the number to display
    generateOperands() {
        this.num_bits = parseInt(this.menuNode2.value);
        this.target_num = Math.floor(Math.random() * (1 << this.num_bits));
        this.target_num2 = Math.floor(Math.random() * (1 << this.num_bits));
        console.log(this.target_num);
        if (this.target_num === (1 << this.num_bits)) {
            this.target_num --;
        }
        if (this.target_num2 === (1 << this.num_bits)) {
            this.target_num2 --;
        }
        switch (this.randomItem) {
            case "ADDITION":
                this.displayed_num_string = this.toBinary(this.target_num);
                this.displayed_num_string2 = this.toBinary(this.target_num2);
                break;
            case "SUBTRACTION":
                this.displayed_num_string = this.toBinary(this.target_num);
                this.displayed_num_string2 = this.toBinary(this.target_num2);
                break;
            case "AND":
                this.displayed_num_string = this.toBinary(this.target_num);
                this.displayed_num_string2 = this.toBinary(this.target_num2);
                break;
            case "OR" :
                this.displayed_num_string = this.toBinary(this.target_num);
                this.displayed_num_string2 = this.toBinary(this.target_num2);
                break;
            case "XOR" :
                this.displayed_num_string = this.toBinary(this.target_num);
                this.displayed_num_string2 = this.toBinary(this.target_num2);
                break;
            case "Left Shift" :
                this.displayed_num_string = this.toBinary(this.target_num);
                this.displayed_num_string2 = this.toBinary(this.target_num2);
                break;
            case "Right Shift(Logical)" :
                this.displayed_num_string = this.toBinary(this.target_num);
                this.displayed_num_string2 = this.toBinary(this.target_num2);
                break;
            case "Right Shift(Arithmetic)" :
                this.displayed_num_string = this.toBinary(this.target_num);
                this.displayed_num_string2 = this.toBinary(this.target_num2);
                break;
        }

        if(this.runUT){
            this.target_num = parseInt((this.UTOperand1), 2);
            this.target_num2 = parseInt((this.UTOperand2), 2);
        }
    }
    
    // This function generates two random numbers from 0 to 2^(this.num_bits)-1 based
    // on different operators and set the number to display
    generateTargNum() {
        this.hideFeedback();
        this.feedback_msg = "";
        this.num_bits = parseInt(this.menuNode2.value);
        switch (this.randomItem) {
            case "ADDITION":
                this.target_num_string = this.toBinary(this.target_num+this.target_num2);
                break;
            case "SUBTRACTION":
                this.target_num_converted = this.toBinary((~this.target_num2+1)>>>0, this.num_bits);
                this.target_num_string = this.addBinary();
                break;
            case "AND" :
                this.target_num_string = this.toBinary(this.target_num & this.target_num2);
                break;
            case "OR" :
                this.target_num_string = this.toBinary(this.target_num | this.target_num2);
                break;
            case "XOR" :
                this.target_num_string = this.toBinary(this.target_num ^ this.target_num2);
                break;
            case "Left Shift" :
                this.target_num_string = this.toBinary(this.target_num << this.target_num2);
                break;
            case "Right Shift(Logical)" :
                this.target_num_string = this.toBinary(this.target_num >>> this.target_num2);
                break;
            case "Right Shift(Arithmetic)" :
                if (this.toBinary(this.target_num)[0] === "1"){
                    let con = this.target_num>>>this.target_num2;
                    if (con === 0){
                        con = "";
                        for(let i = 0; i<this.num_bits; i++){
                            con = "1" + con;
                        }
                    } else{
                        con = con.toString(2).padStart(this.num_bits, '1');
                    }
                    this.target_num_string = con;
                }
                else{
                    this.target_num_string = this.toBinary(this.target_num >> this.target_num2);  
                }
                break;
        }
        // update the prompt
        this.generatePrompt();
    }

    //This function performs binary addition on the two operands and sets the answer in the case that subtraction is generated.
    addBinary(){
    
        let carryOut = 0
        let result = ""
        let i = this.toBinary(this.target_num).length-1;
        let j = this.target_num_converted.length-1;


        while((i>=0 && j >= 0) || carryOut > 0){
            const dig_a = i>=0 ? parseInt(this.toBinary(this.target_num)[i]) : 0;
            const dig_b = i>=0 ? parseInt(this.target_num_converted[j]) : 0;
            let sum = dig_a + dig_b + carryOut;

            carryOut = ((sum >= 2) ? 1:0)
            result = (sum % 2).toString() + result;

            i--;
            j--;
        }
        return result;
   }

   // Update the prompt to display
   // Use innerHTML to deal with prompts of different number of lines
   generatePrompt() {
        this.target_num_string = this.target_num_string.slice((this.target_num_string.length-this.num_bits));
        const operatorHTML = `<br> <div class="operands" >`
            +`<div class="mysteryOp" >?</div><div style="text-decoration:underline">0b${this.displayed_num_string2}</div></div>`
            +`<div>0b${this.target_num_string}</div>`
    
       switch(this.randomItem) {
           case "ADDITION":
                this.promptDivTextNode.innerHTML = "0b" + this.displayed_num_string + operatorHTML
                break;
           case "SUBTRACTION":
                this.promptDivTextNode.innerHTML = "0b" + this.displayed_num_string + operatorHTML
                break;
           case "AND" :
                this.promptDivTextNode.innerHTML = "0b" + this.displayed_num_string + operatorHTML
           case "OR" :
                this.promptDivTextNode.innerHTML = "0b" + this.displayed_num_string + operatorHTML
                break;
           case "XOR" :
                this.promptDivTextNode.innerHTML = "0b" + this.displayed_num_string + operatorHTML
                break;
            case "Left Shift" :
                this.promptDivTextNode.innerHTML = "0b" + this.displayed_num_string + operatorHTML
                break;
            case "Right Shift(Arithmetic)" :
                this.promptDivTextNode.innerHTML = "0b" + this.displayed_num_string + operatorHTML
                break;
            case "Right Shift(Logical)" :
                this.promptDivTextNode.innerHTML = "0b" + this.displayed_num_string + operatorHTML
                break;  
       }
   }

   // check if the prompt is valid 
   checkValidConversion() {
        this.hideFeedback();
        this.valid_conversion = true;
        if (this.checkedValues.length == 0){
            // this.promptOLDiv.style.visibility = "hidden";
            // this.promptDiv.style.visibility = "hidden";
            return;
        }
        this.promptDiv.style.visibility = "visible";
   }
  
   // check if the answer is correct
   checkCurrentAnswer() {
        let inputs = [false,false,false,false,false, false, false, false];
        if(this.addBoxResult.checked || !this.checkedValues.includes("ADDITION")){
            inputs[0] = true;
        }  
        if(this.subBoxResult.checked || !this.checkedValues.includes("SUBTRACTION")){
            inputs[1] = true;
        }
        if(this.andBoxResult.checked || !this.checkedValues.includes("AND")){
            inputs[2] = true;
        }
        if(this.orBoxResult.checked || !this.checkedValues.includes("OR")){
            inputs[3] = true;
        }
        if(this.xorBoxResult.checked || !this.checkedValues.includes("XOR")) {
            inputs[4] = true;
        }
        if(this.lShiftBoxResult.checked || !this.checkedValues.includes("Left Shift")){
            inputs[5] = true;
        }
        if(this.lrShiftBoxResult.checked || !this.checkedValues.includes("Right Shift(Logical)")){
            inputs[6] = true;
        }
        if(this.arShiftBoxResult.checked || !this.checkedValues.includes("Right Shift(Arithmetic)")){
            inputs[7] = true;
        }

        this.sendUserAns = inputs;

        if(!inputs.includes(true)){
            this.feedback_msg = ($.i18n("msg_no_answer"));
            this.correct = false;
        } else if (JSON.stringify(inputs)!= JSON.stringify(this.answers)){
            this.correct = false;
            let true_ans = 0;
            let true_input = 0;
            for(let i = 0; i<this.answers.length; i++){
                true_ans = (this.answers[i]) ? true_ans + 1 : true_ans;
                true_input = (inputs[i]) ? true_input + 1 : true_input;
            }
            if(true_ans>true_input){
                this.feedback_msg = ($.i18n("msg_incorrect_not_enough"));
            }else if(true_input > true_ans)
                this.feedback_msg = ($.i18n("msg_incorrect_too_many"));
            else if( true_input == true_ans){
                this.feedback_msg = ($.i18n("msg_incorrect_not_match"))
            }
        }else{
            this.correct = true;
            this.feedback_msg = ($.i18n("msg_NC_correct"));
        }
        
        if(this.runUT){
            this.UTAnswers = this.answers;

        }

   }

   //generates the answer key to check the inputs against.
   generateAnswer(){
        this.target_num_string = this.target_num_string.slice((this.target_num_string.length-this.num_bits));
        this.getAllOutputs();
        this.answers = [false,false,false,false,false,false,false,false];

        if(this.addR == this.target_num_string || !this.checkedValues.includes("ADDITION")){
            this.answers[0] = true;
        }
        if(this.subR == this.target_num_string || !this.checkedValues.includes("SUBTRACTION")){
            this.answers[1] = true;
        }

        if(this.andR == this.target_num_string || !this.checkedValues.includes("AND")){
            this.answers[2] = true;
        }

        if(this.orR == this.target_num_string || !this.checkedValues.includes("OR")){
            this.answers[3] = true;
        }

        if(this.xorR == this.target_num_string || !this.checkedValues.includes("XOR")){
            this.answers[4] = true;
        }

        if(this.lshift == this.target_num_string || !this.checkedValues.includes("Left Shift")){
            this.answers[5] = true;
        }
        if(this.lrshift == this.target_num_string || !this.checkedValues.includes("Right Shift(Logical)")){
            this.answers[6] = true;
        }
        if(this.arshift == this.target_num_string || !this.checkedValues.includes("Right Shift(Arithmetic)")){
            this.answers[7] = true;
        }

   }

   //generates the result of all operations on the operands.
   getAllOutputs(){
        this.addR = this.toBinary(this.target_num+this.target_num2);
        this.target_num_converted = this.toBinary((~this.target_num2+1)>>>0, this.num_bits);
        this.subR = this.addBinary()
        this.subR = this.subR.slice(this.subR.length-this.num_bits);
        this.andR = this.toBinary(this.target_num & this.target_num2);
        this.orR = this.toBinary(this.target_num | this.target_num2);
        this.xorR = this.toBinary(this.target_num ^ this.target_num2);
        this.lshift = this.toBinary(this.target_num << this.target_num2);
        this.lrshift = this.toBinary(this.target_num >>> this.target_num2);
        if (this.toBinary(this.target_num)[0] === "1"){
            // this.arshift = ((this.target_num >> this.target_num2) & ((1 << this.num_bits)-1)).toString(2).padStart(this.num_bits, '1');
            let con = this.target_num>>>this.target_num2;
            if (con === 0){
                con = ""
                for(let i = 0; i<this.num_bits; i++){
                    con = "1" + con;
                }
            } else{
                con = con.toString(2).padStart(this.num_bits, '1');
            }
            this.arshift = con;
        }
        else{
            this.arshift = this.toBinary(this.target_num >> this.target_num2);  
        }     
        
        console.log("+:" + this.addR);
        console.log("converted:" + this.target_num_converted);
        console.log("-:" + this.subR);
        console.log("&&:" + this.andR);
        console.log("||:"+ this.orR);
        console.log("^: " + this.xorR);
        console.log("<<:" + this.lshift);
        console.log(">>:" + this.lrshift);
        console.log(">>>:" + this.arshift);
   }

    // log the answer and other info to the server (in the future)
    async logCurrentAnswer(sid) {
        // change this
        let answer = JSON.stringify("REPLACE ME");
        // Save the answer locally.
        this.setLocalStorage({
            answer: answer,
            timestamp: new Date(),
        });
        let data = {
            event: "numconv",
            act: answer || "",
            answer: answer || "",
            correct: this.correct ? "T" : "F",
            div_id: this.divid,
        };
        if (typeof sid !== "undefined") {
            data.sid = sid;
            feedback = false;
        }
        // render the feedback
        this.renderFeedback();
        return data;
    }

    sendData(actionId) {
        let details; 
        if (actionId == 1 || actionId == 2) {
            details = {
                config : {
                    numBits : `${this.num_bits}`,
                    checkedOperators : `${this.checkedValues}`,
                    usedOperator : `${this.randomItem}`
                },
                prompt: {
                    displayedPrompt: `${this.promptDivTextNode.textContent}`,
                },
                eval: {
                    correctAnswer: this.answers,
                    userAnswer : this.sendUserAns,
                    correct : this.correct,
                }
            }
        }
        else if (actionId == 3 || actionId == 0){
            details = {
                config : {
                    numBits : `${this.num_bits}`,
                    checkedOperators : `${this.checkedValues}`,
                    usedOperator : `${this.randomItem}`
                },
            }
        }

        this.logData(null, details, actionId, this.componentId);
    }

   /*===================================
   === Checking/loading from storage ===
   ===================================*/
   // Note: they are not needed here
   restoreAnswers(data) {
       // pass
   }
   checkLocalStorage() {
       // pass
   }
   setLocalStorage(data) {
       // pass
   }
  
   // Make the feedback hidden
   hideFeedback() {
       this.feedbackDiv.remove();
   }

   // Make the feedback visible
   displayFeedback() {
       this.feedbackDiv.style.visibility = "visible";
   }

   // Update the feedback message
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
        if (typeof MathJax !== "undefined") {
            this.queueMathJax(document.body);
        }
   }


//Unit Testing Functions

generateAllMatchings(arr1, arr2, spread=true){
    let target = [];
    arr1.forEach(e1 => {
        arr2.forEach(e2 => {
            if(spread){
                if(e1.length > 1 && e2.length > 1){
                    target.push([...e1,...e2])
                }
                else if(e1.length > 1){
                    target.push([...e1, e2])
                }
                if(e2.length > 1){
                    target.push([e1,...e2])
                }
                else{
                    target.push([e1,e2])
                }
            }
            else{
                target.push([e1,e2])
            }
            
        })
    });
    return target;
}

NBitNums(n=4){
    let temp = [1,0]
    for(let i = 0; i < (n-1);  i++){
        temp = this.generateAllMatchings([1,0], temp)
    }
    return temp
}


UnitTest() {
    const fourBitNums = this.NBitNums(this.num_bits)
    const operandsArr = this.generateAllMatchings(fourBitNums,fourBitNums,false);
    this.resultLog = "Operand 1, Operand 2, Operation, Result, Add, Subtract, And, Or, Xor, LS, LRS, ARS\n"

    const operations = ["ADDITION", "SUBTRACTION", "AND", "OR", "XOR", "Left Shift", "Right Shift(Logical)", "Right Shift(Arithmetic)"]
    
    const singleOpUTFunc = (operation) => operandsArr.forEach(elem => {
            
        const e1 = Number(elem[0].join(""))
        const e2 = Number(elem[1].join(""))
        this.UTOp = operation;
        this.UTOperand1 = e1;
        this.UTOperand2 = e2;
        this.generateButton.click();
        this.checkCurrentAnswer();
        // const resultString = `${this.target_num} ${this.randomItem} ${this.target_num2} \n: ` +
        // `Answer: ${this.UTbinaryAnswer}, Unsigned Answer: ${this.UTunsignedDecimalAnswer}, Signed Answer: ${this.UTsignedDecimalAnswer} \n` +
        // `Unsigned Overflow: ${this.UTunsignedOverflow}, Signed Overflow: ${this.UTsignedOverflow} `;
        // const resultStringCSV = `${this.toBinary(this.target_num)}, ${this.randomItem}, ${this.toBinary(this.target_num2)},` +
        // `${this.UTbinaryAnswer}, ${this.UTcarryOut}, ${this.UTunsignedDecimalAnswer},${this.UTsignedDecimalAnswer},` +
        // `${this.UTunsignedOverflow},${this.UTsignedOverflow}\n`;
        this.resultLog += `${this.UTOperand1}, ${this.UTOperand2}, ${this.UTOp}, ${this.target_num_string}, `;
        let resultString = ""
        this.UTAnswers.forEach(e => resultString+=` ${e},`)

        this.resultLog += (resultString)
        this.resultLog = this.resultLog.slice(0, -1); 
        this.resultLog += "\n"
    })

    
    operations.forEach(op => singleOpUTFunc(op))
    

    const blob = new Blob([this.resultLog], {type: "text/csv;charset=utf-8"});
    const blobUrl = URL.createObjectURL(blob);
    
    // Create a link to download the file
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = "data.csv";
    link.innerHTML = "Click here to download the file";
    this.containerDiv.appendChild(link);
    
        console.log(this.resultLog);
}


}


/*=================================
== Find the custom HTML tags and ==
==   execute our code on them    ==
=================================*/
$(document).on("runestone:login-complete", function () {
    $("[data-component=binselect]").each(function (index) {
        var opts = {
            orig: this,
            useRunestoneServices: eBookConfig.useRunestoneServices,
        };
        if ($(this).closest("[data-component=timedAssessment]").length == 0) {
            // If this element exists within a timed component, don't render it here
            try {
                BSList[this.id] = new BS(opts);
            } catch (err) {
                console.log(
                    `Error rendering Bitwise Operation Problem ${this.id}
                        Details: ${err}, Stack: ${err.stack}`
                );
            }
        }
    });
});


