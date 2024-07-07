// arch_generate.js
// This file contains the JS for the Runestone Assembly State component. Created by Arys Aikyn, Tony Cao 06/03/2024
"use strict";

import { off } from 'codemirror';
import arch_data from './arch_data.json';

const { MAX_NUM, BIT_ODDS_X86_64, MSG_OK, MSG_BAD_DEST, MSG_BAD_SRC, MSG_CT } = arch_data;

function randomFloat32() {
    return window.crypto.getRandomValues(new Uint32Array(1))[0] / (2 ** 32);
}

function weightedPickId(odds) {
    const total = odds.reduce((sum, a) => sum + a, 0);
    let seed = randomFloat32() * total;
    return odds.findIndex((odds, i) => (seed -= odds) < 0);
}

function unifPickId(arr) {
    return Math.floor(randomFloat32() * arr.length);
}

function unifPickItem(...items) {
    const combinedArray = items.flat();
    if (!combinedArray.length) throw new Error("No arrays provided or all are empty.");
    return combinedArray[unifPickId(combinedArray)];
}

class InstructionsFamily {
    constructor(mainWeight, insArr, oddsArr, errorArr) {
        Object.assign(this, { mainWeight, instructions: insArr, errorsOdds: oddsArr, errors: errorArr });
    }
}

class ArchInstructions {
    constructor(config) {
        if (!config) throw new Error("Config data required");

        ['memOps', 'archOps', 'arithUnary', 'arithBinary', 'bitLogic', 'bitShift'].forEach(key => {
            if (!config[key]) throw new Error(`Missing configuration for ${key}`);
            this[key] = new InstructionsFamily(config[key].mainWeight, config[key].instructions, config[key].errorsOdds, config[key].errors);
        });

        Object.assign(this, {
            architecture: config.name,
            offsets: config.offsets,
            registers_32: config.registers_32,
            registers_64: config.registers_64
        });
    }

    generate_question(mem_arch, arith, bit) {
        const fam_weights = [
            mem_arch ? this.memOps.mainWeight : 0,
            mem_arch ? this.archOps.mainWeight : 0,
            arith ? this.arithUnary.mainWeight : 0,
            arith ? this.arithBinary.mainWeight : 0,
            bit ? this.bitLogic.mainWeight : 0,
            bit ? this.bitShift.mainWeight : 0,
            bit ? this.stackOps.mainWeight : 0, //stack
        ];
        return this._makePrompt(weightedPickId(fam_weights));
    }

    _makePrompt(index) {
        const family = [this.memOps, this.archOps, this.arithUnary, this.arithBinary, this.bitLogic, this.bitShift][index];
        const op = unifPickItem(family.instructions);
        const q_type = weightedPickId(family.errorsOdds);
        const expr = [family.errors.ok, family.errors.bad_dest, family.errors.bad_src, family.errors.bad_ct][q_type];
        const feedback = [MSG_OK, MSG_BAD_DEST, MSG_BAD_SRC, MSG_CT][q_type];
        const prompt = `${op} ${this._evalPrompt(expr, this._is_32())}`;

        return [prompt, q_type, feedback];
    }

    _getTrueOffset(is32) {
        return unifPickItem(this.offsets);
    }

    _solveChar(char, is32) {
        const reg = this._getTrueReg(is32);
        const mem = this._getTrueMem(is32);
        const lit = this._getTrueLit(is32);
        return { r: reg, m: mem, l: lit, a: unifPickItem(reg, mem, lit) }[char] || (() => { throw new Error(`Unexpected char: ${char}`) })();
    }

    _solveNest(expression, is32) {
        while (expression.includes('(')) {
            expression = expression.replace(/\(([^()]+)\)/g, (_, subExpression) => this._solveNest(subExpression, is32));
        }
        return expression;
    }

    _evalPrompt(expression, is32) {
        let cloneExpr = this._solveNest(expression.replace(/\s+/g, ''), is32);
        return cloneExpr.includes('-')
            ? cloneExpr.split('-').map(expr => this._evalPrompt(expr, is32)).join(", ")
            : cloneExpr.includes('/')
                ? this._evalPrompt(unifPickItem(cloneExpr.split('/')), is32)
                : cloneExpr.split('').map(char => this._solveChar(char, is32)).join(", ");
    }

    // for assembly_state

    generateRandomInitialState(num_instructions, num_registers, num_addresses, selection) {
        const selected_addresses = this.generateAddresses(num_addresses);
        const { selected_regular_registers, selected_stack_registers } = this.selectRegisters(num_registers, selected_addresses);
        const selected_instructions = this.generateInstructions(num_instructions, selected_regular_registers, selected_stack_registers, selected_addresses, selection);
        return [selected_instructions, selected_addresses.reverse(), [...selected_regular_registers, ...selected_stack_registers]];
    }

    generateComplexInstruction(regular_registers, stack_registers, memory, offsets, selection) {
        const formats = [
            '{op} {reg1}, {reg2}', '{op} {reg2}, {reg1}', '{op} {reg1}, {memAddr}', '{op} {reg2}, {memAddr}',
            '{op} {literal}, {reg1}', '{op} {literal}, {reg2}', '{op} {literal}, {memAddr}', '{op} {literal}, {memAddr}',
            '{op} {memAddr}, {reg2}', '{op} {memAddr}, {reg1}'
        ];

        const stackFormats = { "push": ['{op} {reg1}', '{op} {memAddr}', '{op} {literal}'],
                                "pop": ['{op} {reg1}', '{op} {memAddr}']
        };

        const operations = [
            ...selection[0] ? arch_data[this.architecture]["arithBinary"].instructions : [],
            ...selection[1] ? arch_data[this.architecture]["archOps"].instructions : [],
            ...selection[2] ? arch_data[this.architecture]["memOps"].instructions : []
        ];

        const op = unifPickItem(operations);
        let format = (op === 'push' || op === 'pop') ? unifPickItem(stackFormats[op]) : unifPickItem(formats);
        console.log(format);
        let reg1 = unifPickItem(regular_registers);
        let reg2 = unifPickItem(regular_registers);
        let memItem = unifPickItem(memory);
        while (stack_registers.some(r => r.value == memItem.address)) {
            memItem = unifPickItem(memory);
        }
        let offset = unifPickItem(offsets);
        let literal = Math.floor(Math.random() * 8) * 8;
        if (format.includes('offset')) {
            const maxOffset = format.includes('memAddr')
                ? Math.max(...memory.map(item => parseInt(item.address, 16))) - parseInt(memItem.address, 16)
                : Math.max(...regular_registers.map(item => parseInt(item.value, 16))) - parseInt(memItem.address, 16);
            offset = Math.min(offset, maxOffset);
        }

        reg1 = `%${reg1.register}`;
        reg2 = `%${reg2.register}`;
        const memAddr = `${memItem.location}(%${stack_registers[1].register})`;
        const prefix = this.architecture === 'ARM64' ? '#' : '$';
        literal = `${prefix}${literal}`;

        return format.replace(/\+0\b/g, '')
            .replace(/{op}/g, op)
            .replace(/{memAddr}/g, memAddr)
            .replace(/{offset}/g, offset)
            .replace(/{reg1}/g, reg1)
            .replace(/{reg2}/g, reg2)
            .replace(/{literal}/g, literal);
    }

    generateAddresses(num_addresses) {
        const increment = this.architecture == "X86_32" ? 4 : 8;
        const minAddress = 0x000;
        const maxAddress = 0xFFF;
        const baseAddress = Math.floor(Math.random() * ((maxAddress - minAddress) / increment + 1)) * increment + minAddress;
        return Array.from({ length: num_addresses }, (_, i) => {
            const address = baseAddress - (i * increment);
            return {
                address: `0x${address.toString(16).padStart(3, '0').toUpperCase()}`,
                location: i ? `-${i * increment}` : "",
                value: (Math.floor(Math.random() * 11) + 5).toString()
            };
        });
    }

    selectRegisters(num_registers, selected_addresses) {
        const registers_regular = arch_data[this.architecture]['registers_regular'];
        const registers_stack = arch_data[this.architecture]['registers_stack'];
        const selected_regular_registers = Array.from({ length: num_registers - registers_stack.length }, (_, i) => ({
            register: registers_regular[i],
            value: (Math.floor(Math.random() * 11) + 5).toString(),
            type: "normal"
        }));
        return {
            selected_regular_registers,
            selected_stack_registers: [
                { register: registers_stack[1], value: selected_addresses[selected_addresses.length - 4].address, type: "memory" },
                { register: registers_stack[0], value: selected_addresses[0].address, type: "memory" }
            ]
        };
    }

    generateInstructions(num_instructions, selected_regular_registers, selected_stack_registers, selected_addresses, selection) {
        let selected_instructions = [];
        const offsets = arch_data[this.architecture]['offsets'];
        for (let attempts = 0; attempts < 100; attempts++) {
            selected_instructions = [];
            let simState = this.initializeSimulationState(selected_regular_registers, selected_stack_registers, selected_addresses);
            for (let i = 0; i < num_instructions; i++) {
                const instruction = this.generateComplexInstruction(selected_regular_registers, selected_stack_registers, selected_addresses, offsets, selection);
                selected_instructions.push(instruction);
            }
            if (!this.simulateInstructions(selected_instructions, simState)){
                continue;
            };
            if (selected_instructions.length === num_instructions) return selected_instructions;
        }
        console.warn("Failed to generate instructions without negative values after 100 attempts.");
        return selected_instructions;
    }

    initializeSimulationState(regular_registers, stack_registers, addresses) {
        const state = {};
        for (const { register, value } of regular_registers) {
            state[register] = value;
        }
        for (const { register, value } of stack_registers) {
            state[register] = value;
        }
        for (const { address, value } of addresses) {
            state[address] = value;
        }

        return state;
    }


    simulateInstructions(instructions, state) {
        for (let i = 0; i < instructions.length; i++) {
            const instruction = instructions[i];
            const parsed = this.parseInstruction(instruction);
            if (!parsed) return false; // Return false if can't parse

            const { op, args } = parsed;
            const [src, dest] = args;

            console.log(parsed, args);

            let srcValue = this.getSimValue(src, state);
            let destValue;
            try {
                destValue = this.getSimValue(dest, state);
            } catch(error) {
                continue;
            }

            switch (op) {
                case 'mov':
                case 'movl':
                case 'mvn':
                    state[dest] = srcValue;
                    break;
                case 'add':
                    state[dest] = destValue + srcValue;
                    break;
                case 'sub':
                    if (destValue - srcValue < 0) return false;
                    state[dest] = destValue - srcValue;
                    break;
            }
        }
        return true; // Return true if all instructions are successfully simulated
    }


    getSimValue(operand, state) {
        if (operand.startsWith('%')) return state[operand.slice(1)];
        if (operand.startsWith('$')) return parseInt(operand.slice(1), 10);
        return state[this.getMemoryAddress(operand, Object.entries(state).map(([register, value]) => ({register, value})), state)];
    }

    parseInstruction(instruction) {
        const regex = /(\w+)\s+(.+)/;
        const match = instruction.match(regex);
        if (!match) return null;

        const [, op, argsString] = match;
        const argRegex = /(?:\$|#)?-?(?:0x[\da-fA-F]+|\d+)(?:\([^)]+\))?|\([^)]+\)|%?\w+/g;
        const parsedArgs = (argsString.match(argRegex) || []).map(arg => /^[a-z]{3}$/.test(arg.trim()) ? `%${arg.trim()}` : /^\d+$/.test(arg.trim()) ? `$${arg.trim()}` : arg.trim());

        return { op, args: parsedArgs };
    }

    executeInstructions(input) {

        console.log("bp1")
        const [instructions, initialMemory, initialRegisters] = input;
        const memory = JSON.parse(JSON.stringify(initialMemory));
        const registers = JSON.parse(JSON.stringify(initialRegisters));
        return instructions.map((instruction, step) => {
            const parsed = this.parseInstruction(instruction);
            if (parsed) this.executeInstruction(parsed.op, parsed.args, registers, memory);
            return { instruction, step: step + 1, registers: JSON.parse(JSON.stringify(registers)), memory: JSON.parse(JSON.stringify(memory)) };
        });
    }

    executeInstruction(op, args, registers, memory) {

        if (op === 'push'){

            const [src] = args;
            const result = this.getValue(src, registers, memory);
            this.pushToStack(result, registers, memory);


        } else if ( op === 'pop'){

            const [dest] = args;
            this.popFromStack(dest, registers, memory);

        } else { 

            const [src, dest] = args;
            const srcValue = this.getValue(src, registers, memory);
            const destValue = this.getValue(dest, registers, memory);
            const result = op === 'mov' || op === 'movl' || op === 'mvn' ? srcValue : this.calculate(op, destValue, srcValue);
            this.setValue(dest, result, registers, memory);
        }
    }

    pushToStack(value, registers, memory) {

        const baseReg = this.architecture == "X86_32" ? 'esp' : 'rsp';
        const rspAddress = this.getMemoryAddress(`(%${baseReg})`, registers, memory);

        const increment = this.architecture == "X86_32" ? 4 : 8;

        const rspMemory = memory.find(m => m.address === rspAddress);
        memory.find(m => m.location == (rspMemory.location - increment)).value = value;

        console.log(memory);
        console.log(rspMemory.location, rspMemory.location - increment);

        registers.find(r => r.register === 'rsp').value = memory.find(m => m.location === `${rspMemory.location - increment}`).address;

    }

    popFromStack(dest, registers, memory) {
        const baseReg = this.architecture == "X86_32" ? 'esp' : 'rsp';
        const rspAddress = this.getMemoryAddress(`(%${baseReg})`, registers, memory);

        const rspMemory = memory.find(m => m.address === rspAddress);
        this.setValue(dest, rspMemory.value, registers, memory);
        const increment = this.architecture == "X86_32" ? 4 : 8;

        console.log(memory);
        console.log(rspMemory.location, Number(rspMemory.location) + increment);

        registers.find(r => r.register === 'rsp').value = memory.find(m => m.location === `${Number(rspMemory.location) + increment}`).address;
    }

    getValue(operand, registers, memory) {
        if (operand.startsWith('%')) return registers.find(r => `%${r.register}` === operand).value;
        if (operand.startsWith('$')) return parseInt(operand.slice(1), 10);
        const mem = memory.find(m => m.address === this.getMemoryAddress(operand, registers, memory));
        return mem && /^[0-9]+$/.test(mem.value) ? mem.value : 0;
    }

    setValue(operand, value, registers, memory) {
        if (operand.startsWith('%')) {
            registers.find(r => `%${r.register}` === operand).value = value;
        } else {
            memory.find(m => m.address === this.getMemoryAddress(operand, registers, memory)).value = value;
        }
    }

    getMemoryAddress(operand, registers, memory) {
        const regex = /(?:(-?0x[0-9a-fA-F]+|-?\d+))?\(%([^)]+)\)/;
        const match = operand.match(regex);
        if (match) {
            let [, offset, reg] = match;
            const baseRegister = registers.find(r => r.register === reg);
            if (!baseRegister) return operand;

            let address = parseInt(baseRegister.value, 16);
            if (offset) address += parseInt(offset, offset.startsWith('0x') || offset.startsWith('-0x') ? 16 : 10);

            return `0x${address.toString(16).toUpperCase().padStart(3, '0')}`;
        }
        return operand;
    }

    calculate(op, destValue, srcValue) {
        const numDestValue = Number(destValue);
        const numSrcValue = Number(srcValue);
        return op === 'add' ? numDestValue + numSrcValue : numDestValue - numSrcValue;
    }
}

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
        const reg = this._getTrueReg(is32);
        return unifPickItem(`[${reg}]`, `[${reg}, ${unifPickItem(this._getTrueOffset(), reg)}]`);
    }

    _getTrueLit(is32) {
        return `#${Math.floor(randomFloat32() * 63)}`;
    }
}

class X86_BASE extends ArchInstructions {
    _getTrueReg(is32) {
        return `%${unifPickItem(is32 ? this.registers_32 : this.registers_64)}`;
    }

    _getTrueMem(is32) {
        const reg = this._getTrueReg(is32);
        return unifPickItem(`(${reg})`, `${this._getTrueOffset(is32)}${reg}`);
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

    _is_32() { return weightedPickId(BIT_ODDS_X86_64) == 0; }
}