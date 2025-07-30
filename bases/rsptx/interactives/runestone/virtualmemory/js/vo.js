 // *********
// vo.js
// *********
// This file contains the JS for the Runestone virtual memory component. It was created By Luyuan Fan, Zhengfei Li, and Yue Zhang, 06/01/2023
"use strict";

import RunestoneBase from "../../common/js/runestonebase.js";
import "./vo-i18n.en.js";
import "../css/vo.css";
import { Pass } from "codemirror";
import { validLetter } from "jexcel";
import { updateHeight } from "../../../utils/updateHeight.js";

export var VOList = {}; // Object containing all instances of VO that aren't a child of a timed assessment.

// VO constructor
export default class VO extends RunestoneBase {
    constructor(opts) {
        super(opts);
        var orig = opts.orig; // entire <p> element
        this.useRunestoneServices = opts.useRunestoneServices;
        this.origElem = orig;
        this.divid = orig.id;

        // Fields for logging data
        this.componentId = this.getCID();
        this.questionId = 1;
        this.userId = this.getUserId();

        this.createVOElement();
        this.caption = "Virtual Memory Operations";
        this.addCaption("runestone");
        

        this.sendData(this.a2ID('load'))

        // this.checkServer("vo", true);
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
    // Create the VO Element
    createVOElement() {
        this.initParams(); // init all
        this.renderVOInputField();
        this.renderVOButtons();
        this.renderVOFeedbackDiv();

        // replaces the intermediate HTML for this component with the rendered HTML of this component
        $(this.origElem).replaceWith(this.containerDiv);
        updateHeight(window, document, this, true);
    }

    initParams() {
        this.setDefaultParams();
        this.setCustomizedParams();
    }

    sendData(actionId, i=0){

        let details = {}

        details.prompts = this.promptList;

        if(this.id2A(actionId) == 'correct' || this.id2A(actionId) == 'incorrect'){
            details.answers = this.answerList
        }
        if(this.id2A(actionId) == 'incorrect'){
            details.userAnswer = this.answer;
        }


        this.logData(null, details, actionId, this.componentId);
    }

    // set default parameters
    setDefaultParams() {
        this.architecture = "IA32";
        this.num_q_in_group = 4; // number of questions in a group
        this.memoryAccess_chance = 0.5; // probability of memory-accessing ops in one set
        this.constantInArthm_chance = 0.5; // probability of having a contant as src
        this.lea = false;

        this.constRange = 20; // value range of the constants
        this.fieldList = ["Page fault? ", "Cache miss? ", "Dirty bit? "];
        this.fieldID = ["pf", "cm", "db"];
        this.operatorList = [];
        this.promptList = [];
        this.answerList = [];
    }

    // load customized parameters
    setCustomizedParams() {
        const currentOptions = JSON.parse(this.scriptSelector(this.origElem).html());
        if (currentOptions["architecture"] != undefined) {
            this.architecture = currentOptions["architecture"];
        }
        if (currentOptions["num_of_question_in_one_group"] != undefined) {
            this.num_q_in_group = eval(currentOptions["num_of_question_in_one_group"]);
        }
        if (currentOptions["mem_access_chance"] != undefined) {
            this.memoryAccess_chance = eval(currentOptions["mem_access_chance"]);
        }
        if (currentOptions["load_effective_address"] != undefined) {
            this.lea = eval(currentOptions["load_effective_address"]);
        }

        if (this.architecture === "IA32") {
            // declare all IA32 elements for the prompt
            this.arthm_operators = ["addl", "subl", "imull", "sall", "sarl", "shrl", "xorl", "andl", "orl"];
            this.mem_operators = ["movl"];
            this.registers = ["%eax", "%ecx", "%edx", "%ebx", "%esi", "%edi"];
            this.offsets = ["-0x8", "0x8", "8", "4", "-0x4", "0x4", ""];
        } else if (this.architecture === "ARM64") {
            // declare all ARM64 elements for the prompt
            this.arthm_operators = ["mov", "add", "sub", "mul", "udiv", "sdiv", "and", "orr", "eor"];
            this.mem_operators = ["ldr", "ldp", "str", "stp"];
            this.registers = [];
            this.registers_64bits = [];
            this.registers_32bits = [];
            for (let i = 0; i < 29; i++) {
                this.registers_64bits.push("x" + i.toString());
                this.registers_32bits.push("w" + i.toString());
            }
            this.offsets = ["#8", "#16", "#32"];
        }
    }

    renderVOInputField() {
        this.containerDiv = $("<div>").attr("id", this.divid);
        this.instruction = $("<div>").html(
            "For each of the following " + 
            this.architecture + 
            " instructions, indicate whether the instruction " + 
            "<b>could</b> cause a page fault, whether it <b>could</b> cause a cache miss, and " + 
            "whether it <b>could</b> cause the dirty bit in the cache to be set to 1."
        );
        this.statementDiv = $("<div>").append(this.instruction);
        this.statementDiv.append("<br>");
        this.inputBox = document.createElement("div");
        // convert inputBox to a jQuery object
        this.inputBox = $(this.inputBox); // contains all prompts and buttons
        
        this.textNodes = []; // create a reference to all current textNodes for future update
        this.inputNodes = []; // create slots for inputs for future updates
        var textNode = null; 
        
        this.genPromptsNAnswer();

        // create and render all input fields in question group
        for (let i = 0; i < this.num_q_in_group; i++) {
            this.newdivID = "div" + i;
            this.newDiv = $("<div>").attr("id", this.divid + this.newdivID);
            this.newDiv.append(String.fromCharCode((i + 97)) + ". "); // bulletin for each question
            textNode = $(document.createElement("code")).text(this.promptList[i]); // create the prompt
            textNode.css("font-size", "large");
            this.textNodes.push(textNode);

            this.newDiv.append(textNode);
            this.newDiv.append("<br>");
            this.innerQuestions = $("<div>").css("font-size", "14px");

            this.radioButtons = [];
            // create and render page fault, cache miss, dirty bit answer fields
            for (let j = 0; j < 3; j++) {
                this.innerQuestions.append(this.fieldList[j]);
                // create labels and buttons for YES and NO
                var lblYes = $("<label>").text("YES");
                var btnYes = $("<input>").attr({
                    type: "radio",
                    value: true,
                    name: this.divid + "YN" + i + this.fieldID[j],
                    id: "Yes" + i + this.fieldID[j]
                });
                btnYes.on('change', function () {
                    $(this).removeClass('highlightWrong');
                    $(this).next('label').removeClass('highlightWrong');
                });
                var lblNo = $("<label>").text("NO");
                var btnNo = $("<input>").attr({
                    type: "radio",
                    value: false,
                    name: this.divid + "YN" + i + this.fieldID[j],
                    id: "No" + i + this.fieldID[j]
                });
                btnNo.on('change', function () {
                    $(this).removeClass('highlightWrong');
                    $(this).prev('label').removeClass('highlightWrong');
                });
                this.innerQuestions.append(lblYes);
                this.innerQuestions.append(btnYes);
                this.innerQuestions.append(lblNo);
                this.innerQuestions.append(btnNo);
                if (j !== 2) { 
                    this.innerQuestions.append(" | ");
                    this.innerQuestions.append(document.createTextNode( '\u00A0' ));
                }
                this.radioButtons.push([btnYes, btnNo]);
            }
            // "check me" button and "generate a number" button
            this.submitButton = $("<button>")
                .text($.i18n("msg_VO_check_me"))
                .attr({
                    class: "button-check",
                    name: "answer",
                    type: "button",
                    id: this.divid + "submit" + i
                })
                .on("click", () => {
                    this.checkThisAnswers(i);
                    this.logCurrentAnswer();

                    this.sendData(this.a2ID(this.correct ? 'correct' : 'incorrect'))
                    
                });
            this.submitButton.addClass("button-check checkingbutton");
            this.innerQuestions.append(this.submitButton);
            this.newDiv.append(this.innerQuestions);
            this.inputBox.append(this.newDiv);
            this.inputNodes.push(this.radioButtons);
        }
        this.statementDiv.append(this.inputBox);

        // copy the original elements to the container holding what the user will see.
        $(this.origElem).children().clone().appendTo(this.containerDiv);
        
        this.statementDiv.addClass("statement-box");
        
        // create a feedback div, will be removed in clear and added back when generate another question
        this.feedbackDiv = $("<div>").attr("id", this.divid + "_feedback");

        // remove the script tag.
        this.scriptSelector(this.containerDiv).remove();
        // ***div STRUCTURE***: containerDiv consists of instruction, <br>, inputBox.
        // ***div STRUCTURE***: inputBox contains four newDiv. 
        this.containerDiv.append(this.statementDiv);
    }

    genPromptsNAnswer() { // generates a group of prompts and their answers, sets answers with this.memAccess, this.src, this.dest
        this.memAccess = null;
        this.dest = null;
        this.src = null;
        var pf = null, cm = null, db = null;
        this.operatorList = [];

        for (let k = 0; k < this.num_q_in_group; k++) {
            if (Math.random() < this.memoryAccess_chance) { // determine whether mem access at all, yes case
                this.memAccess = true;
                pf = true, cm = true;
                if (Math.random() < 0.5) { // mem access is on src
                    this.dest = "reg";
                    this.src = "mem";
                    db = false;
                } else {  // mem access is on this.dest
                    this.dest = "mem";
                    this.src = "reg";
                    db = true;
                }
            }
            else { // no mem access case
                if (Math.random() < 0.2 && this.lea === true && this.architecture === "IA32") {
                    pf = false, cm = false, db = false;
                    this.memAccess = "lea";
                } else {
                    this.memAccess = false;
                    this.dest = "reg";
                    pf = false, cm = false, db = false;
                    if (Math.random() < this.constantInArthm_chance) {
                        this.src = "const";
                    } else {
                        this.src = "reg";
                    }
                }
            }
            this.answerList[k] = [pf, cm, db];
            this.promptList[k] = this.renderOnePrompt(); 
        }
    }

    renderOnePrompt() { // render one prompt based on source prompt, which is this.memAccess, this.src, and this.dest
        this.operator = null;
        this.pair = false;
        
        if (this.memAccess === "lea") {
            var ret = this.renderLoadEffectiveAddress();
            return "leal" + " " + ret;
        }
        else {
            // render the operator
            if (this.memAccess === false) {
                this.operator = this.pick(this.arthm_operators);
                while (this.has(this.operator)) {
                    this.operator = this.pick(this.arthm_operators);
                }
                this.operatorList.push(this.operator);
            } else {
                this.operator = this.pick(this.mem_operators);
            }

            // render all other
            if (this.architecture === "IA32") {
                if (this.src === "reg") { // this.src is register
                    this.src = this.renderRegister();
                } else if (this.src === "mem") { // this.src is memory
                    this.src = this.renderMemAccess();
                } else { // this.src is constant
                    this.src = this.renderConstant();
                }
                if (this.dest === "reg") { // this.dest is register 
                    this.dest = this.renderRegister();
                } else { // this.dest is memory
                    this.dest = this.renderMemAccess();
                }
                return this.operator + " " + this.src + ", " + this.dest;
            }
            else if (this.architecture === "ARM64") {
                // determine the number of accessed bits in register, 32 bits or 64 bits
                if (Math.random() < 0.5) {this.registers = this.registers_32bits;} 
                else {this.registers = this.registers_64bits;}

                if (this.memAccess === false) {
                    if (this.operator === "mov") {
                        this.src = this.renderRegister();
                        this.dest = this.renderRegister();
                    } else {
                        if (Math.random() < 0.5) {
                            this.op1 = this.renderRegister();
                        } else {
                            this.op1 = this.renderConstant();
                        }
                        this.op2 = this.renderRegister();
                        this.src = this.op1 + ", " + this.op2;
                        this.dest = this.renderRegister();
                    }
                } else {
                    if (this.operator === "ldp" || this.operator == "stp") {
                        this.pair = true;
                    }
                    this.dest = this.renderRegister();
                    this.src = this.renderMemAccess();   
                }
                return this.operator + " " + this.dest + ", " + this.src;
            }
        }
    }

    has (o) {
        for (let i = 0; i < this.operatorList.length; i++) {
            if (this.operatorList[i] === o) {
                return true;
            }
        }
        return false;
    }

    renderVOButtons() {
        this.generateButton = document.createElement("button");
        this.generateButton.textContent = $.i18n("msg_VO_generate_another");
        $(this.generateButton).attr({
            class: "btn btn-success",
            name: "generate a number",
            type: "button",
            id: this.divid + "submit",
        });
        this.generateButton.addEventListener("click", () => {
            this.cleanInputNFeedbackField(); // clear answers, clear prev feedback, and enable all for the input fields
            this.updatePrompts();
            this.sendData(this.a2ID('generate'))
        });
        this.containerDiv.append("<br>");
        this.containerDiv.append(this.generateButton);
    }

    cleanInputNFeedbackField () {
        // clear all previous selection
        $('input[type="radio"]').prop('checked', false);

        // enable all previously disabled element
        for (let h = 0; h < this.num_q_in_group; h++) {
            var currDivID = this.divid + "div" + h; // index into the current div
            var currSubmitID = this.divid + "submit" + h; // index into the submit button in the current divid

            $("#" + currDivID).prop("disabled", false).removeClass("prohibited");
            $("#" + currDivID).find("*").prop("disabled", false).removeClass("input[disabled]");
            $("#" + currDivID).find("code").removeClass("disabled-code");
            $(currSubmitID).prop("disabled", false);
        }
        // clear feedback field
        $(this.feedbackDiv).remove();
    }

    updatePrompts(){
        // create and render all input fields in question group
        this.genPromptsNAnswer();
        for (let i = 0; i < this.num_q_in_group; i++) {
            this.textNodes[i].text(this.promptList[i]);
        }
        // create another feedback div
        this.feedbackDiv = $("<div>").attr("id", this.divid + "_feedback");
        this.containerDiv.append(this.feedbackDiv);
    }

    checkThisAnswers(i) {
        this.feedback_msg = []; // clear feedback_msg
        this.correct = true; // init answer first as true, only update when incorrect choice occurs
        this.wrongPF = false; // init all answer as correct
        this.wrongCM = false; // init all answer as correct
        this.wrongDB = false; // init all answer as correct
        this.incompleteAnswer = false;
        var currAnswer = null;

        for (let j = 0; j < 3; j++) {
            if (this.inputNodes[i][j][0].is(":checked")) { // when user chose YES
                currAnswer = true;
            } else if (this.inputNodes[i][j][1].is(":checked")) { // when user chose NO
                currAnswer = false;
            } else { // when user chose nothing
                currAnswer = "";
                this.correct = false;
                this.incompleteAnswer = true;
                break;
            }

            if ((currAnswer !== this.answerList[i][j])) {
                var btnName = this.divid + 'YN' + i + this.fieldID[j];
                $('input[type="radio"][name="' + btnName + '"]').addClass('highlightWrong');
                this.correct = false;
                if (j === 0) {
                    this.wrongPF = true;
                }
                if (j === 1) {
                    this.wrongCM = true;
                } 
                if (j === 2) {
                    this.wrongDB = true;
                }
            }
        }

        if (this.correct === false) {
            this.feedback_msg.push("&bull;" + " For question <b>" + String.fromCharCode((i + 97)) + "</b>" + ", "); 
            if (this.incompleteAnswer === true) {
                this.feedback_msg.push($.i18n("msg_VO_imcomplete_answer"));
            } else {
                if (this.wrongPF === true) {
                    this.feedback_msg.push($.i18n("msg_VO_wrong_pf"));
                }
                if (this.wrongCM === true) {
                    this.feedback_msg.push($.i18n("msg_VO_wrong_cm"));
                }
                if (this.wrongDB === true) {
                    this.feedback_msg.push($.i18n("msg_VO_wrong_db"));
                }
            }
        } else {
            this.disableThisRow(i);
            this.feedback_msg.push($.i18n("msg_VO_correct"));
        }
        this.renderFeedback();
    }

    renderFeedback() {
        var l = this.feedback_msg.length;
        var feedback_html = "";
        // format the feedback div w/ line break 
        for (let i = 0; i < l; i++) {
            feedback_html += "<dev>" + this.feedback_msg[i] + "</dev>";
            if (i < (this.feedback_msg.length - 1)) {
                feedback_html += "<br/>";
            }
        }
        // set the background color of feedback divid
        if (this.correct === true) {
            $(this.feedbackDiv).attr("class", "alert alert-info");
        } else {
            $(this.feedbackDiv).attr("class", "alert alert-danger");
        }
        
        this.feedbackDiv.html(feedback_html);
        this.displayFeedback();
        
        if (typeof MathJax !== "undefined") {
            this.queueMathJax(document.body);
        }
    }

    renderLoadEffectiveAddress() {
        var reg1 = null, reg2 = null;
        var randVal = Math.random();
        if (randVal < (1/4)) {
            return this.pick(this.offsets) + "(" + this.pick(this.registers) + ")";
        } else if (randVal < (1/2)) {
            reg1 = this.pick(this.registers);
            do {
                reg2 = this.pick(this.registers);
            } while (reg1 === reg2);
            return "(" + reg1 + ", " +  reg2 + ")";
        } else if (randVal < (3/4)) {
            reg1 = this.pick(this.registers);
            do {
                reg2 = this.pick(this.registers);
            } while (reg1 === reg2);
            return "(" + reg1 + ", " + reg2 + ", " + this.pick(["2", "4", "8"]) + ")";
        } else {
            return this.pick(["0x20", "0x40", "0x80"]) + "(, " + this.pick(this.registers) + ", " + this.pick(["2", "4", "8"]) + ")";
        }
    }

    renderVOFeedbackDiv() {
        this.containerDiv.append("<br>");
        this.containerDiv.append(this.feedbackDiv);
    }

    // render presentation of a constant based on language
    renderConstant() {
        var myVal = Math.floor(Math.random() * this.constRange).toString();
        if (this.architecture === "IA32") {
            return "$" + myVal;
        } else if (this.architecture === "ARM64") {
            if (Math.random() < 0.5) {return "#" + myVal.toString(16);}
            else {return "#" + myVal;}
        }
    }

    // render presentation of memory access based on language
    renderMemAccess() {
        var reg1 = null, reg2 = null;
        if (this.architecture === "IA32") {
            return this.pick(this.offsets) + "(" + this.pick(this.registers) + ")";
        } else if (this.architecture === "ARM64") {
            if (this.pair === true) {
                return "[" + this.pick(this.registers) + "]";
            } else {
                var randVal = Math.random();
                if (randVal < (1/3)) {
                    return "[sp, " + this.pick(this.offsets) + "]";
                } else if (randVal < (2/3)) {
                    return "[" + this.pick(this.registers)  + ", " + this.pick(this.offsets) + "]";
                } else {
                    return "[" + this.pick(this.registers) + "]";
                }
            }
        }
    }

    // render presentation of registers based on language
    renderRegister() {
        var reg1 = null, reg2 = null;
        if (this.pair === true) {
            reg1 = this.pick(this.registers);
            do {
                reg2 = this.pick(this.registers);
            } while (reg1 === reg2);
            return reg1 + ", " + reg2;
        } else {
            return this.pick(this.registers);
        }
    }

    pick(myList) { // randomly pick one item in list
        const randIdx = Math.floor(Math.random() * (myList.length));
        return myList[randIdx];
    }

    disableThisRow(i) { // disable elements of correct row
        var currDivID = this.divid + "div" + i; // index into the current div
        var currSubmitID = this.divid + "submit" + i; // index into the submit button in the current divid

        $("#" + currDivID).prop("disabled", true).addClass("prohibited");
        $("#" + currDivID).find("*").prop("disabled", true).addClass("input[disabled]");
        $("#" + currDivID).find("code").addClass("disabled-code");
        $(currSubmitID).prop("disabled", true);
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
    recordAnswered() {
        this.isAnswered = true;
    }
    hideFeedback() {
        $(this.feedbackDiv).css("visibility", "hidden");
    }
    displayFeedback() {
        $(this.feedbackDiv).css("visibility", "visible");
    }
        // log the answer and other info to the server (in the future)
    async logCurrentAnswer(sid) {

        this.answer = []

        let answer = JSON.stringify(this.inputNodes.flat().forEach(e =>
            { 
                e.forEach( i => {
                    this.answer.push(i[0].value)
                })

            }));
        let feedback = true;

        this.answer = answer

        // Save the answer locally.
        this.setLocalStorage({
            answer: answer,
            timestamp: new Date(),
        });
        let data = {
            event: "vo",
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
}

/*=================================
== Find the custom HTML tags and ==
==   execute our code on them    ==
=================================*/
$(document).on("runestone:login-complete", function () {
    $("[data-component=vo]").each(function (index) {
        var opts = {
            orig: this,
            useRunestoneServices: eBookConfig.useRunestoneServices,
        };
        if ($(this).closest("[data-component=timedAssessment]").length == 0) {
            // If this element exists within a timed component, don't render it here
            try {
                VOList[this.id] = new VO(opts);
            } catch (err) {
                console.log(
                    `Error rendering Virtual Memory Operations Problem ${this.id}
                     Details: ${err}`
                );
            }
        }
    });
});

