// *********
// numconv.js
// *********
// This file contains the JS for the Runestone numberconversion component. It was created By Luyuan Fan, Zhengfei Li, and Yue Zhang, 06/01/2023
"use strict";

import RunestoneBase from "../../common/js/runestonebase.js";
import "./nc-i18n.en.js";
// import "./NC-i18n.pt-br.js";
import "../css/nc.css";
import { Pass } from "codemirror";

export var NCList = {}; // Object containing all instances of NC that aren't a child of a timed assessment.

// NC constructor
export default class NC extends RunestoneBase {
    constructor(opts) {
        super(opts);
        var orig = opts.orig; // entire <p> element
        this.useRunestoneServices = opts.useRunestoneServices;
        this.origElem = orig;
        this.divid = orig.id;
        this.correct = null;
        // default number of bits = 8
        this.num_bits = 8;
        
        this.createNCElement();
        this.generateButton.click();
        this.caption = "Number Conversion";
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
    /*===========================================
    ====   Functions generating final HTML   ====
    ===========================================*/
    // Create the NC Element
    createNCElement() {
        this.renderNCPromptAndInput();
        this.renderNCButtons();
        this.renderNCFeedbackDiv();
        // replaces the intermediate HTML for this component with the rendered HTML of this component
        $(this.origElem).replaceWith(this.containerDiv);
    }

    renderNCPromptAndInput() {
        // parse options from the JSON script inside
        var currOption = JSON.parse(
            this.scriptSelector(this.origElem).html()
        );
        // read number of bits 
        if (currOption["bits"] != undefined) {
            this.num_bits = eval(currOption["bits"]);
        }
        // ensure number of bits is a multiple of 4
        if ( this.num_bits % 4 != 0 ){
            alert($.i18n("msg_NC_not_divisible_by_4"));
            return;
        }
        // ensure number of bits is not too large
        if ( this.num_bits > 64 ){
            alert($.i18n("msg_NC_too_many_bits"));
            return;
        }

        // Generate the two dropdown menus for number conversion
        this.containerDiv = document.createElement("div");
        this.containerDiv.id = this.divid;

        this.statementDiv = document.createElement("div");

        // specify the number of bits in the statement
        this.statementNode05 = document.createTextNode("Please convert a value from one selected number system to another selected number system.");

        this.statementNode1 = document.createTextNode("Please convert from ");
        // default menu options
        this.menuArray1 = ["binary", "decimal-unsigned", "decimal-signed", "hexadecimal"];

        this.fromOpt = this.menuArray1;
        this.toOpt = this.menuArray1;

        // read from-options as an array
        if (currOption["from-options"] === undefined) {
            this.fromOpt = this.menuArray1;
        } else {
            this.fromOpt = currOption["from-options"];
        }
        // read to-options as an array
        if (currOption["to-options"] === undefined) {
            this.toOpt = this.menuArray1;
        } else {
            this.toOpt = currOption["to-options"];
        }
        // convert from-options to html option elements of menuNode1
        this.menuNode1 = document.createElement("select");
        for (var i = 0; i < this.fromOpt.length; i++) {
            var option = document.createElement("option");
            option.value = this.fromOpt[i];  
            option.text = this.fromOpt[i];
            this.menuNode1.appendChild(option);
        }
        this.menuNode1.setAttribute("class", "form form-control selectwidthauto");
        // When the value of menuNode1 is changed, generate a new number as the 
        // prompt. If the conversion is valid, then generate the corresponding 
        // answer. 
        this.menuNode1.addEventListener("change",
            function () {
                this.clearAnswer();
                this.generateNumber();
                this.checkValidConversion();
                if ( this.valid_conversion ) {
                    this.generateAnswer();
                }
            }.bind(this),
            false);


        this.statementNode2 = document.createTextNode(" to ");
        
         // convert to-options to html option elements of menuNode2
        this.menuNode2 = document.createElement("select");
        for (var i = 0; i < this.toOpt.length; i++) {
            var option = document.createElement("option");
            option.value = this.toOpt[i];
            option.text = this.toOpt[i];
            if ( i === 1 ) {
                option.selected = "selected";
            }
            this.menuNode2.appendChild(option);
        }
        this.menuNode2.setAttribute("class", "form form-control selectwidthauto");
        // When the value of menuNode2 is changed and the conversion is valid,
        // generate a new answer. 
        this.menuNode2.addEventListener("change",
            function () {
                this.checkValidConversion();
                if (this.valid_conversion) {
                    if (this.target_num === undefined ) {
                        this.generateNumber();
                    }
                    this.clearAnswer();
                    this.generateAnswer();
                }
            }.bind(this),
            false);
        
        // render the statement
        this.statementDiv.appendChild(this.statementNode05);
        this.statementDiv.appendChild(document.createElement("br"));
        this.statementDiv.appendChild(document.createElement("br"));
        this.statementDiv.appendChild(this.statementNode1);
        this.statementDiv.appendChild(this.menuNode1);
        this.statementDiv.appendChild(this.statementNode2);
        this.statementDiv.appendChild(this.menuNode2);
        this.containerDiv.appendChild(this.statementDiv);
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

        // create the node for the number being displayed (conversion from)
        this.promptDivTextNode = document.createElement("code");
        this.promptDiv.appendChild(this.promptDivTextNode);
        
        // render the input field
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
        // Set the style of coded
        // When a blank is changed mark this component as interacted with.
        // And set a class on the component in case we want to render components that have been used
        // differently
        for (let blank of this.blankArray) {
            $(blank).change(this.recordAnswered.bind(this));
        }
    }

    recordAnswered() {
        this.isAnswered = true;
    }

    renderNCButtons() {
        // "check me" button and "generate a number" button
        this.submitButton = document.createElement("button");
        this.submitButton.textContent = $.i18n("msg_NC_check_me");
        $(this.submitButton).attr({
            class: "btn btn-success",
            name: "do answer",
            type: "button",
        });
        // check the answer when the conversion is valid
        this.submitButton.addEventListener(
            "click",
            function () {
                this.checkValidConversion();
                if ( this.valid_conversion ) {
                    this.checkCurrentAnswer();
                    this.logCurrentAnswer();
                }
            }.bind(this),
            false
        );

        this.generateButton = document.createElement("button");
        this.generateButton.textContent = $.i18n("msg_NC_generate_a_number");
        $(this.generateButton).attr({
            class: "btn btn-success",
            name: "generate a number",
            type: "button",
        });
        // generate a new number for conversion 
        this.generateButton.addEventListener(
            "click",
            function () {
                this.checkValidConversion();
                if ( this.valid_conversion ) {
                    this.clearAnswer();
                    this.generateNumber();
                    this.generateAnswer();
                }
            }.bind(this),
            false
        );

        this.containerDiv.appendChild(document.createElement("br"));
        this.containerDiv.appendChild(this.generateButton);
        this.containerDiv.appendChild(this.submitButton);

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
        this.feedbackDiv.remove();
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
        return str;
    }
    // Convert an integer to its hexadecimal expression with leading zeros as a string.
    // The string always has length of this.num_bits / 4
    toHexadecimal(num) {
        var str = num.toString(16);
        var target_len = Math.ceil(this.num_bits / 4);
        if (str.length < target_len) {
            var leading_zeros = "";
            for ( var i = str.length ; i < target_len; i ++ ) {
                leading_zeros += "0";
            }
            str = leading_zeros + str;
        }
        return str;
    }

    // generate a random number from 0 to 2^(this.num_bits)-1 and set the number to display
    generateNumber() {
        this.target_num = Math.floor(Math.random() * (1 << this.num_bits) ) ;
        // ensure the number is not 2^(this.num_bits)
        if (this.target_num === (1 << this.num_bits)) {
            this.target_num --;
        }
        switch (this.menuNode1.value) {
            case "binary" : 
                this.displayed_num_string = this.toBinary(this.target_num);
                break;
            case "decimal-unsigned" : 
                this.displayed_num_string = this.target_num.toString(10);
                break;
            case "decimal-signed" : 
                if ( this.target_num & ( 1 << (this.num_bits - 1) )) {
                    this.displayed_num_string = (this.target_num - (1 << this.num_bits)).toString(10); 
                } else {
                    this.displayed_num_string = this.target_num.toString(10);
                }
                break;
            case "hexadecimal" : 
                this.displayed_num_string = this.toHexadecimal(this.target_num);
                break;
        }
        
    }

    // generate the answer as a string based on the randomly generated number
    generateAnswer() {
        this.hideFeedback();
        this.feedback_msg = "";
        this.inputNode.style.visibility = 'visible';
        switch (this.menuNode2.value) {
            case "binary" : 
                this.target_num_string = this.toBinary(this.target_num);
                break;
            case "decimal-unsigned" : 
                this.target_num_string = this.target_num.toString(10);
                break;
            case "decimal-signed" : 
                if ( this.target_num & ( 1 << (this.num_bits - 1) )) {
                    this.target_num_string = (this.target_num - (1 << this.num_bits)).toString(10); 
                } else {
                    this.target_num_string = this.target_num.toString(10);
                }
                break;
            case "hexadecimal" : 
                this.target_num_string = this.toHexadecimal(this.target_num);
                break;
        }
        // update the prompt
        this.generatePrompt();
    }

    // Update the prompt to display
    // It is in the format of "xxxxx = ______"
    generatePrompt() {

        this.inputNode.style.visibility = 'visible';
        switch(this.menuNode1.value) {
            case "binary" : 
                this.promptDivTextNode.textContent = "0b" + this.displayed_num_string + " = ";
                break;
            case "decimal-unsigned" : 
                this.promptDivTextNode.textContent = this.displayed_num_string + " = ";
                break;
            case "decimal-signed" : 
                this.promptDivTextNode.textContent = this.displayed_num_string + " = ";
                break;
            case "hexadecimal" : 
                this.promptDivTextNode.textContent = "0x" + this.displayed_num_string + " = ";
                break;           
        }

        // the placeholder tells what the desired input should be like
        var placeholder;
        switch(this.menuNode2.value) {
            case "binary" : 
                this.promptDivTextNode.append("0b");
                placeholder = "your answer (" + this.num_bits.toString() + "-digit binary value)";
                break;
            case "decimal-unsigned" : 
                placeholder = "your answer (unsigend decimal)";
                break;
            case "decimal-signed" : 
                placeholder = "your answer (signed decimal)";
                break;
            case "hexadecimal" : 
                this.promptDivTextNode.append("0x");
                placeholder = "your answer (" + this.num_bits.toString() + "-digit hexadecimal value)";
                break;           
        }
        this.inputNode.setAttribute("placeholder", placeholder);
        this.inputNode.setAttribute("size", placeholder.length);
        this.inputNode.setAttribute("maxlength", 1+this.num_bits);
    }

    // check if the conversion is valid  
    checkValidConversion() {
        this.hideFeedback();
        this.valid_conversion = true;
        // a conversion is valid when two types are different
        if (this.menuNode1.value === this.menuNode2.value) {
            this.valid_conversion = false;
            this.correct = false;
            this.feedback_msg = ($.i18n("msg_NC_same_exp"));
            this.renderFeedback();
            this.inputNode.style.visibility = "hidden";
            this.promptDivTextNode.textContent = "";
        // if one of the option is signed decimal, then the other
        // option must be binary
        } else if ((this.menuNode1.value === "decimal-signed" 
                && this.menuNode2.value != "binary") 
                || (this.menuNode2.value === "decimal-signed" 
                && this.menuNode1.value != "binary")) 
            {
            this.valid_conversion = false;
            this.correct = false;
            this.feedback_msg = ($.i18n("msg_NC_two02dec"));
            this.renderFeedback();
            this.inputNode.style.visibility = 'hidden';
            this.promptDivTextNode.textContent = "";
            return;
        } else {
            this.promptDiv.style.visibility = "visible";
        }
    }
    
    // check if the answer is correct
    checkCurrentAnswer() {
        // the answer is correct if it is the same as the string this.target_num_string
        var input_value = this.inputNode.value.toLowerCase();
        if ( input_value === "" ) {
            this.feedback_msg = ($.i18n("msg_no_answer"));
            this.correct = false;
        } else if ( input_value != this.target_num_string ) {
            this.feedback_msg = ($.i18n("msg_NC_incorrect"));
            this.contWrong ++;
            this.correct = false;

            if (this.contWrong >= 3) {
                if (this.menuNode1.value == "decimal-signed" || this.menuNode2.value == "decimal-signed") {
                    this.feedback_msg += ("\n" + $.i18n("msg_hint_sign"));
                } else if (this.menuNode1.value == "decimal-unsigned" || this.menuNode2.value == "decimal-unsigned") {
                    this.feedback_msg += ("\n" + $.i18n("msg_hint_dec"));
                    if (this.menuNode2.value == "binary") {
                        this.feedback_msg += ("\n" + $.i18n("msg_hint_bi"));
                    }
                } else {
                    this.feedback_msg += ("\n" + $.i18n("msg_hint_b2hex"));
                }
            }
                        
        } else {
            this.feedback_msg = ($.i18n("msg_NC_correct"));
            this.correct = true;
            this.contWrong = 0;
        }
    }

    // log the answer and other info to the server (in the future)
    async logCurrentAnswer(sid) {
        let answer = JSON.stringify(this.inputNode.value);
        // Save the answer locally.
        this.setLocalStorage({
            answer: answer,
            timestamp: new Date(),
        });
        let data = {
            event: "numconv",
            act: answer || "",
            answer: answer || "",
            correct: this.correct ? "T" : "F",
            div_id: this.divid,
        };
        if (typeof sid !== "undefined") {
            data.sid = sid;
            feedback = false;
        }
        // render the feedback
        this.renderFeedback();
        return data;
    }

    /*===================================
    === Checking/loading from storage ===
    ===================================*/
    // Note: they are not needed here
    restoreAnswers(data) {
        // pass
    }
    checkLocalStorage() {
        // pass
    }
    setLocalStorage(data) {
        // pass
    }
    
    hideFeedback() {
        this.feedbackDiv.remove();
    }

    displayFeedback() {
        this.feedbackDiv.style.visibility = "visible";
    }

    renderFeedback() {
        this.feedbackDiv = document.createElement("div");
        this.feedbackDiv.setAttribute("id", this.divid + "_feedback");
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
    $("[data-component=numberconversion]").each(function (index) {
        var opts = {
            orig: this,
            useRunestoneServices: eBookConfig.useRunestoneServices,
        };
        if ($(this).closest("[data-component=timedAssessment]").length == 0) {
            // If this element exists within a timed component, don't render it here
            try {
                NCList[this.id] = new NC(opts);
            } catch (err) {
                console.log(
                    `Error rendering Number Conversion Problem ${this.id}
                     Details: ${err}`
                );
            }
        }
    });
});
