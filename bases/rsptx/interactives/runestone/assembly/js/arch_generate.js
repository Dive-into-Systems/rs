// arch_generate.js
// This file contains the JS for the Runestone Assembly Components. Created by Arys Aikyn, Tony Cao, Kuzivakwashe Mavera 06/03/2024
"use strict";

import { off } from 'codemirror';
import arch_data from './arch_data.json';

const { MAX_NUM, BIT_ODDS_X86_64, MSG_OK, MSG_BAD_DEST, MSG_BAD_SRC, MSG_CT } = arch_data;

// Generates a random 32-bit floating point number between 0 and 1
function randomFloat32() {
    return window.crypto.getRandomValues(new Uint32Array(1))[0] / (2 ** 32);
}

// Selects an index from an array of odds (weights) using weighted random selection
function weightedPickId(odds) {
    const total = odds.reduce((sum, a) => sum + a, 0);
    let seed = randomFloat32() * total;
    return odds.findIndex((odds, i) => (seed -= odds) < 0);
}

// Selects a random index from an array using uniform distribution
function unifPickId(arr) {
    return Math.floor(randomFloat32() * arr.length);
}

// Selects a random item from one or more arrays using uniform distribution
function unifPickItem(...items) {
    const combinedArray = items.flat();
    if (!combinedArray.length) throw new Error("No arrays provided or all are empty.");
    return combinedArray[unifPickId(combinedArray)];
}

// Represents a family of instructions with associated weights and error types
class InstructionsFamily {
    constructor(mainWeight, insArr, oddsArr, errorArr) {
        Object.assign(this, { mainWeight, instructions: insArr, errorsOdds: oddsArr, errors: errorArr });
    }
}

// Represents the architecture-specific instruction set and generation logic
class ArchInstructions {
    constructor(config) {
        if (!config) throw new Error("Config data required");

        ['memOps', 'arithUnary', 'arithBinary', 'bitLogic', 'bitShift'].forEach(key => {
            if (!config[key]) throw new Error(`Missing configuration for ${key}`);
            this[key] = new InstructionsFamily(config[key].mainWeight, config[key].instructions, config[key].errorsOdds, config[key].errors);
        });
        this.families = [this.memOps, this.arithUnary, this.arithBinary, this.bitLogic, this.bitShift]
        // lzf change
        if (config.name == "X86_64") {
            ['archOpsPush', 'archOpsPop', 'memOpsDisamb', 'arithBinaryDisamb', 'bitLogicDisamb', 'bitShiftDisamb'].forEach(key => {
                if (!config[key]) throw new Error(`Missing configuration for ${key}`);
                this[key] = new InstructionsFamily(config[key].mainWeight, config[key].instructions, config[key].errorsOdds, config[key].errors);
            });
            this.families.push(this.archOpsPush,this.archOpsPop,this.memOpsDisamb, this.arithBinaryDisamb, this.bitLogicDisamb, this.bitShiftDisamb)
        } else if (config.name == "X86_32") {
            ['archOpsPush', 'archOpsPop'].forEach(key => {
                if (!config[key]) throw new Error(`Missing configuration for ${key}`);
                this[key] = new InstructionsFamily(config[key].mainWeight, config[key].instructions, config[key].errorsOdds, config[key].errors);
            });
            this.families.push(this.archOpsPush,this.archOpsPop)
        } else if (config.name == "ARM64") {
            ['archOps'].forEach(key => {
                if (!config[key]) throw new Error(`Missing configuration for ${key}`);
                this[key] = new InstructionsFamily(config[key].mainWeight, config[key].instructions, config[key].errorsOdds, config[key].errors);
            });
            this.families.push(this.archOps)
        }

        Object.assign(this, {
            architecture: config.name,
            offsets: config.offsets,
            registers_32: config.registers_32,
            registers_64: config.registers_64
        });
    }

    /*
    =====================================================================================
    VALID INSTRUCTION COMPONENT
    This section of the arch_generate.js file is dedicated to defining and managing the
    valid instruction set for the assembly language components. It includes functionalities
    for generating valid assembly instructions, handling instruction weights, and managing
    error conditions associated with instruction generation.

    Key Features:
    - Generation of valid assembly instructions based on predefined weights and probabilities.
    - Handling of different error conditions that can arise during the instruction generation process.
    - Utilization of weighted and uniform selection mechanisms to simulate realistic instruction usage.

    The Valid Instruction Component is crucial for creating a diverse and realistic set of
    assembly instructions for educational simulations and exercises within the Runestone
    interactive learning environment.

    =====================================================================================
    */

    // Generates a question based on the specified instruction types
    generate_question(mem_arch, arith, bit) {
        let fam_weights_temp = [
            mem_arch ? this.memOps.mainWeight : 0,
            arith ? this.arithUnary.mainWeight : 0,
            arith ? this.arithBinary.mainWeight : 0,
            bit ? this.bitLogic.mainWeight : 0,
            bit ? this.bitShift.mainWeight : 0,
        ];
        if (this.architecture == "X86_64") {
            fam_weights_temp.push(
                mem_arch ? this.archOpsPush.mainWeight : 0,
                mem_arch ? this.archOpsPop.mainWeight : 0,
                mem_arch ? this.memOpsDisamb.mainWeight : 0,
                arith ? this.arithBinaryDisamb.mainWeight : 0,
                bit ? this.bitLogicDisamb.mainWeight : 0,
                bit ? this.bitShiftDisamb.mainWeight : 0,
            );
        } else if (this.architecture == "X86_32") {
            fam_weights_temp.push(
                mem_arch ? this.archOpsPush.mainWeight : 0,
                mem_arch ? this.archOpsPop.mainWeight : 0,
            );
        } else if (this.architecture == "ARM64") {
            fam_weights_temp.push(
                mem_arch ? this.archOps.mainWeight : 0,
            );
        }
        const fam_weights = fam_weights_temp;
        return this._makePrompt(weightedPickId(fam_weights));
    }

    // Creates a prompt for an instruction with potential errors
    _makePrompt(index) {
        const family = this.families[index];
        const op = unifPickItem(family.instructions);
        const q_type = weightedPickId(family.errorsOdds);
        const expr = [family.errors.ok, family.errors.bad_dest, family.errors.bad_src, family.errors.bad_ct][q_type];
        let feedback_temp;
        if (this.architecture === "ARM64" && op === "str" && q_type == 1) { // lzf change
            feedback_temp = MSG_BAD_SRC;
        } else if (this.architecture === "ARM64" && op === "str" && q_type == 2) {
            feedback_temp = MSG_BAD_DEST;
        } else if (this.architecture === "X86_64" && op === "push" && q_type == 1) {
            feedback_temp = MSG_BAD_SRC;
        } else if (this.architecture === "X86_64" && op === "pop" && q_type == 2) {
            feedback_temp = MSG_BAD_DEST;
        } else if (this.architecture === "X86_64" && index === "2" && q_type == 2) {
            feedback_temp = MSG_BAD_DEST;
        }  else if (this.architecture === "X86_32" && op === "push" && q_type == 1) {
            feedback_temp = MSG_BAD_SRC;
        } else if (this.architecture === "X86_32" && op === "pop" && q_type == 2) {
            feedback_temp = MSG_BAD_DEST;
        } else if (this.architecture === "X86_32" && index === "2" && q_type == 2) {
            feedback_temp = MSG_BAD_DEST;
        } 
        else {
            feedback_temp = [MSG_OK, MSG_BAD_DEST, MSG_BAD_SRC, MSG_CT][q_type];
        }
        const feedback = feedback_temp;
        const prompt = `${op} ${this._evalPrompt(expr, this._is_32())}`;
        return [prompt, q_type, feedback];
    }

    // Gets a random offset value based on the architecture
    _getTrueOffset(is32) {
        return unifPickItem(this.offsets);
    }

    // Resolves a character to a register, memory address, or literal value
    _solveChar(char, is32) {
        const reg = this._getTrueReg(is32);
        const mem = this._getTrueMem(is32);
        const lit = this._getTrueLit(is32);
        return {
            r: reg,
            m: mem,
            l: lit,
            a: unifPickItem(reg, mem, lit)
        }[char] || (() => {
            throw new Error(`Unexpected char: ${char}`)
        })();
    }

    // Recursively solves nested expressions in the instruction prompt
    _solveNest(expression, is32) {
        while (expression.includes('(')) {
            expression = expression.replace(/\(([^()]+)\)/g, (_, subExpression) => this._solveNest(subExpression, is32));
        }
        return expression;
    }

    // Evaluates and constructs the final instruction prompt
    _evalPrompt(expression, is32) {
        let cloneExpr = this._solveNest(expression.replace(/\s+/g, ''), is32);
        return cloneExpr.includes('-') ?
            cloneExpr.split('-').map(expr => this._evalPrompt(expr, is32)).join(", ") :
            cloneExpr.includes('/') ?
                this._evalPrompt(unifPickItem(cloneExpr.split('/')), is32) :
                cloneExpr.split('').map(char => this._solveChar(char, is32)).join(", ");
    }


    /*
    =====================================================================================
    ASSEMBLY STATE COMPONENT
    This part of the arch_generate.js file focuses on the representation and manipulation
    of the assembly state, including registers and memory. It provides the infrastructure
    for simulating the execution of assembly instructions and tracking changes in the
    assembly state.

    Key Features:
    - Representation of the assembly state, including registers and memory.
    - Functions for modifying the assembly state in response to instruction execution.
    - Mechanisms for tracking and displaying changes in the state for educational purposes.

    The Assembly State Component plays a fundamental role in simulating the execution of
    assembly instructions and providing a dynamic learning experience by allowing users
    to see the immediate effects of instructions on the assembly state.

    =====================================================================================
    */

    // Generate states for the assembly simulation
    generateStates(num_instructions, num_registers, num_addresses, selection) {
        const selected_addresses = this.generateAddresses(num_addresses);
        const { selected_regular_registers, selected_stack_registers } = this.generateRegisters(num_registers, selected_addresses);
        const selected_instructions = this.generateInstructions(num_instructions, selected_regular_registers, selected_stack_registers, selected_addresses, selection);
        // for initial states
        this.states.unshift([selected_instructions, [...selected_regular_registers, ...selected_stack_registers], selected_addresses.reverse()]);
        return this.states;
    }

    // Generates a list of memory addresses for the simulation
    generateAddresses(num_addresses) {
        let addresses;
        do {
            const increment = this.architecture == "X86_32" ? 4 : 8;
            const minAddress = 0x000;
            const maxAddress = 0xFFF;
            const baseAddress = Math.floor(Math.random() * ((maxAddress - minAddress) / increment + 1)) * increment + minAddress;
            addresses = Array.from({ length: num_addresses }, (_, i) => {
                const address = baseAddress - (i * increment);
                return {
                    address: `0x${address.toString(16).padStart(3, '0').toUpperCase()}`,
                    location: i ? `-${i * increment}` : "",
                    value: (Math.floor(Math.random() * 11) + 5).toString()
                };
            });
        } while (addresses.some(addr => parseInt(addr.address, 16) <= 0x000));

        return addresses;
    }

    // Selects registers for the simulation state
    generateRegisters(num_registers, selected_addresses) {
        const registers_regular = arch_data[this.architecture]['registers_regular'];
        const registers_stack = arch_data[this.architecture]['registers_stack'];
        const selected_regular_registers = Array.from({ length: num_registers - registers_stack.length }, (_, i) => ({
            register: registers_regular[i],
            value: (Math.floor(Math.random() * 11) + 5).toString(),
            type: "regular"
        }));

        let selected_stack_registers;

        selected_stack_registers = [
            { register: registers_stack[1], value: selected_addresses[selected_addresses.length - 4].address, type: "memory" },
            { register: registers_stack[0], value: selected_addresses[0].address, type: "memory" }
        ];

        return { selected_regular_registers, selected_stack_registers };
    }

    // Generates random order for selected instructions
    generateRandomInstructionOrder(instructions_to_be_shuffled) {

        let shuffledArray = instructions_to_be_shuffled.slice();
        for (let i = shuffledArray.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
        }
        return shuffledArray;
    }


    // Generates a list of instructions for the simulation
    generateInstructions(num_instructions, selected_regular_registers, selected_stack_registers, selected_addresses, selection) {
        const offsets = arch_data[this.architecture]['offsets'];

        // Ensure at least one instruction from each selected category
        let selected_instructions = [];
        let instruction_sources = [];

        if (selection[0]) { // Arithmetic
            const arithmeticInstruction = this.generateComplexInstruction(selected_regular_registers, selected_stack_registers, selected_addresses, offsets, selection, selected_instructions.length + 1, 'arithBinary');
            selected_instructions.push(arithmeticInstruction);
            instruction_sources.push('arithBinary');
        }

        if (selection[1]) { // Memory
            const memoryInstruction = this.generateComplexInstruction(selected_regular_registers, selected_stack_registers, selected_addresses, offsets, selection, selected_instructions.length + 1, 'memOps');
            selected_instructions.push(memoryInstruction);
            instruction_sources.push('memOps');
        }

        if (selection[2]) { // Stack
            let stackInstruction;
            if (this.architecture == "ARM64") {
                stackInstruction = this.generateComplexInstruction(selected_regular_registers, selected_stack_registers, selected_addresses, offsets, selection, selected_instructions.length + 1, 'archOps');
                selected_instructions.push(stackInstruction);
            } else if (this.architecture == "X86_64" || this.architecture == "X86_32") {
                stackInstruction = this.generateComplexInstruction(selected_regular_registers, selected_stack_registers, selected_addresses, offsets, selection, selected_instructions.length + 1, 'archOpsPush');
                selected_instructions.push(stackInstruction);
                stackInstruction = this.generateComplexInstruction(selected_regular_registers, selected_stack_registers, selected_addresses, offsets, selection, selected_instructions.length + 1, 'archOpsPop');
                selected_instructions.push(stackInstruction);
            }
            
            instruction_sources.push('archOps');
        }

        for (let i = 0; i < 1000; i++) {

            // Fill the remaining instructions randomly from the selected categories
            while (selected_instructions.length < num_instructions) {
                const instruction = this.generateComplexInstruction(selected_regular_registers, selected_stack_registers, selected_addresses, offsets, selection, selected_instructions.length + 1);
                selected_instructions.push(instruction);
            }

            selected_instructions = this.generateRandomInstructionOrder(selected_instructions);

            // Create a deep copy of the initial state
            const initialState = {
                instructions: [...selected_instructions],
                registers: JSON.parse(JSON.stringify([...selected_regular_registers, ...selected_stack_registers])),
                memory: JSON.parse(JSON.stringify(selected_addresses))
            };

            // Execute instructions and check for negative values
            this.executeInstructions([initialState.instructions, initialState.registers, initialState.memory]);

            // If no negative values were found, return the selected instructions
            if (!this.states.some(state => this.hasNegativeNumbers(state))) {
                return selected_instructions;
            }

            // Reset states for the next attempt
            this.states = [];
            selected_instructions = [];
        }

        // If we couldn't generate a valid set of instructions after 100 attempts
        console.warn("Could not generate instructions without negative values after 1000 attempts");
        return selected_instructions;
    }

    // Checks if the state contains any negative numbers
    hasNegativeNumbers(state) {
        return state.registers.some(r => parseInt(r.value) < 0) ||
            state.memory.some(m => parseInt(m.value) < 0);
    }

    // Generates a complex instruction format based on the given parameters
    generateComplexInstructionFormat(selection, instruction_num) {
        const archData = arch_data[this.architecture];
        let availableFormats = {}

        // Add formats based on the selected instruction types

        if (selection[0]) availableFormats["arithBinary"] = archData["arithBinary"].formats;
        if (selection[1]) availableFormats["memOps"] = archData["memOps"].formats;
        if (selection[2]) {
            switch (this.architecture) {
                case 'X86_32':
                case 'X86_64':
                    availableFormats["archOpsPush"] = archData["archOpsPush"].formats;
                    availableFormats["archOpsPop"] = archData["archOpsPop"].formats;
                    break;
                case 'ARM64':
                    availableFormats["archOps"] = archData["archOps"].formats;
                    break;
            }
        }

        if (selection[0] && selection[1] && this.architecture !== "ARM64") {
            availableFormats["arithBinary"].push(...[
                "{op} %{reg1}, {memAddr}",
                "{op} %{reg2}, {memAddr}",
                "{op} ${literal}, {memAddr}",
                "{op} {memAddr}, %{reg1}",
                "{op} {memAddr}, %{reg2}"
            ]);
        } else if (selection[0]) {
            availableFormats["arithBinary"] = availableFormats["arithBinary"].filter(format => !format.includes("memAddr"));
        }

        // Select a random type from the available format types
        const formatType = unifPickItem(Object.keys(availableFormats));

        // Select a random format from the chosen type
        const format = unifPickItem(availableFormats[formatType]);

        return [formatType, format];
    }

    // New method to generate instruction format for a specific type
    generateComplexInstructionFormatSpecific(selection, instruction_num, formatType) {
        const archData = arch_data[this.architecture];
        let availableFormats = {}

        if (selection[0] && formatType === "arithBinary") availableFormats["arithBinary"] = archData["arithBinary"].formats;
        if (selection[1] && formatType === "memOps") availableFormats["memOps"] = archData["memOps"].formats;
        if (selection[2] && formatType.substr(0,7) === "archOps") { // lzf change
            availableFormats[formatType] = archData[formatType].formats;            
        }

        if (formatType == "arithBinary" && selection[0] && selection[1] && this.architecture !== "ARM64") {
            availableFormats["arithBinary"].push(...[
                "{op} %{reg1}, {memAddr}",
                "{op} %{reg2}, {memAddr}",
                "{op} ${literal}, {memAddr}",
                "{op} {memAddr}, %{reg1}",
                "{op} {memAddr}, %{reg2}"
            ]);
        } else if (formatType == "arithBinary") {
            availableFormats["arithBinary"] = availableFormats["arithBinary"].filter(format => !format.includes("memAddr"));
        }

        const format = unifPickItem(availableFormats[formatType]);

        return format;
    }

    // Generates a complex instruction based on the given parameters
    generateComplexInstruction(regular_registers, stack_registers, memory, offsets, selection, instruction_num, specificType = null) {
        let formatType, format;

        if (specificType) {
            formatType = specificType;
            format = this.generateComplexInstructionFormatSpecific(selection, instruction_num, formatType);
        } else {
            [formatType, format] = this.generateComplexInstructionFormat(selection, instruction_num);
        }

        console.log("formatType", format);
        let op = unifPickItem(arch_data[this.architecture][formatType].instructions);

        // randomly select registers
        let reg1 = this.architecture === 'ARM64' ? unifPickItem(regular_registers).register : `${unifPickItem(regular_registers).register}`;
        let reg2 = this.architecture === 'ARM64' ? unifPickItem(regular_registers).register : `${unifPickItem(regular_registers).register}`;
        let reg3 = this.architecture === 'ARM64' ? unifPickItem(regular_registers).register : '';

        // ensure same registers are not selected, but possible
        const sameRegistersChance = Math.random();
        if (sameRegistersChance < 0.05) {
            reg2 = reg1;
        } else {
            while (reg1 === reg2) {
            reg2 = this.architecture === 'ARM64' ? unifPickItem(regular_registers).register : `${unifPickItem(regular_registers).register}`;
            }
        }

        // randomly select offset
        let offset = unifPickItem(offsets);
        if (format.includes('offset')) {
            const maxOffset = format.includes('memAddr')
                ? Math.max(...memory.map(item => parseInt(item.address, 16))) - parseInt(memItem.address, 16)
                : Math.max(...regular_registers.map(item => parseInt(item.value, 16))) - parseInt(memItem.address, 16);
            offset = Math.min(offset, maxOffset).toString(16);
        }
        // randomly select memory address
        let memItem = unifPickItem(memory);
        while (stack_registers.some(r => r.value == memItem.address)) {
            memItem = unifPickItem(memory);
        }

        const memAddr = this.architecture === "ARM64" ? `${stack_registers[0].register}, #${offset}` : `${"-" + offset}(%${stack_registers[1].register})`;
        // randomly select literal
        let literal = Math.floor(Math.random() * 8) + 1;

        return format.replace(/\+0\b/g, '')
            .replace(/{op}/g, op)
            .replace(/{memAddr}/g, memAddr)
            .replace(/{offset}/g, offset)
            .replace(/{reg1}/g, reg1)
            .replace(/{reg3}/g, reg3)
            .replace(/{reg2}/g, reg2)
            .replace(/{literal}/g, literal);
    }

    // Executes a list of instructions and returns the state after each step
    executeInstructions(input) {
        const [instructions, initialRegisters, initialMemory] = input;
        const registers = JSON.parse(JSON.stringify(initialRegisters));
        const memory = JSON.parse(JSON.stringify(initialMemory));
        this.states = instructions.map((instruction, step) => {
            const parsed = this.architecture === "ARM64" ? this.parseARM64Instruction(instruction) : this.parseX86Instruction(instruction);
            if (parsed) this.executeInstruction(parsed.op, parsed.args, registers, memory);
            return { instruction, step: step + 1, registers: JSON.parse(JSON.stringify(registers)), memory: JSON.parse(JSON.stringify(memory)).reverse() };
        });
    }

    // Executes a single instruction and updates the state
    executeInstruction(op, args, registers, memory) {
        switch (this.architecture) {
            case 'X86_32':
                //Jay/Bohou added
                this.executeX86_32Instruction(op, args, registers, memory);
                break;
            case 'X86_64':
                this.executeX86Instruction(op, args, registers, memory);
                break;
            case 'ARM64':
                this.executeARMInstruction(op, args, registers, memory);
                break;
        }
    }

    // Executes an x86 instruction and updates the state
    executeX86Instruction(op, args, registers, memory) {
        let destination = args[1], source = args[0]
        switch (op) {
            case 'mov':
                this.executeMemoryOperation(op, destination, source, registers, memory);
                break;
            case 'add':
            case 'sub':
                this.executeArithmeticOperation(op, destination, destination, source, registers, memory);
                break;
            case 'push':
            case 'pop':
                this.executeStackOperation(op, source, source, registers, memory);
                break;
        }
    }

        // Executes an x86 instruction and updates the state
    executeX86_32Instruction(op, args, registers, memory) {
            let destination = args[1], source = args[0]
            switch (op) {
                case 'movl':
                    this.executeMemoryOperation(op, destination, source, registers, memory);
                    break;
                case 'addl':
                case 'subl':
                    this.executeX86_32ArithmeticOperation(op, destination, destination, source, registers, memory);
                    break;
                case 'pushl':
                case 'popl':
                    this.executeStackOperation(op, source, source, registers, memory);
                    break;
            }
        }

    // Executes an ARM instruction and updates the state
    executeARMInstruction(op, args, registers, memory) {
        let destination = args[0], source1 = args[1], source2 = args[2];
        switch (op) {
            case 'mov':
                this.executeMemoryOperation(op, destination, source1, registers, memory);
                break;
            case 'add':
            case 'sub':
                this.executeArithmeticOperation(op, destination, source1, source2, registers, memory);
                break;
            case 'ldr':
            case 'str':
                this.executeStackOperation(op, destination, source1, registers, memory);
                break;
        }
    }

    // Executes Arithmetic operations
    executeArithmeticOperation(op, dest, src1, src2, registers, memory) {
        const destValue = Number(this.getValue(dest, registers, memory));
        const srcValue1 = Number(this.getValue(src1, registers, memory));
        const srcValue2 = Number(this.getValue(src2, registers, memory));
        let result;
        if (this.architecture === "ARM64") {
            switch (op) {
                case 'add':
                    result = srcValue1 + srcValue2;
                    break;
                case 'sub':
                    result = srcValue1 - srcValue2;
                    break;
            }
        } else {
            switch (op) {
                case 'add':
                    result = destValue + srcValue2;
                    break;
                case 'sub':
                    result = destValue - srcValue2;
                    break;
            }
        }
        this.setValue(dest, result, registers, memory);
    }

    executeX86_32ArithmeticOperation(op, dest, src1, src2, registers, memory) {
        const destValue = Number(this.getValue(dest, registers, memory));
        const srcValue1 = Number(this.getValue(src1, registers, memory));
        const srcValue2 = Number(this.getValue(src2, registers, memory));
        let result;
        if (this.architecture === "ARM64") {
            switch (op) {
                case 'addl':
                    result = srcValue1 + srcValue2;
                    break;
                case 'subl':
                    result = srcValue1 - srcValue2;
                    break;
            }
        } else {
            switch (op) {
                case 'addl':
                    result = destValue + srcValue2;
                    break;
                case 'subl':
                    result = destValue - srcValue2;
                    break;
            }
        }
        this.setValue(dest, result, registers, memory);
    }

    // Executes memory operations
    executeMemoryOperation(op, dest, src, registers, memory) {
        const value = this.getValue(src, registers, memory);
        this.setValue(dest, value, registers, memory);
    }

    // Executes the push or pop instruction
    executeStackOperation(op, dest, src, registers, memoryArray) {
        let value;

        if (this.architecture === "ARM64") {
            let address = this.getMemoryAddress(src, registers, memoryArray)
            const memoryLocation = memoryArray.find(m => m.address === address);
            if (!memoryLocation) {
                throw new Error(`Memory location not found at address: ${address}`);
            }

            if (op === "ldr") {
                this.setValue(dest, memoryLocation.value, registers, memoryArray);
            } else if (op === "str") {
                value = this.getValue(dest, registers, memoryArray);
                memoryLocation.value = String(value);
            }
        } else {
            const baseReg = this.architecture === "X86_32" ? 'esp' : 'rsp';
            const increment = this.architecture === "X86_32" ? 4 : 8;
            const address = registers.find(r => r.register === baseReg).value;
            const memoryLocation = memoryArray.find(m => m.address === address);

            if (!memoryLocation) {
                throw new Error(`Memory location not found at address: ${address}`);
            }

            if (op === 'push') {
                value = this.getValue(src, registers, memoryArray);
                const newAddress = `0x${(parseInt(address, 16) - increment).toString(16).toUpperCase().padStart(3, '0')}`;
                const newMemoryLocation = memoryArray.find(m => m.address === newAddress);
                if (!newMemoryLocation) {
                    throw new Error(`Memory location not found at address: ${newAddress}`);
                }
                newMemoryLocation.value = String(value);
                this.updateStackPointer(registers, newAddress);
            } else if (op === 'pop') {
                this.setValue(dest, memoryLocation.value, registers, memoryArray);
                const newAddress = `0x${(parseInt(address, 16) + increment).toString(16).toUpperCase().padStart(3, '0')}`;
                const newMemoryLocation = memoryArray.find(m => m.address === newAddress);
                if (!newMemoryLocation) {
                    throw new Error(`Memory location not found at address: ${newAddress}`);
                }
                this.updateStackPointer(registers, newAddress);
            }

            //Jay/Bohou added
            if (op === 'pushl') {
                value = this.getValue(src, registers, memoryArray);
                const newAddress = `0x${(parseInt(address, 16) - increment).toString(16).toUpperCase().padStart(3, '0')}`;
                const newMemoryLocation = memoryArray.find(m => m.address === newAddress);
                if (!newMemoryLocation) {
                    throw new Error(`Memory location not found at address: ${newAddress}`);
                }
                newMemoryLocation.value = String(value);
                this.updateStackPointer(registers, newAddress);
            } else if (op === 'popl') {
                this.setValue(dest, memoryLocation.value, registers, memoryArray);
                const newAddress = `0x${(parseInt(address, 16) + increment).toString(16).toUpperCase().padStart(3, '0')}`;
                const newMemoryLocation = memoryArray.find(m => m.address === newAddress);
                if (!newMemoryLocation) {
                    throw new Error(`Memory location not found at address: ${newAddress}`);
                }
                this.updateStackPointer(registers, newAddress);
            }
        }
    }

    // Updates the stack pointer register with the new address
    updateStackPointer(registers, newAddress) {
        const spRegister = registers.find(r => r.register.toLowerCase() === 'rsp' || r.register.toLowerCase() === 'esp' || r.register.toLowerCase() === 'sp');
        if (!spRegister) {
            throw new Error('Stack pointer register not found');
        }
        spRegister.value = newAddress;
    }

    // Acquire value from the given registers and memories
    getValue(operand, registers, memory) {
        if (operand == undefined) return null;

        // Handle register operands
        if (operand.startsWith('%') || /^[X]\d+$/.test(operand)) {
            const regName = operand.startsWith('%') ? operand.slice(1) : operand;
            const register = registers.find(r => r.register === regName);
            return register ? register.value : null;
        }

        // Handle immediate values
        if (operand.startsWith('$') || operand.startsWith('#')) {
            return parseInt(operand.slice(1)); // Parse as decimal
        }

        // Handle memory accesses
        if (operand.startsWith('[') && operand.endsWith(']') || operand.includes('(') && operand.includes(')')) {
            const mem = memory.find(m => m.address === this.getMemoryAddress(operand, registers, memory));
            return mem && /^[0-9]+$/.test(mem.value) ? mem.value : 0;
        }
    }

    // Set the value from the given registers and memories
    setValue(operand, value, registers, memory) {
        if (operand == undefined) return null;
        if (operand.startsWith('%')) return registers.find(r => `%${r.register}` === operand).value = value;
        if (operand.startsWith('X')) return registers.find(r => `${r.register}` === operand).value = value;
        else memory.find(m => m.address === this.getMemoryAddress(operand, registers, memory)).value = value;
    }

    // Acquire the proper memory address with the given operand such as -8(%rax) or [x1, #-0x16]
    getMemoryAddress(operand, registers, memory) {
        const x86Regex = /(?:(-?0x[0-9a-fA-F]+|-?\d+))?\(%([^)]+)\)/;
        const arm64Regex = /\[([\w]+)(?:,\s*#(-?0x[0-9a-fA-F]+|-?\d+))?\]/;

        const x86Match = operand.match(x86Regex);
        const arm64Match = operand.match(arm64Regex);

        if (x86Match) {
            let [, offset, reg] = x86Match;
            const baseRegister = registers.find(r => r.register === reg);
            if (!baseRegister) return operand;
            let address = parseInt(baseRegister.value, 16);
            if (offset) address += parseInt(offset, 16);
            return `0x${address.toString(16).toUpperCase().padStart(3, '0')}`;
        } else if (arm64Match) {
            let [, reg, offset] = arm64Match;
            const baseRegister = registers.find(r => r.register === reg);
            if (!baseRegister) return operand;
            let address = parseInt(baseRegister.value, 16);
            if (offset) address += parseInt(offset, 16);
            return `0x${address.toString(16).toUpperCase().padStart(3, '0')}`;
        }

        return operand;
    }

    // Parses an instruction string into its components
    parseX86Instruction(instruction) {
        const regex = /(\w+)\s+(.+)/;
        const match = instruction.match(regex);
        if (!match) return null;
        const [, op, argsString] = match;
        const argRegex = /(?:\$|#)?-?(?:0x[\da-fA-F]+|\d+)(?:\([^)]+\))?|\([^)]+\)|%?\w+/g;
        const parsedArgs = (argsString.match(argRegex) || []).map(arg => /^[a-z]{3}$/.test(arg.trim()) ? `%${arg.trim()}` : /^\d+$/.test(arg.trim()) ? `$${arg.trim()}` : arg.trim());
        return { op, args: parsedArgs };
    }

    // Parses an ARM64 instruction string into its components
    parseARM64Instruction(instruction) {
        const regex = /(\w+)\s+(.+)/;
        const match = instruction.match(regex);
        if (!match) return null;
        const [, op, argsString] = match;

        // Updated regex to handle memory operands as a single element
        const argRegex = /(?:\[[\w\s,\+\-#0x]+\]!?)|(?:#-?(?:0x[\da-fA-F]+|\d+))|(?:\{[\w\s,]+\})|(?:[xwvqszb]\d{1,2})|(?:\w+)/g;

        const parsedArgs = (argsString.match(argRegex) || []).map(arg => {
            if (arg.startsWith('#')) return arg;
            if (/^[xwvqszb]\d{1,2}$/.test(arg)) return arg;
            if (arg.startsWith('[') && arg.endsWith(']')) return arg;
            if (arg.startsWith('{') && arg.endsWith('}')) return arg;
            return arg.trim();
        });

        return { op, args: parsedArgs };
    }

    /*
    =====================================================================================
    FLAG SETTING AND INSTRUCTION ANALYSIS COMPONENT
    This section of the arch_generate.js file is dedicated to the generation and analysis
    of assembly instructions with a focus on flag setting, particularly for the 'cmp' and
    'test' instructions. It aims to educate users on how different instructions affect the
    processor's flags within x86 and ARM architectures.

    Key Features:
    - Generation of 'cmp' and 'test' instructions and analysis of their impact on processor flags.
    - Detailed comparison between x86 and ARM flag settings for equivalent operations, highlighting
    differences in CF (Carry Flag) for x86 and C (Carry) for ARM, along with OF (Signed Overflow Flag),
    ZF (Zero Flag), SF (Sign Flag) for x86, and Z (Zero), N (Negative), V (Signed Overflow) for ARM.
    - Utilization of an assembly visualizer tool to test expressions and observe RFLAG values in real-time,
    enhancing the learning experience by providing immediate visual feedback.

    This component is crucial for deepening the understanding of assembly language programming,
    particularly the nuanced behavior of flag settings across different architectures. It supports
    interactive learning by allowing users to experiment with assembly instructions and see the
    direct impact on processor flags.

    =====================================================================================
    */

    // Generates a random initial state for the assembly simulation
    generateRandomInitialFlag(num_instructions, num_registers) {
        const selected_registers = this.selectFlagRegisters(num_registers);
        const selected_instructions = this.generateFlagInstructions(num_instructions, selected_registers);
        return [selected_instructions, selected_registers];
    }

    // Generates a list of flag-setting instructions for the simulation
    selectFlagRegisters(num_registers) {
        const registers = arch_data[this.architecture]['registers_regular'].slice(0, 2);
        return Array.from({
            length: num_registers
        }, (_, i) => {
            let value;
            if (Math.random() < 0.3) { // 30% chance of zero or near-zero
                value = Math.random() < 0.5 ? 0 : (Math.random() < 0.5 ? 1 : -1);
            } else {
                // Generate a random number between -128 and 127 (signed 8-bit integer range)
                value = Math.floor(Math.random() * 256) - 128;
            }
            const hexValue = (value & 0xFF).toString(16).toUpperCase().padStart(2, '0');
            return {
                register: registers[i],
                value: value.toString(),
                hex: `0x${hexValue}`,
                binary: `0b${(value & 0xFF).toString(2).padStart(8, '0')}`
            };
        });
    }

    // Generates a list of flag-setting instructions for the simulation
    generateFlagInstructions(num_instructions, registers) {
        const instructions = [];
        const operations = arch_data[this.architecture]["comparison"].instructions;
        for (let i = 0; i < num_instructions; i++) {
            const op = unifPickItem(operations);
            let src, dest;
            src = this.getRandomOperand(registers);
            dest = this.getRandomOperand(registers);
            while (src === dest) {
                dest = this.getRandomOperand(registers);
            }
            instructions.push(`${op} ${dest}, ${src}`);
        }
        return instructions;
    }

    // Analyzes the flag settings for the given instructions
    getRandomOperand(registers) {
        const reg = unifPickItem(registers);
        return this.architecture === 'ARM64' ? `${reg.register}` : `%${reg.register}`;
    }

    // Analyzes the flag settings for the given instructions
    analyzeFlagSettings(instruction, registers) {
        let parsedInstruction_temp;
        parsedInstruction_temp = this.architecture === 'ARM64' ? this.parseARM64Instruction(instruction) : this.parseX86Instruction(instruction); // lzf change
        const parsedInstruction = parsedInstruction_temp
        if (!parsedInstruction) {
            console.error('Failed to parse instruction:', instruction);
            return;
        }

        const { op, args } = parsedInstruction;
        console.log("parsed ins");
        console.log(parsedInstruction);
        const [src, dest] = this.architecture === "ARM64" ? args.reverse() : args;

        const destVal = this.getFlagValue(dest, registers);
        const srcVal = this.getFlagValue(src, registers);
        const destVal_unsigned = destVal < 0 ? (1 << 8)*1 + destVal*1 : destVal
        const srcVal_unsigned = srcVal < 0 ? (1 << 8)*1 + srcVal*1 : srcVal
        console.log(destVal);
        console.log(destVal_unsigned);
        console.log(srcVal);
        console.log(srcVal_unsigned);

        let carryFlag = false, overflowFlag = false, zeroFlag = false, signFlag = false;

        const cmpResult = (destVal - srcVal);
        console.log(cmpResult)
        const testResult = (destVal & srcVal);

        if (op === 'cmp') {
            // Carry flag for unsigned comparison
            if (this.architecture == "ARM64") {
                carryFlag = destVal_unsigned >= srcVal_unsigned; // ARM no borrow results in carry
            } else {
                carryFlag = destVal_unsigned < srcVal_unsigned; // x86 borrow results in carry
            }
            
            // Overflow flag for signed comparison
            overflowFlag = ((destVal < 0 && srcVal > 0 && cmpResult >= 0) || // N-P
                (destVal > 0 && srcVal < 0 && cmpResult <= 0));

            // Zero flag for zero result
            zeroFlag = cmpResult === 0;

            // Sign flag for negative result
            signFlag = cmpResult < 0;

        } else if (op === 'test' || op === 'tst') {
            // Carry and overflow flags not affected by the test instruction
            carryFlag = false;
            overflowFlag = false;

            // Zero flag for zero result
            zeroFlag = testResult === 0;

            // Sign flag for negative result (most significant bit check)
            signFlag = testResult < 0; // This works since testResult will be signed
        }
        console.log({ carryFlag, overflowFlag, zeroFlag, signFlag })
        return { carryFlag, overflowFlag, zeroFlag, signFlag };
    }

    // Gets the flag value for the given operand
    getFlagValue(operand, registers) {
        console.log(registers)
        if (operand.startsWith('$') || operand.startsWith('#')) {
            return parseInt(operand.slice(1), 16);
        } else {
            const reg = this.architecture === "ARM64" ? registers.find(r => r.register === operand) : registers.find(r => `%${r.register}` === operand);
            return reg ? reg.value : 0;
        }
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
        return unifPickItem(`(${reg})`, `${this._getTrueOffset(is32)}(${reg})`);
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
