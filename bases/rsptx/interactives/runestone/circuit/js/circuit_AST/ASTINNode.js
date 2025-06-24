export default class ASTINNode{
    constructor(type, token){
        this.type = type;
        this.token = token;
    }

    setValue(val){
        this.value = val;
    }
}