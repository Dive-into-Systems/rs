export default class ASTINNode{
    constructor(type, token){
        this.type = type;
        this.value = token;
        this.input = null;
    }

    setValue(val){
        this.input = val;
    }
}