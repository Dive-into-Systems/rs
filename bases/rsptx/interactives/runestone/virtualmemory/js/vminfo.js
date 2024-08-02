// *********
// vmInfo.js
// *********
// This file contains the JS for the Runestone vmInfo component. It was created By Luyuan Fan, Zhengfei Li, and Yue Zhang, 06/06/2023. 
"use strict";

import RunestoneBase from "../../common/js/runestonebase.js";
import "./vminfo-i18n.en.js";
import "../css/vminfo.css";
import { Pass } from "codemirror";

export var vmInfoList = {}; // Object containing all instances of vmInfo that aren't a child of a timed assessment.

// vmInfo constructor
export default class vmInfo extends RunestoneBase {
    constructor(opts) {
        super(opts);
        var orig = opts.orig; // entire <p> element
        this.useRunestoneServices = opts.useRunestoneServices;
        this.origElem = orig;
        this.divid = orig.id;
        this.correct = null;

        // Fields for logging data
        this.componentId = "13.1";
        this.questionId = 1;
        this.userId = this.getUserId();

        this.createvmInfoElement();
        this.caption = "Virtual Memory Information";
        this.addCaption("runestone");
        // this.checkServer("vmInfo", true);
        if (typeof Prism !== "undefined") {
            Prism.highlightAllUnder(this.containerDiv);
        }
    }
    // Find the script tag containing JSON in a given root DOM node.
    scriptSelector(root_node) {
        return $(root_node).find(`script[type="application/json"]`);
    }
    /*===========================================
    ====   functions generating final HTML   ====
    ===========================================*/
    createvmInfoElement() {
        this.feedbackDiv = document.createElement("div");
        this.initParams();
        this.rendervmInfoInput();
        this.rendervmInfoButtons();
        this.rendervmInfofeedbackDiv();
        // replaces the intermediate HTML for this component with the rendered HTML of this component
        $(this.origElem).replaceWith(this.containerDiv);
        
    }

    initParams() {
        this.setDefaultParams();
        this.loadParams();
    }

    setDefaultParams() {
        this.num_bits_list = [8, 12, 16];
    }

    loadParams() {
        try {
            const currentOptions = JSON.parse(
                this.scriptSelector(this.origElem).html()
            );
            if (currentOptions["num-bits-list"] != undefined) {
                this.num_bits_list = currentOptions["num-bits-list"];
            }
        } catch (error) {
            // pass
        }
    }

    rendervmInfoInput() {
        // Generate the drop-down menu for cache organization
        this.containerDiv = document.createElement("div");
        this.questionDiv = document.createElement("div");
        this.containerDiv.id = this.divid;
        
        // Question Display //
        // create the helper instruction
        this.helperDiv = document.createElement("div");
        this.helperDiv.innerHTML = "In this assignment, you will answer questions about sizes " +
        "of physical memory and virtual memory based on the configuration of virtual addresses, RAM size and page/frame size.";

        // create the address in the question prompt
        this.partitionNode = document.createElement("div");
        this.bitNodeText = document.createTextNode("-bit virtual address");
        this.bitNodeBit = document.createElement("code");
        this.bitNodeBit.textContent = this.num_bits;
        this.frameNodeText = document.createTextNode(" frames of physical RAM");
        this.frameNodeFrame = document.createElement("code");
        this.frameNodeFrame.textContent = this.num_frames;
        this.blockNodeText = document.createTextNode("-byte page/frame size");
        this.blockNodeBlock = document.createElement("code");
        this.blockNodeBlock.textContent = this.block_size;
        this.partitionNode.appendChild(this.bitNodeBit);
        this.partitionNode.appendChild(this.bitNodeText);
        this.partitionNode.appendChild(document.createElement("br"));
        this.partitionNode.appendChild(this.frameNodeFrame);
        this.partitionNode.appendChild(this.frameNodeText);
        this.partitionNode.appendChild(document.createElement("br"));
        this.partitionNode.appendChild(this.blockNodeBlock);
        this.partitionNode.appendChild(this.blockNodeText);
        this.partitionNode.style.textAlign = "center";
        this.partitionNode.style.fontSize = "x-large";

        // create the menus and put the question prompt together
        this.statementDiv = document.createElement("div");
        this.statementDiv.appendChild(this.helperDiv);
        this.statementDiv.appendChild(document.createElement("br"));
        this.statementDiv.appendChild(this.partitionNode);
        this.statementDiv.appendChild(document.createElement("br"));

        this.statementDiv.style.borderWidth = "1px";
        this.statementDiv.style.borderRadius = "5px";
        this.statementDiv.style.borderBlockStyle = "solid";
        this.statementDiv.style.borderBlockColor = "white";
        this.statementDiv.style.backgroundColor = "white";
        this.statementDiv.style.padding = "8px";

        
        // create answer field
        this.question1 = document.createElement("div");
        this.question1Prompt = document.createTextNode($.i18n("physical_memory") + "\t=\t");
        this.inputNode1 = document.createElement("input");
        this.question1.appendChild(this.question1Prompt);
        this.question1.appendChild(this.inputNode1);

        this.question2 = document.createElement("div");
        this.question2Prompt = document.createTextNode($.i18n("virtual_memory") + "\t=\t" );
        this.inputNode2 = document.createElement("input");
        this.question2.appendChild(this.question2Prompt);
        this.question2.appendChild(this.inputNode2);

        // add eventListener to the two input fields
        this.inputNodes = [this.inputNode1, this.inputNode2];
        for (var i = 0; i<2; i++) {
            this.inputNodes[i].addEventListener("keypress", function(e) {
                if (e.key === "Enter") {
                    e.preventDefault();
                    this.submitButton.click();
                }
            }.bind(this), false);  
        }
        this.questionDiv.appendChild(this.question1);
        this.questionDiv.appendChild(this.question2);

        // Append both the statement div and question div to the main containerDiv
        this.containerDiv.appendChild(this.statementDiv);
        this.containerDiv.appendChild(document.createElement("br"));
        this.bodyDiv = document.createElement("div");
        this.bodyDiv.appendChild(this.questionDiv);
        this.bodyDiv.setAttribute("class", "aligned-tables");
        this.createExpTable();
        this.containerDiv.appendChild(this.bodyDiv);
        this.containerDiv.appendChild(document.createElement("br"));

        // Copy the original elements to the container holding what the user will see.
        $(this.origElem).children().clone().appendTo(this.containerDiv);
        
        this.generateQuestion();
        this.generateAnswer();

        // Remove the script tag.
        this.scriptSelector(this.containerDiv).remove();
        // Set the class for the text inputs, then store references to them.
        let ba = $(this.containerDiv).find("input");
        ba.attr("class", "form form-control selectwidthauto");
        ba.attr("aria-label", "input area");
        ba.attr("type", "text");
        ba.attr("size", "10");
        ba.attr("maxlength", "10");
        ba.attr("placeholder", "your answer");
        
        this.blankArray = ba.toArray();
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

    rendervmInfoButtons() {
        // "check me" button and "generate a number" button
        this.submitButton = document.createElement("button");
        this.submitButton.textContent = $.i18n("msg_vminfo_check_me");
        $(this.submitButton).attr({
            class: "btn btn-success",
            name: "do answer",
            type: "button",
        });
        this.submitButton.addEventListener(
            "click",
            function () {
                this.checkCurrentAnswer();
                this.logCurrentAnswer();
            }.bind(this),
            false
        );
        
        this.generateButton = document.createElement("button");
        this.generateButton.textContent = $.i18n("msg_vminfo_generate_a_number");
        $(this.generateButton).attr({
            class: "btn btn-success",
            name: "Generate an Address",
            type: "button",
        });
        this.generateButton.addEventListener(
            "click",
            function () {
                this.generateQuestion();
                this.clearInput();
                this.generateAnswer();
            }.bind(this),
            false)
        ;

        this.containerDiv.appendChild(document.createElement("br"));
        this.containerDiv.appendChild(this.generateButton);
        this.containerDiv.appendChild(this.submitButton);
    }
    
    rendervmInfofeedbackDiv() {
        this.feedbackDiv.id = this.divid + "_feedback";
        this.containerDiv.appendChild(document.createElement("br"));
        this.containerDiv.appendChild(this.feedbackDiv);
    }

    // clear the input fields
    clearInput() {
        for ( var i = 0 ; i < 2; i ++ ) {
            this.inputNodes[i].value = "";
            // reset the style of each input field
            this.inputNodes[i].setAttribute("class", "form form-control selectwidthauto");
        }
    }
    
    // generate a question
    generateQuestion() {
        // randomly generate the number of bits, number of frames, and block size
        this.num_bits = this.num_bits_list[ this.generateRandomInt(0, this.num_bits_list.length ) ];
        this.num_frames = 1 << this.generateRandomInt(1,5);
        this.block_size = 1 << this.generateRandomInt(1, this.num_bits);
    }

    // parse exponential input, take string return int
    exponentialParser(input) {  
        var slice = input.split('^');
        if (slice.length === 2) {
            var base = parseFloat(slice[0]);
            var exponent = parseFloat(slice[1]);
            if (!isNaN(base) && !isNaN(exponent)) {
                return Math.pow(base, exponent);
            }
        }
        return input;
    }

    createExpTable() {
        this.expTable = document.createElement("table");
        this.expTable.setAttribute("width", "37%");
        this.expTableHead = document.createElement("thead");
        this.expTableHead.innerHTML = 
            "<tr><th style=\"border:1px solid rgb(90, 171, 127); background-color: rgb(250, 255, 250);\" colspan=\"8\">2 Exponential Table</th></tr>";
        this.expTable.appendChild(this.expTableHead);
        this.expTableBody = document.createElement("tbody");
        this.expTable.appendChild(this.expTableBody);

        for (let i = 1; i <= 4; i++) {
            var expTableRow = document.createElement("tr");
            expTableRow.innerHTML =
                "<td style=\"border:1px solid rgb(90, 171, 127); background-color: rgb(250, 255, 250); width:8%;\">2<sup>" + i.toString() + "</sup></td>" +
                "<td style=\"border:1px solid rgb(90, 171, 127); background-color: rgb(255, 255, 255); width:17%;\">" + (1 << i).toString() + "</td>" +
                "<td style=\"border:1px solid rgb(90, 171, 127); background-color: rgb(250, 255, 250); width:8%;\">2<sup>" + (i + 4).toString() + "</sup></td>" +
                "<td style=\"border:1px solid rgb(90, 171, 127); background-color: rgb(255, 255, 255); width:17%;\">" + (1 << (i + 4)).toString() + "</td>" +
                "<td style=\"border:1px solid rgb(90, 171, 127); background-color: rgb(250, 255, 250); width:8%;\">2<sup>" + (i + 8).toString() + "</sup></td>" +
                "<td style=\"border:1px solid rgb(90, 171, 127); background-color: rgb(255, 255, 255); width:17%;\">" + (1 << (i + 8)).toString() + "</td>" +
                "<td style=\"border:1px solid rgb(90, 171, 127); background-color: rgb(250, 255, 250); width:8%;\">2<sup>" + (i + 12).toString() + "</sup></td>" +
                "<td style=\"border:1px solid rgb(90, 171, 127); background-color: rgb(255, 255, 255); width:17%;\">" + (1 << (i + 12)).toString() + "</td>";
            this.expTableBody.appendChild(expTableRow);
        }

        this.bodyDiv.appendChild(this.expTable);
    }

    // generate the answer as a string based on the randomly generated number
    generateAnswer() {
        this.hidefeedback();
        this.questionDiv.style.visibility = "visible";
        this.displayFeed = [];
        
        // the physical memory size is the product of number of frame and the block size
        this.physical_memory_size = this.num_frames * this.block_size;
        // the virtual memory size is two to the power of number of bits
        this.virtual_memory_size = 1 << this.num_bits;

        this.answers = [this.physical_memory_size, this.virtual_memory_size];
        this.generatePrompt();
    }

    /*===================================
    === Checking/loading from storage ===
    ===================================*/
    restoreAnswers(data) {
        // pass
    }
    checkLocalStorage() {
        // pass
    }
    setLocalStorage(data) {
        // pass
    }
    
    // check if the answer is correct
    checkCurrentAnswer() {
        // the answer is correct if each of the input field is the same as its corresponding value in this.answers
        this.correct = true;
        this.feedback_msg = [];
        for (var i = 0; i < 2; i ++ ) {
            var input_value = this.inputNodes[i].value;
            input_value = this.exponentialParser(input_value);
            if ( input_value === "" ) {
                this.feedback_msg.push($.i18n("msg_vminfo_no_answer"));
                this.correct = false;
                // change the style of input field to alert-danger when no answer provided
                this.inputNodes[i].setAttribute("class", "alert alert-danger");
            } else if ( input_value != this.answers[i] ) {
                this.feedback_msg.push($.i18n("msg_vminfo_incorrect_"+i.toString()));
                this.correct = false;
                // change the style of input field to alert-danger when the answer is wrong
                this.inputNodes[i].setAttribute("class", "alert alert-danger");            
            } else {
                this.feedback_msg.push($.i18n("msg_vminfo_correct"));
                // 
                this.inputNodes[i].setAttribute("class", "alert alert-info");
            }
        }
    }

    async logCurrentAnswer(sid) {
        let answer = JSON.stringify([this.inputNodes[0].value, this.inputNodes[1].value]);
        let question = JSON.stringify({
            "num-bits"  : this.num_bits,
            "num-frames": this.num_frames,
            "block-size": this.block_size
        });
        // Save the answer locally.
        let feedback = true;
        this.setLocalStorage({
            answer: answer,
            timestamp: new Date(),
        });
        let data = {
            event: "vmInfo",
            act: answer || "",
            answer: answer || "",
            correct: this.correct ? "T" : "F",
            div_id: this.divid,
        };
        if (typeof sid !== "undefined") {
            data.sid = sid;
            feedback = false;
        }
        
        this.renderfeedback();
        return data;
    }

    // update the prompt
    generatePrompt() {
        this.bitNodeBit.textContent = this.num_bits;
        this.frameNodeFrame.textContent = this.num_frames;
        this.blockNodeBlock.textContent = this.block_size;
    }

    hidefeedback() {
        this.feedbackDiv.style.display = 'none';
    }

    displayfeedback() {
        this.feedbackDiv.style.display = 'block';
    }

    // generate a random integer in [lower, upper)
    generateRandomInt(lower, upper) {
        return lower + Math.floor((upper - lower) * Math.random());
    }

    renderfeedback() {
        // only the feedback message needs to display
        var feedback_html = "";
        // append the two feedback messages respectively
        for ( var i = 0; i < 2; i ++ ) {
            feedback_html += "<dev>" + this.feedback_msg[i] + "</dev>";
            if ( i < 1 ) {
                feedback_html += "<br/>";
            }
        }

        if (this.correct) {
            $(this.feedbackDiv).attr("class", "alert alert-info");
        } else {
            $(this.feedbackDiv).attr("class", "alert alert-danger");
        }
        
        this.feedbackDiv.innerHTML = feedback_html;
        this.displayfeedback();
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
    $("[data-component=vminfo]").each(function (index) {
        var opts = {
            orig: this,
            useRunestoneServices: eBookConfig.useRunestoneServices,
        };
        if ($(this).closest("[data-component=timedAssessment]").length == 0) {
            // If this element exists within a timed component, don't render it here
            try {
                vmInfoList[this.id] = new vmInfo(opts);
            } catch (err) {
                console.log(
                    `Error rendering Cache Information Problem ${this.id}
                     Details: ${err}`
                );
            }
        }
    });
});
