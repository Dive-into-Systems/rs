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

export var ASMStateList = {}; // Object containing all instances of cachetable that aren't a child of a timed assessment.

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
        // this.renderTable();

        // provide values to the tab-les
        // this.resetGeneration();

        // this.renderTryAgainButton();

        // render the layout for the tables
        // this.renderLayout();
    }

    // set default parameters
    setDefaultParams() {
        this.defaultInitialState = {
            registers: {
                "%rax": 0,
                "%rdi": 0,
                "%rsi": 0,
                "%rbx": 0
            },
            memory: {
                '0x0000': 0,
                '0x0004': 0,
                '0x0008': 0,
                '0x000C': 0,
                '0x0010': 0,
                '0x0014': 0,
                '0x0018': 0,
                '0x001C': 0
            }
        };

        this.defaultInstructions = [
            "MOV %rax, %rdi",
            "ADD %rax, %rsi",
            "SUB %rbx, %rax",
            "LEA %rdi, [%rax + 4*%rsi]"
        ];

        this.defaultDebug = false;

        // Apply default values
        this.initialState = this.defaultInitialState;
        this.instructions = this.defaultInstructions;
        this.debug = this.defaultDebug;

        // Initialize the register and memory states
        this.registerState = this.initialState.registers;
        this.memoryState = this.initialState.memory;
        this.results = [];
    }


    // load customized parameters
    setCustomizedParams() {
        try {
            const currentOptions = JSON.parse(
                this.scriptSelector(this.origElem).html()
            );
            if (currentOptions["initialState"] != undefined) {
                this.initialState = currentOptions["initialState"];
            }
            if (currentOptions["instructions"] != undefined) {
                this.instructions = currentOptions["instructions"];
            }
            if (currentOptions["debug"] != undefined) {
                this.debug = eval(currentOptions["debug"]);
            }

            this.registerState = this.initialState.registers;
            this.memoryState = this.initialState.memory;
            this.results = [];

        } catch (error) {
            console.error('Error loading parameters:', error);
            // Default values or error handling
            this.setDefaultParams();
        }
    }

    renderHeader() {
        this.header = $("<div>").html(
            "Given the initial state of machine registers and memory, determine the effects of executing the following x86 assembly instructions. " +
            "For each instruction provided, describe how it alters the values in registers or memory. " +
            "Start with the initial state provided below, and sequentially apply each instruction, updating the state as you go.<br><br>"
        );
        this.headerDiv = $("<div>").append(this.header).addClass("header-box");
        this.headerDiv.append("<br>")
        this.containerDiv.append(this.headerDiv);
    }

    renderInstructions() {
        this.instruction = $("<div>").html(
            "<b>Instructions:</b><br>" +
            "1. Analyze the initial values in the registers (e.g., EAX, EBX, ECX, EDX) and memory addresses provided.<br>" +
            "2. For each assembly instruction listed, predict and write down the new values of the affected registers and memory addresses.<br>" +
            "3. Consider simple arithmetic instructions (e.g., ADD, SUB) and memory operations (e.g., MOV). Include more complex instructions like LEA to examine address calculations.<br>" +
            "4. Use the provided table to record the state of the registers and memory before and after each instruction.<br>" +
            "5. Reflect on the changes and verify if your predictions align with the expected outcomes based on the x86 instruction set rules.<br><br>" +
            "Fill in the resulting state of the machine after executing each of the provided instructions in sequence."
        )
        this.instructionDiv = $("<div>").append(this.instruction).addClass("instruction-box").addClass("instruction-box");
        this.instructionDiv.append("<br>");
        this.containerDiv.append(this.instructionDiv)
    }

    renderCustomizations() {

        const difficultyTypes = [
            { label: "Easy", value: "easy"},
            { label: "Hard", value: "hard"}
        ]

        // create three checkboxes that will be used later on for question generation
        const instructionTypes = [
            { label: 'Arithmetics', value: 'arithmetic' },
            { label: 'Bit Operations', value: 'bitmanipulation' },
            { label: 'Memory Manipulation', value: 'memorymanipulation' }
        ];

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
                checked: true
            });
            checkbox.on("change", (event) => {
                // Store the current state of checkboxes
                const prevArithChecked = this.arith_checked;
                const prevBitChecked = this.bit_checked;
                const prevMemoChecked = this.memo_checked;

                // Update the states based on the checkbox change
                switch(event.target.id){
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
        this.containerDiv.append(difficultyTypeDiv);
        this.containerDiv.append(instructionTypeDiv);
    }

    renderQuestions() {

    }

    genPromptsNAnswer() {

    }

    /*===================================
    === Checking/loading from storage ===
    ===================================*/
    // Note: they are not needed here

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
