export default class circuit{
    constructor(inputs, gateTypes, maxGates, minGates){
        this.inputs = inputs;
        this.maxGates = maxGates;
        this.minGates = minGates;
        this.gateTypes = gateTypes;
    }

    generateStatement = ()=>{
        const ret = this.chooseFeedGate();
        let text = ret.text;
        
    }

    chooseInput = (prevChoice=null)=>{

        let selectInputs = this.inputs;
    
        if(prevChoice!=null){
            selectInputs = selectInputs.filter(item => {item!=prevChoice});
        }

        const inputChoice = Math.floor(Math.random()*selectInputs.length);

        return selectInputs[inputChoice]
    }

    chooseGate = () =>{
        return this.gateTypes[Math.floor(Math.random()*this.gateTypes.length)]
    }

    chooseFeedGate = (prevChoice=null) => {
        let feedType = 3;
        if (prevChoice!=null && prevChoice!=1){
            this.feedType = Math.floor((Math.random()*2)+1);
        }
        switch(feedType){
            case 4: 
                return `NOT ${this.chooseFeedGate(4)}`;
            case 3:
                return `${this.chooseFeedGate(3)} ${this.chooseGate()} ${this.chooseFeedGate(3)}`
            case 2:
                return `${this.chooseFeedGate(2)} ${this.chooseGate()} ${this.chooseInput()}`
            case 1:
                return (Math.random(Math.floor()*2)) ? `${this.gateTemplates[this.chooseGate()]()}` : `NOT ${this.chooseInput()}`
        }
    }

    gateTemplates = {
        ["AND"] : ()=>{
            const input1 = this.chooseInput();
            const input2 = this.chooseInput(input1);
            return `${input1} AND ${input2}`;
        },

        ["OR"] : ()=>{
            const input1 = this.chooseInput();
            const input2 = this.chooseInput(input1);
            return `${input1} OR ${input2}`;
        },

        ["XOR"] : ()=>{
            const input1 = this.chooseInput();
            const input2 = this.chooseInput(input1);
            return `${input1} XOR ${input2}`;
        },

        ["NAND"] : ()=>{
            const input1 = this.chooseInput();
            const input2 = this.chooseInput(input1);
            return `${input1} NAND ${input2}`;
        },

        ["NOR"] : ()=>{
            const input1 = this.chooseInput();
            const input2 = this.chooseInput(input1);
            return `${input1} NOR ${input2}`;
        },

    }


}