export default class ASTOPnode{
    constructor(type, value, children){
        this.type = type;
        this.value = value;
        this.children = children;
    }

    executeAction(){
        this.val1 = 0;
        this.val2 = 0;
        if(this.children.length == 2){
            if(this.children[0].type == "INPUT" && this.children[1].type == "INPUT"){
                this.val1 = children[0].value;
                this.val2 = chilren[1].value;
                return this.performOP();
            } else if (this.children[0].type == "OPERATOR"){
                this.val1 = this.children[0].executeAction();
                this.val2 = this.children[1].value;
                return this.performOP();

            } else if (this.children[1].type == "OPERATOR"){
                this.val1 = this.children[0].value;
                this.val2 - this.children[1].executeAction();
                return this.performOP();
            } else {
                this.val1 = this.children[0].executeAction();
                this.val2 = this.children[1].executeAction();
                return this.performOP();
            }
        } else if (this.children.length == 1){
            if(this.children[0] == "INPUT"){
                return this.children[0].value ? 0:1
            }else{
                return this.children[0].executeAction();
            }
                
        }
        
    }

    performOP(){
        switch(this.type){
            case("AND"):
                return this.val1 & this.val2;
            case("OR"):
                return this.val1 || this.val2;
            case("XOR"):
                return this.val1 ^ this.val2;
            case("NAND"):
                return this.val1&this.val2 ? 0:1;
            case("NOR"):
                return this.val1||this.val2 ? 0:1;

        }
    }

    insertChild(node){
        this.children.push(node);
    }
}