// *********
// numconv.js
// *********
// This file contains the JS for the Runestone numberconversion component. It was created By Luyuan Fan, Zhengfei Li, and Yue Zhang, 06/01/2023
"use strict";


import RunestoneBase from "../../common/js/runestonebase.js";
import { nanoid } from 'nanoid/non-secure';
import "./assembly-i18n.en.js";
// import "./NC-i18n.pt-br.js";
import "../css/assembly_jump.css";
import { Pass } from "codemirror";
export var AJList = {}; // Object containing all instances of NC that aren't a child of a timed assessment.

// NC constructor
export default class AJ extends RunestoneBase {
    constructor(opts) {
        super(opts);
        var orig = opts.orig; // entire <p> element
        this.useRunestoneServices = opts.useRunestoneServices;
        this.origElem = orig;
        this.divid = orig.id;

        this.jumpList = ["jmp", "je", "jne", "js", "jns", "jg", "jge", "jl", "jle"]

        
        // Default configuration settings
        this.correct = null;
        this.num_bits = 8;
        this.prev_num = -1;
        
        // Fields for logging data
        this.componentId = "4.1";
        this.questionId = 1;
        this.userId = this.getUserId();

        this.createAJElement();
        this.checkValidConversion();
        if ( this.valid_conversion ) {
            this.clearAnswer();
            this.generateNumber();
            this.generateAnswer();
        }
        this.caption = "Number Conversion";
        // this.addCaption("runestone");
        // this.checkServer("nc", true);
        if (typeof Prism !== "undefined") {
            Prism.highlightAllUnder(this.containerDiv);
        }

        this.contWrong = 0;
        this.sendData(0);
    }
    // Find the script tag containing JSON in a given root DOM node.
    scriptSelector(root_node) {
        return $(root_node).find(`script[type="application/json"]`);
    }
    /*===========================================
    ====   Functions generating final HTML   ====
    ===========================================*/
    // Create the NC Element
    createAJElement() {
        this.renderAJPromptAndInput();
        this.renderAJButtons();
        this.renderAJFeedbackDiv();
        // replaces the intermediate HTML for this component with the rendered HTML of this component
        $(this.origElem).replaceWith(this.containerDiv);
    }

    renderAJPromptAndInput() {
        // parse options from the JSON script inside
        var currOption = JSON.parse(
            this.scriptSelector(this.origElem).html()
        );
        // read number of bits 
        if (currOption["bits"] != undefined) {
            this.num_bits = eval(currOption["bits"]);
        }
        // ensure number of bits is a multiple of 4
        if ( this.num_bits % 4 != 0 ){
            alert($.i18n("msg_NC_not_divisible_by_4"));
            return;
        }
        // ensure number of bits is not too large
        if ( this.num_bits > 64 ){
            alert($.i18n("msg_NC_too_many_bits"));
            return;
        }

        // Generate the two dropdown menus for number conversion
        this.containerDiv = document.createElement("div");
        this.containerDiv.id = this.divid;

        this.statementDiv = document.createElement("div");

        this.instructionNode = document.createElement("div");
        this.instructionNode.style.padding = "10px";
        this.instructionNode.innerHTML = "<span style='font-weight:bold'><u>Instructions</u></span>: Determine whether as a jump is taken based on the operation and the jump instruction."

        // // specify the number of bits in the statement
        // this.statementNode05 = document.createTextNode("Please convert a value from one selected number system to another selected number system.");



        
        this.configHelperText = document.createElement("div");
        this.configHelperText.innerHTML = "<span style='font-weight:bold'><u>Configure question</u></span>:";
        // render the statement
        this.containerDiv.appendChild(this.instructionNode);
        this.statementDiv.appendChild(this.configHelperText);
        this.containerDiv.appendChild(this.statementDiv);
        this.containerDiv.appendChild(document.createElement("br"));
        this.statementDiv.className = "statement-div";


        // create the node for the prompt
        this.promptDiv = document.createElement("div");
        this.promptDiv.style.fontSize = "x-large";

        // create the node for the number being displayed (conversion from)
        this.promptDivTextNode = document.createElement("code");
        this.promptDiv.appendChild(this.promptDivTextNode);
        

        this.containerDiv.appendChild(this.promptDiv);
        
        
        this.answerDiv = document.createElement('div')
        this.answerDiv.className = "answerDiv"


        this.codeDiv = document.createElement('div')
        this.codeDiv.className = "codeDiv"
        this.answerDiv.append(this.codeDiv);

        this.codeBox = document.createElement('code')
        this.codeBox.textContent('I am code! \n I am code! \n  I am code! \n  ')
        this.codeDiv.append(this.codeBox);
        
        this.codeDiv.append(this.codeBox)


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

    recordAnswered() {
        this.isAnswered = true;
    }

    renderAJButtons() {
        // "check me" button and "generate a number" button
        this.submitButton = document.createElement("button");
        this.submitButton.textContent = $.i18n("msg_NC_check_me");
        $(this.submitButton).attr({
            class: "btn btn-success",
            name: "answer",
            type: "button",
        });
        // check the answer when the conversion is valid
        this.submitButton.addEventListener("click", () => {
            this.checkValidConversion();
            if ( this.valid_conversion ) {
                this.checkCurrentAnswer();
                this.logCurrentAnswer();
            }
        });

        this.generateButton = document.createElement("button");
        this.generateButton.textContent = $.i18n("msg_NC_generate_a_number");
        $(this.generateButton).attr({
            class: "btn btn-success",
            name: "generate a number",
            type: "button",
        });
        // generate a new number for conversion 
        this.generateButton.addEventListener("click", () => {
            this.sendData(3);
            this.checkValidConversion();
            if ( this.valid_conversion ) {
                this.clearAnswer();
                this.generateNumber();
                this.generateAnswer();
            }
        });

        this.containerDiv.appendChild(document.createElement("br"));
        this.containerDiv.appendChild(this.generateButton);
        this.containerDiv.appendChild(this.submitButton);


    }

    renderAJFeedbackDiv() {
        this.containerDiv.appendChild(document.createElement("br"));
        this.containerDiv.appendChild(this.feedbackDiv);
    }

    // clear the input field
    clearAnswer() {
        this.feedbackDiv.remove();
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

    // generate a random number from 0 to 2^(this.num_bits)-1 and set the number to display
    generateNumber() {
        const generateNumWithBound = (num=15) => Math.floor(Math.random()*num);
        this.op1 = generateNumWithBound(15)
        this.op2 = generateNumWithBound(15)

        this.display
        
        this.randomItem = this.jumpList[generateNumWithBound(this.jumpList.length)]

        //change this later
        //Hardcoded for now
        this.target = this.op2 - this.op1
        
    }

    generateCode() {
        //TODO
    }

    

    // generate the answer as a string based on the randomly generated number
    generateAnswer() {
        this.hideFeedback();
        this.feedback_msg = "";

        switch (this.randomItem) {
            case "jmp" : 
                this.answer = true;
                break;
            case "je" : 
                this.answer = (this.target == 0);
                break;
            case "jne" : 
                this.answer = (this.target !=0);
                break;
            case "js" :
                this.answer = (this.target<0)
                break;
            case "jns":
                this.answer = (this.target>0)
                break;
            case "jg":
                this.answer = (this.target>0);
                break;
            case "jge":
                this.answer = (this.target>=0);
                break;
            case "jl":
                this.answer = (this.target<0);
                break;
            case "jle":
                this.answer = (this.target<=0);
                break;
            
        }
        // update the prompt
        this.generatePrompt();
    }

    // Update the prompt to display
    // It is in the format of "xxxxx = ______"
    generatePrompt() {



    }

    // check if the conversion is valid  
    checkValidConversion() {
        this.hideFeedback();

        
    }
    
    // check if the answer is correct
    checkCurrentAnswer() {
        // the answer is correct if it is the same as the string this.target_num_string

        // Log data 
        if (this.correct === true) { this.sendData(1); } else { this.sendData(2); }
    }

    // log the answer and other info to the server (in the future)
    async logCurrentAnswer(sid) {

    }

    sendData(actionId) {

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
        if (typeof MathJax !== "undefined") {
            this.queueMathJax(document.body);
        }
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
                     Details: ${err}`
                );
            }
        }
    });
});