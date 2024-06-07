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

    _getTrueReg(is32) {
        return unifPickItem(is32?this.registers_32:this.registers_64);
    }
    
    _getTrueRegAny() {
        return unifPickItem(this.registers_32, this.registers_64);
    }

    _getTrueOffset(is32) {
        return unifPickItem(this.offsets);
    }

    _getReg(isBad, is32) {
        const mem = this._getTrueMem(is32);
        const reg = this._getTrueReg(is32);
        return isBad?mem:reg;
    }

    _getMem(isBad, is32) {
        const mem = this._getTrueMem(is32);
        const reg = this._getTrueReg(is32);
        return isBad?reg:mem;
    }
    _getNum(isBad, is32){
        const mem = this._getTrueMem(is32);
        const reg = this._getTrueReg(is32);
        const num = this._getTrueNum(is32);
        return isBad?unifPickItem(mem,reg):num;
    }
}

export class ARM64_OPS extends ArchInstructions {
    constructor() {
        super(arch_data.ARM64);
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
        const getTrueReg = () => this._getTrueReg(is32);
        const getReg = (isBad) => this._getReg(isBad, is32);
        const getMem = (isBad) => this._getMem(isBad, is32);
        const getNum = (isBad) => this._getNum(isBad, is32);

        let prompt;
        switch (index) {
            case 0: // memOps
            case 2: // arithUnary
                prompt = this._promptUnary(op, is_bad_type, is_bad_count,
                    getTrueReg, getReg,
                    getTrueReg, getReg, getReg
                );
                break;
            case 1: // archOps
                prompt = this._promptUnary(op, is_bad_type, is_bad_count,
                    getTrueReg, getMem,
                    getTrueReg, getReg, getMem
                );
                break;
            case 3: // arithBinary
            case 4: // bitLogic
                prompt = this._promptBinary(op, is_bad_type, is_bad_count,
                    getTrueReg, getReg,
                    getTrueReg, getReg, getReg
                );
                break;
            case 5: // bitShift
                prompt = this._promptBinary(op, is_bad_type, is_bad_count,
                    getTrueReg, getNum,
                    getTrueReg, getReg, getNum
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
        const pattern = is_bad_type?unifPickItem(1,2,3):0; // bad count pattern
        return (!is_bad_count) ?
            `${op} ${arg_una1()}, ${arg_una2(is_bad_type)}`:
            `${op} ${arg_bin1()}, ${arg_bin2(pattern&1)}, ${arg_bin3(pattern&2)}`;
    }

    _promptBinary(op, is_bad_type, is_bad_count,
            arg_una1, arg_una2,
            arg_bin1, arg_bin2, arg_bin3
        ) {
        const pattern = is_bad_type?unifPickItem(1,2,3):0; // bad count pattern
        return is_bad_count ?
            `${op} ${arg_una1()}, ${arg_una2(is_bad_type)}`:
            `${op} ${arg_bin1()}, ${arg_bin2(pattern&1)}, ${arg_bin3(pattern&2)}`;
    }

    _getTrueNum(is32) {
        return Math.floor(randomFloat() * 63);
    }

    _getTrueMem(is32) {
        const a = `[${this._getTrueReg(is32)}]`;
        const b = `[${this._getTrueReg(is32)}, ${unifPickItem(this._getTrueOffset(), this._getTrueReg(is32))}]`;
        return unifPickItem(a, b);
    }
}

export class X86_32_OPS extends ArchInstructions {
    constructor() {
        super(arch_data.X86_32);
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
        const is32 = true;
        const getMem = (isBad) => this._getMem(isBad, is32);

        let prompt;
        switch (index) {
            case 0: // memOps
            case 3: // arithBinary
            case 4: // bitLogic
            case 2: // arithUnary
            case 5: // bitShift
                prompt = this._promptBinary(op, is_bad_type, is_bad_count,
                    getMem,
                    getMem, getMem
                );
                break;
            case 1: // archOps
                prompt = this._promptUnary(op, is_bad_type, is_bad_count,
                    getMem,
                    getMem, getMem
                );
                break;
            default: throw new Error("Invalid operation index");
        }

        return [prompt, is_bad_type, is_bad_count];
    }

    _promptUnary(op, is_bad_type, is_bad_count,
        arg_una1,
        arg_bin1, arg_bin2
    ) {
        const pattern = is_bad_type?unifPickItem(2,3):0; // bad count pattern
        return (!is_bad_count) ?
            `${op} ${arg_una1(is_bad_type)}`:
            `${op} ${arg_bin1(pattern&1)}, ${arg_bin2(pattern&2)}`;
    }

    _promptBinary(op, is_bad_type, is_bad_count,
            arg_una1,
            arg_bin1, arg_bin2
        ) {
        const pattern = is_bad_type?unifPickItem(2,3):0; // bad count pattern
        return is_bad_count ?
            `${op} ${arg_una1(is_bad_type)}`:
            `${op} ${arg_bin1(pattern&1)}, ${arg_bin2(pattern&2)}`;
    }
    
    _getTrueNum(is32){
        return `\$${Math.floor(randomFloat() * 63)}`;
    }
    _getTrueMem(is32) {
        const a = `%${this._getTrueReg(is32)}`;
        const b = `0x${this._getTrueOffset(is32)}(${a})`;
        return unifPickItem(a, b);
    }

    _getMem(isBad, is32) {
        return isBad?
        this._getTrueNum(is32):
        this._getTrueMem(is32);
    }

}

export class X86_64_OPS extends ArchInstructions {
    constructor() {
        super(arch_data.X86_64);
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
        const is32 = false;
        const getMem = (isBad) => this._getMem(isBad, is32);

        let prompt;
        switch (index) {
            case 0: // memOps
            case 3: // arithBinary
            case 4: // bitLogic
            case 2: // arithUnary
            case 5: // bitShift
                prompt = this._promptBinary(op, is_bad_type, is_bad_count,
                    getMem,
                    getMem, getMem
                );
                break;
            case 1: // archOps
                prompt = this._promptUnary(op, is_bad_type, is_bad_count,
                    getMem,
                    getMem, getMem
                );
                break;
            default: throw new Error("Invalid operation index");
        }

        return [prompt, is_bad_type, is_bad_count];
    }

    _promptUnary(op, is_bad_type, is_bad_count,
        arg_una1,
        arg_bin1, arg_bin2
    ) {
        const pattern = is_bad_type?unifPickItem(2,3):0; // bad count pattern
        return (!is_bad_count) ?
            `${op} ${arg_una1(is_bad_type)}`:
            `${op} ${arg_bin1(pattern&1)}, ${arg_bin2(pattern&2)}`;
    }

    _promptBinary(op, is_bad_type, is_bad_count,
            arg_una1,
            arg_bin1, arg_bin2
        ) {
        const pattern = is_bad_type?unifPickItem(2,3):0; // bad count pattern
        return is_bad_count ?
            `${op} ${arg_una1(is_bad_type)}`:
            `${op} ${arg_bin1(pattern&1)}, ${arg_bin2(pattern&2)}`;
    }
    
    _getTrueNum(is32){
        return `\$${Math.floor(randomFloat() * 63)}`;
    }
    _getTrueMem(is32) {
        const a = `%${this._getTrueReg(is32)}`;
        const b = `0x${this._getTrueOffset(is32)}(${a})`;
        return unifPickItem(a, b);
    }

    _getMem(isBad, is32) {
        return isBad?
        this._getTrueNum(is32):
        this._getTrueMem(is32);
    }

}
