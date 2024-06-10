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
       this.numBitsList = ["4", "6", "8"];

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
        this.renderBinCalcFeedbackDiv();
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
    this.instructionNode = document.createTextNode("This is a binary value calculator. You can experiment with 6-bit value(s) with your chosen operator.");   

    this.buttonsDiv = document.createElement("div");

    this.rightDiv = document.createElement("div");

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

    // read to-options as an array
    if (currOption["num-bits-options"] === undefined) {
        this.numBitsList = this.numBitsList;
    } else {
        this.numBitsList = currOption["num-bits-options"];
    }

    // change number of bits - numBitsMenu
    this.numBitsMenu = document.createElement("select");
    for (var i = 0; i < this.numBitsList.length; i++) {
        var option = document.createElement("option");
        option.value = this.numBitsList[i];
        option.text = this.numBitsList[i];
        this.numBitsMenu.appendChild(option);
    }
    this.numBitsMenu.setAttribute("class", "form form-control selectwidthauto");
    // When the value of numBitsMenu is changed and the conversion is valid,
    // generate a new answer.
    this.numBitsMenu.addEventListener("change",
        function () {
            var temp = 0;
        }.bind(this),
    false);

    this.operatorMenu = document.createElement("select");
    this.operatorMenu.style.border = "none";
    this.operatorMenu.style.fontFamily = "Courier New";
    this.operatorMenu.style.fontWeight = "700";

    this.operatorMenu.className = "code-style-menu";
    this.operatorMenu.setAttribute("class", "selectwidthauto code-style-menu");
    for (var i = 0; i < this.operatorList.length; i++) {
        var option = document.createElement("option");
        option.value = this.operatorList[i];
        option.text = this.operatorList[i];
        this.operatorMenu.appendChild(option);
    }

    // When the value of operatorMenu is changed, clear the answer
    this.operatorMenu.addEventListener("change",
        function () {
            this.clearAnswer();
            if (this.operatorMenu.value == "Left Shift" || this.operatorMenu.value == "Right Shift (Logical)" || this.operatorMenu.value == "Right Shift (Arithmetic)"){
                this.inputBoxTop.style.visibility = "hidden";
                this.bitShiftMenu.style.visibility = "visible";
                bitsLabel.style.visibility = "visible"; // Show bitsLabel
            } else{
                this.inputBoxTop.style.visibility = "visible";
                this.bitShiftMenu.style.visibility = "hidden";
                bitsLabel.style.visibility = "hidden"; // Hide bitsLabel
            }
        }.bind(this),
        false);

    // Initialize bitsLabel
    const bitsLabel = document.createElement("span");
    bitsLabel.textContent = "Number of shifts: ";
    bitsLabel.className = "bits-label";
    bitsLabel.style.visibility = "hidden";

    // change number of bits - bit shift menu
    this.bitShiftMenu = document.createElement("select");
    for (var i = 0; i < this.bitShiftList.length; i++) {
        var option = document.createElement("option");
        option.value = this.bitShiftList[i];
        option.text = this.bitShiftList[i];
        this.bitShiftMenu.appendChild(option);
    }
    this.bitShiftMenu.setAttribute("class", "form form-control selectwidthauto");
    this.bitShiftMenu.style.visibility = "hidden";

    // When the value of bitShiftMenu is changed and the conversion is valid,
    // generate a new answer.
    this.bitShiftMenu.addEventListener("change",
    function () {
        // attempting to generate new answer
        this.checkValidConversion();
        if (this.valid_conversion) {
            this.clearAnswer();
            this.generateAnswer();
        }
    }.bind(this),
    false);

    // Create input fields for the two values
    this.inputBoxTop = document.createElement("input");
    this.inputBoxTop.className = "number-input-box";
    this.inputBoxTop.setAttribute('type', 'text');
    // this.inputBoxTop.setAttribute("size", "x-large");
    this.inputBoxTop.setAttribute("maxlength", this.num_bits);
    this.inputBoxTop.setAttribute("id", this.divid + "_input1");
    this.inputBoxTop.setAttribute("class", "form form-control selectwidthauto");
    
    this.inputBoxBottom = document.createElement("input");
    this.inputBoxBottom.className = "number-input-box";
    this.inputBoxBottom.setAttribute('type', 'text');
    // this.inputBoxBottom.setAttribute("size", "x-large");
    this.inputBoxBottom.setAttribute("maxlength", this.num_bits);
    this.inputBoxBottom.setAttribute("id", this.divid + "_input2");
    this.inputBoxBottom.setAttribute("class", "form form-control selectwidthauto");

    this.rightDiv.appendChild(this.inputBoxTop);
    this.rightDiv.appendChild(document.createElement("br"));
    // this.rightDiv.appendChild(this.operatorMenu);
    this.rightDiv.appendChild(this.operatorMenu);
    this.rightDiv.appendChild(this.inputBoxBottom);
    this.rightDiv.appendChild(document.createElement("br"));
    this.rightDiv.appendChild(bitsLabel); // Append bitsLabel here
    this.rightDiv.appendChild(this.bitShiftMenu);
    this.rightDiv.style.width = "90%";
    this.rightDiv.style.textAlign = "right";

    // render the statement
    this.statementDiv.appendChild(this.instructionNode);
    this.statementDiv.appendChild(document.createElement("br"));
    this.statementDiv.appendChild(this.numBitsMenu);
    // this.statementDiv.appendChild(document.createElement("br"));
    this.statementDiv.appendChild(document.createElement("br"));
    this.containerDiv.appendChild(this.statementDiv);
    // this.containerDiv.appendChild(document.createElement("br"));
    this.containerDiv.appendChild(this.rightDiv);
    this.containerDiv.appendChild(document.createElement("br"));

    // create the node for the prompt
    this.promptDiv = document.createElement("div");
    this.promptDiv.className = "prompt-div";

    this.promptDivTextNode = document.createElement("code");
    this.promptDiv.appendChild(this.promptDivTextNode);

    var placeholder;
    this.promptDivTextNode.append("0b");
    placeholder = this.num_bits.toString() + "-digit binary value";
    this.inputBoxTop.setAttribute("placeholder", placeholder);
    this.inputBoxTop.setAttribute("size", placeholder.length);
    this.inputBoxTop.setAttribute("maxlength", this.num_bits);
    placeholder = this.num_bits.toString() + "-digit binary value";
    this.inputBoxBottom.setAttribute("placeholder", placeholder);
    this.inputBoxBottom.setAttribute("size", placeholder.length);
    this.inputBoxBottom.setAttribute("maxlength", this.num_bits);

    this.inputNode = document.createElement("input");
    this.inputNode.setAttribute('type', 'text');
    this.inputNode.setAttribute("size", "xx-large");
    this.inputNode.setAttribute("id", this.divid + "_input");
    this.promptDiv.appendChild((this.inputNode));
    this.containerDiv.appendChild(this.promptDiv);

    // prompt is invisible by default
    this.promptDiv.style.visibility = "hidden";

    this.feedbackDiv = document.createElement("div");
    this.feedbackDiv.setAttribute("id", this.divid + "_feedback");

    // Copy the original elements to the container holding what the user will see.
    $(this.origElem).children().clone().appendTo(this.containerDiv);

    // Remove the script tag.
    this.scriptSelector(this.containerDiv).remove();
    // Set the class for the text inputs, then store references to them.
    let ba = $(this.containerDiv).find(":input");
    // ba.attr("class", "form form-control selectwidthauto");
    ba.attr("aria-label", "input area");
    this.blankArray = ba.toArray();
    // Set the style of code
    $(this.containerDiv).find("code").attr("class","code-inline tex2jax_ignore");
    // When a blank is changed mark this component as interacted with.
    for (let blank of this.blankArray) {
        $(blank).change(this.recordAnswered.bind(this));
    }

    const validCharRegex = /^[01]+$/; // Matches a string containing only "0" or "1" characters

    // Add event listener for key press on inputBoxTop
    this.inputBoxTop.addEventListener("keypress", function(event) {
        if (!validCharRegex.test(event.key)) {
            event.preventDefault();
        }
    });

    // Add event listener for key press on inputBoxBottom
    this.inputBoxBottom.addEventListener("keypress", function(event) {
        if (!validCharRegex.test(event.key)) {
            event.preventDefault();
        }
    });
}


   recordAnswered() {
       this.isAnswered = true;
   }

   renderBinCalcButtons() {
       // "Show Answer" button
       this.submitButton = document.createElement("button");
       this.submitButton.textContent = "Show Answer";
       $(this.submitButton).attr({
           class: "btn btn-success",
           name: "show answer",
           type: "button",
       });
       // Show the answer when the button is clicked
       this.submitButton.addEventListener(
           "click",
           function () {
               this.checkValidConversion();
               if (this.valid_conversion) {
                   this.generateAnswer();
               }
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
            this.generateRandomValues();
            if (this.answerDiv != undefined){
                this.answerDiv.style.visibility = "hidden";
               }
        }.bind(this),
        false
    );

       this.generateButton.style.marginRight = "10px";
       this.buttonsDiv.appendChild(this.generateButton);
       this.buttonsDiv.appendChild(this.submitButton);
       
       this.buttonsDiv.style.width = "62%";
       this.buttonsDiv.style.textAlign = "center";

       this.containerDiv.appendChild(this.buttonsDiv);

       this.inputNode.addEventListener(
           "keypress",
           function(event) {
           if (event.key === "Enter") {
                   this.submitButton.click();
               }
           }.bind(this), false
       );
   }

   renderBinCalcFeedbackDiv() {
       this.containerDiv.appendChild(document.createElement("br"));
       this.containerDiv.appendChild(this.feedbackDiv);
   }

   // clear the input field
   clearAnswer() {
       this.inputNode.value = "";
       ///this.hideFeedback();
       this.feedbackDiv.remove();
     
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

   // generate the answer as a string based on the user input
   generateAnswer() {
        this.hideFeedback();
        this.feedback_msg = "";
        this.shift_bits = parseInt(this.bitShiftMenu.value);
        // Check if both inputs are 6 bits long
        if (this.inputBoxTop.value == 'AND' || this.inputBoxTop.value == 'OR' || this.inputBoxTop.value == 'XOR') {
            if (this.inputBoxTop.value.length !== this.num_bits || this.inputBoxBottom.value.length !== this.num_bits) {
                this.feedback_msg = "Please input 6-bit binary number(s).";
                this.renderFeedback();
                return;
            }
        } else{
            if (this.inputBoxBottom.value.length !== this.num_bits) {
                this.feedback_msg = "Please input 6-bit binary number(s).";
                this.renderFeedback();
                return;
            }
        }
        const answerLabel = document.createElement("span");
        answerLabel.textContent = "Answer: ";
        answerLabel.style.fontSize = "x-large";
        answerLabel.style.fontWeight = "500";
        answerLabel.style.marginRight = "10px";
    
        // Remove the input element if it exists
        if (this.promptDiv.contains(this.inputNode)) {
        this.promptDiv.removeChild(this.inputNode);
        }
    
        let num1 = parseInt(this.inputBoxTop.value, 2);
        let num2 = parseInt(this.inputBoxBottom.value, 2);
        switch (this.operatorMenu.value) {
            case "AND" :
                this.target_num_string = this.toBinary(num1 & num2);
                break;
            case "NOT" :
                this.target_num_string = this.toBinary((~num1) & ((1 << this.num_bits)-1));
                break;
            case "OR" :
                this.target_num_string = this.toBinary(num1 | num2);
                break;
            case "XOR" :
                this.target_num_string = this.toBinary(num1 ^ num2);
                break;
            case "Left Shift" :
                this.target_num_string = this.toBinary(num2 << this.shift_bits);
                break;
            case "Right Shift(Logical)" :
                this.target_num_string = this.toBinary(num2 >>> this.shift_bits);
                break;
            case "Right Shift(Arithmetic)" :
                console.log("in right shift");
                if (this.toBinary(num2)[0] === "1"){
                    this.target_num_string = ((num2 >> this.shift_bits) & ((1 << this.num_bits)-1)).toString(2).padStart(this.num_bits, '1');                
                }
                else{
                    this.target_num_string = this.toBinary(num2 >> this.shift_bits);  
                }
                // console.log(((num2 >> this.shift_bits) & ((1 << this.shift_bits)-1)).toString(2).padStart(this.shift_bits, '1'));
                break; 
        }
        this.promptDiv.innerHTML = ""; 

        this.answerNode = document.createElement("span");
        this.answerNode.textContent = this.target_num_string;
        this.answerNode.style.fontSize = "x-large";
        this.answerNode.style.fontWeight = "500";
        this.answerNode.style.textAlign = "right";
      
        // Add the answer element to the prompt div
        this.answerDiv = document.createElement("div");
        this.answerDiv.appendChild(answerLabel);
        this.answerDiv.appendChild(this.answerNode);
        this.promptDiv.appendChild(this.answerDiv);
        this.promptDiv.style.width = "48%";
        this.promptDiv.style.textAlign = "right";
        this.promptDiv.style.visibility = 'visible';
   }

   // Update the prompt to display
   generatePrompt() {
        this.promptDivTextNode.textContent = this.target_num_string;
        this.promptDiv.style.visibility = 'visible';
   }

   // check if the conversion is valid 
   checkValidConversion() {
       this.hideFeedback();
       this.valid_conversion = true;
   }

   hideFeedback() {
       this.feedbackDiv.innerHTML = "";
   }

   displayFeedback() {
       this.feedbackDiv.style.visibility = "visible";
   }

   renderFeedback() {

    //    this.hideFeedback();

       
    //    this.feedbackDiv = document.createElement("div");
    //    this.feedbackDiv.setAttribute("id", this.divid + "_feedback");
    //    this.containerDiv.appendChild(this.feedbackDiv);
    //     /*
    //    // only the feedback message needs to display
    //    var feedback_html = "<dev>" + this.feedback_msg + "</dev>";
    //     */
    //    var feedback_msg_elem = document.createElement("div");
    //    feedback_msg_elem.innerHTML = this.feedback_msg;
    //    var feedback_html = "<dev>" + this.feedback_msg + "</dev>";
    //    if (this.correct) {
    //        $(this.feedbackDiv).attr("class", "alert alert-info");
    //    } else {
    //        $(this.feedbackDiv).attr("class", "alert alert-danger");
    //    }
      
    //    this.feedbackDiv.innerHTML = feedback_msg_elem;
    //    this.displayFeedback();
    //    if (typeof MathJax !== "undefined") {
    //        this.queueMathJax(document.body);
    //    }
    // this.feedbackDiv = document.createElement("div");
    // this.feedbackDiv.setAttribute("id", this.divid + "_feedback");
    this.containerDiv.appendChild(this.feedbackDiv);


    // only the feedback message needs to display
    var feedback_html = "<dev>" + this.feedback_msg + "</dev>";
    if (this.correct) {
        $(this.feedbackDiv).attr("class", "alert alert-info");
    } else {
        $(this.feedbackDiv).attr("class", "alert alert-danger");
    }
   
    this.feedbackDiv.innerHTML = feedback_html;
    this.displayFeedback();
    if (typeof MathJax !== "undefined") {
        this.queueMathJax(document.body);
    }
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
