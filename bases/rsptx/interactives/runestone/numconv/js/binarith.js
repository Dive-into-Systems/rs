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
import {MinSelectBox} from "../../../utils/MinSelectBox.js";



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
        //changed correct pt2 and pt2 to flags

        //THIS ENABLES UNIT TESTS
        this.runUnitTest = false;
        this.runUnitTestLog = false;
        

        this.correctpt1 = true;
        this.correctpt2 = true;
        this.num_bits = 4;
        this.fromOpt = ["ADDITION", "SUBTRACTION"];
        this.toOpt = ["4", "6", "8"];

        this.windowOpen = false;
        this.setWindowOpen = (val) => this.windowOpen = val
        this.getWindowOpen = () => (this.windowOpen)

        // Fields for logging data
        this.componentId = "4.4";
        this.questionId = 1;
        this.contWrong = 0;
        this.userId = this.getUserId();
        
        // Behaviors when page is loaded
        this.createBAElement();
        this.clearAnswer();
        this.getCheckedValues();


        //Unit Test debug values
        this.logUnitTestInput1 = 0;
        this.logUnitTestInput2 = 0;
        this.UTbinaryAnswer;
        this.UTcarryOut = 0;
        this.UTsignedDecimalAnswer;
        this.UTunsignedDecimalAnswer;
        this.UTunsignedOverflow;
        this.UTsignedOverflow;
        this.resultLog = ""
        this.unitTestRandomItem = "ADDITION"

        //logging data variables
        this.sOfAnswer
        this.usOfAnswer
        


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
        
        const addBox = this.containerDiv.getElementsByClassName("addBox")
        const subBox = this.containerDiv.getElementsByClassName("subBox")


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
            () => {
                this.generateButton.click();

            },
            false);

        this.clarification = document.createElement("div");
        this.clarification.innerHTML = `<span style='font-weight:bold'><u>This is a two part exercise.</u></span> After correctly completing Part 1, you will be able to view and complete Part 2.`
        this.clarification.appendChild(document.createElement("br"))
        this.instruction = document.createElement("div");
        this.instruction.innerHTML = `<span style='font-weight:bold'><u>Instructions (Part 1)</u></span>: Perform the bitwise arithmetic operation and input your answer as a binary number in the boxes below.  The carry out field accepts one bit, and the result field accepts a ${this.menuNode2.value}-bit number.`;

        this.configHelperText = document.createElement("div");
        this.configHelperText.innerHTML = "<span style='font-weight:bold'><u>Configure question</u></span>:";

        this.statementNode1 = document.createTextNode(" Choose operators: ");

        // Create the container for the dropdown checkbox list
        // this.menuNode1 = document.createElement("div");
        // this.menuNode1.id = 'list1';
        // this.menuNode1.className = 'dropdown-check-list';
        // this.menuNode1.tabIndex = 100;  // Set tabindex to make the div focusable

        // // Build the inner HTML using template literals
        // // Inner HTML defines the items in the dropdown
        // var html =   "<span class='anchor'>Select Operators</span>"+
        // "<ul class='items'>"+
        // "  <li><input class='addBox' type='checkbox' value='ADDITION' checked/>ADDITION </li>"+ //pre checked item
        // "  <li><input class='subBox' type='checkbox' value='SUBTRACTION' checked/>SUBTRACTION </li>"+
        // "</ul>";

        // this.pSpan = document.createElement("span");
        // this.pSpan.className = "anchor"
        // this.pSpan.textContent = "Select Operators"
        // this.operationUl = document.createElement("ul")
        // this.operationUl.className = "items"
        // this.addLi = document.createElement("li")
        // this.addLi.className = "addBox"
        // this.addLi.type = "checkbox"
        // this.addLi.value = "ADDITION"
        // this.addLi.checked = true;
        // this.addLi.textContent = "ADDITION"
        // this.subLi = document.createElement("li")
        // this.subLi.className = "subBox"
        // this.subLi.type = "checkbox"
        // this.subLi.value = "SUBTRACTION"
        // this.subLi.checked = false;
        // this.subLi.textContent = "SUBTRACTION"
        // this.operationUl.append(this.addLi);
        // this.operationUl.append(this.subLi);
        // this.pSpan.append(this.operationUl);
        // this.menuNode1.append(this.pSpan)

        
        // Assign the built HTML to innerHTML of the this.menuNode1 container
        // this.menuNode1.innerHTML = html;
       
        // this.addOrSubChecked = [true, true];


        // // Access the anchor for adding click event
        // var anchor = this.menuNode1.getElementsByClassName('anchor')[0];
        // anchor.onclick = function() {
        //     if (this.menuNode1.classList.contains('visible'))
        //         this.menuNode1.classList.remove('visible');
        //     else
        //         this.menuNode1.classList.add('visible');
        // }.bind(this);

        // // Event lister that shrinks the dropdown whenever clicking outside of it
        // document.addEventListener('click', function (e) {
        //     if (!this.menuNode1.contains(e.target) && this.menuNode1.classList.contains('visible')) {
        //         this.menuNode1.classList.remove('visible');
        //     }
        // }.bind(this), false);

        // // addEventListener define functions to be executed when menuNode1 has any changes
        // this.menuNode1.addEventListener("change",
        // function () {
        //     this.getCheckedValues();
        // }.bind(this),
        // false);
      
        this.statementNode2 = document.createTextNode(" Select the number of bits: ");

        // Assign the items in the menuNode2
        

        // Render the statement
        this.containerDiv.append(this.clarification)
        this.containerDiv.append(this.instruction);
        this.configDiv = document.createElement("div");
        this.configDiv.appendChild(this.configHelperText);
        this.configDiv.appendChild(this.statementNode2);


        this.configDiv.appendChild(this.menuNode2);
        this.configDiv.appendChild(this.statementNode1);
        // this.configDiv.appendChild(this.menuNode1);




        // Append configDiv to statementDiv
        this.statementDiv.appendChild(this.configDiv);
        this.containerDiv.appendChild(this.statementDiv);
        this.containerDiv.appendChild(document.createElement("br"));
        // create the div node for the prompt
        this.promptDiv = document.createElement("div");
        this.promptDiv.className = "prompt-divBA";
        this.promptDiv.style.paddingRight = '0px';

        // create the node for the number being displayed
        this.promptDivTextNode = document.createElement("code");
        this.promptDivTextNode.style = "margin:auto"
        // this.promptDivTextNode.className = "binops-inline code";
        this.promptDiv.appendChild(document.createElement("p"))
        this.promptDiv.appendChild(this.promptDivTextNode);
        this.promptDiv.appendChild(document.createElement("br"));
        
        // render the input field
        this.answerDiv = document.createElement("div");
        this.nodesDiv = document.createElement("div");
        this.inputNode = document.createElement("input");
        this.inputNode.style = "margin:auto; font-size: 90%; width:50%; margin-left:12%"
        this.inputNode.setAttribute('type', 'text');
        this.inputNode.setAttribute("size", "5");
        this.inputNode.setAttribute("id", this.divid + "_input");
        this.inputNode.className = "form form-control";


        this.inputNode2 = document.createElement("input");
        this.inputNode2.style = "margin: auto; font-size: 89%; width: 50%; visibility: visible;margin-left: 55%;"
        this.inputNode2.setAttribute('type', 'text');
        this.inputNode2.setAttribute("size", "20");
        this.inputNode2.setAttribute("id", this.divid + "_input");
        this.inputNode2.className = "form form-control";

        this.nodesDiv.appendChild(this.inputNode2);
        this.nodesDiv.appendChild(this.inputNode);

        // this.containerDiv.appendChild(document.createElement("br"));
        this.containerDiv.appendChild(this.promptDiv);
        this.containerDiv.appendChild(document.createElement("br"));

        this.nodesDiv.className = "firstquestion"
        this.answerDiv.append(this.nodesDiv);
        this.containerDiv.appendChild(this.answerDiv);

        // prompt is invisible by default
        this.promptDiv.style.visibility = "hidden";


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

    renderUnitTestButton(){
        if(this.runUnitTest){
        this.UTButton = document.createElement("button")
        this.UTRunButton = document.createElement("button")
        this.UTButton.textContent = "Run Unit Tests"
        this.UTRunButton.textContent = "Run Unit Tests and Log answers"
        this.containerDiv.appendChild(this.UTButton);
        this.containerDiv.append(this.UTRunButton)

        this.UT01 = document.createElement("input");
        this.UT01.textContent = "First Input"
        this.UT01.placeholder = "First Operand"
        this.UT02 = document.createElement("input")
        this.UT02.textContent = "Second Input"
        this.UT02.placeholder = "Second Input"

        this.containerDiv.appendChild(this.UT01);
        this.containerDiv.appendChild(this.UT02);

        this.UTButton.addEventListener("click", ()=>this.unitTest())
        this.UTRunButton.addEventListener("click", ()=>this.unitTestAndLog())
        }

    }

    clearUnitTestButton(){
        if(this.runUnitTest){
            this.UTButton.remove();
            this.UTRunButton.remove()
            this.UT01.remove();
            this.UT02.remove();
        }
    }


    inputNodeEnterFunc = (e) => {
        if(e.repeat){
            return
        }

        if (e.key === "Enter") {
                this.submitButton.click();
                console.log("enter key up submit")
            }
        
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
                    console.log(this.target_num_string);
                    // this.logCurrentAnswer();
                    this.sendData(1, false)
                    this.renderFeedback();
                    this.correctpt1 = true;

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

        const genFunc =  () => {
            this.inputNode.className = "form form-control";
            this.inputNode2.className = "form form-control";
            this.clearAnswer();
            this.getCheckedValues();
            // only generate new prompt when there is item selected
            if (this.checkedValues.length != 0){
                this.generateNumber();
                this.generateAnswer();
                this.clearSecondPart();
                if(this.runUnitTest && this.UTButton){
                    this.clearUnitTestButton()
                }
                if(this.runUnitTest){
                    this.renderUnitTestButton()
                }
            } 
            this.checkValidConversion();
            this.sendData(3);
        }
        // Generate a new prompt
        this.generateButton.addEventListener(
            "click",
             genFunc,
            false
        );

        // Add the buttons in the container
        this.containerDiv.appendChild(this.generateButton);
        this.containerDiv.appendChild(this.submitButton);
        if(this.runUnitTest){
            this.renderUnitTestButton();
        }

        //have to unforunately put this here to hae access to generatebutton.click
        const operatorBox = MinSelectBox(this.configDiv, 1, ["addBox", "subBox"], ["ADDITION", "SUBTRACTION"], [true, true], "Operators", this.getWindowOpen, this.setWindowOpen, genFunc)



   }

   renderSecondPartButtons(){
    this.submitButton.remove();
    this.submitButton2 = document.createElement("button");
    this.submitButton2.textContent = $.i18n("msg_NC_check_me");
    $(this.submitButton2).attr({
        class: "btn btn-success",
        name: "do answer",
        type: "button",
    });
    // check the answer
    this.submitButton2.addEventListener(
        "click",
        function () {
            this.checkValidConversion();
            if ( this.valid_conversion ) {
                this.correctpt2 = true;
                this.checkCurrentAnswerPt2();
                // this.logCurrentAnswer();
                this.sendData(1, true)
                
                this.renderFeedback2();
                console.log(this.correctpt2);
            }

        }.bind(this),
        true
    );

    // "try another" button
    this.generateButton.remove();
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
                this.clearSecondPart();
                if(this.runUnitTest){
                    this.clearUnitTestButton()
                }

                this.renderBAButtons();

            } 
            this.checkValidConversion();
            this.sendData(3);

        }.bind(this),
        false
    );

    // Add the buttons in the container
    this.answerDiv2.appendChild(this.generateButton);
    this.answerDiv2.appendChild(this.submitButton2);

    // Check answer when pressing "Enter"

   }

    // Add the feedback in the container
    renderBAFeedbackDiv() {
        this.containerDiv.appendChild(this.feedbackDiv);
    }

    renderSecondSection(){

        this.answerDiv2 = document.createElement("div");



        this.instruction2 = document.createElement("div");
        this.instruction2.innerHTML = "<span style='font-weight:bold'><u>Instructions (Part 2)</u></span>: " +
            "Interpret the result of the arithmetic operation as both an unsigned and signed (two’s complement) decimal number.  For each interpretation, has an overflow occurred?";
        //We got rid of the padding for styling purposes
        this.instruction2.style.padding = "0px";

        this.answerDiv2.append(this.instruction2)


        //This sets up the input for the unsigned decimal input
        this.USInput = document.createElement("input");
        this.USInput.setAttribute('type', 'text');
        this.USInput.setAttribute("size", "20");
        this.USInput.setAttribute("id", this.divid + "_input");
        this.USInput.className = "form form-control";
        this.statementNode11US = document.createTextNode("Unsigned Decimal:");

        this.USinputDIV = document.createElement("div");
        this.USinputDIV.className = "InputWRadioSubunit"

        this.USDiv = document.createElement("div")
        this.USinputDIV.append(this.statementNode11US);
        this.USinputDIV.append(this.USInput);
        this.USDiv.append(this.USinputDIV);

        var placeholder;
        placeholder = "Unsigned Decimal:";
        this.USInput.setAttribute("placeholder", placeholder);
        this.USInput.setAttribute("size", placeholder.length + 1);
        this.USInput.setAttribute("maxlength", this.num_bits+2);
        this.USInput.setAttribute('style', 'width: 50ptx;');

        //This sets up the input for the decimal input
        this.SInput = document.createElement("input");
        this.SInput.setAttribute('type', 'text');
        this.SInput.setAttribute("size", "20");
        this.SInput.setAttribute("id", this.divid + "_input");
        this.SInput.className = "form form-control";
        this.statementNode11S = document.createTextNode("Signed Decimal:");

        this.SInputDiv = document.createElement('div');
        this.SInputDiv.className = "InputWRadioSubunit"
        this.SInputDiv.appendChild(this.statementNode11S);
        this.SInputDiv.appendChild(this.SInput);
        this.SDiv = document.createElement("div")
        this.SDiv.append(this.SInputDiv);

        var placeholder;
        placeholder = "Signed Decimal:";
        this.SInput.setAttribute("placeholder", placeholder);
        this.SInput.setAttribute("size", placeholder.length + 1);
        this.SInput.setAttribute("maxlength", this.num_bits + 5);
        this.SInput.setAttribute('style', 'width: 50ptx;');


        //enter event handler
        this.USInput.addEventListener(
            "keyup",
            function(event) {
            if (event.key === "Enter") {
                    this.submitButton2.click();
                    
                }
            }.bind(this), true
            );
       
       this.SInput.addEventListener(
        "keyup",
        function(event) {
        if (event.key === "Enter") {
                this.submitButton2.click();
            }
        }.bind(this), true
        );

        //Adding the Yes/No radio buttons for overflow

        
        this.instruction3 = document.createElement("div");
        this.instruction3.innerHTML = "Is there overflow?";
        //We got rid of the padding for styling purposes
        this.instruction3.style.padding = "0px";

        //this.answerDiv2.append(this.instruction3)

        const fieldset = document.createElement("div")
        fieldset.className = "RadioFieldset"
        const legend1 = document.createElement("p")
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

        //fieldset.append(legend1)
        fieldset.append(yesBtnS);
        
        this.SButtonDiv = document.createElement("div");

        fieldset.append(noBtnS);

        fieldset.append(yesLabelS);

        fieldset.append(noLabelS);

        //bind 
        this.yesBtnS = yesBtnS;
        this.noBtnS = noBtnS;

        this.SDiv.append(fieldset)

        ///////////////////////Again for unsigned

        


        const fieldset2 = document.createElement("div")
        fieldset2.className = "RadioFieldset"

        const legend2 = document.createElement("p")
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

        //fieldset2.append(legend2)
        fieldset2.append(yesBtnU);

        fieldset2.append(noBtnU);

        fieldset2.append(yesLabelU);

        fieldset2.append(noLabelU);

        //bind 
        this.yesBtnU = yesBtnU;
        this.noBtnU = noBtnU;

        this.USDiv.append(fieldset2)

        this.SDiv.className = "InputWRadio"
        this.USDiv.className = "InputWRadio"

        this.overflowRadioPromptDiv = document.createElement("div")
        this.overflowRadioPromptDiv.className = "InputWRadio"
        const twoColP = document.createElement("p");
        twoColP.style = "  grid-column: span 2;";
        this.overflowRadioPromptDiv.append(twoColP)
        const overflowRadioText = document.createElement("p")
        overflowRadioText.style = "text-align: right; margin-right:17%;"
        overflowRadioText.innerText = "Is there overflow?"
        this.overflowRadioPromptDiv.append(overflowRadioText)
        this.overflowRadioPromptDiv.style = "height: 1px; width:88%; margin-top: 4%;"


        this.USDiv.style = "width: 50%; margin-left: 25%;"
        this.SDiv.style = "width: 50%; margin-left: 25%;"


        this.answerDiv2.append(this.overflowRadioPromptDiv)
        this.answerDiv2.append(this.USDiv);
        this.answerDiv2.append(this.SDiv);

        //WHY XO


        this.containerDiv.append(this.answerDiv2);

    }

    addInputEventListener(){
        // Check answer when pressing "Enter"
        console.log("e")
        this.inputNode.addEventListener("keyup", this.inputNodeEnterFunc, true)
    }

    removeInputEventListener(){
        console.log("el removed")
        this.inputNode.removeEventListener("keyup", this.inputNodeEnterFunc, true)
    }

    clearSecondPart(){
        if(this.answerDiv2 != undefined && this.answerDiv2 != null){
            this.answerDiv2.remove();

        }
    }

    // clear the input field
    clearAnswer() {
        this.inputNode.value = "";
        this.instruction.innerHTML=`<span style='font-weight:bold'><u>Instructions (Part 1)</u></span>: Perform the bitwise arithmetic operation and input your answer as a binary number in the boxes below.  The carry out field accepts one bit, and the result field accepts a ${this.menuNode2.value}-bit number.`;
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
        if(this.runUnitTestLog){
            this.randomItem = this.unitTestRandomItem;
        }
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
    
    getCarryOut(){
        let carryOut;
        if(this.target_num_string.length > this.num_bits){
            carryOut = this.target_num_string[0]
        }
        else{
            carryOut = 0
        }
        this.UTcarryOut = carryOut
        return carryOut;     
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


        //why is the exact same thing in both switch cases?
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

        //adding the +1 to avoid 0 being interpreted as ""; I hope this doesn't cause any problems later on

        if(this.runUnitTest && !this.runUnitTestLog && this.UT01 && this.UT02 && this.UT01.value && this.UT02.value){
            this.target_num = parseInt((this.UT01.value), 2);
            this.displayed_num_string = this.UT01.value.toString();
            this.target_num2 = parseInt((this.UT02.value), 2)
            this.displayed_num_string2 = this.UT02.value.toString();
        }
        else if(this.runUnitTest && this.runUnitTestLog && this.UT01 && this.UT02 && this.UT01.value && this.UT02.value){
            this.target_num = parseInt((this.logUnitTestInput1), 2);
            this.displayed_num_string = this.logUnitTestInput1.toString();
            this.target_num2 = parseInt((this.logUnitTestInput2), 2)
            this.displayed_num_string2 = this.logUnitTestInput2.toString();
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
                // let diff = this.target_num - this.target_num2;
                // if (diff < 0) {
                //     diff = (1 << (this.num_bits + 1)) + diff; // allow extra bit for borrow
                // }
                // this.target_num_string = this.toBinary(diff);
                     
                // break;
                this.target_num_converted = this.toBinary((~this.target_num2+1)>>>0, this.num_bits);
                this.addBinary();
       }
       // update the prompt
       this.generatePrompt();
   }


   addBinary(){
    
        let carryOut = 0
        this.target_num_string = ""
        let i = this.toBinary(this.target_num).length-1;
        let j = this.target_num_converted.length-1;


        while((i>=0 && j >= 0) || carryOut > 0){
            const dig_a = i>=0 ? parseInt(this.toBinary(this.target_num)[i]) : 0;
            const dig_b = i>=0 ? parseInt(this.target_num_converted[j]) : 0;
            let sum = dig_a + dig_b + carryOut;

            carryOut = ((sum >= 2) ? 1:0)
            this.target_num_string = (sum % 2).toString() + this.target_num_string;

            i--;
            j--;
        }

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
            placeholder = "Result";
            this.inputNode.setAttribute("placeholder", placeholder);
            this.inputNode.setAttribute("size", placeholder.length + 1);
            this.inputNode.setAttribute("maxlength", this.num_bits+2);

            placeholder = "Carry Out";
            this.inputNode2.setAttribute("placeholder", placeholder);
            this.inputNode2.setAttribute("size", placeholder.length + 1);
            this.inputNode2.setAttribute("maxlength", 1);


        this.removeInputEventListener()
        this.addInputEventListener()

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
        let ans = this.target_num_string;
        if(ans.length > this.num_bits){
            ans = ans.slice(1);
        }
        ans = Number(ans)
       // the answer is correct if it is the same as the string this.target_num_string
       var input_value = (this.inputNode.value).toString().toLowerCase();
       let input_value_2 = this.inputNode2.value;
        
       this.UTbinaryAnswer = ans;


       if(input_value_2 == undefined || input_value_2 == null){
        input_value_2 = 0
       }
       else{
        input_value_2 = Number(input_value_2.toLowerCase());
       }


       //0.toString() will return "", so need to add an exra check
       if ( input_value === "" ) {
           this.feedback_msg = ($.i18n("msg_no_answer"));
           this.correctpt1 = false;
           this.inputNode.className = "alert alert-danger";
       } 
       else if (input_value == `0b${ans}`){
        this.feedback_msg = ($.i18n("msg_NC_correct"));
        this.inputNode.className = "alert alert-info"

       }
       else if ( input_value != ans ) {
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
            this.inputNode.className = "alert alert-info"

       }
       
       const correctCarryOut = this.getCarryOut();
       if(input_value_2 != correctCarryOut){
        this.feedback_msg += "\n Incorrect carry out"
        this.correctpt1 = false;
        this.inputNode2.className = "alert alert-danger";
        
       }
       else{
        this.feedback_msg += '\n Correct carry out!'
        this.inputNode2.className = "alert alert-info"
       }

       if(this.correctpt1 == true){
        this.contWrong = 0;
       }
       
    //    if (this.correctpt1 === true) { this.sendData(1); } else { this.sendData(2); }
       if(this.correctpt1 === true){
        this.renderSecondSection();
        this.renderSecondPartButtons();
       }

   }


   displayCorrectAnswerUnsigned(){
    // il8n autoconverts < into &lt
    this.feedback_msg2 += ($.i18n("Overflow for unsigned correct. <br>"));
    this.contWrong = 0;
   }
   displayIncorrectAnswerUnsigned(){
    this.feedback_msg2 += ($.i18n("Overflow for unsigned incorrect. <br>"));
    this.contWrong ++;
    this.correctpt2 = false;
   }
   displayCorrectAnswerSigned(){
    this.feedback_msg2 += ($.i18n("Overflow for signed correct. <br>"));
    this.contWrong = 0;
   }
   displayIncorrectAnswerSigned(){
    this.feedback_msg2 += ($.i18n("Overflow for signed incorrect. <br>"));
    this.contWrong ++;
    this.correctpt2 = false;
   }

   checkCurrentAnswerPt2(){
    if(this.runUnitTestLog && this.USInput == undefined){
        this.USValue = 0;
    }
    else{
        this.USValue = (this.USInput.value.toLowerCase());
    }

    if(this.runUnitTestLog && this.SInput == undefined){
        this.SValue = 0;
    }
    else{
        this.SValue = (this.SInput.value.toLowerCase())
    }
    if(this.target_num_string.length > 4){
        this.ans = parseInt(this.target_num_string.slice(1), 2)
    }
    else{
        this.ans = parseInt(this.target_num_string,2 );
    }
    if(this.runUnitTestLog && this.yesBtnS == undefined){
        this.yesBtnValueS = false;
        this.noBtnValueS = false;
        this.yesBtnValueU = false;
        this.noBtnValueU = false;
    }
    else{
        this.yesBtnValueS = this.yesBtnS.checked;
        this.noBtnValueS = this.noBtnS.checked;
        this.yesBtnValueU = this.yesBtnU.checked;
        this.noBtnValueU = this.noBtnU.checked;
    }


    
    // const debugP = document.createElement("div")
    // this.containerDiv.append(debugP);
    // debugP.innerHTML = (`${USValue},  ${SValue}, ${yesBtnValue}, ${noBtnValue}`);

    console.log("ANS:")
    console.log(`${this.ans}, targetnumstring: ${this.target_num_string}, USI: ${this.USValue}`)
    if(this.USValue == ""){
        this.feedback_msg2 = "Unsigned interpretation: " + ($.i18n("msg_no_answer")) + "<br>";
        this.correctpt2 = false;
        this.USInput.className = "alert alert-danger";
    }
    else if(this.ans != this.USValue){
        this.feedback_msg2 = "Unsigned interpretation: " + ($.i18n("msg_NC_incorrect"))+ "<br>";
        this.contWrong ++;
        this.correctpt2 = false;
        this.USInput.className = "alert alert-danger";
    }
    else{
        this.feedback_msg2 = "Unsigned interpretation: " + ($.i18n("msg_NC_correct"))+ "<br>";
        this.contWrong = 0;
        this.USInput.className = "alert alert-info";

    }


    //Check the signed value
    if(this.SValue == ""){
        this.feedback_msg2 += "Signed interpretation: " + ($.i18n("msg_no_answer"))+ "<br>";
        this.correctpt2 = false;
        this.SInput.className = "alert alert-danger"
    }
    else if(this.toSignedDecimal() != this.SValue){
        this.feedback_msg2 += "Signed interpretation: " + ($.i18n("msg_NC_incorrect"))+ "<br>";
        this.contWrong ++;
        this.correctpt2 = false;
        this.SInput.className = "alert alert-danger"
    }
    else{
        this.feedback_msg2 += "Signed interpretation: " + ($.i18n("msg_NC_correct"))+ "<br>";
        this.contWrong = 0;
        this.SInput.className = "alert alert-info"
    }

    this.UTunsignedDecimalAnswer = this.ans;
    this.UTsignedDecimalAnswer = this.toSignedDecimal();

    ///find out if there's unsigned overflow

      this.checkUnsignedOverflow();
      this.checkSignedOverflow();
    }



   //This function checks whether the answer has unsigned overflow.
   checkUnsignedOverflow() {

    //grab first digit of target answer
    let carryOut;
    if(this.target_num_string.length > this.num_bits){
        carryOut = this.target_num_string[0]
    }
    else{
        carryOut = 0
    }

    //for testing purposes only
    const setUTOverflowVariables = () => {
        if(this.randomItem == "ADDITION" && carryOut == 1){
            this.UTunsignedOverflow = true;
        }
        else if(this.randomItem == "ADDITION"){
            this.UTunsignedOverflow = false;
        }
        else if(this.randomItem == "SUBTRACTION"){
            this.UTunsignedOverflow = true;
        }
        else if(this.randomItem == "SUBTRACTION"){
            this.UTunsignedOverflow = false;
        }  
    }
    setUTOverflowVariables();


    if(this.randomItem == "ADDITION" && carryOut == 1 && this.yesBtnValueU == true && this.noBtnValueU == false){
        this.displayCorrectAnswerUnsigned()
        this.UTunsignedOverflow = true;
    }
    else if(this.randomItem == "ADDITION" && carryOut == 0 && this.yesBtnValueU == false && this.noBtnValueU == true){
        this.displayCorrectAnswerUnsigned()
        this.UTunsignedOverflow = false;

    }
    else if(this.randomItem == "SUBTRACTION" && carryOut == 0 && this.yesBtnValueU == true && this.noBtnValueU == false){
        this.displayCorrectAnswerUnsigned();
        this.UTunsignedOverflow = true;

    }
    else if(this.randomItem == "SUBTRACTION" && carryOut == 1 &&  this.yesBtnValueU == false && this.noBtnValueU == true){
        this.displayCorrectAnswerUnsigned();
        this.UTunsignedOverflow = false;

    }
    else{
        this.correctpt2 = false;

        this.displayIncorrectAnswerUnsigned();
        
    }
   }

   //This function checks whether the answer has signed overflow.
   checkSignedOverflow() {

    // const largestNegNum = -(2**(this.num_bits-1));
    // const largestPosNum = 2**(this.num_bits-1)-1;
    // const decimalAns = this.toSignedDecimalWithOverflow();
    // const overflow = (decimalAns < largestNegNum || decimalAns> largestPosNum);

    // if(overflow && this.yesBtnValueS && !this.noBtnValueS){
    //     this.displayCorrectAnswerSigned();
    // }
    // else if(!overflow && !this.yesBtnValueS && this.noBtnValueS){
    //     this.displayCorrectAnswerSigned();
    // }
    // else{
    //     this.displayIncorrectAnswerSigned();
    // }
    let operand1_digit;
    let operand2_digit;
    let overflow;

    if(this.randomItem == "ADDITION"){
        operand1_digit = this.displayed_num_string[0]
        operand2_digit = this.displayed_num_string2[0];
    }
    if(this.randomItem == "SUBTRACTION"){
        operand1_digit = this.displayed_num_string[0];
        const operand2 = ~this.target_num2 + 1;
        operand2_digit = this.toBinary(operand2, this.num_bits)[0];
    }

    if(operand1_digit != operand2_digit){
            overflow = false;
        } 
    else if (this.target_num_string.length > this.num_bits){
        if(operand1_digit != this.target_num_string[1]) {
            overflow = true;
            } 
        else {
            overflow = false;
        }
    }
    else {
        if(operand1_digit != this.target_num_string[0]){
            overflow = true;
        } 
        else {
            overflow = false;
        }
    }

    if(overflow){
        if(this.yesBtnValueS == true && this.noBtnValueS == false){
            this.displayCorrectAnswerSigned();
        }
        else{
            this.displayIncorrectAnswerSigned();
        }
    }else if(!overflow){
        if(this.noBtnValueS == true && this.yesBtnValueS == false){
            this.displayCorrectAnswerSigned();
        }
        else{
            this.correctpt2 = false;

            this.displayIncorrectAnswerSigned();
        }
    }

    this.UTsignedOverflow = overflow;
    

    
   }

    // // log the answer and other info to the server (in the future)
    // async logCurrentAnswer(sid) {
    //     let answer = JSON.stringify(this.inputNode.value);
    //     // Save the answer locally.
    //     this.setLocalStorage({
    //         answer: answer,
    //         timestamp: new Date(),
    //     });
    //     let data = {
    //         event: "numconv",
    //         act: answer || "",
    //         answer: answer || "",
    //         correct: this.correctpt1 ? "T" : "F",
    //         div_id: this.divid,
    //     };
    //     if (typeof sid !== "undefined") {
    //         data.sid = sid;
    //         feedback = false;
    //     }
    //     // render the feedback

    //     return data;
        
    // }

    sendData(actionId, part2=false) {

        let details; 
        if (actionId == 1 || actionId == 2) {
            details = {
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
                    userAnswer : this.inputNode ? this.inputNode2.value+this.inputNode.value.toLowerCase() : null,
                    correctpt1 : this.correctpt1,
                }
            }
        

            if(part2){
                let signedBool = false;
                let unsignedBool = false
                if(this.yesBtnS.checked){
                    signedBool = true
                }
                if(this.yesBtnU.checked){
                    unsignedBool = true;
                }
                details.eval.correctpt2 = this.correctpt2;
                details.eval.userAnswer = [this.USInput.value, this.SInput.value, unsignedBool, signedBool]
                details.eval.correctAnswer = [this.ans, this.toSignedDecimal(), this.UTunsignedOverflow, this.UTsignedOverflow]
            }
        }

        if(actionId == 3 || actionId == 0){
            details = {
                config : {
                    numBits : `${this.num_bits}`,
                    checkedOperators : `${this.checkedValues}`,
                    usedOperator : `${this.randomItem}`
                },
            }
        }

        this.logData(null, details, actionId, this.componentId);
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
       this.answerDiv.appendChild(this.feedbackDiv);

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
        this.correctpt1 = true;
   }
   renderFeedback2() {
    this.feedbackDiv2 = document.createElement("div");
    this.feedbackDiv2.setAttribute("id", this.divid + "_feedback");
    this.answerDiv2.appendChild(this.feedbackDiv2);

     // only the feedback message needs to display
     var feedback_html = "<dev>" + this.feedback_msg2 + "</dev>";
     if (this.correctpt2) {
        //  $(this.feedbackDiv2).attr("class", "alert alert-info");
        this.feedbackDiv2.className = "alert alert-info";
     } else {
         //$(this.feedbackDiv2).attr("class", "alert alert-danger");
         this.feedbackDiv2.className = "alert alert-danger"
     }
   
     this.feedbackDiv2.innerHTML = feedback_html;
     this.displayFeedback2();
     if (typeof MathJax !== "undefined") {
         this.queueMathJax(document.body);
     }

}



//Unit Testing Functions

generateAllMatchings = (arr1, arr2, spread=true) => {
    let target = [];
    arr1.forEach(e1 => {
        arr2.forEach(e2 => {
            if(spread){
                if(e1.length > 1 && e2.length > 1){
                    target.push([...e1,...e2])
                }
                else if(e1.length > 1){
                    target.push([...e1, e2])
                }
                if(e2.length > 1){
                    target.push([e1,...e2])
                }
                else{
                    target.push([e1,e2])
                }
            }
            else{
                target.push([e1,e2])
            }
            
        })
    });
    return target;
}

NBitNums = (n=4) => {
    let temp = [1,0]
    for(let i = 0; i < (n-1);  i++){
        temp = this.generateAllMatchings([1,0], temp)
    }
    return temp
}

unitTest(){
    this.generateButton.click();
}
unitTestAndLog(){
    const fourBitNums = this.NBitNums(this.num_bits)
    const operandsArr = this.generateAllMatchings(fourBitNums,fourBitNums,false);
    this.resultLog = "First_Num_Binary, Operation, Second_Num_Binary, Answer, Carry Out, Unsigned_Answer, Signed_Answer, Unsigned_Overflow, Signed_Overflow \n"
    //this.logUnitTestInput1.value
    operandsArr.forEach(elem => {
        const e1 = elem[0]
        const e2 = elem[1]
        this.logUnitTestInput1 = e1;
        this.logUnitTestInput2 = e2;
        this.generateButton.click();
        this.checkCurrentAnswer();
        this.checkCurrentAnswerPt2();
        // const resultString = `${this.target_num} ${this.randomItem} ${this.target_num2} \n: ` +
        // `Answer: ${this.UTbinaryAnswer}, Unsigned Answer: ${this.UTunsignedDecimalAnswer}, Signed Answer: ${this.UTsignedDecimalAnswer} \n` +
        // `Unsigned Overflow: ${this.UTunsignedOverflow}, Signed Overflow: ${this.UTsignedOverflow} `;
        const resultStringCSV = `${this.toBinary(this.target_num)}, ${this.randomItem}, ${this.toBinary(this.target_num2)},` +
        `${this.UTbinaryAnswer}, ${this.UTcarryOut}, ${this.UTunsignedDecimalAnswer},${this.UTsignedDecimalAnswer},` +
        `${this.UTunsignedOverflow},${this.UTsignedOverflow}\n`;
        this.resultLog += (resultStringCSV)
    })
    this.unitTestRandomItem = "SUBTRACTION"
    operandsArr.forEach(elem => {
        const e1 = elem[0]
        const e2 = elem[1]
        this.logUnitTestInput1 = e1;
        this.logUnitTestInput2 = e2;
        this.generateButton.click();
        this.checkCurrentAnswer();
        this.checkCurrentAnswerPt2();
        // const resultString = `${this.target_num} ${this.randomItem} ${this.target_num2} \n: ` +
        // `Answer: ${this.UTbinaryAnswer}, Unsigned Answer: ${this.UTunsignedDecimalAnswer}, Signed Answer: ${this.UTsignedDecimalAnswer} \n` +
        // `Unsigned Overflow: ${this.UTunsignedOverflow}, Signed Overflow: ${this.UTsignedOverflow} `;
        const resultStringCSV = `${this.toBinary(this.target_num)}, ${this.randomItem}, ${this.toBinary(this.target_num2)},` +
        `${this.UTbinaryAnswer}, ${this.UTcarryOut}, ${this.UTunsignedDecimalAnswer},${this.UTsignedDecimalAnswer},` +
        `${this.UTunsignedOverflow},${this.UTsignedOverflow}\n`;
        this.resultLog += (resultStringCSV)
    })

    const blob = new Blob([this.resultLog], {type: "text/csv;charset=utf-8"});
    const blobUrl = URL.createObjectURL(blob);
    
    // Create a link to download the file
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = "data.csv";
    link.innerHTML = "Click here to download the file";
    this.containerDiv.appendChild(link);
    
    console.log(this.resultLog);
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


