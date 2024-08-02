// *********
// binops21.js
// *********
// This file contains the JS for the Runestone numberconversion component. It was created By Luyuan Fan, Zhengfei Li, and Yue Zhang, 06/01/2023
"use strict";

import RunestoneBase from "../../common/js/runestonebase.js";
import "./nc-i18n.en.js";
import "../css/bincalc.css";
import { Pass } from "codemirror";

export var BinCalcList = {}; // Object containing all instances of NC that aren't a child of a timed assessment.


// BinCalc constructor
export default class BinCalc extends RunestoneBase {
   constructor(opts) {
       super(opts);
       var orig = opts.orig; // entire <p> element
       this.useRunestoneServices = opts.useRunestoneServices;
       this.origElem = orig;
       this.divid = orig.id;
        
       // Default configuration settings
       this.correct = null;
       this.num_bits = 6; // default number of bits is 6
       this.operatorList = ["AND (&)", "OR (|)", "XOR (^)", "NOT (~)", "Left shift (<<)", "Logical right shift (>>)", "Arithmetic right shift (>>)"];
       this.bitShiftList = ["1", "2", "3", "4","5"];

       // Fields for logging data
       this.componentId = "4.3";
       this.questionId = 1;
       this.userId = this.getUserId();

       this.initBinCalcElement();

       if (typeof Prism !== "undefined") {
           Prism.highlightAllUnder(this.containerDiv);
       }
       this.sendData(0);
   }

   // Find the script tag containing JSON in a given root DOM node.
   scriptSelector(root_node) {
       return $(root_node).find(`script[type="application/json"]`);
   }

   /*===========================================
   ====   Functions generating final HTML   ====
   ===========================================*/
   // Component initialization
    initBinCalcElement() {
        this.renderBinCalcPromptAndInput();
        this.renderBinCalcButtons();
        this.initFeedbackDiv();
        // replaces the intermediate HTML for this component with the rendered HTML of this component
        $(this.origElem).replaceWith(this.containerDiv);
   }
       
    renderBinCalcPromptAndInput() {
    // parse options from the JSON script inside
    var currOption = JSON.parse(this.scriptSelector(this.origElem).html());

    // Generate the dropdown menu for bitwise operation
    this.containerDiv = document.createElement("div");
    this.containerDiv.id = this.divid;

    this.instructionNode = document.createElement("div");
    this.instructionNode.innerHTML = "<span style='font-weight:bold'><u>Instructions</u></span>: This is a binary value calculator. You can experiment with 6-bit value(s) with your chosen operator. You can only type in 0s and 1s.";
    this.instructionNode.style.padding = "10px";

    this.buttonsDiv = document.createElement("div");
    this.buttonsDiv.style.display = 'flex';
    this.buttonsDiv.style.justifyContent = 'center';

    this.inputDiv = document.createElement("div");
    this.inputDiv.style.width = "95%";

    // read binary operators options as an array
    if (currOption["operator-options"] === undefined) {
        this.operatorMenu = this.operatorList;
    } else {
        this.operatorMenu = currOption["operator-options"];
    }

    // read to-options as an array
    if (currOption["bitshift-options"] === undefined) {
        this.bitShiftList = this.bitShiftList;
    } else {
        this.bitShiftList = currOption["bitshift-options"];
    }

    this.operatorMenu = document.createElement("select");
    this.operatorMenu.setAttribute("class", "selectwidthauto code-style-menu binops-inline");
    for (var i = 0; i < this.operatorList.length; i++) {
        var option = document.createElement("option");
        option.value = this.operatorList[i];
        option.text = this.operatorList[i];
        this.operatorMenu.appendChild(option);
    }

    // change number of bits - bit shift menu
    this.bitShiftMenu = document.createElement("select");
    this.bitShiftMenu.setAttribute("class", "selectwidthauto code-style-menu");
    for (var i = 0; i < this.bitShiftList.length; i++) {
        var option = document.createElement("option");
        option.value = this.bitShiftList[i];
        option.text = this.bitShiftList[i];
        this.bitShiftMenu.appendChild(option);
    }

    // When the value of bitShiftMenu is changed and the conversion is valid,
    // generate a new answer.
    this.bitShiftMenu.addEventListener("change",
    function () {
        $(this.feedbackDiv).remove();
        this.generateAnswer();
    }.bind(this),
    false);

    // Initialize bitsLabel
    this.bitShiftDiv = document.createElement("div");
    this.bitShiftDiv.style.position = "fixed";
    this.bitShiftDiv.style.right = "20px";
    this.bitsLabel = document.createTextNode("Shift by: ")
    this.bitsLabel.className = "bits-label";
    this.bitShiftDiv.appendChild(this.bitsLabel);
    this.bitShiftDiv.appendChild(this.bitShiftMenu);

    // When the value of operatorMenu is changed, clear the answer
    this.operatorMenu.addEventListener("change",
        function () {
            $(this.feedbackDiv).remove();
            this.configInputDiv(this.operatorMenu.value);
            this.generateAnswer();
        }.bind(this),
        false);

    // Create input fields for the two values
    this.inputBoxTop = document.createElement("input");
    this.inputBoxTop.setAttribute("class", "form form-control selectwidthauto number-input-box");
    this.inputBoxTop.setAttribute('type', 'text');
    this.inputBoxTop.setAttribute("maxlength", this.num_bits);
    this.inputBoxTop.setAttribute("id", this.divid + "_input1");
    
    this.inputBoxBottom = document.createElement("input");
    this.inputBoxBottom.setAttribute("class", "form form-control selectwidthauto number-input-box");
    this.inputBoxBottom.setAttribute('type', 'text');
    this.inputBoxBottom.setAttribute("maxlength", this.num_bits);
    this.inputBoxBottom.setAttribute("id", this.divid + "_input2");

    var placeholder;
    placeholder = this.num_bits.toString() + "-digit binary value";
    this.inputBoxTop.setAttribute("placeholder", placeholder);
    this.inputBoxTop.setAttribute("size", placeholder.length);
    this.inputBoxTop.setAttribute("maxlength", this.num_bits);
    placeholder = this.num_bits.toString() + "-digit binary value";
    this.inputBoxBottom.setAttribute("placeholder", placeholder);
    this.inputBoxBottom.setAttribute("size", placeholder.length);
    this.inputBoxBottom.setAttribute("maxlength", this.num_bits);

    // Restrict the user to only put in 1s and 0s
    const validCharRegex = /^[01]+$/;

    this.inputBoxTop.addEventListener("keypress", function(event) {
        if (!validCharRegex.test(event.key) || this.inputBoxTop.value.length >= this.num_bits) {
            event.preventDefault();
        }
    }.bind(this));
    
    this.inputBoxBottom.addEventListener("keypress", function(event) {
        if (!validCharRegex.test(event.key) || this.inputBoxBottom.value.length >= this.num_bits) {
            event.preventDefault();
        }
    }.bind(this));
    
    // Configure the InputDiv with a randomly chosen operator
    const randomOperator = this.operatorList[Math.floor(Math.random() * this.operatorList.length)];
    this.operatorMenu.value = randomOperator;
    this.configInputDiv(randomOperator); 

    // Create resultDiv to put the results in 
    this.resultDiv = document.createElement("div");
    this.resultDiv.className = "result-div";

    this.resultDivTextNode = document.createElement("code");
    this.resultDiv.appendChild(this.resultDivTextNode);

    // render the statement
    this.containerDiv.appendChild(this.instructionNode);
    this.containerDiv.appendChild(document.createElement("br"));
    this.containerDiv.appendChild(this.inputDiv);
    this.containerDiv.appendChild(document.createElement("br"));

    // Copy the original elements to the container holding what the user will see.
    $(this.origElem).children().clone().appendTo(this.containerDiv);

    // Remove the script tag.
    this.scriptSelector(this.containerDiv).remove();
    // Set the class for the text inputs, then store references to them.
    let ba = $(this.containerDiv).find(":input");
    ba.attr("aria-label", "input area");
    this.blankArray = ba.toArray();
    // Set the style of code
    $(this.containerDiv).find("code").attr("class","code-inline tex2jax_ignore");
    // When a blank is changed mark this component as interacted with.
    for (let blank of this.blankArray) {
        $(blank).change(this.recordAnswered.bind(this));
    }
    }

    configInputDiv(opt) {
        if (opt == "Left shift (<<)" || opt == "Logical right shift (>>)" || opt == "Arithmetic right shift (>>)"){
            while ( this.inputDiv.firstChild ) this.inputDiv.removeChild( this.inputDiv.firstChild );
            this.inputDiv.appendChild(this.operatorMenu);
            this.inputDiv.appendChild(this.inputBoxTop);
            this.inputDiv.appendChild(document.createElement("br"));
            this.inputDiv.appendChild(this.bitsLabel);
            this.inputDiv.appendChild(this.bitShiftMenu);
        }
        else if (opt == "NOT (~)") {
            while ( this.inputDiv.firstChild ) this.inputDiv.removeChild( this.inputDiv.firstChild );
            this.inputDiv.appendChild(this.operatorMenu);
            this.inputDiv.appendChild(this.inputBoxTop);
        }
        else {
            while ( this.inputDiv.firstChild ) this.inputDiv.removeChild( this.inputDiv.firstChild );
            this.inputDiv.appendChild(this.inputBoxTop);
            this.inputDiv.appendChild(document.createElement("br"));
            this.inputDiv.appendChild(this.operatorMenu);
            this.inputDiv.appendChild(this.inputBoxBottom);
            this.inputDiv.appendChild(document.createElement("br"));
        }
        this.inputDiv.style.textAlign = "right";
    }

    recordAnswered() {
        this.isAnswered = true;
    }

    renderBinCalcButtons() {
        // A button that calculates results
        this.calculateButton = document.createElement("button");
        this.calculateButton.textContent = "Calculate \u27A4";
        $(this.calculateButton).attr({
            class: "btn btn-success",
            name: "calculate button",
            type: "button",
        });

        // Show the answer when the button is clicked
        this.calculateButton.addEventListener(
            "click",
            function () {
                this.generateAnswer();
                this.renderBinCalcFeedbackDiv();
                this.sendData(8);
            }.bind(this),
            false
        );
        
        // A button that clears all input field and result
        this.clearButton = document.createElement("button");
        this.clearButton.textContent = "Clear input";
        $(this.clearButton).attr({
            class: "btn clear-btn",
            name: "clear button",
            type: "button",
        });
        // Show the answer when the button is clicked
        this.clearButton.addEventListener(
            "click",
            function () {
                this.clearAnswer();
            }.bind(this),
            false
        );

        // "Generate Values" button
        this.generateButton = document.createElement("button");
        this.generateButton.textContent = "Generate Values";
        $(this.generateButton).attr({
            class: "btn btn-success",
            name: "generate values",
            type: "button",
        });
        // Generate random values for the input fields
        this.generateButton.addEventListener(
            "click",
            function () {
                this.sendData(9);
                $(this.feedbackDiv).remove();
                this.generateRandomValues(this.operatorMenu.value);
                this.generateAnswer();
            }.bind(this), false);

        this.generateButton.style.marginRight = "10px";
        
        this.buttonsDiv.appendChild(this.calculateButton);
        this.buttonsDiv.appendChild(this.clearButton);
        this.buttonsDiv.appendChild(this.generateButton);

        this.containerDiv.appendChild(this.buttonsDiv);
    }

    // clear the input field
    clearAnswer() {
        this.feedbackDiv.remove();
        this.inputBoxTop.value = "";
        this.inputBoxBottom.value = "";
        this.incomplete = 1;
    }

    // Generate random values for the input fields
    generateRandomValues(opt) {
        this.inputBoxTop.value = this.toBinary(Math.floor(Math.random() * (1 << this.num_bits)));
        if (opt == "AND (&)" || opt == "OR (|)" || opt == "XOR (^)") {
            this.inputBoxBottom.value = this.toBinary(Math.floor(Math.random() * (1 << this.num_bits)));
        }
    }

    // Convert an integer to its binary expression with leading zeros as a string.
    // The string always has length of this.num_bits
    toBinary(num) {
        let str = num.toString(2);
        if (str.length < this.num_bits) {
            var leading_zeros = "";
            for ( var i = str.length ; i < this.num_bits; i ++ ) {
                leading_zeros += "0";
            }
            str = leading_zeros + str;
        }
        if (str.length > this.num_bits){
                str = str.slice(str.length-this.num_bits);
        }
        return str;
    }

    initFeedbackDiv() {
        this.feedbackDiv = document.createElement("div");
        this.feedbackDiv.setAttribute("id", this.divid + "_feedback");
    }

    generateAnswer() {
        this.incomplete = 0;
        let opt = this.operatorMenu.value;
        if ((! this.inputBoxTop.value) || ((opt == "AND (&)" || opt == "OR (|)" || opt == "XOR (^)") && (! this.inputBoxBottom.value))) {
            console.log("In this case");
            this.incomplete = 1;
            return;
        }

        let num1 = parseInt(this.inputBoxTop.value, 2);
        let num2 = parseInt(this.inputBoxBottom.value, 2);
        let shift_bits = parseInt(this.bitShiftMenu.value, 10);

        switch (opt) {
            case "AND (&)":
                this.answerValue = num1 & num2;
                break;
            case "NOT (~)":
                this.answerValue = (~num1) & ((1 << this.num_bits) - 1);
                break;
            case "OR (|)":
                this.answerValue = num1 | num2;
                break;
            case "XOR (^)":
                this.answerValue = num1 ^ num2;
                break;
            case "Left shift (<<)":
                this.answerValue = (num1 << shift_bits) & ((1 << this.num_bits) - 1);
                break;
            case "Logical right shift (>>)":
                this.answerValue = num1 >>> shift_bits;
                break;
            case "Arithmetic right shift (>>)":
                this.answerValue = num1 >> shift_bits;
                this.answerValue = this.answerValue & ((1 << this.num_bits) - 1);
                if (this.inputBoxTop.value[0] === "1") {
                    this.answerValue = this.answerValue.toString(2).padStart(this.num_bits, '1');
                } else {
                    this.answerValue = this.answerValue.toString(2).padStart(this.num_bits, '0');
                }
                break;
            default:
                this.answerValue = null;
                break;
        }
    
        // Convert the numeric answerValue to binary string for display
        if (this.answerValue !== null) {
            this.answerValue = this.toBinary(this.answerValue);
        }
    }

    renderBinCalcFeedbackDiv() {
        
        this.feedbackDiv.innerHTML = ""; 
        
        if (this.incomplete == 1 || !this.answerValue) {
            this.feedbackDiv.className = "alert alert-danger";
            this.feedbackDiv.innerHTML = "Please make sure you have enter the value(s)."
        }
        else {
            let binaryResultNode = document.createElement("span");
            binaryResultNode.textContent = `Binary result: 0b${this.answerValue}`;
            this.feedbackDiv.appendChild(binaryResultNode);
            this.feedbackDiv.appendChild(document.createElement("br"));

            // Convert binary string back to a number for decimal and hexadecimal
            let dec = parseInt(this.answerValue, 2);

            let decimalResultNode = document.createElement("span");
            decimalResultNode.textContent = `Decimal result: 0d${dec}`;
            this.feedbackDiv.appendChild(decimalResultNode);
            this.feedbackDiv.appendChild(document.createElement("br"));

            let hexResultNode = document.createElement("span");
            let hex = dec.toString(16);
            hexResultNode.textContent = `Hexadecimal result: 0x${hex}`;
            this.feedbackDiv.appendChild(hexResultNode);

            this.feedbackDiv.className = "alert alert-info";

            if (typeof MathJax !== "undefined") {
                MathJax.typesetPromise([this.feedbackDiv]);
            }
        }
        this.containerDiv.appendChild(this.feedbackDiv);
    }

    sendData(actionId) {
        let now = new Date();
        let bundle = {
            timestamp: now.toString(),
            componentId : this.componentId,
            questionId : this.questionId,
            actionId : actionId,
            userId : this.userId
        }

        if (actionId !== 0) {
            bundle.details = {
                config : {
                    operator : `${this.operatorMenu.value}`,
                    shiftBits : (this.operatorMenu.value == "AND (&)" || this.operatorMenu.value == "OR (|)" || this.operatorMenu.value == "XOR (^)") ? null : `${parseInt(this.bitShiftMenu.value, 10)}`,
                    value : {
                        num1 : `${this.inputBoxTop.value}`,
                        num2 : (this.operatorMenu.value == "AND (&)" || this.operatorMenu.value == "OR (|)" || this.operatorMenu.value == "XOR (^)") ? `${this.inputBoxBottom.value}` : null
                    }
                },
                calculatedResult : `${this.answerValue}`
            }
        }
        else { bundle.details = null }


        this.logData(bundle);
    }

}
    /*=================================
    == Find the custom HTML tags and ==
    ==   execute our code on them    ==
    =================================*/
    $(document).on("runestone:login-complete", function () {
        $("[data-component=bincalc]").each(function (index) {
            var opts = {
                orig: this,
                useRunestoneServices: eBookConfig.useRunestoneServices,
            };
            if ($(this).closest("[data-component=timedAssessment]").length == 0) {
                // If this element exists within a timed component, don't render it here
                try {
                    BinCalcList[this.id] = new BinCalc(opts);
                } catch (err) {
                    console.log(
                        `Error rendering Bitwise Operation Problem ${this.id}
                            Details: ${err}`
                    );
                }
            }
        });
    });
