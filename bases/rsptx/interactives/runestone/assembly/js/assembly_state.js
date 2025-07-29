// assembly_state.js
// *********
// This file contains the JS for the Runestone Assembly State component. Created by Arys Aikyn, Kuzivakwashe Mavera 06/03/2024
// Minor bug fixes (e.g. ARM64) and enhancement (e.g. reset config) by Zhengfei Li (Alex) 07/24/2025
"use strict";

import RunestoneBase from "../../common/js/runestonebase.js";
import "../css/assembly_state.css";
import "./assembly-i18n.en.js";
import { Pass } from "codemirror";
import { validLetter } from "jexcel";
import { ARM64_OPS, X86_32_OPS, X86_64_OPS } from "./arch_generate.js";
import arch_data from './arch_data.json';
import { updateHeight } from "../../../utils/updateHeight.js";

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

        // Fields for logging data
        this.componentId = this.getCID()
        this.questionId = 1;
        this.userId = this.getUserId();

        this.arith_checked = true;
        this.memo_checked = true;
        this.stack_checked = false;

        this.reset = true;
        this.generateAnother = true;


        const json = JSON.parse(this.scriptSelector(this.origElem).html());
        if (json["reset"] != undefined) {
            this.reset = json["reset"];
        }
        if (json["generate-another"] != undefined) {
            this.generateAnother = json["generate-another"];
        }
        if (json["instructions"] || json["registers"] || json["addresses"]) {
            // custom randomization of instructions, registers, and addresses
            this.instructions = json.instructions;
            this.registers = json.registers;
            this.memory = json.memory;
            this.selection = json.selection;
            this.createCustomizedAssemblyStateElement();
        } else {
            this.createRegularAssemblyStateElement();
        }
        
        // replaces the intermediate HTML for this component with the rendered HTML of this component
        $(this.origElem).replaceWith(this.containerDiv);
        updateHeight(window, document, this);
        this.sendData(this.a2ID("load"))

    }

    // Find the script tag containing JSON in a given root DOM node.
    scriptSelector(root_node) {
        return $(root_node).find(`script[type="application/json"]`);
    }

    /*===========================================
    ====   Functions generating final HTML   ====
    ===========================================*/

    // Creates the Customized Assembly State exercise element
    createCustomizedAssemblyStateElement() {
        this.setDefaultParams();
        this.setCustomizedParams();

        // create the main div
        this.containerDiv = $("<div>").attr("id", this.divid);

        // rendering the whole thing
        this.renderHeader();
        this.initialState = [this.instructions, this.registers, this.memory];
        this.currentInstruction = 1;
        this.customizedTryAnother();

    }

    // Creates the Regular Assembly State exercise element
    createRegularAssemblyStateElement() {
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
            "<strong><u>Instructions:</u></strong>" +
            " For the instruction highlighted in green, show changes to register and memory values after it is executed in the  “Post Instruction Value” column."
            + " You do not need to enter values for registers or memory locations whose values do not change.<br></br>"
        ).addClass("header-container");
        this.containerDiv.append(this.headerDiv);
    }

    // Renders customization options for instruction types
    renderCustomizations() {

        // Initialize the generator based on the architecture
        const instructionTypes = [];

        if (this.architecture == "X86_64" || this.architecture == "X86_32") {
            instructionTypes.push({ label: 'Memory Manipulation', value: 'memOps', instructions: arch_data[this.architecture]["memOps"].instructions },
                { label: 'Stack Operations', value: 'archOps', instructions: [...arch_data[this.architecture]["archOpsPush"].instructions, ...arch_data[this.architecture]["archOpsPop"].instructions] });
        } else if (this.architecture == "ARM64") {
            instructionTypes.push({ label: 'Data Movement', value: 'memOps', instructions: arch_data[this.architecture]["memOps"].instructions });
            this.stack_checked = true; // Set stack_checked to true for ARM64 architecture
        }

        const instructionTypeDiv = $("<div>").attr("id", this.divid + "_instruction_types");

        instructionTypeDiv.append($("<div>").html("<strong><u>Configure Questions:</u></strong>" + " Select the types of instructions you want to be included in your question. This will configure the type of question you will attempt." + "<br></br>"));

        instructionTypes.forEach(family => {
            // Set initial checked state based on backend defaults
            let initialChecked = false;
            if (family.value === "memOps") {
                initialChecked = this.memo_checked;
            } else if (family.value === "archOps") {
                initialChecked = this.stack_checked;
            }

            let checkbox = $("<input>").attr({
                type: "checkbox",
                id: family.value,
                value: family.value,
                checked: initialChecked
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
                        `${family.instructions}`,
                })
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
            this.selection ? [this.selection[0], this.selection[1], this.selection[2]] : [this.arith_checked, this.memo_checked, this.stack_checked]
        );

        this.initialState = this.allStates[0];

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
            }).addClass("assembly-code")
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
                .css({
                    "margin-bottom": "0px",
                    "margin-left": "auto",
                    "margin-right": "5%"
                });

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
        console.log("generateAnother", this.generateAnother);
        console.log("reset", this.reset);
        if (this.generateAnother) {
            const tryAnotherButton = $("<button>").text(this.generateAnother ? "Generate another question" : "Try another question").addClass("btn-success").on("click", () => {
                this.tryAnother();
                updateHeight(window, document, this);
                this.sendData(this.a2ID("generate"))
            });
            buttonContainer.append(tryAnotherButton);
        }

        if (this.reset) {
            const resetButton = $("<button>").text("Reset").addClass("btn-success").on("click", () => {
                this.resetValues()
                updateHeight(window, document, this);
                this.sendData(this.a2ID("reset"))
            });
            buttonContainer.append(resetButton);
        }

        const linkButton = $("<button>").text("Help").addClass("btn-success").on("click", () => {
            this.provideHelp();
            updateHeight(window, document, this);
            this.sendData(this.a2ID("help"))
            });
        const checkAnswerButton = $("<button>").text("Check Answer").addClass("btn-success").on("click", () => {
            this.checkAnswer()
            updateHeight(window, document, this);
        });

        buttonContainer.append(linkButton, checkAnswerButton);
        this.containerDiv.append(buttonContainer);
    }

    // Updates the feedback message based on correctness
    reRenderFeedback(isCorrect) {
        const feedbackDiv = this.containerDiv.find(`#feedback${this.currentInstruction}`);
        feedbackDiv.removeClass("alert alert-success alert-danger");

        let feedbackMessage = isCorrect ? "Correct! Moving to next instruction." : "Incorrect. Please try again.";

        if (isCorrect) {
            feedbackDiv.addClass("alert alert-success");
            feedbackMessage = `Correct! Moving to instruction ${this.currentInstruction + 1}.`;
        } else {
            feedbackDiv.addClass("alert alert-danger");
            feedbackMessage = "Incorrect. Please try again";
        }

        feedbackDiv.text(feedbackMessage);
    }

    renderFinalFeedback() {
        const feedbackDiv = this.containerDiv.find("[id^='feedback']");
        feedbackDiv.text("Congratulations! Completed all instructions").css('color', 'blue');
    }

    provideHelp() {
        const helpDiv = this.containerDiv.find(".help-container");
        if (helpDiv.length > 0) {
            helpDiv.remove();
        }
        else {
            const helpDiv = $("<div>").addClass("help-container");
            helpDiv.append($("<div>").text("Click the button to visualize and trace through the assembly code in ASM Visualizer:").css("font-weight", "bold"));
            helpDiv.append($("<button>").text("Visualization").addClass("link-button").on("click", () => this.goToLink()));

            const bookChapter = this.architecture == "ARM64" ? "C9-ARM64/common.html" : (this.architecture == "X86_32" ? "C8-IA32/common.html" : "C7-x86_64/common.html");
            helpDiv.append($("<div>").text("Click the link to the textbook chapter for more information:").css("font-weight", "bold"));
            helpDiv.append($("<button>").text("Textbook").addClass("link-button").on("click", () => 
                {
                    this.sendData(this.a2ID("textbook"))
                    window.open(`https://diveintosystems.org/book/${bookChapter}`)
                }
            ));


            this.containerDiv.append(helpDiv);
        }
    }

    goToLink() {
        const registers = this.initialState[1].slice(0, 3);
        const instructions = this.initialState[0];
        const memoryValues = this.initialState[2].map(addr => addr.value).slice(3, 7);

        const encodedArchitecture = this.architecture == "ARM64" ? "ARM" : (this.architecture == "X86_32" ? "x86" : "x86_64");
        const encodedInstructions = instructions.map(inst => encodeURIComponent(inst)).join('%0A');
        const encodedRegisters = registers.map(reg => encodeURIComponent(reg.value)).join('/');
        const encodedMemoryValues = memoryValues.map(value => encodeURIComponent(value)).join('/');

        this.sendData(this.a2ID("asmVis"))

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
        const feedbackDiv = this.containerDiv.find("[id^='feedback']");
        feedbackDiv.removeClass("alert alert-success alert-danger");
        feedbackDiv.css('color', 'black');
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
        this.containerDiv.find(".help-container").remove();

        // rerender
        this.renderInstructionsList(this.initialState[0]);
        this.renderTables();
        this.renderButtons();
    }

    customizedTryAnother() {
        // Clear the current state and re-render the component

        this.containerDiv.find('.instruction-container').remove();
        this.containerDiv.find('.tables-container').remove();
        this.containerDiv.find('.button-container').remove();
        this.containerDiv.find("[id^='feedback']").remove();
        this.containerDiv.find('.link-button').remove();
        this.containerDiv.find(".help-container").remove();

        // rerender
        this.renderInstructionsList(this.initialState[0]);
        this.renderTables();
        this.renderButtons();
    }

    // Checks the user's answer and provides feedback
    checkAnswer() {
        let [userRegisters, userMemory] = this.gatherInput();
        let isCorrect = this.validateAnswers(userRegisters, userMemory);

        this.reRenderFeedback(isCorrect);
        if (isCorrect) {
            if (this.currentInstruction >= this.initialState[0].length) {
                this.renderFinalFeedback();
                this.containerDiv.find('.button-container button:contains("Check Answer")').prop('disabled', true);
                this.containerDiv.find(".instruction-div").removeClass("current").addClass("disabled");
            } else {
                this.currentInstruction++;
                this.moveToNextInstruction();
            }
        }

        const actualAnswers = this.allStates.slice(0, this.currentInstruction)
        const code = this.initialState[0].slice(0,this.currentInstruction)

        if(isCorrect){
            userMemory = null;
            userRegisters = null;
        }

        this.data = { code ,userRegisters, userMemory, currentInstruction: this.currentInstruction, actualAnswers }

        if(isCorrect){
            this.sendData(this.a2ID("correct"))
        }
        else {
            this.sendData(this.a2ID("incorrect"));
        }
    }

    // Handle case sensitivity or number forms
    normalizeValue(value) {
        if (typeof value === "string") {
            value = value.trim().toLowerCase();
            if (value.startsWith("0x")) {
                return parseInt(value, 16);
            }
            return parseInt(value, 10);
        }
        return value;
    }

    //Validates user's input against expected values
    validateAnswers(userRegisters, userMemory) {
    const expectedState = this.allStates[this.currentInstruction];
    let isCorrect = true;

    for (let reg of expectedState.registers) {
        if (this.normalizeValue(userRegisters[reg.register]) !== this.normalizeValue(reg.value)) {
            isCorrect = false;
            break;
        }
    }

    if (isCorrect) {
        for (let mem of expectedState.memory) {
            if (this.normalizeValue(userMemory[mem.address]) !== this.normalizeValue(mem.value)) {
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


    sendData(actionId) {
        let checkedOPs = []
        if(this.arith_checked){
            checkedOPs.push("Data Movement");
        }
        if(this.memo_checked){
            checkedOPs.push("Memory Operations");
        }
        if(this.stack_checked){
            checkedOPs.push("Stack Operations");
        }

        let details; 
        let aid = this.id2A(actionId)
        if (aid == "correct" || aid == "incorrect") {
            details = this.data;
        }

        if(aid == "generate" || aid == "load" || aid == "reset" || aid == "help" || aid == "asmVis" || aid == "textbook"){
            details = {
                config : {
                    operations: `${checkedOPs}`,
                },
            }
        }


        this.logData(null, details, actionId, this.componentId);
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