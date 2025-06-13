export default class am_x86{
    MaxOffset = 14;
    MinOffset = 1;
    randomZeroOrOne = ()=> {return Math.floor(Math.random()*2)};
    regBase = (Math.floor(Math.random()*100))*100;
    regOffset = (Math.floor((Math.random()*(this.MaxOffset-this.MinOffset+1)))+this.MinOffset);
    registerList = ["rax", "rcx"];
    
    getRegs = ()=> {
        if (!this.regOffset%2){
            this.regOffset++;
        }

        return{base: this.regBase, offset: this.regOffset};
    }

    WriteInstructions = {
        ["mov"]: ()=>{
            let regChoice1 = this.randomZeroOrOne();
            let regChoice2 = 0;

            if (regChoice1 == 0){
                regChoice2 = 1;
            }else{
                regChoice2 = 0;
            }

            let reg1 = this.registerList[regChoice1];
            let reg2 = this.registerList[regChoice2];

            let SourceText = `%${reg1}`;

            const start = Math.floor(Math.random()*(16+15))-15
            const offset = (start != 0) ? start.toString(16): "";
            const scale = Math.floor(Math.random()*(10))
            
            let Address = 0;
            let DestinationText = "";

            if(this.randomZeroOrOne()){
                DestinationText = `0x${offset}(%${reg1})`;
                Address = this.getRegs().base + start;

            }else{
                DestinationText = `0x${offset}(%${reg1}, %${reg2}, $${scale})`;
                Address = this.getRegs().base +this.getRegs().offset*scale + start;
            }
                
            
            const text = `mov ${SourceText}, ${DestinationText}`;

            return {code: text, baseReg: reg1, baseVal: this.getRegs().base.toString(16), offsetReg: reg2, offsetVal: this.getRegs().offset.toString(16), answer: Address.toString(16)}
        },

        ["add"]: ()=>{
            let regChoice1 = this.randomZeroOrOne();
            let regChoice2 = 0;

            if (regChoice1 == 0){
                regChoice2 = 1;
            }else{
                regChoice2 = 0;
            }

            let reg1 = this.registerList[regChoice1];
            let reg2 = this.registerList[regChoice2];

            let SourceText = `%${reg1}`;

            let start = Math.floor(Math.random()*(16+15))-15
            let offset = (start != 0) ? start.toString(16): "";
            let scale = Math.floor(Math.random()*(10-1))+1
            
            let Address = 0;
            let DestinationText = "";

            if(this.randomZeroOrOne()){
                DestinationText = `0x${offset}(%${reg1})`;
                Address = this.getRegs().base + start;

            }else{
                DestinationText = `0x${offset}(%${reg1}, %${reg2}, $${scale})`;
                Address = this.getRegs().base +this.getRegs().offset*scale + start;
            }
                
            
            const text = `add ${SourceText}, ${DestinationText}`;

            return {code: text, baseReg: reg1, baseVal: this.getRegs().base.toString(16), offsetReg: reg2, offsetVal: this.getRegs().offset.toString(16), answer: Address.toString(16)}

        },
    }

    ReadInstructions = {
        ["mov"]: ()=>{
            let regChoice1 = this.randomZeroOrOne();
            let regChoice2 = 0;

            if (regChoice1 == 0){
                regChoice2 = 1;
            }else{
                regChoice2 = 0;
            }

            let reg1 = this.registerList[regChoice1];
            let reg2 = this.registerList[regChoice2];

            let DestinationText = `%${reg1}`;

            const start = Math.floor(Math.random()*(16+15))-15
            const offset = (start != 0) ? start.toString(16): "";
            const scale = Math.floor(Math.random()*(10))
            
            let Address = 0;
            let SourceText = "";

            if(this.randomZeroOrOne()){
                SourceText = `0x${offset}(%${reg1})`;
                Address = this.getRegs().base + start;

            }else{
                SourceText = `0x${offset}(%${reg1}, %${reg2}, $${scale})`;
                Address = this.getRegs().base +this.getRegs().offset*scale + start;
            }
                
            
            const text = `mov ${SourceText}, ${DestinationText}`;

            return {code: text, baseReg: reg1, baseVal: this.getRegs().base.toString(16), offsetReg: reg2, offsetVal: this.getRegs().offset.toString(16), answer: Address.toString(16)}
            
        },

        ["add"]: ()=>{

            let regChoice1 = this.randomZeroOrOne();
            let regChoice2 = 0;

            if (regChoice1 == 0){
                regChoice2 = 1;
            }else{
                regChoice2 = 0;
            }

            let reg1 = this.registerList[regChoice1];
            let reg2 = this.registerList[regChoice2];

            let DestinationText = `%${reg1}`;

            const start = Math.floor(Math.random()*(16+15))-15
            const offset = (start != 0) ? start.toString(16): "";
            const scale = Math.floor(Math.random()*(10))
            
            let Address = 0;
            let SourceText = "";

            if(this.randomZeroOrOne()){
                SourceText = `0x${offset}(%${reg1})`;
                Address = this.getRegs().base + start;

            }else{
                SourceText = `0x${offset}(%${reg1}, %${reg2}, $${scale})`;
                Address = this.getRegs().base +this.getRegs().offset*scale + start;
            }
                
            
            const text = `add ${SourceText}, ${DestinationText}`;

            return {code: text, baseReg: reg1, baseVal: this.getRegs().base.toString(16), offsetReg: reg2, offsetVal: this.getRegs().offset.toString(16), answer: Address.toString(16)}

        },
    }
    
    NAInstructions = {
        ["mov"]: ()=>{
            let regChoice1 = this.randomZeroOrOne();
            let regChoice2 = 0;

            if (regChoice1 == 0){
                regChoice2 = 1;
            }else{
                regChoice2 = 0;
            }

            let reg1 = this.registerList[regChoice1];
            let reg2 = this.registerList[regChoice2];

            let DestinationText = `%${reg1}`;
            let SourceText = `%${reg2}`;
            
            const text = `mov ${SourceText}, ${DestinationText}`;

            return {code: text, baseReg: reg1, baseVal: this.getRegs().base.toString(16), offsetReg: reg2, offsetVal: this.getRegs().offset.toString(16)}
        },

        ["add"]: ()=>{

            let regChoice1 = this.randomZeroOrOne();
            let regChoice2 = 0;

            if (regChoice1 == 0){
                regChoice2 = 1;
            }else{
                regChoice2 = 0;
            }

            let reg1 = this.registerList[regChoice1];
            let reg2 = this.registerList[regChoice2];

            let DestinationText = `%${reg1}`;
            let SourceText = `%${reg2}`;
            
            const text = `add ${SourceText}, ${DestinationText}`;

            return {code: text, baseReg: reg1, baseVal: this.getRegs().base.toString(16), offsetReg: reg2, offsetVal: this.getRegs().offset.toString(16)}

        },

        ["lea"]: ()=>{
            let regChoice1 = this.randomZeroOrOne();
            let regChoice2 = 0;

            if (regChoice1 == 0){
                regChoice2 = 1;
            }else{
                regChoice2 = 0;
            }

            let reg1 = this.registerList[regChoice1];
            let reg2 = this.registerList[regChoice2];

            let DestinationText = `%${reg1}`;

            const start = Math.floor(Math.random()*(16+15))-15
            const offset = (start != 0) ? start.toString(16): "";
            const scale = Math.floor(Math.random()*(10))
            
            let Address = 0;
            let SourceText = "";

            if(this.randomZeroOrOne()){
                SourceText = `0x${offset}(%${reg1})`;
                Address = this.getRegs().base + start;

            }else{
                SourceText = `0x${offset}(%${reg1}, %${reg2}, $${scale})`;
                Address = this.getRegs().base +this.getRegs().offset*scale + start;
            }
                
            
            const text = `lea ${SourceText}, ${DestinationText}`;

            return {code: text, baseReg: reg1, baseVal: this.getRegs().base.toString(16), offsetReg: reg2, offsetVal: this.getRegs().offset.toString(16), answer: Address.toString(16)}
        }, 
    }
}