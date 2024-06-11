// *********
// arch_generate.js
// *********
// This file contains the JS for generating random params for assembly.
// Created By Tony Cao, Arys Aikyn, June 2024
"use strict";

const Q_BAD_TYPE = 1;
const Q_BAD_COUNT = 2;

import arch_data from './arch_data.json';
// NOTE:

function randomFloat() {
    return window.crypto.getRandomValues(new Uint32Array(1))[0]/(2**32);
}

function weightedPickId(odds) {
    const total = odds.reduce((sum, a) => sum + a, 0);
    let seed = 0;
    while (seed === 0) {
        seed = randomFloat() * total;
    }// not possible to pick 0 weights events
    let sum = 0;

    for (let i = 0; i < odds.length; i++) {
        sum += odds[i];
        if (odds[i] != 0 && seed < sum) {
            return i;
        }
    }
    return -1; // BAD

}


function unifPickId(arr)  {return Math.floor(randomFloat() * arr.length);}
function unifPickItem(...items) {
    // Combine all arrays into one
    const combinedArray = items.flat();
    
    if (combinedArray.length === 0) {
        throw new Error("No arrays provided or all provided arrays are empty.");
    }
    
    // Return a random item from the combined array
    return combinedArray[unifPickId(combinedArray)];
}

const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
function shuffle(array) {
    const copy = array.slice();
    let result = [];
    while (copy.length > 0) {
        const randomIndex = Math.floor(Math.random() * copy.length);
        result.push(copy[randomIndex]);
        copy.splice(randomIndex, 1);
    } 
    return result;
}

// main weights doesnt have to add up to 100, bad_ct and bad_type not mut exclusive
class InstructionsFamily {
    constructor(mainWeight, oddsArr, insArr) {
        if (oddsArr.length !== 4) {
            throw new Error("BAD ARR");
        }
        this.mainWeight = mainWeight;
        this.errorOdds = oddsArr;
        this.instructions = insArr;
    }
}

class ArchInstructions {
    constructor(config) {
        if (!config) {
            throw new Error("Config data required");
        }

        this.instructionKeys = ['memOps', 'archOps', 'arithUnary', 'arithBinary', 'bitLogic', 'bitShift'];
        this.instructionKeys.forEach(key => {
            if (config[key]) {
                this[key] = new InstructionsFamily(
                    config[key].mainWeight,
                    config[key].errorOdds,
                    config[key].instructions
                );
            } else {
                throw new Error(`Missing configuration for ${key}`);
            }
        });
        
        this.offsets    = config.offsets;
        this.registers_32  = config.registers_32;
        this.registers_64  = config.registers_64;
    }

    generate_question(mem_arch, arith, bit) {
        const fam_weights = [
            mem_arch ? this.memOps.mainWeight      : 0,
            mem_arch ? this.archOps.mainWeight     : 0,
            arith    ? this.arithUnary.mainWeight  : 0,
            arith    ? this.arithBinary.mainWeight : 0,
            bit      ? this.bitLogic.mainWeight    : 0,
            bit      ? this.bitShift.mainWeight    : 0,
        ];
        let index = weightedPickId(fam_weights);
        return this._makePrompt(index);
    }

    _makePrompt() {
        return ["NOT IMPLEMENTED", false, false];
    }

    _getTrueOffset(is32) {
        return unifPickItem(this.offsets);
    }
}

export class ARM64_OPS extends ArchInstructions {
    constructor() {
        super(arch_data.ARM64);
        this.bad_dest = arch_data.ARM64.bad_dest;
        for (let i = 0; i <= 28; i++) {
            this.registers_64.push(`x${i}`);
            this.registers_32.push(`w${i}`);
        }
    }

    _makePrompt(index) {
        let family;
        switch (index) {
            case 0: family = this.memOps;      break;
            case 1: family = this.archOps;     break;
            case 2: family = this.arithUnary;  break;
            case 3: family = this.arithBinary; break;
            case 4: family = this.bitLogic;    break;
            case 5: family = this.bitShift;    break;
            default: throw new Error("Invalid operation index");
        }
        const op = unifPickItem(family.instructions);
        const q_type = weightedPickId(family.errorOdds);
        const is_bad_type = (q_type&Q_BAD_TYPE) != 0;
        const is_bad_count = (q_type&Q_BAD_COUNT) != 0;

        const is32 = unifPickItem(true, false);

        const getReg = (isBad) => {
            isBad?unifPickItem(this._getTrueLit(is32), this._getTrueMem(is32)):this._getTrueReg(is32);
        }
        const getMem = (isBad) => {
            isBad?unifPickItem(this._getTrueLit(is32), this._getTrueReg(is32)):this._getTrueMem(is32);
        }
        const getLit = (isBad) => {
            isBad?unifPickItem(this._getTrueReg(is32), this._getTrueMem(is32)):this._getTrueLit(is32);
        }

        let prompt;
        switch (index) {
            case 0: // memOps
            case 2: // arithUnary
                prompt = this._promptUnary(op, is_bad_type, is_bad_count,
                    getReg, getReg,
                    getReg, getReg, getReg
                );
                break;
            case 1: // archOps
                prompt = this._promptUnary(op, is_bad_type, is_bad_count,
                    getReg, getMem,
                    getReg, getReg, getMem
                );
                break;
            case 3: // arithBinary
            case 4: // bitLogic
                prompt = this._promptBinary(op, is_bad_type, is_bad_count,
                    getReg, getReg,
                    getReg, getReg, getReg
                );
                break;
            case 5: // bitShift
                const getShiftOp = (isBad) => {
                    isBad?this._getTrueMem(is32):unifPickItem(this._getTrueLit(is32), this._getTrueReg(is32));
                }
                prompt = this._promptBinary(op, is_bad_type, is_bad_count,
                    getReg, getShiftOp,
                    getReg, getReg, getShiftOp
                );
                break;
            default: throw new Error("Invalid operation index");
        }

        return [prompt, is_bad_type, is_bad_count];
    }

    _promptUnary(op, is_bad_type, is_bad_count,
            arg_una1, arg_una2,
            arg_bin1, arg_bin2, arg_bin3
        ) {
        return this._promptBinary(op, is_bad_type, (!is_bad_count),
            arg_una1, arg_una2,
            arg_bin1, arg_bin2, arg_bin3);
    }

    _promptBinary(op, is_bad_type, is_bad_count,
            arg_una1, arg_una2,
            arg_bin1, arg_bin2, arg_bin3
        ) {
        let [bad_dest, pattern_una, pattern_bin] = [0, 0, 0];
        if (is_bad_type) {
            bad_dest = 1-weightedPickId(this.bad_dest);
            pattern_una = unifPickItem(bad_dest?range(1,3):range(1,1)); // bad count pattern
            pattern_bin = unifPickItem(bad_dest?range(1,7):range(1,3)); // bad count pattern
        }
        const prompt = (is_bad_count) ?
        `${op} ${arg_una1(pattern_una&2)}, ${arg_una2(pattern_una&1)}`:
        `${op} ${arg_bin1(pattern_bin&4)}, ${arg_bin2(pattern_bin&2)}, ${arg_bin3(pattern_bin&1)}`;
        return prompt;
    }

    _getTrueReg(is32) {
        return unifPickItem(is32?this.registers_32:this.registers_64);
    }

    _getTrueLit(is32) {
        return `#${Math.floor(randomFloat() * 63)}`;
    }

    _getTrueMem(is32) {
        const a = `[${this._getTrueReg(is32)}]`;
        const b = `[${this._getTrueReg(is32)}, ${unifPickItem(this._getTrueOffset(), this._getTrueReg(is32))}]`;
        return unifPickItem(a, b);
    }
}

export class X86_32_OPS extends ArchInstructions {
    constructor(config) {
        if (arguments.length >0) {super(config);}
        else {super(arch_data.X86_32);}
    }
    is_32() {return true;}

    _makePrompt(index) {
        let family;
        switch (index) {
            case 0: family = this.memOps;      break;
            case 1: family = this.archOps;     break;
            case 2: family = this.arithUnary;  break;
            case 3: family = this.arithBinary; break;
            case 4: family = this.bitLogic;    break;
            case 5: family = this.bitShift;    break;
            default: throw new Error("Invalid operation index");
        }
        const is32 = this.is_32();
        const op = unifPickItem(family.instructions);
        const q_type = weightedPickId(family.errorOdds);
        const is_bad_type = (q_type&Q_BAD_TYPE) != 0;
        const is_bad_count = (q_type&Q_BAD_COUNT) != 0;


        let prompt;
        switch (index) {
            case 0: // memOps
            case 3: // arithBinary
            case 4: // bitLogic
            case 2: // arithUnary
            case 5: // bitShift
                prompt = this._promptBinary(op, is_bad_type, is_bad_count, is32);
                break;
            case 1: // archOps
                prompt = this._promptUnary(op, is_bad_type, is_bad_count, is32);
                break;
            default: throw new Error("Invalid operation index");
        }

        return [prompt, is_bad_type, is_bad_count];
    }

 

    _promptUnary(op, is_bad_type, is_bad_count, is32) {
    return this._promptBinary(op, is_bad_type, (!is_bad_count), is32,
        arg_una1,
        arg_bin1, arg_bin2);
    }

    _promptBinary(op, is_bad_type, is_bad_count, is32) {
        const pattern_una = unifPickItem(range(0,1));
        const pattern_bin = unifPickItem(range(0,2));
        let una1 = pattern_una?this._getTrueMem(is32):this._getTrueReg(is32);
        let bin1 = pattern_bin&1?this._getTrueMem(is32):this._getTrueReg(is32);
        let bin2 = pattern_bin&2?this._getTrueMem(is32):this._getTrueReg(is32);

        if (is_bad_type) {
            bad_dest = 1-weightedPickId(this.bad_dest);
            pattern_una = bad_dest;
            pattern_bin = unifPickItem(bad_dest?range(1,3):1); // bad count pattern
        }
        const prompt =  is_bad_count ?
        `${op} ${una1}`:
        `${op} ${bin1}, ${bin2}`;
        return prompt;
    }
    
    _getTrueLit(is32){
        return `\$${Math.floor(randomFloat32() * MAX_NUM)}`;
    }
    _getTrueMem(is32) {
        const a = `(${this._getTrueReg(is32)})`;
        const b = `0x${this._getTrueOffset(is32)}${a}`;
        return unifPickItem(a, b);
    }
    _getTrueReg(is32) {
        return `%${unifPickItem(is32?this.registers_32:this.registers_64)}`
    }

}

export class X86_64_OPS extends X86_32_OPS {
    constructor() {super(arch_data.X86_64);}

    static is_32() {return (weightedPickId(BIT_ODDS_X86_64) == 0);}
}
