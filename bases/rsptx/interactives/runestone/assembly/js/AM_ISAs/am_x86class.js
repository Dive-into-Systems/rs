export default class am_x86{



    MaxOffset = 14;
    MinOffset = 1;
    randomZeroOrOne = ()=> {return Math.floor(Math.random()*2)};
    regBase = (Math.floor(Math.random()*(100-60))+60)*100;
    regOffset = (Math.floor((Math.random()*(this.MaxOffset-this.MinOffset+1)))+this.MinOffset);
    registerList = ["rax", "rcx"];
    
    getRegs = ()=> {
        while(this.regBase%16 != 0){
            this.regBase++;
        }

        if (this.regOffset%2 != 0){
            this.regOffset++;
        }

        return{base: this.regBase, offset: this.regOffset};
    }


    generateWriteInstruction = (mode)=>{
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

            const start = (this.randomZeroOrOne()) ? 0:8;
            const offset = (start != 0) ? start.toString(16): "";
            const scale = [1, 2, 4, 8][Math.floor(Math.random()*(4))];
            
            let Address = 0;
            let DestinationText = "";

            if(mode==1){
                if (start == 0){
                    DestinationText = `(%${reg1})`
                    Address = this.getRegs().base
                } else {
                    DestinationText = `0x${offset}(%${reg1})`;
                    Address = this.getRegs().base + start;
                }

            }else{
                if(this.randomZeroOrOne()){
                    if (start == 0){
                        DestinationText = `(%${reg1})`
                        Address = this.getRegs().base
                    } else {
                        DestinationText = `0x${offset}(%${reg1})`;
                        Address = this.getRegs().base + start;
                    }
    
                }else{
                    if (start == 0){
                        DestinationText = `(%${reg1}, %${reg2}, ${scale})`;
                        Address = this.getRegs().base +this.getRegs().offset*scale
                    } else{
                        DestinationText = `0x${offset}(%${reg1}, %${reg2}, ${scale})`;
                        Address = this.getRegs().base +this.getRegs().offset*scale + start;
                    }
                }
            }

            let baseValDisplay = this.getRegs().base.toString(16)
            if (baseValDisplay.length < 4){
                baseValDisplay = baseValDisplay.padStart(4, "0");
            }
            baseValDisplay = "0x"+baseValDisplay;

            let offsetValDisplay = this.getRegs().offset.toString(16)
            if (offsetValDisplay.length < 4){
                offsetValDisplay = offsetValDisplay.padStart(4, "0");
            }
            offsetValDisplay = "0x"+offsetValDisplay;

            return{sourceText: SourceText, destinationText: DestinationText, baseReg: reg1, baseVal: baseValDisplay, offsetReg: reg2, offsetVal: offsetValDisplay, answer: Address.toString(16)};

    }

    generateReadInsturction = (mode)=> {
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

            const start = (this.randomZeroOrOne()) ? 0:8;
            const offset = (start != 0) ? start.toString(16): "";
            const scale = [1, 2, 4, 8][Math.floor(Math.random()*(4))];
            
            let Address = 0;
            let SourceText = "";

            if(mode == 1){
                if (start == 0){
                    SourceText = `(%${reg1})`
                    Address = this.getRegs().base
                } else {
                    SourceText = `0x${offset}(%${reg1})`;
                    Address = this.getRegs().base + start;
                }

            }else{
                if(this.randomZeroOrOne()){
                    if (start == 0){
                        SourceText = `(%${reg1})`
                        Address = this.getRegs().base
                    } else {
                        SourceText = `0x${offset}(%${reg1})`;
                        Address = this.getRegs().base + start;
                    }
    
                }else{
                    if (start == 0){
                        SourceText = `(%${reg1}, %${reg2}, ${scale})`;
                        Address = this.getRegs().base +this.getRegs().offset*scale
                    } else{
                        SourceText = `0x${offset}(%${reg1}, %${reg2}, ${scale})`;
                        Address = this.getRegs().base +this.getRegs().offset*scale + start;
                    }
                }
            }

            let baseValDisplay = this.getRegs().base.toString(16)
            if (baseValDisplay.length < 4){
                baseValDisplay = baseValDisplay.padStart(4, "0");
            }
            baseValDisplay = "0x"+baseValDisplay;

            let offsetValDisplay = this.getRegs().offset.toString(16)
            if (offsetValDisplay.length < 4){
                offsetValDisplay = offsetValDisplay.padStart(4, "0");
            }
            offsetValDisplay = "0x"+offsetValDisplay;

            return{sourceText: SourceText, destinationText: DestinationText, baseReg: reg1, baseVal: baseValDisplay, offsetReg: reg2, offsetVal: offsetValDisplay, answer: Address.toString(16)};
    }

    generateNAInstruction = () => {
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

            let baseValDisplay = this.getRegs().base.toString(16)
            if (baseValDisplay.length < 4){
                baseValDisplay = baseValDisplay.padStart(4, "0");
            }
            baseValDisplay = "0x"+baseValDisplay;

            let offsetValDisplay = this.getRegs().offset.toString(16)
            if (offsetValDisplay.length < 4){
                offsetValDisplay = offsetValDisplay.padStart(4, "0");
            }
            offsetValDisplay = "0x"+offsetValDisplay;

            return{sourceText: SourceText, destinationText: DestinationText, baseReg: reg1, baseVal: baseValDisplay, offsetReg: reg2, offsetVal: offsetValDisplay, answer: null};
    }

    WriteInstructions = {
        ["mov"]: (mode)=>{
            
            const information = this.generateWriteInstruction(mode);
            
            const text = `mov ${information.sourceText}, ${information.destinationText}`;

            return {code: text, baseReg: information.baseReg, baseVal: information.baseVal, offsetReg: information.offsetReg, offsetVal: information.offsetVal, RW: "write", answer: information.answer};
        },

        ["add"]: (mode)=>{
            const information = this.generateWriteInstruction(mode);
            
            const text = `add ${information.sourceText}, ${information.destinationText}`;

            return {code: text, baseReg: information.baseReg, baseVal: information.baseVal, offsetReg: information.offsetReg, offsetVal: information.offsetVal, RW: "write", answer: information.answer}
        },
    }

    ReadInstructions = {
        ["mov"]: (mode)=>{
            
            const information = this.generateReadInsturction(mode);
            
            const text = `mov ${information.sourceText}, ${information.destinationText}`;

            return {code: text, baseReg: information.baseReg, baseVal: information.baseVal, offsetReg: information.offsetReg, offsetVal: information.offsetVal, RW: "read", answer: information.answer};
            
        },

        ["add"]: (mode)=>{

            const information = this.generateReadInsturction(mode);
            
            const text = `add ${information.sourceText}, ${information.destinationText}`;

            return {code: text, baseReg: information.baseReg, baseVal: information.baseVal, offsetReg: information.offsetReg, offsetVal: information.offsetVal, RW: "read", answer: information.answer};

        },
    }
    
    NAInstructions = {
        ["mov"]: ()=>{
            
            const information = this.generateNAInstruction();

            const text = `mov ${information.sourceText}, ${information.destinationText}`;

            return {code: text, baseReg: information.baseReg, baseVal: information.baseVal, offsetReg: information.offsetReg, offsetVal: information.offsetVal, answer: information.answer};
        },

        ["add"]: ()=>{

            const information = this.generateNAInstruction();

            const text = `add ${information.sourceText}, ${information.destinationText}`;

            return {code: text, baseReg: information.baseReg, baseVal: information.baseVal, offsetReg: information.offsetReg, offsetVal: information.offsetVal, answer: information.answer};

        },

        ["lea"]: (mode)=>{
            const information = this.generateReadInsturction(mode);
            
            const text = `lea ${information.sourceText}, ${information.destinationText}`;

            return {code: text, baseReg: information.baseReg, baseVal: information.baseVal, offsetReg: information.offsetReg, offsetVal: information.offsetVal, answer: information.answer};
        }, 
    }
}