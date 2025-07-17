// *****************************************************************
// circuitAST.js. This file was created by Bohou Zhang in June 2025.
// *****************************************************************
/*
 * - This file contains the class used to generate ASTs for all existing circuit components. This class is not
 *   called outside of the circuit_generator class by exisitng components, but can be used if needed.
 * 
 * - Methods of this class:
 *      -constructor()
 * 
 *      !!Public methods that should be called.
 *      -getInformation(): returns a dictionary.
 *       -numInputs: the length of the inputs.
 *       -inputs (array of strings): the inputs used.
 *       -root: the root of the AST.
 *      -insert(expression): created the AST object based on a boolean algebra statement. This method uses code written by Yana Yuan.
 *       -expression: a statement to be parsed into the AST object.
 *      -getTruthTable: gets the truth table from the AST.
 * 
 *      !!Helper methods that should not be called outside this class.
 *      -extractInputs(circuit): extracts the inputs from a statement passed in. This method was written by Yana Yuan.
 *      -setInputValue(token, value, currentNode=this.root): recursively traverses the tree and sets the input value based on parameters.
 *       -token(string): the name of the input whose value needs to be set, e.g., "A".
 *       -value(integer): the value that the input should be set to.
 *       -currentNode(ASTINNode or ASTOPNode object): the current node on the tree.
*/

import ASTOPnode from "./ASTOPNode";
import ASTINNode from "./ASTINNode";

export default class circuitAST{
    constructor(){
        this.ast = [];
        this.root = null;
        this.inputs = null;
    }

    getInformation = () =>{
        return {numInputs: this.inputs.length, inputs:this.inputs, root: this.root}
    }

    extractInputs(circuit) {
        const inputSet = new Set();
        const inputPattern = /\b[A-Z]\b/g;
        let match;
        while ((match = inputPattern.exec(circuit)) !== null) {
            inputSet.add(match[0]);
        }
        this.inputs = Array.from(inputSet).sort();
    }

    insert(expression){
        this.extractInputs(expression);
        const operators = ['AND', 'OR', 'XOR', 'NAND', 'NOR', 'NOT'];
        const inputs = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'];
        let tokens = expression.match(/\(|\)|\w+|AND|OR|XOR|NAND|NOR|NOT/g);
        let stack = [];
        let output = [];
        let precedence = { // well I personally don't think precedence really makes
                            // any difference but it works so...
            'OR': 1,
            'XOR': 1,
            'AND': 1,
            'NOR': 1,
            'NAND': 1,
            'NOT': 2
        };
        /** peak what the top element is on the stack */
        function peek(arr) {
            return arr[arr.length - 1];
        }
        /** checks if the token is an operator */
        function isOperator(token) {
            return operators.includes(token);
        }
        /** checks if the token is an input */
        function isInput(token){
            return inputs.includes(token);
        }
        /** using stack to determine tree structure by tracking parentheses */
        tokens.forEach(token => {
        if (isInput(token)) {
            output.push({ type: 'INPUT', value: token });
        } else if (isOperator(token)) {
            while (stack.length && precedence[peek(stack)] >= precedence[token]) {
                output.push(stack.pop());
            }
            stack.push(token);
        } else if (token === '(') {
            stack.push(token);
        } else if (token === ')') {
            while (stack.length && peek(stack) !== '(') {
                output.push(stack.pop());
            }
            stack.pop();
        }
        });
        // push items from stack to output
        while (stack.length) {
            output.push(stack.pop()); 
        }
        output.forEach(token => {
            if (this.isOperator(token)) {
                let node = new ASTOPnode("OPERATOR", token, []);

                // Add children depending on operator type
                if (token === 'NOT') {
                    node.children.push(this.ast.pop());
                } else {
                    node.children.push(this.ast.pop());
                    node.children.push(this.ast.pop());
                }
                this.ast.push(node);
            } else {
                let node = new ASTINNode("INPUT", token.value);
                this.ast.push(node);
            }
        });
        this.root = this.ast[0]
    }
    
    isOperator(token){
        const operators = ['AND', 'OR', 'XOR', 'NAND', 'NOR', 'NOT'];
        return operators.includes(token);
    }

    getTruthTable(){
        let truthTable = [];
        let numInputs = this.inputs.length;

        switch(numInputs){
            case 2:
                for(let i of [0,1]){
                    this.setInputValue(this.inputs[0], i);
                    for(let j of [0,1]){
                        this.setInputValue(this.inputs[1], j);
                        truthTable.push([i, j, +this.root.executeAction()]);
                    }
                }
                break;
            case 3:
                for(let i of [0,1]){
                    this.setInputValue(this.inputs[0], i);
                    for(let j of [0,1]){
                        this.setInputValue(this.inputs[1], j);
                        for(let k of [0,1]){
                            this.setInputValue(this.inputs[2], k);
                            truthTable.push([i, j, k, +this.root.executeAction()]);
                        }
                        
                    }
                }
                break;
            case 4:
                for(let i of [0,1]){
                    this.setInputValue(this.inputs[0], i);
                    for(let j of [0,1]){
                        this.setInputValue(this.inputs[1], j);
                        for(let k of [0,1]){
                            this.setInputValue(this.inputs[2], k);
                            for(let l of [0,1]){
                                this.setInputValue(this.inputs[3], l);
                                truthTable.push([i, j, k, l, +this.root.executeAction()]);
                            }
                        }
                        
                    }
                }
                break;
            case 5:
                for(let i of [0,1]){
                    this.setInputValue(this.inputs[0], i);
                    for(let j of [0,1]){
                        this.setInputValue(this.inputs[1], j);
                        for(let k of [0,1]){
                            this.setInputValue(this.inputs[2], k);
                            for(let l of [0,1]){
                                this.setInputValue(this.inputs[3], l);
                                for(let m of [0,1]){
                                    this.setInputValue(this.inputs[4], m);
                                    truthTable.push([i, j, k, l, m, +this.root.executeAction()]);
                                }
                            }
                        }
                        
                    }
                }

        }
        return truthTable;
            
    }

    setInputValue(token, value, currentNode=this.root){
        let current = currentNode;
        if(current.type == "INPUT" && current.value == token){
            current.setValue(value);
        } else if (current.type == "OPERATOR"){
            current.children.forEach((child)=>{
                this.setInputValue(token, value, child);
            })
        }
    }

}