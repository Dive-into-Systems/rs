// *********
// assembly_state.js
// *********
// This file contains the JS for the Runestone Assembly State component. It was created By Arys Aikyn, Tony Cao 06/03/2024
"use strict";

import RunestoneBase from "../../common/js/runestonebase.js";
import "../css/assembly_state.css";
import "./assembly-i18n.en.js";
import { Pass } from "codemirror";
import { validLetter } from "jexcel";
import {ARM64_OPS, X86_32_OPS, X86_64_OPS} from "./arch_generate.js"

export var ASMStateList = {}; // Object containing all instances of cachetable that aren't a child of a timed assessment.
const num_instructions = 5;
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

        this.renderInstructionsList(this.initialState[0]);
        this.renderTables();
        this.renderButtons();

        // provide values to the tables
        // this.resetGeneration();

        // Placeholder for rendering the "Try Again" button
        // this.renderTryAgainButton();

        // Render the layout for the tables
        // this.renderLayout();
    }

    // set default parameters
    setDefaultParams() {
        this.architecture = "X86_64"; // Default architecture
    }

    // load customized parameters
    setCustomizedParams() {
        const currentOptions = JSON.parse(this.scriptSelector(this.origElem).html());
        if (currentOptions["architecture"] != undefined) {
            this.architecture = currentOptions["architecture"];
        }

        switch (this.architecture) {
            case "X86_32":  this.generator = new X86_32_OPS();       break;
            case "X86_64":  this.generator = new X86_64_OPS();       break;
            case "ARM64": this.generator = new ARM64_OPS();      break;
            default: throw new Error("Invalid architecture option");
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
        const difficultyTypes = [
            { label: "Easy", value: "easy" },
            { label: "Hard", value: "hard" }
        ];

        const instructionTypes = [
            { label: 'Arithmetics', value: 'arithmetic' },
            { label: 'Bit Operations', value: 'bitmanipulation' },
            { label: 'Memory Manipulation', value: 'memorymanipulation' }
        ];

        const customizationDiv = $("<div>").addClass("customization-container");

        const difficultyTypeDiv = $("<div>").attr("id", this.divid + "_difficulty_types");
        difficultyTypeDiv.append($("<div>").text("Select Difficulty"));

        difficultyTypes.forEach(difficulty => {
            let radioButton = $("<input>").attr({
                type: "radio",
                id: difficulty.value,
                name: "difficulty",  // Use the same 'name' for all radio buttons to group them
                value: difficulty.value,
                checked: difficulty.value === 'easy'  // Optionally preselect one, e.g., 'easy'
            });

            radioButton.on("change", (event) => {
                console.log("Selected difficulty: ", event.target.value);
            });

            const label = $("<label>").attr("for", difficulty.value).text(difficulty.label);
            difficultyTypeDiv.append(radioButton).append(label).append(" ");
        });

        const instructionTypeDiv = $("<div>").attr("id", this.divid + "_instruction_types");
        instructionTypeDiv.append($("<div>").text("Select Instruction Types:"));

        instructionTypes.forEach(family => {
            let checkbox = $("<input>").attr({
                type: "checkbox",
                id: family.value,
                value: family.value,
                checked: false
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
                if (!this.arith_checked && !this.bit_checked && !this.memo_checked) {
                    event.preventDefault();
                    // Restore the previous states
                    this.arith_checked = prevArithChecked;
                    this.bit_checked = prevBitChecked;
                    this.memo_checked = prevMemoChecked;

                    // Restore the checkbox's checked state
                    $(event.target).prop('checked', !event.target.checked);
                }
            });

            const label = $("<label>").attr("for", family.value).text(family.label);
            instructionTypeDiv.append(checkbox).append(label).append(" ");
        });

        difficultyTypeDiv.append("<br>");
        instructionTypeDiv.append("<br>");
        customizationDiv.append(difficultyTypeDiv);
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
        console.log("tryin another question");
        // Clear the current state and re-render the component
        this.initialState = this.generator.generateRandomInitialState(num_instructions, num_registers, num_addresses, this.architecture);
        this.containerDiv.find('.instruction-container').remove();
        this.containerDiv.find('.tables-container').remove();
        this.containerDiv.find('.button-container').remove();
        this.containerDiv.find('.feedback-container').remove(); 
        this.renderInstructionsList(this.initialState[0]);
        this.renderTables();
        this.renderButtons();
    }

    checkAnswer() {
        console.log("Checking answers.");
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
    
        // Compare user's inputs with the expected outputs
        const isCorrect = this.validateAnswers(userRegisters, userMemory);
    
        // Provide feedback
        this.renderFeedback(isCorrect);
    }
    
    validateAnswers(userRegisters, userMemory) {
        
        "Arysssssssssssssssss"
        return true; // Placeholder, replace with actual comparison logic
    }
    

    renderInstructionsList(instructions) {
        const instructionDiv = $("<div>").addClass("instruction-container");
        instructionDiv.append($("<h3>").text("The Instructions"));

        const instructionList = $("<ol>");
        instructions.forEach(inst => {
            instructionList.append($("<li>").text(inst));
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
    
        ["rax", "rdi", "rsp"].forEach(reg => {
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
