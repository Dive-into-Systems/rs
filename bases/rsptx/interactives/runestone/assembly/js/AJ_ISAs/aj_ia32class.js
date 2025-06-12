export default class aj_ia32 {

    max_number = 16;

    //registers
    rax = Math.floor(Math.random()*this.max_number);
    rcx = Math.floor(Math.random()*this.max_number);

    //flags
    ZF = 0;
    SF = 0;
    CF = 0;
    OF = 0;

    //functions

    ZeroOrOne = ()=>{
        return Math.floor(Math.random()*2);
    }

    operations = {

        ["add"] : () => {
            let instruction = "";
            const selectReg = this.ZeroOrOne();
            const selectOp = this.ZeroOrOne();

            if(selectReg == 0 && selectOp == 0){
                instruction = "addl %ecx, %eax";
                this.rax = this.rax + this.rcx;
            }else if (selectReg == 0 && selectOp ==1){
                instruction = "addl %eax, %ecx";
                this.rcx = this.rax + this.rcx
            }else{
                let num = Math.floor(Math.random()*this.max_number);
                instruction = `addl $${num}, %eax`;
                this.rax += num;
            }
            return instruction;
        },

        ["sub"] : () => {
            let instruction = "";
            const selectReg = this.ZeroOrOne();
            const selectOp = this.ZeroOrOne();

            if(selectReg == 0 && selectOp == 0){
                instruction = "subl %eax, %ecx";
                this.rcx = this.rcx - this.rax;
            }else if (selectReg == 0 && selectOp ==1){
                instruction = "subl %ecx, %eax";
                this.rax = this.rax - this.rcx;
            }else{
                let num = Math.floor(Math.random()*this.max_number);
                instruction = `subl $${num}, %eax`;
                this.rax -= num;
            }
            return instruction;
        }
    }


    compare = () => {
        const num = this.ZeroOrOne()
        let result;
        let text;
        // cmp rax, rcx
        if(num == 0){
            result = this.rcx - this.rax;
            text = "cmpl %eax, %ecx"
        }
        // cmp rcx rax
        else{
            result = this.rax - this.rcx
            text = "cmpl %ecx, %eax"
        }

        //setting flags
        this.ZF = (result == 0) ? 1 : 0
        this.SF = (result < 0) ? 1 : 0

        return text;
        
    }

    test = () => {
        const num = this.ZeroOrOne()
        let result;
        let text;
        // test rax, rcx
        if(num == 0){
            text = "testl %eax, %ecx"
        }
        // test rcx rax
        else{
            text = "testl %ecx, %eax"
        }

        result = this.rax & this.rcx
        //setting flags
        this.ZF = (result == 0) ? 1 : 0
        this.SF = (result < 0) ? 1 : 0

        return text;
        
    }

    jumps = () => {
        
        const obj = {
            ["jmp"] : () => {
                return {code: "jmp label1", result: true}
            },

            ["je"] : () => {
                return {code: "je label1", result : this.ZF == 1 }
            },

            ["jne"] : () => {
                return {code: "jne label1", result: (this.ZF == 0)}
            },
            ["js"] : () => {
                return {code : "js label1", result: (this.SF == 1)}
            },
            ["jns"] : () => {
                return {code : "jns label1", result : (this.SF == 0)}
            },
            ["jg"] : () => {
                return {code: "jg label1", result: (this.ZF == 0 && this.SF == 0)}
            },
            ["jge"] : () => {
                return {code: "jge label1", result: (this.SF == 0)}
            },
            ["jl"] : () => {
                return {code : "jl label1", result: (this.SF == 1 && this.ZF == 0)}
            },
            ["jle"] : () => {
                return {code : "jle label1", result : this.SF == 1}
            }
        }
        let arr = Object.keys(obj);
        let random = Math.floor(Math.random() * arr.length);
        console.log(`${arr}, ${random}, ${obj}`)
        console.log(obj[arr[random]])
        return obj[arr[random]]();
    }


}