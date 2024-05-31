// *********
// assembly_arm64.js
// *********
// This file contains the JS for the Runestone virtual memory component. It was created By Luyuan Fan, Zhengfei Li, and Yue Zhang, 06/01/2023
"use strict";

// NOTE:
// main weights doesnt have to add up to 100, bad_ct and bad_type not mut exclusive
class InstructionsFamily {
    constructor(mainWeight, oddsArr, insArr) {
        if (oddsArr.length !== 3) {
            throw new Error("BAD ARR");
        }
        this.mainWeight = mainWeight;
        this.odds = oddsArr;
        this.instructions = insArr;
        // this.odds = {
        //     correct: oddsArr[0],
        //     bad_ct: oddsArr[1], // wrong number of ops
        //     bad_type: oddsArr[2] // memory register values mixup
        //     bad_all: oddsArr[3] // memory register values mixup
        // }
    }
}

class ArchInstructions {
    constructor() {
        this.mem_ops        = null;
        this.arch_ops       = null;
        this.arith_unary    = null;
        this.arith_binary   = null;
        this.bit_ops        = null;
        this.offsets        = null;
        this.registers      = this.generateRegisters();
    }

    generateRegisters() {
        return [];
    }

    weighed_pick(odds) {
        const total = odds.reduce((sum, a) => sum + a, 0);
        let seed = 0;
        while (seed === 0){
            seed = Math.random() * total;
        }// not possible to pick 0 weights events
        let sum = 0;

        for (let i = 0; i < odds.length; i++) {
            sum += odds[i];
            if (seed < sum) {
                return i;
            }
        }
        return 0;

    }

    generate_question_params(mem_arch, arith, bit) {
        fam_odds = [
            mem_arch ? this.mem_ops.mainWeight      : 0,
            mem_arch ? this.arch_ops.mainWeight     : 0,
            arith    ? this.arith_unary.mainWeight  : 0,
            arith    ? this.arith_binary.mainWeight : 0,
            bit      ? this.bit_ops.mainWeight      : 0,
        ]
        let family;
        const index = this.weighed_pick(fam_odds);
        switch (index) {
            case 0: family = this.mem_ops;      break;
            case 1: family = this.arch_ops;     break;
            case 2: family = this.arith_unary;  break;
            case 3: family = this.arith_binary; break;
            case 4: family = this.bit_ops;      break;
            default: throw new Error("Invalid operation index");
        }

        const op = family.instructions[Math.floor(Math.random() * family.instructions.length)];
        const q_type = this.weighed_pick(fam_odds)
        return [op, (q_type&1) === 1, (q_type&2) === 2];
    }

}


export class ARM64_OPS extends ArchInstructions {
    constructor() {
        super();
        // correct, wrong type, wrong ct, wrong both
        this.mem_ops        = new InstructionsFamily(15, [0.25, 0.25, 0.25, 0.25], ["mov"]),
        this.arm_ops        = new InstructionsFamily(15, [0.25, 0.25, 0.25, 0.25], ["ldr", "str"]),
        this.arith_unary    = new InstructionsFamily(20, [0.25, 0.25, 0.25, 0.25], ["neg", "mvn"]),
        this.arith_binary   = new InstructionsFamily(30, [0.25, 0.25, 0.25, 0.25], ["add", "sub", "and", "orr", "eor"]),
        this.bit_ops        = new InstructionsFamily(20, [0.25, 0.25, 0.25, 0.25], ["lsl", "lsr", "asr"]),
        this.offsets        = ["#8", "#16", "#32"];
    }

    generateRegisters() {
        // this.registers = [];
        // this.registers_64bits = [];
        // this.registers_32bits = [];
        // for (let i = 0; i < 29; i++) {
        //     this.registers_64bits.push("x" + i.toString());
        //     this.registers_32bits.push("w" + i.toString());
        // }
        
        let registers = [];
        for (let i = 0; i < 29; i++) {
            registers.push("x" + i.toString());
        }
        return registers;

    }
    

}


export class IA32_OPS extends ArchInstructions {
    constructor() {
        this.mem_ops = new InstructionsFamily(15, [40, 40, 20], ["mov"]);
        this.stack_ops = new InstructionsFamily(15, [40, 40, 20], ["push", "pop"]);
        this.arith_unary = new InstructionsFamily(20, [40, 30, 30], ["neg", "not"]);
        this.arith_binary = new InstructionsFamily(30, [35, 35, 30], ["add", "sub", "and", "or", "xor"]);
        this.bit_ops = new InstructionsFamily(20, [35, 35, 30], ["shl", "shr", "sar"]);
        this.offsets = ["8", "16", "32"];
    }

    generateRegisters() {
        let registers = [];
        const regPrefixes = ['e', ''];
        const regSuffixes = ['ax', 'bx', 'cx', 'dx', 'si', 'di', 'bp', 'sp'];

        regPrefixes.forEach(prefix => {
            regSuffixes.forEach(suffix => {
                registers.push(prefix + suffix);
            });
        });

        return registers;
    }
}

// Example usage:
// const ia32Ops = new IA32_OPS();
// console.log(ia32Ops.getRandomInstruction(true, true, true)); // Random instruction from all categories
// console.log(ia32Ops.getRandomInstruction(true, false, false)); // Random memory or stack operation instruction
// console.log(ia32Ops.getRandomInstruction(false, true, true)); // Random arithmetic or bit operation instruction