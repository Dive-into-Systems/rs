// *********
// vmtable.js
// *********
// This file contains the JS for the Runestone vmtable component. It was created By Luyuan Fan, Zhengfei Li, and Yue Zhang, 07/06/2023. 
"use strict";

import RunestoneBase from "../../common/js/runestonebase.js";
import "./vmtable-i18n.en.js";
import "../css/vmtable.css";
import { Pass } from "codemirror";

export var vmtableList = {}; // Object containing all instances of vmtable that aren't a child of a timed assessment.

const algo_FIFO = "FIFO";
const algo_LRU = "LRU";
const algo_reference = "reference";

// vmtable constructor
export default class vmtable extends RunestoneBase {
    constructor(opts) {
        super(opts);
        var orig = opts.orig; // entire <p> element
        this.useRunestoneServices = opts.useRunestoneServices;
        this.origElem = orig;
        this.divid = orig.id;

        this.createVmtableElement();
        this.caption = "Virtual Memory Table";
        this.addCaption("runestone");
        // this.checkServer("vmtable", true);
        if (typeof Prism !== "undefined") {
            Prism.highlightAllUnder(this.containerDiv);
        }
    }
    // Find the script tag containing JSON in a given root DOM node.
    scriptSelector(root_node) {
        return $(root_node).find(`script[type="application/json"]`);
    }
    /*===========================================
    ====   functions generating final HTML   ====
    ===========================================*/
    createVmtableElement() {
        this.feedbackDiv = document.createElement("div");

        // initialize parameters
        this.initParams();
        this.renderVmtableMain();
        
        // this.resetGeneration();
        this.resetGeneration();
        this.renderVmtableButtons();
        this.renderVmtableFeedbackDiv();

        // render the layout for the tables
        this.renderLayout();

        // replaces the intermediate HTML for this component with the rendered HTML of this component
        $(this.origElem).replaceWith(this.containerDiv);
    }

    initParams() {
        this.setDefaultParams();
        this.loadParams();
    }

    // set the default parameters
    setDefaultParams() {
        // total number of references
        this.numRefs = 8;
        // total number of bits
        this.numBits = 8;
        // number of offset bits
        this.offsetBits = 4;
        // block size
        this.blockSize = 1 << this.offsetBits;
        // number of index bits
        this.indexBits = this.numBits - this.offsetBits;
        // number of rows
        this.numRows = 1 << this.indexBits;

        // number of frames in the RAM
        this.numFrames = 4;
        // number of pages to be displayed
        this.numDisplayedPages = 5;
        
        // the minimum page number displayed in the page table
        // therefore, the displayed page number should be in [this.minIndex, this.minIndex + this.numDisplayedPages - 1]
        this.minIndex = null;
        this.fixedMinIndex = false;

        // the replacement algorithm.
        this.replacement = algo_FIFO;
        this.replacementAlgo = this.replacementFIFO;

        // replacement
        this.referenceBits = [];
        for (let i = 0; i < this.numFrames; i++) {
            this.referenceBits.push(0);
        }
        this.referencePtr = 0;

        // whether the exercise is fixed
        this.fixed = false;
        // whether the "redo" button appears
        this.redo = false;
        // whether the "generate another" button appears 
        this.generateAnother = true;

        // the fixed initial page table and reference list
        this.pageTableInit = null;
        this.referenceList = null;

        // page fault chances used in FIFO algorithm
        this.pf_chance_base = 2/3;
        this.pf_chance_boost = 1/3;
        this.pf_chance_reduce = 1/6;
    }

    // load customized parameters
    loadParams() {
        try {
            const currentOptions = JSON.parse(
                this.scriptSelector(this.origElem).html()
            );
            if (currentOptions["bits"] != undefined) {
                this.numBits = eval(currentOptions["bits"]);
            }
            if (currentOptions["offset"] != undefined) {
                this.offsetBits = eval(currentOptions["offset"]);
                this.blockSize = 1 << this.offsetBits;
            }            
            if (currentOptions["frames"] != undefined) {
                this.numFrames = eval(currentOptions["frames"]);
            }            
            if (currentOptions["displayed-pages"] != undefined) {
                this.numDisplayedPages = eval(currentOptions["displayed-pages"]);
            }            
            if (currentOptions["min-index"] != undefined) {
                this.fixedMinIndex = true;
                this.minIndex = eval(currentOptions["min-index"]);
            }            
            if (currentOptions["redo"] != undefined) {
                this.redo = eval(currentOptions["redo"]);
            }         
            if (currentOptions["num-references"] != undefined) {
                this.numRefs = eval(currentOptions["num-references"]);
            }
            if (currentOptions["replacement-algo"] != undefined) {
                this.replacement = currentOptions["replacement-algo"];
                switch (this.replacement) {
                    case algo_FIFO:
                        this.replacementAlgo = this.replacementFIFO;
                        break;
                    case algo_LRU:
                        this.replacementAlgo = this.replacementLikeLRU;
                        break;      
                    case algo_reference:
                        this.replacementAlgo = this.replacementReference;
                        break;
                    default:
                        this.replacementAlgo = this.replacementFIFO;
                        break; 
                }
            }
            if (currentOptions["fixed"] != undefined) {
                this.fixed = eval(currentOptions["fixed"]);
                if ( this.fixed ) {
                    this.pageTableInit = currentOptions["init-page-table"];
                    this.referenceList = currentOptions["reference-list"];
                    if (this.pageTableInit == null) {
                        this.pageTableInit = [];
                    }
                } 
            }
            this.indexBits = this.numBits - this.offsetBits;
            this.numRows = 1 << this.indexBits;

            // console.log(this.replacementAlgo);
        } catch (error) {
            // pass
            // console.log(this.scriptSelector(this.origElem));
            // console.log(error);
        }
    }

    renderVmtableMain() {
        // create the main div
        this.containerDiv = document.createElement("div");
        this.containerDiv.id = this.divid;

        this.createStatement1();
        // create the div for the info table and the displayed cache table
        this.promptDiv = document.createElement("div");
        this.promptDiv.setAttribute("class", "aligned-tables");
        this.createTableInfo();
        this.createRamTable();
        this.createDisplayedTable();
        this.containerDiv.appendChild(this.promptDiv);
        this.containerDiv.appendChild(document.createElement("br"));
        
        // create the div for the reference table and the answer table
        this.bodyTableDiv = document.createElement("div");
        this.bodyTableDiv.setAttribute("class", "aligned-tables");
        this.createReferenceTable();
        this.createAnswerTable();
        this.containerDiv.appendChild(this.bodyTableDiv);
        
        // Copy the original elements to the container holding what the user will see.
        $(this.origElem).children().clone().appendTo(this.containerDiv);

        // Remove the script tag.
        this.scriptSelector(this.containerDiv).remove();
    }

    // create the div with general instructions 
    createStatement1() {
        this.statementDiv1 = document.createElement("div");
        this.statementDiv1.textContent = 
            "Fill in the results of each memory operation (listed in the reference " + 
            "table) in the table located at the lower-right corner. The effects of each memory operation " +
            "will be reflected in both your current RAM and page tables below.";
        this.containerDiv.appendChild(this.statementDiv1);
        this.containerDiv.appendChild(document.createElement("br"));
    }
    
    // create the div with detailed help
    createHelpStatement() {
        this.helpDiv = document.createElement("div");
        this.helpStatement = document.createElement("div");
        this.helpStatement.innerHTML = 
            "<div>You should choose one from 'Hit' or 'Page Fault'. </div>" +
            "<div>Both Page number and Frame should be decimal numbers. </div>"+
            "<div>If there will be an evicted page, select its page number and enter the valid bit and dirty bit of the evicted page. </div>" +
            "<div>If there won't be any page evicted, select the \"NA\" option. </div>";
        this.helpStatement.innerHTML +=
            "<div>Click 'Check answer' to check your response. </div>";
        if ( this.redo ) {
            this.helpStatement.innerHTML +=
                "<div>Click 'Redo Exercise' to redo the exercise.</div>";
        }
        if ( this.generateAnother ) {
            this.helpStatement.innerHTML += 
                "<div>Click 'Generate another' to generate another exercise.</div>";
        }
        this.helpStatement.style.visibility = "hidden";
        // create the button for display/hide help
        this.helpButton = document.createElement("button");
        this.helpButton.textContent = $.i18n("msg_vmtable_display_help");
        this.helpButton.addEventListener(            
            "click",
            function() {
                if (this.helpStatement.style.visibility == "hidden") {
                    this.helpStatement.style.visibility = "visible";
                    this.helpDiv.appendChild(this.helpStatement);
                    this.helpButton.textContent = $.i18n("msg_vmtable_hide_help");
                } else {
                    this.helpStatement.style.visibility = "hidden";
                    this.helpDiv.removeChild(this.helpStatement);
                    this.helpButton.textContent = $.i18n("msg_vmtable_display_help");
                }
            }.bind(this),
        false); 
        this.helpDiv.appendChild(document.createElement("br"));
        this.helpDiv.appendChild(this.helpButton);
        this.containerDiv.appendChild(this.helpDiv);
    }

    // create the table that displays the necessary information for the cache exercise
    createTableInfo() {
        this.tableInfo = document.createElement("table");
        this.tableInfo.innerHTML = 
        "<thead>" +
        "    <tr><th>Virtual Memory Info</th></tr>" +
        "</thead>" +
        "<tr>" +
        "   <td>" + this.numBits.toString() + "-bit Virtual Address</td>" + 
        "</tr>" +
        "<tr>" + 
        "   <td>Number of frams in RAM : " + this.numFrames.toString() + "</td>" +
        "</tr>" +
        "<tr>" +
        "   <td>Block Size : " + this.blockSize.toString() + "</td>" +
        "</tr>" +
        "<tr>" +
        "   <td>Replacement Algorithm : " + this.replacement + "</td>" +
        "</tr>";
        
        this.promptDiv.appendChild(this.tableInfo);
    }

    // create the displayed RAM table 
    createRamTable() {
        this.ramTable = document.createElement("table");
        this.ramTableHead = document.createElement("thead");
        this.ramTableHead.innerHTML = 
        "<tr><th colspan=\"3\">RAM Content</th></tr>" +
        "<tr>" +
        "    <th>Frame</th>" +
        "    <th>V</th>" +
        "    <th>Page</th>" +
        "</tr>";
        
        this.ramTable.appendChild(this.ramTableHead);

        this.ramTableBody = document.createElement("tbody");
        this.ramTable.appendChild(this.ramTableBody);
        this.promptDiv.appendChild(this.ramTable);
    }

    // height: auto; display:flex; flex-direction: row; justify-content:space-between
    // create the cache table to display
    createDisplayedTable() {
        this.displayedTable = document.createElement("table");
        // create the head row for the cache table
        this.displayedTableHead = document.createElement("thead");

        // if (this.cacheOrg === directMapped) {
        this.displayedTableHead.innerHTML = 
        "<tr>" +
        "   <th colspan=\"4\">Page Table</th>" +
        "</tr>" +
        "<tr>" +
        "    <th>Page</th>" +
        "    <th>V</th>" +
        "    <th>D</th>" +
        "    <th>Frame</th>" +
        "</tr>";

        this.displayedTable.appendChild(this.displayedTableHead);  
        // create the body for the cache table
        this.displayedTableBody = document.createElement("tbody");
        this.displayedTable.appendChild(this.displayedTableBody);
        this.promptDiv.appendChild(this.displayedTable);
    }

    // create the reference table element
    createReferenceTable() {
        this.referenceTable = document.createElement("table");
        // create the head row for the reference table
        this.referenceTableHead = document.createElement("thead");   
        this.referenceTableHead.innerHTML = 
        "<tr><th colspan=\"3\">Memory Operations</th></tr>" + 
        "<tr>" +
        "<th title=\"Reference Number\">Ref</th>"+
        "<th title=\"Address\">Address</th>"+
        "<th title=\"Read or Write\">R/W</th>"+
        "</tr> ";
        this.referenceTable.appendChild(this.referenceTableHead);  
        
        // create the body for the reference table
        this.referenceTableBody = document.createElement("tbody");
        this.referenceTable.appendChild(this.referenceTableBody);
        
        this.bodyTableDiv.appendChild(this.referenceTable);
    }

    createAnswerTable() {
        this.answerTable = document.createElement("table");
        // create the head row for the reference table
        this.answerTableHead = document.createElement("thead");
        this.answerTableHead.innerHTML = 
        "<tr><th colspan=\"7\">Enter Effects from Memory Reference</th></tr>" + 
        "<tr>" +
        "<th title=\"Hit?\" >Hit</th>"+
        "<th title=\"Page Fault?\" >Page Fault</th>"+
        "<th title=\"Page Number\" >Page Number</th>"+
        "<th title=\"Valid Bit\" >Valid</th>"+
        "<th title=\"Dirty Bit\" >Dirty</th>"+
        "<th title=\"Frame Number\" >Frame</th>"+
        "</tr> ";
        this.answerTable.appendChild(this.answerTableHead);  
        
        // create the body for the reference table
        this.answerTableBody = document.createElement("tbody");
        this.answerTable.appendChild(this.answerTableBody);
        
        this.bodyTableDiv.appendChild(this.answerTable);
    }

    // render the layout for tables
    renderLayout() {
        this.tableInfo.setAttribute("width", "20%");
        this.ramTable.setAttribute("width", "20%");
        this.displayedTable.setAttribute("width", "45%");
        this.referenceTable.setAttribute("width", "22%");
        this.answerTable.setAttribute("width", "75%");

        this.ramTableHead.rows[1].cells[0].setAttribute("width", "35%");
        this.ramTableHead.rows[1].cells[1].setAttribute("width", "30%");
        this.ramTableHead.rows[1].cells[2].setAttribute("width", "35%");
    
        this.displayedTableHead.rows[1].cells[0].setAttribute("width", "40%");
        this.displayedTableHead.rows[1].cells[1].setAttribute("width", "20%");
        this.displayedTableHead.rows[1].cells[2].setAttribute("width", "20%");
        this.displayedTableHead.rows[1].cells[3].setAttribute("width", "20%");

        this.answerTableHead.rows[1].cells[0].setAttribute("width", "20%");
        this.answerTableHead.rows[1].cells[1].setAttribute("width", "20%");
        this.answerTableHead.rows[1].cells[2].setAttribute("width", "24%");
        this.answerTableHead.rows[1].cells[3].setAttribute("width", "12%");
        this.answerTableHead.rows[1].cells[4].setAttribute("width", "12%");
        this.answerTableHead.rows[1].cells[5].setAttribute("width", "12%");
    }
    
    // initialize the body of displayed cache table
    initDisplayedTableBody() {
        this.displayedTableBody.innerHTML = "";
        var tableRow;
        for ( var i = 0 ; i < this.numDisplayedPages ; i ++ ) {
            const rowIndex = this.getDisplayedRowIndex(i).toString();
            tableRow = document.createElement("tr");
            tableRow.innerHTML = 
            "<td>"+ rowIndex +"</td>" + 
            "<td>0</td>" +
            "<td>0</td>" +
            "<td></td>";
            tableRow.style.backgroundColor = "white";
            this.displayedTableBody.appendChild(tableRow);
            this.currentVmTable.push([0, 0, ""]);
        }
    }

    // initialize the body of RAM table
    initRamTableBody() {
        this.ramTableBody.innerHTML = "";
        var tableRow;
        // only stores this.numFrames frames
        // therefore, there is always a offset between the displayed page number and its corresponding internal id. 
        // use this.getDisplayedRowIndex and this.getRealRowIndex to do conversion between them.
        for ( var i = 0 ; i < this.numFrames ; i ++ ) {
            tableRow = document.createElement("tr");
            tableRow.innerHTML = 
            "<td>"+ i.toString() +"</td>" + 
            "<td>0</td>" +
            "<td></td>";
            tableRow.style.backgroundColor = "white";
            this.ramTableBody.appendChild(tableRow);
        }
    }

    // initialize the body of reference table
    initReferenceTableBody() {
        this.referenceTableBody.innerHTML = "";
    }

    // initialize the body of answer table
    initAnswerTableBody() {
        this.answerTableBody.innerHTML = "";
    }

    // update the reference table and answer table
    updateReferenceTableAndAnswerTable() {
        if (this.curr_ref > 0) {
            this.disableAnswerTableCurrentRow(this.curr_ref-1);
        }
        this.addReferenceTableNewRow();
        this.addAnswerTableNewRow();
    }

    // disable all the input fields of the previous two rows
    disableAnswerTableCurrentRow(ref) {
        for ( var old_cell of this.answerTableBody.rows[ 2 * ref ].cells ) {
            for ( var field of old_cell.children ) {
                field.setAttribute("readonly", "readonly");
                field.setAttribute("disabled", "disabled");
            }
        }
        for ( var old_cell of this.answerTableBody.rows[ 2 * ref + 1 ].cells ) {
            for ( var field of old_cell.children ) {
                field.setAttribute("readonly", "readonly");
                field.setAttribute("disabled", "disabled");
            }
        }
    } 

    // hide and clear one input field
    disableOneInputField(field) {
        field.setAttribute("disabled", "disabled");
        field.value = "";
        field.style.visibility = "hidden";
    }

    // update the body of the displayed cache table
    updateDisplayedTableBody() {
        this.setCellsToDefault(this.displayedTableBody);
        const changed_line_index = this.getRealRowIndex( this.answer_list[this.curr_ref-1][2]);
        const evicted_line_index = this.getRealRowIndex( this.answer_list[this.curr_ref-1][1]);
        for (let i = 0; i < this.numDisplayedPages; i++) {
            if ( i == changed_line_index || i == evicted_line_index ) {
                // only update the changed line
                this.updateDisplayedTableBodyRow(i);
                this.highlightChanges(this.displayedTableBody.rows[ i ]);
            } 
        }
    }

    // update a row of the body of the displayed cache table
    updateDisplayedTableBodyRow(index) {
        this.displayedTableBody.rows[index].cells[1].textContent = this.currentVmTable[index][0].toString();
        this.displayedTableBody.rows[index].cells[2].textContent = this.currentVmTable[index][1].toString();
        this.displayedTableBody.rows[index].cells[3].textContent = this.currentVmTable[index][2];
    }

    // set all cells of a table body to default 
    setCellsToDefault(table) {
        for (var row of table.rows) {
            for (let cell of row.cells) {
                cell.style.backgroundColor = "white";
            }
        }
    }

    // highlight every cell of a row
    highlightChanges(row) {
        for ( let cell of row.cells ) {
            cell.style.backgroundColor = "yellow";
        } 
    }

    // add a new row to the reference table
    addReferenceTableNewRow() {
        // create new row element
        let referenceTableNewRow = document.createElement("tr");
        // get the current reference number
        const curr_ref = this.curr_ref; 

        // the first column is the reference number
        var cellCurrRef = document.createElement("td");
        cellCurrRef.textContent = curr_ref.toString();
        cellCurrRef.setAttribute("rowspan", "2");
        referenceTableNewRow.appendChild(cellCurrRef);

        // the second column is the address
        const curr_address = this.answer_list[curr_ref][0];
        var cellCurrAddr = document.createElement("td");
        cellCurrAddr.textContent = curr_address;
        cellCurrAddr.setAttribute("rowspan", "2");
        referenceTableNewRow.appendChild(cellCurrAddr);

        // the third column is RW
        const curr_RW = this.read_write_list[curr_ref] ? "W" : "R";
        var cellCurrRW = document.createElement("td");
        cellCurrRW.textContent = curr_RW;
        cellCurrRW.setAttribute("rowspan", "2");
        referenceTableNewRow.appendChild(cellCurrRW);

        this.referenceTableBody.appendChild(referenceTableNewRow);
        let referenceTablePlaceHolder = document.createElement("tr");
        this.referenceTableBody.appendChild(referenceTablePlaceHolder);
    }

    // add a new row to the answer table
    addAnswerTableNewRow() {
        let answerTableNewRow1 = document.createElement("tr");
        let answerTableNewRow2 = document.createElement("tr");
        // generate prompt side
        const curr_ref = this.getCurrRefStr(); // current reference number
        // generate input side
        // generate radio for Hit and Miss
        var cellHit = document.createElement("td");
        var cellHitBox = document.createElement("input");
        $(cellHitBox).attr({
            type: "radio",
            value: "H",
            name: "HM" + curr_ref,
            id: "Hit" + curr_ref
        });
        cellHit.appendChild(cellHitBox);
        answerTableNewRow1.appendChild(cellHit);
        
        var cellMiss = document.createElement("td");
        var cellMissBox = document.createElement("input");
        $(cellMissBox).attr({
            type: "radio",
            value: "M",
            name: "HM" + curr_ref,
            id: "Miss" + curr_ref
        });
        cellMiss.appendChild(cellMissBox);
        answerTableNewRow1.appendChild(cellMiss);
        
        // generate normal input fields
        // generate input field for index
        var cellInputIndexBox = document.createElement("input");
        $(cellInputIndexBox).attr({
            type: "text",
            size: "2",
            maxlength: "3",
            name: "Index" + curr_ref,
        });
        var cellInputIndex = document.createElement("td");
        cellInputIndex.appendChild(cellInputIndexBox);
        answerTableNewRow1.appendChild(cellInputIndex);

        // generate input field for valid bit
        var cellInputValidBox = document.createElement("input");
        $(cellInputValidBox).attr({
            type: "text",
            size: "1",
            maxlength: "1",
            name: "Valid" + curr_ref,
        });
        var cellInputValid = document.createElement("td");
        cellInputValid.appendChild(cellInputValidBox);
        answerTableNewRow1.appendChild(cellInputValid);

        // generate input field for dirty bit
        var cellInputDirtyBox = document.createElement("input");
        $(cellInputDirtyBox).attr({
            type: "text",
            size: "1",
            maxlength: "1",
            name: "Dirty" + curr_ref,
        });
        var cellInputDirty = document.createElement("td");
        cellInputDirty.appendChild(cellInputDirtyBox);
        answerTableNewRow1.appendChild(cellInputDirty);

        // generate input field for frame number
        var cellInputFrameBox = document.createElement("input");
        $(cellInputFrameBox).attr({
            type: "text",
            size: "2",
            maxlength: "2",
            name: "Frame" + curr_ref,
        });
        var cellInputFrame = document.createElement("td");
        cellInputFrame.appendChild(cellInputFrameBox);
        answerTableNewRow1.appendChild(cellInputFrame);

        // add the event listener for the last button 

        let cellEvictedPrompt = document.createElement("td");
        cellEvictedPrompt.textContent = "Evicted?";
        cellEvictedPrompt.setAttribute("colspan", "2");
        answerTableNewRow2.appendChild(cellEvictedPrompt);
        // generate the dropdown field
        let cellEvicted = document.createElement("td");
        let cellEvictedBox = document.createElement("select");
        $(cellEvictedBox).attr({
            name: "Evicted" + curr_ref,
            id: "Evicted" + curr_ref
        });
        let nullOption = document.createElement("option");
        nullOption.value = "-1";
        nullOption.text = "NA";
        cellEvictedBox.appendChild(nullOption);
        for ( var i = 0; i < this.numDisplayedPages; i ++ ) {
            const rowIndex = this.getDisplayedRowIndex(i);
            var rowOption = document.createElement("option");
            rowOption.value = rowIndex;
            rowOption.text = rowIndex.toString();
            cellEvictedBox.appendChild(rowOption);
        }
        cellEvictedBox.addEventListener("change",
            function() {
                this.changeSecondInputLine();
            }.bind(this),
            false);
        cellEvicted.appendChild(cellEvictedBox);
        answerTableNewRow2.appendChild(cellEvicted);

        // generate input field for valid bit
        var cellInputValidBox2 = document.createElement("input");
        $(cellInputValidBox2).attr({
            type: "text",
            size: "1",
            maxlength: "1",
            name: "Valid2" + curr_ref,
        });
        var cellInputValid2 = document.createElement("td");
        cellInputValid2.appendChild(cellInputValidBox2);
        answerTableNewRow2.appendChild(cellInputValid2);

        // generate input field for dirty bit
        var cellInputDirtyBox2 = document.createElement("input");
        $(cellInputDirtyBox2).attr({
            type: "text",
            size: "1",
            maxlength: "1",
            name: "Dirty2" + curr_ref,
        });
        var cellInputDirty2 = document.createElement("td");
        cellInputDirty2.appendChild(cellInputDirtyBox2);
        answerTableNewRow2.appendChild(cellInputDirty2);

        var cellInputFrame2 = document.createElement("td");
        answerTableNewRow2.appendChild(cellInputFrame2);

        this.disableOneInputField(cellInputValidBox2);
        this.disableOneInputField(cellInputDirtyBox2);

        this.answerTableBody.appendChild(answerTableNewRow1);
        this.answerTableBody.appendChild(answerTableNewRow2);

        cellInputFrameBox.addEventListener("keypress", function(e) {
            if (e.key === "Enter") {
                e.preventDefault();
                this.submitResponse();
            }
        }.bind(this), false);

        cellInputDirtyBox2.addEventListener("keypress", function(e) {
            if (e.key === "Enter") {
                e.preventDefault();
                this.submitResponse();
            }
        }.bind(this), false);
    }
    
    // display the input fields in the second line when the option of evicted is not NA
    changeSecondInputLine() {
        const curr_ref_str = this.getCurrRefStr();
        const validField2 = 
            document.querySelector('input[name="Valid2' + curr_ref_str + '"]');
        const dirtyField2 = 
            document.querySelector('input[name="Dirty2' + curr_ref_str + '"]');
        const currentOption =
            document.querySelector('select[name="Evicted' + curr_ref_str + '"]').value;
        if ( currentOption.toString() == "-1" ) {
            this.disableOneInputField(validField2);
            this.disableOneInputField(dirtyField2);
        } else {
            this.activateOneInputField(validField2);
            this.activateOneInputField(dirtyField2);
        }
    }

    disableOneInputField(field) {
        field.setAttribute("disabled", "disabled");
        field.value = "";
        field.style.visibility = "hidden";
    }
    
    activateOneInputField(field) {
        field.removeAttribute("disabled");
        field.style.visibility = "visible";
    }
    
    recordAnswered() {  
        // pass
    }

    // render the two buttons
    renderVmtableButtons() {
        // "check me" button and "generate a number" button
        this.buttonDiv = document.createElement("div");
        this.submitButton = document.createElement("button");
        this.submitButton.textContent = $.i18n("msg_vmtable_check_me");
        $(this.submitButton).attr({
            class: "btn btn-success",
            name: "check and next",
            type: "button",
        });
        this.submitButton.addEventListener(
            "click",
            function () {
                this.submitResponse();
            }.bind(this),
            false
        );
        
        this.generateButton = document.createElement("button");
        this.generateButton.textContent = $.i18n("msg_vmtable_generate_another");
        $(this.generateButton).attr({
            class: "btn btn-success",
            name: "Generate Another",
            type: "button",
        });
        this.generateButton.addEventListener(
            "click",
            function () {
                this.fixed = false;
                this.fixedMinIndex = false;
                this.resetGeneration();
                this.hidefeedback();
            }.bind(this),
            false
        );

        this.redoButton = document.createElement("button");
        this.redoButton.textContent = $.i18n("msg_vmtable_redo");
        $(this.redoButton).attr({
            class: "btn btn-success",
            name: "Redo Exercise",
            type: "button",
        });
        this.redoButton.addEventListener(
            "click",
            function () {
                // this.fixed = true;
                this.resetGeneration();
                // this.displayNecessaryFields();
                this.hidefeedback();
            }.bind(this),
            false
        );

        // put all buttons together
        if ( this.generateAnother ) {
            this.buttonDiv.appendChild(this.generateButton);
        }
        if ( this.redo ) {
            this.buttonDiv.appendChild(this.redoButton);
        }

        this.buttonDiv.appendChild(this.submitButton);
        this.buttonDiv.setAttribute("class", "aligned-tables");
        this.containerDiv.appendChild(document.createElement("br"));
        this.containerDiv.appendChild(this.buttonDiv);

        this.createHelpStatement();
        this.helpButton.click();
    }

    // submit the response
    submitResponse() {
        if (this.curr_ref != this.numRefs ) {
            this.checkCurrentAnswer();
            if (this.correct) {
                this.curr_ref += 1;
                this.updateCurrentTagIndexTable();
                this.updateDisplayedTableBody();
                this.updateRamTableBody();
                if (this.curr_ref < this.numRefs) {
                    // call next
                    this.generateAnswerNext();
                    this.updateReferenceTableAndAnswerTable();
                } else {
                    // render feedback that congrats and this is all of the question
                    this.disableAnswerTableCurrentRow(this.curr_ref-1);
                    this.completed = true;
                }
            }
            this.logCurrentAnswer();
        }
    }

    updateCurrentTagIndexTable() {
        const changed_line = this.getRealRowIndex( this.answer_list[this.curr_ref-1][2]);
        const evicted_line = this.answer_list[this.curr_ref-1][1];
        this.currentVmTable[ changed_line ][ 0 ] = this.answer_list[this.curr_ref-1][3];
        this.currentVmTable[ changed_line ][ 1 ] = this.answer_list[this.curr_ref-1][4];
        this.currentVmTable[ changed_line ][ 2 ] = this.answer_list[this.curr_ref-1][5];
        // update the evicted line
        if ( evicted_line != -1 ) {
            const realEvictedIndex = this.getRealRowIndex( evicted_line );
            this.currentVmTable[ realEvictedIndex ][ 0 ] = 0;
        }
    }

    // generate another cache table exercise
    resetGeneration() {
        this.generateAnswerParams();
        this.initRamTableBody();
        this.initDisplayedTableBody();
        this.initReferenceTableBody();
        this.initAnswerTableBody();
        this.prepopulate();
        this.storeInitTable();
        this.generateAllAnsers();
        this.storeReferenceList();

        this.fixed = true;
        this.currentVmTable = [];
        this.readInitLines();
        this.updateDisplayedTableBodyInit();
        this.updateRamTableBodyInit();
        this.updateReferenceTableAndAnswerTable();
    }

    storeInitTable() {
        if ( this.fixed ) {
            return;
        }
        // save the page table
        this.pageTableInit = [];
        for ( let index = 0 ; index < this.numDisplayedPages; index ++ ) {
            if ( this.currentVmTable[ index ][ 0 ]) {
                let line = {};
                line.page = this.getDisplayedRowIndex(index);
                line.valid = 1;
                line.dirty = this.currentVmTable[ index ][ 1 ];
                line.frame = this.currentVmTable[ index ][ 2 ];
                this.pageTableInit.push(line);
            }
        }
    }

    storeReferenceList() {
        if ( this.fixed ) {
            return;
        }
        // save the list of memory reference
        this.referenceList = [];
        for ( let i = 0 ; i < this.numRefs; i ++ ) {
            var memRef = [ this.answer_list[i][0], this.read_write_list[i] ? "W" : "R" ];
            this.referenceList.push(memRef);
        }
    }

    // generate all memory references and answers at once
    generateAllAnsers() {
        for (this.curr_ref = 0; this.curr_ref < this.numRefs; this.curr_ref ++ ) {
            this.generateAnswerNext();
            if ( this.curr_ref > 0 ) {
                this.updateDisplayedTableBody();
                this.updateRamTableBody();
            }
        }
        this.curr_ref = 0;
    }
    
    // render the feedback div
    renderVmtableFeedbackDiv() {
        this.feedbackDiv.id = this.divid + "_feedback";
        this.containerDiv.appendChild(document.createElement("br"));
        this.containerDiv.appendChild(this.feedbackDiv);
        this.feedbackWrongAnswer = "";
    }

    // prepopulate the page table 
    prepopulate() {
        if ( this.fixed ) {
            this.readInitLines();
        } else {
            this.addRandomLines();
        }
        this.updateDisplayedTableBodyInit();
        this.updateRamTableBodyInit();
    }

    // update every line of the displayed page table
    updateDisplayedTableBodyInit() {
        this.setCellsToDefault(this.displayedTableBody);
        for (let i = 0; i < this.numDisplayedPages; i++) {
            this.updateDisplayedTableBodyRow(i);
        }
    }

    updateRamTableBodyInit() {
        this.initRamTableBody();
        for (let i = 0; i < this.replacementStruct.length; i++) {
            const currFrame = this.replacementStruct[i][0];
            const currPage = this.replacementStruct[i][1];
            this.ramTableBody.rows[ currFrame ].cells[ 1 ].textContent = 1;
            this.ramTableBody.rows[ currFrame ].cells[ 2 ].textContent = currPage;
        }
    }

    updateRamTableBody() {
        this.setCellsToDefault(this.ramTableBody);
        // update the Ram Table when last memory reference is missed
        if ( !this.hit_miss_list[ this.curr_ref - 1 ] ) {
            const new_frame = this.answer_list[ this.curr_ref - 1 ][ 5 ];
            this.highlightChanges(this.ramTableBody.rows[ new_frame ] );
            this.updateRamTableBodyRow(new_frame);
        }
    }

    updateRamTableBodyRow(new_frame) {
        this.ramTableBody.rows[new_frame].cells[ 1 ].textContent = this.answer_list[ this.curr_ref -1 ][ 3 ];
        this.ramTableBody.rows[new_frame].cells[ 2 ].textContent = this.answer_list[ this.curr_ref -1 ][ 2 ];
    }

    generateAnswerParams() {
        // initialize current tagIndex table
        this.currentVmTable = [];

        // generate read write list (bool): write = true; read = false
        this.read_write_list = [];

        // this list keeps track of the answer in terms of [address, evicted# (int or null), line# (int), valid bit (int 0/1), dirty bit (int 0/1), frame number (int)]
        // Remark: this list size grows as there is growing number of steps
        this.answer_list = [];

        // initialize the variable that traces whether a response is correct
        this.correct = null;

        // this is the flag that indicates whether one practice is completed 
        this.completed = false;

        // initialize hit miss list
        this.hit_miss_list = [];

        this.curr_ref = 0;

        if ( !this.fixedMinIndex ) {
            this.minIndex = Math.floor( Math.random() * (this.numRows - this.numDisplayedPages) );
            this.fixedMinIndex = true;
        }
        
        this.replacementStruct = [];

        this.invalid = new Set();
        for (let i = this.minIndex; i < this.minIndex + this.numDisplayedPages; i++) {
            this.invalid.add(i);
        }
        // we would use implicit parameters: num_ref, lines_in_set, offsetBits, tagBits, chance_hit, hit_incr, chance_conf, conf_incr
        this.numRows = 1 << this.indexBits;
        this.curr_hit_chance = this.chance_hit;
        this.hmFlag = false;
        this.curr_conflict_chance = this.chance_conf;
        this.conflictFlag = false;
        this.preconflictFlag = false;
        this.curr_ref = 0;
    }

    readInitLines() {
        // set the currentVmTable to default
        for (let i = 0; i < this.numDisplayedPages; i++) {
            this.currentVmTable.push([0,0,""]);
        }
        this.replacementStruct = [];
        // read each line from this.pageTableInit
        for (const line of this.pageTableInit ) {
            const index = eval(line["page"]);
            var v = 0, d = 0, frame = "";
            if ( line["valid"] != null ) {
                v = eval(line["valid"]);
            }
            if ( line["dirty"] != null ) {
                d = eval(line["dirty"]);
            }
            if ( line["frame"] != null ) {
                frame = eval(line["frame"]);
            }
            const realIndex = this.getRealRowIndex(index);
            this.currentVmTable[realIndex][0] = v;
            this.currentVmTable[realIndex][1] = d;
            this.currentVmTable[realIndex][2] = frame;
            if ( v ) {
                this.replacementStruct.push([0,0]);
            }
        }
        for ( let index = 0; index < this.numDisplayedPages; index ++ ) {
            if ( this.currentVmTable[index][0] ) {
                const displayedIndex = this.getDisplayedRowIndex(index);
                const frame = this.currentVmTable[index][2];
                this.replacementStruct[frame] = [frame, displayedIndex];
            }
        }
    }

    // generate the next answer
    generateAnswerNext() {
        let currPage, curr_rw, curr_offset;
        // 
        if ( this.fixed ) {
            const curr_ref = this.curr_ref;
            const memRef = this.referenceList[ curr_ref ][ 0 ];
            currPage = this.binary2decimal(memRef.slice(0, this.indexBits));
            curr_rw = this.referenceList[ curr_ref ][ 1 ] == "W" ? true : false;
            curr_offset = memRef.slice(-this.offsetBits);
        } else {
            currPage = this.genBoostNext();
            curr_rw = (Math.random() < 0.5);
            curr_offset = this.generateOffset();
        }

        const currPage_binary = this.toBinary(currPage, this.indexBits);
        const curr = this.replacementAlgo(currPage);
        const currFrame = curr[0];
        const evictedPage = curr[1];
        const curr_hm = curr[2];
        const currPageIndex = this.getRealRowIndex(currPage);

        const curr_dirty = this.calculateDirtyBit(this.currentVmTable[currPageIndex][0], 
            curr_rw, curr_hm, this.currentVmTable[currPageIndex][1]);

        // how to calculate dirty bit
        if (evictedPage != -1) {
            const evictedPageIndex = this.getRealRowIndex( evictedPage );
            this.currentVmTable[evictedPageIndex][0] = 0;
            this.currentVmTable[evictedPageIndex][1] = 0;
            this.currentVmTable[evictedPageIndex][2] = "";
        }
        this.currentVmTable[currPageIndex][0] = 1;
        this.currentVmTable[currPageIndex][1] = curr_dirty;
        this.currentVmTable[currPageIndex][2] = currFrame;

        // [address, evicted# (int or null), line# (int), valid bit (int 0/1), dirty bit (int 0/1), frame number (int)]
        const currAnswer = [currPage_binary + curr_offset, evictedPage, currPage, 1, curr_dirty, currFrame];
        this.answer_list.push(currAnswer);
        this.hit_miss_list.push(curr_hm);
        this.read_write_list.push(curr_rw);
    }

    // generate the 
    addRandomLines() {
        this.curr_ref = 0;
        this.curr_pf_chance = this.pf_chance_base;

        for (let i = 0; i < this.numFrames; i++) {
            if (Math.random() < 0.5) {
                continue;
            }
            const items = Array.from(this.invalid);
            const currPage = items[Math.floor(Math.random() * items.length)];
            const currFrame = this.replacementAlgo(currPage)[0];

            const currPageIndex = this.getRealRowIndex(currPage);
            const curr_dirty = Math.random() > 0.5 ? 1 : 0
            
            this.currentVmTable[currPageIndex][0] = 1;
            this.currentVmTable[currPageIndex][1] = curr_dirty;
            this.currentVmTable[currPageIndex][2] = currFrame;
        }
    }

    genBoostNext() {
        if (this.replacementStruct.length == 0) {
            const currIndex =  this.generateRandomIndex();
            this.curr_pf_chance = this.pf_chance_base;
            return currIndex;
        } else {
            if (Math.random() < this.curr_pf_chance) {
                this.curr_pf_chance -= this.pf_chance_reduce;
                const items = Array.from(this.invalid);
                return items[Math.floor(Math.random() * items.length)];
            } else {
                this.curr_pf_chance += this.pf_chance_boost;
                return this.replacementStruct[Math.floor(Math.random() * this.replacementStruct.length)][1];
            }
        }
    }

    // determine whether current page is stored in the replacementStruct
    // return the index in replacementStruct; if doesn't exist, return -1
    findPage(currPage) {
        for (let i = 0; i < this.replacementStruct.length; i++) {
            if (currPage == this.replacementStruct[i][1]) {
                return i;
            }
        }
        return -1;
    }

    // determine whether current frame is stored in the replacementStruct
    // return the index in replacementStruct; if doesn't exist, return -1
    findFrame(currFrame) {
        for (let i = 0; i < this.replacementStruct.length; i++) {
            if (currFrame == this.replacementStruct[i][0]) {
                return i;
            }
        }
        return -1;
    }

    // returns [frame to put in, page to evict, hit or miss]
    replacementFIFO(currPage) {
        let idx = this.findPage(currPage);
        let ret;
        if (idx == -1) {
            if (this.replacementStruct.length < this.numFrames) {
                this.replacementStruct.push([this.replacementStruct.length, currPage]);
                this.invalid.delete(currPage);
                ret = [this.replacementStruct.length - 1, -1, false];
            } else {
                let curr = this.replacementStruct.shift();
                let currFrame = curr[0];
                let evictedPage = curr[1];
                this.invalid.add(evictedPage);
                this.invalid.delete(currPage);
                this.replacementStruct.push([currFrame, currPage]);
                ret = [currFrame, evictedPage, false];
            }   
        } else {
            ret = [this.replacementStruct[idx][0], -1, true];
        }
        return ret;
    }

    // returns [frame to put in, page to evict, hit or miss]
    replacementLikeLRU(currPage) {
        let idx = this.findPage(currPage);
        let ret;
        if (idx == -1) {
            if (this.replacementStruct.length < this.numFrames) {
                this.replacementStruct.push([this.replacementStruct.length, currPage]);
                this.invalid.delete(currPage);
                ret =  [this.replacementStruct.length - 1, -1, false];
            } else {
                let curr = this.replacementStruct.shift();
                let currFrame = curr[0];
                let evictedPage = curr[1];
                this.invalid.add(evictedPage);
                this.invalid.delete(currPage);
                this.replacementStruct.push([currFrame, currPage]);
                ret =  [currFrame, evictedPage, false];
            }   
        } else {
            let currFrame = this.replacementStruct[idx][0];
            this.replacementStruct.splice(idx, 1);
            this.replacementStruct.push([currFrame, currPage]);
            ret =  [currFrame, -1, true];
        }
        return ret;
    }

    replacementReference(currPage) {
        let idx = this.findPage(currPage);
        if (idx == -1) {
            this.referencePtr %= this.numFrames;
            while (this.referenceBits[this.referencePtr]) {
                this.referenceBits[this.referencePtr] = 0;
                this.referencePtr++;
                this.referencePtr %= this.numFrames;
            }
            let currFrame = this.referencePtr;
            this.referenceBits[currFrame] = 1;
            let idx2 = this.findFrame(currFrame)
            if (idx2 == -1) {
                this.replacementStruct.push([currFrame, currPage]);
                this.invalid.delete(currPage);
                return [currFrame, -1, false];
            } else {
                let evictedPage = this.replacementStruct[idx2][1];
                this.replacementStruct.splice(idx2, 1);
                this.replacementStruct.push([currFrame, currPage]);
                this.invalid.add(evictedPage);
                this.invalid.delete(currPage);
                return [currFrame, evictedPage, false];
            }
        } else {
            this.referenceBits[this.replacementStruct[idx][0]] = 1;
            return [this.replacementStruct[idx][0], -1, true]
        }

    }

    /*===================================
    === Helper functions             ===
    ===================================*/

    // generate a random page number within the range of the displayed page table
    generateRandomIndex() {
        return Math.floor( Math.random() * this.numDisplayedPages ) + this.minIndex;
    }

    // generate a random offset 
    generateRandomOffset() {
        return this.generateAddress(this.offsetBits);
    }

    genRandomNext() {
        return this.generateRandomIndex();
    }
    // calculate the dirty bit
    // isValid:     bool
    // isWrite:     bool
    // isHit:       bool
    // PrevDirtyBit:bool 
    calculateDirtyBit(isValid, isWrite, isHit, PrevDirtyBit) {
        if (isWrite) { // if it is a write request, always set dirty bit to 1
            return 1;
        } else { // if it is a read request
            if (isHit) { // then if it is a hit, match current dirty bit state to that of the previous content
                if (PrevDirtyBit === 1 && isValid === 1) {
                    return 1;
                } else {
                    return 0;
                }
            } else { // then if it is a miss, would replace the original content, and always set dirty bit to 0
                return 0;
            }
        }
    }

    // convert a binary string expression to integer
    binary2decimal(binary) {
        var ans = 0;
        for (let i = 0; i < binary.length; i++) {
            if (binary[i] == "1") {
                ans = ans*2 + 1;
            } else {
                ans *= 2;
            }
        }
        return ans;
    }

    // convert internal real index to the displayed index, i.e. page number
    getDisplayedRowIndex(real_index) {
        return (real_index + this.minIndex);
    }

    // convert the page number to the internal real index
    getRealRowIndex(displayed_index) {
        return (displayed_index - this.minIndex);
    }

    // generate a random bit
    // r is the probability to get 0
    getRandomBit(r=0.5) {
        return Math.random() > r ? 1 : 0;
    }

    // Convert an integer to its binary expression with leading zeros as a string.
    // The string always has length of len
    toBinary(num, len) {
        var str = num.toString(2);
        if (str.length < len) {
            var leading_zeros = "";
            for ( var i = str.length ; i < len; i ++ ) {
                leading_zeros += "0";
            }
            str = leading_zeros + str;
        }
        return str;
    }

    // generate a random memory address with length=len
    generateAddress(len) {
        var addr = "";
        for (let i = 0; i < len; i++) {
            addr += this.getRandomBit().toString();
        }
        return addr;
    }

    generateOffset() {
        return this.generateAddress(this.offsetBits);
    }

    // get the string of this div id plus current reference number 
    getCurrRefStr() {
        return this.divid.toString() + "-" + this.curr_ref.toString();
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
    
    // check if the answer is correct.
    // print out corresponding feedback if there is a mistake.
    checkCurrentAnswer() {
        this.correct = false;
        const curr_ref = this.curr_ref;
        const curr_ref_str = this.getCurrRefStr();
        try {
            const response_hit_miss = 
                document.querySelector('input[name="HM' + curr_ref_str + '"]:checked').value === "H" ? true : false;
            const response_index =
                document.querySelector('input[name="Index' + curr_ref_str + '"]').value;
            const response_dirty =
                document.querySelector('input[name="Dirty' + curr_ref_str + '"]').value;
            const response_valid =
                document.querySelector('input[name="Valid' + curr_ref_str + '"]').value;
            const response_frame =
                document.querySelector('input[name="Frame' + curr_ref_str + '"]').value;
            const response_evicted =
                document.querySelector('select[name="Evicted' + curr_ref_str + '"]').value;
            const curr_answers = this.answer_list[ curr_ref ];
            if ( curr_answers[ 2 ].toString() != response_index ) {
                this.feedbackWrongAnswer = $.i18n("msg_vmtable_wrong_index");
                return;
            }

            if ( this.hit_miss_list[ curr_ref ] != response_hit_miss  ) {
                this.feedbackWrongAnswer = $.i18n("msg_vmtable_wrong_HM");
                return;
            }
            
            if ( curr_answers[ 3 ].toString() != response_valid ) {
                this.feedbackWrongAnswer = $.i18n("msg_vmtable_wrong_valid");
                return;
            }
            if ( curr_answers[ 4 ].toString() != response_dirty ) {
                this.feedbackWrongAnswer = $.i18n("msg_vmtable_wrong_dirty");
                return;
            }
            if ( curr_answers[ 5 ].toString() != response_frame ) {
                this.feedbackWrongAnswer = $.i18n("msg_vmtable_wrong_frame");
                return;
            }       
            if ( curr_answers[ 1 ].toString() != response_evicted ) {
                this.feedbackWrongAnswer = $.i18n("msg_vmtable_wrong_evicted");
                return;
            } else if ( response_evicted != "-1" ) {
                const response_dirty2 =
                    document.querySelector('input[name="Dirty2' + curr_ref_str + '"]').value;
                const response_valid2 =
                    document.querySelector('input[name="Valid2' + curr_ref_str + '"]').value;
                if ( "0" != response_valid2 ) {
                    this.feedbackWrongAnswer = $.i18n("msg_vmtable_wrong_evicted_valid");
                    return;
                }
                if ( "0" != response_dirty2 ) {
                    this.feedbackWrongAnswer = $.i18n("msg_vmtable_wrong_evicted_dirty");
                    return;
                }
            } 
            this.correct = true;
        } catch (error) {
            this.feedbackWrongAnswer = $.i18n("msg_vmtable_incomplete_answer");
            this.correct = false;
        }
    }

    async logCurrentAnswer(sid) {
        let answer = JSON.stringify();
        let qestion = JSON.stringify(
            [this.currentVmTable, this.referenceList]
        );
        // Save the answer locally.
        let feedback = true;
        this.setLocalStorage({
            answer: answer,
            timestamp: new Date(),
        });
        let data = {
            event: "vmtable",
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

    hidefeedback() {
        this.feedbackDiv.style.display = 'none';
    }

    displayfeedback() {
        this.feedbackDiv.style.display = 'block';
    }

    renderfeedback() {
        // only the feedback message needs to display
        var feedback_html = "";

        if (this.correct) {
            if (this.completed) {
                feedback_html += "<div>" + $.i18n("msg_vmtable_completed") + "</div>";
            } else {
                feedback_html += "<div>" + $.i18n("msg_vmtable_correct") + "</div>";                
            }
            $(this.feedbackDiv).attr("class", "alert alert-info");
        } else {
            feedback_html += "<div>" + this.feedbackWrongAnswer + "</div>";
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
    $("[data-component=vmtable]").each(function (index) { 
        var opts = {
            orig: this,
            useRunestoneServices: eBookConfig.useRunestoneServices,
        };
        if ($(this).closest("[data-component=timedAssessment]").length == 0) {
            // If this element exists within a timed component, don't render it here
            try {
                vmtableList[this.id] = new vmtable(opts);
            } catch (err) {
                console.log(
                    `Error rendering Cache Information Problem ${this.id}
                     Details: ${err}` 
                );
            }
        }
    });
});