// *********
// numconv.js
// *********
// This file contains the JS for the Runestone numberconversion component. It was created By Luyuan Fan, Zhengfei Li, and Yue Zhang, 06/01/2023
"use strict";


import RunestoneBase from "../../common/js/runestonebase.js";
import am_x86 from "./AM_ISAs/am_x86class.js";
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
        this.arch = new am_x86();
        this.MAarray = [];
        this.checkButtonsDict = {};
        
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



        this.questions = [];
        this.answers = [];
        this.feedback_msg = ["", "", "", ""];

        const largeOl = document.createElement("ol")

        this.generateAnswer();
        this.questions.map((q,i)=>{

            const index = i

            const li = document.createElement('li')
            
            const codeDiv = document.createElement('div')
            
            const registerData = this.generateRegisterState(i)
            codeDiv.innerHTML = (registerData.names[0] == "rax") ?
            `<ul> <li> <code class="modeCode">${q.code}</code> </li>`+
            `<li> <em>rax</em>: <m>${registerData.values[0]}</m>; <em>rcx</em>: <m>${registerData.values[1]}</m>; </li>`
            +`</ul>` :
            `<ul> <li> <code class="modeCode">${q.code}</code> </li>`+
            `<li> <em>rax</em>: <m>${registerData.values[1]}</m>; <em>rcx</em>: <m>${registerData.values[0]}</m>; </li>`
            +`</ul>`;
            
            codeDiv.style = "font-size: large;"
            li.append(codeDiv)

            
            li.append(document.createElement("br"))

            const answerTable = document.createElement("div")
            answerTable.className = "tables-container"
            const tableWrapper = document.createElement("div")
            tableWrapper.className = "table-wrapper"
    
            const table = document.createElement("table")
            table.class = "register-table"
    
            const tableHeadRow = document.createElement("tr")
            tableHeadRow.innerHTML = "<th>Memory Access?</th> <th> Read or Write </th> <th>Address Value</th> <th>Check Answer</th>"
            table.append(tableHeadRow)
    

            const tableRow2 = document.createElement("tr")



            const maTd = document.createElement("td")
            const rwTd = document.createElement("td")
            const iTd = document.createElement("td")
            const checkTd = document.createElement("td")

            
            //radio buttons
            const rYesMA = document.createElement("input")
            rYesMA.type = "radio"
            rYesMA.className = `radioMAYes${i}`
            rYesMA.value = `radioMAYes${i}`
            rYesMA.name = `ma${i}`
            const rYesMALabel = document.createElement("label")
            rYesMALabel.setAttribute("for", `radioMAYes${i}`)
            rYesMALabel.textContent = "yes"

            const rNoMA = document.createElement("input")
            rNoMA.value = `radioNo${i}`
            rNoMA.type = "radio"
            rNoMA.className = `radioMANo${i}`
            rNoMA.name = `ma${i}`
            const rNoMALabel = document.createElement("label")
            rNoMALabel.setAttribute("for", `radioMANo${i}`)
            rNoMALabel.textContent = "no"

            maTd.append(rYesMA)
            maTd.append(rYesMALabel)
            maTd.append(document.createElement("br"))
            maTd.append(rNoMA)
            maTd.append(rNoMALabel)





            
            //memory access labels
            const rYesRW = document.createElement("input")
            rYesRW.type = "radio"
            rYesRW.className = `radioRWYes${i}`
            rYesRW.value = `radioRWYes${i}`
            rYesRW.name = `rw${i}`
            const rYesRWLabel = document.createElement("label")
            rYesRWLabel.setAttribute("for", `radioRWYes${i}`)
            rYesRWLabel.textContent = "Read"

            const rNoRW = document.createElement("input")
            rNoRW.value = `radioRWNo${i}`
            rNoRW.type = "radio"
            rNoRW.className = `radioRWNo${i}`
            rNoRW.name = `rw${i}`
            const rNoRWLabel = document.createElement("label")
            rNoRWLabel.setAttribute("for", `radioRWNo${i}`)
            rNoRWLabel.textContent = "Write"

            rwTd.append(rYesRW)
            rwTd.append(rYesRWLabel)
            rwTd.append(document.createElement("br"))
            rwTd.append(rNoRW)
            rwTd.append(rNoRWLabel)

            

            const input1 = document.createElement("input")
            input1.placeholder = "Address Value"
            iTd.append(input1)
            input1.className = `addressInput${i}`

            const cButton = document.createElement("button")
            cButton.textContent = "check answer"
            cButton.id = `check${i}`

            $(cButton).attr({
                class: "btn btn-success",
                name: "answer",
                type: "button",
            });



            checkTd.append(cButton)

            tableRow2.append(maTd)
            tableRow2.append(rwTd)
            tableRow2.append(iTd)
            tableRow2.append(checkTd)
            
            table.append(tableRow2)


            tableWrapper.append(table)
            answerTable.append(tableWrapper)
            li.append(answerTable)
            largeOl.append(li)


            const feedbackDiv = document.createElement("div")
            feedbackDiv.style = "display: none;"
            feedbackDiv.id = `feedbackDiv${i}`

            li.append(feedbackDiv)

            this.checkButtonsDict[`${cButton.id}`] = i
            
            cButton.addEventListener("click", (e)=>{
                console.log(this.checkButtonsDict)
                const index = this.checkButtonsDict[`${e.target.id}`]
                console.log(index)
                this.checkCurrentAnswer(index)
            })

            
            //adding event listeners



            rYesMA.addEventListener("click", e => {
                console.log("click")
                if(rYesMA.checked){
                    input1.style = "opacity: 1;"
                    input1.disabled = false;
                    rwTd.style = "opacity: 1;"
                    rwTd.disabled = false;

                    rNoRW.disabled = false;
                    rYesRW.disabled = false;
                    
                }
                
            })
            rNoMA.addEventListener("click", e => {
                console.log(this.MAarray, i)
                if(rNoMA.checked && this.MAarray[i] == "NAlea"){
                    rwTd.style = "opacity: 0.4;"
                    rwTd.disabled = true;

                    rNoRW.disabled = true;
                    rYesRW.disabled = true;


                }
                else if(rNoMA.checked){
                    input1.style = "opacity: 0.4;"
                    input1.disabled = true;
                    rwTd.style = "opacity: 0.4;"
                    rwTd.disabled = true;

                    rNoRW.disabled = true;
                    rYesRW.disabled = true;

                    rNoRW.checked = false
                    rYesRW.checked = false
                    input1.value = ""
                    
                }


            })

        })

        


        this.answerDiv.append(largeOl)
        this.containerDiv.append(this.answerDiv)
    }

    clearButtons(){
        this.generateButton.remove()
        // this.submitButton.remove()
    }

    recordAnswered() {
        this.isAnswered = true;
    }

    renderAMButtons() {
        // "check me" button and "generate a number" button
        // this.submitButton = document.createElement("button");
        // this.submitButton.textContent = $.i18n("Check Answer");
        // $(this.submitButton).attr({
        //     class: "btn btn-success",
        //     name: "answer",
        //     type: "button",
        // });
        // // check the answer when the conversion is valid
        // this.submitButton.addEventListener("click", () => {
        //     if(this.feedbackDiv){
        //         this.feedbackDiv.remove()
        //     }
        //     this.checkCurrentAnswer();
        //     this.logCurrentAnswer();
    
        // });

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
        // this.containerDiv.appendChild(this.submitButton);


    }



    // clear the input field
    clearAnswer() {
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
        this.instructionList = ["add", "mov"];
        this.genMov = 0;
        this.genAdd = 0;
        this.genLea = 0;

        let selectHistory = [];
        this.MAarray = [];
        let select;

        for (let i = 0; i<4; i++){
            select = Math.floor(Math.random()*3)
            if (i == 3 && !selectHistory.includes(2)){
                select = 2;
            }
            selectHistory.push(select);
            this.questions.push(this.generateCode(select));
        }

    }

    generateCode(select) {
        this.arch = new am_x86();
        let text;
        if(select == 0){
            text = this.generateRead();
        } else if (select == 1){
            text = this.generateWrite();
        } else {
            text = this.generateNoAccess();
        }

        return {code: text};
    }

    generateRead() {
        
        let ans;
        if(this.genMov == 0){
            ans = this.arch.ReadInstructions["mov"]();
            this.answers.push(ans);
            this.genMov++;
            this.MAarray.push("A");
            
        } else if (this.genAdd == 0) {
            ans = this.arch.ReadInstructions["add"]();
            this.answers.push(ans);
            this.genAdd++;
            this.MAarray.push("A");
        } else{
            const inst = this.instructionList[Math.floor(Math.random()*2)]
            ans = this.arch.ReadInstructions[inst]()
            this.answers.push(ans);
            this.MAarray.push("A");
        }

        const text = ans.code;
        return text;   
    }
    
    generateWrite() {

        let ans;

        if(this.genMov == 0){
            ans = this.arch.WriteInstructions["mov"]();
            this.answers.push(ans);
            this.genMov++;
            this.MAarray.push("A");
            
        } else if (this.genAdd == 0) {
            ans = this.arch.WriteInstructions["add"]();
            this.answers.push(ans);
            this.genAdd++;
            this.MAarray.push("A");
        } else{
            const inst = this.instructionList[Math.floor(Math.random()*2)]
            ans = this.arch.WriteInstructions[inst]()
            this.answers.push(ans);
            this.MAarray.push("A");
        }

        const text = ans.code;
        return text;

    }

    generateNoAccess() {
        let ans;
        if(this.genLea == 0){
            ans = this.arch.NAInstructions["lea"]();
            this.answers.push(ans);
            this.genLea++;
            this.MAarray.push("NAlea");
            
        } else if (this.genAdd == 0) {
            ans = this.arch.NAInstructions["add"]();
            this.answers.push(ans);
            this.genAdd++;
            this.MAarray.push("NA");
        } else if (this.genMov == 0) {
            ans = this.arch.NAInstructions["add"]();
            this.answers.push(ans);
            this.genMov++;
            this.MAarray.push("NA");
        } else{
            ans = this.arch.NAInstructions["lea"]()
            this.answers.push(ans);
            this.MAarray.push("NAlea");
        }
        const text = ans.code;
        return text;
    }

    generateRegisterState(index){
        const baseName = this.answers[index].baseReg;
        const offsetName = this.answers[index].offsetReg;
        const baseValDisplay = this.answers[index].baseVal;
        const offsetValDisplay = this.answers[index].offsetVal;
        
        return {names: [baseName, offsetName], values: [baseValDisplay, offsetValDisplay]}
    }
    
    // check if the answer is correct
    checkCurrentAnswer(index) {
        this.correct = false;
        
        // let linkISA = "x86_64";

        // if(this.archSelect == "X86_64"){
        //     linkISA = "x86_64"
        // }
        // else if(this.archSelect == "ia_32"){
        //     linkISA = "x86"
        // }
        // else if(this.archSelect == "arm_64"){
        //     linkISA = "arm64"
        // }
        // if(this.RAXInput.value == this.arch.rax && this.RCXInput.value == this.arch.rcx){
        //     this.correct = true;
        //     this.feedback_msg += $.i18n("msg_asm_correct");
        // } else{
        //     this.feedback_msg += $.i18n("msg_asm_incorrect");
        //     let asmLink = `https://asm.diveintosystems.org/arithmetic/${linkISA}/`
        //     // asmLink += this.codeBox.innerHTML.split("<br>").join("%0A").split(",").join("%2C").split("%").join("%25").split(":").join("%3A").split(' ').join("%20")
        //     asmLink += encodeURI(this.codeBox.innerHTML.split("<br>").join("\n"))
        //     asmLink += `/0/0/0/0/${this.rax}/${this.rcx}/0`
        //     console.log(asmLink)
        //     this.feedback_msg += `<a href='${asmLink}' target='_blank'> Try it in ASM Visualizer! </a>`
            
        // }
        const memCorrect = this.checkMemAccess(index);
        const RWCorrect = this.checkReadWrite(index);
        const addressCorrect = this.checkMemAddress(index);
        console.log(this.answers[index].answer);

        if(memCorrect == null || RWCorrect == null || addressCorrect == null){
            this.feedback_msg[index] = $.i18n("msg_asm_imcomplete_answer");
            this.renderFeedback(index);
            return 0;
        }

        if (memCorrect && RWCorrect && addressCorrect){
            this.correct = true;
            this.feedback_msg[index] = $.i18n("msg_asm_correct");
        } else if (!memCorrect){
            this.feedback_msg[index] = $.i18n("msg_asm_memIncorrect");
        } else if (!RWCorrect){
            this.feedback_msg[index] = $.i18n("msg_asm_RWIncorrect");
        } else if (!addressCorrect){
            this.feedback_msg[index] = $.i18n("msg_asm_memAddressIncorrect");
        }
        this.renderFeedback(index);
        return 0;
    }
    
    //checks whether there was memory access
    checkMemAccess(index){
        
        const yesBtn = this.answerDiv.getElementsByClassName(`radioMAYes${index}`)[0];
        const noBtn = this.answerDiv.getElementsByClassName(`radioMANo${index}`)[0];
        
        if(!yesBtn.checked&&!noBtn.checked){
            return null;
        }

        if(yesBtn.checked && this.MAarray[index] === "A"){
            return true;
        } else if (noBtn.checked && this.MAarray[index] != "A"){
            return true;
        } else {
            return false;
        }
    }

    //checks whether it was a read or a write
    checkReadWrite(index){

        if(this.MAarray[index] != "A"){
            return true;
        }
        const yesBtn = this.answerDiv.getElementsByClassName(`radioRWYes${index}`)[0];
        const noBtn = this.answerDiv.getElementsByClassName(`radioRWNo${index}`)[0];

        if(!yesBtn.checked&&!noBtn.checked){
            return null;
        }

        if(yesBtn.checked && this.answers[index].RW === "read"){
            return true;
        } else if (noBtn.checked && this.answers[index].RW === "write"){
            return true;
        } else {
            return false;
        }
    }
    
    //checks the user input to see if correct
    checkMemAddress(index){
        
        if(this.MAarray[index] == "NA"){
            return true;
        }

        let answer = this.answerDiv.getElementsByClassName(`addressInput${index}`)[0].value;
        console.log("input:" + answer);

        if (answer === "") {
            return null;
        } else if (answer == `0x${this.answers[index].answer}`){
            return true;
        } else if(answer == this.answers[index].answer){
            return true;
        } else{
            return false;
        }

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
    hideFeedback(index) {
        const feedbackDiv = document.getElementById(`feedbackDiv${index}`)
        feedbackDiv.style = "display: none"
        this.feedback_msg = ["", "", "", ""]
    }



    renderFeedback(index) {
        
        const idname = `feedbackDiv${index}`
        const feedbackDiv = document.getElementById(`feedbackDiv${index}`)
        
        // only the feedback message needs to display
        var feedback_html = "<dev>" + this.feedback_msg[index] + "</dev>";
        if (this.correct) {
            $(feedbackDiv).attr("class", "alert alert-info");
        } else {
            $(feedbackDiv).attr("class", "alert alert-danger");
        }
        
        feedbackDiv.innerHTML = feedback_html;
        feedbackDiv.style = "display: block;"
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