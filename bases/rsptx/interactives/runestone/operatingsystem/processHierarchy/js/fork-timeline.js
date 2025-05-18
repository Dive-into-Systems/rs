// *********
// fork.js
// *********
// This file contains the process hierarchy component. 
// It is created by Luyuan Fan and Tony Cao (Summer 2024). 

import RunestoneBase from "../../../common/js/runestonebase.js";
import "./fork-i18n.en.js";
import "../css/fork.css";
import "../css/timeline.css";
import * as build from "../algorithms/build.js";
import * as hierarchy from "../algorithms/hierarchyDraw.js";
import * as timeline from "../algorithms/timelineDraw.js"
import { Pass } from "codemirror";
import { validLetter } from "jexcel";

export var ProcTimelineList = {}; // Object containing all instances of Fork that aren't a child of a timed assessment.

export default class ProcTimeline extends RunestoneBase {
    constructor(opts) {
        super(opts);
        var orig = opts.orig;
        this.useRunestoneServices = opts.useRunestoneServices;
        this.origElem = orig;
        this.divid = orig.id;

        // Fields for logging data
        this.componentId = "13.6";
        this.questionId = 1;
        this.userId = this.getUserId();

        this.createElements();
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

    // Create the ProcTimeline Element
    createElements() {
        this.initParams();
        this.initInputField();
        this.initButtons();
        this.initFeedback_Hierarchy_Timeline_Help_Divs();
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
                this.instructionText = (`
                    In this exercise, you’ll analyze a C program that utilizes <code>fork()</code>, 
                    <code>wait()</code>, and <code>exit()</code> system calls to manage process creation and synchronization.
                    Your task is to determine which of the provided output sequences could be produced by the program, 
                    considering the possible interleavings of parent and child process executions.<br>
                    Please tick all of the possible output sequences that could be produced by the program.`);
            }
            if (params["source"] != undefined) { // If you want to pass in a source code string for generating the C-code. 
                this.hardCodedCCode = true;
                this.source = params["source"];
                if (params['numForks'] != undefined) { this.numForks = params['numForks']; } else { console.error("Invalid numForks param from .ptx file"); }
                if (params['numPrints'] != undefined) { this.numPrints = params['numPrints']; } else { console.error("Invalid numPrints param from .ptx file"); }
                this.showMenu = false;
            }
            else {
                this.hardCodedCCode = false;
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
            }
        } catch (error) { console.error("Error loading parameters:", error); }
        this.printContent = [];
        for (var i = 0; i < 26; i++) { // All letters are available. 
            this.printContent.push(String.fromCharCode((i + 97)));
        }
    }

    initInputField() {
        this.containerDiv = $("<div>").attr("id", this.divid);
        this.configDiv = $("<div>").addClass("config-box");

        /* Instructions */
        this.instruction = $("<div>").html("<span style='font-weight:bold'><u>Instructions</u></span>: " + this.instructionText).css("padding", "10px");

        /* Mode menu */
        if (this.showMenu == true) {
            this.configHelperText = $("<div>").html(
                `<span style='font-weight:bold'><u>Configure question</u></span>: 
                You can generate the C code block from several modes:<br>
                <ul style='line-height:90%'> 
                    <li>Mode 1 simpler with 2 forks.</li> 
                    <li>Mode 2 more complex with 3 forks.</li>
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
                this.loadAnotherQuestion();
            });
            this.configDiv.append(this.configHelperText, this.label, this.modeMenu);
        }

        /* Generate initial question and answers */
        this.genNewQuestionNAnswer();

        /* C-code and input checkboxes */
        this.codeDiv = $("<div>").addClass("code-div-inline").html(this.cCode);

        this.inputDiv = $("<div>").addClass("input-div-inline");

        this.codeDiv.html(this.cCode);
        for (let i = 0; i < this.printSeqs.length; i++) {
            let printSeq = this.printSeqs[i];
            if (!this.answerMap.hasOwnProperty(printSeq)) {
                continue;
            }
            
            // Create a checkbox input element.
            let $inputCheck = $("<input>").attr({
                type: 'checkbox',
                id: `${this.divid}_input_${i}`
            });
            
            // Create a label associated with the checkbox.
            let $label = $("<label>")
                .attr("for", `${this.divid}_input_${i}`)
                .html("<code class='candidate-print-sequence'>" + printSeq + "</code>");
            
            // Create a div to contain the checkbox and label.
            let $questionDiv = $("<div>")
                .attr("id", `${this.divid}_question_${i}`)
                .append($inputCheck, $label);
            
            // Append the div to the parent container.
            this.inputDiv.append($questionDiv, $("<br>"));
        }

        /* Combine all elements into the container */
        this.promptDiv = $("<div>").addClass("prompt-div").append(this.codeDiv, this.inputDiv);
        this.containerDiv.append(this.instruction);
        if (this.showMenu == true) {
            this.containerDiv.append($("<br>"), this.configDiv);
        }
        this.containerDiv.append(this.promptDiv);

        /* Some default Runestone things */
        $(this.origElem).children().clone().appendTo(this.containerDiv); // Copy the original elements to the container holding what the user will see.
        this.scriptSelector(this.containerDiv).remove(); // Remove the script tag.
    }


    // Update configurations based on current menu choice, generate a new question, and its FULL answer. 
    genNewQuestionNAnswer() {
        if (this.hardCodedCCode == false) { this.updateSourceCode(); }
        this.forkEdges = [];    // will hold { parentID, childID }
        this.waitEdges = [];    // will hold { fromExitID, toWaitID }
        console.log(this.numForks, this.numPrints, this.hasNest, this.hasExit, this.hasElse, this.hasLoop);
        console.log(this.source);
        this.genQuestionInfo();
    }

    updateSourceCode() {
        // this.testCodeGen();
        console.log("Show menu is", this.showMenu);
        const generateNewSourceCode = () => {
            const ret = build.genSimpleWaitCode(this.numForks, this.numPrints);
            return ret;
        };

        if (this.showMenu == true) {
            const mode = this.modeMenu.val().toString();
            switch (mode) {
                case "2":
                    this.numForks = 3;
                    this.numPrints = this.pick([8, 9, 10]);
                    break;
                case "3":
                    this.numForks = 4;
                    this.numPrints = this.pick([9, 10, 11]);
                    break;
                default:
                    this.numForks = 2;
                    this.numPrints = this.pick([6, 7]);
                    break;
            }
            let prev = this.source || "";
            this.source = generateNewSourceCode();
            while (this.source == prev) {
                this.source = generateNewSourceCode();
            }
        }
        else {
            let prev = this.source || "";
            this.source = generateNewSourceCode();
            while (this.source == prev) {
                this.source = generateNewSourceCode();
            }
        }
    }

    genQuestionInfo() {
        [this.fullTree, this.cCode] = build.buildAndTranspile(this.source);
        const { csv: c, valuesList: l } = build.getTreeCSV(this.fullTree);
        this.csvTree = c;
        this.labels = l;
        [this.answerMap, this.printSeqs] = build.getAnswerSequence(this.source);
        while (this.printSeqs.length <= 2) {
            this.updateSourceCode();
            [this.fullTree, this.cCode] = build.buildAndTranspile(this.source);
            const { csv: c, valuesList: l } = build.getTreeCSV(this.fullTree);
            this.csvTree = c;
            this.labels = l;
            [this.answerMap, this.printSeqs] = build.getAnswerSequence(this.source);
        }
    }
    
    // Randomly pick one item in list
    pick(myList) {
        return myList[Math.floor(Math.random() * (myList.length))];
    }

    initButtons() {
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
            this.loadAnotherQuestion();
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
            this.checkCurrentAnswer();
            this.updateFeedbackDiv();
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

        /* Reveal timeline button */
        this.revealTimeLineButton = document.createElement("button");
        this.revealTimeLineButton.textContent = $.i18n("msg_fork_reveal_timeline");
        $(this.revealTimeLineButton).attr({
            class: "btn btn-success",
            type: "button",
            id: this.divid + "draw_timeline",
        });
        this.revealTimeLineButton.addEventListener("click", () => {
            if ($(this.timelineDiv).css('display') == 'none') { this.showProcessTimeline(); }
            else { this.hideProcessTimeline(); }
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
            if ($(this.helpDiv).css('display') == 'none') { this.showHelp(); }
            else { this.hideHelp(); }
        });

        this.buttonsDiv = $("<div>");

        if (this.hardCodedCCode == false) { this.buttonsDiv.append(this.generateButton); }
        this.buttonsDiv.append(this.revealTreeButton);
        this.buttonsDiv.append(this.revealTimeLineButton);
        this.buttonsDiv.append(this.helpButton);
        this.buttonsDiv.append(this.checkAnswerButton);

        this.containerDiv.append(this.buttonsDiv);
    }

    clearInputNFeedbackField () {
        $('input').val("");
        this.inputDiv.html("");

        $(this.feedbackDiv).css("display", "none");
        $(this.hierarchyTreeDiv).css("display", "none").empty();
        $(this.timelineDiv).css("display", "none").empty();
        $(this.helpDiv).css("display", "none");
    }

    loadAnotherQuestion(){
        this.genNewQuestionNAnswer();
        this.codeDiv.html(this.cCode);
        for (let i = 0; i < this.printSeqs.length; i++) {
            let printSeq = this.printSeqs[i];
            if (!this.answerMap.hasOwnProperty(printSeq)) {
                continue;
            }
            
            // Create a checkbox input element.
            let $inputCheck = $("<input>").attr({
                type: 'checkbox',
                id: `${this.divid}_input_${i}`
            });
            
            // Create a label associated with the checkbox.
            let $label = $("<label>")
                .attr("for", `${this.divid}_input_${i}`)
                .html("<code class='candidate-print-sequence'>" + printSeq + "</code>");
            
            // Create a div to contain the checkbox and label.
            let $questionDiv = $("<div>")
                .attr("id", `${this.divid}_question_${i}`)
                .append($inputCheck, $label);
            
            // Append the div to the parent container.
            this.inputDiv.append($questionDiv, $("<br>"));
        }
    }

    checkCurrentAnswer() {
        this.feedback_msg = []; // Clear feedback_msg.
        this.correct = true; // Initialize answer first as true, only update when incorrect choice occurs. 

        for (let i = 0; i < this.printSeqs.length; i++) {
            if (!this.answerMap.hasOwnProperty(this.printSeqs[i])) {
                continue;
            }
            let currAnswer = $("#" + this.divid + "_input_" + i).prop("checked");
            let currSolution = !this.answerMap[this.printSeqs[i]]; // map stores whether the answer is incorrect or not
            console.log("Current answer is", currAnswer, "and solution is", currSolution);
            if (currAnswer !== currSolution) {
                this.correct = false;
            }
        }
        if (this.correct === true) { this.feedback_msg.push($.i18n('msg_fork_correct')); }
        else { this.feedback_msg.push(`Feedback TBD<br>`); }
        this.updateFeedbackDiv();
    }

    updateTreeGraph(traceCsv, traceLabels) {
        console.log("Trace CSV is", traceCsv);
        console.log("Trace labels is", traceLabels);
        $('#hierarchy_graph').html(hierarchy.drawHierarchy(traceCsv, traceLabels));
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
        console.log("Real ones", this.csvTree, this.labels);
        this.bindCodeBlockEvents();
    }

    showProcessTimeline() {
        $(this.timelineDiv).css("display", "block");
        $(this.timelineDiv).html(
            "<strong>Process Timeline Graph:</strong> Lorem ipsum description of Process Timeline<br><br>" + 
            "<div id='trace_hierarchy'>Lorem ipsum description of Process Timeline</div>" +
            "<br>" +
            "<div id='timeline_graph'></div>"
        );
        
        // some params
        const tl_width = 0.9 * $(this.timelineDiv).width();
        const tl_height = 0.7 * $(this.timelineDiv).width();
        const margin = { top: 20, right: 20, bottom: 20, left: 20 };
        const traceArray = [];
        const extra_trace = { value: "" };
        const refreshCode = () => console.log("Refreshed");

        $('#timeline_graph').html(timeline.drawTimeline(this.fullTree, tl_width, tl_height, margin, traceArray, extra_trace, refreshCode));
        console.log("Real ones", this.csvTree, this.labels);
        let constraints = build.printSequenceConstraints(this.source)
        console.log("print seq for ", this.source, "\n", constraints);
        console.log(build.getPrintSequence(constraints));
        for (let i = 0; i < 10; i++) {
            let [seq, inc] = build.getPrintSequenceIncorrect(constraints);
            // console.log(seq, "incorrect?: ", inc);
        }
        this.bindCodeBlockEvents();
    }

    hideProcessHierarchy() {
        $(this.hierarchyTreeDiv).html("");
        $(this.hierarchyTreeDiv).css("display", "none");
    }

    hideProcessTimeline() {
        $(this.timelineDiv).html("");
        $(this.timelineDiv).css("display", "none");
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
            <br>For more detailed information, please refer to the <a href='https://diveintosystems.org/book/C13-OS/processes.html' target='_blank'>Processes section of Chapter 13.2</a> in <i>Dive into Systems</i>`
        );
    }

    hideHelp() {
        $(this.helpDiv).html("");
        $(this.helpDiv).css("display", "none");
    }

    initFeedback_Hierarchy_Timeline_Help_Divs() {
        this.feedbackDiv = $('<div>').attr('id', this.divid + '_feedback').css('display', 'none').addClass('feedback-div');
        this.hierarchyTreeDiv = $('<div>').css('display', 'none').addClass('tree-div');
        this.timelineDiv = $('<div>').css('display', 'none').addClass('tree-div');
        this.helpDiv = $('<div>').css('display', 'none').addClass('help-div');

        this.containerDiv.append(this.feedbackDiv, this.helpDiv, this.hierarchyTreeDiv, this.timelineDiv);
    }

    updateFeedbackDiv() {
        $(this.feedbackDiv).css('display', 'block').html(this.feedback_msg);
        if (this.correct === true) { $(this.feedbackDiv).attr('class', 'alert alert-info feedback-div'); }
        else { $(this.feedbackDiv).attr('class', 'alert alert-danger feedback-div'); }
        
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
            event: "ProcTimeline",
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
    $("[data-component=processTimeline]").each(function (index) {
        var opts = {
            orig: this,
            useRunestoneServices: eBookConfig.useRunestoneServices,
        };
        if ($(this).closest("[data-component=timedAssessment]").length == 0) {
            try {
                ProcTimelineList[this.id] = new ProcTimeline(opts);
            } catch (err) {
                console.log(
                    `Error rendering Process hierarchy problem ${this.id}
                     Details: ${err}`
                );
            }
        }
    });
});