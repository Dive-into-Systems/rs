// *********
// numconv.js
// *********
// This file contains the JS for the Runestone numberconversion component. It was created By Luyuan Fan, Zhengfei Li, and Yue Zhang, 06/01/2023
"use strict";


import RunestoneBase from "../../common/js/runestonebase.js";
import {initialize, possibleFinalStates, stateChange, toState} from "./baseAlgorithm.js"
import { nanoid } from 'nanoid/non-secure'; 
import "./threading-i18n.en.js"
import "../css/threading_race.css";
// import "./NC-i18n.pt-br.js";
import { Pass } from "codemirror";
export var TRList = {}

// NC constructor
export default class TR extends RunestoneBase {
    constructor(opts) {
        super(opts);
        var orig = opts.orig; // entire <p> element
        this.useRunestoneServices = opts.useRunestoneServices;
        this.origElem = orig;
        this.divid = orig.id;

        // Default configuration settings
        this.correct = null;
        
        // Fields for logging data
        this.componentId = "4.1";
        this.questionId = 1;
        this.userId = this.getUserId();

        this.problem = initialize();

        this.createTRElement();

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

    
    createTRElement() {
        this.renderTRPromptAndInput();
        this.renderAnswerDiv();
        this.renderTRButtons();
        this.renderTRFeedbackDiv();
        // replaces the intermediate HTML for this component with the rendered HTML of this component
        $(this.origElem).replaceWith(this.containerDiv);
    }

    renderTRPromptAndInput() {

        // Generate the two dropdown menus for number conversion
        this.containerDiv = document.createElement("div");
        this.containerDiv.id = this.divid;

        this.instructionNode = document.createElement("div");
        this.instructionNode.style.padding = "10px";
        this.instructionNode.innerHTML = "<span style='font-weight:bold'><u>Instructions</u></span>: Given two register values and a small block of assembly code containing a jump instruction, determine:"

        // // specify the number of bits in the statement
        // this.statementNode05 = document.createTextNode("Please convert a value from one selected number system to another selected number system.");



        // Build the inner HTML using template literals
        // Inner HTML defines the items in the dropdown

        // Assign the built HTML to innerHTML of the this.menuNode1 container
        
        this.configHelperText = document.createElement("div");
        this.configHelperText.innerHTML = "<span style='font-weight:bold'><u>Configure question</u></span>:";
        // render the statement
        this.containerDiv.appendChild(this.instructionNode);

        this.containerDiv.append(document.createElement("br"))


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

    renderAnswerDiv(){
            this.answerDiv = document.createElement('div');
            
            this.codeDiv = document.createElement('div');
            
            this.answerDiv.append(this.codeDiv);
    
            this.codeBox = document.createElement('code');
            this.codeDiv.style = "margin-left:23%"
            this.codeBox.style = "padding: 0px;";
            
            this.codeBox.innerHTML = this.problem.text.initial;
            this.thread1 = document.createElement('code');
            this.thread1.innerHTML = this.problem.text.t1;
            this.thread2 = document.createElement('code');
            this.thread2.innerHTML = this.problem.text.t2;
            this.codeDiv.append(this.codeBox);
            this.threadsDiv = document.createElement("div");
            this.threadsDiv.style.display = "flex";

            this.threadsDiv.append(this.thread1);
            this.threadsDiv.append(this.thread2);
            this.answerDiv.append(this.threadsDiv);

            this.containerDiv.append(this.answerDiv)
            

    }

    clearButtons(){
        this.generateButton.remove()
        this.submitButton.remove()
        
    }

    recordAnswered() {
        this.isAnswered = true;
    }

    renderTRButtons() {
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
            this.checkCurrentAnswer();
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
            this.clearAnswer();
            this.problem = initialize();
            this.renderAnswerDiv();
            this.renderTRButtons()
            
        });


        this.containerDiv.appendChild(this.generateButton);
        this.containerDiv.appendChild(this.submitButton);


    }

    renderTRFeedbackDiv() {
        // this.containerDiv.appendChild(document.createElement("br"));
        this.containerDiv.appendChild(this.feedbackDiv);
    }

    // clear the input field
    clearAnswer() {
        this.feedbackDiv.remove();
        this.answerDiv.remove();

        this.clearButtons()
    }


    // check if the conversion is valid  
    checkValidConversion() {
        this.hideFeedback();

        
    }
    
    // check if the answer is correct
    checkCurrentAnswer() {
        this.correct = false;
        
        this.renderFeedback();
        
    
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
    $("[data-component=threading_race]").each(function (index) {
        var opts = {
            orig: this,
            useRunestoneServices: eBookConfig.useRunestoneServices,
        };
        if ($(this).closest("[data-component=timedAssessment]").length == 0) {
            // If this element exists within a timed component, don't render it here
            try {
                TRList[this.id] = new TR(opts);
            } catch (err) {
                console.log(
                    `Error rendering Number Conversion Problem ${this.id}
                     Details: ${err}\n Stack Trace: ${err.stack}`
                );
            }
        }
    });
});