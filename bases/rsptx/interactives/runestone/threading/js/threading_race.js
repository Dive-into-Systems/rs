// *********
// numconv.js
// *********
// This file contains the JS for the Runestone numberconversion component. It was created By Luyuan Fan, Zhengfei Li, and Yue Zhang, 06/01/2023
"use strict";


import RunestoneBase from "../../common/js/runestonebase.js";
import {initialize, possibleFinalStates, stateChange, toState} from "./baseAlgorithm.js"
import { nanoid } from 'nanoid/non-secure'; 
import "./threading-i18n.en.js"
import "../css/threading_race.css";
// import "./NC-i18n.pt-br.js";
import { Pass } from "codemirror";
export var TRList = {}

// NC constructor
export default class TR extends RunestoneBase {
    constructor(opts) {
        super(opts);
        var orig = opts.orig; // entire <p> element
        this.useRunestoneServices = opts.useRunestoneServices;
        this.origElem = orig;
        this.divid = orig.id;

        // Default configuration settings
        this.correct = null;
        
        // Fields for logging data
        this.componentId = "4.1";
        this.questionId = 1;
        this.userId = this.getUserId();

        this.raceRate = 0.67;
        const flag = (Math.random()>this.raceRate)?1:0

        for (let i = 0; i<20; i++){
            this.problem = initialize();
            this.stateArr = stateChange(this.problem.state, this.problem.thread1Info, this.problem.thread2Info, this.problem.thread1, this.problem.thread2)
            this.finalStates = possibleFinalStates(this.stateArr, this.problem.thread1.length, this.problem.thread2.length)

            if (this.finalStates.length > 1 || flag){
                break;
            }
        }
        
        this.createTRElement();

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

    
    createTRElement() {
        this.renderTRPromptAndInput();
        this.renderAnswerDiv();
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
        this.instructionNode.innerHTML = "<span style='font-weight:bold'><u>Instructions</u></span>: Given the global variable x and the two threads running concurrently, determine if there is a race condition."

        // render the statement
        this.containerDiv.appendChild(this.instructionNode);


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
        this.answerDiv = document.createElement('div');
        
        this.codeDiv = document.createElement('div');
        
        this.answerDiv.append(this.codeDiv);

        this.codeBox = document.createElement('code');
        this.codeDiv.style = "margin-left:40%"
        this.codeBox.style = "font-size: 18px;";
        
        this.codeBox.innerHTML = this.problem.text.initial;
        this.thread1 = document.createElement('code');
        this.thread1.innerHTML = this.problem.text.t1;
        this.thread2 = document.createElement('code');
        this.thread2.innerHTML = this.problem.text.t2;
        this.codeDiv.append(this.codeBox);
        this.threadsDiv = document.createElement("div");
        this.threadsDiv.style = "display: flex; width: 75%; margin: auto"

        this.threadsDiv.append(this.thread1);
        this.threadsDiv.append(this.thread2);
        this.answerDiv.append(this.threadsDiv);
        this.background = document.createElement("div");
        this.background.className = "statement-div"

        this.rowCount = 0;
        this.answerTable = document.createElement("table");


        let variables = ["x", "y1", "y2"];
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
            
    }

    generateAnswerSlot(){
        let variables = ["this.userAnswers[i].x", "this.userAnswers[i].y1", "this.userAnswers[i].y2"]
        let row = '<tr>';
        for(let j = 0; j < variables.length; j++){
            row += `<td><input type="text" size="3" maxlength="3" class="answer-input" id=${this.rowCount}${j}_answer /></td>`;
        }

        row += '</tr>';
        this.answerTable.innerHTML += row;

    
            for(let i = 0; i < this.rowCount; i++){
                for (let j = 0; j<variables.length; j++){

                    let inputField = document.getElementById(`${i}${j}_answer`)
                    inputField.value = eval(variables[j])
                }
            }
    

        this.rowCount++;
        
    }


    clearButtons(){
        this.generateButton.remove()
        this.submitButton.remove()
        this.noMoreRowsButton.remove()
        
    }

    recordAnswered() {
        this.isAnswered = true;
    }

    renderTRButtons() {
        // "check me" button and "generate a number" button
        this.submitButton = document.createElement("button");
        this.submitButton.textContent = $.i18n("Check current row");
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
            const flag = (Math.random()>this.raceRate)?1:0
            this.userAnswers = [];
            for (let i = 0; i<20; i++){
                this.problem = initialize();
                this.stateArr = stateChange(this.problem.state, this.problem.thread1Info, this.problem.thread2Info, this.problem.thread1, this.problem.thread2)
                this.finalStates = possibleFinalStates(this.stateArr, this.problem.thread1.length, this.problem.thread2.length)

                if (this.finalStates.length > 1 || flag){
                    break;
                }
            }

            this.renderAnswerDiv();
            this.renderTRButtons()
            
        });

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
        this.containerDiv.appendChild(this.submitButton);
        this.containerDiv.appendChild(this.noMoreRowsButton);


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
            answers.push({x:temp.x, y1:temp.y1, y2:temp.y2});
        })
        for (let i = 0; i<answers.length; i++){
            answers[i] = JSON.stringify(answers[i])
        }
        let userRow = {};

        let variables = ["userRow.x", "userRow.y1", "userRow.y2"];

        for(let j = 0; j<variables.length; j++){
            let input = document.getElementById(`${this.rowCount-1}${j}_answer`).value;
                if(input!=""){
                    eval(`${variables[j]}` + `= ${input}`);
                }else{
                    eval(`${variables[j]}` + `= ""`)
                }
        }

        userRow = JSON.stringify(userRow)

        let userAnswers = []
        for (let i = 0; i<this.userAnswers.length; i++){
            userAnswers.push(JSON.stringify(this.userAnswers[i]))
        }

        if(userRow != '{"x":"","y1":"","y2":""}'){
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

        let variables = ["userRow.x", "userRow.y1", "userRow.y2"];
        let userRow = {}
        this.correct = true;


        let answers = [];
        this.finalStates.forEach(state =>{
            let temp = JSON.parse(state)
            answers.push({x:temp.x, y1:temp.y1, y2:temp.y2});
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
                if(input!=""){
                    eval(`${variables[j]}` + `= ${input}`);
                }else{
                    eval(`${variables[j]}` + `= ""`)
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