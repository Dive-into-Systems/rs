// *********
// numconv.js
// *********
// This file contains the JS for the Runestone numberconversion component. It was created By Luyuan Fan, Zhengfei Li, and Yue Zhang, 06/01/2023
"use strict";


import RunestoneBase from "../../common/js/runestonebase.js";
import "./nc-i18n.en.js";
// import "./NC-i18n.pt-br.js";
import "../css/binops.css";
import { Pass } from "codemirror";


export var BOList = {}; // Object containing all instances of NC that aren't a child of a timed assessment.


// NC constructor
export default class BO extends RunestoneBase {
   constructor(opts) {
       super(opts);
       var orig = opts.orig; // entire <p> element
       this.useRunestoneServices = opts.useRunestoneServices;
       this.origElem = orig;
       this.divid = orig.id;
       this.correct = null;
       this.num_bits = 4; // default number of bits = 4
       this.fromOpt = ["AND", "OR", "XOR", "NOT", "Left Shift", "Right Shift (Logical)", "Right Shift (Arithmetic)"];
       this.toOpt = ["4", "6", "8"];
      
       this.createBOElement();
       this.generateButton.click();
       this.caption = "Bitwise Operation";
       this.addCaption("runestone");
       this.checkServer("nc", true);
    //    this.randomItem = "";
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
   createBOElement() {
       this.renderBOPromptAndInput();
       this.renderBOButtons();
       this.renderBOFeedbackDiv();
        // this.getCheckedValues();
        // replaces the intermediate HTML for this component with the rendered HTML of this component
       $(this.origElem).replaceWith(this.containerDiv);
   }


   renderBOPromptAndInput() {
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
        if ( this.num_bits > 16 ){
            alert($.i18n("msg_NC_too_many_bits"));
            return;
        }


        // Generate the two dropdown menus for bitwise operation
        this.containerDiv = document.createElement("div");
        this.containerDiv.id = this.divid;

        this.statementDiv = document.createElement("div");
        this.statementDiv.className = "statement-div";


        // specify the number of bits in the statement
        this.statementNode05 = document.createTextNode("Please do the bitwise operation based on the operator and the number of bits you select.");


        this.statementNode1 = document.createTextNode(" Choose operators: ");

        this.menuNode1 = document.createElement("div");
        // Create the container for the dropdown this.menuNode1
        this.menuNode1.id = 'list1';
        this.menuNode1.className = 'dropdown-check-list';
        this.menuNode1.tabIndex = 100;  // Set tabindex to make the div focusable

        // Build the inner HTML using template literals
        var html =   "<span class='anchor'>Select Operators</span>"+
        "<ul class='items'>"+
        "  <li><input type='checkbox' value='AND' checked/>AND </li>"+
        "  <li><input type='checkbox' value='OR' checked/>OR </li>"+
          "<li><input type='checkbox' value='XOR' checked/>XOR </li>"+
          "<li><input type='checkbox' value='NOT' checked/>NOT </li>"+
          "<li><input type='checkbox' value='Left Shift' />Left Shift </li>"+
          "<li><input type='checkbox' value='Right Shift(Logical)' />Right Shift(Logical) </li>"+
          "<li><input type='checkbox' value='Right Shift(Arithmetic)' />Right Shift(Arithmetic) </li>"+
        "</ul>";

        // Assign the built HTML to innerHTML of the this.menuNode1 container
        this.menuNode1.innerHTML = html;

        // Access the anchor for adding click event
        var anchor = this.menuNode1.getElementsByClassName('anchor')[0];
        anchor.onclick = function() {
            if (this.menuNode1.classList.contains('visible'))
                this.menuNode1.classList.remove('visible');
            else
                this.menuNode1.classList.add('visible');
        }.bind(this);

        this.menuNode1.addEventListener("change",
        function () {
            this.getCheckedValues();
        }.bind(this),
        false);
      
        this.statementNode2 = document.createTextNode(" Select the number of bits: ");

            // change number of bits - menuNode2
        this.menuNode2 = document.createElement("select");
        for (var i = 0; i < this.toOpt.length; i++) {
            var option = document.createElement("option");
            option.value = this.toOpt[i];
            option.text = this.toOpt[i];
            //    if ( i === 1 ) {
            //        option.selected = "selected";
            //    }
            this.menuNode2.appendChild(option);
        }
        this.menuNode2.setAttribute("class", "form form-control selectwidthauto");
        // When the value of menuNode2 is changed and the conversion is valid,
        // generate a new answer.
        this.menuNode2.addEventListener("change",
            function () {
                    var random = this.randomItem;
                    this.getCheckedValues();
                    this.randomItem = random;
                    this.generateNumber();
                    this.clearAnswer();
                    this.generateAnswer();
                    this.checkValidConversion();
                    this.contWrong = 0;
                //    }
            }.bind(this),
            false);

        // render the statement
        this.statementDiv.appendChild(this.statementNode05);
        this.statementDiv.appendChild(document.createElement("br"));
        this.statementDiv.appendChild(document.createElement("br"));
        this.statementDiv.appendChild(this.statementNode2);
        this.statementDiv.appendChild(this.menuNode2);
        this.statementDiv.appendChild(this.statementNode1);
        this.statementDiv.appendChild(this.menuNode1);
        this.statementDiv.appendChild(document.createElement("br"));
        this.containerDiv.appendChild(this.statementDiv);
        this.containerDiv.appendChild(document.createElement("br"));

        // create the node for the prompt
        this.promptDiv = document.createElement("div");
        this.promptDiv.className = "prompt-div";
        this.promptDiv.style.paddingRight = '0px';
            

        // create the node for the number being displayed (three lines)
        this.promptDivTextNode = document.createElement("code");
        this.promptDiv.appendChild(this.promptDivTextNode);
        this.promptDiv.appendChild(document.createElement("br"));
        
        // render the input field
        this.answerDiv = document.createElement("div");
        this.inputNode = document.createElement("input");
        this.inputNode.setAttribute('type', 'text');
        this.inputNode.setAttribute("size", "20");
        this.inputNode.setAttribute("id", this.divid + "_input");
        this.inputNode.className = "form form-control selectwidthauto";
        this.statementNode11 = document.createTextNode("Your answer: ");
        this.answerDiv.appendChild(this.statementNode11);
        this.answerDiv.appendChild(this.inputNode);
        this.containerDiv.appendChild(this.promptDiv);
        this.containerDiv.appendChild(document.createElement("br"));
        this.containerDiv.appendChild(this.answerDiv);


        // prompt is invisible by default
        this.promptDiv.style.visibility = "hidden";
        // this.promptOLDiv.style.visibility = "hidden";


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
        // $(this.containerDiv).find("code").attr("class","code-inline tex2jax_ignore");
        // When a blank is changed mark this component as interacted with.
        // And set a class on the component in case we want to render components that have been used
        // differently
        for (let blank of this.blankArray) {
            $(blank).change(this.recordAnswered.bind(this));
        }
   }

    getCheckedValues(){
        this.checkedValues = [];
        var checkBoxes = document.querySelectorAll('input[type="checkbox"]:checked');
        checkBoxes.forEach(function(checkbox){
            this.checkedValues.push(checkbox.value);
        }.bind(this));

        if (this.checkedValues.length > 0){
            this.getRandomItem(this.checkedValues);
        } else{
            console.log("No checkboxes are checked.");
        }
        console.log("checked values: " + this.checkedValues);
    }

    recordAnswered() {
        this.isAnswered = true;
    }


    renderBOButtons() {
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
        this.generateButton.textContent = "Try Another";
        $(this.generateButton).attr({
            class: "btn btn-success",
            name: "generate a number",
            type: "button",
        });
        // generate a new number for conversion
        this.generateButton.addEventListener(
            "click",
            function () {
                this.clearAnswer();
                this.getCheckedValues();
                if (this.checkedValues.length != 0){
                    this.generateNumber();
                    this.generateAnswer();
                } 
                this.checkValidConversion();
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


    renderBOFeedbackDiv() {
        this.containerDiv.appendChild(document.createElement("br"));
        this.containerDiv.appendChild(this.feedbackDiv);
    }


    // clear the input field
    clearAnswer() {
        this.inputNode.value = "";
        this.feedbackDiv.remove();
    }

    getRandomItem(array){
        if (!array || array.length == 0){
            console.error("The array is empty or undefined.");
            return;
        }
        var index = Math.floor(Math.random() * array.length);
        this.randomItem = array[index];
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

    // generate a random number or two random numbers from 0 to 2^(this.num_bits)-1 based
    // on different operators and set the number to display
    generateNumber() {
        this.num_bits = parseInt(this.menuNode2.value);
        this.target_num = Math.floor(Math.random() * (1 << this.num_bits));
        this.target_num2 = Math.floor(Math.random() * (1 << this.num_bits));
        this.num_shift = Math.floor(Math.random() * (this.num_bits/2)) + 1;
        if (this.target_num === (1 << this.num_bits)) {
            this.target_num --;
        }
        if (this.target_num2 === (1 << this.num_bits)) {
            this.target_num2 --;
        }
        switch (this.randomItem) {
            case "AND":
                this.displayed_num_string = this.toBinary(this.target_num);
                this.displayed_num_string2 = this.toBinary(this.target_num2);
                break;
            case "NOT" :
                this.displayed_num_string = this.toBinary(this.target_num);
                break;
            case "OR" :
                this.displayed_num_string = this.toBinary(this.target_num);
                this.displayed_num_string2 = this.toBinary(this.target_num2);
                break;
            case "XOR" :
                this.displayed_num_string = this.toBinary(this.target_num);
                this.displayed_num_string2 = this.toBinary(this.target_num2);
                break;
            case "Left Shift" :
                this.displayed_num_string = this.toBinary(this.target_num);
                break;
            case "Right Shift(Logical)" :
                this.displayed_num_string = this.toBinary(this.target_num);
                break;
            case "Right Shift(Arithmetic)" :
                this.displayed_num_string = this.toBinary(this.target_num);
                break;
        }
        this.generatePrompt();
    }


   // generate the answer as a string based on the randomly generated number
   generateAnswer() {
       this.hideFeedback();
       this.feedback_msg = "";
       this.inputNode.style.visibility = 'visible';
       this.num_bits = parseInt(this.menuNode2.value);
       switch (this.randomItem) {
           case "AND" :
               this.target_num_string = this.toBinary(this.target_num & this.target_num2);
               break;
           case "NOT" :
               this.target_num_string = this.toBinary((~this.target_num) & ((1 << this.num_bits)-1));
               break;
           case "OR" :
               this.target_num_string = this.toBinary(this.target_num | this.target_num2);
               break;
           case "XOR" :
               this.target_num_string = this.toBinary(this.target_num ^ this.target_num2);
               break;
            case "Left Shift" :
                this.target_num_string = this.toBinary(this.target_num << this.num_shift);
                break;
            case "Right Shift(Logical)" :
                this.target_num_string = this.toBinary(this.target_num >>> this.num_shift);
                break;
            case "Right Shift(Arithmetic)" :
                if (this.toBinary(this.target_num)[0] === "1"){
                    this.target_num_string = ((this.target_num >> this.num_shift) & ((1 << this.num_bits)-1)).toString(2).padStart(this.num_bits, '1');
                }
                else{
                    this.target_num_string = this.toBinary(this.target_num >> this.num_shift);  
                }
                break;
       }
       // update the prompt
       this.generatePrompt();
   }


   // Update the prompt to display
   generatePrompt() {
       this.inputNode.style.visibility = 'visible';
       switch(this.randomItem) {
           case "AND" :
                this.promptDivTextNode.innerHTML = '0b' + this.displayed_num_string + '<br> AND(&) 0b' + this.displayed_num_string2;
                break;
           case "OR" :
                this.promptDivTextNode.innerHTML = '0b' + this.displayed_num_string + '<br> OR(|) 0b' + this.displayed_num_string2;
                break;
           case "XOR" :
                this.promptDivTextNode.innerHTML = '0b' + this.displayed_num_string + '<br> XOR(^) 0b' + this.displayed_num_string2;
                break;
           case "NOT" :
                this.promptDivTextNode.innerHTML = " NOT(~) " + "0b" +  this.displayed_num_string;
                break; 
           case "Left Shift" :
                this.promptDivTextNode.innerHTML = "0b" + this.displayed_num_string + " << " + this.num_shift.toString();
                break;
           case "Right Shift(Arithmetic)" :
                this.promptDivTextNode.innerHTML = "0b" + this.displayed_num_string + " >> " + this.num_shift.toString() + " (Arithmetic)";
                break;
           case "Right Shift(Logical)" :
                this.promptDivTextNode.textContent = "0b" + this.displayed_num_string + " >> " + this.num_shift.toString() + " (Logical)";
                break;           
       }

       // the placeholder tells what the desired input should be like
       var placeholder;
        // placeholder = "your answer (" + this.num_bits.toString() + "-digit binary value)";
        placeholder = this.num_bits.toString() + "-digit binary value";
        this.inputNode.setAttribute("placeholder", placeholder);
        this.inputNode.setAttribute("size", placeholder.length);
        this.inputNode.setAttribute("maxlength", this.num_bits);
        this.inputNode.setAttribute('style', 'width: 50ptx;');
   }

   // check if the conversion is valid 
   checkValidConversion() {
        this.hideFeedback();
        this.valid_conversion = true;
        if (this.checkedValues.length == 0){
            this.promptOLDiv.style.visibility = "hidden";
            this.promptDiv.style.visibility = "hidden";
            return;
        }
        this.promptDiv.style.visibility = "visible";
   }
  
   // check if the answer is correct
   checkCurrentAnswer() {
       // the answer is correct if it is the same as the string this.target_num_string
       var input_value = this.inputNode.value.toLowerCase();
       if ( input_value == "" ) {
           this.feedback_msg = ($.i18n("msg_no_answer"));
           this.correct = false;
       } 
       else if ( input_value != this.target_num_string ) {
           this.feedback_msg = ($.i18n("msg_NC_incorrect"));
           this.contWrong ++;
           this.correct = false;
            if (this.contWrong >= 3){
                switch(this.randomItem) {
                    case "AND" :
                        this.feedback_msg += ("\n" + $.i18n("msg_hint_and"));
                        break;
                    case "OR" :
                        this.feedback_msg += ("\n" + $.i18n("msg_hint_or"));
                        break;
                    case "XOR" :
                        this.feedback_msg += ("\n" + $.i18n("msg_hint_xor"));
                        break;
                    case "NOT" :
                        this.feedback_msg += ("\n" + $.i18n("msg_hint_not"));
                        break;
                    case "Left Shift" :
                        this.feedback_msg += ("\n" + $.i18n("msg_hint_shift"));
                        break;
                    case "Right Shift(Logical)" :
                        this.feedback_msg += ("\n" + $.i18n("msg_hint_shift"));
                        break;
                    case "Right Shift(Arithmetic)" :
                        this.feedback_msg += ("\n" + $.i18n("msg_hint_shift"));
                        break;
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
   $("[data-component=binops]").each(function (index) {
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


