// *********
// numconv.js
// *********
// This file contains the JS for the Runestone numberconversion component. It was created By Luyuan Fan, Zhengfei Li, and Yue Zhang, 06/01/2023
"use strict";


import RunestoneBase from "../../common/js/runestonebase.js";
import aj_x86 from "./AJ_ISAs/aj_x86class.js";
import aj_arm64 from "./AJ_ISAs/aj_arm64class.js";
import aj_ia32 from "./AJ_ISAs/aj_ia32class.js"
import { nanoid } from 'nanoid/non-secure';
import "./assembly-i18n.en.js";
// import "./NC-i18n.pt-br.js";
import "../css/assembly_mode.css";
import { Pass } from "codemirror";
export var AMList = {}; // Object containing all instances of NC that aren't a child of a timed assessment.

// NC constructor
export default class AM extends RunestoneBase {
    constructor(opts) {
        super(opts);
        var orig = opts.orig; // entire <p> element
        this.useRunestoneServices = opts.useRunestoneServices;
        this.origElem = orig;
        this.divid = orig.id;
        this.archSelect == "X86_64";
        this.arch = new aj_x86;
        this.regA = "rax";
        this.regB = "rcx";

        
        // Default configuration settings
        this.correct = null;
        this.num_bits = 8;
        this.prev_num = -1;
        
        // Fields for logging data
        this.componentId = "4.1";
        this.questionId = 1;
        this.userId = this.getUserId();

        this.createAMElement();

        // this.addCaption("runestone");
        // this.checkServer("nc", true);
        if (typeof Prism !== "undefined") {
            Prism.highlightAllUnder(this.containerDiv);
        }

        this.contWrong = 0;
        this.sendData(0);
    }
    // Find the script tag containing JSON in a given root DOM node.
    scriptSelector(root_node) {
        return $(root_node).find(`script[type="application/json"]`);
    }
    /*===========================================
    ====   Functions generating final HTML   ====
    ===========================================*/
    // Create the NC Element
    createAMElement() {
        this.renderAMPromptAndInput();
        this.renderAnswerDiv();
        this.renderAMButtons();
        this.renderAMFeedbackDiv();
        // replaces the intermediate HTML for this component with the rendered HTML of this component
        $(this.origElem).replaceWith(this.containerDiv);
    }

    renderAMPromptAndInput() {
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

        this.instructionNode = document.createElement("div");
        this.instructionNode.style.padding = "10px";
        this.instructionNode.innerHTML = "<span style='font-weight:bold'><u>Instructions</u></span>: Determine whether as a jump is taken based on the operation and the jump instruction."

        // // specify the number of bits in the statement
        // this.statementNode05 = document.createTextNode("Please convert a value from one selected number system to another selected number system.");



        
        this.configHelperText = document.createElement("div");
        this.configHelperText.innerHTML = "<span style='font-weight:bold'><u>Configure question</u></span>: Choose an ISA";
        // render the statement
        this.containerDiv.appendChild(this.instructionNode);
        this.statementDiv.appendChild(this.configHelperText);
        this.containerDiv.appendChild(this.statementDiv);
        this.containerDiv.appendChild(document.createElement("br"));


        this.ISASelect = document.createElement("select")
        this.X86Option = document.createElement("option")
        this.X86Option.value = "X86_64"
        this.X86Option.textContent = "X86_64"

        this.IA32Option = document.createElement("option")
        this.IA32Option.value = "ia_32"
        this.IA32Option.textContent = "ia_32"
        
        this.ARM64Option = document.createElement("option")
        this.ARM64Option.value = "arm_64"
        this.ARM64Option.textContent = "arm_64"

        this.ISASelect.append(this.X86Option)
        this.ISASelect.append(this.IA32Option)
        this.ISASelect.append(this.ARM64Option)

        this.statementDiv.append(this.ISASelect);

        this.statementDiv.className = "statement-div";


        // create the node for the prompt
        this.promptDiv = document.createElement("div");
        this.promptDiv.style.fontSize = "x-large";


        

        this.containerDiv.appendChild(this.promptDiv);
        this.containerDiv.appendChild(document.createElement("br"));



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
        $(this.containerDiv).find("code").attr("class","tex2jax_ignore");
        // When a blank is changed mark this component as interacted with.
        // And set a class on the component in case we want to render components that have been used
        // differently
        for (let blank of this.blankArray) {
            $(blank).change(this.recordAnswered.bind(this));
        }
    }

    renderAnswerDiv(){
        // const tableHTML =
        // "<div class='tables-container'><div class='table-wrapper'>" +
        // "<table class='register-table'><caption>Registers:</caption><thead>"+
        // "<tr><th>Register</th><th>Current Value</th><th>Post Instruction Value</th></tr>"+
        // "</thead>" +
        // `<tbody><tr><td>${this.regA}</td><td>${this.arch.rax}</td>`+
        // `<td><input class="raxInput" type='text' placeholder='${this.arch.rax}'></td></tr>`+
        // `<tr><td>${this.regB}</td><td>${this.arch.rcx}</td>`+ 
        // `<td><input class="rcxInput" type='text' placeholder='${this.arch.rcx}'></td></tr>`+
        // `</tbody></table>`+
        // "</div></div>"

        
        this.answerDiv = document.createElement('div')
        this.answerDiv.className = "answerDiv"


        this.answerTable = document.createElement("div")
        this.answerTable.className = "tables-container"
        this.tableWrapper = document.createElement("div")
        this.tableWrapper.className = "table-wrapper"

        this.table = document.createElement("table")
        this.table.class = "register-table"

        this.tableHeadRow = document.createElement("tr")
        this.tableHeadRow.innerHTML = "<th>Instruction</th> <th>Memory Access?</th> <th> Read or Write </th>"
        this.table.append(this.tableHeadRow)

        this.questions = [];
        this.answers = [];

        this.generateAnswer();
        this.questions.map((q,i)=>{
            const tableRow = document.createElement("tr")
            const iTd = document.createElement("td")
            const maTd = document.createElement("td")
            const rwTd = document.createElement("td")

            iTd.innerHTML = `<code>${q.code}</code>`
            
            //radio buttons
            const rYes = document.createElement("input")
            rYes.type = "radio"
            rYes.className = `radioYes${i}`
            rYes.value = `radioYes${i}`
            rYes.name = `ma${i}`
            const rYesLabel = document.createElement("label")
            rYesLabel.setAttribute("for", `radioYes${i}`)
            rYesLabel.textContent = "yes"

            const rNo = document.createElement("input")
            rNo.value = `radioNo${i}`
            rNo.type = "radio"
            rYes.className = `radioNo${i}`
            rNo.name = `ma${i}`
            const rNoLabel = document.createElement("label")
            rNoLabel.setAttribute("for", `radioNo${i}`)
            rNoLabel.textContent = "no"

            maTd.append(rYes)
            maTd.append(rYesLabel)
            maTd.append(document.createElement("br"))
            maTd.append(rNo)
            maTd.append(rNoLabel)

            const select = document.createElement("select")
            select.className = `rwSelect${i}`
            const readOption = document.createElement('option')
            readOption.value = "read"
            readOption.textContent = "read"
            const writeOption = document.createElement('option')
            writeOption.value = "write"
            writeOption.textContent = "write"
            select.append(readOption)
            select.append(writeOption)

            rwTd.append(select)

            tableRow.append(iTd)
            tableRow.append(maTd)
            tableRow.append(rwTd)
            
            this.table.append(tableRow)
        })

        


        this.tableWrapper.append(this.table)
        this.answerTable.append(this.tableWrapper)
        this.answerDiv.append(this.answerTable)

        this.containerDiv.append(this.answerDiv)
    }

    clearButtons(){
        this.generateButton.remove()
        this.submitButton.remove()
    }

    recordAnswered() {
        this.isAnswered = true;
    }

    renderAMButtons() {
        // "check me" button and "generate a number" button
        this.submitButton = document.createElement("button");
        this.submitButton.textContent = $.i18n("Check Answer");
        $(this.submitButton).attr({
            class: "btn btn-success",
            name: "answer",
            type: "button",
        });
        // check the answer when the conversion is valid
        this.submitButton.addEventListener("click", () => {
            if(this.feedbackDiv){
                this.feedbackDiv.remove()
            }
            this.checkCurrentAnswer();
            this.logCurrentAnswer();
    
        });

        this.generateButton = document.createElement("button");
        this.generateButton.textContent = $.i18n("Generate another question");
        $(this.generateButton).attr({
            class: "btn btn-success",
            name: "generate a number",
            type: "button",
        });
        // generate a new number for conversion 
        this.generateButton.addEventListener("click", () => {
            this.clearAnswer();

            this.renderAnswerDiv();
            this.renderAMButtons()
            
        });

        this.containerDiv.appendChild(this.generateButton);
        this.containerDiv.appendChild(this.submitButton);


    }

    renderAMFeedbackDiv() {
        // this.containerDiv.appendChild(document.createElement("br"));
        this.containerDiv.appendChild(this.feedbackDiv);
    }

    // clear the input field
    clearAnswer() {
        this.feedbackDiv.remove();
        this.answerDiv.remove();
        this.clearButtons()
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

    generateAnswer() {
        for (let i = 0; i<4; i++){
            const questionInfo = this.generateCode();
            this.questions.push(questionInfo);
            console.log("pushing to this.questions:" + this.questions)
            this.answers.push(questionInfo.result);
        }

    }
    
    generateCode() {
        let text = "";
        this.instructionList = ["mov", "add", "sub", "imul", "idiv"];
        this.registerList = ["rax", "rcx", "rsp", "rbp"];
        if(this.ISASelect == "X86_64"){
            this.registerList = ["rax", "rcx", "rsp", "rbp"];
        } else if (this.ISASelect == "ia_32"){
            this.registerList = ["eax", "ecx", "esp", "ebp"];
        }
            
        const RWAns = Math.floor(Math.random()*3);

        if(RWAns == 0){
            text = this.generateRead();
        } else if (RWAns == 1){
            text = this.generateWrite();
        } else {
            text = this.generateNoAccess();
        }

        return {code: text, result: RWAns};
    }

    generateRead() {
        const operation = this.instructionList[Math.floor(Math.random()*5)];
        const start = Math.floor(Math.random()*(16+15)-15)
        const offset = (start != 0) ? start.toString(16): "";
        let reg1 = this.registerList[Math.floor(Math.random()*4)];
        let reg2 = `${offset}(%${this.registerList[Math.floor(Math.random()*4)]})`;
        
        
        const text = `${operation} ${reg2}, ${reg1}`;
        console.log("reg1:" + reg1);
        console.log("reg2:" + reg2);
        console.log("text: " + text)
        
        return text;
    }
    
    generateWrite() {
        const operation = this.instructionList[Math.floor(Math.random()*5)];
        const start = Math.floor(Math.random()*(16+15)-15)
        const offset = (start != 0) ? start.toString(16): "";
        let reg1 = this.registerList[Math.floor(Math.random()*4)];
        let reg2 = `${offset}(%${this.registerList[Math.floor(Math.random()*4)]})`;
        
        const text = `${operation} ${reg1}, ${reg2}`;
        console.log("reg1:" + reg1);
        console.log("reg2:" + reg2);
        console.log("text: " + text)
        
        return text;

    }

    generateNoAccess() {

        const operation = this.instructionList[Math.floor(Math.random()*5)];

        let reg1 = this.registerList[Math.floor(Math.random()*4)];
        let reg2 = this.registerList[Math.floor(Math.random()*4)];
        
        const text = `${operation} ${reg1}, ${reg2}`;
        console.log("reg1:" + reg1);
        console.log("reg2:" + reg2);
        console.log("text: " + text)
        
        return text;
    }

    // check if the conversion is valid  
    checkValidConversion() {
        this.hideFeedback();

        
    }
    
    // check if the answer is correct
    checkCurrentAnswer() {
        this.correct = false;
        this.feedback_msg = "";
        let linkISA = "x86_64";

        if(this.archSelect == "X86_64"){
            linkISA = "x86_64"
        }
        else if(this.archSelect == "ia_32"){
            linkISA = "x86"
        }
        else if(this.archSelect == "arm_64"){
            linkISA = "arm64"
        }
        if(this.RAXInput.value == this.arch.rax && this.RCXInput.value == this.arch.rcx){
            this.correct = true;
            this.feedback_msg += $.i18n("msg_asm_correct");
        } else{
            this.feedback_msg += $.i18n("msg_asm_incorrect");
            let asmLink = `https://asm.diveintosystems.org/arithmetic/${linkISA}/`
            // asmLink += this.codeBox.innerHTML.split("<br>").join("%0A").split(",").join("%2C").split("%").join("%25").split(":").join("%3A").split(' ').join("%20")
            asmLink += encodeURI(this.codeBox.innerHTML.split("<br>").join("\n"))
            asmLink += `/0/0/0/0/${this.rax}/${this.rcx}/0`
            console.log(asmLink)
            this.feedback_msg += `<a href='${asmLink}' target='_blank'> Try it in ASM Visualizer! </a>`
            
        }
        this.renderFeedback();
        

    }

    // log the answer and other info to the server (in the future)
    async logCurrentAnswer(sid) {

    }

    sendData(actionId) {

    }

    /*===================================
    === Checking/loading from storage ===
    ===================================*/
    restoreAnswers(data) {
        // pass;
    }
    checkLocalStorage() {
        // pass;
    }
    setLocalStorage(data) {
        // pass;
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
    $("[data-component=assembly_mode]").each(function (index) {
        var opts = {
            orig: this,
            useRunestoneServices: eBookConfig.useRunestoneServices,
        };
        if ($(this).closest("[data-component=timedAssessment]").length == 0) {
            // If this element exists within a timed component, don't render it here
            try {
                AMList[this.id] = new AM(opts);
            } catch (err) {
                console.log(
                    `Error rendering Number Conversion Problem ${this.id}
                     Details: ${err}\n Stack Trace: ${err.stack}`
                );
            }
        }
    });
});