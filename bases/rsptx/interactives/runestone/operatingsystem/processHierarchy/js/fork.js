// *********
// fork.js
// *********
// This file contains the process hierarchy component. 
// It is created by Luyuan Fan and Tony Cao (Summer 2024). 

import RunestoneBase from "../../../common/js/runestonebase.js";
import "./fork-i18n.en.js";
import "../css/fork.css";
import * as build from "../algorithms/build.js";
import * as hierarchy from "../algorithms/hierarchyDraw.js";
import { Pass } from "codemirror";
import { validLetter } from "jexcel";

export var ProcHierarchyList = {}; // Object containing all instances of Fork that aren't a child of a timed assessment.

export default class ProcHierarchy extends RunestoneBase {
    constructor(opts) {
        super(opts);
        var orig = opts.orig;
        this.useRunestoneServices = opts.useRunestoneServices;
        this.origElem = orig;
        this.divid = orig.id;

        this.createProcHierarchyElement();
        this.caption = "Process hierarchy";
        this.addCaption("runestone");

        if (typeof Prism !== "undefined") {
            Prism.highlightAllUnder(this.containerDiv);
        }
    }

    scriptSelector(root_node) {
        return $(root_node).find(`script[type="application/json"]`);
    }

    /*===========================================
    ====   Functions generating final HTML   ====
    ===========================================*/

    // Create the ProcHierarchy Element
    createProcHierarchyElement() {
        this.initParams();
        this.initProcHierarchyInputField();
        this.initProcHierarchyButtons();
        this.initFeedback_Hierarchy_Help_Divs();
        $(this.origElem).replaceWith(this.containerDiv); // replaces the intermediate HTML for this component with the rendered HTML of this component
    }

    initParams() {
        try {
            const params = JSON.parse(
                this.scriptSelector(this.origElem).html()
            );
            if (params["instruction"] != undefined) {
                this.instructionText = params["instruction"];
            } else {
                this.instructionText = (`This question intends to guide you through understanding parent-child relationships between processes. 
                    For the code snippet shown below (assuming all calls to <code>fork()</code> succeed),
                    answer <strong>how many times</strong> each letter is printed with <code>printf()</code>.`);
            }
            if (params["source"] != undefined) { // If you want to pass in a source code string for generating the C-code. 
                this.source = params["source"];
                if (params['numForks'] != undefined) { this.numForks = params['numForks']; } else { console.error("Invalid numForks param from .ptx file"); }
                if (params['numPrints'] != undefined) { this.numPrints = params['numPrints']; } else { console.error("Invalid numPrints param from .ptx file"); }
                console.log(this.source);
                this.showMenu = false;
                this.staticQuestion = true;
            }
            else {
                if (params["preset-params"] != undefined && params["preset-params"] == true) { // If you want to hide the menu and manually set all parameters.
                    if (params['numForks'] != undefined) { this.numForks = params['numForks']; } else { console.error("Invalid numForks param from .ptx file"); }
                    if (params['numPrints'] != undefined) { this.numPrints = params['numPrints']; } else { console.error("Invalid numPrints param from .ptx file"); }
                    if (params['hasElse'] != undefined) { this.hasElse = params['hasElse']; } else { console.error("Invalid hasElse param from .ptx file"); }
                    if (params['hasNest'] != undefined) { this.hasNest = params['hasNest']; } else { console.error("Invalid hasNext param from .ptx file"); }
                    if (params['hasExit'] != undefined) { this.hasExit = params['hasExit']; } else { console.error("Invalid hasExit param from .ptx file"); }
                    if (params['hasLoop'] != undefined) { this.hasLoop = params['hasLoop']; } else { console.error("Invalid hasLoop param from .ptx file"); }
                    this.showMenu = false;
                }
                else {
                    this.modes = ["1", "2", "3"];
                    this.showMenu = true;
                }
                this.staticQuestion = false;
            }
        } catch (error) { console.error("Error loading parameters:", error); }
        this.printContent = [];
        for (var i = 0; i < 26; i++) { // All letters are available. 
            this.printContent.push(String.fromCharCode((i + 97)));
        }
    }

    initProcHierarchyInputField() {
        this.containerDiv = $("<div>").attr("id", this.divid);
        this.confidDiv = $("<div>").addClass("config-box");

        /* Instructions */
        this.instruction = $("<div>").html("<span style='font-weight:bold'><u>Instructions</u></span>: " + this.instructionText).css("padding", "10px");

        /* Mode menu */
        if (this.showMenu == true) {
            this.configHelperText = $("<div>").html(
                `<span style='font-weight:bold'><u>Configure question</u></span>: 
                You can generate the C code block from several modes:<br>
                <ul style='line-height:90%'> 
                    <li>Mode 1 creates a small number of processes with if structures.</li> 
                    <li>Mode 2 has more processes with if-else structures and nested conditions.</li>
                    <li>Mode 3 has everything in mode 2 and introduces exits.</li> 
                </ul>`
            );
            this.label = $("<label>").addClass("fork-inline").html("<span>Select a mode</span>:&ensp;");
            this.modeMenu = $("<select>").addClass("form-control fork-inline mode");
            this.modes.forEach(e => {
                let option = $("<option>").val(e).text(e);
                if (option.val() === "1") { option.attr("selected", true); }
                this.modeMenu.append(option);
            });
            this.modeMenu.on("change", () => {
                this.clearInputNFeedbackField();
                this.updatePrompts();
            });
        }

        /* Generate initial question and answers */
        this.genNewQuestionNAnswer();

        /* C-code and input boxes */
        this.codeDiv = $("<div>").addClass("code-div-inline").html(this.cCode);

        this.inputDiv = $("<div>").addClass("input-div-inline");
        for (var i = 0; i < this.numPrints; i++) {
            this.inputBox = $("<input>").attr({
                'placeholder': 'Enter your answer here',
                'id' : this.divid + '_input_' + i
            }).addClass("form-control input-box");

            this.subPrompt = $("<div>").html("How many times will <code>" + this.printContent[i] + "</code> print?");
            this.subQuestionDiv = $("<div>").attr("id", this.divid + "_question_" + i).append(this.subPrompt, this.inputBox);
            this.inputDiv.append(this.subQuestionDiv);
        }

        /* Combine all elements into the container */
        this.promptDiv = $("<div>").addClass("prompt-div").append(this.codeDiv, this.inputDiv);
        this.containerDiv.append(this.instruction);
        if (this.showMenu == true) {
            this.confidDiv.append(this.configHelperText, this.label, this.modeMenu);
            this.containerDiv.append($("<br>"), this.confidDiv);
        }
        this.containerDiv.append(this.promptDiv);

        /* Some default Runestone things */
        $(this.origElem).children().clone().appendTo(this.containerDiv); // Copy the original elements to the container holding what the user will see.
        this.scriptSelector(this.containerDiv).remove(); // Remove the script tag.
    }

    updateSourceCode() {
        console.log("Show menu is", this.showMenu);

        if (this.showMenu == true) {
            const mode = this.modeMenu.val().toString();
            console.log("Menu value is", mode);
            let prev = this.source || "";
            this.source = build.genRandSourceCode(this.ProcHierarchys, this.numPrints, this.hasNest, this.hasExit, this.hasElse, this.hasLoop);
            while (this.source == prev) {
                if (mode == "2") {
                    this.numForks = 3;
                    this.numPrints = this.pick([3, 4]);
                    this.hasNest = true;
                    this.hasExit = false;
                    this.hasElse = true;
                    this.hasLoop = false;
                }
                else if (mode == "3") {
                    this.numForks = 4;
                    this.numPrints = 4;
                    this.hasNest = true;
                    this.hasExit = true;
                    this.hasElse = true;
                    this.hasLoop = true;
                }
                else {
                    this.numForks = 2;
                    this.numPrints = this.pick([2, 3]);
                    this.hasNest = false;
                    this.hasExit = false;
                    this.hasElse = false;
                    this.hasLoop = false;
                }
                this.source = build.genRandSourceCode(this.numForks, this.numPrints, this.hasNest, this.hasExit, this.hasElse, this.hasLoop);
            }
        }
        else {
            this.source = build.genRandSourceCode(this.numForks, this.numPrints, this.hasNest, this.hasExit, this.hasElse, this.hasLoop);
            let prev = this.source || "";
            while (this.source == prev) {
                this.source = build.genRandSourceCode(this.numForks, this.numPrints, this.hasNest, this.hasExit, this.hasElse, this.hasLoop);
            }
        }
    }

    genSourceNAnswers() {
        [this.fullTree, this.cCode] = build.buildAndTranspile(this.source);
        const { csv: c, valuesList: l } = build.getTreeCSV(this.fullTree);
        this.csvTree = c;
        this.labels = l;
        this.answerMap = build.getAnswer(this.fullTree, this.numPrints);
    }

    // Update configurations based on current menu choice, generate a new question, and its FULL answer. 
    genNewQuestionNAnswer() {
        if (this.staticQuestion == false) { this.updateSourceCode(); }
        this.genSourceNAnswers();
    }
    
    // Randomly pick one item in list
    pick(myList) {
        return myList[Math.floor(Math.random() * (myList.length))];
    }

    initProcHierarchyButtons() {
        this.containerDiv.append($('<br>'));

        /* Ask me another button */
        this.generateButton = document.createElement("button");
        this.generateButton.textContent = $.i18n("msg_fork_generate_another");
        $(this.generateButton).attr({
            class: "btn btn-success",
            type: "button",
            id: this.divid + "submit",
        });
        this.generateButton.addEventListener("click", () => {
            this.clearInputNFeedbackField();
            this.updatePrompts();
        });

        /* Check answer button */
        this.checkAnswerButton = document.createElement("button");
        this.checkAnswerButton.textContent = $.i18n("msg_fork_check_answer");
        $(this.checkAnswerButton).attr({
            class: "btn btn-success",
            type: "button",
            id: this.divid + "check_answer",
        });
        this.checkAnswerButton.addEventListener("click", () => {
            if ($(this.feedbackDiv).css('display') == 'none') {
                this.checkCurrentAnswer();
                this.updateFeedbackDiv();
                $(this.feedbackDiv).show();
            } else {
                $(this.feedbackDiv).hide();
            }
        });

        /* Reveal tree button */
        this.revealTreeButton = document.createElement("button");
        this.revealTreeButton.textContent = $.i18n("msg_fork_reveal_tree");
        $(this.revealTreeButton).attr({
            class: "btn btn-success",
            type: "button",
            id: this.divid + "draw_tree",
        });
        this.revealTreeButton.addEventListener("click", () => {
            if ($(this.hierarchyTreeDiv).css('display') == 'none') { this.showProcessHierarchy(); }
            else { this.hideProcessHierarchy(); }
        });

        /* Reveal help button */
        this.helpButton = document.createElement("button");
        this.helpButton.textContent = $.i18n("msg_fork_help");
        $(this.helpButton).attr({
            class: "btn btn-success",
            type: "button",
            id: this.divid + "help",
        });
        this.helpButton.addEventListener("click", () => {
            if ($(this.helpDiv).css('display') == 'none') { this.showHelp(); console.log("show");}
            else { this.hideHelp(); console.log("hide");}
        });

        this.buttonsDiv = $("<div>");

        if (this.staticQuestion == false) { this.buttonsDiv.append(this.generateButton); }
        this.buttonsDiv.append(this.revealTreeButton);
        this.buttonsDiv.append(this.helpButton);
        this.buttonsDiv.append(this.checkAnswerButton);

        this.containerDiv.append(this.buttonsDiv);
    }

    clearInputNFeedbackField () {
        $('input').val("");
        this.inputDiv.html("");

        $(this.feedbackDiv).css("display", "none");
        $(this.hierarchyTreeDiv).css("display", "none").empty();
        $(this.helpDiv).css("display", "none");
    }

    updatePrompts(){
        this.genNewQuestionNAnswer();
        this.codeDiv.html(this.cCode);
        for (var i = 0; i < this.numPrints; i++) {
            this.inputBox = $("<input>").attr({
                'placeholder': 'Enter your answer here',
                'id' : this.divid + '_input_' + i
            }).addClass("form-control input-box");

            this.subPrompt = $("<div>").html("How many times will <code>" + this.printContent[i] + "</code> print?");
            this.subQuestionDiv = $("<div>").attr("id", this.divid + "_question_" + i).append(this.subPrompt, this.inputBox);
            this.inputDiv.append(this.subQuestionDiv);
        }
    }

    checkCurrentAnswer() {
        this.feedback_msg = []; // Clear feedback_msg.
        this.correct = true; // Initialize answer first as true, only update when incorrect choice occurs. 

        for (let i = 0; i < this.numPrints; i++) {
            let currAnswer = $("#" + this.divid + "_input_" + i).val().toString();
            if (currAnswer !== this.answerMap[this.printContent[i]].toString()) {
                this.correct = false;
                if (! currAnswer) { this.feedback_msg.push(`Incomplete answer for <code>${this.printContent[i]}</code>.<br>`); }
                else { this.feedback_msg.push(`Incorrect answer for how many times <code>${this.printContent[i]}</code> will print.<br>`); }
            }
        }
        if (this.correct === true) { this.feedback_msg.push($.i18n('msg_fork_correct')); }
        console.log(this.feedback_msg);
        this.updateFeedbackDiv();
    }

    updateTreeGraph(csv, labels) {
        $('#hierarchy_graph').html(hierarchy.drawHierarchy(csv, labels));
    }

    showProcessHierarchy() {
        $(this.hierarchyTreeDiv).css("display", "block");
        $(this.hierarchyTreeDiv).html(
            "<strong>Process Hierarchy Graph:</strong> Each node represents a process. The text within each node indicates what the process prints.<br><br>" + 
            "<div id='trace_hierarchy'><strong><mark style='background:yellow!important;line-height:90%;padding:0!important'>Click on the C-code above</mark> to see how the tree is built step by step.</strong></div>" +
            "<br>" +
            "<div id='hierarchy_graph'></div>"
        );
        $('#hierarchy_graph').html(hierarchy.drawHierarchy(this.csvTree, this.labels));
        this.bindCodeBlockEvents();
    }

    hideProcessHierarchy() {
        $(this.hierarchyTreeDiv).html("");
        $(this.hierarchyTreeDiv).css("display", "none");
    }

    showHelp() {
        $(this.helpDiv).css("display", "block");
        $(this.helpDiv).html(
            `<strong>Try viewing the process hierarchy to see full answer.</strong><br><br>
            For reference:
            <ul>
                <li><code>fork()</code> creates a new process. It returns 0 to the newly created child process, and returns the child process's ID (non-zero) to the parent process.</li>
                <li><code>exit()</code> terminates the process that calls it.</li>
            </ul>
            <br>For more detailed information, please refer to the <a href='https://diveintosystems.org/book/C13-OS/processes.html'>Processes section of Chapter 13.2</a> in <i>Dive into Systems</i>`
        );
    }

    hideHelp() {
        $(this.helpDiv).html("");
        $(this.helpDiv).css("display", "none");
    }

    initFeedback_Hierarchy_Help_Divs() {
        this.feedbackDiv = $('<div>').attr('id', this.divid + '_feedback').css('display', 'none');
        this.hierarchyTreeDiv = $('<div>').css('display', 'none').addClass('tree-div');
        this.helpDiv = $('<div>').css('display', 'none').addClass('help-div');

        this.containerDiv.append(this.feedbackDiv, this.helpDiv, this.hierarchyTreeDiv);
    }

    updateFeedbackDiv() {
        $(this.feedbackDiv).css('display', 'block').html(this.feedback_msg);
        if (this.correct === true) { $(this.feedbackDiv).attr('class', 'alert alert-info'); }
        else { $(this.feedbackDiv).attr('class', 'alert alert-danger'); }
        
        if (typeof MathJax !== 'undefined') { this.queueMathJax(document.body); }
    }

    bindCodeBlockEvents() {
        if ($(this.hierarchyTreeDiv).css('display') == 'block') {
            /* Highlight code line on mouseover */
            $(this.codeDiv).on('mouseover', 'span[data-block]', (event) => {
                const blockId = $(event.target).data('block');
                $(`span[data-block="${blockId}"]`).addClass('highlight');
            });
    
            /* Remove highlight line on mouseout */
            $(this.codeDiv).on('mouseout', 'span[data-block]', (event) => {
                const blockId = $(event.this).data('block');
                $(`span[data-block="${blockId}"]`).removeClass('highlight');
            });
    
            /* Re-draw tree on click */
            $(this.codeDiv).on('click', 'span[data-block]', (event) => {
                console.log(this.cCode);
                const blockId = $(event.target).data('block');
                const traceRoot = build.traceTree(this.source, blockId);
                const { csv: csvTree, valuesList : labels} = build.getTreeCSV(traceRoot);
                this.updateTreeGraph(csvTree, labels);
            });
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
            event: "ProcHierarchy",
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
    $("[data-component=processHierarchy]").each(function (index) {
        var opts = {
            orig: this,
            useRunestoneServices: eBookConfig.useRunestoneServices,
        };
        if ($(this).closest("[data-component=timedAssessment]").length == 0) {
            try {
                ProcHierarchyList[this.id] = new ProcHierarchy(opts);
            } catch (err) {
                console.log(
                    `Error rendering Process hierarchy problem ${this.id}
                     Details: ${err}`
                );
            }
        }
    });
});