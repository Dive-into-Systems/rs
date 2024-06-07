// *********
// binops21.js
// *********
// This file contains the JS for the Runestone numberconversion component. It was created By Luyuan Fan, Zhengfei Li, and Yue Zhang, 06/01/2023
"use strict";

import RunestoneBase from "../../common/js/runestonebase.js";
import "./nc-i18n.en.js";
import "../css/binops.css";
import { Pass } from "codemirror";

export var BOList = {}; // Object containing all instances of NC that aren't a child of a timed assessment.


// BO constructor
export default class BO extends RunestoneBase {
   constructor(opts) {
       super(opts);
       var orig = opts.orig; // entire <p> element
       this.useRunestoneServices = opts.useRunestoneServices;
       this.origElem = orig;
       this.divid = orig.id;
       this.correct = null;
       // fixed number of bits = 6
       this.num_bits = 6;
       this.shift_bits = 3;
      
       this.createNCElement();
       this.caption = "Bitwise Operation Calculator";
       this.addCaption("runestone");
       this.checkServer("nc", true);
       if (typeof Prism !== "undefined") {

           Prism.highlightAllUnder(this.containerDiv);
       }

       this.contWrong = 0;
   }

   // Find the script tag containing JSON in a given root DOM node.
   scriptSelector(root_node) {
       return $(root_node).find(`script[type="application/json"]`);

   }

    createNCElement() {
        this.renderNCPromptAndInput();
        this.renderNCButtons();
        this.renderNCFeedbackDiv();
        // replaces the intermediate HTML for this component with the rendered HTML of this component
        $(this.origElem).replaceWith(this.containerDiv);
   }
       
   renderNCPromptAndInput() {
    // parse options from the JSON script inside
    var currOption = JSON.parse(this.scriptSelector(this.origElem).html());

    // Generate the dropdown menu for bitwise operation
    this.containerDiv = document.createElement("div");
    this.containerDiv.id = this.divid;

    this.statementDiv = document.createElement("div");
    this.statementNode05 = document.createTextNode("Please enter two 6 bit values and choose an operator.");

    this.buttonsDiv = document.createElement("div");

    this.rightDiv = document.createElement("div");

    this.statementNode1 = document.createTextNode("Choose an operator: ");
    this.menuArray1 = ["AND", "OR", "XOR", "NOT", "Left Shift", "Right Shift(Logical)", "Right Shift(Arithmetic)"];
    this.menuArray2 = ["1", "2", "3", "4","5"];
    this.fromOpt = this.menuArray1;
    this.toOpt = this.menuArray2;

    // read binaryOperators-options as an array
    if (currOption["from-options"] === undefined) {
        this.fromOpt = this.menuArray1;
    } else {
        this.fromOpt = currOption["from-options"];
    }

    // read to-options as an array
    if (currOption["to-options"] === undefined) {
        this.toOpt = this.menuArray2;
    } else {
        this.toOpt = currOption["to-options"];
    }

    this.menuNode1 = document.createElement("select");
    for (var i = 0; i < this.fromOpt.length; i++) {
        var option = document.createElement("option");
        option.value = this.fromOpt[i];
        option.text = this.fromOpt[i];
        this.menuNode1.appendChild(option);
    }
    this.menuNode1.setAttribute("class", "form form-control selectwidthauto");
    // When the value of menuNode1 is changed, clear the answer
    this.menuNode1.addEventListener("change",
        function () {
            this.clearAnswer();
            if (this.menuNode1.value == "Left Shift" || this.menuNode1.value == "Right Shift(Logical)" || this.menuNode1.value == "Right Shift(Arithmetic)"){
                this.inputNode1.style.visibility = "hidden";
                this.menuNode2.style.visibility = "visible";
                bitsLabel.style.visibility = "visible"; // Show bitsLabel
            } else{
                this.inputNode1.style.visibility = "visible";
                this.menuNode2.style.visibility = "hidden";
                bitsLabel.style.visibility = "hidden"; // Hide bitsLabel
            }
        }.bind(this),
        false);

    // Initialize bitsLabel
    const bitsLabel = document.createElement("span");
    bitsLabel.textContent = "Number of shifts: ";
    bitsLabel.style.fontSize = "large";
    bitsLabel.style.fontWeight = "500";
    bitsLabel.style.marginRight = "10px";
    bitsLabel.style.visibility = "hidden"; // Initially hidden

    // change number of bits - menuNode2
    this.menuNode2 = document.createElement("select");
    for (var i = 0; i < this.toOpt.length; i++) {
        var option = document.createElement("option");
        option.value = this.toOpt[i];
        option.text = this.toOpt[i];
        this.menuNode2.appendChild(option);
    }
    this.menuNode2.setAttribute("class", "form form-control selectwidthauto");
    this.menuNode2.style.visibility = "hidden";
    // When the value of menuNode2 is changed and the conversion is valid,
    // generate a new answer.
    this.menuNode2.addEventListener("change",
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
    this.inputNode1 = document.createElement("input");
    this.inputNode1.setAttribute('type', 'text');
    this.inputNode1.setAttribute("size", "20");
    this.inputNode1.setAttribute("maxlength", this.num_bits);
    this.inputNode1.setAttribute("id", this.divid + "_input1");

    this.inputNode2 = document.createElement("input");
    this.inputNode2.setAttribute('type', 'text');
    this.inputNode2.setAttribute("size", "20");
    this.inputNode2.setAttribute("maxlength", this.num_bits);
    this.inputNode2.setAttribute("id", this.divid + "_input2");

    this.rightDiv.appendChild(this.inputNode1);
    this.rightDiv.appendChild(document.createElement("br"));
    this.rightDiv.appendChild(this.menuNode1);
    this.rightDiv.appendChild(this.inputNode2);
    this.rightDiv.appendChild(bitsLabel); // Append bitsLabel here
    this.rightDiv.appendChild(this.menuNode2);
    this.rightDiv.style.width = "80%";
    this.rightDiv.style.textAlign = "right";

    // render the statement
    this.statementDiv.appendChild(this.statementNode05);
    this.statementDiv.appendChild(document.createElement("br"));
    this.statementDiv.appendChild(document.createElement("br"));
    this.containerDiv.appendChild(this.statementDiv);
    this.containerDiv.appendChild(this.rightDiv);
    this.containerDiv.appendChild(document.createElement("br"));

    this.statementDiv.style.borderWidth = "1px";
    this.statementDiv.style.borderRadius = "5px";
    this.statementDiv.style.borderBlockStyle = "solid";
    this.statementDiv.style.borderBlockColor = "white";
    this.statementDiv.style.backgroundColor = "white";
    this.statementDiv.style.padding = "8px";

    // create the node for the prompt
    this.promptDiv = document.createElement("div");
    this.promptDiv.style.fontSize = "x-large";

    this.promptDivTextNode = document.createElement("code");
    this.promptDiv.appendChild(this.promptDivTextNode);

    var placeholder;
    this.promptDivTextNode.append("0b");
    placeholder = "your input (" + this.num_bits.toString() + "-digit binary value)";
    this.inputNode1.setAttribute("placeholder", placeholder);
    this.inputNode1.setAttribute("size", placeholder.length);
    this.inputNode1.setAttribute("maxlength", 1 + this.num_bits);
    placeholder = "your input (" + this.num_bits.toString() + "-digit binary value)";
    this.inputNode2.setAttribute("placeholder", placeholder);
    this.inputNode2.setAttribute("size", placeholder.length);
    this.inputNode2.setAttribute("maxlength", 1 + this.num_bits);

    this.inputNode = document.createElement("input");
    this.inputNode.setAttribute('type', 'text');
    this.inputNode.setAttribute("size", "20");
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
    ba.attr("class", "form form-control selectwidthauto");
    ba.attr("aria-label", "input area");
    this.blankArray = ba.toArray();
    // Set the style of code
    $(this.containerDiv).find("code").attr("class","code-inline tex2jax_ignore");
    // When a blank is changed mark this component as interacted with.
    for (let blank of this.blankArray) {
        $(blank).change(this.recordAnswered.bind(this));
    }

    const validCharRegex = /^[01]+$/; // Matches a string containing only "0" or "1" characters

    // Add event listener for key press on inputNode1
    this.inputNode1.addEventListener("keypress", function(event) {
        if (!validCharRegex.test(event.key)) {
            event.preventDefault();
        }
    });

    // Add event listener for key press on inputNode2
    this.inputNode2.addEventListener("keypress", function(event) {
        if (!validCharRegex.test(event.key)) {
            event.preventDefault();
        }
    });
}


   recordAnswered() {
       this.isAnswered = true;
   }

   renderNCButtons() {
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
           class: "btn btn-primary",
           name: "generate values",
           type: "button",
       });
       // Generate random values for the input fields
       this.generateButton.addEventListener(
           "click",
           function () {
               this.generateRandomValues();
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

   renderNCFeedbackDiv() {
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
       this.inputNode1.value = this.toBinary(Math.floor(Math.random() * (1 << this.num_bits)));
       this.inputNode2.value = this.toBinary(Math.floor(Math.random() * (1 << this.num_bits)));
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
        this.shift_bits = parseInt(this.menuNode2.value);
        // Check if both inputs are 6 bits long
        if (this.inputNode1.value == 'AND' || this.inputNode1.value == 'OR' || this.inputNode1.value == 'XOR') {
            if (this.inputNode1.value.length !== this.num_bits || this.inputNode2.value.length !== this.num_bits) {
                this.feedback_msg = "Please 6-bit binary number inputs.";
                this.renderFeedback();
                return;
            }
        } else{
            if (this.inputNode2.value.length !== this.num_bits) {
                this.feedback_msg = "Please 6-bit binary number inputs.";
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
    
        let num1 = parseInt(this.inputNode1.value, 2);
        let num2 = parseInt(this.inputNode2.value, 2);
        switch (this.menuNode1.value) {
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
                    //this.target_num_string = this.toBinary(((((~num2) & ((1 << this.shift_bits)-1))) | num2) >> this.shift_bits);
                    console.log("test test test");
                    this.target_num_string = ((num2 >> this.shift_bits) & ((1 << this.shift_bits)-1)).toString(2).padStart(this.shift_bits, '1');
                }
                else{
                    this.target_num_string = this.toBinary(num2 >> this.shift_bits);  
                }
                console.log(((num2 >> this.shift_bits) & ((1 << this.shift_bits)-1)).toString(2).padStart(this.shift_bits, '1'));
                break; 
        }
        this.promptDiv.innerHTML = ""; 

        this.answerNode = document.createElement("span");
        this.answerNode.textContent = this.target_num_string;
        this.answerNode.style.fontSize = "x-large";
        this.answerNode.style.fontWeight = "500";
        this.answerNode.style.textAlign = "right";
      
        // Add the answer element to the prompt div
        this.promptDiv.appendChild(answerLabel);
        this.promptDiv.appendChild(this.answerNode);
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
   $("[data-component=binops2]").each(function (index) {
       var opts = {
           orig: this,
           useRunestoneServices: eBookConfig.useRunestoneServices,
       };
       if ($(this).closest("[data-component=timedAssessment]").length == 0) {
           // If this element exists within a timed component, don't render it here
           try {
               BOList[this.id] = new BO(opts);
           } catch (err) {
               console.log(
                   `Error rendering Bitwise Operation Problem ${this.id}
                    Details: ${err}`
               );
           }
       }
   });
});
