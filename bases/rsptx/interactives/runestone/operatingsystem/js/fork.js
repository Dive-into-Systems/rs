// *********
// fork.js
// *********
// This file contains the JS for the Runestone virtual memory component. It was created By Luyuan Fan, Zhengfei Li, and Yue Zhang, 06/01/2023
"use strict";

import RunestoneBase from "../../common/js/runestonebase.js";
import "./fork-i18n.en.js";
import "../css/fork.css";
import * as forking from "./fork_algorithm.js";
import * as drawing from "./draw.js";
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
        this.initFeedback_Hierarchy_Timeline_Divs();
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
            "For the code snippet shown below (assume  that all the calls to <code>fork()</code> succeed), " + 
            "answer how many letters the process prints out with <code>printf()</code>."
        );
        this.statementDiv = $("<div>").addClass("statement-box");

        this.genPromptsNAnswer();

        // Create prompt section
        // ***STRUCTURE***: this.codeDiv  | this.rightDiv
        this.promptDiv = $("<div>").addClass("input-div");
        
        // Create C-code section
        this.codeDiv = $("<div>").addClass("code-div-inline");
        this.codeDiv.html(this.cCode);

        // Create question section
        this.rightDiv = $("<div>").addClass("right-div-inline");
        for (var i = 0; i < this.numPrints; i++) {
            this.subQuestionDiv = $("<div>").attr("id", this.divid + "_question_" + i);
            this.subPrompt = $("<div>").html("How many times will <code>" + this.printContent[i] + "</code> print?");
            this.inputBox = $("<input>").attr('placeholder','Enter your answer here');
            this.inputBox.attr("id", this.divid + "_input_" + i);
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
        console.log(this.source);
        this.cCode = forking.transpileToC(this.source);
        console.log(this.cCode);
        this.root = forking.buildTree(this.source);
        console.log(this.root);
        // this.csvTree = forking.getTreeCSV(this.root);
        // console.log(this.csvTree);
        // this.labels = forking.get
        // { csv: this.csvTree, valuesList: this.labels } = forking.getTreeCSV(this.root);
        const { csv, valuesList } = forking.getTreeCSV(this.root);
        this.csvTree = csv;
        this.labels = valuesList;
        this.answerMap = forking.getAnswer(this.root);
        // const { csv: this.csvTree, valuesList: this.labels } = getTreeCSV(this.root);
    }

    initForkButtons() {

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
            this.updateFeedbackDiv();
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
            if ($(this.hierarchyTreeDiv).css('display') == 'none') { this.showProcessHierarchy(); }
            else { this.hideProcessHierarchy(); }
        });

        /* Reveal timeline button */
        this.revealTimelineButton = document.createElement("button");
        this.revealTimelineButton.textContent = $.i18n("msg_fork_reveal_timeline");
        $(this.revealTimelineButton).attr({
            class: "btn btn-success",
            name: "draw timeline",
            type: "button",
            id: this.divid + "draw_timeline",
        });
        this.revealTimelineButton.addEventListener("click", () => {
            if ($(this.timelineDiv).css('display') == 'none') { this.showTimeline(); }
            else { this.hideTimeline(); }
        });

        this.buttonsDiv = $("<div>");

        this.buttonsDiv.append(this.generateButton);
        this.buttonsDiv.append(this.revealTreeButton);
        this.buttonsDiv.append(this.revealTimelineButton);
        this.buttonsDiv.append(this.checkAnswerButton);

        this.containerDiv.append(this.buttonsDiv);
    }

    clearInputNFeedbackField () {
        // clear all previous selection
        $('input').val("");

        // clear feedback field
        $(this.feedbackDiv).css("display", "none");
        $(this.hierarchyTreeDiv).css("display", "none");
        $(this.timelineDiv).css("display", "none");
    }

    updatePrompts(){
        // create and render all input fields in question group
        this.genPromptsNAnswer();
        // update c code
        this.codeDiv.html(this.cCode);
    }

    checkCurrentAnswer() {
        this.feedback_msg = []; // clear feedback_msg
        this.correct = true; // init answer first as true, only update when incorrect choice occurs

        for (let i = 0; i < this.numPrints; i++) {
            let currAnswer = $("#" + this.divid + "_input_" + i).val();
            if (currAnswer !== this.answerMap[this.printContent[i]]) {
                this.correct = false;
                if (! currAnswer) { this.feedback_msg.push(`Incomplete answer for <code>${this.printContent[i]}</code>.<br>`); }
                else { this.feedback_msg.push(`Incorrect answer for how many times <code>${this.printContent[i]}</code> will print.<br>`); }
            }
        }
        if (this.correct === true) { this.feedback_msg.push($.i18n('msg_fork_correct'))};
        this.updateFeedbackDiv();
    }

    showProcessHierarchy() {
        // $(this.hierarchyTreeDiv).html(drawing.drawHTree('child,parent\na,\nb,a\nc,a\nd,a\ne,b\nf,c\ng,c\nh,d\ni,h'));
        $(this.hierarchyTreeDiv).css("display", "block");
        $(this.hierarchyTreeDiv).html(drawing.drawHierarchy(this.csvTree, this.labels));
    }
    hideProcessHierarchy() {
        $(this.hierarchyTreeDiv).css("display", "none");
    }
    showTimeline() {
        $(this.timelineDiv).css("display", "block");
        $(this.timelineDiv).html(drawing.drawTimeline(this.csvTree));
    }
    hideTimeline() {
        $(this.timelineDiv).css("display", "none");
    }

    initFeedback_Hierarchy_Timeline_Divs() {
        // Create a feedback div, will be removed in clear and added back when generate another question
        this.feedbackDiv = $("<div>").attr("id", this.divid + "_feedback");
        $(this.feedbackDiv).css("display", "none");
        this.containerDiv.append(this.feedbackDiv);

        // Create a hierarchy tree div
        this.hierarchyTreeDiv = $("<div>").attr("id", "hierarchy_graph");
        $(this.hierarchyTreeDiv).css("display", "none");
        $(this.hierarchyTreeDiv).addClass("tree-div");
        this.containerDiv.append(this.hierarchyTreeDiv);

        // Create a timeline div
        this.timelineDiv = $("<div>").attr("id", "timeline_graph");
        $(this.timelineDiv).css("display", "none");
        $(this.timelineDiv).addClass("tree-div");
        this.containerDiv.append(this.timelineDiv);
    }

    updateFeedbackDiv() {
        $(this.feedbackDiv).css("display", "block");

        var feedback_html = this.feedback_msg;
        // set the background color of feedback divid
        if (this.correct === true) {
            $(this.feedbackDiv).attr("class", "alert alert-info");
        } else {
            $(this.feedbackDiv).attr("class", "alert alert-danger");
        }
        
        this.feedbackDiv.html(feedback_html);
        
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
        this.updateFeedbackDiv();
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