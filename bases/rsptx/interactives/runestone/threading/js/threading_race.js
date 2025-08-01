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

// TR constructor
export default class TR extends RunestoneBase {
    constructor(opts) {
        super(opts);
        var orig = opts.orig; // entire <p> element
        this.useRunestoneServices = opts.useRunestoneServices;
        this.origElem = orig;
        this.divid = orig.id;
        //sets instructor configurable parameters
        this.setCustomizedParams();

        // Default configuration settings
        this.correct = null;
        // Fields for logging data
        this.componentId = this.getCID();
        this.questionId = 1;
        this.userId = this.getUserId();
        
        this.createTRElement();

        // this.addCaption("runestone");
        // this.checkServer("nc", true);
        if (typeof Prism !== "undefined") {
            Prism.highlightAllUnder(this.containerDiv);
        }

        this.contWrong = 0;
        //dynamically resizes the height of the component
        const obj = this;
        updateHeight(window, document, obj, true);
        this.sendData(this.a2ID('load'));
    }
    // Find the script tag containing JSON in a given root DOM node.
    scriptSelector(root_node) {
        return $(root_node).find(`script[type="application/json"]`);
    }
    /*===========================================
    ====   Functions generating final HTML   ====
    ===========================================*/
    // Create the NC Element

    
    sendData(actionId) {

        let details = {}


                    // this.problem = initialize(Number(this.modeSelect.value));
                    // this.stateArr = stateChange(this.problem.state, this.problem.thread1Info, this.problem.thread2Info, this.problem.thread1, this.problem.thread2);
                    // this.finalStates = possibleFinalStates(this.stateArr, this.problem.thread1.length, this.problem.thread2.length)

        if(this.id2A(actionId) != 'load'){
            details.mode = this.modeSelect.value
            details.questionType = this.typeSelect.value
            details.problem = this.problem
            // details.stateArr = this.stateArr
            // details.finalStates = this.finalStates

        }
        if(this.id2A(actionId) == 'correct' || this.id2A(actionId) == 'incorrect'){
            details.answer = this.logAnswers
            details.userAnswer = this.logUserAnswers

        }
        if(this.id2A(actionId) == 'incorrect'){
        }

            this.logData(null, details, actionId, this.componentId);

    }

    createTRElement() {
        this.renderTRPromptAndInput();
        switch(this.typeSelect.value){
            case "1":
                //renders the multiple choice version of the problem in type 1
                this.renderAnswerDivMultipleChoice();
                break;
                //renders the fill in the blank version of the problem in type 2
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
        
        this.containerDiv = document.createElement("div");
        this.containerDiv.id = this.divid;

        this.instructionNode = document.createElement("div");
        this.instructionNode.style.padding = "10px";

        // render the statement
        this.containerDiv.appendChild(this.instructionNode);

        //Only do this if the instructor doesn't want to preset mode, type, or disable generate
        if(!(this.modePreset&&this.typePreset)&&!this.disableGenerate){
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
                this.type1Option.textContent = "Multiple Choice";
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

        //sets the rate of race conditions appearances at 75%.
        this.raceRate = 0.75;
        const flag = (Math.random()>this.raceRate)?1:0
        let target;
        //sets the max number of states to generate at 4 for mode 1 and 5 for mode 2.
        if(this.modeSelect.value == "1"){
            target = 4;
        } else if (this.modeSelect.value = "2"){
            target = 5;
        }
        //modifies instructions depending on the type of question.
        if(this.typeSelect.value == "1"){
            this.instructionNode.innerHTML = "<span style='font-weight:bold'><u>Instructions</u></span>: Given the global variables and code for two threads below, select all possible values of the variables after the threads execute in parallel."
        }else{
            this.instructionNode.innerHTML = "<span style='font-weight:bold'><u>Instructions</u></span>: Given the global variables and code for two threads below, fill in the rows of the table with possible states after the threads execute in parallel. After you check a row, the table will expand to allow more entries for possible states."
        }

        
        if(!this.problemPreset){
            //regenerates the problem 20 times until it satisfies the the race rate and max targets.
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
        if(currentOptions["disable-generate"]){
            this.disableGenerate = true;
            this.typeSelect = {value: currentOptions["questionType"].toString()};
            this.modeSelect = {value: currentOptions["mode"].toString()};
        }
    };

    //generates the distractors for multiple choice version of problem. It takes two parameters: a random number and a correct state.
    generateDistractors(coinFlip, template){
        //randomly chooses one of the variables from the correct states to change.
        switch(coinFlip){
            case 0: //the variable chosen is x
                let coinFlip = Math.floor((Math.random()*2)) ? 1:0 //randomly picks a thread
                if(coinFlip){
                    if(this.problem.thread1Info.operandIf[0] == "x"){ //looks for the read-modify-write pattern in the if body that affects the x value.
                        let x = template.readFromx;
                        let y = template.y1;
                        x = eval(this.problem.thread1Info.changeIf[0]); //changes the value of x by performing the read-modify-write again to emulate incorrect evaluation of thread execution.
                        template.readFromx = x;
                    }else if (this.problem.thread1Info.operandElse[0] == "x"){ //if x is not changed in the if body, looks for a read-modify-write that occurs in the else body that affects x.
                        let x = template.readFromx;
                        let y = template.y1;
                        x = eval(this.problem.thread1Info.changeElse[0]);
                        template.readFromx = x;
                    } else{ //if x is not changed in both if and else (which should be impossible, but this is kept here as a failsafe), sets x to a random number between 0 and 10
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
            case 1: //the variable chosen is y1
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
            case 2: //the variable chosen is y2
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
        return template //returns the modified state as a distractor
    }

    generateChoices(){
        
        let dataList = []; //the list that holds all the options
        let wrongList = []; // the list that holds all the distractors
        let loopCount = 0; // keeps track of looping so no infinite loops occur
        this.numChoices = 0; // the number of options that should be generated
        switch(this.modeSelect.value){
            case "1":
                this.numChoices = 4;
                break;
            case "2":
                this.numChoices = 5;
                break;
        }

        if(this.problemPreset){ //sets the answer based on the instructor config if available
            let dataList = this.problem.answerArr;
            dataList.push(this.problem.distractors);
            dataList = dataList.flat();
            for(let i = 0; i<dataList.length; i++){
                dataList[i] = JSON.parse(dataList[i])
            }
            return dataList;
        }

        if(this.ansKey.length < this.numChoices){ //if the length of the answerKey is less than the target number of options
            for(let i = 0; i<this.ansKey.length; i++){
                dataList.push(JSON.parse(this.ansKey[i])); // insert all correct answers into dataList
            }
            for(let i = 0; i<this.numChoices-this.ansKey.length; i++){ // for the gap between the number of correct choices and the target number of options
                let template = this.ansKey[Math.floor(Math.random()*this.ansKey.length)];
                template = JSON.parse(template);
                let coinFlip = Math.floor(Math.random()*3);
                template = this.generateDistractors(coinFlip, template) //generate distractors
                let temp = JSON.stringify(template);
                if(!this.ansKey.includes(temp)&&!wrongList.includes(temp)){ // checks to see that there are no duplicate distractors and distractor is not the same as a correct answer
                    dataList.push(template)
                    wrongList.push(temp);
                }else{
                    if(loopCount >= 10){ // prevents infinite looping
                        let flag = false;
                        while(!flag){ // triggers in the case that distractors are repeatedly duplicates or copies of correct answers
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
                dataList.push(JSON.parse(answer)); //inserts all correct answers into dataList if length of correct answers matches target number of choices.
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

        this.answerStatement = document.createTextNode("Select all the possible final states: ");
        this.answerDiv.appendChild(this.answerStatement);
        
        this.ansKey = this.finalStates;
        console.log(this.ansKey)
        let dataList = this.generateChoices();//generates all the options for multiple choice
        console.log(dataList)

        function shuffleArray(array) { //shuffles the options list
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

        this.checkListDiv = document.createElement("div");
        this.checkListDiv.className = "statement-div"
        this.checkListTable = document.createElement("table");
        let variables = ["", "x", "y (thread1)", "y (thread2)"];

        let header = '<tr>'; //creates the table that holds all the options
        for (const variable of variables) {
            if(variable == "x"){
                header += `<th style="text-align:center; width:180px">${variable}</th>`;
                continue;
            }
            header += `<th style="text-align:center">${variable}</th>`;
        }

        this.checkListTable.innerHTML = header;

        for(let i = 0; i<this.numChoices; i++){
            let row = '<tr>';
            row += `<td><input class='option${i+1}' type='checkbox' value='${JSON.stringify(dataList[i])}' </input></td>`
            row+= `<td>${dataList[i].readFromx}</td><td>${dataList[i].y1}</td><td>${dataList[i].y2}</td>`
            row += '</tr>'
            this.checkListTable.innerHTML += row;
        }
        

        this.checkListDiv.append(this.checkListTable);
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

        this.generateAnswerSlot();//creates the first row of the table that students input their answers into
        this.answerDiv.append(document.createElement("br"));
        this.answerDiv.append(document.createTextNode("Fill in each row with a possible state:"))
        this.background.append(this.answerTable);
        this.answerDiv.append(this.background)
        this.containerDiv.append(this.answerDiv);
        this.problemPreset = false;
    }

    generateAnswerSlot(){ //this function takes care of expanding the table after each row is checked
        
        let variables = ["this.userAnswers[i].readFromx", "this.userAnswers[i].y1", "this.userAnswers[i].y2"];
        this.row = document.createElement("tr"); //creates a row
        for(let j = 0; j < variables.length; j++){ // inserts the input boxes for the three variables into the row
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

        if(this.rowCount>= 1){ //repopulates the table when a new row is generated, since input values are removed by default
            for(let i = 0; i < this.rowCount; i++){
                for (let j = 0; j<variables.length; j++){

                    let inputField = document.getElementById(`${i}${j}_answer`)
                    inputField.value = eval(variables[j])
                    inputField.disabled = true; //disables input boxes that have already been checked and are correct
                    inputField.style.backgroundColor = "#D3D3D3" //sets the background of correct answers to grey
                }
            }
    
        }
        this.rowCount++;

    }


    clearButtons(){
        if(this.noMoreRowsButton){
            this.noMoreRowsButton.remove();
        }
        if(this.generateButton){
            this.generateButton.remove();
        }
        
        this.submitButton.remove();
            
        
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
            if(!this.problemPreset){ //regenerates the problem until constraints are satisfied when no instructor configs are provided
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

                    this.instructionNode.innerHTML = "<span style='font-weight:bold'><u>Instructions</u></span>: Given the global variables and code for two threads below, select all possible values of the variables after the threads execute in parallel."
                    break;
                case "2":
                    this.renderAnswerDiv();

                    this.instructionNode.innerHTML = "<span style='font-weight:bold'><u>Instructions</u></span>: Given the global variables and code for two threads below, fill in the rows of the table with possible states after the threads execute in parallel. After you check a row, the table will expand to allow more entries for possible states."
            }

            this.renderTRButtons()
            
            this.sendData(this.a2ID('generate'))
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
                // check the answer for multiple choice questions
                this.submitButton.addEventListener("click", () => {
                    if(this.feedbackDiv){
                        this.feedbackDiv.remove()
                    }

                    this.checkAnswerMultipleChoice();
                    this.logCurrentAnswer();
            
                });
                //disables the generate another button if instructor config specifies
                if(!this.disableGenerate){
                    this.containerDiv.appendChild(this.generateButton);
                }
                this.containerDiv.appendChild(this.submitButton);
                break;

            case "2":
                // the check row button for fill in the blank buttons is created here
                this.submitButton = document.createElement("button");
                this.submitButton.textContent = $.i18n("Check row");
                $(this.submitButton).attr({
                    class: "btn btn-success",
                    name: "answer",
                    type: "button",
                });
                
                this.submitButton.style = "display: inline-block;width: 140px;height:37px;"
                this.submitButton.addEventListener("click", () => {
                    if(this.feedbackDiv){
                        this.feedbackDiv.remove()
                    }
                    this.submitButton.remove();
                    this.checkCurrentAnswer();
                    this.row.appendChild(this.submitButton);
                    this.logCurrentAnswer();
                    this.sendData(this.a2ID(this.correct ? 'correct' : 'incorrect'))

                });
                this.submitButton.style.display = "inline-block"

                //the no more states button is created here
                this.noMoreRowsButton = document.createElement("button");
                this.noMoreRowsButton.textContent = $.i18n("No more states");
                $(this.noMoreRowsButton).attr({
                    class: "btn btn-success",
                    name: "answer",
                    type: "button",
                });
                
                this.noMoreRowsButton.addEventListener("click", () => {
                    if(this.feedbackDiv){
                        this.feedbackDiv.remove()
                    }
                    this.checkAllAnswers();
                    this.logCurrentAnswer();        
                    this.sendData(this.a2ID(this.correct ? 'correct' : 'incorrect')) 
                });

                if(!this.disableGenerate){
                    this.containerDiv.appendChild(this.generateButton);
                }
                
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
    //checks the answer for multiple choice questions
    checkAnswerMultipleChoice(){
        this.correct = true;
        let numChecked;
        //checks the answer for each multiple choice selection
        for(let i = 0; i<this.numChoices; i++){
            let curAns = this.checkListTable.getElementsByClassName(`option${i+1}`);
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
        //catches the user if they've gotten everything correct already but keeps clicking the no more states button.
        if(this.allCorrect == true){
            this.feedback_msg = "You've got everything! Stop clicking this button and generate another :D"
            this.renderFeedback()
            return;
        }

        //catches the user if there are more states that available rows.
        if(this.rowCount < this.finalStates.length-1){
            this.correct = false;
            this.feedback_msg = "Incorrect. There are other possible states."
            this.renderFeedback();
            return;
        }

        let answers = [];

        //gets the answers from answer key as strings and parses it into JSON objects to remove the inIfs.
        this.finalStates.forEach(state =>{
            let temp = JSON.parse(state)
            answers.push({readFromx:temp.readFromx, y1:temp.y1, y2:temp.y2});
        })

        //re-stringifies the answers
        for (let i = 0; i<answers.length; i++){
            answers[i] = JSON.stringify(answers[i])
        }
        let userRow = {};

        let variables = ["userRow.readFromx", "userRow.y1", "userRow.y2"];
        //evaluates each user row and stores the answer as fields in the userRow dictionary
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
        // stringifies the userRow for string comparison
        userRow = JSON.stringify(userRow);

        
        let userAnswers = [];
        //pushes all user answers into the userAnswers array except for the last row when an extra row is generated
        for (let i = 0; i<this.userAnswers.length; i++){
            userAnswers.push(JSON.stringify(this.userAnswers[i]))
        }
        //if the last extra row is generated, push user answers if it's not empty (i.e., the user shouldn't have inputted
        //something but they did)
        if(userRow != '{"readFromx":"","y1":"","y2":""}'){
            userAnswers.push(userRow);
        }

        //incorrect if a row is in the user answers but is not in the correct answers
        for (let answer of userAnswers){
            if(!answers.includes(answer)){
                this.correct = false;
                this.feedback_msg = "Incorrect. An entry is not a possible state."
                this.renderFeedback();
                return;
            }
        }
        //incorrect if a row is in the correct answers but is not in the user answers
        for (let answer of answers){
            if(!userAnswers.includes(answer)){
                this.correct = false;
                this.feedback_msg = "Incorrect. There are other possible states."
                this.renderFeedback();
                return;
            }
        }
        //otherwise correct
        this.feedback_msg = "Correct. You've gotten all the possible states!"
        this.allCorrect = true
        //disables the input fields if they are correct for the last row
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
        //catches the user if they've already gotten everything correct but still clicks this button
        this.correct = true;
        if(this.allCorrect == true){
            this.feedback_msg = "You've got everything! Stop clicking this button and generate another :D"
            this.renderFeedback()
            return;
        }

        //catches the user if the number of lines exceeds the number of final states but they keep clicking check row
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
        //parses the strings in final state array into JSON objects and stores them in answers to remove the inIf fields.
        this.finalStates.forEach(state =>{
            let temp = JSON.parse(state)
            answers.push({readFromx:temp.readFromx, y1:temp.y1, y2:temp.y2});
        })

        //restringifies the answers for string comparisons.
        for (let i = 0; i<answers.length; i++){
            answers[i] = JSON.stringify(answers[i])
        }
        console.log(answers)
        let userAnswers = [];

        //retrieves history of user answers and stores them as strings
        this.userAnswers.forEach(answer =>{
            userAnswers.push(JSON.stringify(answer));
        })

        //evaluates the current row's answers and stores them as a userRow dictionary
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
        //converts user row to a string for comparison
        userRow = JSON.stringify(userRow)

        this.logUserAnswers = userRow;
        this.logAnswers = answers;

        //incorrect if user answer is not in correct answers
        if(!answers.includes(userRow)){
            this.correct = false;
            this.feedback_msg = "Incorrect. This is not a possible state."
            this.renderFeedback();
            return;
        }else if(userAnswers.includes(userRow)){ //incorrect if the entry is a duplicate
            this.correct = false;
            this.feedback_msg = "Incorrect. This is a duplicate entry."
            this.renderFeedback();
            return;
        }else{ //otherwise it's correct and push the current row to the history of userAnswers
            this.feedback_msg = "The current row is correct! Fill in another row, or click 'No more states' if you believe these are all the possible states."
            this.userAnswers.push(JSON.parse(userRow));
            this.renderFeedback();
        }
        //generates a new row for users to enter states if their current row is correct
        this.generateAnswerSlot();

    }

    // log the answer and other info to the server (in the future)
    async logCurrentAnswer(sid) {

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