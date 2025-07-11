export default class aj_x86{
    
    constructor(runUnitTests=null, rax=null, rcx=null, jump=null){

        this.max_number = 16;
        this.jump = jump;

        if(runUnitTests == null || runUnitTests == undefined){
            this.runUnitTests = false;
        }else{
            this.runUnitTests = runUnitTests;
        }
        if(rax == null || rax == undefined){
            this.rax = Math.floor(Math.random()*this.max_number)
        }
        else{
            this.rax = rax
        }
        if(rcx == null || rcx == undefined){
            this.rcx = Math.floor(Math.random()*this.max_number)
        }
        else{
            this.rcx = rcx
        }
    }
    


    //flags list
    ZF = 0;
    SF = 0;
    CF = 0;
    OF = 0;



    ZeroOrOne = () => {return Math.floor(Math.random() * 2)}

    operations = {
        
        
        ["add"] : () => {
            let instruction = "";
            const selectReg = this.ZeroOrOne();
            const selectOp = this.ZeroOrOne();

            if(selectReg == 0 && selectOp == 0){
                instruction = "add %rcx, %rax";
                this.rax = this.rax + this.rcx;
            }else if (selectReg == 0 && selectOp ==1){
                instruction = "add %rax, %rcx";
                this.rcx = this.rax + this.rcx
            }else{
                let num = Math.floor(Math.random()*this.max_number);
                instruction = `add $${num}, %rax`;
                this.rax += num;
            }
            return instruction;
        },

        ["sub"] : () => {
            let instruction = "";
            const selectReg = this.ZeroOrOne();
            const selectOp = this.ZeroOrOne();

            if(selectReg == 0 && selectOp == 0){
                instruction = "sub %rax, %rcx";
                this.rcx = this.rcx - this.rax;
            }else if (selectReg == 0 && selectOp ==1){
                instruction = "sub %rcx, %rax";
                this.rax = this.rax - this.rcx;
            }else{
                let num = Math.floor(Math.random()*this.max_number);
                instruction = `sub $${num}, %rax`;
                this.rax -= num;
            }
            return instruction;
        }
    }

    compare = () => {
        let num = this.ZeroOrOne()
        let result;
        let text;
        if(this.runUnitTests){
            num = 0;
        }
        // cmp rax, rcx
        if(num == 0){
            result = this.rcx - this.rax;
            text = "cmp %rax, %rcx"
        }
        // cmp rcx rax
        else{
            result = this.rax - this.rcx
            text = "cmp %rcx, %rax"
        }

        //setting flags
        this.ZF = (result == 0) ? 1 : 0
        this.SF = (result < 0) ? 1 : 0

        return text;
        
    }

    test = () => {
        let num = this.ZeroOrOne()
        let result;
        let text;
        // test rax, rcx
        if(this.runUnitTests){
            num = 0;
        }
        if(num == 0){
            text = "test %rax, %rcx"
        }
        // test rcx rax
        else{
            text = "test %rcx, %rax"
        }

        result = this.rax & this.rcx
        //setting flags
        this.ZF = (result == 0) ? 1 : 0
        this.SF = (result < 0) ? 1 : 0

        return text;
        
    }

    jumps = () => {
        
        const obj = {
            ["je"] : () => {
                return {code: "je", result : this.ZF == 1 }
            },

            ["jne"] : () => {
                return {code: "jne", result: (this.ZF == 0)}
            },
            ["js"] : () => {
                return {code : "js", result: (this.SF == 1)}
            },
            ["jns"] : () => {
                return {code : "jns", result : (this.SF == 0)}
            },
            ["jg"] : () => {
                return {code: "jg", result: (this.ZF == 0 && this.SF == 0)}
            },
            ["jge"] : () => {
                return {code: "jge", result: (this.SF == 0 || this.ZF == 1)}
            },
            ["jl"] : () => {
                return {code : "jl", result: (this.SF == 1 && this.ZF == 0)}
            },
            ["jle"] : () => {
                return {code : "jle", result : (this.SF == 1 ||this.ZF == 1) }
            }
        }
        let arr = Object.keys(obj);
        let random = Math.floor(Math.random() * arr.length);
        console.log(`${arr}, ${random}, ${obj}`)
        console.log(obj[arr[random]])
        if(this.runUnitTests){
            return obj[arr[this.jump]]();
        }
        return obj[arr[random]]();
    }


    

}

// add 1 2 inc 2 1 cmp 2 1 jle
