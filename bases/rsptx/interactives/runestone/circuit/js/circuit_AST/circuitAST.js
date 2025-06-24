import ASTOPnode from "./ASTOPNode";
import ASTINNode from "./ASTINNode";

export default class circuitAST{
    constructor(){
        this.ast = [];
        this.root = null;
    }

    insert(expression){
        const operators = ['AND', 'OR', 'XOR', 'NAND', 'NOR', 'NOT'];
        const inputs = ['A', 'B', 'C'];
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
    
    getRoot(){
        return this.root;
    }

    isOperator(token){
        const operators = ['AND', 'OR', 'XOR', 'NAND', 'NOR', 'NOT'];
        return operators.includes(token);
    }

    getTruthTable(inputs){
        let truthTable = [];
        let numInputs = inputs.length;

        switch(numInputs){
            case 1:
                for(let i of [0,1]){
                    this.setInputValue(inputs[0], i);
                    truthTable.push(this.root.executeAction());
                }
                break;
            case 2:
                for(let i of [0,1]){
                    this.setInputValue(inputs[0], i);
                    for(let j of [0,1]){
                        this.setInputValue(inputs[1], j);
                        truthTable.push(this.root.executeAction());
                    }
                }
                break;
            case 3:
                for(let i of [0,1]){
                    this.setInputValue(inputs[0], i);
                    for(let j of [0,1]){
                        this.setInputValue(inputs[1], j);
                        for(let k of [0,1]){
                            this.setInputValue(inputs[2], k);
                            truthTable.push(this.root.executeAction());
                        }
                        
                    }
                }
                break;
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