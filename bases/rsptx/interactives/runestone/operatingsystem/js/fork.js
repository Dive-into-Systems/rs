// *********
// fork.js
// *********
// This file contains the process hierarchy component. 
// It is created by Luyuan Fan and Tony Cao (Summer 2024). 

import RunestoneBase from "../../common/js/runestonebase.js";
import "./fork-i18n.en.js";
import "../css/fork.css";
import * as build from "../algorithms/build.js";
import * as hierarchy from "../algorithms/hierarchyDraw.js";
import * as timeline from "../algorithms/timelineDraw.js";
import { Pass } from "codemirror";
import { validLetter } from "jexcel";

export var ForkList = {}; // Object containing all instances of Fork that aren't a child of a timed assessment.

export default class Fork extends RunestoneBase {
    constructor(opts) {
        super(opts);
        var orig = opts.orig;
        this.useRunestoneServices = opts.useRunestoneServices;
        this.origElem = orig;
        this.divid = orig.id;
        
        this.createForkElement();
        this.caption = "Process hierarchy";
        // this.addCaption("runestone");

        // this.checkServer("fork", true);
        if (typeof Prism !== "undefined") {
            Prism.highlightAllUnder(this.containerDiv);
        }
        // $(document).on('click', '.reference-trigger', function() {
        //     $(this).next('.reference-content').toggle();
        // });
    }

    scriptSelector(root_node) {
        return $(root_node).find(`script[type="application/json"]`);
    }

    /*===========================================
    ====   Functions generating final HTML   ====
    ===========================================*/

    // Create the Fork Element
    createForkElement() {
        this.initParams();
        this.initForkInputField();
        this.initForkButtons();
        this.initFeedback_Hierarchy_Timeline_Divs();
        $(this.origElem).replaceWith(this.containerDiv); // replaces the intermediate HTML for this component with the rendered HTML of this component
    }

    initParams() {
        try {
            const params = JSON.parse(
                this.scriptSelector(this.origElem).html()
            );
            // TODO: make it possible to just pass in a source string.
            if (params["preset-params"] != undefined && params["preset-params"] == true) { // If you want to hide the menu and manually set all parameters.
                if (params['numForks'] != undefined) { this.numForks = params['numForks']; } else {this.numForks = 2; }
                if (params['numPrints'] != undefined) { this.numPrints = params['numPrints']; } else {this.numPrints = 3; }
                if (params['hasElse'] != undefined) { this.hasElse = params['hasElse']; } else { this.hasElse = false; }
                if (params['hasNest'] != undefined) { this.hasNest = params['hasNest']; } else { this.hasNest = false; }
                if (params['hasExit'] != undefined) { this.hasExit = params['hasExit']; } else { this.hasExit = false; }
                if (params['hasLoop'] != undefined) { this.hasLoop = params['hasLoop']; } else { this.hasLoop = false; }
                this.showMenu = false;
            }
            else {
                this.modes = ["1", "2", "3"];
                this.showMenu = true;
            }
        } catch (error) { console.error("Error loading parameters:", error); }
        // this.showMenu = true;
        // this.modes = ["1", "2", "3"];
        this.printContent = [];
        for (var i = 0; i < 26; i++) { // All letters are available. 
            this.printContent.push(String.fromCharCode((i + 97)));
        }
        this.modes = ["1", "2", "3"];
        this.lastSource = "";
        this.proc_ancestors = [];
        this.proc_extra = {value: ""};
    }

    initForkInputField() {
        this.containerDiv = $("<div>").attr("id", this.divid);

        /* Instructions */
        this.instruction = $("<div>").html(
            "<span style='font-size:large;font-weight:bold'>Instructions</span><br><br>" +
            "This question intends to guide you through understanding parent-child relationships between processes. " +
            "For the code snippet shown below (assuming all calls to <code>fork()</code> succeed), " + 
            "answer <strong>how many times</strong> each letter is printed with <code>printf()</code>.<br>"
        );
        this.statementDiv = $("<div>").addClass("statement-box");

        /* Mode menu */
        // console.log("Checking is params are set", this.showMenu);
        if (this.showMenu == true) {
            this.configHelperText = $("<div>").html(
                "<br><br><span style='font-size:large;font-weight:bold'>Configure this question</span><br><br>" +
                "You can generate the C code block from several modes:<br>" +
                "<ul style='line-height:90%'>" + 
                    "<li>Mode 1 creates a small number of processes with if structures.</li>" + 
                    "<li>Mode 2 has more processes with if-else structures and nested conditions.</li>" +
                    "<li>Mode 3 has everything in mode 2 and introduces exits.</li>" + 
                "</ul>"
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
        // Create C-code section
        this.codeDiv = $("<div>").addClass("code-div-inline");
        this.updateCodeDiv();


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
        this.statementDiv.append(this.instruction);
        if (this.showMenu == true) { this.statementDiv.append(this.configHelperText, this.label, this.modeMenu); }
        this.containerDiv.append(this.statementDiv, this.promptDiv);

        /* Some default Runestone things */
        $(this.origElem).children().clone().appendTo(this.containerDiv); // Copy the original elements to the container holding what the user will see.
        // this.scriptSelector(this.containerDiv).remove(); // Remove the script tag.
    }

    updateCodeDiv() {
        const formatLine = (codeLine, index, isBold) => {
            const formattedLine = isBold ? `<b>${codeLine}</b>` : codeLine;
            return (formattedLine.includes("}")) ? `<span data-block="${index}">${formattedLine}</span>` : `<span>${formattedLine}</span>`;
        };
        const debugProcs = false;

        let cBoldCode = this.rawCode.map((codeLine, index) => {
            const db_trace = debugProcs? ` // ${this.code_trace[index]??[]}` :"";
            for (const activeProcInLine of this.code_trace[index]??[]) {
                if (this.proc_ancestors.includes(activeProcInLine)) {
                    return formatLine(codeLine+db_trace, index, true);
                }
                if (this.proc_extra.value && activeProcInLine == this.proc_extra.value) {
                    this.proc_extra.value = "";
                    return formatLine(codeLine+db_trace, index, true);
                }
            }
            return formatLine(codeLine+db_trace, index, false);
        }).join('<br>');

        this.codeDiv.html(cBoldCode);
    }

    
    pick(myList) { // randomly pick one item in list
        return myList[Math.floor(Math.random() * (myList.length))];
    }

    updateSourceCode() {
        const mode = this.modeMenu?this.modeMenu.val().toString():1;
        var prev = this.source || "";
        // console.log("mode is", mode);
        for (let i = 0; this.source == prev && i < 10; i++) {
            if (mode === "2") {
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
                this.hasElse = true;
                this.hasLoop = false;
            }
            
            this.source = build.genRandSourceCode(this.numForks, this.numPrints, this.hasNest, this.hasExit, this.hasElse, this.hasLoop);
        }
    }
    // genSourceNAnswers() {
        
    // }

    // Update configurations based on current menu choice, generate a new question, and its FULL answer. 
    genNewQuestionNAnswer() {
        this.updateSourceCode();
        [this.root, this.rawCode, this.code_trace] = build.buildAndTranspile(this.source);
        const { csv: c, valuesList: l } = build.getTreeCSV(this.fullTree);
        this.csvTree = c;
        this.labels = l;
        this.answerMap = build.getAnswer(this.fullTree, this.numPrints);
    }

    initForkButtons() {
        this.containerDiv.append($('<br>'));

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
            this.clearInputNFeedbackField();
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
        $('input').val("");
        this.clearGraphics();
        this.inputDiv.html("");
        this.rightDiv.html("");
        $(this.feedbackDiv).css("display", "none");
        $(this.hierarchyTreeDiv).css("display", "none").empty();
        $(this.timelineDiv).css("display", "none");
    }

    updatePrompts(){
        this.genNewQuestionNAnswer();
        this.updateCodeDiv();
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
        else { this.feedback_msg.push(`<br>`); }
        console.log(this.feedback_msg);
        this.updateFeedbackDiv();
    }

    updateTreeGraph(csv, labels) {
        $('#hierarchy_graph').html(hierarchy.drawHierarchy(csv, labels));
    }

    showProcessHierarchy() {
        this.clearGraphics();
        $(this.hierarchyTreeDiv).css("display", "block");
        $(this.hierarchyTreeDiv).html(
            "<strong>Process Hierarchy Graph:</strong> Each node represents a process. The text within each node indicates what the process prints.<br>" + 
            "<div id='trace_hierarchy'><strong>Click on the C-code above to see how the tree is built step by step.</strong></div>" +
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

    clearGraphics() {
        this.proc_extra.value = "";
        this.proc_ancestors = [];
        this.updateCodeDiv();
        this.hideTimeline();
        this.hideProcessHierarchy();
    }

    showTimeline() {
        this.clearGraphics();
        $(this.timelineDiv).css("display", "block");
        const [tl_width, tl_height, tl_margin] = [
            650,
            500,
            {top: 20,bottom: 20,left: 20,right: 20,}
        ];
        $(this.timelineDiv).html(timeline.drawTimeline(this.root, tl_width, tl_height, tl_margin, this.proc_ancestors, this.proc_extra, () => this.updateCodeDiv()));
    }
    
    hideTimeline() {
        $(this.timelineDiv).css("display", "none");
    }

    initFeedback_Hierarchy_Timeline_Divs() {
        this.feedbackDiv = $('<div>').attr('id', this.divid + '_feedback').css('display', 'none');
        this.hierarchyTreeDiv = $('<div>').css('display', 'none').addClass('tree-div');
        this.timelineDiv = $('<div>').attr('id', this.divid + 'timeline_graph').css('display', 'none').addClass('tree-div');

        this.containerDiv.append(this.feedbackDiv, this.hierarchyTreeDiv, this.timelineDiv);
    }

    updateFeedbackDiv() {
        $(this.feedbackDiv).css('display', 'block').html(this.feedback_msg);
        if (this.correct === true) { $(this.feedbackDiv).attr('class', 'alert alert-info'); }
        else { 
            $(this.feedbackDiv).attr('class', 'alert alert-danger');
            this.createReferenceSection();
        }
        
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
                console.log(this.rawCode.join("\n"));
                const blockId = $(event.target).data('block');
                const partialTreeRoot = build.partialTree(this.source, blockId);
                const { csv: csvTree, valuesList : labels} = build.getTreeCSV(partialTreeRoot);
                this.updateTreeGraph(csvTree, labels);
            });
        }
    }

    createReferenceSection() {
        var referenceTrigger = $("<u>").addClass('reference-trigger').css({
            'cursor': 'pointer',
            'text-decoration': 'underline'
        }).text('For reference');

        var referenceContent = $("<div>").addClass('reference-content').html(`
            <ul>
                <li><code>fork()</code> creates a new process. It returns 0 to the newly created child process, and returns the child process's ID (non-zero) to the parent process.</li>
                <li><code>exit()</code> terminates the process that calls it.</li>
            </ul>
            <br>For more detailed information, please refer to the <a href='https://diveintosystems.org/book/C13-OS/processes.html'>Processes section of Chapter 13.2</a> in <i>Dive into Systems</i>
        `);
    
        referenceTrigger.click(function() {
            $(this).next('.reference-content').toggle();
        });
    
        $(this.feedbackDiv).append(referenceTrigger, referenceContent);
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
            ForkList[this.id] = new Fork(opts);
            // try {
            // } catch (err) {
            //     console.log(
            //         `Error rendering Forking Problem ${this.id}
            //          Details: ${err}`
            //     );
            // }
        }
    });
});