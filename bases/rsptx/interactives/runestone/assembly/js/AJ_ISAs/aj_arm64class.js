export default class aj_arm64{
    max_number = 16;
    
    //registers
    rax = Math.floor(Math.random()*this.max_number);
    rcx = Math.floor(Math.random()*this.max_number);

    //flags list
    Z = 0;
    N = 0;
    C = 0;
    V = 0;

    dict = {
        0 : "x0",
        1 : "x1"
    }

    ZeroOrOne = () => {return Math.floor(Math.random() * 2)}
    RandomNumMax = (max) => {return Math.floor(Math.random() * (max+1))}
    setRegister = (random, val) => {
        if(this.dict[random] == "x0"){
            this.rax = val
        }
        else{
            this.rcx = val;
        }
    }
    readRegister = random => {
        let val;
        if(this.dict[random] == "x0"){
            val = this.rax
        }
        else{
            val = this.rcx
        }
        return {value: val, register: this.dict[random]}
    }


    operations = {
        
        
        ["add"] : () => {
            let instruction = "";
            const op1 = this.ZeroOrOne();
            const op2 = this.ZeroOrOne();
            const opD = this.ZeroOrOne()
            const useReg = this.RandomNumMax(1)

            if(useReg == 0){
                instruction = `add ${this.readRegister(opD).register}, ${this.readRegister(op1).register}, ${this.readRegister(op2).register}`
                const sum = this.readRegister(op1).value + this.readRegister(op2).value
                this.setRegister(opD, sum)
            }
            else {
                let num = Math.floor(Math.random()*this.max_number);

                instruction = `add ${this.readRegister(opD).register}, ${this.readRegister(op1).register}, #${num}`
                const sum = num + this.readRegister(op1).value
                this.setRegister(opD, sum)
            }

            return instruction;
        },

        ["sub"] : () => {
            let instruction = "";
            const op1 = this.ZeroOrOne();
            const op2 = this.ZeroOrOne();
            const opD = this.ZeroOrOne()
            const useReg = this.RandomNumMax(1)

            if(useReg == 0){
                instruction = `sub ${this.readRegister(opD).register}, ${this.readRegister(op1).register}, ${this.readRegister(op2).register}`
                const sum = this.readRegister(op1).value - this.readRegister(op2).value
                this.setRegister(opD, sum)
            }
            else {
                let num = Math.floor(Math.random()*this.max_number);

                instruction = `sub ${this.readRegister(opD).register}, ${this.readRegister(op1).register}, #${num}`
                const sum = this.readRegister(op1).value - num;
                this.setRegister(opD, sum)
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
            text = "cmp x1, x0"
        }
        // cmp rcx rax
        else{
            result = this.rax - this.rcx
            text = "cmp x0, x1"
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
            text = "test x0, x1"
        }
        // test rcx rax
        else{
            text = "test x1, x0"
        }

        result = this.rax & this.rcx
        //setting flags
        this.ZF = (result == 0) ? 1 : 0
        this.SF = (result < 0) ? 1 : 0

        return text;
        
    }

    jumps = () => {
        
        const obj = {
            ["b.eq"] : () => {
                return {code: "b.eq", result : this.ZF == 1 }
            },

            ["b.ne"] : () => {
                return {code: "b.ne", result: (this.ZF == 0)}
            },
            ["b.mi"] : () => {
                return {code : "b.mi", result: (this.SF == 1)}
            },
            ["b.pl"] : () => {
                return {code : "b.pl", result : (this.SF == 0)}
            },
            ["b.gt"] : () => {
                return {code: "b.gt", result: (this.ZF == 0 && this.SF == 0)}
            },
            ["b.ge"] : () => {
                return {code: "b.ge", result: (this.SF == 0 || this.ZF == 1)}
            },
            ["b.lt"] : () => {
                return {code : "b.lt", result: (this.SF == 1 && this.ZF == 0)}
            },
            ["b.le"] : () => {
                return {code : "b.le", result : (this.SF == 1 ||this.ZF == 1) }
            }
        }
        let arr = Object.keys(obj);
        let random = Math.floor(Math.random() * arr.length);
        console.log(`${arr}, ${random}, ${obj}`)
        console.log(obj[arr[random]])
        return obj[arr[random]]();
    }
}