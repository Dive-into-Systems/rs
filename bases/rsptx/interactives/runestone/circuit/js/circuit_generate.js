// *****************************************************************
// circuit_generate.js. This file was created by Bohou Zhang in June 2025.
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
 *        argument to pass this parameter is ["A", "B", "C"]. At least two inputs should be passed in
 *        when using this class.
 *       -gateTypes (an array of strings): the list of gates that can be generated. The class supports
 *        "AND", "OR", "NOT", "XOR", "NAND", "NOR" gates.
 *       -maxGates (integer): the maximum number of gates that can be generated.
 *       -minGates (integer): the minimum number of gates that can be generated. 
 *       -exactInput (bool): whether to generate an exact number of inputs. If set to true, the generated statement
 *        will contain every single input from the inputs parameter. If not set, the generated statement can contain
 *        up to all of the inputs or only some of them.
 *       -prevGen (string): the previously generated statement. If argument is passed in, the new statement will
 *        produce a different truth table from the previous statement, i.e., the statement will be different and
 *        the evaluation of the statement will be different.
 * 
 *      !!Public methods that should be called.
 *      -generateStatement(): recursively generates the statement, creates an AST to store the statement, and evaluates
 *       the AST to produce a truth table. Returns the statement to the caller. Must be called first before any other
 *       methods.
 * 
 *      -getTruthTable(): returns the truth table created by generateStatement().
 * 
 *      -getInformation(): returns a dictionary containing information about the statement and the AST.
 *        -inputs (array of strings): an array of the inputs used in the statement
 *        -numInputs: the number of inputs used in the statement
 *        -root: the root of the AST
 *        -ast: the AST object created by generateStatement()
 * 
 *      !!Helper methods that normally should not be called outside of this class.
 *      -ensureDifferentOutput(): called if prevGen is set. Ensures that the generated statement
 *       produces a different truth table than the previous statement.
 * 
 *      -ensureDifferentInput(): called when exactInput is set to false. Ensures that at least two inputs are selected.
 * 
 *      -ensureExactInput(): called when exactInput is set to true. Ensures that every input from inputs is used by replacing
 *       repeatedly used inputs from the generated statement with an unused input. If less than the total number of inputs is
 *       generated in the statement, regenerates statement.
 * 
 *      -chooseInput(prevChoice=null): selects an inputs to use randomly. If prevChoice is set to the previously used input,
 *       selects a different input.
 * 
 *      -chooseGate(prevChoice=null): chooses a gate to use randomly. If prevChoice is set to the previously used gate, the selected gate will be different.
 * 
 *      -chooseFeedGate(choice, prevChoice=null, prevGate=null): main helper function that recursively generates statement. The number of gates in the generated
 *       statement tends towards (minGates+maxGates)/2
 *       -choice (array of ints): possible cases for the switch statement.
 *       -prevChoice: previously chosen case to ensure base case is hit.
 *       -prevGate: previously generated gate to avoid repeatedly generating the same gate.
 * 
 *      -gateTemplates: dictionary of functions to make gates.
*/
import circuitAST from "./circuit_AST/circuitAST";
export default class circuit_generator{
    constructor(inputs, gateTypes, maxGates, minGates, exactInput=false, prevGen=null, preset=null){
        this.inputs = inputs;
        this.maxGates = maxGates;
        this.minGates = minGates;
        this.gateTypes = gateTypes;
        this.exactInput = exactInput;
        this.notSelected = false;
        this.prevGen = prevGen;
        this.preset = preset;
        if(this.gateTypes.includes("NOT")){
            this.gateTypes = this.gateTypes.filter(item => item!="NOT")
            this.notSelected = true;
        }
    }

    generateStatement = ()=>{
        if(this.preset){
            this.new_circuit = new circuitAST();
            this.new_circuit.insert(this.preset);
            this.newTruthTable = this.new_circuit.getTruthTable();
            return this.preset;
        }
        let numGates = Math.floor(Math.floor(Math.random() * (this.maxGates - this.minGates + 1)) + this.minGates);
        
        let additionalGateProb = 0.75
        let lessGateProb = 0.5
        if(numGates<=(this.maxGates+this.minGates)/2-1 && Math.random()<additionalGateProb){
            numGates++;
            
        }else if(numGates>=(this.maxGates+this.minGates)/2+1 && Math.random()<lessGateProb){
            numGates--;
        }
        console.log(numGates);
        let selection = []
        if(this.notSelected){
            for(let i = 0; i<numGates; i++){
                if(!selection.includes(4)){
                    let notProb = 0.4
                    if(Math.random()>=notProb)
                        selection.push(Math.floor(Math.random()*(2)+2));
                    else{
                        selection.push(4);
                    }
                }else{
                    selection.push(Math.floor(Math.random()*(2)+2));
                }
                
            }
        } else{
            for(let i = 0; i<numGates; i++){
                selection.push(Math.floor((Math.random()*(2)+2)))
            }
        }

        if(!selection.includes(3)||selection.indexOf(3)==selection.length-1){
            selection.splice(Math.floor(selection/2), 0, 3);
            selection.pop();
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

    chooseInput = (prevChoice=null, limit=this.inputs)=>{
        let selectInputs
        if(this.inputs.length>2){
            selectInputs = limit;
        }else{
            selectInputs = this.inputs
        }
        
    
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

    chooseFeedGate = (choice, prevChoice=null, prevGate=null, notGenerated=false, limit=this.inputs) => {
        let feedType;
        let remove;
        console.log(choice);
        
        if (choice.length == 1){
            feedType = 1;
        }else {
            feedType = choice[0];
            if(feedType == prevChoice && feedType!=2){
                feedType--;
            }else if (feedType == prevChoice && feedType == 2){
                feedType++;
            }
            if(feedType == 3&&choice.length==2){
                feedType = 2;
            }else if(feedType == 3 && choice.length>1){
                remove = choice.pop();
            }
            const index = choice.indexOf(feedType);
            if(index!=-1){
                choice.splice(index, 1);
            }else{
                choice.pop();
            }
            
        }

        switch(feedType){
            case 4: 
                return `NOT (${this.chooseFeedGate(choice, feedType, null, true, limit)})`;
            case 3:
                let choice2 = choice;
                choice2.push(remove)
                choice2.shift();
                prevGate = this.chooseGate(prevGate)
                return `((${this.chooseFeedGate(choice, feedType, prevGate, notGenerated, ["A","B"])}) ${prevGate} (${this.chooseFeedGate(choice2, feedType, null, notGenerated,["B","C"])}))`
            case 2:
                prevGate = this.chooseGate(prevGate)
                return `(${this.chooseFeedGate(choice, feedType, prevGate, notGenerated, limit)}) ${prevGate} ${this.chooseInput(limit)}`
            case 1:
                let ret;
                if(this.notSelected){
                    if(notGenerated){
                        ret = `${this.gateTemplates[this.chooseGate(prevGate)](limit)}`
                    }else{
                        ret = (Math.floor(Math.random()*7)) ? `${this.gateTemplates[this.chooseGate(prevGate)](limit)}` : `NOT ${this.chooseInput(null, ["A", "C"])}`
                    }
                } else{
                    ret = `${this.gateTemplates[this.chooseGate(prevGate)](limit)}`
                }
                return ret;
        }
    }

    gateTemplates = {
        ["AND"] : (limit)=>{
            const input1 = this.chooseInput(null, limit);
            const input2 = this.chooseInput(input1,limit);
            return `${input1} AND ${input2}`;
        },

        ["OR"] : (limit)=>{
            const input1 = this.chooseInput(null, limit);
            const input2 = this.chooseInput(input1,limit);
            return `${input1} OR ${input2}`;
        },

        ["XOR"] : (limit)=>{
            const input1 = this.chooseInput(null, limit);
            const input2 = this.chooseInput(input1,limit);
            return `${input1} XOR ${input2}`;
        },

        ["NAND"] : (limit)=>{
            const input1 = this.chooseInput(null, limit);
            const input2 = this.chooseInput(input1,limit);
            return `${input1} NAND ${input2}`;
        },

        ["NOR"] : (limit)=>{
            const input1 = this.chooseInput(null, limit);
            const input2 = this.chooseInput(input1,limit);
            return `${input1} NOR ${input2}`;
        },

    }


}