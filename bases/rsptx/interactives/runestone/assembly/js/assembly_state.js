// assembly_state.js
// *********
// This file contains the JS for the Runestone Assembly State component. Created by Arys Aikyn, Kuzivakwashe Mavera 06/03/2024
"use strict";

import RunestoneBase from "../../common/js/runestonebase.js";
import "../css/assembly_state.css";
import "./assembly-i18n.en.js";
import { Pass } from "codemirror";
import { validLetter } from "jexcel";
import { ARM64_OPS, X86_32_OPS, X86_64_OPS } from "./arch_generate.js";

export var ASMStateList = {}; // Object containing all instances of cachetable that aren't a child of a timed assessment.
const num_instructions = 3;
const num_registers = 5;
const num_addresses = 8;

// ASMState constructor
export default class ASMState_EXCERCISE extends RunestoneBase {
    constructor(opts) {
        super(opts);
        var orig = opts.orig; // entire <p> element
        this.origElem = orig;
        this.divid = orig.id;
        this.useRunestoneServices = opts.useRunestoneServices;

        this.arith_checked = true;
        this.memo_checked = false;
        this.stack_checked = false;

        // Create the Assembly State exercise element
        this.createAssemblyStateElement();

        // replaces the intermediate HTML for this component with the rendered HTML of this component
        $(this.origElem).replaceWith(this.containerDiv);
    }

    // Find the script tag containing JSON in a given root DOM node.
    scriptSelector(root_node) {
        return $(root_node).find(`script[type="application/json"]`);
    }

    /*===========================================
    ====   Functions generating final HTML   ====
    ===========================================*/

    // Creates the main Assembly State exercise element
    createAssemblyStateElement() {
        this.setDefaultParams();
        this.setCustomizedParams();

        // create the main div
        this.containerDiv = $("<div>").attr("id", this.divid);

        // rendering the whole thing
        this.renderHeader();
        this.renderCustomizations();
        this.tryAnother(); // for regeneration, could be used for intialization too
    }

    // Renders the header of the exercise
    renderHeader() {
        this.headerDiv = $("<div>").html(
            "For the highlighted instruction, show changes to register and memory values after it is executed in the  “Post Instruction Value” column."
            + "You do not need to enter values for registers or memory locations whose values do not change.<br></br>"
        ).addClass("header-container");
        this.containerDiv.append(this.headerDiv);
    }

    // Renders customization options for instruction types
    renderCustomizations() {

        // Initialize the generator based on the architecture
        const instructionTypes = [
            { label: 'Memory Manipulation', value: 'memOps', instructions: ["mov"] },
            { label: 'Stack Operations', value: "archOps", instructions: ["push", "pop", "ldr", "str"] }
        ];

        const instructionTypeDiv = $("<div>").attr("id", this.divid + "_instruction_types");

        instructionTypeDiv.append($("<h4>").text("Configure Your Question Type:"));
        instructionTypeDiv.append($("<p>").text("Select the types of instructions you want to be included in your question. This will configure the type of question you will attempt."));

        instructionTypes.forEach(family => {
            let checkbox = $("<input>").attr({
                type: "checkbox",
                id: family.value,
                value: family.value,
                checked: false
            });

            checkbox.on("change", (event) => {
                // Store the current state of checkboxes
                const prevMemoChecked = this.memo_checked;
                const prevStackChecked = this.stack_checked;

                // Update the states based on the checkbox change
                switch (event.target.id) {
                    case "memOps":
                        this.memo_checked = event.target.checked;
                        break;
                    case "archOps":
                        this.stack_checked = event.target.checked;
                        break;
                }

                // Ensure at least one checkbox is always selected
                if (!this.arith_checked && !this.stack_checked && !this.memo_checked) {
                    event.preventDefault();
                    // Restore the previous states
                    this.arith_checked = prevArithChecked;
                    this.memo_checked = prevMemoChecked;
                    this.stack_checked = prevStackChecked;

                    // Restore the checkbox's checked state
                    $(event.target).prop('checked', !event.target.checked);
                }
            });

            const label = $("<label>")
                .attr("for", family.value)
                .text(family.label)
                .tooltip({
                    placement: "bottom",
                    html: true,
                    title:
                        `${family.instructions.join(", ")}`
                });
            instructionTypeDiv.append(checkbox).append(label).append(" ");
        });
        instructionTypeDiv.append("<br>");

        const customizationDiv = $("<div>").addClass("customization-container")
        customizationDiv.append(instructionTypeDiv);
        this.containerDiv.append(customizationDiv);
    }

    // Generates a new question with random initial state and instructions
    generateNewQuestion() {
        this.allStates = this.generator.generateStates(
            num_instructions,
            num_registers,
            num_addresses,
            [this.arith_checked, this.memo_checked, this.stack_checked]
        );

        this.initialState = this.allStates[0];

        console.log(this.allStates)

        this.currentInstruction = 1;
    }

    // Renders the list of instructions for the exercise
    renderInstructionsList(instructions) {
        const instructionContainer = $("<div>").addClass("instruction-container");

        const instructionHeader = $("<div>").addClass("instruction-header");
        instructionHeader.append(
            $("<h4>").text("Assembly Code:").css({
                "font-weight": "bold",
                "font-size": "1.5em"
            })
        );
        instructionHeader.append(
            $("<h4>").text("Feedback:").css({
                "font-weight": "bold",
                "font-size": "1.5em"
            })
        );

        const instructionList = $("<ol>");
        for (let index = 1; index <= instructions.length; index++) {
            const inst = instructions[index - 1];
            const listItem = $("<li>").addClass("instruction-item");

            const instructionDiv = $("<div>")
                .addClass("instruction-div")
                .attr("data-index", index)
                .text(inst);
            index !== 1 ? instructionDiv.addClass("disabled") : instructionDiv.addClass("current");

            const feedbackDiv = $("<div>")
                .addClass("feedback")
                .attr("id", "feedback" + index)
                .css({ width: "300px", "text-wrap": "pretty", display: "flex", "justify-content": "flex-end", "align-items": "center" })

            listItem.append(instructionDiv, feedbackDiv);

            instructionList.append(listItem);
        }

        instructionContainer.append(instructionHeader, instructionList);
        this.containerDiv.append(instructionContainer);
    }

    // Renders tables for registers and memory
    renderTables() {
        const [instructions, registers, addresses] = this.initialState;

        // Create table for registers
        const registersTable = $("<table>").addClass("register-table");
        registersTable.append($("<caption>").text("Registers:"));
        const registersTableHead = $("<thead>").append($("<tr>").append(
            $("<th>").text("Register"),
            $("<th>").text("Current Value"),
            $("<th>").text("Post Instruction Value")
        ));
        const registersTableBody = $("<tbody>");

        registers.forEach(({ register, value }) => {
            const displayValue = value || "0";
            const row = $("<tr>").append(
                $("<td>").text(register),
                $("<td>").text(displayValue),
                $("<td>").append($("<input>").attr("type", "text").attr("placeholder", `${displayValue}`))
            );
            registersTableBody.append(row);
        });
        registersTable.append(registersTableHead, registersTableBody);

        // Create table for memory addresses
        const memoryTable = $("<table>").addClass("memory-table");
        memoryTable.append($("<caption>").text("Memory:"));
        const memoryTableHead = $("<thead>").append($("<tr>").append(
            $("<th>").text("Address"),
            $("<th>").text("Current Value"),
            $("<th>").text("Post Instruction Value")
        ));
        const memoryTableBody = $("<tbody>");
        addresses.forEach(addr => {
            const row = $("<tr>").append(
                $("<td>").text(addr.address),
                $("<td>").text(addr.value),
                $("<td>").append($("<input>").attr("type", "text").attr("placeholder", `${addr.value}`))
            );
            memoryTableBody.append(row);
        });
        memoryTable.append(memoryTableHead, memoryTableBody);

        // Create wrapper divs for tables
        const registersWrapper = $("<div>").addClass("table-wrapper");
        registersWrapper.append(registersTable);
        const memoryWrapper = $("<div>").addClass("table-wrapper");
        memoryWrapper.append(memoryTable);

        // Create container div for tables
        const tablesContainer = $("<div>").addClass("tables-container");
        tablesContainer.append(registersWrapper, memoryWrapper);
        this.containerDiv.append(tablesContainer);
    }

    // Repopulates the initial state of registers and memory tables
    repopulateInitialTables() {
        const [instructions, registers, addresses] = this.initialState;

        // Clear the tables
        const registersTableBody = $(".register-table tbody");
        const memoryTableBody = $(".memory-table tbody");
        registersTableBody.empty();
        memoryTableBody.empty();

        // Repopulate the tables
        registers.forEach(({ register, value }) => {
            const displayValue = value || "0";
            const row = $("<tr>").append(
                $("<td>").text(register),
                $("<td>").text(displayValue),
                $("<td>").append($("<input>").attr("type", "text").attr("placeholder", `${displayValue}`))
            );
            registersTableBody.append(row);
        });

        addresses.forEach(addr => {
            const row = $("<tr>").append(
                $("<td>").text(addr.address),
                $("<td>").text(addr.value),
                $("<td>").append($("<input>").attr("type", "text").val("").attr("placeholder", `${addr.value}`))
            );
            memoryTableBody.append(row);
        });
    }

    // Repopulates tables with current state after an instruction
    repopulateTables() {
        const currentState = this.allStates[this.currentInstruction - 1];

        // Clear the tables
        const registersTableBody = $(".register-table tbody");
        const memoryRegistersTableBody = $(".memory-register-table tbody");
        registersTableBody.empty();
        memoryRegistersTableBody.empty();

        // Repopulate Registers table
        currentState.registers.forEach(({ register, value, type }) => {
            const displayValue = value || "0";
            const row = $("<tr>").append(
                $("<td>").text(register),
                $("<td>").text(displayValue),
                $("<td>").append($("<input>").attr("type", "text").attr("placeholder", `${displayValue}`))
            );
            registersTableBody.append(row);
        });

        // Repopulate Memory table
        const memoryTableBody = this.containerDiv.find('.memory-table tbody');
        memoryTableBody.empty();
        currentState.memory.forEach(addr => {
            const row = $("<tr>").append(
                $("<td>").text(addr.address),
                $("<td>").text(addr.value),
                $("<td>").append($("<input>").attr("type", "text").val("").attr("placeholder", `${addr.value}`))
            );
            memoryTableBody.append(row);
        });
    }

    // Repopulates tables with current state after an instruction
    renderButtons() {
        const buttonContainer = $("<div>").addClass("button-container");

        const tryAnotherButton = $("<button>").text("Try Another Question").addClass("btn-success").on("click", () => this.tryAnother());
        const resetButton = $("<button>").text("Reset").addClass("btn-success").on("click", () => this.resetValues());
        const linkButton = $("<button>").text("Go to Dive Into Systems").addClass("btn-success").on("click", () => this.goToLink());
        const checkAnswerButton = $("<button>").text("Check Answer").addClass("btn-success").on("click", () => this.checkAnswer());

        buttonContainer.append(tryAnotherButton, resetButton, linkButton, checkAnswerButton);
        this.containerDiv.append(buttonContainer);
    }

    // Updates the feedback message based on correctness
    reRenderFeedback(isCorrect) {
        let feedbackDiv = this.containerDiv.find(`#feedback${this.currentInstruction}`);
        let feedbackMessage = isCorrect ?
            `Correct! Moving to instruction ${this.currentInstruction + 1}.` :
            "Incorrect. Please try again.";
        feedbackDiv.text(feedbackMessage).css('color', isCorrect ? 'green' : 'red');
    }

    renderFinalFeedback() {
        const feedbackDiv = this.containerDiv.find("[id^='feedback']");
        feedbackDiv.text("Congratulations! Completed all instructions").css('color', 'blue');
    }

    goToLink() {
        const registers = this.initialState[1].slice(0, 3);
        const instructions = this.initialState[0];
        const memoryValues = this.initialState[2].map(addr => addr.value).slice(3, 7);

        const encodedArchitecture = this.architecture == "ARM64" ? "ARM" : (this.architecture == "X86_32" ? "x86" : "x86_64");
        const encodedInstructions = instructions.map(inst => encodeURIComponent(inst)).join('%0A');
        const encodedRegisters = registers.map(reg => encodeURIComponent(reg.value)).join('/');
        const encodedMemoryValues = memoryValues.map(value => encodeURIComponent(value)).join('/');

        const link = `https://asm.diveintosystems.org/arithmetic/${encodedArchitecture}/${encodedInstructions}/${encodedMemoryValues}/${encodedRegisters}`;

        return window.open(link);
    }

    /*=====================================
    ====   Supporting and Utility Functions   ====
    =========================================*/

    // Sets default parameters for the exercise
    setDefaultParams() {
        this.architecture = "X86_64"; // Default architecture
    }

    // Sets customized parameters based on configuration
    setCustomizedParams() {
        const currentOptions = JSON.parse(this.scriptSelector(this.origElem).html());
        if (currentOptions["architecture"] !== undefined) {
            this.architecture = currentOptions["architecture"];
        }

        switch (this.architecture) {
            case "X86_32":
                this.generator = new X86_32_OPS();
                break;
            case "X86_64":
                this.generator = new X86_64_OPS();
                break;
            case "ARM64":
                this.generator = new ARM64_OPS();
                break;
            default:
                throw new Error("Invalid architecture option");
        }
    }

    // Resets all input values and moves to initial instruction
    resetValues() {
        this.containerDiv.find("input[type='text']").val("");
        this.containerDiv.find("[id^='feedback']").empty();
        this.containerDiv.find('.button-container button:contains("Check Answer")').prop('disabled', false);
        this.currentInstruction = 1;
        this.moveToInitialInstruction();
    }

    // Generates new questions and re-renders the component
    tryAnother() {
        // Clear the current state and re-render the component
        this.generateNewQuestion();
        this.containerDiv.find('.instruction-container').remove();
        this.containerDiv.find('.tables-container').remove();
        this.containerDiv.find('.button-container').remove();
        this.containerDiv.find("[id^='feedback']").remove();
        this.containerDiv.find('.link-button').remove();

        // rerender
        this.renderInstructionsList(this.initialState[0]);
        this.renderTables();
        this.renderButtons();
    }

    // Checks the user's answer and provides feedback
    checkAnswer() {
        const [userRegisters, userMemory] = this.gatherInput();
        const isCorrect = this.validateAnswers(userRegisters, userMemory);

        if (isCorrect) {
            this.reRenderFeedback(true);
            if (this.currentInstruction >= this.initialState[0].length) {
                this.renderFinalFeedback();
                this.containerDiv.find('.button-container button:contains("Check Answer")').prop('disabled', true);
                this.containerDiv.find(".instruction-div").removeClass("current").addClass("disabled");
            } else {
                this.currentInstruction++;
                this.moveToNextInstruction();
            }
        } else {
            const currentInstruction = this.initialState[0][this.currentInstruction - 1];
            const parsedInstruction = this.architecture === "ARM64" ? this.generator.parseARM64Instruction(currentInstruction) : this.generator.parseX86Instruction(currentInstruction);
            const feedbackDiv = this.containerDiv.find(`#feedback${this.currentInstruction}`);


            let customHint = null;
            if (parsedInstruction) {
                const { op } = parsedInstruction;
                customHint = this.generator.getCustomHint(op);
            }

            const feedbackMessage = customHint || "Incorrect. Please try again";
            feedbackDiv.text(feedbackMessage).css('color', 'red');
        }
    }


    // Validates user answers against expected state
    validateAnswers(userRegisters, userMemory) {
        const expectedState = this.allStates[this.currentInstruction];
        let isCorrect = true;

        for (let reg of expectedState.registers) {
            if (userRegisters[reg.register] != reg.value) {
                isCorrect = false;
                break;
            }
        }

        if (isCorrect) {
            for (let mem of expectedState.memory) {
                if (userMemory[mem.address] != mem.value) {
                    isCorrect = false;
                    break;
                }
            }
        }

        return isCorrect;
    }

    // Collects user input from register and memory tables
    gatherInput() {
        const registersInputs = this.containerDiv.find('.register-table tbody tr');
        const memoryInputs = this.containerDiv.find('.memory-table tbody tr');

        let userRegisters = {};
        let userMemory = {};

        registersInputs.each((index, row) => {
            const reg = $(row).find('td').eq(0).text();
            let userValue = $(row).find('input').val().trim();

            // If input is empty or just whitespace, use the current state's value
            if (userValue === "") {
                userValue = $(row).find('td').eq(1).text();
            }

            userRegisters[reg] = userValue;
        });

        memoryInputs.each((index, row) => {
            const address = $(row).find('td').eq(0).text();
            let userValue = $(row).find('input').val().trim();

            // If input is empty or just whitespace, use the current state's value
            if (userValue === "") {
                userValue = $(row).find('td').eq(1).text();
            }

            userMemory[address] = userValue;
        });

        return [userRegisters, userMemory];
    }

    // Moves to the next instruction in the list
    moveToNextInstruction() {
        this.containerDiv.find(".instruction-div").removeClass("current").addClass("disabled");
        this.containerDiv.find(`.instruction-div[data-index="${this.currentInstruction}"]`).removeClass("disabled").addClass("current");
        this.resetInputFields();
        this.repopulateTables();
    }

    // Moves back to the initial instruction
    moveToInitialInstruction() {
        this.containerDiv.find(".instruction-div").removeClass("current").addClass("disabled");
        this.containerDiv.find(`.instruction-div[data-index="${this.currentInstruction}"]`).removeClass("disabled").addClass("current");
        this.resetInputFields();
        this.repopulateInitialTables();
    }

    // Resets all input fields
    resetInputFields() {
        this.containerDiv.find("input[type='text']").val("").css("background-color", "");
    }
}

/*=================================
== Find the custom HTML tags and ==
==   execute our code on them    ==
=================================*/
$(document).on("runestone:login-complete", function () {
    $("[data-component=assembly_state]").each(function (index) {
        var opts = {
            orig: this,
            useRunestoneServices: eBookConfig.useRunestoneServices,
        };
        if ($(this).closest("[data-component=timedAssessment]").length == 0) {
            // If this element exists within a timed component, don't render it here
            try {
                ASMStateList[this.id] = new ASMState_EXCERCISE(opts);
            } catch (err) {
                console.log(
                    `Error rendering Assembly Syntax Problem ${this.id}\nDetails: ${err}\n${err.stack}`
                );
            }
        }
    });
});