// assembly_state.js
// *********
// This file contains the JS for the Runestone Assembly State component. It was created By Arys Aikyn, Tony Cao 06/03/2024
"use strict";

import RunestoneBase from "../../common/js/runestonebase.js";
import "../css/assembly_state.css";
import "./assembly-i18n.en.js";
import { Pass } from "codemirror";
import { validLetter } from "jexcel";
import { ARM64_OPS, X86_32_OPS, X86_64_OPS } from "./arch_generate.js";

export var ASMStateList = {}; // Object containing all instances of cachetable that aren't a child of a timed assessment.
const num_instructions = 1;
const num_registers = 5;
const num_addresses = 5;

// ASMState constructor
export default class ASMState_EXCERCISE extends RunestoneBase {
    constructor(opts) {
        super(opts);
        var orig = opts.orig; // entire <p> element
        this.origElem = orig;
        this.divid = orig.id;
        this.useRunestoneServices = opts.useRunestoneServices;

        this.currentStep = 0; // Track the current instruction step

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

    createAssemblyStateElement() {
        this.setDefaultParams();
        this.setCustomizedParams();

        // create the main div
        this.containerDiv = $("<div>").attr("id", this.divid);

        // rendering the whole thing
        this.renderHeader();
        this.renderCustomizations();
        this.initialState = this.generator.generateRandomInitialState(num_instructions, num_registers, num_addresses, this.architecture);
        console.log(this.initialState);
        this.allState = this.generator.executeInstructions(this.initialState);
        console.log(this.allState);

        this.renderInstructionsList(this.initialState[0]);
        this.renderTables();
        this.renderButtons();
    }

    // set default parameters
    setDefaultParams() {
        this.architecture = "X86_64"; // Default architecture
    }

    // load customized parameters
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

    renderHeader() {
        this.header = $("<div>").html(
            "Given the initial state of machine registers and memory, determine the effects of executing the following assembly instructions. " +
            "For each instruction provided, describe how it alters the values in registers or memory. " +
            "Start with the initial state provided below, and sequentially apply each instruction, updating the state as you go.<br><br>"
        );
        this.headerDiv = $("<div>").append(this.header).addClass("header-box");
        this.containerDiv.append(this.headerDiv);
    }

    renderCustomizations() {
        const instructionTypes = [
            { label: 'Arithmetics', value: 'arithmetic', defaultChecked: true },
            { label: 'Stack Operations', value: 'stackoperation', defaultChecked: false },
            { label: 'Memory Manipulation', value: 'memorymanipulation', defaultChecked: false }
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
    

    renderButtons() {
        const buttonContainer = $("<div>").addClass("button-container");

        const resetButton = $("<button>").text("Reset").on("click", () => this.resetValues());
        const tryAnotherButton = $("<button>").text("Try Another Question").on("click", () => this.tryAnother());
        const checkAnswerButton = $("<button>").text("Check Answer").on("click", () => this.checkAnswer());

        buttonContainer.append(resetButton).append(tryAnotherButton).append(checkAnswerButton);
        this.containerDiv.append(buttonContainer);
    }

    resetValues() {
        this.containerDiv.find("input[type='text']").val("");
        this.containerDiv.find('.feedback-container').remove();
    }

    tryAnother() {
        console.log("trying another question");
        // Clear the current state and re-render the component
        this.initialState = this.generator.generateRandomInitialState(num_instructions, num_registers, num_addresses, this.architecture);
        this.currentStep = 0; // Reset the step counter
        this.containerDiv.find('.instruction-container').remove();
        this.containerDiv.find('.tables-container').remove();
        this.containerDiv.find('.button-container').remove();
        this.containerDiv.find('.feedback-container').remove();
        this.renderInstructionsList(this.initialState[0]);
        this.renderTables();
        this.renderButtons();
    }

    validateAnswers(userRegisters, userMemory, step) {
        

      
        const expectedStates = this.generator.executeInstructions(this.initialState);
        const expectedState = expectedStates[step];
        let isCorrect = true;

        console.log("expected for Registers")
        console.log(expectedState.registers)
        console.log("expected for Memory")
        console.log(expectedState.memory)
        // Validate registers
        for (let reg of expectedState.registers) {
            if (userRegisters[reg.register] === undefined || userRegisters[reg.register].toLowerCase() !== reg.value.toLowerCase()) {
                isCorrect = false;
                break;
            }
        }
    
        // Validate memory
        if (isCorrect) {
            for (let mem of expectedState.memory) {
                if (userMemory[mem.address] === undefined || userMemory[mem.address].toLowerCase() !== mem.value.toLowerCase()) {
                    isCorrect = false;
                    break;
                }
            }
        }
        return isCorrect;
    }
    
    checkAnswer() {
        console.log("Checking answers for step: ", this.currentStep);
        // Retrieve user's input values
        const registerInputs = this.containerDiv.find('.register-table tbody tr');
        const memoryInputs = this.containerDiv.find('.memory-table tbody tr');

        let userRegisters = {};
        registerInputs.each((index, row) => {
            const reg = $(row).find('td').eq(0).text();
            const userValue = $(row).find('input').val();
            userRegisters[reg] = userValue;
        });

        let userMemory = {};
        memoryInputs.each((index, row) => {
            const address = $(row).find('td').eq(0).text();
            const userValue = $(row).find('input').val();
            userMemory[address] = userValue;
        });
        console.log("user inputs for Registers")
        console.log(userRegisters)
        console.log("user inputs for Memory")
        console.log(userMemory)
        const isCorrect = this.validateAnswers(userRegisters, userMemory, this.currentStep);
    
        // Provide feedback
        this.renderFeedback(isCorrect);

        if (isCorrect) {
            this.currentStep++;
            if (this.currentStep >= this.initialState[0].length) {
                this.renderFinalFeedback();
            } else {
                // Optionally reset the input fields for the next step
                this.resetValues();
            }
        }
    }
    
    renderInstructionsList(instructions) {
        const instructionDiv = $("<div>").addClass("instruction-container");
        instructionDiv.append($("<h3>").text("The Instructions"));
    
        const instructionList = $("<ol>");
        instructions.forEach((inst, index) => {
            const listItem = $("<li>").text(inst);
            instructionList.append(listItem);
        });
    
        instructionDiv.append(instructionList);
        this.containerDiv.append(instructionDiv);
    }

    renderTables() {
        console.log("Rendering tables...");
        const [instructions, addresses, registers] = this.initialState;

        const tablesContainer = $("<div>").addClass("tables-container");

        // Registers table
        const registersWrapper = $("<div>").addClass("table-wrapper");
        const registersTable = $("<table>").addClass("register-table");
        registersWrapper.append($("<h3>").text("Registers"));

        const registersTableHead = $("<thead>").append($("<tr>").append($("<th>").text("Register"), $("<th>").text("Initial Values"), $("<th>").text("Post Instruction Values")));
        const registersTableBody = $("<tbody>");

        ["rax", "rdi", "rsp", "rdx"].forEach(reg => {
            const initialValue = registers.find(r => r.register === reg)?.value || "0x0";
            registersTableBody.append($("<tr>").append($("<td>").text(reg), $("<td>").text(initialValue), $("<td>").append($("<input>").attr("type", "text"))));
        });

        registersTable.append(registersTableHead).append(registersTableBody);
        registersWrapper.append(registersTable);

        // Memory changes table
        const memoryWrapper = $("<div>").addClass("table-wrapper");
        const memoryTable = $("<table>").addClass("memory-table");
        memoryWrapper.append($("<h3>").text("Memory Changes"));

        const memoryTableHead = $("<thead>").append($("<tr>").append($("<th>").text("Address"), $("<th>").text("Initial Values"), $("<th>").text("Post Instruction Values")));
        const memoryTableBody = $("<tbody>");

        addresses.forEach(addr => {
            memoryTableBody.append($("<tr>").append($("<td>").text(addr.address), $("<td>").text(addr.value), $("<td>").append($("<input>").attr("type", "text"))));
        });

        memoryTable.append(memoryTableHead).append(memoryTableBody);
        memoryWrapper.append(memoryTable);

        tablesContainer.append(registersWrapper).append(memoryWrapper);
        this.containerDiv.append(tablesContainer);
    }

    renderFeedback(isCorrect) {
        let feedbackDiv = this.containerDiv.find('.feedback-container');
        if (feedbackDiv.length === 0) {
            feedbackDiv = $("<div>").addClass("feedback-container");
            this.containerDiv.append(feedbackDiv);
        }
        feedbackDiv.empty();

        const feedbackMessage = isCorrect ? "Correct! Well done." : "Incorrect. Please try again.";
        feedbackDiv.append("<br>");
        feedbackDiv.append($("<p>").text(feedbackMessage).css('color', isCorrect ? 'green' : 'red'));
    }

    renderFinalFeedback() {
        let feedbackDiv = this.containerDiv.find('.feedback-container');
        if (feedbackDiv.length === 0) {
            feedbackDiv = $("<div>").addClass("feedback-container");
            this.containerDiv.append(feedbackDiv);
        }
        feedbackDiv.empty();

        const feedbackMessage = "All instructions completed! Well done.";
        feedbackDiv.append("<br>");
        feedbackDiv.append($("<p>").text(feedbackMessage).css('color', 'blue'));
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
