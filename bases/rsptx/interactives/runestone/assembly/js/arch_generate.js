// arch_generate.js
"use strict";


import { off } from 'codemirror';
import arch_data from './arch_data.json';
const MAX_NUM = arch_data.MAX_NUM;
const BIT_ODDS_X86_64 = arch_data.BIT_ODDS_X86_64;

const MSG_OK = arch_data.MSG_OK;
const MSG_BAD_DEST = arch_data.MSG_BAD_DEST;
const MSG_BAD_SRC = arch_data.MSG_BAD_SRC;
const MSG_CT = arch_data.MSG_CT;

function randomFloat32() {
    return window.crypto.getRandomValues(new Uint32Array(1))[0] / (2 ** 32);
}

function weightedPickId(odds) {
    const total = odds.reduce((sum, a) => sum + a, 0);
    let seed = 0;
    while (seed === 0) {
        seed = randomFloat32() * total;
    } // not possible to pick 0 weights events
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
function unifPickId(arr) {
    return Math.floor(randomFloat32() * arr.length);
}

// Combines multiple arrays and picks a random item from the combined array.
function unifPickItem(...items) {
    const combinedArray = items.flat();

    if (combinedArray.length === 0) {
        throw new Error("No arrays provided or all provided arrays are empty.");
    }

    return combinedArray[unifPickId(combinedArray)];
}

// main weights doesn't have to add up to 100, bad_ct and bad_type not mut exclusive
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

        let instructionKeys = ['memOps', 'archOps', 'arithUnary', 'arithBinary', 'bitLogic', 'bitShift'];
        instructionKeys.forEach(key => {
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

        this.architecture = config.name;
        this.offsets    = config.offsets;
        this.registers_32  = config.registers_32;
        this.registers_64  = config.registers_64;
    }

    generate_question(mem_arch, arith, bit) {
        const fam_weights = [
            mem_arch ? this.memOps.mainWeight : 0,
            mem_arch ? this.archOps.mainWeight : 0,
            arith ? this.arithUnary.mainWeight : 0,
            arith ? this.arithBinary.mainWeight : 0,
            bit ? this.bitLogic.mainWeight : 0,
            bit ? this.bitShift.mainWeight : 0,
        ];
        let index = weightedPickId(fam_weights);
        return this._makePrompt(index);
    }

    _makePrompt(index) {
        let family;
        switch (index) {
            case 0: family = this.memOps; break;
            case 1: family = this.archOps; break;
            case 2: family = this.arithUnary; break;
            case 3: family = this.arithBinary; break;
            case 4: family = this.bitLogic; break;
            case 5: family = this.bitShift; break;
            default: throw new Error("Invalid operation index");
        }
        const op = unifPickItem(family.instructions);
        const q_type = weightedPickId(family.errorsOdds);
        let expr = "";
        let feedback = "";
        switch (q_type) {
            case 0:
                expr = family.errors.ok;
                feedback = MSG_OK;
                break;
            case 1:
                expr = family.errors.bad_dest;
                feedback = MSG_BAD_DEST;
                break;
            case 2:
                expr = family.errors.bad_src;
                feedback = MSG_BAD_SRC;
                break;
            case 3:
                expr = family.errors.bad_ct;
                feedback = MSG_CT;
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
            case 'a': return unifPickItem(reg, mem, lit);
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
            return this._evalPrompt(unifPickItem(options), is32);
        }
        const solveChar = (char) => this._solveChar(char, is32);
        return cloneExpr.split('').map(solveChar).join(", ");
    }

    generateRandomInitialState(num_instructions, num_registers, num_addresses, selection) {
        let offsets = arch_data[this.architecture]['offsets'];
        let registers_regular = arch_data[this.architecture]['registers_regular'];
        let registers_stack = arch_data[this.architecture]['registers_stack'];

        // Addresses
        let selected_addresses = [];
        let increment = this.architecture == "X86_32" ? 4 : 8;
        const minAddress = 0x000;
        const maxAddress = 0xFFF;
        const baseAddress = Math.floor(Math.random() * (maxAddress - minAddress - num_addresses + 2)) + minAddress;
        for (let i = 0; i < num_addresses; i++) {
            let address = baseAddress - (i * increment);
            let hexAddress = "0x" + address.toString(16).padStart(3, '0').toUpperCase();
            let hexValue = selection[0]
            ? (Math.random() < 0.5 ? "0x" : "0x" + Math.floor(Math.random() * 256).toString(16).padStart(2, '0'))
            : (Math.random() < 0.5 ? "0x" : "0x" + Math.floor(Math.random() * 16).toString(16))
            selected_addresses.push({ address: hexAddress, location: i != 0 ? `-0x${(i*increment).toString(16)}` : "", value: hexValue });
        }

        // Registers
        const selected_regular_registers = [];
        const selected_stack_resgisters = [];
        for (let i = 0; i < (num_registers - registers_stack.length); i++) {
            const randomValue = `0x${Math.floor(Math.random() * 0x100).toString(16).padStart(2, '0').toUpperCase()}`;
            selected_regular_registers.push({ register: registers_regular[i], value: randomValue, type:"normal"});
        }
        for (let i = 0; i < registers_stack.length; i++) {
            selected_stack_resgisters.push({ register: registers_stack[i], value: selected_addresses[0].address, type:"memory"});
        }
        let selected_registers = [
            ...selected_regular_registers,
            ...selected_stack_resgisters,
        ];

        // Instructions
        let selected_instructions = [];
        for (let i = 0; i < num_instructions; i++) {
            selected_instructions[i] = this.generateComplexInstruction(selected_regular_registers, selected_stack_resgisters, selected_addresses, offsets, selection);
        }

        // returning state
        return [selected_instructions, selected_addresses, selected_registers];
    }

    generateComplexInstruction(regular_registers, stack_registers, memory, offsets, selection) {

        // how are we gonna deal with formats?
        const easyFormats = [
            '{op} {reg1}, {reg2}',
            '{op} {reg2}, {reg1}',
            '{op} {reg1}, {memAddr}',
            '{op} {reg2}, {memAddr}',

            '{op} {literal}, {reg1}',
            '{op} {literal}, {reg2}',
            '{op} {literal}, {memAddr}',
            '{op} {literal}, {memAddr}',

            '{op} {memAddr}, {reg2}',
            '{op} {memAddr}, {reg1}',
        ];

        const hardFormats = [
            '{op} {offset}({reg1}), {reg2}',
            '{op} {offset}({reg2}), {reg1}',
            '{op} ({reg1}, {reg2}), {reg1}',
            '{op} ({reg1}, {reg2}), {reg2}',
            '{op} {literal}, ({reg1}, {reg2})',
        ];

        const possibleFormats = [
            '{op} ({reg1}), {reg2}',
            '{op} {reg1}, ({reg2})',
            '{op} ({reg1}), ({reg2})',
        ]

        let operations = []
        selection[1] && arch_data[this.architecture]["arithBinary"].instructions.forEach((instruction) => {operations.push(instruction)});
        // selection[2] && arch_data[this.architecture]["bitLogic"].instructions.forEach((instruction) => {operations.push(instruction)});
        // selection[2] && arch_data[this.architecture]["bitShift"].instructions.forEach((instruction) => {operations.push(instruction)});
        selection[3] && arch_data[this.architecture]["memOps"].instructions.forEach((instruction) => {operations.push(instruction)});

        const formats = selection[0] ? [...easyFormats, ...hardFormats] : [...easyFormats];


        // logical insturctions to be checked
        const op = unifPickItem(operations);
        let format = unifPickItem(formats);
        let reg1 = unifPickItem(regular_registers);
        let reg2 = unifPickItem(regular_registers);
        let memItem = unifPickItem(memory);
        while(stack_registers.find(r => r.value == memItem.address)){
            memItem = unifPickItem(memory);
        }
        let offset = unifPickItem(offsets);
        let literal = Math.floor(Math.random() * 8) * 8;

        // Adjust the format for offset-related instructions
        if (format.includes('offset')) {
            if (format.includes('memAddr')) {
                const maxOffset = Math.max(...memory.map(item => parseInt(item.address, 16))) - parseInt(memAddr, 16);
                offset = offset <= maxOffset ? offset : maxOffset;
            } else if (format.includes('reg')) {
                const maxOffset = Math.max(...registers.map(item => parseInt(item.value, 16))) - parseInt(memAddr, 16);
                while (isNaN(maxOffset)) {
                    maxOffset = Math.max(...registers.map(item => parseInt(item.value, 16))) - parseInt(memAddr, 16);
                }
                offset = offset <= maxOffset ? offset : maxOffset;
            }
        }

        // beautified instructions to be added
        reg1 = "%" + reg1.register;
        reg2 = "%" + reg2.register;
        let memAddr = `${memItem.location}(%${stack_registers[0].register})`;
        let prefix = this.architecture === 'ARM64' ? '#' : '$';
        literal = `${prefix}${literal}`;


        return format
            .replace(/\+0\b/g, '')
            .replace(/{op}/g, op)
            .replace(/{memAddr}/g, memAddr)
            .replace(/{offset}/g, offset)
            .replace(/{reg1}/g, reg1)
            .replace(/{reg2}/g, reg2)
            .replace(/{literal}/g, literal);
    }

    parseInstruction(instruction) {
        const regex = /(\w+)\s+(.+)/;
        const match = instruction.match(regex);
        if (!match) return null;

        const [, op, argsString] = match;

        // Updated regex to handle memory references with parentheses
        const argRegex = /(?:\$|#)?-?(?:0x[\da-fA-F]+|\d+)(?:\([^)]+\))?|\([^)]+\)|%?\w+/g;
        const parsedArgs = argsString.match(argRegex) || [];

        // Process each argument
        const processedArgs = parsedArgs.map(arg => {
            arg = arg.trim();
            if (/^[a-z]{3}$/.test(arg)) {  // If it's a 3-letter register name without %
                return '%' + arg;
            }
            // If it's a number without $ or #, and not part of a memory reference, add $
            if (/^\d+$/.test(arg)) {
                return '$' + arg;
            }
            return arg;
        });

        return { op, args: processedArgs };
    }

    executeInstructions(input) {
        const [instructions, memory, registers] = input;
        const states = [];

        instructions.forEach((instruction, step) => {
            const parsed = this.parseInstruction(instruction);
            if (!parsed) {
                console.error(`Invalid instruction format: ${instruction}`);
                return;
            }

            const { op, args } = parsed;

            switch (op) {
                case 'mov':
                case 'movl':
                case 'add':
                case 'sub':
                    this.executeArithmeticOrMove(op, args, registers, memory);
                    break;
                // Add more cases for other operations
                default:
                    console.warn(`Unsupported operation: ${op}`);
                    break;
            }

            // Save the current state
            states.push({
                step: step + 1,
                registers: JSON.parse(JSON.stringify(registers)),
                memory: JSON.parse(JSON.stringify(memory))
            });
        });

        return states;
    }

    executeArithmeticOrMove(op, args, registers, memory) {
        const [src, dest] = args;
        const srcValue = this.getValue(src, registers, memory);
        const destValue = this.getValue(dest, registers, memory);

        let result;
        switch (op) {
            case 'mov':
                result = srcValue;
                break;
            case 'add':
                result = this.calculate(op, destValue, srcValue);
                break;
            case 'sub':
                result = this.calculate(op, destValue, srcValue);
                break;
        }

        this.setValue(dest, result, registers, memory);
    }

    getValue(operand, registers, memory) {
        if (operand.startsWith('%')) {
            // Register
            const reg = registers.find(r => `%${r.register}` === operand);
            return parseInt(reg.value, 16);
        } else if (operand.startsWith('$')) {
            // Immediate value
            return parseInt(operand.slice(1), 10);
        } else {
            // Memory address
            const address = this.getMemoryAddress(operand, registers, memory);
            const mem = memory.find(m => m.address === address);
            if (mem && /^0x[0-9a-fA-F]+$/i.test(mem.value)) {
                return parseInt(mem.value, 16);
            } else {
                return 0; // Return 0 or any other default value in case of invalid hex
            }
        }
    }

    setValue(operand, value, registers, memory) {
        if (operand.startsWith('%')) {
            // Register
            const regIndex = registers.findIndex(r => `%${r.register}` === operand);
            registers[regIndex].value = "0x" + value.toString(16).toUpperCase();
        } else {
            // Memory address
            const address = this.getMemoryAddress(operand, registers, memory);
            const memIndex = memory.findIndex(m => m.address === address);
            memory[memIndex].value = "0x" + value.toString(16).toUpperCase();
        }
    }

    getMemoryAddress(operand, registers, memory) {
        // Updated regex to handle cases with and without offset
        const regex = /(?:(-?0x[0-9a-fA-F]+|-?\d+))?\(%([^)]+)\)/;
        const match = operand.match(regex);

        if (match) {
            let [, offset, reg] = match;
            const baseRegister = registers.find(r => r.register === reg);
            if (!baseRegister) {
                console.error(`Register ${reg} not found`);
                return operand;
            }

            const baseMemAddress = baseRegister.value;
            let address = parseInt(baseMemAddress, 16);

            // Handle offset if it exists
            if (offset) {
                if (offset.startsWith('0x') || offset.startsWith('-0x')) {
                    offset = parseInt(offset, 16);
                } else {
                    offset = parseInt(offset, 10);
                }
                address += offset;
            }

            return "0x" + address.toString(16).toUpperCase();
        }
        return operand;
    }

    calculate(op, destValue, srcValue) {
        switch (op) {
            case 'add':
                return destValue + srcValue;
            case 'sub':
                return destValue - srcValue;
            default:
                throw new Error(`Unsupported operation: ${op}`);
        }
    }
};

export class ARM64_OPS extends ArchInstructions {
    constructor() {
        super(arch_data.ARM64);
    }

    _is_32() {
        return unifPickItem(true, false);
    }

    _getTrueReg(is32) {
        return unifPickItem(is32 ? this.registers_32 : this.registers_64);
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

export class X86_BASE extends ArchInstructions {
    constructor(config) {
        super(config);
    }

    _getTrueReg(is32) {
        return `%${unifPickItem(is32 ? this.registers_32 : this.registers_64)}`;
    }
    _getTrueMem(is32) {
        const a = `(${this._getTrueReg(is32)})`;
        const b = `${this._getTrueOffset(is32)}${a}`;
        return unifPickItem(a, b);
    }
    _getTrueLit(is32) {
        return `\$${Math.floor(randomFloat32() * MAX_NUM)}`;
    }
}

export class X86_32_OPS extends X86_BASE {
    constructor() { super(arch_data.X86_32); }

    _is_32() { return true; }
}

export class X86_64_OPS extends X86_BASE {
    constructor() { super(arch_data.X86_64); }

    _is_32() { return (weightedPickId(BIT_ODDS_X86_64) == 0); }
}
