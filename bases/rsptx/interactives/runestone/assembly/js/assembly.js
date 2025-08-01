// *********
// assembly.js
// *********
// This file contains the JS for the Runestone Assembly component. It was created By Arys Aikyn, Tony Cao 06/03/2024
"use strict";

//before

import RunestoneBase from "../../common/js/runestonebase.js";
import "./assembly-i18n.en.js";
import "../css/assembly.css";
import { Pass } from "codemirror";
import { validLetter } from "jexcel";
import { ARM64_OPS, X86_32_OPS, X86_64_OPS } from "./arch_generate.js";

export var ASMList = {}; // Object containing all instances of ASM

// ASM constructor
export default class ASM_EXCERCISE extends RunestoneBase {
    constructor(opts) {
        super(opts);
        var orig = opts.orig; // entire <p> element
        this.origElem = orig;
        this.divid = orig.id;
        this.useRunestoneServices = opts.useRunestoneServices;

        // Fields for logging data
        this.componentId = this.getCID();
        this.questionId = 1;
        this.userId = this.getUserId();

        // create an container div to store the displayed component
        this.containerDiv = $("<div>").attr("id", this.divid);

        // tempo value holder
        this.arith_checked = true;
        this.bit_checked = true;
        this.memo_checked = true;


        // number of questions in the excercise
        this.num_q_in_group = 6;

        this.setDefaultParams();
        this.setCustomizedParams();
        this.genPromptsNAnswer();

        this.renderHeader();
        this.renderCheckboxes();
        this.renderQuestions();
        this.renderTryAgainButton();

        this.sendData(this.a2ID('load'))
        $(this.origElem).replaceWith(this.containerDiv);
    }

    // Find the script tag containing JSON in a given root DOM node.
    scriptSelector(root_node) {
        return $(root_node).find(`script[type="application/json"]`);
    }

    /*===========================================
 ==== Functions generating final HTML ====
 ===========================================*/

    // set default parameters
    setDefaultParams() { }

    // load customized parameters
    setCustomizedParams() {
        const currentOptions = JSON.parse(
            this.scriptSelector(this.origElem).html(),
        );
        if (currentOptions["architecture"] != undefined) {
            this.architecture = currentOptions["architecture"];
        }

        switch (this.architecture) {
            case "X86_32":
                this.generator = new X86_32_OPS();
                this.architecture_str = 'IA-32';
                break;
            case "X86_64":
                this.generator = new X86_64_OPS();
                this.architecture_str = 'x86_64';
                break;
            case "ARM64":
                this.generator = new ARM64_OPS();
                this.architecture_str = 'ARM';
                break;
            default:
                throw new Error("Invalid architecture option");
        }
    }

    renderHeader() {

        this.instruction = $("<div>").html(
            "<span style='font-weight:bold'><u>Instructions</u></span>: For each of the following " +
            "For each of the following " +
            this.architecture_str +
            " instructions, indicate whether the instruction " +
            "<b>could</b> be valid or invalid",
        );
        this.statementDiv = $("<div>").append(this.instruction);
        this.statementDiv.append("<br>");
        this.statementDiv.addClass("statement-box");
        this.containerDiv.append(this.statementDiv);
    }

    renderCheckboxes() {
        // create three checkboxes that will be used later on for question generation
        let instructionTypes_temp = [
            { label: "Arithmetic", value: "arithmetic" },
            { label: "Bit Operations", value: "bitmanipulation" },
        ];

        switch (this.architecture) {
            case "X86_32":
                instructionTypes_temp.push({ label: "Memory Manipulation", value: "memorymanipulation" });
                break;
            case "X86_64":
                instructionTypes_temp.push({ label: "Memory Manipulation", value: "memorymanipulation" });
                break;
            case "ARM64":
                instructionTypes_temp.push({ label: "Data Movement", value: "memorymanipulation" });
                break;
            default:
                throw new Error("Invalid architecture option");
        }

        const instructionTypes = instructionTypes_temp;

        const instructionTypeDiv = $("<div>").attr(
            "id",
            this.divid + "_instruction_types",
        );
        instructionTypeDiv.append($("<div>").html("<strong><u>Configure Questions:</u></strong>" + " Select the types of instructions you want to be included in your question. This will configure the type of question you will attempt." + "<br></br>"));


        instructionTypes.forEach((family) => {
            let checkbox = $("<input>").attr({
                type: "checkbox",
                id: family.value,
                value: family.value,
                checked: true,
            });
            checkbox.on("change", (event) => {
                // Store the current state of checkboxes
                const prevArithChecked = this.arith_checked;
                const prevBitChecked = this.bit_checked;
                const prevMemoChecked = this.memo_checked;

                // Update the states based on the checkbox change
                switch (event.target.id) {
                    case "arithmetic":
                        this.arith_checked = event.target.checked;
                        break;
                    case "bitmanipulation":
                        this.bit_checked = event.target.checked;
                        break;
                    case "memorymanipulation":
                        this.memo_checked = event.target.checked;
                        break;
                }

                // Check the condition and possibly revert changes
                if (
                    !this.arith_checked &&
                    !this.bit_checked &&
                    !this.memo_checked
                ) {
                    event.preventDefault();
                    // Restore the previous states
                    this.arith_checked = prevArithChecked;
                    this.bit_checked = prevBitChecked;
                    this.memo_checked = prevMemoChecked;

                    // Restore the checkbox's checked state
                    $(event.target).prop("checked", !event.target.checked);
                }
            });

            const label = $("<label>")
                .attr("for", family.value)
                .text(family.label);
            instructionTypeDiv.append(checkbox).append(label).append(" ");
        });

        instructionTypeDiv.append("<br>");

        const customizationDiv = $("<div>").addClass("customization-container")
        customizationDiv.append(instructionTypeDiv);
        this.containerDiv.append(customizationDiv);
    }

    renderQuestions() {
        this.questionDiv = $("<div>");

        // input box generation
        this.inputBox = $("<div>"); // contains all prompts and buttons

        this.textNodes = []; // create a reference to all current textNodes for future update
        this.inputNodes = []; // create slots for inputs for future updates

        this.genPromptsNAnswer();

        // create and render all input fields in question group
        for (let i = 0; i < this.num_q_in_group; i++) {
            // create a prompt item node to contain the letter and the prompt
            this.mainFirstLine = $("<div>").css({
                display: "flex",
                "justify-content": "space-around",
            });

            // create the prompt
            const textNode = $(document.createElement("code")).text(
                this.promptList[i],
            ).css({
                "background-color": "white",
                "color": "black"
            });
            textNode.css({ "font-size": "large", height: "25px", "margin-left": "3px", });
            this.textNodes.push(textNode);
            

            // start appending the letter, the prompt, the feedback for the first line
            this.mainFirstLine.append(String.fromCharCode(i + 97) + ". ");
            this.mainFirstLine.append(textNode);

            this.mainSecondLine = $("<div>").css({
                display: "flex",
                "align-items": "center",
                "justify-content": "space-between",
            });

            // create a div to hold the radio buttons
            this.buttonsDiv = $("<div>").css({
                display: "flex",
                "align-items": "center",
                gap: "5px", // Adds space between elements
            });

            // create and render valid/invalid answer fields
            this.radioButtons = [];
            const btnYes = $("<input>")
                .attr({
                    type: "radio",
                    value: true,
                    name: this.divid + "YN" + i,
                    id: "Yes" + i,
                })
                .on("change", function () {
                    $(this).removeClass("highlightWrong");
                    $(this).next("label").removeClass("highlightWrong");
                    $(this).removeClass("highlightRight");
                    $(this).next("label").removeClass("highlightRight");
                })
                .addClass("centerplease");
            const lblYes = $("<label>")
                .attr("for", "Yes" + i)
                .text("VALID")
                .addClass("centerplease");

            // Add a label and radio button for the "Invalid" answer option
            const btnNo = $("<input>")
                .attr({
                    type: "radio",
                    value: false,
                    name: this.divid + "YN" + i,
                    id: "No" + i,
                })
                .on("change", function () {
                    $(this).removeClass("highlightWrong");
                    $(this).prev("label").removeClass("highlightWrong");
                    $(this).removeClass("highlightRight");
                    $(this).next("label").removeClass("highlightRight");
                })
                .addClass("centerplease");
            const lblNo = $("<label>")
                .attr("for", "No" + i)
                .text("INVALID")
                .addClass("centerplease");

            // Append the radio buttons and labels to the question div
            this.buttonsDiv.append(lblYes);
            this.buttonsDiv.append(btnYes);
            this.buttonsDiv.append(lblNo);
            this.buttonsDiv.append(btnNo);

            this.submitButton = $("<button>")
                .text($.i18n("msg_asm_check_me")) // Using the localized string for the button text
                .attr({
                    class: "button-check",
                    name: "answer",
                    type: "button",
                    id: this.divid + "submit" + i,
                })
                .on(
                    "click",
                    function () {
                        this.checkThisAnswers(i);
                    }.bind(this),
                )
                .addClass("button-check checkingbutton");

            this.mainSecondLine.append(this.buttonsDiv);
            this.mainSecondLine.append(this.submitButton);

            // append the first and second line to the main div
            this.main = $("<div>").css({
                display: "flex",
                "flex-direction": "column",
                "align-items": "flex-start",
            });

            this.main.append(this.mainFirstLine);
            this.main.append(this.mainSecondLine);
            this.blankLine = document.createElement("div");
            this.blankLine.style.height = "1.5em";
            this.main.append(this.blankLine);

            // create the feedback
            const feedbackDiv = $("<span>")
                .attr("id", this.divid + "feedback" + i)
                .addClass("feedback")
                .css({ width: "300px", "text-wrap": "pretty", display: "flex", "justify-content": "center", "align-items": "center" });

            // creation of new div
            this.newDiv = $("<div>").attr("id", this.divid + "div" + i);
            this.newDiv.css({
                display: "flex",
                "justify-content": "space-between",
            });
            this.newDiv.append(this.main);
            this.newDiv.append(feedbackDiv);

            this.inputBox.append(this.newDiv);
            this.inputNodes.push([btnYes, btnNo]);
        }

        this.questionDiv.append(this.inputBox);

        // copy the original elements to the container holding what the user will see.
        $(this.origElem).children().clone().appendTo(this.containerDiv);

        this.questionDiv.addClass("statement-box");

        // remove the script tag.
        this.scriptSelector(this.containerDiv).remove();
        // ***div STRUCTURE***: questionDiv contains inputBox which contains number of question of newDiv.
        this.containerDiv.append(this.questionDiv);
    }

    genPromptsNAnswer() {
        this.promptList = [];
        this.answerList = [];
        this.feedbackMsgs = []; // Store the error types for feedback

        for (let i = 0; i < this.num_q_in_group; i++) {
            const [prompt, q_type, feedbackMsg] =
                this.generator.generate_question(
                    this.memo_checked,
                    this.arith_checked,
                    this.bit_checked,
                );

            this.promptList.push(prompt);
            this.answerList.push(q_type == 0);
            this.feedbackMsgs.push(feedbackMsg);
        }
    }

    checkThisAnswers(index) {
        const checkedAnswer = this.inputNodes[index].find((input) =>
            input.prop("checked"),
        );
        const feedbackDiv = $("#" + this.divid + "feedback" + index);
        feedbackDiv.removeClass("feedbackError").removeClass("feedbackCorrect");
        if (checkedAnswer === undefined) {
            feedbackDiv.html($("<span>").text(`Please choose one answer`));
            feedbackDiv.addClass("feedbackError");
            return;
        }
        const userAnswer = checkedAnswer.val() === "true";
        const correctAnswer = this.answerList[index];
        const feedbackMsg = this.feedbackMsgs[index];
        let btnName = this.divid + "YN" + index;

        let msg;
        if (userAnswer === correctAnswer) {
            msg = `Correct!`;
            feedbackDiv.addClass("feedbackCorrect");
            checkedAnswer.addClass("highlightRight");
            checkedAnswer.next("label").addClass("highlightRight");
        } else {
            msg = `Incorrect! ${feedbackMsg}`;
            feedbackDiv.addClass("feedbackError");
            checkedAnswer.addClass("highlightWrong");
            checkedAnswer.next("label").addClass("highlightWrong");
        }

        this.dataToBeLogged = {
            UserAnswer: userAnswer,
            Answer : correctAnswer,
            Correct : (userAnswer == correctAnswer),
            QuestionNumber : index,
            QuestionText : this.promptList[index],
        }

        this.sendData(this.a2ID( (userAnswer == correctAnswer) ? 'correct' : 'incorrect'))

        feedbackDiv.html($("<span>").text(`${msg}`));
    }

    renderTryAgainButton() {
        this.generateButton = document.createElement("button");
        this.generateButton.textContent = $.i18n("msg_asm_generate_another");
        $(this.generateButton).attr({
            class: "btn btn-success",
            name: "generate a number",
            type: "button",
            id: this.divid + "submit",
        });
        this.generateButton.addEventListener("click", () => {
            this.cleanInputNFeedbackField(); // clear answers, clear prev feedback, and enable all for the input fields
            this.updatePrompts();
            this.sendData(this.a2ID('generate'))
            
        });
        this.containerDiv.append("<br>");
        this.containerDiv.append(this.generateButton);
    }

    cleanInputNFeedbackField() {
        // clear all previous selection
        $('input[type="radio"]').prop("checked", false);

        // enable all previously disabled element
        for (let h = 0; h < this.num_q_in_group; h++) {
            var currDivID = this.divid + "div" + h; // index into the current div
            var currSubmitID = this.divid + "submit" + h; // index into the submit button in the current divid

            $("#" + currDivID)
                .prop("disabled", false)
                .removeClass("prohibited");
            $("#" + currDivID)
                .find("*")
                .prop("disabled", false)
                .removeClass("input[disabled]");
            $("#" + currDivID)
                .find("code")
                .removeClass("disabled-code");
            $(currSubmitID).prop("disabled", false);

            // clear individual feedback fields
            $("#" + this.divid + "feedback" + h).empty();
        }
    }

    updatePrompts() {
        // create and render all input fields in question group
        this.genPromptsNAnswer();
        for (let i = 0; i < this.num_q_in_group; i++) {
            this.textNodes[i].text(this.promptList[i]);
        }
        // clear and recreate feedback divs for each question
        for (let i = 0; i < this.num_q_in_group; i++) {
            $("#" + this.divid + "feedback" + i)
                .empty()
                .removeClass("feedbackError")
                .removeClass("feedbackCorrect"); // empty old feedback div
        }
    }

    async logCurrentAnswer(sid) {
        let answer = JSON.stringify(this.inputNode.value);
        // Save the answer locally.
        this.setLocalStorage({
            answer: answer,
            timestamp: new Date(),
        });
        let data = {
            event: "numconv",
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

    sendData(actionId) {
        let now = new Date();
        
        let checkedOPs = [];
        if (this.arith_checked){
            checkedOPs.push("Arithmetic");
        }
        if (this.bit_checked){
            checkedOPs.push("Bit Operations");
        }
        if (this.memo_checked){
            checkedOPs.push("Memory Manipulation");
        }

        let details; 
        if (this.id2A(actionId) == 'generate' || this.id2A(actionId) == 'load') {
            details = {
                config : {
                    checkedOperations : `${checkedOPs}`,
                },
            }
        }
        else if (this.id2A(actionId) == 'correct' || this.id2A(actionId) == 'incorrect'){
            details = {
                config : {
                    checkedOperations : `${checkedOPs}`,
                },
                prompt: {
                    displayedPrompt: `${this.dataToBeLogged.QuestionText}`,
                },
                eval: {
                    correctAnswer: `${this.dataToBeLogged.Answer}`,
                    userAnswer : this.dataToBeLogged.UserAnswer,
                    correct : this.dataToBeLogged.Correct,
                    questionNumber : this.dataToBeLogged.QuestionNumber,
                }
            }
        }
        else { details = null }

        this.logData(null, details, actionId, this.componentId);
    }

    /*===================================
 === Checking/loading from storage ===
 ===================================*/
    // Note: they are not needed here
}

/*=================================
== Find the custom HTML tags and ==
== execute our code on them ==
=================================*/
$(document).on("runestone:login-complete", function () {
    $("[data-component=assembly_syntax]").each(function (index) {
        var opts = {
            orig: this,
            useRunestoneServices: eBookConfig.useRunestoneServices,
        };
        if ($(this).closest("[data-component=timedAssessment]").length == 0) {
            // If this element exists within a timed component, don't render it here
            try {
                ASMList[this.id] = new ASM_EXCERCISE(opts);
            } catch (err) {
                console.log(
                    `Error rendering Assembly Syntax Problem ${this.id}\nDetails: ${err}\n${err.stack}`,
                );
            }
        }
    });
});
