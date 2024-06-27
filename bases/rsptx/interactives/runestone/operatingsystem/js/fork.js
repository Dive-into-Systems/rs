// *********
// fork.js
// *********
// This file contains the JS for the Runestone virtual memory component. It was created By Luyuan Fan, Zhengfei Li, and Yue Zhang, 06/01/2023
"use strict";

import RunestoneBase from "../../common/js/runestonebase.js";
import "./fork-i18n.en.js";
import "../css/fork.css";
import * as forking from "./fork_algorithm.js";
import * as drawing from "./draw_tree.js";
import { Pass } from "codemirror";
import { validLetter } from "jexcel";

export var ForkList = {}; // Object containing all instances of Fork that aren't a child of a timed assessment.

// Fork constructor 
export default class Fork extends RunestoneBase {
    constructor(opts) {
        super(opts);
        var orig = opts.orig; // entire <p> element
        this.useRunestoneServices = opts.useRunestoneServices;
        this.origElem = orig;
        this.divid = orig.id;

        this.createForkElement();
        this.caption = "Processes and forking";
        this.addCaption("runestone");

        // this.checkServer("fork", true);
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
    // Create the Fork Element
    createForkElement() {
        this.initParams(); // init all
        this.initForkInputField();
        this.initForkButtons();
        this.initHierarchyTreeDiv();
        this.initForkFeedbackDiv();
        // replaces the intermediate HTML for this component with the rendered HTML of this component
        $(this.origElem).replaceWith(this.containerDiv);
    }

    initParams() {
        this.numForks = 3;
        this.numPrints = 4;
        this.printContent = [];
        for (var i = 0; i < this.numPrints; i++) {
            this.printContent.push(String.fromCharCode((i + 97)));
        }
    }

    initForkInputField() {
        // Create instructions
        this.containerDiv = $("<div>").attr("id", this.divid);
        this.instruction = $("<div>").html(
            "For the code snippet shown below (assume  that all the calls to <code>fork()</code> succeed, " + 
            "answer how many letters the process prints out with <code>printf()</code>."
        );
        this.statementDiv = $("<div>").addClass("statement-box");

        // Prepare for hierarchy tree div
        this.hierarchyTreeDiv = $("<div>").attr("id", "graph");
        $(this.hierarchyTreeDiv).addClass("tree-div");

        this.genPromptsNAnswer();

        // Create prompt section
        // ***STRUCTURE***: this.codeDiv  | this.rightDiv
        this.promptDiv = $("<div>").addClass("prompt-div");
        
        // Create C-code section
        this.codeDiv = $("<div>").addClass("code-div-inline");
        this.codeDiv.html(this.cCode);

        // Create question section
        this.rightDiv = $("<div>").addClass("right-div-inline");
        for (var i = 0; i < this.numPrints; i++) {
            this.subQuestionDiv = $("<div>").attr("id", this.divid + "_question_" + i);
            this.subPrompt = $("<div>").html("How many times will <code>" + this.printContent[i] + "</code> print?");
            this.inputBox = $("<input>").attr('placeholder','Enter your answer here');
            this.inputBox.attr("id", "input-field");
            this.inputBox.addClass("form-control input-box");
            this.subQuestionDiv.append(this.subPrompt);
            this.subQuestionDiv.append(this.inputBox);
            this.rightDiv.append(this.subQuestionDiv);
        }

        // copy the original elements to the container holding what the user will see.
        $(this.origElem).children().clone().appendTo(this.containerDiv);
    
        // remove the script tag.
        // this.scriptSelector(this.containerDiv).remove();

        // ***div STRUCTURE***:
        this.statementDiv.append(this.instruction);
        this.containerDiv.append(this.statementDiv, this.promptDiv);
        this.promptDiv.append(this.codeDiv, this.rightDiv);
    }

    genPromptsNAnswer() {

        this.source = forking.genRandSourceCode(this.numForks, this.numPrints, this.printContent);
        this.cCode = forking.transpileToC(this.source);
        // this.tree = forking.buildTree(this.source);
        // this.outputTree = forking.printTree(this.tree);
        // this.count = forking.countPrints(this.tree, this.printContent);
    }

    initForkButtons() {

        this.buttonsDiv = $("<div>");

        /* Ask me another button */
        this.generateButton = document.createElement("button");
        this.generateButton.textContent = $.i18n("msg_fork_generate_another");
        $(this.generateButton).attr({
            class: "btn btn-success",
            name: "generate a new question",
            type: "button",
            id: this.divid + "submit",
        });
        this.generateButton.addEventListener("click", () => {
            this.clearInputNFeedbackField(); // clear answers, clear prev feedback, and enable all for the input fields
            this.updatePrompts();
        });


        /* Check answer button */
        this.checkAnswerButton = document.createElement("button");
        this.checkAnswerButton.textContent = $.i18n("msg_fork_check_answer");
        $(this.checkAnswerButton).attr({
            class: "btn btn-success",
            name: "draw hierarchy tree",
            type: "button",
            id: this.divid + "check_answer",
        });
        this.checkAnswerButton.addEventListener("click", () => {
            this.checkCurrentAnswer();
            this.renderFeedback();
        });

        /* Reveal tree button */
        this.revealTreeButton = document.createElement("button");
        this.revealTreeButton.textContent = $.i18n("msg_fork_reveal_tree");
        $(this.revealTreeButton).attr({
            class: "btn btn-success",
            name: "draw hierarchy tree",
            type: "button",
            id: this.divid + "draw_tree",
        });
        this.revealTreeButton.addEventListener("click", () => {
            this.showProcessHierarchy();
        });

        this.containerDiv.append("<br>");

        this.buttonsDiv.append(this.generateButton);
        this.buttonsDiv.append(this.revealTreeButton);
        this.buttonsDiv.append(this.checkAnswerButton);

        this.containerDiv.append(this.buttonsDiv);
    }

    clearInputNFeedbackField () {
        // clear all previous selection
        $('input').val("");

        // clear feedback field
        $(this.feedbackDiv).remove();
        $(this.hierarchyTreeDiv).remove();
    }

    updatePrompts(){
        // create and render all input fields in question group
        this.genPromptsNAnswer();
        // update c code
        this.codeDiv.html(this.cCode);

        // create another feedback div
        this.feedbackDiv = $("<div>").attr("id", this.divid + "_feedback");
        this.containerDiv.append(this.feedbackDiv);

        this.hierarchyTreeDiv = $("<div>").attr("id", "graph");
        $(this.hierarchyTreeDiv).addClass("tree-div");
        this.containerDiv.append(this.hierarchyTreeDiv);
    }

    checkCurrentAnswer() {
        this.feedback_msg = []; // clear feedback_msg
        this.correct = true; // init answer first as true, only update when incorrect choice occurs
        this.incompleteAnswer = false;
        var currAnswer = $("#input-field").val();

        if (currAnswer !== this.count) {
            this.correct = false;
            if (currAnswer === "") {
                this.feedback_msg.push($.i18n("msg_no_answer"));
            }
            else {
                this.feedback_msg.push($.i18n("msg_fork_incorrect"));
            }
        } else {
            this.feedback_msg.push($.i18n("msg_fork_correct"));
        }
        this.renderFeedback();
    }

    showProcessHierarchy() {
        // $(this.hierarchyTreeDiv).html("BOOM JUST TRYING THINGS OUT.");
        $(this.hierarchyTreeDiv).html(drawing.drawHTree('child,parent\na,\nb,a\nc,a\nd,a\ne,b\nf,c\ng,c\nh,d\ni,h'));
    }

    initForkFeedbackDiv() {
        this.containerDiv.append("<br>");
        // create a feedback div, will be removed in clear and added back when generate another question
        this.feedbackDiv = $("<div>").attr("id", this.divid + "_feedback");
        this.containerDiv.append(this.feedbackDiv);
    }

    initHierarchyTreeDiv() {
        this.hierarchyTreeDiv = $("<div>").attr("id", "graph");
        this.containerDiv.append(this.hierarchyTreeDiv);
    }

    renderFeedback() {
        var feedback_html = this.feedback_msg;
        // set the background color of feedback divid
        if (this.correct === true) {
            $(this.feedbackDiv).attr("class", "alert alert-info");
        } else {
            $(this.feedbackDiv).attr("class", "alert alert-danger");
        }
        
        this.feedbackDiv.html(feedback_html);
        this.displayFeedback();
        
        if (typeof MathJax !== "undefined") {
            this.queueMathJax(document.body);
        }
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
    recordAnswered() {
        this.isAnswered = true;
    }
    hideFeedback() {
        $(this.feedbackDiv).css("visibility", "hidden");
    }
    displayFeedback() {
        $(this.feedbackDiv).css("visibility", "visible");
    }
    // log the answer and other info to the server (in the future)
    async logCurrentAnswer(sid) {
        let answer = JSON.stringify(this.inputNodes);
        let feedback = true;
        // Save the answer locally.
        this.setLocalStorage({
            answer: answer,
            timestamp: new Date(),
        });
        let data = {
            event: "Fork",
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
}

/*=================================
== Find the custom HTML tags and ==
==   execute our code on them    ==
=================================*/
$(document).on("runestone:login-complete", function () {
    $("[data-component=fork]").each(function (index) {
        var opts = {
            orig: this,
            useRunestoneServices: eBookConfig.useRunestoneServices,
        };
        if ($(this).closest("[data-component=timedAssessment]").length == 0) {
            // If this element exists within a timed component, don't render it here
            try {
                ForkList[this.id] = new Fork(opts);
            } catch (err) {
                console.log(
                    `Error rendering Forking Problem ${this.id}
                     Details: ${err}`
                );
            }
        }
    });
});