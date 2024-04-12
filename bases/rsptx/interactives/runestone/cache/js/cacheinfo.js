// *********
// cacheinfo.js
// *********
// This file contains the JS for the Runestone cacheinfo component. It was created By Luyuan Fan, Zhengfei Li, and Yue Zhang, 06/06/2023. 
"use strict";

import RunestoneBase from "../../common/js/runestonebase.js";
import "./cache-i18n.en.js";
import "../css/cache.css";
import { Pass } from "codemirror";

export var cacheinfoList = {}; // Object containing all instances of cacheinfo that aren't a child of a timed assessment.

// // Example POST method implementation, edited for local server:
// async function postData(url = "http://localhost:3000/api/data", data = {}) {
//   // Default options are marked with *
//   const response = await fetch(url, {
//     method: "POST", // *GET, POST, PUT, DELETE, etc.
//     mode: "cors", // no-cors, *cors, same-origin
//     cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
//     credentials: "include", // include, *same-origin, omit
//     headers: {
//       "Content-Type": "application/json",
//       // 'Content-Type': 'application/x-www-form-urlencoded',
//     },
//     redirect: "follow", // manual, *follow, error
//     referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
//     body: JSON.stringify(data) // body data type must match "Content-Type" header
//   });
//   return response.json(); // parses JSON response into native JavaScript objects
// }

function DIS_Log(QID, timestamp, data) {
    // Print a message to the console for now
    console.log("Logging data for question with ID:", QID);
    console.log("Timestamp:", timestamp);
    console.log("Data:", data);

    //send asynchronous request to flask server
    // JSON data to send
    const postData = {
        questionID: QID,
        timestamp: timestamp,
        data: data
    };

    // URL of the Flask route designed to accept POST requests
    const url = 'http://pikachu:5000/wtv-endpoint'; // CHANGE

    fetch(url, {
        method: 'POST', // Sending data as POST
        headers: {
            'Content-Type': 'application/json' // Specifying the content type
        },
        body: JSON.stringify(postData) // Converting the JavaScript object to a JSON string
    })
    .then(response => response.json())
    .then(data => console.log('Success:', data))
    .catch((error) => {
        console.error('Error:', error);
    });
}

// cacheinfo constructor
export default class cacheinfo extends RunestoneBase {
    constructor(opts) {
        super(opts);
        var orig = opts.orig; // entire <p> element
        this.useRunestoneServices = opts.useRunestoneServices;
        this.origElem = orig;
        this.divid = orig.id;
        this.correct = null;
        // default number of bits = 4
        this.num_bits = 8;
        // keep track of the last generated cache combination and ensure
        // each time it generates a different combination
        this.last_rand_choice = [0,0,0];

        this.createCacheInfoElement();
        this.caption = "Cache System";
        this.addCaption("runestone");
        // this.checkServer("cacheinfo", true);
        if (typeof Prism !== "undefined") {
            Prism.highlightAllUnder(this.containerDiv);
        }
        this.generateButtonCounter = 0;
        this.contWrong = 0;
    }
    // Find the script tag containing JSON in a given root DOM node.
    scriptSelector(root_node) {
        return $(root_node).find(`script[type="application/json"]`);
    }
    /*===========================================
    ====   functions generating final HTML   ====
    ===========================================*/
    createCacheInfoElement() {
        this.feedbackDiv = document.createElement("div");
        this.renderCacheInfoInput();
        this.renderCacheInfoButtons();
        this.renderCacheInfofeedbackDiv();
        // replaces the intermediate HTML for this component with the rendered HTML of this component
        $(this.origElem).replaceWith(this.containerDiv);
        
    }
    renderCacheInfoInput() {
        // Generate the drop-down menu for cache organization
        this.containerDiv = document.createElement("div");
        this.questionDiv = document.createElement("div");
        this.containerDiv.id = this.divid;

        // list of cache organization opitons
        this.cacheOrgArray = ["Direct-Mapped", "2-Way Set Associative", "4-Way Set Associative"];

        // create the cache organization dropdown menu
        this.orgMenuNode = document.createElement("select");
        for (var i = 0; i < this.cacheOrgArray.length; i++) {
            var option = document.createElement("option");
            option.value = this.cacheOrgArray[i];  
            option.text = this.cacheOrgArray[i];
            this.orgMenuNode.appendChild(option);
        }
        this.orgMenuNode.setAttribute("class", "form form-control selectwidthauto");
        this.orgMenuNode.addEventListener("change",
            function () {
                this.clearInput();
                this.generateAnswer();
            }.bind(this),
            false);

        // Generate the drop-down menu for address length
        this.bitsLengthArray = ["4 bits", "8 bits", "16 bits"];
        
        // create the menu node for address length
        this.addrMenuNode = document.createElement("select");
        for (var i = 0; i < this.bitsLengthArray.length; i++) {
            var option = document.createElement("option");
            option.value = this.bitsLengthArray[i];
            option.text = this.bitsLengthArray[i];
            this.addrMenuNode.appendChild(option);
        }
        this.addrMenuNode.options[1].setAttribute('selected','selected'); // make 8 bits the default
        this.addrMenuNode.setAttribute("class", "form form-control selectwidthauto");
        // When the option fo addrMenuNode is changed, 
        this.addrMenuNode.addEventListener("change",
            function () {
                this.updateNumBits();
                this.generateAddress();
                this.clearInput();
                this.generateAnswer();
            }.bind(this),
            false);
        
        // Question Display //
            // create the helper instruction
        this.helperDiv = document.createElement("div");
        this.helperDiv.innerHTML = "In this assignment, you will answer questions about cache configuration " +
        "based on the provided information regarding the number of bits for the tag, index, and offset given below.";

            // create the address in the question prompt
        this.addressNode = document.createElement("div");
        var addressNodeTextSpan = document.createElement("span");
        addressNodeTextSpan.style.fontFamily = "Courier, monospace";
        this.addressNodeText = document.createTextNode("Address: ");
        addressNodeTextSpan.appendChild(this.addressNodeText);
        this.addressNodeAddress = document.createElement("code");
        this.addressNodeAddress.textContent = this.address_eg;
        this.addressNode.appendChild(addressNodeTextSpan);
        this.addressNode.appendChild(this.addressNodeAddress);
        this.addressNode.style.textAlign = "center";
        this.addressNode.style.fontSize = "x-large";
        
            // create the tag, index, and offset info in the question prompt
        this.partitionNode = document.createElement("div");
        this.tagNodeText = document.createTextNode("tag: ");
        this.tagNodeTag = document.createElement("code");
        this.tagNodeTag.textContent = this.tag_bits;
        this.indexNodeText = document.createTextNode("\tindex: ");
        this.indexNodeIndex = document.createElement("code");
        this.indexNodeIndex.textContent = this.index_bits;
        this.offsetNodeText = document.createTextNode("\toffset: ");
        this.offsetNodeOffset = document.createElement("code");
        this.offsetNodeOffset.textContent = this.offset_bits;
        this.partitionNode.appendChild(this.tagNodeText);
        this.partitionNode.appendChild(this.tagNodeTag);
        this.partitionNode.appendChild(this.indexNodeText);
        this.partitionNode.appendChild(this.indexNodeIndex);
        this.partitionNode.appendChild(this.offsetNodeText);
        this.partitionNode.appendChild(this.offsetNodeOffset);
        this.partitionNode.style.textAlign = "center";
        this.partitionNode.style.fontSize = "x-large";

            // create the menus and put the question prompt together
        this.statementDiv = document.createElement("div");
        this.statementDiv.appendChild(this.helperDiv);
        this.statementDiv.appendChild(document.createElement("br"));
        this.statementDiv.append("Cache Organization: ");
        this.statementDiv.appendChild(this.orgMenuNode);
        this.statementDiv.appendChild(document.createElement("br"));
        this.statementDiv.append("Address Length: ");
        this.statementDiv.appendChild(this.addrMenuNode);
        this.statementDiv.appendChild(document.createElement("br"));
        this.statementDiv.appendChild(document.createElement("br"));
        this.statementDiv.appendChild(this.addressNode);
        this.statementDiv.appendChild(document.createElement("br"));
        this.statementDiv.appendChild(this.partitionNode);
        this.statementDiv.appendChild(document.createElement("br"));

        this.statementDiv.style.borderWidth = "1px";
        this.statementDiv.style.borderRadius = "5px";
        this.statementDiv.style.borderBlockStyle = "solid";
        this.statementDiv.style.borderBlockColor = "white";
        this.statementDiv.style.backgroundColor = "white";
        this.statementDiv.style.padding = "9px";

        this.containerDiv.appendChild(this.statementDiv);
        this.containerDiv.appendChild(document.createElement("br"));
        
        // create answer field
        this.question1 = document.createElement("div");
        this.question1Prompt = document.createTextNode($.i18n("block_size") + "\t=\t");
        this.inputNode1 = document.createElement("input");
        this.question1.appendChild(this.question1Prompt);
        this.question1.appendChild(this.inputNode1);

        this.question2 = document.createElement("div");
        this.question2Prompt = document.createTextNode($.i18n("num_rows") + "\t=\t");
        this.inputNode2 = document.createElement("input");
        this.question2.appendChild(this.question2Prompt);
        this.question2.appendChild(this.inputNode2);

        this.question3 = document.createElement("div");
        this.question3Prompt = document.createTextNode($.i18n("num_lines") + "\t=\t");
        this.inputNode3 = document.createElement("input");
        this.question3.appendChild(this.question3Prompt);
        this.question3.appendChild(this.inputNode3);

        this.inputNodes = [this.inputNode1, this.inputNode2, this.inputNode3];
        for (var i = 0; i<3; i++) {
            this.inputNodes[i].addEventListener("keypress", function(e) {
                if (e.key === "Enter") {
                    e.preventDefault();
                    this.submitButton.click();
                }
            }.bind(this), false);  
        }
        this.questionDiv.appendChild(this.question1);
        this.questionDiv.appendChild(this.question3);
        this.questionDiv.appendChild(this.question2);
        this.containerDiv.appendChild(this.questionDiv);
        this.containerDiv.appendChild(document.createElement("br"));
        
        // Copy the original elements to the container holding what the user will see.
        $(this.origElem).children().clone().appendTo(this.containerDiv);
        
        this.generateAddress();
        this.generateAnswer();

        // Remove the script tag.
        this.scriptSelector(this.containerDiv).remove();
        // Set the class for the text inputs, then store references to them.
        let ba = $(this.containerDiv).find("input");
        ba.attr("class", "form form-control selectwidthauto");
        ba.attr("aria-label", "input area");
        ba.attr("type", "text");
        ba.attr("size", "10");
        ba.attr("maxlength", "10");
        ba.attr("placeholder", "your answer");
        
        this.blankArray = ba.toArray();
        // When a blank is changed mark this component as interacted with.
        // And set a class on the component in case we want to render components that have been used
        // differently
        for (let blank of this.blankArray) {
            $(blank).change(this.recordAnswered.bind(this));
        }
    }

    recordAnswered() {
        this.isAnswered = true;
    }

    renderCacheInfoButtons() {
        // "check me" button and "generate a number" button
        //this is the "Check Answer" button
        this.submitButton = document.createElement("button");
        this.submitButton.textContent = $.i18n("msg_cacheinfo_check_me");
        $(this.submitButton).attr({
            class: "btn btn-success",
            name: "do answer",
            type: "button",
        });
        this.submitButton.addEventListener(
            "click",
            function () {
                //add additional button functions below here
                this.checkCurrentAnswer();
                this.logCurrentAnswer();
                DIS_Log("11.1.1-submit_button", new Date().toISOString(), {
                    //user answers
                    user_block_size: this.inputNode1.value,
                    user_num_lines: this.inputNode2.value,
                    user_num_sets: this.inputNode3.value,

                    //correct answers
                    block_size: this.block_size_ans, 
                    num_lines: this.num_line_ans,
                    num_sets: this.num_entry,
                    correct: this.correct,
                });
            }.bind(this),
            false
        );
        
        this.generateButton = document.createElement("button");
        this.generateButton.textContent = $.i18n("msg_cacheinfo_generate_a_number");
        $(this.generateButton).attr({
            class: "btn btn-success",
            name: "Generate an Address",
            type: "button",
        });
        this.generateButton.addEventListener(
            "click",
            function () {
                //insert additional onclick functions here
                this.generateAddress();
                this.clearInput();
                this.generateAnswer();
                this.generateButtonCounter++;
                DIS_Log("11.1.1-generate_button", new Date().toISOString(), {
                    Question_Regeneration_Count: this.generateButtonCounter,
                });
            }.bind(this),
            false)
        ;
        this.containerDiv.appendChild(this.generateButton);
        this.containerDiv.appendChild(this.submitButton);
    }
    
    renderCacheInfofeedbackDiv() {
        this.feedbackDiv.id = this.divid + "_feedback";
        this.containerDiv.appendChild(document.createElement("br"));
        this.containerDiv.appendChild(this.feedbackDiv);
    }

    // clear the input fields
    clearInput() {
        for ( var i = 0 ; i < 3; i ++ ) {
            this.inputNodes[i].value = "";
            // reset the style of each input field
            this.inputNodes[i].setAttribute("class", "form form-control selectwidthauto");
        }
    }

    // update this.num_bits based on this.addrMenuNode
    updateNumBits() {
        switch (this.addrMenuNode.value) {
            case "4 bits":
                this.num_bits = 4;
                break;
            case "8 bits":
                this.num_bits = 8;
                break;
            case "16 bits":
                this.num_bits = 16;
                break;
        }
    }
    
    // generate a memory address
    generateAddress() {
        // this.num_bits = this.addrMenuNode.value;
        this.len_address = (1 << this.num_bits)
        this.address_eg = "0b";
        for (let i = 0; i < this.num_bits; i++) {
            let curr_rand = Math.random();
            if (curr_rand < 0.5) {
                this.address_eg += "0";
            } else {
                this.address_eg += "1";
            }
        }
        
        this.genRandList();
        while (this.checkSameRandList()) {
            this.genRandList();
        }

        this.tag_bits = this.rand_list[0];
        this.index_bits = this.rand_list[1];
        this.offset_bits = this.rand_list[2];
        
        this.block_size = 1 << this.offset_bits;
        this.num_entry = 1 << this.index_bits;  
        this.last_rand_choice = this.rand_list;
    }
    
    // check if the newly generated list is the same as the old one
    checkSameRandList() {
        for (let i = 0; i < 3; i++) {
            if (this.rand_list[i] != this.last_rand_choice[i]) {
                return false;
            }
        }
        return true;
    }
    
    genRandList() {
        this.rand_list = [1,1,1];
        for (let i = 0; i < this.num_bits-3; i++) {
            if ((this.num_bits > 4) && i == 0) {
                this.rand_list[1] += 1;
                continue;
            }
            let curr_rand = Math.random();
            if (curr_rand < 0.34) {
                this.rand_list[0] += 1;
            } else if (curr_rand < 0.67) {
                this.rand_list[1] += 1;
            } else {
                this.rand_list[2] += 1;
            }            
        }
    }

    // generate the answer as a string based on the randomly generated number
    generateAnswer() {
        this.hidefeedback();
        this.questionDiv.style.visibility = "visible";
        this.displayFeed = [];
        
        this.block_size_ans = this.block_size;
        this.entries_ans = this.num_entry;
        
        // number of lines have something to do with the set associatives
        switch (this.orgMenuNode.value) {
            case "Direct-Mapped" : 
                this.num_line_ans = this.entries_ans;           
                this.question2.style.display = 'none';
                break;
            case "2-Way Set Associative" : 
                this.num_line_ans = (this.entries_ans)*2;
                this.question2.style.display = 'block';
                break;
            case "4-Way Set Associative" : 
                this.num_line_ans = (this.entries_ans)*4;
                this.question2.style.display = 'block';
                break;
        }
        this.answers = [this.block_size_ans, this.entries_ans, this.num_line_ans];
        this.generatePrompt();
    }

    /*===================================
    === Checking/loading from storage ===
    ===================================*/
    restoreAnswers(data) {
        // pass
    }
    checkLocalStorage() {
        // pass
    }
    setLocalStorage(data) {
        // pass
    }
    
    // check if the answer is correct
    checkCurrentAnswer() {
        // the answer is correct if each of the input field is the same as its corresponding value in this.answers
        this.correct = true;
        this.feedback_msg = [];
        let wrongFlag = false;
        for (var i = 0; i < 3; i ++ ) {
            // skip the question for number of sets when in direct-mapped
            if ( this.orgMenuNode.value === "Direct-Mapped" && i === 1) {
                continue;
            }
            var input_value = this.inputNodes[i].value;
            if ( input_value === "" ) {
                this.feedback_msg.push($.i18n("msg_no_answer"));
                this.correct = false;
                // change the style of input field to alert-danger when no answer provided
                this.inputNodes[i].setAttribute("class", "alert alert-danger");
            } else if ( input_value != this.answers[i] ) {
                let currMsg = "";
                currMsg += ($.i18n("msg_cacheinfo_incorrect_0"+i.toString()));
                console.log($.i18n("msg_cacheinfo_incorrect_0"+i.toString()))
                this.correct = false;
                // change the style of input field to alert-danger when the answer is wrong
                this.inputNodes[i].setAttribute("class", "alert alert-danger");
                
                wrongFlag = true;

                if (this.contWrong >= 2) {
                    currMsg += ($.i18n("msg_cacheinfo_incorrect_hint" + i.toString()));
                }
                this.feedback_msg.push(currMsg);
            } else {
                this.feedback_msg.push($.i18n("msg_cacheinfo_correct"));
                // 
                this.inputNodes[i].setAttribute("class", "alert alert-info");
            }
        }

        if (wrongFlag) {
            this.contWrong ++;
        } else {
            this.contWrong = 0;
        }
    }

    async logCurrentAnswer(sid) {
        let answer = JSON.stringify(this.inputNodes);
        // Save the answer locally.
        let feedback = true;
        this.setLocalStorage({
            answer: answer,
            timestamp: new Date(),
        });
        let data = {
            event: "cacheinfo",
            act: answer || "",
            answer: answer || "",
            correct: this.correct ? "T" : "F",
            div_id: this.divid,
        };
        if (typeof sid !== "undefined") {
            data.sid = sid;
            feedback = false;
        }
        
        this.renderfeedback();
        return data;
    }

    // update the prompt
    generatePrompt() {
        this.addressNodeAddress.textContent = this.address_eg;
        this.tagNodeTag.textContent = this.tag_bits;
        this.indexNodeIndex.textContent = this.index_bits;
        this.offsetNodeOffset.textContent = this.offset_bits;
    }

    hidefeedback() {
        this.feedbackDiv.style.display = 'none';
    }

    displayfeedback() {
        this.feedbackDiv.style.display = 'block';
    }

    renderfeedback() {
        // only the feedback message needs to display
        var feedback_html = "";
        // only two lines of feedback for direct-mapped
        if ( this.orgMenuNode.value === "Direct-Mapped" ) {
            for ( var i = 0; i < 2; i ++ ) {
                feedback_html += "<dev>" + this.feedback_msg[i] + "</dev>";
                if ( i < 1 ) {
                    feedback_html += "<br/>";
                }
            }
        // otherwise, display 3 lines of feedback
        } else {
            for ( var i = 0; i < 3; i ++ ) {
                feedback_html += "<dev>" + this.feedback_msg[i] + "</dev>";
                if ( i < 2 ) {
                    feedback_html += "<br/>";
                }
            }
        }

        if (this.correct) {
            $(this.feedbackDiv).attr("class", "alert alert-info");
        } else {
            $(this.feedbackDiv).attr("class", "alert alert-danger");
        }
        
        this.feedbackDiv.innerHTML = feedback_html;
        this.displayfeedback();
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
    $("[data-component=cacheinfo]").each(function (index) {
        var opts = {
            orig: this,
            useRunestoneServices: eBookConfig.useRunestoneServices,
        };
        if ($(this).closest("[data-component=timedAssessment]").length == 0) {
            // If this element exists within a timed component, don't render it here
            try {
                cacheinfoList[this.id] = new cacheinfo(opts);
            } catch (err) {
                console.log(
                    `Error rendering Cache Information Problem ${this.id}
                     Details: ${err}`
                );
            }
        }
    });
});
