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
        this.header = $("<div>").html(
            "Given the initial state of machine registers and memory, determine the effects of executing the following assembly instructions. " +
            "For each instruction provided, describe how it alters the values in registers or memory. " +
            "Start with the initial state provided below, and sequentially apply each instruction, updating the state as you go.<br><br>"
        );
        this.headerDiv = $("<div>").append(this.header);
        this.containerDiv.append(this.headerDiv);
    }

    // Renders customization options for instruction types
    renderCustomizations() {

        if (this.architecture === "ARM64"){
            const instructionTypes = [
                { label: 'Arithmetics', value: 'arithmetic', defaultChecked: true },
                { label: 'Memory Manipulation', value: 'memorymanipulation', defaultChecked: false },
            ];
    
            const customizationDiv = $("<div>").addClass("customization-container");
            const instructionTypeDiv = $("<div>").attr("id", this.divid + "_instruction_types");
            instructionTypeDiv.append($("<div>").text("Select Instruction Types:"));
    
            // Initialize checkbox states
            this.arith_checked = instructionTypes.find(family => family.value === 'arithmetic').defaultChecked;
            this.memo_checked = instructionTypes.find(family => family.value === 'memorymanipulation').defaultChecked;
    
            instructionTypes.forEach(family => {
                let checkbox = $("<input>").attr({
                    type: "checkbox",
                    id: family.value,
                    value: family.value,
                    checked: family.defaultChecked
                });
    
                checkbox.on("change", (event) => {
                    // Store the current state of checkboxes
                    const prevArithChecked = this.arith_checked;
                    const prevMemoChecked = this.memo_checked;
    
                    // Update the states based on the checkbox change
                    switch (event.target.id) {
                        case "arithmetic":
                            this.arith_checked = event.target.checked;
                            break;
                        case "memorymanipulation":
                            this.memo_checked = event.target.checked;
                            break;
                    }
    
                    // Ensure at least one checkbox is always selected
                    if (!this.arith_checked && !this.stack_checked && !this.memo_checked) {
                        event.preventDefault();
                        // Restore the previous states
                        this.arith_checked = prevArithChecked;
                        this.memo_checked = prevMemoChecked;
    
                        // Restore the checkbox's checked state
                        $(event.target).prop('checked', !event.target.checked);
                    }
                });
    
                const label = $("<label>").attr("for", family.value).text(family.label);
                instructionTypeDiv.append(checkbox).append(label).append(" ");
            });
            instructionTypeDiv.append("<br>");
            customizationDiv.append(instructionTypeDiv);
            this.containerDiv.append(customizationDiv);
    

        } else {
            
            const instructionTypes = [
                { label: 'Arithmetics', value: 'arithmetic', defaultChecked: true },
                { label: 'Memory Manipulation', value: 'memorymanipulation', defaultChecked: false },
                { label: 'Stack Operations', value: 'stackoperation', defaultChecked: false }
            ];
    
            const customizationDiv = $("<div>").addClass("customization-container");
            const instructionTypeDiv = $("<div>").attr("id", this.divid + "_instruction_types");
            instructionTypeDiv.append($("<div>").text("Select Instruction Types:"));
    
            // Initialize checkbox states
            this.arith_checked = instructionTypes.find(family => family.value === 'arithmetic').defaultChecked;
            this.stack_checked = instructionTypes.find(family => family.value === 'stackoperation').defaultChecked;
            this.memo_checked = instructionTypes.find(family => family.value === 'memorymanipulation').defaultChecked;
    
            instructionTypes.forEach(family => {
                let checkbox = $("<input>").attr({
                    type: "checkbox",
                    id: family.value,
                    value: family.value,
                    checked: family.defaultChecked
                });
    
                checkbox.on("change", (event) => {
                    // Store the current state of checkboxes
                    const prevArithChecked = this.arith_checked;
                    const prevStackChecked = this.stack_checked;
                    const prevMemoChecked = this.memo_checked;
    
                    // Update the states based on the checkbox change
                    switch (event.target.id) {
                        case "arithmetic":
                            this.arith_checked = event.target.checked;
                            break;
                        case "stackoperation":
                            this.stack_checked = event.target.checked;
                            break;
                        case "memorymanipulation":
                            this.memo_checked = event.target.checked;
                            break;
                    }
    
                    // Ensure at least one checkbox is always selected
                    if (!this.arith_checked && !this.stack_checked && !this.memo_checked) {
                        event.preventDefault();
                        // Restore the previous states
                        this.arith_checked = prevArithChecked;
                        this.stack_checked = prevStackChecked;
                        this.memo_checked = prevMemoChecked;
    
                        // Restore the checkbox's checked state
                        $(event.target).prop('checked', !event.target.checked);
                    }
                });
    
                const label = $("<label>").attr("for", family.value).text(family.label);
                instructionTypeDiv.append(checkbox).append(label).append(" ");
            });
            instructionTypeDiv.append("<br>");
            customizationDiv.append(instructionTypeDiv);
            this.containerDiv.append(customizationDiv);
    
        }
       
       
    }

        // Generates a new question with random initial state and instructions
    generateNewQuestion() {
        this.initialState = this.generator.generateRandomInitialState(
            num_instructions,
            num_registers,
            num_addresses,
            [this.arith_checked, this.stack_checked, this.memo_checked]
        );
        this.allStates = this.generator.executeInstructions(this.initialState);
        this.currentInstruction = 0;
    }

    // Renders the list of instructions for the exercise
    renderInstructionsList(instructions) {
        const instructionDiv = $("<div>").addClass("instruction-container");
        instructionDiv.append($("<h3>").text("The Instructions:"));

        const instructionList = $("<ol>");
        instructions.forEach((inst, index) => {
            const listItem = $("<li>")
                .text(inst)
                .addClass("instruction-item")
                .attr("data-index", index);
            if (index !== 0) {
                listItem.addClass("disabled");
            }
            instructionList.append(listItem);
        });

        instructionList.children("li:first").addClass("current");

        instructionDiv.append(instructionList);
        this.containerDiv.append(instructionDiv);
    }

    // Renders tables for registers and memory
    renderTables() {
        const [instructions, addresses, registers] = this.initialState;

        const tablesContainer = $("<div>").addClass("tables-container");

        // Registers table
        const registersWrapper = $("<div>").addClass("table-wrapper");
        registersWrapper.append($("<h3>").text("Registers:"));
        const registersTable = $("<table>").addClass("register-table");
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
                $("<td>").append($("<input>").attr("type", "text"))
            );
            registersTableBody.append(row);
        });

        registersTable.append(registersTableHead, registersTableBody);
        registersWrapper.append(registersTable);

        // Memory changes table
        const memoryWrapper = $("<div>").addClass("table-wrapper");
        memoryWrapper.append($("<h3>").text("Memory:"));
        const memoryTable = $("<table>").addClass("memory-table");
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
                $("<td>").append($("<input>").attr("type", "text"))
            );
            memoryTableBody.append(row);
        });

        memoryTable.append(memoryTableHead, memoryTableBody);
        memoryWrapper.append(memoryTable);

        tablesContainer.append(registersWrapper, memoryWrapper);
        this.containerDiv.append(tablesContainer);
    }

    // Repopulates the initial state of registers and memory tables
    repopulateInitialTables() {
        const [ instructions, addresses, registers ] = this.initialState;

        const registersTableBody = $(".register-table tbody");
        const memoryTableBody = $(".memory-table tbody");

        registersTableBody.empty();
        memoryTableBody.empty();

        registers.forEach(({ register, value }) => {
            const displayValue = value || "0";
            const row = $("<tr>").append(
                $("<td>").text(register),
                $("<td>").text(displayValue),
                $("<td>").append($("<input>").attr("type", "text").val(""))
            );
            registersTableBody.append(row);
        });

        addresses.forEach(addr => {
            const row = $("<tr>").append(
                $("<td>").text(addr.address),
                $("<td>").text(addr.value),
                $("<td>").append($("<input>").attr("type", "text").val(""))
            );
            memoryTableBody.append(row);
        });
    }

    // Repopulates tables with current state after an instruction
    repopulateTables() {
        const currentState = this.allStates[this.currentInstruction - 1]

        // Repopulate Registers table
        const registersTableBody = this.containerDiv.find('.register-table tbody');
        registersTableBody.empty();
        currentState.registers.forEach(({ register, value }) => {
            const row = $("<tr>").append(
                $("<td>").text(register),
                $("<td>").text(value),
                $("<td>").append($("<input>").attr("type", "text").val(""))
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
                $("<td>").append($("<input>").attr("type", "text").val(""))
            );
            memoryTableBody.append(row);
        });
    }

    // Repopulates tables with current state after an instruction
    renderButtons() {
        const buttonContainer = $("<div>").addClass("button-container");

        const resetButton = $("<button>").text("Reset").on("click", () => this.resetValues());
        const tryAnotherButton = $("<button>").text("Try Another Question").on("click", () => this.tryAnother());
        this.checkAnswerButton = $("<button>").text("Check Answer").on("click", () => this.checkAnswer()).prop("disabled", true);

        buttonContainer.append(resetButton).append(tryAnotherButton).append(this.checkAnswerButton);
        this.containerDiv.append(buttonContainer);

        // Enable "Check Answer" button when any field is filled
        this.containerDiv.on("input", "input[type='text']", () => {
            const allFilled = this.containerDiv.find("input[type='text']").toArray().some(input => $(input).val().trim() !== "");
            this.checkAnswerButton.prop("disabled", !allFilled);
        });
    }

    // Creates a container for feedback messages
    renderFeedback(){
        let feedbackDiv = $("<div>").addClass("feedback-container");
        this.containerDiv.append(feedbackDiv);
    }

    // Updates the feedback message based on correctness
    reRenderFeedback(isCorrect) {
        let feedbackDiv = this.containerDiv.find('.feedback-container');
        if (feedbackDiv.length === 0) {
            feedbackDiv = $("<div>").addClass("feedback-container");
            this.containerDiv.append(feedbackDiv);
        }
        feedbackDiv.empty();

        const feedbackMessage = isCorrect ?
            `Correct! Moving to instruction ${this.currentInstruction + 1}.` :
            "Incorrect. Please try again.";
        feedbackDiv.append("<br>");
        feedbackDiv.append($("<p>").text(feedbackMessage).css('color', isCorrect ? 'green' : 'red'));
    }

    // Displays final feedback when all instructions are completed
    renderFinalFeedback() {
        let feedbackDiv = this.containerDiv.find('.feedback-container');
        if (feedbackDiv.length === 0) {
            feedbackDiv = $("<div>").addClass("feedback-container");
            this.containerDiv.append(feedbackDiv);
        }
        feedbackDiv.empty();

        const feedbackMessage = "All instructions completed! Well done.";
        feedbackDiv.append($("<p>").text(feedbackMessage).css('color', 'blue'));
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
        this.containerDiv.find('.feedback-container').empty();
        this.currentInstruction = 0
        this.moveToInitialInstruction();
    }

    // Generates new questions and re-renders the component
    tryAnother() {
        // Clear the current state and re-render the component
        this.generateNewQuestion();
        this.containerDiv.find('.instruction-container').remove();
        this.containerDiv.find('.tables-container').remove();
        this.containerDiv.find('.button-container').remove();
        this.containerDiv.find('.feedback-container').remove();

        // rerender
        this.renderInstructionsList(this.initialState[0]);
        this.renderTables();
        this.renderButtons();
        this.renderFeedback();
    }

    // Validates user answers against expected state
    validateAnswers(userRegisters, userMemory, step) {
        const expectedState = this.allStates[step];
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

    // Checks the user's answer and provides feedback
    checkAnswer() {
        const [userRegisters, userMemory] = this.gatherInput(this.allStates[this.currentInstruction]);

        const isCorrect = this.validateAnswers(userRegisters, userMemory, this.currentInstruction);

        if (isCorrect) {
            this.currentInstruction++;
            this.moveToNextInstruction();
        }

        if (this.currentInstruction >= this.initialState[0].length) {
            this.renderFinalFeedback();
            return 0;
        }

        this.reRenderFeedback(isCorrect);
    }

    // Collects user input from register and memory tables
    gatherInput(currentState) {
        const registerInputs = this.containerDiv.find('.register-table tbody tr');
        const memoryInputs = this.containerDiv.find('.memory-table tbody tr');

        let userRegisters = {};
        let userMemory = {};

        registerInputs.each((index, row) => {
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
        this.containerDiv.find('.instruction-item').removeClass('current').addClass('disabled');
        this.containerDiv.find(`.instruction-item[data-index="${this.currentInstruction}"]`).removeClass('disabled').addClass('current');
        this.checkAnswerButton.prop("disabled", true);
        this.resetInputFields();
        this.repopulateTables();
    }

    // Moves back to the initial instruction
    moveToInitialInstruction() {
        this.containerDiv.find('.instruction-item').removeClass('current').addClass('disabled');
        this.containerDiv.find(`.instruction-item[data-index="${this.currentInstruction}"]`).removeClass('disabled').addClass('current');
        this.checkAnswerButton.prop("disabled", true);
        this.resetInputFields();
        this.repopulateInitialTables();
    }

    // Resets all input fields
    resetInputFields() {
        this.containerDiv.find("input[type='text']").val("").css('background-color', '');
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
