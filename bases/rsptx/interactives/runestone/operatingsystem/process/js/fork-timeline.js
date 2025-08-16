/**
 * @file fork-timeline.js
 * @brief Interactive process timeline component for Runestone educational platform
 * 
 * This component provides an educational interface for learning about process
 * execution timelines and synchronization using fork(), wait(), and exit() system calls.
 * Students analyze possible output sequences from concurrent processes.
 * 
 * Key differences from hierarchy component:
 * - Focus on temporal execution order rather than parent-child relationships
 * - Timeline visualization showing concurrent execution
 * - Multiple choice questions about possible output sequences
 * - Emphasis on process synchronization and race conditions
 * 
 * Educational objectives:
 * - Understanding concurrent execution and output interleaving
 * - Process synchronization with wait() calls
 * - Temporal relationships between fork, wait, and exit operations
 * - Analysis of all possible execution orderings
 * 
 * @author Luyuan Fan, Tony Cao (Summer 2024), Zhengfei Li (Spring 2025)
 */

import RunestoneBase from "../../../common/js/runestonebase.js";
import "./fork-i18n.en.js";
import "../css/fork.css";
import "../css/timeline.css";
import * as build from "../algorithms/build.js";
import * as timeline from "../algorithms/timelineDraw.js"
import { analyzeSequenceList } from "../algorithms/timeline_statistics.js"
import { Pass } from "codemirror";
import { validLetter } from "jexcel";
import { updateHeightWithAutoMonitoring, disconnectAutoHeightUpdate } from "../../../../utils/updateHeight.js";

// ============================================================================
// CONSTANTS AND CONFIGURATION
// ============================================================================

/** Maximum attempts to generate a valid question before giving up */
const MAX_GENERATION_ATTEMPTS = 100;
/** Maximum number of alphabet letters available for print statements */
const MAX_ALPHABET_SIZE = 26;

// Global registry of all process timeline component instances
// Used for managing components outside of timed assessments
export var ProcTimelineList = {};


export default class ProcTimeline extends RunestoneBase {

    constructor(opts) {
        super(opts);
        var orig = opts.orig;
        this.useRunestoneServices = opts.useRunestoneServices;
        this.origElem = orig;       // Store reference to original element
        this.divid = orig.id;       // Component unique identifier

        // Logging and analytics setup
        this.componentId = this.getCID();    // Runestone component ID
        this.questionId = 1;                 // Question instance counter
        this.userId = this.getUserId();      // Current user identifier

        // Initialize the complete component interface
        this.createElements();

        // Log the component load event
        this.sendData(this.a2ID('load'));

        // Set up component metadata
        this.caption = "Process timeline";
        this.addCaption("runestone");

        // Enable syntax highlighting if Prism.js is available
        if (typeof Prism !== "undefined") {
            Prism.highlightAllUnder(this.containerDiv);
        }
    }

    scriptSelector(root_node) {
        return $(root_node).find(`script[type="application/json"]`);
    }

    // ============================================================================
    // COMPONENT INITIALIZATION AND SETUP
    // ============================================================================

    /**
     * Main method to create and initialize all component elements.
     * Timeline component setup includes:
     * 1. Parameter initialization and configuration parsing
     * 2. Question generation with complexity validation
     * 3. Multiple choice interface creation
     * 4. Interactive button setup (timeline, help, check answer)
     * 5. Feedback and visualization area creation
     * 6. Responsive height monitoring for dynamic content
     */
    createElements() {
        this.initParams();                                  // Parse configuration and set defaults
        this.initInputField();                              // Create question and checkbox interface
        this.initButtons();                                 // Create interactive buttons
        this.initFeedback_Hierarchy_Timeline_Help_Divs();  // Create feedback and visualization areas
        $(this.origElem).replaceWith(this.containerDiv);   // Replace placeholder with component
        
        const obj = this;
        // Set up automatic height monitoring for responsive timeline visualizations
        this.heightObserver = updateHeightWithAutoMonitoring(window, document, obj, true, {
            debounceDelay: 50,                              // Balanced delay for timeline rendering
            watchAttributes: ['style', 'class']            // Monitor visual state changes
        });
    }



    sendData(actionId) {
        let now = new Date();
        let bundle = {
            timestamp: now.toString(),
            componentId : this.componentId,
            questionId : this.questionId,
            actionId : actionId,
            userId : this.userId
        }
        if (this.id2A(actionId) !== 'load') {

            bundle.details = {
                config : {
                    hardCodedQuestion: `${this.hardCodedCCode}`,
                    regeneration: `${this.regeneration}`,
                    showMenu: `${this.showMenu}`,
                    // numForks: `${this.numForks}`,
                    // numPrints: `${this.numPrints}`,
                    // hasElse: `${this.hasElse}`,
                    // hasNest: `${this.hasNest}`,
                    // hasExit: `${this.hasExit}`,
                    // hasLoop: `${this.hasLoop}`,
                    selectedMode: this.showMenu === true ? `${this.modeMenu.val()}` : null
                },
                prompt : {
                    // displayedPrompt: `${this.cCode}`,
                    sourceCode: `${this.source}`
                },
                eval: ((actionId == this.a2ID("correct")) || (actionId == this.a2ID("incorrect"))) ? {
                    correctAnswer: `${this.logAnswer}`,
                    userAnswer: `${this.correct ? null : this.logUserAnswer}`,
                } : null
            }
        }
        else { bundle.details = null }

        this.logData(bundle);
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
                    considering the possible concurrency allowed by <code>fork()</code> and <code>wait()</code>.<br>
                    Please tick all of the possible output print sequences that could be produced by the program.<br>
                    <br>
                    For hints and definitions of the system calls, you may click on the <b>Help</b> button.<br>
                    You may draw the process timeline to help you answer the question, and verify your drawing by clicking the <b>Show process timeline</b> button.`);
            }
            if (params["source"] != undefined) { // Hard-coded source code
                this.hardCodedCCode = true;
                this.source = params["source"];
                if (params['regeneration'] != undefined) { this.regeneration = params['regeneration']; } else { console.error("Invalid regeneration param from .ptx file"); }
                if (params["preset-params"] != undefined && params["preset-params"] == true) { // If you want to hide the menu and manually set all parameters.
                    if (params['numForks'] != undefined) { this.numForks = params['numForks']; } else { console.error("Invalid numForks param from .ptx file"); }
                    if (params['numPrints'] != undefined) { this.numPrints = params['numPrints']; } else { console.error("Invalid numPrints param from .ptx file"); }
                    this.showMenu = false; 
                } else {
                    this.modes = ["1", "2", "3"];
                    this.showMenu = true;
                }
                if (!this.regeneration) {
                    this.showMenu = false;
                }
            }
            else {
                this.hardCodedCCode = false;
                this.regeneration = true;
                if (params["preset-params"] != undefined && params["preset-params"] == true) { // Manual parameter setting
                    if (params['numForks'] != undefined) { this.numForks = params['numForks']; } else { console.error("Invalid numForks param from .ptx file"); }
                    if (params['numPrints'] != undefined) { this.numPrints = params['numPrints']; } else { console.error("Invalid numPrints param from .ptx file"); }
                    this.showMenu = false;
                }
                else {
                    this.modes = ["1", "2", "3"];
                    this.showMenu = true;
                }
                if (!this.regeneration) {
                    this.showMenu = false;
                }
            }
        } catch (error) { console.error("Error loading parameters:", error); }
        this.printContent = [];
        for (var i = 0; i < MAX_ALPHABET_SIZE; i++) { // All letters available
            this.printContent.push(String.fromCharCode((i + 97)));
        }
    }

    initInputField() {
        this.containerDiv = $("<div>").attr("id", this.divid).addClass("proc-timeline-component");
        this.configDiv = $("<div>").addClass("config-box");

        // Instructions
        this.instruction = $("<div>").html("<span style='font-weight:bold'><u>Instructions</u></span>: " + this.instructionText).css("padding", "10px");

        // Mode menu
        if (this.showMenu == true) {
            this.configHelperText = $("<div>").html(
                `<span style='font-weight:bold'><u>Configure question</u></span>: 
                You can generate the C code block from several modes:<br>
                <ul style='line-height:90%'> 
                    <li><b>Mode 1</b> has 2 forks and the child process may or may not exit.</li> 
                    <li><b>Mode 2 and mode 3</b> guarantees that the child process will exit within the code snippet:
                        <ul style='line-height:90%'> 
                            <li><b>Mode 2</b> generates 2 forks.</li> 
                            <li><b>Mode 3</b> generates 3 forks: would be more complex.</li>
                        </ul>
                    </li> 
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
                .html("<code class='candidate-print-sequence'></code>");
            $label.find('code').text(printSeq);
            
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
        if (this.hardCodedCCode == false) { 
            this.updateSourceCode();
            this.genQuestionInfo();
            let i = 0;
            for (i = 0; i < MAX_GENERATION_ATTEMPTS; i++) {
                if (this.printSeqs.length > 2) {
                    break;
                }
                this.updateSourceCode();
                this.genQuestionInfo();
            }
            if (i == MAX_GENERATION_ATTEMPTS) {
                console.error(`Failed to generate a question with more than 2 print sequences after ${MAX_GENERATION_ATTEMPTS} attempts.`);
            }
        } else {
            if (this.regeneration == true) { this.hardCodedCCode = false; }
            this.genQuestionInfo();
        }
    }

    updateSourceCode() {
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
                    this.exit_disambig = true;
                    prev = this.source || "";
                    this.source = build.genSimpleWaitCodeMode1();
                    i = 0;
                    while (this.source === prev && i < MAX_GENERATION_ATTEMPTS) {
                        this.source = build.genSimpleWaitCodeMode1();
                        i++;
                    }
                    if (i == MAX_GENERATION_ATTEMPTS) {
                        console.error(`Failed to generate a new source code after ${MAX_GENERATION_ATTEMPTS} attempts.`);
                    }
                    break;
                default:
                    this.exit_disambig = false;
                    prev = this.source || "";
                    this.source = generateNewSourceCode();
                    i = 0;
                    while (this.source === prev && i < MAX_GENERATION_ATTEMPTS) {
                        this.source = generateNewSourceCode();
                        i++;
                    }
                    if (i == MAX_GENERATION_ATTEMPTS) {
                        console.error(`Failed to generate a new source code after ${MAX_GENERATION_ATTEMPTS} attempts.`);
                    }
                    break;
            }
        }
        else {
            let prev = this.source || "";
            this.source = generateNewSourceCode();
            let i = 0;
            while (this.source == prev && i < MAX_GENERATION_ATTEMPTS) {
                this.source = generateNewSourceCode();
                i++;
            }
            if (i == MAX_GENERATION_ATTEMPTS) {
                console.error(`Failed to generate a new source code after ${MAX_GENERATION_ATTEMPTS} attempts.`);
            }
        }  
    }

    genQuestionInfo() {
        [this.fullTree, this.cCode] = build.buildAndTranspile(this.source);
        const { csv: c, valuesList: l } = build.getTreeCSV(this.fullTree);
        this.csvTree = c;
        this.labels = l;
        [this.answerMap, this.printSeqs] = build.getAnswerSequence(this.source, this.exit_disambig);
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
            this.sendData(this.a2ID('generate'))
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

            this.sendData(this.a2ID(this.correct ? 'correct' : 'incorrect'))
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
            if ($(this.timelineDiv).css('display') == 'none') { this.showProcessTimeline(); this.sendData(this.a2ID('viewTimeline')) }
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
            if ($(this.helpDiv).css('display') == 'none') { this.showHelp(); this.sendData(this.a2ID('help')) }
            else { this.hideHelp(); }
        });

        this.buttonsDiv = $("<div>");

        if (this.regeneration) { this.buttonsDiv.append(this.generateButton); }
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
                .html("<code class='candidate-print-sequence'></code>");
            $label.find('code').text(printSeq);
            
            let $questionDiv = $("<div>")
                .attr("id", `${this.divid}_question_${i}`)
                .append($inputCheck, $label);
            
            this.inputDiv.append($questionDiv, $("<br>"));
        }
    }

    checkCurrentAnswer() {
        this.feedback_msg = []; // Clear feedback
        this.correct = true; // Start as correct, update if incorrect

        this.logUserAnswer = []
        this.logAnswer = []
        for (let i = 0; i < this.printSeqs.length; i++) {
            if (!this.answerMap.hasOwnProperty(this.printSeqs[i])) {
                continue;
            }
            let currAnswer = $("#" + this.divid + "_input_" + i).prop("checked");
            this.logUserAnswer.push(currAnswer)
            let currSolution = !this.answerMap[this.printSeqs[i]]; // map stores incorrect answers
            this.logAnswer.push(currSolution)
            if (currAnswer !== currSolution) {
                this.correct = false;
            }
        }
        if (this.correct === true) { this.feedback_msg.push($.i18n('msg_fork_correct')); }
        else { 
            if (this.exit_disambig) {
                this.feedback_msg.push($.i18n('msg_fork_timeline_incorrect_exit_disambig'));
            } else {
                this.feedback_msg.push($.i18n('msg_fork_timeline_incorrect_general'));
            }
        }
        this.updateFeedbackDiv();
    }

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
            "<strong>Process Timeline Graph:</strong> This diagram shows the execution timeline of processes. " +
            "Moving along the horizontal axis to the right represents time elapsed, and each horizontal contiguous line represents the sequence of a process execution. " + 
            "Vertical arrows represents the fork-wait-exit relationship between different processes.<br><br>" + 
            "<br>" +
            "<div id='timeline_graph'></div>"
        );
        let constraints = build.printSequenceConstraints(this.source)
        // Timeline parameters
        this.tl_width = 0.9 * $(this.timelineDiv).width();
        const stats = analyzeSequenceList(constraints);
        this.fork_depth = stats.maxDepth;
        this.fork_width = stats.maxWidth;
        this.tl_height = this.fork_width === 0 ? this.tl_width * 0.6 : 
            Math.min(this.tl_width * this.fork_depth / this.fork_width, this.tl_width * 0.6);
        // Debug info for timeline dimensions
        // console.log("Fork depth is", this.fork_depth, "and fork width is", this.fork_width, "and tl_height is", this.tl_height);
        this.margin = { top: 20, right: 20, bottom: 20, left: 20 };
        const traceArray = [];
        const extra_trace = { value: "" };
        // const refreshCode = () => console.log("Refreshed");

        $('#timeline_graph').html(timeline.drawTimeline(constraints, this.tl_width, this.tl_height, this.margin, this.fork_depth, this.fork_width));
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
                <li><code>wait()</code> is a blocking call by the parent process that waits for the child process to exit before continuing.</li>
            </ul>
            <br>For more detailed information, please refer to the <a href='https://diveintosystems.org/book/C13-OS/processes.html' target='_blank'>Processes section of Chapter 13.2</a> in <i>Dive into Systems</i>`
        );
        this.helpDiv[0].getElementsByTagName('a')[0].addEventListener('click', ()=>{
            this.sendData(this.a2ID('textbook'))
        })
        
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
        // pass
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

    // Clean up resources when component is destroyed
    destroy() {
        // Disconnect the automatic height update observer
        if (this.heightObserver) {
            disconnectAutoHeightUpdate(this, document);
        }
        // Call parent cleanup if available
        if (super.destroy) {
            super.destroy();
        }
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