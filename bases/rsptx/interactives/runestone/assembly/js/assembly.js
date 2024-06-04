// *********
// assembly.js
// *********
// This file contains the JS for the Runestone Assembly component. It was created By Arys Aikyn, Tony Cao 06/03/2024
"use strict";

import RunestoneBase from "../../common/js/runestonebase.js";
import "./assembly-i18n.en.js";
import "../css/assembly.css";
import {ARM64_OPS, IA32_OPS} from "./arch_generate.js"

export var ARMList = {}; // Object containing all instances of ASM

// ASM constructor
export default class ASM_EXCERCISE extends RunestoneBase {
    constructor(opts) {
        super(opts);
        var orig = opts.orig; // entire <p> element
        this.origElem = orig;
        this.divid = orig.id;
        this.useRunestoneServices = opts.useRunestoneServices;
        
        // create an container div to store the displayed component
        this.containerDiv = $("<div>").attr("id", this.divid);

        // tempo value holder
        this.arith_checked = true;
        this.bit_checked = true;
        this.memo_checked = true;

        this.setDefaultParams();
        this.setCustomizedParams();
        this.renderFamilyOptions();
        this.generateOneQuestion();
        // this.caption = "Assembly Syntax";
        // this.addCaption("runestone");
        // if (typeof Prism !== "undefined") {
        //     Prism.highlightAllUnder(this.containerDiv);
        // }
        $(this.origElem).replaceWith(this.containerDiv);
    }

    // Find the script tag containing JSON in a given root DOM node.
    scriptSelector(root_node) {
        return $(root_node).find(`script[type="application/json"]`);
    }
    // set default parameters
    setDefaultParams() {
    }

    // load customized parameters
    setCustomizedParams() {
        const currentOptions = JSON.parse(this.scriptSelector(this.origElem).html());
        if (currentOptions["architecture"] != undefined) {
            this.architecture = currentOptions["architecture"];
        }

        switch (this.architecture) {
            case "IA32":  this.generator = new IA32_OPS();       break;
            case "ARM64": this.generator = new ARM64_OPS();      break;
            default: throw new Error("Invalid architecture option");
        }
    }

    /*===========================================
    ====   Functions generating final HTML   ====
    ===========================================*/
    // Create the ASM Element
    createAsmElement() {
        this.renderASMInputField();
        // replaces the intermediate HTML for this component with the rendered HTML of this component
    }

    renderFamilyOptions() {
        // create three checkboxes that will be used later on for question generation
        const instructionTypes = [
            { label: 'Arithmetics', value: 'arithmetic' },
            { label: 'Bit Operations', value: 'bitmanipulation' },
            { label: 'Memory Manipulation', value: 'memorymanipulation' }
        ];

        const instructionTypeDiv = $("<div>").attr("id", this.divid + "_instruction_types");
        instructionTypeDiv.append($("<h4>").text("Select Instruction Types:"));

        instructionTypes.forEach(type => {
            const checkbox = $("<input>").attr({
                type: "checkbox",
                id: this.divid + "_" + type.value,
                value: true
            });
            checkbox.on("change", () => {
                checkbox.value != checkbox.value;
                console.log(checkbox.value);
                console.log(checkbox.checked);
            })
            const label = $("<label>").attr("for", this.divid + "_" + type.value).text(type.label);
            instructionTypeDiv.append(checkbox).append(label).append(" ");
        });

        this.containerDiv.append(instructionTypeDiv).append("<br>");
    }

    renderASMInputField() {
        this.instruction = $("<div>").html(
            "For each of the following " + 
            this.architecture + 
            " instructions, indicate whether the instruction " + 
            "<b>could</b> be valid or invalid"
        );
        this.statementDiv = $("<div>").append(this.instruction);
        this.statementDiv.append("<br>");

        // input box generation
        this.inputBox = document.createElement("div");
        this.inputBox = $(this.inputBox); // contains all prompts and buttons

        this.textNodes = []; // create a reference to all current textNodes for future update
        this.inputNodes = []; // create slots for inputs for future updates
        var textNode = null; 
        this.generateOneQuestion();
        // this.genPromptsNAnswer();

        // // create and render all input fields in question group
        // for (let i = 0; i < this.num_q_in_group; i++) {
        //     this.newdivID = "div" + i;
        //     this.newDiv = $("<div>").attr("id", this.divid + this.newdivID);
        //     this.newDiv.append(String.fromCharCode((i + 97)) + ". "); // bulletin for each question
        //     textNode = $(document.createElement("code")).text(this.promptList[i]); // create the prompt
        //     textNode.css("font-size", "large");
        //     this.textNodes.push(textNode);

        //     this.newDiv.append(textNode);
        //     this.newDiv.append("<br>");

        //     this.radioButtons = [];
        //     // create and render valid/invalid answer fields
        //     this.newDiv.append("Valid? ");
        //     var lblYes = $("<label>").text("YES");
        //     var btnYes = $("<input>").attr({
        //         type: "radio",
        //         value: true,
        //         name: this.divid + "YN" + i,
        //         id: "Yes" + i
        //     });
        //     btnYes.on('change', function () {
        //         $(this).removeClass('highlightWrong');
        //         $(this).next('label').removeClass('highlightWrong');
        //     });
        //     var lblNo = $("<label>").text("NO");
        //     var btnNo = $("<input>").attr({
        //         type: "radio",
        //         value: false,
        //         name: this.divid + "YN" + i,
        //         id: "No" + i
        //     });
        //     btnNo.on('change', function () {
        //         $(this).removeClass('highlightWrong');
        //         $(this).prev('label').removeClass('highlightWrong');
        //     });
        //     this.newDiv.append(lblYes);
        //     this.newDiv.append(btnYes);
        //     this.newDiv.append(lblNo);
        //     this.newDiv.append(btnNo);

        //     this.radioButtons.push([btnYes, btnNo]);
        //     this.submitButton = $("<button>")
        //         .text($.i18n("msg_ASM_check_me"))
        //         .attr({
        //             class: "button-check",
        //             name: "answer",
        //             type: "button",
        //             id: this.divid + "submit" + i
        //         })
        //         .on("click", function() {
        //             this.checkThisAnswers(i);
        //         }.bind(this));
        //     this.submitButton.addClass("button-check checkingbutton");
        //     this.newDiv.append(this.submitButton);
        //     this.inputBox.append(this.newDiv);
        //     this.inputNodes.push(this.radioButtons);
        // }
        // this.statementDiv.append(this.inputBox);

        // // copy the original elements to the container holding what the user will see.
        // $(this.origElem).children().clone().appendTo(this.containerDiv);
        
        // this.statementDiv.addClass("statement-box");
        
        // // create a feedback div, will be removed in clear and added back when generate another question
        // this.feedbackDiv = $("<div>").attr("id", this.divid + "_feedback");

        // // remove the script tag.
        // this.scriptSelector(this.containerDiv).remove();
        // // ***div STRUCTURE***: containerDiv consists of instruction, <br>, inputBox.
        // // ***div STRUCTURE***: inputBox contains four newDiv. 
        // this.containerDiv.append(this.statementDiv);
    }



    genPromptsNAnswer() {
        this.promptList = [];
        this.answerList = [];
    }

    generateOneQuestion() {
        // generate_question_params(mem_arch, arith, bit)
        let [instruction, is_bad_type, is_bad_count] = this.generator.generate_question_params(true, true, true);

        console.log("Instruction:", instruction);
        console.log("Is bad type:", is_bad_type);
        console.log("Is bad count:", is_bad_count);
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
    $("[data-component=assembly_syntax]").each(function (index) {
        var opts = {
            orig: this,
            useRunestoneServices: eBookConfig.useRunestoneServices,
        };
        if ($(this).closest("[data-component=timedAssessment]").length == 0) {
            // If this element exists within a timed component, don't render it here
            try {
                ARMList[this.id] = new ASM_EXCERCISE(opts);
            } catch (err) {
                console.log(
                    `Error rendering Assembly Syntax Problem ${this.id}
                     Details: ${err}`
                );
            }
            console.log("rendering donee!");
        }
    });
});