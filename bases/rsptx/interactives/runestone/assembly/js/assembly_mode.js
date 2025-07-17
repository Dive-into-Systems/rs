// *********
// numconv.js
// *********
// This file contains the JS for the Runestone numberconversion component. It was created By Luyuan Fan, Zhengfei Li, and Yue Zhang, 06/01/2023
"use strict";


import RunestoneBase from "../../common/js/runestonebase.js";
import am_x86 from "./AM_ISAs/am_x86class.js";
import am_ia32 from "./AM_ISAs/am_ia32class.js";
import am_arm64 from "./AM_ISAs/am_arm64class.js";
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
        this.setCustomizedParams();
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


    setCustomizedParams() {
            const currentOptions = JSON.parse(this.scriptSelector(this.origElem).html());
            if (currentOptions["architecture"] !== undefined) {
                this.archSelect = currentOptions["architecture"];
            }
    };

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

        this.instructionNode = document.createElement("div");
        this.instructionNode.style.padding = "10px";
        this.instructionNode.innerHTML = "<span style='font-weight:bold'><u>Instructions</u></span>: Given two register values and an instruction, select whether or not the instruction accesses memory.  If so, specify whether it’s a read from memory or write to memory.  If the operation accesses memory or produces a memory address, fill in the blank with the corresponding address."

        this.containerDiv.appendChild(this.instructionNode);

        this.statementDiv = document.createElement("div")
        this.statementDiv.className = "statement-div";



        const modeDiv= document.createElement('div')
        //Configure question: Select a mode to determine what type of instructions are generated.
        modeDiv.innerHTML  = `<span style='font-weight:bold'><u>Configure Question</u></span>: Select a mode to determine what type of instructions are generated. <br> 
        <ul> <li> Mode 1 generates memory addresses with a register value and potentially a constant displacement. </li> 
        <li>Mode 2 generates memory addresses with a register value, and potentially constant displacements and/or scaling.</li></ul>`

        // <select class="form-control fork-inline mode"><option value="1" selected="selected">1</option><option value="2">2</option><option value="3">3</option></select>
        this.modeSelect = document.createElement("select")
        this.modeSelect.className = "form-control fork-inline mode"
        this.mode1Option = document.createElement("option")
        this.mode1Option.value = "1"
        this.mode1Option.textContent = "1"

        this.mode2Option = document.createElement("option")
        this.mode2Option.value = "2"
        this.mode2Option.textContent = "2"

        this.mode2Option.selected = "selected"

        this.modeSelect.addEventListener("change", ()=>this.generateButton.click())

        this.modeSelectText = document.createElement("div")
        this.modeSelectText.append(document.createTextNode('Select a mode:'))

        //DON'T DO IF ARM
        if(this.archSelect != "arm_64"){
            this.containerDiv.appendChild(document.createElement("br"));


            this.containerDiv.append(this.statementDiv)

            this.statementDiv.appendChild(modeDiv)

            this.statementDiv.append(this.modeSelectText)


            this.modeSelect.append(this.mode1Option)
            this.modeSelect.append(this.mode2Option)
            this.modeSelectText.append(this.modeSelect)

        }





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

        this.registerTable = document.createElement('table');
        let header = '<tr>';
        
        

        this.questions = [];
        this.answers = [];
        this.feedback_msg = ["", "", "", ""];

        const largeOl = document.createElement("ol")

        this.generateAnswer();
        let registerData = this.generateRegisterState(0)
            let regA;
            let regB;
            if(this.archSelect == "X86_64"){
                regA = "rax";
                regB = "rcx";
            } else if (this.archSelect == "ia_32"){
                regA = "eax";
                regB = "ecx";
            } else if (this.archSelect == "arm_64"){
                regA = "X0";
                regB = "X1";
            }
            let background = document.createElement("div");
            background.className = "statement-div";
            let registers;
            if(this.modeSelect.value){
                switch(this.modeSelect.value){
                case "1":
                    registers = [regA];
                    break;
                case "2":
                    registers = [regA, regB];
                }
            }else{
                registers = [regA, regB];
            }
            
            

            for (const register of registers) {
            header += `<th style="text-align:center">${register}</th>`;
            }

            this.registerTable.innerHTML = header;
            let row = document.createElement('tr');
            let cell1;
            let cell2;
            if(this.modeSelect.value){
                switch (this.modeSelect.value){
                case "1":
                    cell1 = document.createElement('td')
                    cell1.innerHTML = `${registerData.values[0]}`
                    row.append(cell1);
                    break;
                case "2":
                    cell1 = document.createElement('td')
                    cell1.innerHTML = `${registerData.values[0]}`
                    row.append(cell1);
                    cell2 = document.createElement('td')
                    cell2.innerHTML = `${registerData.values[1]}`
                    row.append(cell2);
                    break;
                }
            }else{
                cell1 = document.createElement('td')
                    cell1.innerHTML = `${registerData.values[0]}`
                    row.append(cell1);
                    cell2 = document.createElement('td')
                    cell2.innerHTML = `${registerData.values[1]}`
                    row.append(cell2);
            }
            
            
            this.registerTable.append(row);
            let tableHeader = document.createElement('div');
            tableHeader.style = "margin: auto; width: 100%; text-align: center";
            tableHeader.innerHTML = "Register Values:"
            background.append(tableHeader);
            background.append(this.registerTable);
            this.answerDiv.append(background);

        this.questions.map((q,i)=>{

            const index = i

            const li = document.createElement('li')
            
            const codeDiv = document.createElement('div')

            registerData = this.generateRegisterState(i)


            codeDiv.innerHTML = ((registerData.names[0] == "rax")||(registerData.names[0] == "eax")||(registerData.names[0] == "X0")) ?
            (`<div>` +
            `<div> <code class="modeCode">${q.code}</code> </div>` +
            `</div>`) :
            (`<div>`+
            `<div> <code class="modeCode">${q.code}</code> </div>`+
            `</div>`);
            
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
            tableHeadRow.innerHTML = "<th>Memory Access?</th> <th> Read or Write </th> <th>Address Value (Hexadecimal)</th> <th>Check Answer</th>"
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
            rYesMALabel.textContent = "Yes"

            const rNoMA = document.createElement("input")
            rNoMA.value = `radioNo${i}`
            rNoMA.type = "radio"
            rNoMA.className = `radioMANo${i}`
            rNoMA.name = `ma${i}`
            const rNoMALabel = document.createElement("label")
            rNoMALabel.setAttribute("for", `radioMANo${i}`)
            rNoMALabel.textContent = "No"

            this.MAYesSpan = document.createElement('span')
            this.MAYesSpan.className = "radioSpan"
            this.MAYesSpan.append(rYesMA)
            this.MAYesSpan.append(rYesMALabel)

            this.MANoSpan = document.createElement("span")
            this.MANoSpan.className = "radioSpan"
            this.MANoSpan.append(rNoMA)
            this.MANoSpan.append(rNoMALabel)
            
            maTd.append(this.MAYesSpan)
            maTd.append(this.MANoSpan)
            
            maTd.className = "radioTD"



            
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


            this.rwYesSpan = document.createElement("span")
            this.rwYesSpan.className = "radioSpan"
            this.rwYesSpan.append(rYesRW)
            this.rwYesSpan.append(rYesRWLabel)
            
            this.rwNoSpan = document.createElement("span")
            this.rwNoSpan.className = "radioSpan"
            this.rwNoSpan.append(rNoRW)
            this.rwNoSpan.append(rNoRWLabel)
            
            rwTd.append(this.rwYesSpan)
            rwTd.append(this.rwNoSpan)

            rwTd.className = "radioTD"
            

            const input1 = document.createElement("input")
            input1.placeholder = "Address Value (Hex)"
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

                    rNoRW.checked = false;
                    rYesRW.checked = false;
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
            this.renderAMButtons();
            
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
        this.genMov = 0;
        this.genAdd = 0;
        this.genLea = 0;
        let selectHistory = [];
        this.MAarray = [];
        let select = [];
        switch (this.archSelect) {
            case "X86_64":
                this.arch = new am_x86();
                break;
            case "ia_32":
                this.arch = new am_ia32();
                break;
            case "arm_64":
                this.arch = new am_arm64();
                break;
            default:
                throw new Error("Invalid architecture option");
        }
        
        if (this.archSelect != "arm_64"){
            this.instructionList = ["add", "mov"];
    
            for (let i = 0; i<4; i++){
                select = Math.floor(Math.random()*3)
                if (i == 1 && !selectHistory.includes(0)){
                    select = 0;
                }
                if (i == 2 && !selectHistory.includes(1)){
                    select = 1;
                }
                if (i == 3 && !selectHistory.includes(2)){
                    select = 2;
                }
                selectHistory.push(select);
                this.questions.push(this.generateCode(select));
            }
        } else{

            for (let i = 0; i<4; i++){
                if(i<3){
                    selectHistory.push(i);
                } else {
                    selectHistory.push(Math.floor(Math.random()*3))
                }
                
            }
            
            for (let i = selectHistory.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [selectHistory[i], selectHistory[j]] = [selectHistory[j], selectHistory[i]];
            }

            for (let i = 0; i<selectHistory.length; i++){
                this.questions.push(this.generateCode(selectHistory[i]));
            }

        }
    }

    generateCode(select) {
        let text;
        
        if(select == 0){
            text = this.generateRead();
        } else if (select == 1){
            text = this.generateWrite();
        } else {
            text = this.generateNoAccess();
        }
        
        for (let i = 0; i<this.questions.length; i++){
            if(this.questions[i].code == text){
                text = this.generateCode(select).code;
            }
        }

        return {code: text};
    }

    generateRead() {
        let ans;
        if (this.archSelect != "arm_64"){
            if(this.genMov == 0){
                ans = this.arch.ReadInstructions["mov"](Number(this.modeSelect.value));
                this.answers.push(ans);
                this.genMov++;
                this.MAarray.push("A");
                
            } else if (this.genAdd == 0) {
                ans = this.arch.ReadInstructions["add"](Number(this.modeSelect.value));
                this.answers.push(ans);
                this.genAdd++;
                this.MAarray.push("A");
            } else{
                const inst = this.instructionList[Math.floor(Math.random()*2)]
                ans = this.arch.ReadInstructions[inst](Number(this.modeSelect.value))
                this.answers.push(ans);
                this.MAarray.push("A");
            }
   
        } else{
            ans = this.arch.ReadWriteInstructions["ldr"]();
            this.answers.push(ans);
            this.MAarray.push("A");
        }
        
        const text = ans.code;
        return text;
    }
    
    generateWrite() {
        let ans;
        if (this.archSelect!="arm_64"){

            if(this.genMov == 0){
                ans = this.arch.WriteInstructions["mov"](Number(this.modeSelect.value));
                this.answers.push(ans);
                this.genMov++;
                this.MAarray.push("A");
                
            } else if (this.genAdd == 0) {
                ans = this.arch.WriteInstructions["add"](Number(this.modeSelect.value));
                this.answers.push(ans);
                this.genAdd++;
                this.MAarray.push("A");
            } else{
                const inst = this.instructionList[Math.floor(Math.random()*2)]
                ans = this.arch.WriteInstructions[inst](Number(this.modeSelect.value))
                this.answers.push(ans);
                this.MAarray.push("A");
            }

        }else{
            ans = this.arch.ReadWriteInstructions["str"]();
            this.answers.push(ans);
            this.MAarray.push("A");
        }
        
        const text = ans.code;
        return text;
    }

    generateNoAccess() {
        let ans;
        if(this.archSelect != "arm_64"){
            if(this.genLea == 0){
                ans = this.arch.NAInstructions["lea"](Number(this.modeSelect.value));
                this.answers.push(ans);
                this.genLea++;
                this.MAarray.push("NAlea");
                
            } else if (this.genAdd == 0) {
                ans = this.arch.NAInstructions["add"]();
                this.answers.push(ans);
                this.genAdd++;
                this.MAarray.push("NA");
            } else if (this.genMov == 0) {
                ans = this.arch.NAInstructions["mov"]();
                this.answers.push(ans);
                this.genMov++;
                this.MAarray.push("NA");
            } else{
                ans = this.arch.NAInstructions["lea"](Number(this.modeSelect.value))
                this.answers.push(ans);
                this.MAarray.push("NAlea");
            }
            
        }else{
            if(this.genAdd == 0){
                ans = this.arch.NAInstructions["add"]();
                this.answers.push(ans);
                this.MAarray.push("NA");
                this.genAdd++;
            } else{
                ans = this.arch.NAInstructions["sub"]();
                this.answers.push(ans);
                this.MAarray.push("NA");
            }
        
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