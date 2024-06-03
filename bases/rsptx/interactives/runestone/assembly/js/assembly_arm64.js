// *********
// assembly_arm64.js
// *********
// This file contains the JS for the Runestone virtual memory component. It was created By Luyuan Fan, Zhengfei Li, and Yue Zhang, 06/01/2023
"use strict";

import RunestoneBase from "../../common/js/runestonebase.js";
import ARM64_OPS from "./arch_generate.js"
import "./vo-i18n.en.js";
import "../css/vo.css";
// import { Pass } from "codemirror";
// import { validLetter } from "jexcel";

export var VOList = {}; // Object containing all instances of VO that aren't a child of a timed assessment.

class InstructionsFamily {
    constructor(mainWeight, oddsArr, insArr) {
        if (oddsArr.length !== 3) {
            throw new Error("BAD ARR");
        }
        this.mainWeight = mainWeight;
        this.odds = {
            correct: oddsArr[0],
            bad_ct: oddsArr[1], // wrong number of ops
            bad_type: oddsArr[2] // memory register values mixup
        }
        this.instructions = insArr;
    }
}

class ArchInstructions {
    constructor() {
        this.mem_ops        = null;
        this.arch_ops       = null;
        this.arith_unary    = null;
        this.arith_binary   = null;
        this.bit_ops        = null;
        this.offsets        = null;
        this.registers      = this.generateRegisters();
    }

    generateRegisters() {
        return [];
    }

    pick_fam(odds) {
        const total = odds.reduce((sum, a) => sum + a, 0);
        let seed = 0;
        while (seed === 0){
            seed = Math.random() * total;
        }// not possible to pick 0 weights events
        let sum = 0;

        for (let i = 0; i < odds.length; i++) {
            sum += odds[i];
            if (seed < sum) {
                return i;
            }
        }
        return 0;

    }

    pick_op(family)

    generate_question_params(mem_arch, arith, bit) {
        odds = [
            mem_arch ? this.mem_ops.mainWeight      : 0,
            mem_arch ? this.arch_ops.mainWeight     : 0,
            arith    ? this.arith_unary.mainWeight  : 0,
            arith    ? this.arith_binary.mainWeight : 0,
            bit      ? this.bit_ops.mainWeight      : 0,
        ]
        let family;
        const index = this.pick_fam(odds);
        switch (index) {
            case 0: return this.mem_ops;
            case 1: return this.arch_ops;
            case 2: return this.arith_unary;
            case 3: return this.arith_binary;
            case 4: return this.bit_ops;
            default: throw new Error("Invalid operation index");
        }
    }

}


class ARM64_OPS extends ArchInstructions {
    constructor() {
        super();
        this.mem_ops        = new InstructionsFamily(15, [40, 40, 20], ["mov"]),
        this.arm_ops        = new InstructionsFamily(15, [40, 40, 20], ["ldr", "str"]),
        this.arith_unary    = new InstructionsFamily(20, [40, 30, 30], ["neg", "mvn"]),
        this.arith_binary   = new InstructionsFamily(30, [35, 35, 30], ["add", "sub", "and", "orr", "eor"]),
        this.bit_ops        = new InstructionsFamily(20, [35, 35, 30], ["lsl", "lsr", "asr"]),
        this.registers      = this.generateRegisters();
        this.offsets        = ["#8", "#16", "#32"];
    }

    generateRegisters() {
        // this.registers = [];
        // this.registers_64bits = [];
        // this.registers_32bits = [];
        // for (let i = 0; i < 29; i++) {
        //     this.registers_64bits.push("x" + i.toString());
        //     this.registers_32bits.push("w" + i.toString());
        // }
        
        let registers = [];
        for (let i = 0; i < 29; i++) {
            registers.push("x" + i.toString());
        }
        return registers;

    }
    

}


class IA32_OPS {
    constructor() {
        this.mem_ops = new InstructionsFamily(15, [40, 40, 20], ["mov"]);
        this.stack_ops = new InstructionsFamily(15, [40, 40, 20], ["push", "pop"]);
        this.arith_unary = new InstructionsFamily(20, [40, 30, 30], ["neg", "not"]);
        this.arith_binary = new InstructionsFamily(30, [35, 35, 30], ["add", "sub", "and", "or", "xor"]);
        this.bit_ops = new InstructionsFamily(20, [35, 35, 30], ["shl", "shr", "sar"]);
        this.registers = this.generateRegisters();
        this.offsets = ["8", "16", "32"];
    }

    generateRegisters() {
        let registers = [];
        const regPrefixes = ['e', ''];
        const regSuffixes = ['ax', 'bx', 'cx', 'dx', 'si', 'di', 'bp', 'sp'];

        regPrefixes.forEach(prefix => {
            regSuffixes.forEach(suffix => {
                registers.push(prefix + suffix);
            });
        });

        return registers;
    }

    pick_op(mem, arith, bit) {
        const odds = [
            mem ? this.mem_ops.mainWeight : 0,
            mem ? this.stack_ops.mainWeight : 0,
            arith ? this.arith_unary.mainWeight : 0,
            arith ? this.arith_binary.mainWeight : 0,
            bit ? this.bit_ops.mainWeight : 0,
        ];

        // Calculate the total sum of the odds
        const total = odds.reduce((psum, a) => psum + a, 0);

        // Generate a random number between 0 and the total sum of the odds
        const random = Math.random() * total;

        // Iterate through the odds to determine which option to pick
        let cumulativeSum = 0;
        for (let i = 0; i < odds.length; i++) {
            cumulativeSum += odds[i];
            if (random < cumulativeSum) {
                return i;
            }
        }

        // In case of any rounding errors, return the last index
        return odds.length - 1;
    }

    getRandomInstruction(mem, arith, bit) {
        const index = this.pick_op(mem, arith, bit);
        let family;
        switch (index) {
            case 0:
                family = this.mem_ops;
                break;
            case 1:
                family = this.stack_ops;
                break;
            case 2:
                family = this.arith_unary;
                break;
            case 3:
                family = this.arith_binary;
                break;
            case 4:
                family = this.bit_ops;
                break;
            default:
                throw new Error("Invalid operation index");
        }
        const instruction = family.instructions[Math.floor(Math.random() * family.instructions.length)];
        return instruction;
    }
}

// Example usage:
// const ia32Ops = new IA32_OPS();
// console.log(ia32Ops.getRandomInstruction(true, true, true)); // Random instruction from all categories
// console.log(ia32Ops.getRandomInstruction(true, false, false)); // Random memory or stack operation instruction
// console.log(ia32Ops.getRandomInstruction(false, true, true)); // Random arithmetic or bit operation instruction



// VO constructor
export default class 
 extends RunestoneBase {
    constructor(opts) {
        super(opts);
        var orig = opts.orig; // entire <p> element
        this.useRunestoneServices = opts.useRunestoneServices;
        this.origElem = orig;
        this.divid = orig.id;

        this.createVOElement();
        this.caption = "Virtual Memory Operations";
        this.addCaption("runestone");
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
        this.renderVOCheckBoxes();
        this.renderVOInputField();
        this.renderVOButtons();
        this.renderVOFeedbackDiv();
        // replaces the intermediate HTML for this component with the rendered HTML of this component
        $(this.origElem).replaceWith(this.containerDiv);
    }

    initParams() {
        this.setDefaultParams();
        this.setCustomizedParams();
        this.containerDiv = $("<div>").attr("id", this.divid);
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
        if (currentOptions["arch"] != undefined) {
            this.architecture = currentOptions["arch"];
        }


        // Set instruction types based on selected checkboxes
        const selectedInstructionTypes = [];
        if ($(`#${this.divid}_arithmetic`).is(":checked")) {
            selectedInstructionTypes.push("arithmetic");
        }
        if ($(`#${this.divid}_bitmanipulation`).is(":checked")) {
            selectedInstructionTypes.push("bitmanipulation");
        }
        if ($(`#${this.divid}_memorymanipulation`).is(":checked")) {
            selectedInstructionTypes.push("memorymanipulation");
        }

        if (this.architecture === "IA32") {
            // declare all IA32 elements for the prompt
            // add operators based on selected types
            this.arthm_operators = ["addl", "subl", "imull", "sall", "sarl", "shrl", "xorl", "andl", "orl"];
            this.mem_operators = ["movl"];
            this.mem_operators = ["movl"];
            this.registers = ["%eax", "%ecx", "%edx", "%ebx", "%esi", "%edi"];
            this.offsets = ["-0x8", "0x8", "8", "4", "-0x4", "0x4", ""];
        } else if (this.architecture === "ARM64") {
            this.weightsArm64 = {
                mem_ops:        new Weights(15, [40, 40, 20]),
                arm_ops:        new Weights(15, [40, 40, 20]),
                arith_unary:    new Weights(20, [40, 30, 30]),
                arith_binary:   new Weights(30, [35, 35, 30]),
                bit_ops:        new Weights(20, [35, 35, 30]),
            };
            this.mem_ops = ["mov"];
            this.arm_ops = ["ldr", "str"];
            this.arith_unary = ["neg", "mvn"];
            this.arith_binary = ["add", "sub", "and", "orr", "eor"];
            // this.arith_binary = ["add", "sub", "and", "orr", "eor", "mul", "udiv", "sdiv"];
            this.bit_ops = ["lsl", "lsr", "asr"];
            
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
    

    renderVOCheckBoxes() {
        const instructionTypes = [
            { label: 'Arithmetics', value: 'arithmetic' },
            { label: 'Bit Operations', value: 'bitmanipulation' },
            { label: 'Memory Manipulation', value: 'memorymanipulation' }
        ];
    
        const instructionTypeDiv = $("<div>").attr("id", this.divid + "_instruction_types");
        instructionTypeDiv.append($("<h4>").text("Select Instruction Types:"));
    
        instructionTypes.forEach(type => {
            const checkbox = $("<input>").attr({
                type: "checkbox",
                id: this.divid + "_" + type.value,
                value: type.value
            });
            const label = $("<label>").attr("for", this.divid + "_" + type.value).text(type.label);
            instructionTypeDiv.append(checkbox).append(label).append(" ");
        });

        this.containerDiv.append(instructionTypeDiv).append("<br>");
    }

    renderVOInputField() {
        this.instruction = $("<div>").html(
            "For each of the following " + 
            this.architecture + 
            " instructions, if the syntax is <b>valid</b> or <b>invalid</b>");
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

            this.radioButtons = [];
            // create and render page fault, cache miss, dirty bit answer fields
            for (let j = 0; j < 3; j++) {
                this.newDiv.append(this.fieldList[j]);
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
                this.newDiv.append(lblYes);
                this.newDiv.append(btnYes);
                this.newDiv.append(lblNo);
                this.newDiv.append(btnNo);
                if (j !== 2) { 
                    this.newDiv.append(" | ");
                    this.newDiv.append(document.createTextNode( '\u00A0' ));
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
                .on("click", function() {
                    this.checkThisAnswers(i);
                    this.logCurrentAnswer();
                }.bind(this));
            this.submitButton.addClass("button-check checkingbutton");
            this.newDiv.append(this.submitButton);
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
            this.generateQuestionARM64();
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
                // if the current selected operator is not repeated within operator list
                // we reselect operator randomly while operatorList still contains the selected operator
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
        let answer = JSON.stringify(this.inputNodes);
        let feedback = true;
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
    $("[data-component=assembly_arm64]").each(function (index) {
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
