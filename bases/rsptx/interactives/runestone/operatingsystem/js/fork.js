// *********
// fork.js
// *********
// This file contains the JS for the Runestone virtual memory component. It was created By Luyuan Fan, Zhengfei Li, and Yue Zhang, 06/01/2023
"use strict";

import RunestoneBase from "../../common/js/runestonebase.js";
import "./fork-i18n.en.js";
import "../css/fork.css";
// import { Node, genRandSourceCode } from './fork_algorithm.js';
import * as forking from './fork_algorithm.js';
import { Pass } from "codemirror";
import { validLetter } from "jexcel";

export var ForkList = {}; // Object containing all instances of Fork that aren't a child of a timed assessment.

// Fork constructor
export default class Fork extends RunestoneBase {
    constructor(opts) {
        super(opts);
        var orig = opts.orig; // entire <p> element
        this.useRunestoneServices = opts.useRunestoneServices;
        this.origElem = orig;
        this.divid = orig.id;

        this.createForkElement();
        this.caption = "Processes and forking";
        this.addCaption("runestone");

        // this.checkServer("fork", true);
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
    // Create the Fork Element
    createForkElement() {
        this.initParams(); // init all
        this.renderForkInputField();
        // this.renderForkButtons();
        // this.renderForkFeedbackDiv();
        // replaces the intermediate HTML for this component with the rendered HTML of this component
        $(this.origElem).replaceWith(this.containerDiv);
    }

    initParams() {
        this.printContent = "a";
    }

    renderForkInputField() {
        this.containerDiv = $("<div>").attr("id", this.divid);
        this.instruction = $("<div>").html(
            "For the code snippet shown below (assume  that all the calls to <code>fork()</code> succeed," + 
            "answer how many letters the process prints out with <code>printf()</code>."
        );
        this.statementDiv = $("<div>").append(this.instruction);

        this.genPromptsNAnswer();
        
        this.inputDiv = $("<div>").addClass("input-div");

        this.rightDiv = $("<div>").addClass("right-div-inline");
        this.prompt = $("<div>").html("How many times will <code>" + this.printContent + "</code> print?");
        this.inputBox = $("<input>").attr('placeholder','Enter your answer here');
        this.rightDiv.append(this.prompt);
        this.rightDiv.append(this.inputBox);

        this.codeDiv = $("<div>").addClass("code-div-inline");
        this.codeDiv.append(this.cCode);
        // copy the original elements to the container holding what the user will see.
        $(this.origElem).children().clone().appendTo(this.containerDiv);
        
        this.statementDiv.addClass("statement-box");

        // create a feedback div, will be removed in clear and added back when generate another question
        this.feedbackDiv = $("<div>").attr("id", this.divid + "_feedback");

        // remove the script tag.
        // this.scriptSelector(this.containerDiv).remove();

        // ***div STRUCTURE***:
        this.containerDiv.append(this.statementDiv);
        this.inputDiv.append(this.codeDiv);
        this.inputDiv.append(this.rightDiv);
        this.containerDiv.append(this.inputDiv);
        this.containerDiv.append(this.tree);
        this.containerDiv.append(this.source);
    }

    genPromptsNAnswer() {

        this.source = forking.genRandSourceCode(3, 4, this.printContent);
        this.cCode = forking.transpileToC(this.source);
        this.tree = forking.printTree();
    }

    // renderOnePrompt() { // render one prompt based on source prompt, which is this.memAccess, this.src, and this.dest
    //     this.operator = null;
    //     this.pair = false;
        
    //     if (this.memAccess === "lea") {
    //         var ret = this.renderLoadEffectiveAddress();
    //         return "leal" + " " + ret;
    //     }
    //     else {
    //         // render the operator
    //         if (this.memAccess === false) {
    //             this.operator = this.pick(this.arthm_operators);
    //             while (this.has(this.operator)) {
    //                 this.operator = this.pick(this.arthm_operators);
    //             }
    //             this.operatorList.push(this.operator);
    //         } else {
    //             this.operator = this.pick(this.mem_operators);
    //         }

    //         // render all other
    //         if (this.architecture === "IA32") {
    //             if (this.src === "reg") { // this.src is register
    //                 this.src = this.renderRegister();
    //             } else if (this.src === "mem") { // this.src is memory
    //                 this.src = this.renderMemAccess();
    //             } else { // this.src is constant
    //                 this.src = this.renderConstant();
    //             }
    //             if (this.dest === "reg") { // this.dest is register 
    //                 this.dest = this.renderRegister();
    //             } else { // this.dest is memory
    //                 this.dest = this.renderMemAccess();
    //             }
    //             return this.operator + " " + this.src + ", " + this.dest;
    //         }
    //         else if (this.architecture === "ARM64") {
    //             // determine the number of accessed bits in register, 32 bits or 64 bits
    //             if (Math.random() < 0.5) {this.registers = this.registers_32bits;} 
    //             else {this.registers = this.registers_64bits;}

    //             if (this.memAccess === false) {
    //                 if (this.operator === "mov") {
    //                     this.src = this.renderRegister();
    //                     this.dest = this.renderRegister();
    //                 } else {
    //                     if (Math.random() < 0.5) {
    //                         this.op1 = this.renderRegister();
    //                     } else {
    //                         this.op1 = this.renderConstant();
    //                     }
    //                     this.op2 = this.renderRegister();
    //                     this.src = this.op1 + ", " + this.op2;
    //                     this.dest = this.renderRegister();
    //                 }
    //             } else {
    //                 if (this.operator === "ldp" || this.operator == "stp") {
    //                     this.pair = true;
    //                 }
    //                 this.dest = this.renderRegister();
    //                 this.src = this.renderMemAccess();   
    //             }
    //             return this.operator + " " + this.dest + ", " + this.src;
    //         }
    //     }
    // }

    // has (o) {
    //     for (let i = 0; i < this.operatorList.length; i++) {
    //         if (this.operatorList[i] === o) {
    //             return true;
    //         }
    //     }
    //     return false;
    // }

    renderForkButtons() {
        this.generateButton = document.createElement("button");
        this.generateButton.textContent = $.i18n("msg_fork_generate_another");
        $(this.generateButton).attr({
            class: "btn btn-success",
            name: "generate a new question",
            type: "button",
            id: this.divid + "submit",
        });
        this.generateButton.addEventListener("click", () => {
            this.cleanInputNFeedbackField(); // clear answers, clear prev feedback, and enable all for the input fields
            this.updatePrompts();
        });

        this.revealTreeButton = document.createElement("button");
        this.revealTreeButton.textContent = $.i18n("msg_fork_reveal_tree");
        $(this.revealTreeButton).attr({
            class: "btn btn-success",
            name: "draw hierarchy tree",
            type: "button",
            id: this.divid + "draw_tree",
        });
        this.revealTreeButton.addEventListener("click", () => {
            this.cleanInputNFeedbackField(); // clear answers, clear prev feedback, and enable all for the input fields
            this.updatePrompts();
        });

        this.containerDiv.append("<br>");
        this.containerDiv.append(this.generateButton);
        this.containerDiv.append(this.revealTreeButton);
    }

    cleanInputNFeedbackField () {
        // // clear all previous selection
        // $('input[type="radio"]').prop('checked', false);

        // // enable all previously disabled element
        // for (let h = 0; h < this.num_q_in_group; h++) {
        //     var currDivID = this.divid + "div" + h; // index into the current div
        //     var currSubmitID = this.divid + "submit" + h; // index into the submit button in the current divid

        //     $("#" + currDivID).prop("disabled", false).removeClass("prohibited");
        //     $("#" + currDivID).find("*").prop("disabled", false).removeClass("input[disabled]");
        //     $("#" + currDivID).find("code").removeClass("disabled-code");
        //     $(currSubmitID).prop("disabled", false);
        // }

        // clear feedback field
        $(this.feedbackDiv).remove();
    }

    updatePrompts(){
        // create and render all input fields in question group
        this.genPromptsNAnswer();
        // for (let i = 0; i < this.num_q_in_group; i++) {
        //     this.textNodes[i].text(this.promptList[i]);
        // }

        // create another feedback div
        this.feedbackDiv = $("<div>").attr("id", this.divid + "_feedback");
        this.containerDiv.append(this.feedbackDiv);
    }

    checkThisAnswers(i) {
        // this.feedback_msg = []; // clear feedback_msg
        // this.correct = true; // init answer first as true, only update when incorrect choice occurs
        // // this.wrongPF = false; // init all answer as correct
        // // this.wrongCM = false; // init all answer as correct
        // // this.wrongDB = false; // init all answer as correct
        // this.incompleteAnswer = false;
        // var currAnswer = null;

        // // for (let j = 0; j < 3; j++) {
        // //     if (this.inputNodes[i][j][0].is(":checked")) { // when user chose YES
        // //         currAnswer = true;
        // //     } else if (this.inputNodes[i][j][1].is(":checked")) { // when user chose NO
        // //         currAnswer = false;
        // //     } else { // when user chose nothing
        // //         currAnswer = "";
        // //         this.correct = false;
        // //         this.incompleteAnswer = true;
        // //         break;
        // //     }

        // //     if ((currAnswer !== this.answerList[i][j])) {
        // //         var btnName = this.divid + 'YN' + i + this.fieldID[j];
        // //         $('input[type="radio"][name="' + btnName + '"]').addClass('highlightWrong');
        // //         this.correct = false;
        // //         if (j === 0) {
        // //             this.wrongPF = true;
        // //         }
        // //         if (j === 1) {
        // //             this.wrongCM = true;
        // //         } 
        // //         if (j === 2) {
        // //             this.wrongDB = true;
        // //         }
        // //     }
        // // }

        // // if (this.correct === false) {
        // //     this.feedback_msg.push("&bull;" + " For question <b>" + String.fromCharCode((i + 97)) + "</b>" + ", "); 
        // //     if (this.incompleteAnswer === true) {
        // //         this.feedback_msg.push($.i18n("msg_Fork_imcomplete_answer"));
        // //     } else {
        // //         if (this.wrongPF === true) {
        // //             this.feedback_msg.push($.i18n("msg_Fork_wrong_pf"));
        // //         }
        // //         if (this.wrongCM === true) {
        // //             this.feedback_msg.push($.i18n("msg_Fork_wrong_cm"));
        // //         }
        // //         if (this.wrongDB === true) {
        // //             this.feedback_msg.push($.i18n("msg_Fork_wrong_db"));
        // //         }
        // //     }
        // // } else {
        // //     this.disableThisRow(i);
        // //     this.feedback_msg.push($.i18n("msg_Fork_correct"));
        // // }
        // this.renderFeedback();
    }

    renderFeedback() {
        // var l = this.feedback_msg.length;
        // var feedback_html = "";
        // // format the feedback div w/ line break 
        // for (let i = 0; i < l; i++) {
        //     feedback_html += "<dev>" + this.feedback_msg[i] + "</dev>";
        //     if (i < (this.feedback_msg.length - 1)) {
        //         feedback_html += "<br/>";
        //     }
        // }
        // // set the background color of feedback divid
        // if (this.correct === true) {
        //     $(this.feedbackDiv).attr("class", "alert alert-info");
        // } else {
        //     $(this.feedbackDiv).attr("class", "alert alert-danger");
        // }
        
        // this.feedbackDiv.html(feedback_html);
        // this.displayFeedback();
        
        if (typeof MathJax !== "undefined") {
            this.queueMathJax(document.body);
        }
    }

    // renderLoadEffectiveAddress() {
    //     var reg1 = null, reg2 = null;
    //     var randVal = Math.random();
    //     if (randVal < (1/4)) {
    //         return this.pick(this.offsets) + "(" + this.pick(this.registers) + ")";
    //     } else if (randVal < (1/2)) {
    //         reg1 = this.pick(this.registers);
    //         do {
    //             reg2 = this.pick(this.registers);
    //         } while (reg1 === reg2);
    //         return "(" + reg1 + ", " +  reg2 + ")";
    //     } else if (randVal < (3/4)) {
    //         reg1 = this.pick(this.registers);
    //         do {
    //             reg2 = this.pick(this.registers);
    //         } while (reg1 === reg2);
    //         return "(" + reg1 + ", " + reg2 + ", " + this.pick(["2", "4", "8"]) + ")";
    //     } else {
    //         return this.pick(["0x20", "0x40", "0x80"]) + "(, " + this.pick(this.registers) + ", " + this.pick(["2", "4", "8"]) + ")";
    //     }
    // }

    renderForkFeedbackDiv() {
        this.containerDiv.append("<br>");
        this.containerDiv.append(this.feedbackDiv);
    }

    // // render presentation of a constant based on language
    // renderConstant() {
    //     var myVal = Math.floor(Math.random() * this.constRange).toString();
    //     if (this.architecture === "IA32") {
    //         return "$" + myVal;
    //     } else if (this.architecture === "ARM64") {
    //         if (Math.random() < 0.5) {return "#" + myVal.toString(16);}
    //         else {return "#" + myVal;}
    //     }
    // }

    // // render presentation of memory access based on language
    // renderMemAccess() {
    //     var reg1 = null, reg2 = null;
    //     if (this.architecture === "IA32") {
    //         return this.pick(this.offsets) + "(" + this.pick(this.registers) + ")";
    //     } else if (this.architecture === "ARM64") {
    //         if (this.pair === true) {
    //             return "[" + this.pick(this.registers) + "]";
    //         } else {
    //             var randVal = Math.random();
    //             if (randVal < (1/3)) {
    //                 return "[sp, " + this.pick(this.offsets) + "]";
    //             } else if (randVal < (2/3)) {
    //                 return "[" + this.pick(this.registers)  + ", " + this.pick(this.offsets) + "]";
    //             } else {
    //                 return "[" + this.pick(this.registers) + "]";
    //             }
    //         }
    //     }
    // }

    // // render presentation of registers based on language
    // renderRegister() {
    //     var reg1 = null, reg2 = null;
    //     if (this.pair === true) {
    //         reg1 = this.pick(this.registers);
    //         do {
    //             reg2 = this.pick(this.registers);
    //         } while (reg1 === reg2);
    //         return reg1 + ", " + reg2;
    //     } else {
    //         return this.pick(this.registers);
    //     }
    // }

    // pick(myList) { // randomly pick one item in list
    //     const randIdx = Math.floor(Math.random() * (myList.length));
    //     return myList[randIdx];
    // }

    // disableThisRow(i) { // disable elements of correct row
    //     var currDivID = this.divid + "div" + i; // index into the current div
    //     var currSubmitID = this.divid + "submit" + i; // index into the submit button in the current divid

    //     $("#" + currDivID).prop("disabled", true).addClass("prohibited");
    //     $("#" + currDivID).find("*").prop("disabled", true).addClass("input[disabled]");
    //     $("#" + currDivID).find("code").addClass("disabled-code");
    //     $(currSubmitID).prop("disabled", true);
    // }

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
        let answer = JSON.stringify(this.inputNodes);
        let feedback = true;
        // Save the answer locally.
        this.setLocalStorage({
            answer: answer,
            timestamp: new Date(),
        });
        let data = {
            event: "Fork",
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
    $("[data-component=fork]").each(function (index) {
        var opts = {
            orig: this,
            useRunestoneServices: eBookConfig.useRunestoneServices,
        };
        if ($(this).closest("[data-component=timedAssessment]").length == 0) {
            // If this element exists within a timed component, don't render it here
            try {
                ForkList[this.id] = new Fork(opts);
            } catch (err) {
                console.log(
                    `Error rendering Forking Problem ${this.id}
                     Details: ${err}`
                );
            }
        }
    });
});

