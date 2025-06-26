// *****************************************************************
// circuittruth.js. This file was created by Bohou Zhang in June 2025.
// *****************************************************************
/*
 * - This file contains the class used to generate circuits for all existing
 *   circuit components.
 * 
 * - Methods of this class:
 *     -constructor(inputs, gateTypes, maxGates, minGates, exactInput=false, prevGen=null):
 *      The constructor for this class has 4 parameters with 2 additional optional parameters.
 *       -inputs (an array of strings): the list of names of the input nodes. The class supports
 *        up to 5 inputs, which should be capitalized letters of the alphabet. For example, a valid
 *        argument to pass this parameter is ["A", "B", "C"];
 *       -gateTypes (an array of strings): the list of gates that can be generated. The class supports
 *        "AND", "OR", "NOT", "XOR", "NAND", "NOR" gates.
 *    
*/
import circuitAST from "./circuit_AST/circuitAST";
export default class circuit_generator{
    constructor(inputs, gateTypes, maxGates, minGates, exactInput=false, prevGen=null){
        this.inputs = inputs;
        this.maxGates = maxGates-1;
        this.minGates = minGates-1;
        this.gateTypes = gateTypes;
        this.exactInput = exactInput;
        this.notSelected = false;
        this.prevGen = prevGen;
        if(this.gateTypes.includes("NOT")){
            this.gateTypes = this.gateTypes.filter(item => item!="NOT")
            this.notSelected = true;
        }
    }

    generateStatement = ()=>{
        let numGates = Math.floor((Math.random()*(this.maxGates-this.minGates)+1)+this.minGates)
        let selection = []
        if(this.notSelected){
            for(let i = 0; i<numGates; i++){
                selection.push(Math.floor((Math.random()*(3)+2)))
            }
        } else{
            for(let i = 0; i<numGates; i++){
                selection.push(Math.floor((Math.random()*(2)+2)))
            }
        }

        this.ret = this.chooseFeedGate(selection);
        if(this.exactInput == true){
            this.ensureExactInput();
            if(this.skipped){
                this.ret = this.generateStatement();
            }
        } else{
            this.ensureDifferentInput();
            if(this.badInput){
                this.ret = this.generateStatement();
            }
        }

        this.new_circuit = new circuitAST();
        this.new_circuit.insert(this.ret);
        this.newTruthTable = this.new_circuit.getTruthTable();
        this.ensureDifferentOutput();
        
        return this.ret;
        
    }

    getTruthTable(){
        return this.newTruthTable;
    }

    getInformation(){
        let info = this.new_circuit.getInformation();

        return {inputs: info.inputs, numInputs: info.numInputs, root: info.root, ast: this.new_circuit};
    }


    ensureDifferentOutput = () =>{
        if(this.prevGen != null){
            
            let old_circuit = new circuitAST();
            old_circuit.insert(this.prevGen);
            let oldTruthTable = old_circuit.getTruthTable();
            
            if(JSON.stringify(oldTruthTable) == JSON.stringify(this.newTruthTable)){
                this.generateStatement();
            }
        }
    }

    ensureDifferentInput = () =>{
        const inputSet = new Set();
        const inputPattern = /\b[A-Z]\b/g;
        let match;
        while ((match = inputPattern.exec(this.ret)) !== null) {
            inputSet.add(match[0]);
        }
        let used = Array.from(inputSet).sort();
        this.badInput = false;
        if (used.length == 1){
            this.badInput = true;
        }
    }

    ensureExactInput = () => {
        let unused = [];
        const inputSet = new Set();
        const inputPattern = /\b[A-Z]\b/g;
        let match;
        while ((match = inputPattern.exec(this.ret)) !== null) {
            inputSet.add(match[0]);
        }
        let used = Array.from(inputSet).sort();
        let matchLetter = []
        if (JSON.stringify(used) != JSON.stringify(this.inputs)) {
            this.inputs.forEach((item)=>{
                if (!used.includes(item)){
                    unused.push(item);
                }
            })
            used.forEach((input)=>{
                let searchString = new RegExp(`\\b${input}\\b`, 'g');
                matchLetter.push(this.ret.match(searchString).length);
            })
            
            this.skipped = true;
            unused.forEach((element)=>{
                const index = matchLetter.findIndex(item=>item > 1);
                if (index != -1 && used.length >= (this.inputs.length-1)){
                    this.skipped = false
                }
                const toReplace = used[index];
                const re = new RegExp(`\\b${toReplace}\\b`);
                this.ret = this.ret.replace(re, element);
                matchLetter[index]--;

            })
        }
    }

    chooseInput = (prevChoice=null)=>{

        let selectInputs = this.inputs;
    
        if(prevChoice!=null){
            selectInputs = selectInputs.filter(item => item!=prevChoice);
        }

        const inputChoice = Math.floor(Math.random()*selectInputs.length);

        return selectInputs[inputChoice]
    }

    chooseGate = (prevChoice=null) =>{
        let selectGate = this.gateTypes;

        if(prevChoice!=null){
            selectGate = selectGate.filter(item => item!=prevChoice);
        }

        const gateChoice = Math.floor(Math.random()*selectGate.length);


        return selectGate[gateChoice]
    }

    chooseFeedGate = (choice, prevChoice=null, prevGate=null) => {
        let feedType;
        let remove;

        if (choice.length == 1){
            feedType = 1
        }else {
            feedType = choice[(Math.floor(Math.random()*choice.length))];
            const index = choice.indexOf(feedType);
            choice.splice(index, 1);
            if(feedType == prevChoice && feedType!=2){
                feedType--;
            }else if (feedType == prevChoice && feedType == 2){
                feedType++;
            }
            if(feedType == 3&&choice.length>1){
                remove = choice.pop()
            }
        }

        switch(feedType){
            case 4: 
                return `NOT (${this.chooseFeedGate(choice, feedType)})`;
            case 3:
                let choice2 = choice;
                choice2.push(remove)
                choice2.shift();
                prevGate = this.chooseGate(prevGate)
                return `((${this.chooseFeedGate(choice, feedType, prevGate)}) ${prevGate} (${this.chooseFeedGate(choice2, feedType)}))`
            case 2:
                prevGate = this.chooseGate(prevGate)
                return `(${this.chooseFeedGate(choice, feedType, prevGate)}) ${prevGate} ${this.chooseInput()}`
            case 1:
                return (this.notSelected) ? ((Math.floor(Math.random()*2)) ? `${this.gateTemplates[this.chooseGate(prevGate)]()}` : `NOT ${this.chooseInput()}`) : `${this.gateTemplates[this.chooseGate(prevGate)]()}`
        }
    }

    gateTemplates = {
        ["AND"] : ()=>{
            const input1 = this.chooseInput();
            const input2 = this.chooseInput(input1);
            return `${input1} AND ${input2}`;
        },

        ["OR"] : ()=>{
            const input1 = this.chooseInput();
            const input2 = this.chooseInput(input1);
            return `${input1} OR ${input2}`;
        },

        ["XOR"] : ()=>{
            const input1 = this.chooseInput();
            const input2 = this.chooseInput(input1);
            return `${input1} XOR ${input2}`;
        },

        ["NAND"] : ()=>{
            const input1 = this.chooseInput();
            const input2 = this.chooseInput(input1);
            return `${input1} NAND ${input2}`;
        },

        ["NOR"] : ()=>{
            const input1 = this.chooseInput();
            const input2 = this.chooseInput(input1);
            return `${input1} NOR ${input2}`;
        },

    }


}