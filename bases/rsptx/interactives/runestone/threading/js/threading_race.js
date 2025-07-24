// *********
// threadingRace.js
// *********
// This file contains the JS for the Runestone threading race component. It was created by Bohou Zhang, 07/06/2025
"use strict";


import RunestoneBase from "../../common/js/runestonebase.js";
import {initialize, possibleFinalStates, stateChange} from "./baseAlgorithm.js"
import { nanoid } from 'nanoid/non-secure'; 
import "./threading-i18n.en.js"
import "../css/threading_race.css";
// import "./NC-i18n.pt-br.js";
import { Pass } from "codemirror";
export var TRList = {}
import { updateHeight } from "../../../utils/updateHeight.js";

// NC constructor
export default class TR extends RunestoneBase {
    constructor(opts) {
        super(opts);
        var orig = opts.orig; // entire <p> element
        this.useRunestoneServices = opts.useRunestoneServices;
        this.origElem = orig;
        this.divid = orig.id;
        this.setCustomizedParams();

        // Default configuration settings
        this.correct = null;
        // Fields for logging data
        this.componentId = "13.3.1";
        this.questionId = 1;
        this.userId = this.getUserId();
        
        this.createTRElement();

        // this.addCaption("runestone");
        // this.checkServer("nc", true);
        if (typeof Prism !== "undefined") {
            Prism.highlightAllUnder(this.containerDiv);
        }

        this.contWrong = 0;
        const obj = this;
        updateHeight(window, document, obj, true);
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

    
    createTRElement() {
        this.renderTRPromptAndInput();
        switch(this.typeSelect.value){
            case "1":
                this.renderAnswerDivMultipleChoice();
                break;
            case "2":
                this.renderAnswerDiv();
        }
        this.renderTRButtons();
        
        this.renderTRFeedbackDiv();

        // replaces the intermediate HTML for this component with the rendered HTML of this component
        $(this.origElem).replaceWith(this.containerDiv);

    }

    renderTRPromptAndInput() {
        this.userAnswers = [];
        // Generate the two dropdown menus for number conversion
        this.containerDiv = document.createElement("div");
        this.containerDiv.id = this.divid;

        this.instructionNode = document.createElement("div");
        this.instructionNode.style.padding = "10px";
        this.instructionNode.innerHTML = "<span style='font-weight:bold'><u>Instructions</u></span>: Given the global variables and code for two threads below, determine the possible values of the variables below after the threads execute in parallel."

        // render the statement
        this.containerDiv.appendChild(this.instructionNode);

        
        if(!(this.modePreset&&this.typePreset)){
            this.configHelperText = document.createElement("div");
            this.configHelperText.innerHTML = "<span style='font-weight:bold'><u>Configure question</u></span>:";

            this.statementDiv = document.createElement("div");
            this.statementDiv.className = "statement-div"

            this.statementDiv.append(this.configHelperText);
            if(!(this.modePreset)){
                this.modeStatementNode = document.createTextNode("Select a mode:")
                this.statementDiv.appendChild(this.modeStatementNode);
                
                this.modeSelect = document.createElement("select")
                this.modeSelect.className = "form-control fork-inline mode"
                this.mode1Option = document.createElement("option")
                this.mode1Option.value = "1"
                this.mode1Option.textContent = "1"
                this.modeSelect.append(this.mode1Option)

                this.mode2Option = document.createElement("option")
                this.mode2Option.value = "2"
                this.modeSelect.append(this.mode2Option)
                this.mode2Option.textContent = "2"

                this.mode2Option.selected = "selected"

                this.modeSelect.addEventListener("change", ()=>this.generateButton.click())


                this.statementDiv.append(this.modeSelect)
            
            const modeDiv= document.createElement('div')
            modeDiv.innerHTML  = '<ul> <li>Mode 1: Each if/else body contains one expression.</li> <li>Mode 2: If/else bodies can contain two expressions.</li></ul>'
            this.statementDiv.appendChild(modeDiv)
            }

            if(!this.typePreset){
                this.typeStatementNode = document.createTextNode("Please select what type of question to generate:")
                this.statementDiv.appendChild(this.typeStatementNode);
                
                this.typeSelect = document.createElement("select")
                this.typeSelect.className = "form-control fork-inline mode"
                this.type1Option = document.createElement("option")
                this.type1Option.value = "1"
                this.type1Option.textContent = "Select all";
                this.typeSelect.append(this.type1Option)

                this.type2Option = document.createElement("option")
                this.type2Option.value = "2"
                this.typeSelect.append(this.type2Option)
                this.type2Option.textContent = "Fill in the values"

                this.type2Option.selected = "selected"

                this.typeSelect.addEventListener("change", ()=>this.generateButton.click())

                this.statementDiv.append(this.typeSelect);
            }
            this.containerDiv.appendChild(this.statementDiv);
            
        }
        this.containerDiv.appendChild(document.createElement("br"));
        this.feedbackDiv = document.createElement("div");
        this.feedbackDiv.setAttribute("id", this.divid + "_feedback");

        this.raceRate = 0.75;
        const flag = (Math.random()>this.raceRate)?1:0
        let target;
        if(this.modeSelect.value == "1"){
            target = 4;
        } else if (this.modeSelect.value = "2"){
            target = 5;
        }

        if(!this.problemPreset){
            for (let i = 0; i<20; i++){
                this.problem = initialize(Number(this.modeSelect.value));
                this.stateArr = stateChange(this.problem.state, this.problem.thread1Info, this.problem.thread2Info, this.problem.thread1, this.problem.thread2, this.problem.threadTemplate1, this.problem.threadTemplate2);
                this.finalStates = possibleFinalStates(this.stateArr, this.problem.thread1.length, this.problem.thread2.length)

                if ((this.finalStates.length > 1 || flag)&& this.finalStates.length<=target){
                    break;
                }
            }
            
        }else{
            this.finalStates = this.problem.answerArr
        }
        

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

    setCustomizedParams() {
        const currentOptions = JSON.parse(this.scriptSelector(this.origElem).html());
        if(currentOptions["preset-questionType"]&&currentOptions["preset-mode"]){
            this.typeSelect = {value: currentOptions["questionType"].toString()};
            this.modeSelect = {value: currentOptions["mode"].toString()};
            this.modePreset = true;
            this.typePreset = true;
        }
        else if (currentOptions["preset-questionType"]) {
            this.typeSelect = {value: currentOptions["questionType"].toString()};
            this.typePreset = true;
            
        }
        else if(currentOptions["preset-mode"]){
            this.modeSelect = {value: currentOptions["mode"].toString()};
            this.modePreset = true;
        }
        
        if(currentOptions["preset-problem"]){
            const initial = "<pre style='font-size: 18px; width:130px;'>"+currentOptions["initialText"].replaceAll("\n", "<br>")+"</pre><br>"
            
            let temp = currentOptions["thread1Text"];
            temp = temp.replaceAll("\n", "<br>")
            const t1 = "<pre style='font-size: 18px;'>" + temp + "</pre>";
            temp = currentOptions["thread2Text"];
            temp = temp.replaceAll("\n", "<br>");
            const t2 = "<pre style='font-size: 18px;'>" + temp + "</pre>";
            const ansArr = []
            for (let i = 0; i<currentOptions["answerArr"].length; i++){
                let answer = {readFromx: currentOptions["answerArr"][i][0], y1: currentOptions["answerArr"][i][1], y2: currentOptions["answerArr"][i][2]}
                ansArr.push(JSON.stringify(answer));
            }
            const distractors = [];
            if(currentOptions["distractors"]){
                for (let i = 0; i<currentOptions["distractors"].length; i++){
                    let answer = {readFromx: currentOptions["distractors"][i][0], y1: currentOptions["distractors"][i][1], y2: currentOptions["distractors"][i][2]}
                    distractors.push(JSON.stringify(answer));
                }
            }
            
            this.problem = {text: {initial: initial, t1: t1, t2: t2}, answerArr: ansArr, distractors: distractors};
            this.problemPreset = true;
        }
    };

    generateDistractors(coinFlip, template){
        switch(coinFlip){
            case 0:
                let coinFlip = Math.floor((Math.random()*2)) ? 1:0
                if(coinFlip){
                    if(this.problem.thread1Info.operandIf[0] == "x"){
                        let x = template.readFromx;
                        let y = template.y1;
                        x = eval(this.problem.thread1Info.changeIf[0]);
                        template.readFromx = x;
                    }else if (this.problem.thread1Info.operandElse[0] == "x"){
                        let x = template.readFromx;
                        let y = template.y1;
                        x = eval(this.problem.thread1Info.changeElse[0]);
                        template.readFromx = x;
                    } else{
                        template.readFromx = Math.floor(Math.random()*10);
                    }
                }else{
                    if(this.problem.thread2Info.operandIf[0] == "x"){
                        let x = template.readFromx;
                        let y = template.y2;
                        x = eval(this.problem.thread2Info.changeIf[0]);
                        template.readFromx = x;
                    }else if (this.problem.thread2Info.operandElse[0] == "x"){
                        let x = template.readFromx;
                        let y = template.y2;
                        x = eval(this.problem.thread2Info.changeElse[0]);
                        template.readFromx = x;
                    } else{
                        template.readFromx = Math.floor(Math.random()*10);
                    }
                }
                break;
            case 1:
                if(this.problem.thread1Info.operandIf[0] == "y"){
                    let x = template.readFromx;
                    let y = template.y1;
                    y = eval(this.problem.thread1Info.changeIf[0]);
                    template.y1 = y;
                }else if (this.problem.thread1Info.operandElse[0] == "y"){
                    let x = template.readFromx;
                    let y = template.y1;
                    y = eval(this.problem.thread1Info.changeElse[0]);
                    template.y1 = y;
                } else{
                    template.y1 = Math.floor(Math.random()*10);
                }
                break;
            case 2:
                if(this.problem.thread2Info.operandIf[0] == "y"){
                    let x = template.readFromx;
                    let y = template.y2;
                    y = eval(this.problem.thread2Info.changeIf[0]);
                    template.y2 = y;
                }else if (this.problem.thread2Info.operandElse[0] == "y"){
                    let x = template.readFromx;
                    let y = template.y2;
                    y = eval(this.problem.thread2Info.changeElse[0]);
                    template.y2 = y;
                } else{
                    template.y2 = Math.floor(Math.random()*10);
                }
                break
        }
        return template
    }

    generateChoices(){
        
        let dataList = [];
        let wrongList = [];
        let loopCount = 0;
        this.numChoices = 0;
        switch(this.modeSelect.value){
            case "1":
                this.numChoices = 4;
                break;
            case "2":
                this.numChoices = 5;
                break;
        }

        if(this.problemPreset){
            let dataList = this.problem.answerArr;
            dataList.push(this.problem.distractors);
            dataList = dataList.flat();
            for(let i = 0; i<dataList.length; i++){
                dataList[i] = JSON.parse(dataList[i])
            }
            return dataList;
        }

        if(this.ansKey.length < this.numChoices){
            for(let i = 0; i<this.ansKey.length; i++){
                dataList.push(JSON.parse(this.ansKey[i]));
            }
            for(let i = 0; i<this.numChoices-this.ansKey.length; i++){
                let template = this.ansKey[Math.floor(Math.random()*this.ansKey.length)];
                template = JSON.parse(template);
                let coinFlip = Math.floor(Math.random()*3);
                template = this.generateDistractors(coinFlip, template)
                let temp = JSON.stringify(template);
                if(!this.ansKey.includes(temp)&&!wrongList.includes(temp)){
                    dataList.push(template)
                    wrongList.push(temp);
                }else{
                    if(loopCount >= 10){
                        let flag = false;
                        while(!flag){
                            template = this.ansKey[Math.floor(Math.random()*this.ansKey.length)];
                            template = JSON.parse(template);
                            coinFlip = Math.floor(Math.random()*3);
                            switch(coinFlip){
                                case 0:
                                    template.readFromx = Math.floor(Math.random()*10);
                                    break;
                                case 1:
                                    template.y1 = Math.floor(Math.random()*10);
                                    break;
                                case 2:
                                    template.y2 = Math.floor(Math.random()*10);
                                    break
                            }
                            
                            temp = JSON.stringify(template);
                            if(!this.ansKey.includes(temp)&&!wrongList.includes(temp)){
                                dataList.push(template);
                                wrongList.push(temp);
                                flag = true;
                            }
                        }
                    }else{
                        i--;
                        loopCount++;
                    }
                }
            }
        }else{
            this.ansKey.forEach(answer=>{
                dataList.push(JSON.parse(answer));
            })
            return dataList;
        }
        return dataList;
    }

    renderAnswerDivMultipleChoice(){
        this.answerDiv = document.createElement('div');
        
        this.codeDiv = document.createElement('div');
        
        this.answerDiv.append(this.codeDiv);

        this.codeBox = document.createElement('code');
        this.codeDiv.innerHTML = "Shared Global Variables:<br>"
        this.codeDiv.style = "margin:auto; width:100%; text-align:center"
        this.codeBox.style = "font-size: 18px;";
        this.codeBox.innerHTML = this.problem.text.initial;
        this.codeBox.style.backgroundColor = "#f0f8ff"
        this.codeAlign = document.createElement('div')
        this.codeAlign.style = "margin-left: 40%;"
        this.codeAlign.append(this.codeBox)
        this.codeDiv.append(this.codeAlign);
        

        this.thread1 = document.createElement('code');
        this.thread1.innerHTML = this.problem.text.t1;
        this.thread1.style.backgroundColor = "#f0f8ff"
        this.thread2 = document.createElement('code');
        this.thread2.innerHTML = this.problem.text.t2;
        this.thread2.style.backgroundColor = "#f0f8ff"
        this.thread1.style.margin = "auto";
        this.thread2.style.margin = "auto";
        this.threadsDiv = document.createElement("div");
        this.threadsDiv.style = "display: flex; width: 100%; margin: auto"

        this.thread1LabelDiv = document.createElement("div");
        this.thread2LabelDiv = document.createElement("div");

        this.labelsDiv = document.createElement("div");
        this.labelsDiv.style = "display: flex; margin:auto;";
        this.thread1LabelDiv.innerHTML = "Thread 1:";
        this.thread2LabelDiv.innerHTML = "Thread 2:";

        this.thread1LabelDiv.style = "margin: auto;"
        this.thread2LabelDiv.style = "margin: auto;"

        this.labelsDiv.append(this.thread1LabelDiv);
        this.labelsDiv.append(this.thread2LabelDiv);
        this.answerDiv.append(this.labelsDiv)

        this.threadsDiv.append(this.thread1);
        this.threadsDiv.append(this.thread2);
        this.answerDiv.append(this.threadsDiv);
        this.answerDiv.append(document.createElement("br"));

        this.answerStatement = document.createTextNode("Your answer: ");
        this.answerDiv.appendChild(this.answerStatement);
        
        this.ansKey = this.finalStates;
        console.log(this.ansKey)
        let dataList = this.generateChoices();
        console.log(dataList)

        function shuffleArray(array) {
            let currentIndex = array.length;
            let randomIndex;
          
            // While there remain elements to shuffle.
            while (currentIndex !== 0) {
              // Pick a remaining element.
              randomIndex = Math.floor(Math.random() * currentIndex);
              currentIndex--;
          
              // And swap it with the current element.
              [array[currentIndex], array[randomIndex]] = [
                array[randomIndex],
                array[currentIndex],
              ];
            }
          
            return array;
        }

        shuffleArray(dataList)

        this.checkListDiv = document.createElement("div")
        let checkListDivHTML = "<ul class='items'>";

        for(let i = 0; i<this.numChoices; i++){
            let displayString = `x: ${dataList[i].readFromx}    y (thread1): ${dataList[i].y1}   y (thread2): ${dataList[i].y2}`
            checkListDivHTML += `  <div class='resultBo'><input class='option${i+1}' type='checkbox' value='${JSON.stringify(dataList[i])}' </input> <label for='option${i+1}' class = 'ansLabel'>${displayString}</label><br></div> `
        }
        

        this.checkListDiv.innerHTML = checkListDivHTML;
        this.answerDiv.append(this.checkListDiv)

        this.containerDiv.append(this.answerDiv);
        this.problemPreset = false;
    }

    renderAnswerDiv(){
        this.answerDiv = document.createElement('div');
        
        this.codeDiv = document.createElement('div');
        
        this.answerDiv.append(this.codeDiv);

        this.codeBox = document.createElement('code');
        this.codeDiv.innerHTML = "Shared Global Variables:<br>"
        this.codeDiv.style = "margin:auto; width:100%; text-align:center"
        this.codeBox.style = "font-size: 18px;";
        this.codeBox.innerHTML = this.problem.text.initial;
        this.codeBox.style.backgroundColor = "#f0f8ff"
        this.codeAlign = document.createElement('div')
        this.codeAlign.style = "margin-left: 40%;"
        this.codeAlign.append(this.codeBox)
        this.codeDiv.append(this.codeAlign);

        this.thread1 = document.createElement('code');
        this.thread1.innerHTML = this.problem.text.t1;
        this.thread1.style.backgroundColor = "#f0f8ff"
        this.thread2 = document.createElement('code');
        this.thread2.innerHTML = this.problem.text.t2;
        this.thread2.style.backgroundColor = "#f0f8ff"
        this.thread1.style.margin = "auto";
        this.thread2.style.margin = "auto";
        this.threadsDiv = document.createElement("div");
        this.threadsDiv.style = "display: flex; width: 100%; margin: auto"

        this.thread1LabelDiv = document.createElement("div");
        this.thread2LabelDiv = document.createElement("div");

        this.labelsDiv = document.createElement("div");
        this.labelsDiv.style = "display: flex; margin:auto;";
        this.thread1LabelDiv.innerHTML = "Thread 1:";
        this.thread2LabelDiv.innerHTML = "Thread 2:";

        this.thread1LabelDiv.style = "margin: auto;"
        this.thread2LabelDiv.style = "margin: auto;"

        this.labelsDiv.append(this.thread1LabelDiv);
        this.labelsDiv.append(this.thread2LabelDiv);
        this.answerDiv.append(this.labelsDiv)

        this.threadsDiv.append(this.thread1);
        this.threadsDiv.append(this.thread2);
        this.answerDiv.append(this.threadsDiv);

        this.background = document.createElement("div");
        this.background.style.display = "flex"
        this.background.className = "statement-div"

        this.rowCount = 0;
        this.answerTable = document.createElement("table");


        let variables = ["x", "y (thread1)", "y (thread2)"];
        // Create table header
        let header = '<tr>';
        for (const variable of variables) {
            header += `<th style="text-align:center">${variable}</th>`;
        }
        
        this.answerTable.innerHTML = header;

        this.generateAnswerSlot();
        this.answerDiv.append(document.createElement("br"));
        this.background.append(this.answerTable);
        this.answerDiv.append(this.background)
        this.containerDiv.append(this.answerDiv);
        this.problemPreset = false;
    }

    generateAnswerSlot(){
        
        let variables = ["this.userAnswers[i].readFromx", "this.userAnswers[i].y1", "this.userAnswers[i].y2"]
        this.row = document.createElement("tr");;
        for(let j = 0; j < variables.length; j++){
            let cell = document.createElement("td");
            cell.style.width = "400px"
            let input = document.createElement("input");
            input.type = "text";
            input.maxLength = "3";
            input.class = "answer-input";
            input.id=`${this.rowCount}${j}_answer`;
            input.style.width = "50px";
            input.style.textAlign = "center";
            cell.append(input);
            this.row.append(cell);
        }

        this.answerTable.append(this.row);

        if(this.rowCount>= 1){
            for(let i = 0; i < this.rowCount; i++){
                for (let j = 0; j<variables.length; j++){

                    let inputField = document.getElementById(`${i}${j}_answer`)
                    inputField.value = eval(variables[j])
                    inputField.disabled = true;
                    inputField.style.backgroundColor = "#D3D3D3"
                }
            }
    
        }
        this.rowCount++;

    }


    clearButtons(){
        if(this.typeSelect.value == "1"){
            this.generateButton.remove()
            this.submitButton.remove()
        }else{
            this.generateButton.remove()
            this.submitButton.remove()
            this.noMoreRowsButton.remove()
        }
        
    }

    recordAnswered() {
        this.isAnswered = true;
    }

    renderTRButtons() {
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
            const flag = (Math.random()>this.raceRate)?1:0
            this.userAnswers = [];

            let target;
            if(this.modeSelect.value == "1"){
                target = 4;
            } else if (this.modeSelect.value = "2"){
                target = 5;
            }
            if(!this.problemPreset){
                for (let i = 0; i<50; i++){
                    this.problem = initialize(Number(this.modeSelect.value));
                    this.stateArr = stateChange(this.problem.state, this.problem.thread1Info, this.problem.thread2Info, this.problem.thread1, this.problem.thread2, this.problem.threadTemplate1, this.problem.threadTemplate2);
                    this.finalStates = possibleFinalStates(this.stateArr, this.problem.thread1.length, this.problem.thread2.length)

                    if ((this.finalStates.length > 1 || flag)&& this.finalStates.length<=target){
                        break;
                    }
                }
            }else{
                this.finalStates = this.problem.answerArr;
            }
            

            switch(this.typeSelect.value){
                case "1":
                    this.renderAnswerDivMultipleChoice();
                    break;
                case "2":
                    this.renderAnswerDiv();
            }

            this.renderTRButtons()
            
        });
        switch(this.typeSelect.value){
            case "1":
                this.submitButton = document.createElement("button");
                this.submitButton.textContent = $.i18n("Check answer");
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

                    this.checkAnswerMultipleChoice();
                    this.logCurrentAnswer();
            
                });
                this.containerDiv.appendChild(this.generateButton);
                this.containerDiv.appendChild(this.submitButton);
                break;

            case "2":
                // "check me" button and "generate a number" button
                this.submitButton = document.createElement("button");
                this.submitButton.textContent = $.i18n("Check row");
                $(this.submitButton).attr({
                    class: "btn btn-success",
                    name: "answer",
                    type: "button",
                });
                // check the answer when the conversion is valid
                this.submitButton.style = "display: inline-block;width: 140px;height:37px;"
                this.submitButton.addEventListener("click", () => {
                    if(this.feedbackDiv){
                        this.feedbackDiv.remove()
                    }
                    this.submitButton.remove();
                    this.checkCurrentAnswer();
                    this.row.appendChild(this.submitButton);
                    this.logCurrentAnswer();
            
                });
                this.submitButton.style.display = "inline-block"
                this.noMoreRowsButton = document.createElement("button");
                this.noMoreRowsButton.textContent = $.i18n("No more entries");
                $(this.noMoreRowsButton).attr({
                    class: "btn btn-success",
                    name: "answer",
                    type: "button",
                });
                // check the answer when the conversion is valid
                this.noMoreRowsButton.addEventListener("click", () => {
                    if(this.feedbackDiv){
                        this.feedbackDiv.remove()
                    }
                    this.checkAllAnswers();
                    this.logCurrentAnswer();         
                });
                this.containerDiv.appendChild(this.generateButton);
                this.row.appendChild(this.submitButton);
                this.containerDiv.appendChild(this.noMoreRowsButton);   
                break;
        }

    }

    renderTRFeedbackDiv() {
        // this.containerDiv.appendChild(document.createElement("br"));
        this.containerDiv.appendChild(this.feedbackDiv);
    }

    // clear the input field
    clearAnswer() {
        this.feedbackDiv.remove();
        this.answerDiv.remove();
        this.allCorrect = false;
        this.clearButtons()
    }


    // check if the conversion is valid  
    checkValidConversion() {
        this.hideFeedback();

        
    }

    checkAnswerMultipleChoice(){
        this.correct = true;
        let numChecked;

        for(let i = 0; i<this.numChoices; i++){
            let curAns = this.checkListDiv.getElementsByClassName(`option${i+1}`);
            if(curAns[0].checked&&!this.ansKey.includes(curAns[0].value)){
                this.correct = false;
                this.feedback_msg = "Incorrect. One of the state that you've chosen is not a possible state.";
                this.renderFeedback();
                return
            }else if(!curAns[0].checked&&this.ansKey.includes(curAns[0].value)){
                this.correct = false;
                this.feedback_msg = "Incorrect. There are possible states that you've not chosen."
                this.renderFeedback();
                return
            }

        }
        
        this.feedback_msg = "Correct. Good job!"
        this.renderFeedback();
    }
    
    checkAllAnswers(){
        this.correct = true;
        if(this.allCorrect == true){
            this.feedback_msg = "You've got everything! Stop clicking this button and generate another :D"
            this.renderFeedback()
            return;
        }
        if(this.rowCount < this.finalStates.length-1){
            this.correct = false;
            this.feedback_msg = "Incorrect. There are other possible states."
            this.renderFeedback();
            return;
        }

        let answers = [];
        this.finalStates.forEach(state =>{
            let temp = JSON.parse(state)
            answers.push({readFromx:temp.readFromx, y1:temp.y1, y2:temp.y2});
        })
        for (let i = 0; i<answers.length; i++){
            answers[i] = JSON.stringify(answers[i])
        }
        let userRow = {};

        let variables = ["userRow.readFromx", "userRow.y1", "userRow.y2"];

        for(let j = 0; j<variables.length; j++){
            let input = document.getElementById(`${this.rowCount-1}${j}_answer`).value;
                if(input==""){
                    eval(`${variables[j]}` + `= ""`);
                }else if(isNaN(Number(input))){
                    eval(`${variables[j]}` + `= "${input}"`);
                }else{
                    eval(`${variables[j]}` + `= ${input}`);
                }
        }

        userRow = JSON.stringify(userRow)

        let userAnswers = []
        for (let i = 0; i<this.userAnswers.length; i++){
            userAnswers.push(JSON.stringify(this.userAnswers[i]))
        }

        if(userRow != '{"readFromx":"","y1":"","y2":""}'){
            userAnswers.push(userRow);
        }

        for (let answer of userAnswers){
            if(!answers.includes(answer)){
                this.correct = false;
                this.feedback_msg = "Incorrect. An entry is not a possible state."
                this.renderFeedback();
                return;
            }
        }
        
        for (let answer of answers){
            if(!userAnswers.includes(answer)){
                this.correct = false;
                this.feedback_msg = "Incorrect. There are other possible states."
                this.renderFeedback();
                return;
            }
        }

        this.feedback_msg = "Correct. You've gotten all the possible states!"
        this.allCorrect = true

        for(let i = 0; i < this.rowCount; i++){
            for (let j = 0; j<variables.length; j++){

                let inputField = document.getElementById(`${i}${j}_answer`)
                inputField.disabled = true;
                inputField.style.backgroundColor = "#D3D3D3"
            }
        }

        this.renderFeedback();
    }

    // check if the current answer is correct
    checkCurrentAnswer() {
        this.correct = true;
        if(this.allCorrect == true){
            this.feedback_msg = "You've got everything! Stop clicking this button and generate another :D"
            this.renderFeedback()
            return;
        }
        if (this.rowCount > this.finalStates.length){
            this.correct = false;
            this.feedback_msg = "There are no more possible states";
            this.renderFeedback()
            return;
        }

        let variables = ["userRow.readFromx", "userRow.y1", "userRow.y2"];
        let userRow = {}
        this.correct = true;


        let answers = [];
        this.finalStates.forEach(state =>{
            let temp = JSON.parse(state)
            answers.push({readFromx:temp.readFromx, y1:temp.y1, y2:temp.y2});
        })
        for (let i = 0; i<answers.length; i++){
            answers[i] = JSON.stringify(answers[i])
        }
        console.log(answers)
        let userAnswers = [];
        this.userAnswers.forEach(answer =>{
            userAnswers.push(JSON.stringify(answer));
        })

        for(let j = 0; j<variables.length; j++){
            let input = document.getElementById(`${this.rowCount-1}${j}_answer`).value;
                if(input==""){
                    eval(`${variables[j]}` + `= ""`);
                }else if(isNaN(Number(input))){
                    eval(`${variables[j]}` + `= "${input}"`);
                }else{
                    eval(`${variables[j]}` + `= ${input}`);
                }
        }

        userRow = JSON.stringify(userRow)

        if(!answers.includes(userRow)){
            this.correct = false;
            this.feedback_msg = "Incorrect. This is not a possible state."
            this.renderFeedback();
            return;
        }else if(userAnswers.includes(userRow)){
            this.correct = false;
            this.feedback_msg = "Incorrect. This is a duplicate entry."
            this.renderFeedback();
            return;
        }else{
            this.feedback_msg = "Correct. Good job!"
            this.userAnswers.push(JSON.parse(userRow));
            this.renderFeedback();
        }

        this.generateAnswerSlot();
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
    $("[data-component=threading_race]").each(function (index) {
        var opts = {
            orig: this,
            useRunestoneServices: eBookConfig.useRunestoneServices,
        };
        if ($(this).closest("[data-component=timedAssessment]").length == 0) {
            // If this element exists within a timed component, don't render it here
            try {
                TRList[this.id] = new TR(opts);
            } catch (err) {
                console.log(
                    `Error rendering Number Conversion Problem ${this.id}
                     Details: ${err}\n Stack Trace: ${err.stack}`
                );
            }
        }
    });
});