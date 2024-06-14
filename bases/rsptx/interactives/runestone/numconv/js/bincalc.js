// *********
// binops21.js
// *********
// This file contains the JS for the Runestone numberconversion component. It was created By Luyuan Fan, Zhengfei Li, and Yue Zhang, 06/01/2023
"use strict";

import RunestoneBase from "../../common/js/runestonebase.js";
import "./nc-i18n.en.js";
import "../css/binops.css";
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
       this.correct = null;
       this.num_bits = 6; // default number of bits is 6
       this.shift_bits = 3;
       this.operatorList = ["AND", "OR", "XOR", "NOT", "Left Shift", "Right Shift (Logical)", "Right Shift (Arithmetic)"];
       this.bitShiftList = ["1", "2", "3", "4","5"];

       this.initBinCalcElement();
       this.caption = "Binary Calculator";
       this.addCaption("runestone");
       this.checkServer("nc", true);
       if (typeof Prism !== "undefined") {
           Prism.highlightAllUnder(this.containerDiv);
       }
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

    this.statementDiv = document.createElement("div");
    this.statementDiv.className = "statement-div"

    this.statementNode = document.createTextNode("Choose an operator: ");
    this.instructionNode = document.createElement("div");
    this.instructionNode.innerHTML = "This is a binary value calculator. You can experiment with 6-bit value(s) with your chosen operator.<br>You can only type in 0s and 1s in the boxes below.";

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
        // attempting to generate new answer
        $(this.feedbackDiv).remove();
        this.generateAnswer();
        console.log(this.answerValue);
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
        if (!validCharRegex.test(event.key)) {
            event.preventDefault();
        }
    });

    this.inputBoxBottom.addEventListener("keypress", function(event) {
        if (!validCharRegex.test(event.key)) {
            event.preventDefault();
        }
    });
    
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
    this.statementDiv.appendChild(this.instructionNode);
    this.containerDiv.appendChild(this.statementDiv);
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
        if (opt == "Left Shift" || opt == "Right Shift (Logical)" || opt == "Right Shift (Arithmetic)"){
            while ( this.inputDiv.firstChild ) this.inputDiv.removeChild( this.inputDiv.firstChild );
            this.inputDiv.appendChild(this.operatorMenu);
            this.inputDiv.appendChild(this.inputBoxTop);
            this.inputDiv.appendChild(document.createElement("br"));
            this.inputDiv.appendChild(this.bitsLabel);
            this.inputDiv.appendChild(this.bitShiftMenu);
        }
        else if (opt == "NOT") {
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
            class: "btn calculate-btn",
            name: "calculate button",
            type: "button",
        });

        // Show the answer when the button is clicked
        this.calculateButton.addEventListener(
            "click",
            function () {
                this.generateAnswer();
                this.renderBinCalcFeedbackDiv();
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
            class: "btn generate-btn",
            name: "generate values",
            type: "button",
        });
        // Generate random values for the input fields
        this.generateButton.addEventListener(
            "click",
            function () {
                $(this.feedbackDiv).remove();
                this.generateRandomValues();
                if (this.answerDiv != undefined){
                    this.answerDiv.style.visibility = "hidden";
                }
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
    }

    // Generate random values for the input fields
    generateRandomValues() {
        this.inputBoxTop.value = this.toBinary(Math.floor(Math.random() * (1 << this.num_bits)));
        this.inputBoxBottom.value = this.toBinary(Math.floor(Math.random() * (1 << this.num_bits)));
    }

    // Convert an integer to its binary expression with leading zeros as a string.
    // The string always has length of this.num_bits
    toBinary(num) {
        var str = num.toString(2);
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
        let num1 = parseInt(this.inputBoxTop.value, 2);
        let num2 = parseInt(this.inputBoxBottom.value, 2);
        if ((this.inputBoxTop.value == "") || ((opt == "AND" || opt == "NOT" || opt == "OR" || opt == "XOR") && (this.inputBoxBottom.value == ""))) {
            this.incomplete = 1;
            return;
        }

        switch (opt) {
            case "AND" :
                this.answerValue = this.toBinary(num1 & num2);
                break;
            case "NOT" :
                this.answerValue = this.toBinary((~num1) & ((1 << this.num_bits)-1));
                break;
            case "OR" :
                this.answerValue = this.toBinary(num1 | num2);
                break;
            case "XOR" :
                this.answerValue = this.toBinary(num1 ^ num2);
                break;
            case "Left Shift" :
                this.answerValue = this.toBinary(num2 << this.shift_bits);
                break;
            case "Right Shift (Logical)" :
                this.answerValue = this.toBinary(num2 >>> this.shift_bits);
                break;
            case "Right Shift (Arithmetic)" :
                if (this.toBinary(num2)[0] === "1"){
                    this.answerValue = ((num2 >> this.shift_bits) & ((1 << this.num_bits)-1)).toString(2).padStart(this.num_bits, '1');                
                }
                else{
                    this.answerValue = this.toBinary(num2 >> this.shift_bits);  
                }
                break;
        }
    }

    renderBinCalcFeedbackDiv() {
        
        this.feedbackDiv.innerHTML = ""; 
        
        if (this.incomplete == 1) {
            this.feedbackDiv.className = "alert alert-danger";
            this.feedbackDiv.innerHTML = "Please make sure you have enter the value(s)."
        }
        else {
            // Add the result
            let resultNode = document.createElement("span");
            resultNode.textContent = `Result: ${this.answerValue}`;
            this.feedbackDiv.appendChild(resultNode);
        
            this.feedbackDiv.className = "alert alert-info";
        
            if (typeof MathJax !== "undefined") {
                MathJax.typesetPromise([this.feedbackDiv]);
            }
        }
    
        this.containerDiv.appendChild(this.feedbackDiv);
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
