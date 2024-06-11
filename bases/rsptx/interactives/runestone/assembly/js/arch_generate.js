// *********
// arch_generate.js
// *********
// This file contains the JS for generating random params for assembly.
// Created By Tony Cao, Arys Aikyn, June 2024
"use strict";

const Q_BAD_TYPE = 1;
const Q_BAD_COUNT = 2;

import arch_data from './arch_data.json';
const MAX_NUM = arch_data.MAX_NUM


function randomFloat32() {
    return window.crypto.getRandomValues(new Uint32Array(1))[0]/(2**32);
}

function weightedPickId(odds) {
    const total = odds.reduce((sum, a) => sum + a, 0);
    let seed = 0;
    while (seed === 0) {
        seed = randomFloat32() * total;
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

// Selects a random index from an array.
function unifPickId(arr)  {return Math.floor(randomFloat32() * arr.length);}

// Combines multiple arrays and picks a random item from the combined array.
function unifPickItem(...items) {
    const combinedArray = items.flat();
    
    if (combinedArray.length === 0) {
        throw new Error("No arrays provided or all provided arrays are empty.");
    }
    
    return combinedArray[unifPickId(combinedArray)];
}

// main weights doesnt have to add up to 100, bad_ct and bad_type not mut exclusive
class InstructionsFamily {
    constructor(mainWeight, insArr, oddsArr, errorArr) {
        this.mainWeight = mainWeight;
        this.instructions = insArr;
        this.errorsOdds = oddsArr;
        this.errors = errorArr;
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
                    config[key].instructions,
                    config[key].errorsOdds,
                    config[key].errors
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
        const q_type = weightedPickId(family.errorsOdds);
        let expr;
        let feedback = "";
        switch (q_type) {
            case 0:
                expr = family.errors.ok;
                feedback = arch_data.MSG_OK;
                break;
            case 1:
                expr = family.errors.bad_dest;
                feedback = arch_data.MSG_BAD_DEST;
                break;
            case 2:
                expr = family.errors.bad_src;
                feedback = arch_data.MSG_BAD_SRC;
                break;
            case 3:
                expr = family.errors.bad_ct;
                feedback = arch_data.MSG_CT;
                break;
            default: throw new Error("Invalid operation index");
        }
        const is32 = this._is_32();
        const prompt = `${op} ${this._evalPrompt(expr, is32)}`;

        return [prompt, q_type, feedback];
    }

    _getTrueOffset(is32) {
        return unifPickItem(this.offsets);
    }

    _solveChar(char, is32) {
        const reg = this._getTrueReg(is32);
        const mem = this._getTrueMem(is32);
        const lit = this._getTrueLit(is32);
        switch (char) {
            case 'r': return reg;
            case 'm': return mem;
            case 'l': return lit;
            case 'a': return unifPickItem(reg,mem,lit);
            default: throw new Error(`Unexpected char: ${char}`);
        }
    }

    // solve nested expressions
    _solveNest(expression, is32) {
        while (expression.includes('(')) {
            expression = expression.replace(/\(([^()]+)\)/g, (match, subExpression) => this._solveNest(subExpression, is32));
        }
        return expression;
    }

    // recursively expressions
    _evalPrompt(expression, is32) {
        const evalPrompt = (expr) => this._evalPrompt(expr, is32);
        
        let cloneExpr = this._solveNest(expression.replace(/\s+/g, ''), is32);
        if (cloneExpr.includes('-')) {
            return cloneExpr.split('-').map(evalPrompt).join(", ");
        }
        if (cloneExpr.includes('/')) {
            const options = cloneExpr.split('/');
            return this._evalPrompt(unifPickItem(options));
        }
        const solveChar = (char) => this._solveChar(char, is32);
        return cloneExpr.split('').map(solveChar).join(", ");
    }
}

export class ARM64_OPS extends ArchInstructions {
    constructor() {
        super(arch_data.ARM64);
        // this.bad_dest = arch_data.ARM64.bad_dest;
        this.bad_dest = [50,50];
        for (let i = 0; i <= 28; i++) {
            this.registers_64.push(`x${i}`);
            this.registers_32.push(`w${i}`);
        }
    }

    _is_32() {
        return unifPickItem(true, false);
    }

    _getTrueReg(is32) {
        return unifPickItem(is32?this.registers_32:this.registers_64);
    }
    
    _getTrueMem(is32) {
        const a = `[${this._getTrueReg(is32)}]`;
        const b = `[${this._getTrueReg(is32)}, ${unifPickItem(this._getTrueOffset(), this._getTrueReg(is32))}]`;
        return unifPickItem(a, b);
    }
    _getTrueLit(is32) {
        return `#${Math.floor(randomFloat32() * 63)}`;
    }

}

export class X86_32_OPS extends ArchInstructions {
    constructor(config) {
        if (arguments.length >0) {
            super(config);
            this.bad_dest = [50,50];

        }
        else {
            super(arch_data.X86_32);
            this.bad_dest = [50,50];
        }

    }
    _is_32() {return true;}

    _getTrueReg(is32) {
        return `%${unifPickItem(is32?this.registers_32:this.registers_64)}`
    }
    _getTrueMem(is32) {
        const a = `(${this._getTrueReg(is32)})`;
        const b = `${this._getTrueOffset(is32)}${a}`;
        return unifPickItem(a, b);
    }
    _getTrueLit(is32){
        return `\$${Math.floor(randomFloat32() * MAX_NUM)}`;
    }
}

export class X86_64_OPS extends X86_32_OPS {
    constructor() {super(arch_data.X86_64);}

    static _is_32() {return (weightedPickId(BIT_ODDS_X86_64) == 0);}
}
