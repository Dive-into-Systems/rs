// Process Timeline component for fork/wait/exit visualization
// Initiated by Luyuan Fan and Tony Cao (Summer 2024)
// Fixed and finalized by Zhengfei Li (Spring 2025-Summer 2025)

import RunestoneBase from "../../../common/js/runestonebase.js";
import "./fork-i18n.en.js";
import "../css/fork.css";
import "../css/timeline.css";
import * as build from "../algorithms/build.js";
// import * as hierarchy from "../algorithms/hierarchyDraw.js";
import * as timeline from "../algorithms/timelineDraw.js"
import { analyzeSequenceList } from "../algorithms/timeline_statistics.js"
import { Pass } from "codemirror";
import { validLetter } from "jexcel";
import { updateHeight } from "../../../../utils/updateHeight.js";

export var ProcTimelineList = {}; // All instances not in timed assessment

export default class ProcTimeline extends RunestoneBase {
    constructor(opts) {
        super(opts);
        var orig = opts.orig;
        this.useRunestoneServices = opts.useRunestoneServices;
        this.origElem = orig;
        this.divid = orig.id;

        // Logging data fields
        this.componentId = "13.6";
        this.questionId = 1;
        this.userId = this.getUserId();

        this.createElements();
        this.caption = "Process timeline";
        this.addCaption("runestone");

        if (typeof Prism !== "undefined") {
            Prism.highlightAllUnder(this.containerDiv);
        }
    }

    scriptSelector(root_node) {
        return $(root_node).find(`script[type="application/json"]`);
    }

    // Create the ProcTimeline Element
    createElements() {
        this.initParams();
        this.initInputField();
        this.initButtons();
        this.initFeedback_Hierarchy_Timeline_Help_Divs();
        $(this.origElem).replaceWith(this.containerDiv); // Replace intermediate HTML with rendered component
        const obj = this;
        updateHeight(window, document, obj, true);
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
                    In this exercise, you'll analyze a C program that utilizes <code>fork()</code>, 
                    <code>wait()</code>, and <code>exit()</code> system calls to manage process creation and synchronization. <br>
                    Your task is to determine which of the provided output sequences could be produced by the program, 
                    considering the possible concurrency allowed by <code>fork()</code> and synchronization required by
                    <code>wait()</code>.<br>
                    Please tick all of the possible output print sequences that could be produced by the program.`);
            }
            if (params["source"] != undefined) { // Hard-coded source code
                this.hardCodedCCode = true;
                this.source = params["source"];
                if (params['numForks'] != undefined) { this.numForks = params['numForks']; } else { console.error("Invalid numForks param from .ptx file"); }
                if (params['numPrints'] != undefined) { this.numPrints = params['numPrints']; } else { console.error("Invalid numPrints param from .ptx file"); }
                this.showMenu = false;
            }
            else {
                this.hardCodedCCode = false;
                if (params["preset-params"] != undefined && params["preset-params"] == true) { // Manual parameter setting
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
        for (var i = 0; i < 26; i++) { // All letters available
            this.printContent.push(String.fromCharCode((i + 97)));
        }
    }

    initInputField() {
        this.containerDiv = $("<div>").attr("id", this.divid);
        this.configDiv = $("<div>").addClass("config-box");

        // Instructions
        this.instruction = $("<div>").html("<span style='font-weight:bold'><u>Instructions</u></span>: " + this.instructionText).css("padding", "10px");

        // Mode menu
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

        // Generate initial question and answers
        this.genNewQuestionNAnswer();

        // C-code and input checkboxes
        this.codeDiv = $("<div>").addClass("code-div-inline").html(this.cCode);
        this.inputDiv = $("<div>").addClass("input-div-inline");

        this.codeDiv.html(this.cCode);
        for (let i = 0; i < this.printSeqs.length; i++) {
            let printSeq = this.printSeqs[i];
            if (!this.answerMap.hasOwnProperty(printSeq)) {
                continue;
            }
            
            // Create checkbox and label
            let $inputCheck = $("<input>").attr({
                type: 'checkbox',
                id: `${this.divid}_input_${i}`
            });
            
            let $label = $("<label>")
                .attr("for", `${this.divid}_input_${i}`)
                .html("<code class='candidate-print-sequence'>" + printSeq + "</code>");
            
            let $questionDiv = $("<div>")
                .attr("id", `${this.divid}_question_${i}`)
                .append($inputCheck, $label);
            
            this.inputDiv.append($questionDiv, $("<br>"));
        }

        // Combine all elements
        this.promptDiv = $("<div>").addClass("prompt-div").append(this.codeDiv, this.inputDiv);
        this.containerDiv.append(this.instruction);
        if (this.showMenu == true) {
            this.containerDiv.append($("<br>"), this.configDiv);
        }
        this.containerDiv.append(this.promptDiv);

        // Default Runestone setup
        $(this.origElem).children().clone().appendTo(this.containerDiv);
        this.scriptSelector(this.containerDiv).remove();
    }

    // Generate new question and answer based on current configuration
    genNewQuestionNAnswer() {
        if (this.hardCodedCCode == false) { this.updateSourceCode(); }

        this.genQuestionInfo();
        let i = 0;
        for (i = 0; i < 100; i++) {
            if (this.printSeqs.length > 2) {
                break;
            }
            this.updateSourceCode();
            this.genQuestionInfo();
        }
        console.log("numForks and numPrints are", this.numForks, this.numPrints);
        console.log("source code is", this.source);
        console.log("printSeqs are", this.printSeqs);
        if (i == 100) {
            console.error("Failed to generate a question with more than 2 print sequences after 100 attempts.");
        }
    }

    updateSourceCode() {
        console.log("Show menu is", this.showMenu);
        const generateNewSourceCode = () => {
            const ret = build.genSimpleWaitCode(this.numForks, this.numPrints);
            return ret;
        };

        if (this.showMenu == true) {
            const mode = this.modeMenu.val().toString();
            switch (mode) {
                case "2":
                    this.numForks = 2;
                    this.numPrints = this.pick([6, 7, 8]);
                    break;
                case "3":
                    this.numForks = 3;
                    this.numPrints = this.pick([8, 9, 10]);
                    break;
                default:
                    break;
            }
            let prev, i;
            switch (mode) {
                case "1":
                    prev = this.source || "";
                    this.source = build.genSimpleWaitCodeMode1();
                    i = 0;
                    while (this.source === prev && i < 100) {
                        this.source = build.genSimpleWaitCodeMode1();
                        i++;
                    }
                    if (i == 100) {
                        console.error("Failed to generate a new source code after 100 attempts.");
                    }
                    break;
                default:
                    prev = this.source || "";
                    this.source = generateNewSourceCode();
                    i = 0;
                    while (this.source === prev && i < 100) {
                        this.source = generateNewSourceCode();
                        i++;
                    }
                    if (i == 100) {
                        console.error("Failed to generate a new source code after 100 attempts.");
                    }
                    break;
            }
        }
        else {
            let prev = this.source || "";
            this.source = generateNewSourceCode();
            let i = 0;
            while (this.source == prev && i < 100) {
                this.source = generateNewSourceCode();
                i++;
            }
            if (i == 100) {
                console.error("Failed to generate a new source code after 100 attempts.");
            }
        }
        console.log("Timeline Parameters: numForks and numPrints are", this.numForks, this.numPrints);
        console.log("Timeline Source code is", this.source);
    }

    genQuestionInfo() {
        [this.fullTree, this.cCode] = build.buildAndTranspile(this.source);
        const { csv: c, valuesList: l } = build.getTreeCSV(this.fullTree);
        this.csvTree = c;
        this.labels = l;
        [this.answerMap, this.printSeqs] = build.getAnswerSequence(this.source);
    }
    
    // Randomly pick one item in list
    pick(myList) {
        return myList[Math.floor(Math.random() * (myList.length))];
    }

    initButtons() {
        this.containerDiv.append($('<br>'));

        // Generate another question button
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

        // Check answer button
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

        // Reveal tree button
        // this.revealTreeButton = document.createElement("button");
        // this.revealTreeButton.textContent = $.i18n("msg_fork_reveal_tree");
        // $(this.revealTreeButton).attr({
        //     class: "btn btn-success",
        //     type: "button",
        //     id: this.divid + "draw_tree",
        // });
        // this.revealTreeButton.addEventListener("click", () => {
        //     if ($(this.hierarchyTreeDiv).css('display') == 'none') { this.showProcessHierarchy(); }
        //     else { this.hideProcessHierarchy(); }
        // });

        // Reveal timeline button
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

        // Help button
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

        // Unbind event handlers before clearing
        $(this.codeDiv).off('mouseover', 'span[data-block]');
        $(this.codeDiv).off('mouseout', 'span[data-block]');
        $(this.codeDiv).off('click', 'span[data-block]');

        $(this.feedbackDiv).css("display", "none");
        // $(this.hierarchyTreeDiv).css("display", "none").empty();
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
            
            // Create checkbox and label
            let $inputCheck = $("<input>").attr({
                type: 'checkbox',
                id: `${this.divid}_input_${i}`
            });
            
            let $label = $("<label>")
                .attr("for", `${this.divid}_input_${i}`)
                .html("<code class='candidate-print-sequence'>" + printSeq + "</code>");
            
            let $questionDiv = $("<div>")
                .attr("id", `${this.divid}_question_${i}`)
                .append($inputCheck, $label);
            
            this.inputDiv.append($questionDiv, $("<br>"));
        }
    }

    checkCurrentAnswer() {
        this.feedback_msg = []; // Clear feedback
        this.correct = true; // Start as correct, update if incorrect

        for (let i = 0; i < this.printSeqs.length; i++) {
            if (!this.answerMap.hasOwnProperty(this.printSeqs[i])) {
                continue;
            }
            let currAnswer = $("#" + this.divid + "_input_" + i).prop("checked");
            let currSolution = !this.answerMap[this.printSeqs[i]]; // map stores incorrect answers
            console.log("Current answer is", currAnswer, "and solution is", currSolution);
            if (currAnswer !== currSolution) {
                this.correct = false;
            }
        }
        if (this.correct === true) { this.feedback_msg.push($.i18n('msg_fork_correct')); }
        else { this.feedback_msg.push(`Feedback TBD<br>`); }
        this.updateFeedbackDiv();
    }

    // updateTreeGraph(traceCsv, traceLabels) {
    //     console.log("Trace CSV is", traceCsv);
    //     console.log("Trace labels is", traceLabels);
    //     $('#hierarchy_graph').html(hierarchy.drawHierarchy(traceCsv, traceLabels));
    // }

    // showProcessHierarchy() {
    //     $(this.hierarchyTreeDiv).css("display", "block");
    //     $(this.hierarchyTreeDiv).html(
    //         "<strong>Process Hierarchy Graph:</strong> Each node represents a process. The text within each node indicates what the process prints.<br><br>" + 
    //         "<div id='trace_hierarchy'><strong><mark style='background:yellow!important;line-height:90%;padding:0!important'>Click on the C-code above</mark> to see how the tree is built step by step.</strong></div>" +
    //         "<br>" +
    //         "<div id='hierarchy_graph'></div>"
    //     );
    //     $('#hierarchy_graph').html(hierarchy.drawHierarchy(this.csvTree, this.labels));
    //     console.log("Real ones", this.csvTree, this.labels);
    //     this.bindCodeBlockEvents();
    // }

    showProcessTimeline() {
        $(this.timelineDiv).css("display", "block");
        $(this.timelineDiv).html(
            "<strong>Process Timeline Graph:</strong> Lorem ipsum description of Process Timeline<br><br>" + 
            "<div id='trace_hierarchy'>Lorem ipsum description of Process Timeline</div>" +
            "<br>" +
            "<div id='timeline_graph'></div>"
        );
        let constraints = build.printSequenceConstraints(this.source)
        // Timeline parameters
        const tl_width = 0.9 * $(this.timelineDiv).width();
        const stats = analyzeSequenceList(constraints);
        const fork_depth = stats.maxDepth;
        const fork_width = stats.maxWidth;
        const tl_height = tl_width * fork_depth / fork_width * 1.2;
        const margin = { top: 20, right: 20, bottom: 20, left: 20 };
        const traceArray = [];
        const extra_trace = { value: "" };
        const refreshCode = () => console.log("Refreshed");

        $('#timeline_graph').html(timeline.drawTimeline(constraints, tl_width, tl_height, margin));
        console.log("Real ones", this.csvTree, this.labels);
        console.log("print seq for ", this.source, "\n", constraints);
        this.bindCodeBlockEvents();
    }

    // hideProcessHierarchy() {
    //     // Remove SVG elements before hiding
    //     $(this.hierarchyTreeDiv).find('svg').remove();
    //     $(this.hierarchyTreeDiv).html("");
    //     $(this.hierarchyTreeDiv).css("display", "none");
    // }

    hideProcessTimeline() {
        // Remove SVG elements before hiding
        $(this.timelineDiv).find('svg').remove();
        $(this.timelineDiv).html("");
        $(this.timelineDiv).css("display", "none");
    }

    showHelp() {
        $(this.helpDiv).css("display", "block");
        $(this.helpDiv).html(
            `<strong>Try viewing the process timeline to see full answer.</strong><br><br>
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
        // this.hierarchyTreeDiv = $('<div>').css('display', 'none').addClass('tree-div');
        this.timelineDiv = $('<div>').css('display', 'none').addClass('tree-div');
        this.helpDiv = $('<div>').css('display', 'none').addClass('help-div');

        // this.containerDiv.append(this.feedbackDiv, this.helpDiv, this.hierarchyTreeDiv, this.timelineDiv);
        this.containerDiv.append(this.feedbackDiv, this.helpDiv, this.timelineDiv);
    }

    updateFeedbackDiv() {
        $(this.feedbackDiv).css('display', 'block').html(this.feedback_msg);
        if (this.correct === true) { $(this.feedbackDiv).attr('class', 'alert alert-info feedback-div'); }
        else { $(this.feedbackDiv).attr('class', 'alert alert-danger feedback-div'); }
        
        if (typeof MathJax !== 'undefined') { this.queueMathJax(document.body); }
    }

    bindCodeBlockEvents() {
        // Unbind existing handlers to prevent accumulation
        $(this.codeDiv).off('mouseover', 'span[data-block]');
        $(this.codeDiv).off('mouseout', 'span[data-block]');
        $(this.codeDiv).off('click', 'span[data-block]');
        
        // if ($(this.hierarchyTreeDiv).css('display') == 'block' || $(this.timelineDiv).css('display') == 'block') {
        if ($(this.timelineDiv).css('display') == 'block') {
            // Highlight on mouseover
            $(this.codeDiv).on('mouseover', 'span[data-block]', (event) => {
                const blockId = $(event.target).data('block');
                $(`span[data-block="${blockId}"]`).addClass('highlight');
            });
    
            // Remove highlight on mouseout
            $(this.codeDiv).on('mouseout', 'span[data-block]', (event) => {
                const blockId = $(event.target).data('block');
                $(`span[data-block="${blockId}"]`).removeClass('highlight');
            });
    
            // Handle clicks for both hierarchy and timeline
            $(this.codeDiv).on('click', 'span[data-block]', (event) => {
                const blockId = $(event.target).data('block');
                
                // Update hierarchy if visible
                // if ($(this.hierarchyTreeDiv).css('display') == 'block') {
                //     const traceRoot = build.traceTree(this.source, blockId);
                //     console.log("Trace root is", traceRoot, "and blockId is", blockId);
                //     const { csv: csvTree, valuesList: labels } = build.getTreeCSV(traceRoot);
                //     this.updateTreeGraph(csvTree, labels);
                // }
                
                // Update timeline if visible
                if ($(this.timelineDiv).css('display') == 'block') {
                    const constraints = build.printSequenceConstraints(this.source);
                    const tl_width = 0.9 * $(this.timelineDiv).width();
                    const tl_height = 0.7 * $(this.timelineDiv).width();
                    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
                    
                    // Get highlight info for timeline
                    // const highlightInfo = this.getTimelineHighlightInfo(constraints, blockId);
                    console.log("blockId is", blockId);
                    // Redraw timeline with highlight
                    $('#timeline_graph').html(timeline.drawTimeline(
                        constraints, 
                        tl_width, 
                        tl_height, 
                        margin,
                        blockId
                    ));
                }
            });
        }
    }

    getTimelineHighlightInfo(constraints, blockId) {
        // Convert blockId to position in sequence
        const position = parseInt(blockId);
        
        let currentPos = 0;
        let highlightInfo = {
            nodeId: null,
            edgeId: null
        };
        
        // Recursively search constraints for matching position
        const findPosition = (constraint, parentNode = null) => {
            if (typeof constraint === 'string') {
                if (currentPos === position) {
                    highlightInfo.nodeId = currentPos;
                    return true;
                }
                currentPos++;
                return false;
            } else {
                // Check beforeWait, child, afterWait
                if (findPosition(constraint.beforeWait, currentPos)) {
                    return true;
                }
                
                if (findPosition(constraint.child, currentPos)) {
                    return true;
                }
                
                if (findPosition(constraint.afterWait, currentPos)) {
                    return true;
                }
            }
            
            return false;
        };
        
        findPosition(constraints);
        return highlightInfo;
    }

    // Storage methods (unused but required)
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
    
    // Log answer to server
    async logCurrentAnswer(sid) {
        let answer = JSON.stringify(this.inputNodes);
        let feedback = true;
        // Save locally
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
        // Render feedback
        this.updateFeedbackDiv();
        return data;
    }
}

// Initialize components on login complete
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
                    `Error rendering Process Timeline problem ${this.id}
                     Details: ${err}`
                );
            }
        }
    });
});