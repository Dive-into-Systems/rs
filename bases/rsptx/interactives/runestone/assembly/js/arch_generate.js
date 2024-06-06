// *********
// arch_generate.js
// *********
// This file contains the JS for generating random params for assembly.
// Created By Tony Cao, Arys Aikyn, June 2024
"use strict";

// NOTE:
// main weights doesnt have to add up to 100, bad_ct and bad_type not mut exclusive
class InstructionsFamily {
    constructor(mainWeight, oddsArr, insArr) {
        if (oddsArr.length !== 4) {
            throw new Error("BAD ARR");
        }
        this.mainWeight = mainWeight;
        this.odds = oddsArr;
        this.instructions = insArr;
    }
}

class ArchInstructions {
    constructor() {
        this.memOps        = new InstructionsFamily(0, [0,0,0,0], []);
        this.archOps       = new InstructionsFamily(0, [0,0,0,0], []);
        this.arithUnary    = new InstructionsFamily(0, [0,0,0,0], []);
        this.arithBinary   = new InstructionsFamily(0, [0,0,0,0], []);
        this.bitOps        = new InstructionsFamily(0, [0,0,0,0], []);
        this.offsets        = [];
        this.registers      = this._generateRegisters();
    }

    _generateRegisters() {
        return [];
    }

    _weighted_pick(odds) {
        const total = odds.reduce((sum, a) => sum + a, 0);
        let seed = 0;
        while (seed === 0){
            seed = Math.random() * total;
        }// not possible to pick 0 weights events
        let sum = 0;

        for (let i = 0; i < odds.length; i++) {
            sum += odds[i];
            if (seed < sum && odds[i] != 0) {
                return i;
            }
        }
        return -1; // BAD

    }

    _unif_pick(arr) {
        return Math.floor(Math.random() * arr.length);
    }

    generate_question_params(mem_arch, arith, bit) {
        const fam_weights = [
            mem_arch ? this.memOps.mainWeight      : 0,
            mem_arch ? this.archOps.mainWeight     : 0,
            arith    ? this.arithUnary.mainWeight  : 0,
            arith    ? this.arithBinary.mainWeight : 0,
            bit      ? this.bitOps.mainWeight      : 0,
        ];
        let index = this._weighted_pick(fam_weights);
        let family;
        switch (index) {
            case 0: family = this.memOps;      break;
            case 1: family = this.archOps;     break;
            case 2: family = this.arithUnary;  break;
            case 3: family = this.arithBinary; break;
            case 4: family = this.bitOps;      break;
            default: throw new Error("Invalid operation index");
        }
        index = this._unif_pick(family.instructions);
        const op = family.instructions[index];

        // bit operations to check which case we are instead of doing switches
        const q_type = this._weighted_pick(family.odds);
        const is_bad_type = (q_type&1) == 1;
        const is_bad_count = (q_type&2) == 2;
        return [op, is_bad_type, is_bad_count];

    }
}


export class ARM64_OPS extends ArchInstructions {
    constructor() {
        super();
        // correct, wrong type, wrong ct, wrong both
        this.memOps        = new InstructionsFamily(15, [0.25, 0.25, 0.25, 0.25], ["mov"]);
        this.archOps       = new InstructionsFamily(15, [0.25, 0.25, 0.25, 0.25], ["ldr", "str"]);
        this.arithUnary    = new InstructionsFamily(20, [0.25, 0.25, 0.25, 0.25], ["neg", "mvn"]);
        this.arithBinary   = new InstructionsFamily(30, [0.25, 0.25, 0.25, 0.25], ["add", "sub", "and", "orr", "eor"]);
        this.bitOps        = new InstructionsFamily(20, [0.25, 0.25, 0.25, 0.25], ["lsl", "lsr", "asr"]);
        this.offsets        = ["#8", "#16", "#32"];
    }

    _generateRegisters() {
        let registers = [];
        for (let i = 0; i < 29; i++) {
            registers.push("x" + i.toString());
            registers.push("w" + i.toString());
        }
        return registers;
    }
    

}

export class IA32_OPS extends ArchInstructions {
    constructor() {
        super();
        this.memOps        = new InstructionsFamily(15, [0.25, 0.25, 0.25, 0.25], ["mov"]);
        this.archOps       = new InstructionsFamily(15, [0.25, 0.25, 0.25, 0.25], ["push", "pop"]);
        this.arithUnary    = new InstructionsFamily(20, [0.25, 0.25, 0.25, 0.25], ["neg", "not"]);
        this.arithBinary   = new InstructionsFamily(30, [0.25, 0.25, 0.25, 0.25], ["add", "sub", "and", "or", "xor"]);
        this.bitOps        = new InstructionsFamily(20, [0.25, 0.25, 0.25, 0.25], ["shl", "shr", "sar"]);
        this.offsets        = ["8", "16", "32"];
    }

    _generateRegisters() {
        let registers = ["eax", "ebx", "ecx", "edx", "esi", "edi", "ebp", "esp",
                        "rax", "rbx", "rcx", "rdx", "rsi", "rdi", "rbp", "rsp",
                        "r8", "r9", "r10", "r11", "r12", "r13", "r14", "r15"];
        return registers;
    }
}
