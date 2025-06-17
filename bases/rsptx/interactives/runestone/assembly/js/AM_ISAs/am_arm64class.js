export default class am_arm64{
    MaxOffset = 14;
    MinOffset = 1;
    randomZeroOrOne = ()=> {return Math.floor(Math.random()*2)};
    regBase = (Math.floor(Math.random()*(100-60))+60)*100;
    regOffset = (Math.floor((Math.random()*(this.MaxOffset-this.MinOffset+1)))+this.MinOffset);
    registerList = ["X0", "X1"];
    
    getRegs = ()=> {
        while(this.regBase%16 != 0){
            this.regBase++;
        }

        if (this.regOffset%2 != 0){
            this.regOffset++;
        }

        return{base: this.regBase, offset: this.regOffset};
    }


    generateReadWriteInstruction = ()=>{
        let regChoice1 = this.randomZeroOrOne();
            let regChoice2 = 0;

            if (regChoice1 == 0){
                regChoice2 = 1;
            }else{
                regChoice2 = 0;
            }

            let reg1 = this.registerList[regChoice1];
            let reg2 = this.registerList[regChoice2];

            let SourceText = `${reg1}`;

            const scale = Math.floor(Math.random()*(16));
            
            let Address = 0;
            let DestinationText = "";
            const memAccess = Math.floor(Math.random()*3);

            if(memAccess == 0){
                DestinationText = `[${reg1}]`
                Address = this.getRegs().base
            }else if (memAccess == 1){
                DestinationText = `[${reg1}, #${scale}]`;
                Address = this.getRegs().base + scale;
            }else if (memAccess == 2){
                DestinationText = `[${reg1}, ${reg2}]`;
                Address = this.getRegs().base + this.getRegs().offset;
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

            let DestinationText = `${reg1}`;
            let SourceText = `${reg2}`;

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

    ReadWriteInstructions = {
        ["str"]: ()=>{
            const information = this.generateReadWriteInstruction();
            const text = `str ${information.sourceText}, ${information.destinationText}`;
            return {code: text, baseReg: information.baseReg, baseVal: information.baseVal, offsetReg: information.offsetReg, offsetVal: information.offsetVal, RW: "write", answer: information.answer};
        },

        ["ldr"]: ()=>{
            
            const information = this.generateReadWriteInstruction();
            
            const text = `ldr ${information.sourceText}, ${information.destinationText}`;

            return {code: text, baseReg: information.baseReg, baseVal: information.baseVal, offsetReg: information.offsetReg, offsetVal: information.offsetVal, RW: "read", answer: information.answer};
            
        },
    }

    NAInstructions = {
        ["add"]: ()=>{

            const information = this.generateNAInstruction();
            
            const text = `add ${information.sourceText}, ${information.destinationText}`;

            return {code: text, baseReg: information.baseReg, baseVal: information.baseVal, offsetReg: information.offsetReg, offsetVal: information.offsetVal, answer: information.answer};

        },
        ["sub"] : ()=>{

            const information = this.generateNAInstruction();
            
            const text = `sub ${information.sourceText}, ${information.destinationText}`;

            return {code: text, baseReg: information.baseReg, baseVal: information.baseVal, offsetReg: information.offsetReg, offsetVal: information.offsetVal, answer: information.answer};

        },
    }
}