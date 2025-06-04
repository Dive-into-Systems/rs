// *********
// binarith.js
// *********
/*
 * - This file contains the JS for the Runestone bitwise-arithetic component.
 * - Inputs are read from this.menuNode2 (set number of bits, 4/6/8), this.menuNode1 (dropdown checklist of
 *   bitwise operators), and this.inputNode (text box for answer). 
 * - Every time the user clicks on "generate another question", the component reads if there is any changes
 *   to the aforementioned input readers and make corresponding actions, such as generatePrompt and generateAnswer.
 * - The component randomizes values by Math library based on the number of bits in the generateNumber function.
 * - The component validates answer by first generating answer in generateAnswer function and compare the
 *   calculated asnwer with the user input answer.
 * TODO:
 *  - need to implement msg_hint_addition
*/
"use strict";

import RunestoneBase from "../../common/js/runestonebase.js";
import { nanoid } from 'nanoid/non-secure';
import "./nc-i18n.en.js"; //file that includes msg messages, usually appear in feedback
import "../css/binops.css"; //css file that describes formatting of the component
import { Pass } from "codemirror";

export var BAList = {}; // Object containing all instances of NC that aren't a child of a timed assessment.


// BitwiseArithmetic constructor
export default class BA extends RunestoneBase {
   constructor(opts) {
        super(opts);
        var orig = opts.orig; // entire <p> element
        this.useRunestoneServices = opts.useRunestoneServices;
        this.origElem = orig;
        this.divid = orig.id;

        // Default configuration settings
        this.correctpt1 = null;
        this.correctpt2 = true;
        this.num_bits = 4;
        this.fromOpt = ["ADDITION", "SUBTRACTION"];
        this.toOpt = ["4", "6", "8"];

        // Fields for logging data
        this.componentId = "4.4";
        this.questionId = 1;
        this.contWrong = 0;
        this.userId = this.getUserId();
        
        // Behaviors when page is loaded
        this.createBAElement();
        this.clearAnswer();
        this.getCheckedValues();

        // Only generate new prompt when there are items selected
        if (this.checkedValues.length != 0){
            this.generateNumber();
            this.generateAnswer();
        } 
        this.checkValidConversion();

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
    
    debugFunc(text){
        const de = document.createElement("div");
        this.containerDiv.append(de);
        de.innerHTML = (text);
    }

    // Create the NC Element
    createBAElement() {
        this.renderBAPromptAndInput();
        this.renderBAButtons();
        this.renderBAFeedbackDiv();
        // replaces the intermediate HTML for this component with the rendered HTML of this component
        $(this.origElem).replaceWith(this.containerDiv);
    }

   // Generate the layout of the prompt and input
   renderBAPromptAndInput() {
        // Create the parent div which contains everything
        this.containerDiv = document.createElement("div");
        this.containerDiv.id = this.divid;

        // Create the statement div
        this.statementDiv = document.createElement("div");
        this.statementDiv.className = "statement-div";
        
        this.instruction = document.createElement("div");
        this.instruction.innerHTML = "<span style='font-weight:bold'><u>Instructions</u></span>: " +
            "Please do the bitwise arithmetic operation based on the operator and the number of bits you select.";
        this.instruction.style.padding = "10px";

        this.configHelperText = document.createElement("div");
        this.configHelperText.innerHTML = "<span style='font-weight:bold'><u>Configure question</u></span>:";

        this.statementNode1 = document.createTextNode(" Choose operators: ");

        // Create the container for the dropdown checkbox list
        this.menuNode1 = document.createElement("div");
        this.menuNode1.id = 'list1';
        this.menuNode1.className = 'dropdown-check-list';
        this.menuNode1.tabIndex = 100;  // Set tabindex to make the div focusable

        // Build the inner HTML using template literals
        // Inner HTML defines the items in the dropdown
        var html =   "<span class='anchor'>Select Operators</span>"+
        "<ul class='items'>"+
        "  <li><input type='checkbox' value='ADDITION' checked/>ADDITION </li>"+ //pre checked item
        "  <li><input type='checkbox' value='SUBTRACTION' checked/>SUBTRACTION </li>"+
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

        // Event lister that shrinks the dropdown whenever clicking outside of it
        document.addEventListener('click', function (e) {
            if (!this.menuNode1.contains(e.target) && this.menuNode1.classList.contains('visible')) {
                this.menuNode1.classList.remove('visible');
            }
        }.bind(this), false);

        // addEventListener define functions to be executed when menuNode1 has any changes
        this.menuNode1.addEventListener("change",
        function () {
            this.getCheckedValues();
        }.bind(this),
        false);
      
        this.statementNode2 = document.createTextNode(" Select the number of bits: ");

        // Assign the items in the menuNode2
        this.menuNode2 = document.createElement("select");
        for (var i = 0; i < this.toOpt.length; i++) {
            var option = document.createElement("option");
            option.value = this.toOpt[i];
            option.text = this.toOpt[i];
            this.menuNode2.appendChild(option);
        }

        // Assign the class of menuNode2. form-control is a class inherited from pretext
        this.menuNode2.setAttribute("class", "form form-control selectwidthauto");
        // When the value of menuNode2 is changed, do these...
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
            }.bind(this),
            false);

        // Render the statement
        this.containerDiv.append(this.instruction);
        this.configDiv = document.createElement("div");
        this.configDiv.appendChild(this.configHelperText);
        this.configDiv.appendChild(this.statementNode2);
        this.configDiv.appendChild(this.menuNode2);
        this.configDiv.appendChild(this.statementNode1);
        this.configDiv.appendChild(this.menuNode1);

        // Append configDiv to statementDiv
        this.statementDiv.appendChild(this.configDiv);
        this.containerDiv.appendChild(this.statementDiv);
        this.containerDiv.appendChild(document.createElement("br"));
        // create the div node for the prompt
        this.promptDiv = document.createElement("div");
        this.promptDiv.className = "prompt-div";
        this.promptDiv.style.paddingRight = '0px';

        // create the node for the number being displayed
        this.promptDivTextNode = document.createElement("code");
        // this.promptDivTextNode.className = "binops-inline code";
        this.promptDiv.appendChild(this.promptDivTextNode);
        this.promptDiv.appendChild(document.createElement("br"));
        
        // render the input field
        this.answerDiv = document.createElement("div");
        this.inputNode = document.createElement("input");
        this.inputNode.setAttribute('type', 'text');
        this.inputNode.setAttribute("size", "20");
        this.inputNode.setAttribute("id", this.divid + "_input");
        this.inputNode.className = "form form-control selectwidthauto";
        this.statementNode11 = document.createTextNode("Your answer (include carry-out): ");
        this.answerDiv.appendChild(this.statementNode11);
        this.answerDiv.appendChild(this.inputNode);
        // this.containerDiv.appendChild(document.createElement("br"));
        this.containerDiv.appendChild(this.promptDiv);
        this.containerDiv.appendChild(document.createElement("br"));
        this.containerDiv.appendChild(this.answerDiv);

        // prompt is invisible by default
        this.promptDiv.style.visibility = "hidden";

        this.renderSecondSection();

        // create the feedback div
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
        // When a blank is changed mark this component as interacted with.
        // And set a class on the component in case we want to render components that have been used
        // differently
        for (let blank of this.blankArray) {
            $(blank).change(this.recordAnswered.bind(this));
        }
   }

    // Get the list of operators being checked
    getCheckedValues(){
        this.checkedValues = [];
        var checkBoxes = document.querySelectorAll('input[type="checkbox"]:checked');
        checkBoxes.forEach(function(checkbox){
            this.checkedValues.push(checkbox.value);
        }.bind(this));
        // if there is item being checked, randomly select an operator
        if (this.checkedValues.length > 0){
            this.getRandomItem(this.checkedValues);
        }
    }

    // Keep track whether the user answer the question
    recordAnswered() {
        this.isAnswered = true;
    }

    // Create the buttons
    renderBAButtons() {
        // "check answer" button
        this.submitButton = document.createElement("button");
        this.submitButton.textContent = $.i18n("msg_NC_check_me");
        $(this.submitButton).attr({
            class: "btn btn-success",
            name: "do answer",
            type: "button",
        });
        // check the answer
        this.submitButton.addEventListener(
            "click",
            function () {
                this.checkValidConversion();
                if ( this.valid_conversion ) {
                    this.checkCurrentAnswer();
                    this.checkCurrentAnswerPt2();
                    this.logCurrentAnswer();
                    this.correctpt2 = true;

                }
            }.bind(this),
            false
        );

        // "try another" button
        this.generateButton = document.createElement("button");
        this.generateButton.textContent = $.i18n("msg_NC_generate_a_number");
        $(this.generateButton).attr({
            class: "btn btn-success",
            name: "generate a number",
            type: "button",
        });
        // Generate a new prompt
        this.generateButton.addEventListener(
            "click",
            function () {
                this.clearAnswer();
                this.getCheckedValues();
                // only generate new prompt when there is item selected
                if (this.checkedValues.length != 0){
                    this.generateNumber();
                    this.generateAnswer();
                } 
                this.checkValidConversion();
                this.sendData(3);
            }.bind(this),
            false
        );

        // Add the buttons in the container
        this.containerDiv.appendChild(document.createElement("br"));
        this.containerDiv.appendChild(this.generateButton);
        this.containerDiv.appendChild(this.submitButton);

        // Check answer when pressing "Enter"
        this.inputNode.addEventListener(
            "keypress",
            function(event) {
            if (event.key === "Enter") {
                    this.submitButton.click();
                }
            }.bind(this), false
            );
   }

    // Add the feedback in the container
    renderBAFeedbackDiv() {
        this.containerDiv.appendChild(document.createElement("br"));
        this.containerDiv.appendChild(this.feedbackDiv);
    }

    renderSecondSection(){

        this.containerDiv.append(document.createElement("br"));

        this.instruction2 = document.createElement("div");
        this.instruction2.innerHTML = "<span style='font-weight:bold'><u>Instructions</u></span>: " +
            "Convert the answer to unsigned and signed integers. Then, indicate whether or not there is overflow.";
        //We got rid of the padding for styling purposes
        this.instruction2.style.padding = "0px";

        this.containerDiv.append(this.instruction2)


        //This sets up the input for the unsigned decimal input
        this.answerDiv2 = document.createElement("div");
        this.USInput = document.createElement("input");
        this.USInput.setAttribute('type', 'text');
        this.USInput.setAttribute("size", "20");
        this.USInput.setAttribute("id", this.divid + "_input");
        this.USInput.className = "form form-control selectwidthauto";
        this.statementNode11US = document.createTextNode("Unsigned Decimal:");
        this.answerDiv2.appendChild(this.statementNode11US);
        this.answerDiv2.appendChild(this.USInput);

        var placeholder;
        placeholder = "Unsigned Decimal:";
        this.USInput.setAttribute("placeholder", placeholder);
        this.USInput.setAttribute("size", placeholder.length + 1);
        this.USInput.setAttribute("maxlength", this.num_bits + 5);
        this.USInput.setAttribute('style', 'width: 50ptx;');

        //This sets up the input for the decimal input
        this.SInput = document.createElement("input");
        this.SInput.setAttribute('type', 'text');
        this.SInput.setAttribute("size", "20");
        this.SInput.setAttribute("id", this.divid + "_input");
        this.SInput.className = "form form-control selectwidthauto";
        this.statementNode11S = document.createTextNode("Signed Decimal:");

        this.containerDiv.append(document.createElement("br"));

        this.answerDiv2.appendChild(this.statementNode11S);
        this.answerDiv2.appendChild(this.SInput);

        var placeholder;
        placeholder = "Signed Decimal:";
        this.SInput.setAttribute("placeholder", placeholder);
        this.SInput.setAttribute("size", placeholder.length + 1);
        this.SInput.setAttribute("maxlength", this.num_bits + 5);
        this.SInput.setAttribute('style', 'width: 50ptx;');



        //Adding the Yes/No radio buttons for overflow
        this.answerDiv2.append(document.createElement("br"));

        
        this.instruction3 = document.createElement("div");
        this.instruction3.innerHTML = "Is there overflow?";
        //We got rid of the padding for styling purposes
        this.instruction3.style.padding = "0px";

        this.answerDiv2.append(this.instruction3)

        const fieldset = document.createElement("FIELDSET")
        const legend1 = document.createElement("LEGEND")
        legend1.textContent = "Select a signed value"

        this.radioButtons = [];
        const yesBtnS = document.createElement("INPUT");
        yesBtnS.setAttribute("type", "radio");
        yesBtnS.setAttribute("id", "yesBtnS")
        yesBtnS.setAttribute("name", "overflowS")
        const yesLabelS = document.createElement("LABEL");
        yesLabelS.textContent = "Yes"
        yesLabelS.setAttribute("for", "yesBtnS")

        const noBtnS = document.createElement("INPUT");
        noBtnS.setAttribute("type", "radio");
        noBtnS.setAttribute("id", "noBtnS")
        noBtnS.setAttribute("name", "overflowS")
        noBtnS.setAttribute("Checked", "overflow")

        const noLabelS = document.createElement("LABEL");
        noLabelS.textContent = "No"
        noLabelS.setAttribute("for", "noBtnS")

        fieldset.append(legend1)
        fieldset.append(yesBtnS);
        fieldset.append(yesLabelS);

        fieldset.append(noBtnS);
        fieldset.append(noLabelS);

        //bind 
        this.yesBtnS = yesBtnS;
        this.noBtnS = noBtnS;

        this.answerDiv2.append(fieldset)
        this.answerDiv2.append(document.createElement("br"))

        ///////////////////////Again for unsigned


        this.answerDiv2.append(document.createElement("br"));


        const fieldset2 = document.createElement("FIELDSET")
        const legend2 = document.createElement("LEGEND")
        legend2.textContent = "Select an unsigned value"

        this.radioButtons = [];
        const yesBtnU = document.createElement("INPUT");
        yesBtnU.setAttribute("type", "radio");
        yesBtnU.setAttribute("id", "yesBtnU")
        yesBtnU.setAttribute("name", "overflowU")
        const yesLabelU = document.createElement("LABEL");
        yesLabelU.textContent = "Yes"
        yesLabelU.setAttribute("for", "yesBtnU")

        const noBtnU = document.createElement("INPUT");
        noBtnU.setAttribute("type", "radio");
        noBtnU.setAttribute("id", "noBtnU")
        noBtnU.setAttribute("name", "overflowU")
        noBtnU.setAttribute("Checked", "overflow")

        const noLabelU = document.createElement("LABEL");
        noLabelU.textContent = "No"
        noLabelU.setAttribute("for", "noBtnU")

        fieldset.append(legend2)
        fieldset.append(yesBtnU);
        fieldset.append(yesLabelU);

        fieldset.append(noBtnU);
        fieldset.append(noLabelU);

        //bind 
        this.yesBtnU = yesBtnU;
        this.noBtnU = noBtnU;

        this.answerDiv2.append(fieldset2)

        this.containerDiv.append(this.answerDiv2);

    }

    // clear the input field
    clearAnswer() {
        this.inputNode.value = "";
        this.feedbackDiv.remove();
        if(this.feedbackDiv2 != undefined && this.feedbackDiv2 == null){
            this.feedbackDiv2.remove();
        }
    }

    // Select an item among the operators selected
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
    // toBinary(num) {
    //     var str = num.toString(2);
    //     if (str.length < this.num_bits) {
    //         var leading_zeros = "";
    //         for ( var i = str.length ; i < this.num_bits; i ++ ) {
    //             leading_zeros += "0";
    //         }
    //         str = leading_zeros + str;
    //     }
    //     if (str.length > this.num_bits){
    //             str = str.slice(str.length-this.num_bits);
    //     }
    //     return str;
    // }
    toBinary(num, width) {
        if (typeof width === "undefined") {
            width = this.num_bits;
        }
        let str = num.toString(2);
        if (str.length < width) {
            str = str.padStart(width, "0");
        }
        return str;
    }
    
    toSignedDecimal(){
        // let total = 0;
        // total = -Number(this.target_num_string[0]) * 2^(this.num_bits);
        // for(let i = 0; i < this.num_bits; i++){
        //     total += Number(this.target_num_string[i]) * 2^(this.num_bits-i);
        // }
        // return total;
        let new_binary;
        if(this.target_num_string.length > this.num_bits){
            new_binary = this.target_num_string.slice(2);
        }
        else{
            new_binary = this.target_num_string.slice(1, this.num_bits);
        }
        const parsedInt = parseInt(new_binary, 2)

        
        let ans = parseInt(new_binary, 2);
        if(this.target_num_string.length > this.num_bits){
            ans -= Number(this.target_num_string[1])*2**(this.num_bits-1)
        }
        else{
            ans -= Number(this.target_num_string[0])*2**(this.num_bits-1)
        }

        return ans;


    }

    
    

    // generate a random number or two random numbers from 0 to 2^(this.num_bits)-1 based
    // on different operators and set the number to display
    generateNumber() {
        this.num_bits = parseInt(this.menuNode2.value);
        this.target_num = Math.floor(Math.random() * (1 << this.num_bits));
        this.target_num2 = Math.floor(Math.random() * (1 << this.num_bits));
        // 1<=this.num_shift<=half of this.num_bits
        this.num_shift = Math.floor(Math.random() * (this.num_bits/2)) + 1;
        if (this.target_num === (1 << this.num_bits)) {
            this.target_num --;
        }
        if (this.target_num2 === (1 << this.num_bits)) {
            this.target_num2 --;
        }
        switch (this.randomItem) {
            case "ADDITION":
                this.displayed_num_string = this.toBinary(this.target_num, this.num_bits);
                this.displayed_num_string2 = this.toBinary(this.target_num2, this.num_bits);
                break;
            case "SUBTRACTION" :
                this.displayed_num_string = this.toBinary(this.target_num, this.num_bits);
                this.displayed_num_string2 = this.toBinary(this.target_num2, this.num_bits);
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
            case "ADDITION" :
                let sum = this.target_num + this.target_num2;
                this.target_num_string = this.toBinary(sum);
                break;
            case "SUBTRACTION":
                let diff = this.target_num - this.target_num2;
                if (diff < 0) {
                    diff = (1 << (this.num_bits + 1)) + diff; // allow extra bit for borrow
                }
                this.target_num_string = this.toBinary(diff);                
                break;
       }
       // update the prompt
       this.generatePrompt();
   }

   // Update the prompt to display
   // Use innerHTML to deal with prompts of different number of lines
   generatePrompt() {
       this.inputNode.style.visibility = 'visible';
       switch(this.randomItem) {
           case "ADDITION" :
                this.promptDivTextNode.innerHTML = '0b' + this.displayed_num_string + '<br> + 0b' + this.displayed_num_string2;
                break;
           case "SUBTRACTION" :
                this.promptDivTextNode.innerHTML = '0b' + this.displayed_num_string + '<br> - 0b' + this.displayed_num_string2;
                break;       
       }

       // the placeholder tells what the desired input should be like
        var placeholder;
            placeholder = "binary value";
            this.inputNode.setAttribute("placeholder", placeholder);
            this.inputNode.setAttribute("size", placeholder.length + 1);
            this.inputNode.setAttribute("maxlength", this.num_bits + 2);
            this.inputNode.setAttribute('style', 'width: 50ptx;');
   }

   // check if the prompt is valid 
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
           this.correctpt1 = false;
       } 
       else if ( input_value != this.target_num_string ) {
           this.feedback_msg = ($.i18n("msg_NC_incorrect"));
           this.contWrong ++;
           this.correctpt1 = false;
           // Give the user a hint if number of wrong attemps reaches 3
            if (this.contWrong >= 3){
                switch(this.randomItem) {
                    case "ADDITION" :
                        this.feedback_msg += ("\n" + $.i18n("msg_hint_addition"));
                        break;
                    case "SUBTRACTION" :
                        this.feedback_msg += ("\n" + $.i18n("msg_hint_subtraction"));
                        break;
                }
            }          
       } else {
            this.feedback_msg = ($.i18n("msg_NC_correct"));
            this.correctpt1 = true;
            this.contWrong = 0;
       }
       if (this.correctpt1 === true) { this.sendData(1); } else { this.sendData(2); }
   }


   displayCorrectAnswerUnsigned(){
    this.feedback_msg2 += ($.i18n("Unsigned Correct \n"));
    this.contWrong = 0;
   }
   displayIncorrectAnswerUnsigned(){
    this.feedback_msg2 += ($.i18n("Unsigned incorrect \n"));
    this.contWrong ++;
    this.conrrectpt2 = false;
   }
   displayCorrectAnswerSigned(){
    this.feedback_msg2 += ($.i18n("Signed correct \n"));
    this.contWrong = 0;
   }
   displayIncorrectAnswerSigned(){
    this.feedback_msg2 += ($.i18n("Signed incorrect \n"));
    this.contWrong ++;
    this.conrrectpt2 = false;
   }

   checkCurrentAnswerPt2(){
    const USValue = (this.USInput.value.toLocaleLowerCase());
    const SValue = (this.SInput.value.toLowerCase())
    const ans = parseInt(this.target_num_string, 2);
    const yesBtnValueS = this.yesBtnS.checked;
    const noBtnValueS = this.noBtnS.checked;
    const yesBtnValueU = this.yesBtnU.checked;
    const noBtnValueU = this.noBtnU.checked;

    
    // const debugP = document.createElement("div")
    // this.containerDiv.append(debugP);
    // debugP.innerHTML = (`${USValue},  ${SValue}, ${yesBtnValue}, ${noBtnValue}`);


    if(USValue == ""){
        this.feedback_msg2 = ($.i18n("msg_no_answer"));
        this.correctpt2 = false;
    }
    else if(ans != USValue){
        this.feedback_msg2 = ($.i18n("msg_NC_incorrect"));
        this.contWrong ++;
        this.conrrectpt2 = false;
    }
    else{
        this.feedback_msg2 = ($.i18n("msg_NC_correct"));
        this.contWrong = 0;
    }


    //Check the signed value
    if(SValue == ""){
        this.feedback_msg2 = ($.i18n("msg_no_answer"));
        this.correctpt2 = false;
    }
    else if(this.toSignedDecimal() != SValue){
        this.feedback_msg2 = ($.i18n("msg_NC_incorrect"));
        this.contWrong ++;
        this.conrrectpt2 = false;
    }
    else{
        this.feedback_msg2 = ($.i18n("msg_NC_correct"));
        this.contWrong = 0;
    }

    ///find out if there's unsigned overflow
    
    //grab first digit of target answer
    let carryOut;
    if(this.target_num_string.length > this.num_bits){
        carryOut = this.target_num_string[0]
    }
    else{
        carryOut = 0
    }
    


    if(this.randomItem == "ADDITION" && carryOut == 1 && yesBtnValueU == true && noBtnValueU == false){
        this.displayCorrectAnswerUnsigned()
    }
    else if(this.randomItem == "ADDITION" && carryOut == 0 && yesBtnValueU == false && noBtnValueU == true){
        this.displayCorrectAnswerUnsigned()
    }
    else if(this.randomItem == "SUBTRACTION" && carryOut == 0 &&  yesBtnValueU == true && noBtnValueU == false){
        this.displayCorrectAnswerUnsigned();
    }
    else if(this.randomItem == "SUBTRACTION" && carryOut == 1 &&  yesBtnValueU == false && noBtnValueU == true){
        this.displayCorrectAnswerUnsigned();
    }
    else{
        this.displayIncorrectAnswerUnsigned();
    }

    //find out if there's signed overflow
    const largestNegNum = -(2**(this.num_bits-1));
    const largestPosNum = 2**(this.num_bits-1)-1;
    const decimalAns = this.toSignedDecimal()
    const overflow = (decimalAns < largestNegNum || decimalAns> largestPosNum);

    this.debugFunc(`${overflow},  ${largestNegNum}, ${largestPosNum}, ${yesBtnValueS}, ${noBtnValueS}`)
    if(overflow && yesBtnValueS && !noBtnValueS){
        this.displayCorrectAnswerSigned();
    }
    else if(!overflow && !yesBtnValueS && noBtnValueS){
        this.displayCorrectAnswerSigned();
    }
    else{
        this.displayIncorrectAnswerSigned();
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
            correct: this.correctpt1 ? "T" : "F",
            div_id: this.divid,
        };
        if (typeof sid !== "undefined") {
            data.sid = sid;
            feedback = false;
        }
        // render the feedback
        this.renderFeedback();
        this.renderFeedback2();
        return data;
        
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
                    numBits : `${this.num_bits}`,
                    checkedOperators : `${this.checkedValues}`,
                    usedOperator : `${this.randomItem}`
                },
                prompt: {
                    displayedPrompt: `${this.promptDivTextNode.textContent}`,
                },
                eval: {
                    correctAnswer: `${this.target_num_string}`,
                    userAnswer : this.inputNode ? this.inputNode.value.toLowerCase() : null
                }
            }
        }
        else { bundle.details = null }

        this.logData(bundle);
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
  
   // Make the feedback hidden
   hideFeedback() {
       this.feedbackDiv.remove();
       if(this.feedbackDiv2 != undefined && this.feedbackDiv2 != null){
        this.feedbackDiv2.remove();
       }
   }

   // Make the feedback visible
   displayFeedback() {
       this.feedbackDiv.style.visibility = "visible";
   }
   displayFeedback2() {
    this.feedbackDiv2.style.visibility = "visible";
    }
   // Update the feedback message
   renderFeedback() {
       this.feedbackDiv = document.createElement("div");
       this.feedbackDiv.setAttribute("id", this.divid + "_feedback");
       this.containerDiv.appendChild(this.feedbackDiv);

        // only the feedback message needs to display
        var feedback_html = "<dev>" + this.feedback_msg + "</dev>";
        if (this.correctpt1) {
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
   renderFeedback2() {
    this.feedbackDiv2 = document.createElement("div");
    this.feedbackDiv2.setAttribute("id", this.divid + "_feedback");
    this.containerDiv.appendChild(this.feedbackDiv2);

     // only the feedback message needs to display
     var feedback_html = "<dev>" + this.feedback_msg2 + "</dev>";
     if (this.correctpt2) {
         $(this.feedbackDiv2).attr("class", "alert alert-info");
     } else {
         $(this.feedbackDiv2).attr("class", "alert alert-danger");
     }
   
     this.feedbackDiv2.innerHTML = feedback_html;
     this.displayFeedback2();
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
    $("[data-component=binarith]").each(function (index) {
        var opts = {
            orig: this,
            useRunestoneServices: eBookConfig.useRunestoneServices,
        };
        if ($(this).closest("[data-component=timedAssessment]").length == 0) {
            // If this element exists within a timed component, don't render it here
            try {
                BAList[this.id] = new BA(opts);
            } catch (err) {
                console.log(
                    `Error rendering Bitwise Operation Problem ${this.id}
                        Details: ${err}`
                );
            }
        }
    });
});


