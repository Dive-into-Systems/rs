// assembly_flag.js
// *********
// This file contains the JS for the Runestone Assembly Flag component. Created by Arys Aikyn, Kuzivakwashe Mavera 07/08/2024
"use strict";

import RunestoneBase from "../../common/js/runestonebase.js";
import "../css/assembly_flag.css";
import "./assembly-i18n.en.js";
import { Pass } from "codemirror";
import { validLetter } from "jexcel";

export var ASMFlagList = {}; // Object containing all instances of cachetable that aren't a child of a timed assessment.
const num_instructions = 1;
const num_registers = 2;

import { ARM64_OPS, X86_32_OPS, X86_64_OPS } from "./arch_generate.js";

// ASMFlag constructor
export default class ASMFlag_EXCERCISE extends RunestoneBase {
    constructor(opts) {
        super(opts);
        this.origElem = opts.orig;
        this.divid = opts.orig.id;
        this.useRunestoneServices = opts.useRunestoneServices;
        this.num_bits = 8

        // Fields for logging data
        this.componentId = "7.3";
        this.questionId = 1;
        this.userId = this.getUserId();

        this.createAssemblyFlagElement();
        $(this.origElem).replaceWith(this.containerDiv);
    }

    // Find the script tag containing JSON in a given root DOM node.
    scriptSelector(root_node) {
        return $(root_node).find(`script[type="application/json"]`);
    }

    /*===========================================
    ====   Functions generating final HTML   ====
    ===========================================*/

    createAssemblyFlagElement() {
        this.setDefaultParams();
        this.setCustomizedParams();
        this.containerDiv = $("<div>").attr("id", this.divid);
        this.renderHeader();
        this.renderCustomizations();
        this.generateNewQuestion();
    }

    renderHeader() {
        this.header = $("<div>").html(
            "Explore the effects of 'cmp' and 'test' instructions on processor flags within x86 architecture. " +
            "Observe the CF (Carry Flag), OF (Signed Overflow Flag), ZF (Zero Flag), and SF (Sign Flag). <br><br>"
        );
        this.containerDiv.append($("<div>").append(this.header));
    }

    renderCustomizations() {
        // Add any customization options here if needed
    }

    generateNewQuestion() {
        const [instruction, registers] = this.generator.generateRandomInitialFlag(num_instructions, num_registers);
        const flags = this.generator.analyzeFlagSettings(instruction[0], registers);

        this.containerDiv.empty();
        this.renderHeader();
        this.renderInstructionAndRegisters(instruction[0], registers);
        this.renderFlagQuestion(flags);
        this.renderButtons();
    }

    renderInstructionAndRegisters(instruction, registers) {
        const combinedDiv = $("<div>").addClass("combined-container");

        // Render instruction
        const instructionDiv = $("<div>").addClass("instruction-container");
        instructionDiv.append($("<h3>").text("Instruction:"));
        instructionDiv.append($("<p>").text(instruction));
        combinedDiv.append(instructionDiv);

        // Render registers
        const registersDiv = $("<div>").addClass("registers-container");
        registersDiv.append($("<h3>").text("Registers:"));
        const registersList = $("<ul>");
        registers.forEach(reg => {
            const hexString = reg.hex.toString().slice(0, 3) + '...' + reg.hex.toString().slice(-2, -1) + `<span style="background-color: yellow;">${reg.hex.toString().slice(-1)}</span>`;
            const binaryString = reg.binary.toString().slice(0, 3) + '...' + reg.hex.toString().slice(-5, -4) + `<span style="background-color: yellow;">${reg.binary.toString().slice(-4)}</span>`;
            registersList.append($("<li>").html(`${reg.register}: ${hexString} = ${binaryString} = ${reg.value}`));
        });
        registersDiv.append(registersList);
        combinedDiv.append(registersDiv);

        // Append combined div to container
        this.containerDiv.append(combinedDiv);
    }

    renderFlagQuestion(correctFlags) {
        const questionDiv = $("<div>").addClass("flag-question");
        questionDiv.append($("<h3>").text("Which flags are set after this instruction?"));

        this.flagNames.forEach(flag => {
            const checkbox = $("<input>").attr({
                type: "checkbox",
                id: `${this.divid}_${flag}`,
                name: flag
            });
            const label = $("<label>").attr("for", `${this.divid}_${flag}`).text(flag);
            questionDiv.append(checkbox).append(label);
        });

        this.containerDiv.append(questionDiv);
        this.correctFlags = correctFlags;
    }

    renderButtons() {
        const buttonDiv = $("<div>").addClass("button-container");
        const checkButton = $("<button>").text("Check Answer").on("click", () => this.checkAnswer());
        const newQuestionButton = $("<button>").text("New Question").on("click", () => this.generateNewQuestion());
        buttonDiv.append(checkButton).append(newQuestionButton);
        this.containerDiv.append(buttonDiv);
    }

    checkAnswer() {
        const userAnswers = { // lzf change
            carryFlag: $(`#${this.divid}_${this.flagNames[0]}`).is(":checked"),
            overflowFlag: $(`#${this.divid}_${this.flagNames[1]}`).is(":checked"),
            zeroFlag: $(`#${this.divid}_${this.flagNames[2]}`).is(":checked"),
            signFlag: $(`#${this.divid}_${this.flagNames[3]}`).is(":checked")
        };

        let isCorrect = true;
        let feedback = "";

        for (const flag in this.correctFlags) {
            if (userAnswers[flag] !== this.correctFlags[flag]) {
                isCorrect = false;
                feedback += `${flag.toUpperCase()}: ${this.correctFlags[flag] ? "Should be set" : "Should not be set"}\n`;
            }
        }

        const feedbackDiv = $("<div>").addClass("feedback");
        if (isCorrect) {
            feedbackDiv.text("Correct! All flags are correctly identified.").css("color", "green");
        } else {
            feedbackDiv.html("Incorrect. Here's the correct flag states:<br>" + feedback.replace(/\n/g, '<br>')).css("color", "red");
        }

        this.containerDiv.find(".feedback").remove();
        this.containerDiv.append(feedbackDiv);
    }

    setDefaultParams() {
        this.architecture = "X86_64";
        this.generator = new X86_32_OPS();
        this.flagNames = ["CF", "OF", "ZF", "SF"]
    }

    setCustomizedParams() {
        const currentOptions = JSON.parse(this.scriptSelector(this.origElem).html());

        if (currentOptions["bits"] != undefined) {
            this.num_bits = eval(currentOptions["bits"]);
        }

        if (currentOptions["architecture"] !== undefined) {
            this.architecture = currentOptions["architecture"];
        }

        switch (this.architecture) {
            case "X86_32":
                this.generator = new X86_32_OPS();
                this.flagNames = ["CF", "OF", "ZF", "SF"]
                break;
            case "X86_64":
                this.generator = new X86_64_OPS();
                this.flagNames = ["CF", "OF", "ZF", "SF"]
                break;
            case "ARM64":
                this.generator = new ARM64_OPS();
                this.flagNames = ["C", "V", "Z", "N"]
                break;
            default:
                throw new Error("Invalid architecture option");
        }
    }
}

/*=================================
== Find the custom HTML tags and ==
==   execute our code on them    ==
=================================*/
$(document).on("runestone:login-complete", function () {
    $("[data-component=assembly_flag]").each(function (index) {
        var opts = {
            orig: this,
            useRunestoneServices: eBookConfig.useRunestoneServices,
        };
        if ($(this).closest("[data-component=timedAssessment]").length == 0) {
            // If this element exists within a timed component, don't render it here
            try {
                ASMFlagList[this.id] = new ASMFlag_EXCERCISE(opts);
            } catch (err) {
                console.log(
                    `Error rendering Assembly Syntax Problem ${this.id}\nDetails: ${err}\n${err.stack}`
                );
            }
        }
    });
});
