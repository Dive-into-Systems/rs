import ASTOPnode from "./ASTOPNode";
import ASTINNode from "./ASTINNode";

export default class circuitAST{
    constructor(ast){
        this.ast = ast;
    }

    insert(output){
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

    getTruthTable(){
        this.root.executeAction();
    }

    setInputValue(token, value){
        let current = this.root;
        if(current.type == "INPUT" && current.token === token){
            this.root.setValue(value);
        } else if (current.type = "OPERATOR"){
            current.children.forEach((child)=>{
                child.setInputValue(token,value);
            })
        }
    }

}