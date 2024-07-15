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
 const fam_weights = [
 mem_arch ? this.memOps.mainWeight : 0,
 mem_arch ? this.archOps.mainWeight : 0,
 arith ? this.arithUnary.mainWeight : 0,
 arith ? this.arithBinary.mainWeight : 0,
 bit ? this.bitLogic.mainWeight : 0,
 bit ? this.bitShift.mainWeight : 0,
 ];
 return this._makePrompt(weightedPickId(fam_weights));
 }

 // Creates a prompt for an instruction with potential errors
 _makePrompt(index) {
 const family = [this.memOps, this.archOps, this.arithUnary, this.arithBinary, this.bitLogic, this.bitShift][index];
 const op = unifPickItem(family.instructions);
 const q_type = weightedPickId(family.errorsOdds);
 const expr = [family.errors.ok, family.errors.bad_dest, family.errors.bad_src, family.errors.bad_ct][q_type];
 const feedback = [MSG_OK, MSG_BAD_DEST, MSG_BAD_SRC, MSG_CT][q_type];
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
 return { r: reg, m: mem, l: lit, a: unifPickItem(reg, mem, lit) }[char] || (() => { throw new Error(`Unexpected char: ${char}`) })();
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
 return cloneExpr.includes('-')
 ? cloneExpr.split('-').map(expr => this._evalPrompt(expr, is32)).join(", ")
 : cloneExpr.includes('/')
 ? this._evalPrompt(unifPickItem(cloneExpr.split('/')), is32)
 : cloneExpr.split('').map(char => this._solveChar(char, is32)).join(", ");
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

 // Generates a random initial state for the assembly simulation
 generateRandomInitialState(num_instructions, num_registers, num_addresses, selection) {
 const selected_addresses = this.generateAddresses(num_addresses);
 const { selected_regular_registers, selected_stack_registers } = this.selectRegisters(num_registers, selected_addresses);
 const selected_instructions = this.generateInstructions(num_instructions, selected_regular_registers, selected_stack_registers, selected_addresses, selection);
 return [selected_instructions, selected_addresses.reverse(), [...selected_regular_registers, ...selected_stack_registers]];
 }

 // Generates a complex instruction based on the given parameters
 generateComplexInstruction(regular_registers, stack_registers, memory, offsets, selection) {
 const formats = [
 '{op} {reg1}, {reg2}', '{op} {reg2}, {reg1}', '{op} {reg1}, {memAddr}', '{op} {reg2}, {memAddr}',
 '{op} {literal}, {reg1}', '{op} {literal}, {reg2}', '{op} {literal}, {memAddr}', '{op} {literal}, {memAddr}',
 '{op} {memAddr}, {reg2}', '{op} {memAddr}, {reg1}'
 ];

 const stackFormats = { "push": ['{op} {reg1}', '{op} {memAddr}', '{op} {literal}'],
 "pop": ['{op} {reg1}', '{op} {memAddr}']
 };

 const ARMformats = {
 "add" : ['{op} {reg1}, {reg2}, {reg1}', '{op} {reg3}, {reg2}, {reg1}', '{op} {reg1}, {reg1}, {literal}'],
 "sub" : ['{op} {reg1}, {reg2}, {reg1}', '{op} {reg3}, {reg2}, {reg1}', '{op} {reg1}, {reg1}, {literal}'],
 "ldr" : ['{op} {reg1}, [{reg2}, {literal}]'],
 "str" : ['{op} {reg1}, [{reg2}, {literal}]']
 };

 if (this.architecture === 'ARM64'){
 
 let operations = [];
 operations = [
 ...selection[0] ? arch_data[this.architecture]["arithBinary"].instructions : [],
 ...selection[1] ? arch_data[this.architecture]["archOps"].instructions : [],
 ];
 
 const op = unifPickItem(operations);

 let format = (op === 'add' || op === 'sub' || op === 'ldr' || op === 'str') ? unifPickItem(ARMformats[op]) : "";
 let reg1 = unifPickItem(regular_registers);
 let reg2 = unifPickItem(regular_registers);
 let reg3 = unifPickItem(regular_registers);
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

 reg1 = `${reg1.register}`;
 reg2 = `${reg2.register}`;
 reg3 = `${reg3.register}`;
 const memAddr = `${memItem.location}(%${stack_registers[1].register})`;
 const prefix = this.architecture === 'ARM64' ? '#' : '$';
 literal = `${prefix}${literal}`;

 console.log("format to be observed");
 console.log(format.replace(/\+0\b/g, '')
 .replace(/{op}/g, op)
 .replace(/{memAddr}/g, memAddr)
 .replace(/{offset}/g, offset)
 .replace(/{reg1}/g, reg1)
 .replace(/{reg2}/g, reg2)
 .replace(/{reg3}/g, reg3)
 .replace(/{literal}/g, literal));

 
 return format.replace(/\+0\b/g, '')
 .replace(/{op}/g, op)
 .replace(/{memAddr}/g, memAddr)
 .replace(/{offset}/g, offset)
 .replace(/{reg1}/g, reg1)
 .replace(/{reg3}/g, reg3)
 .replace(/{reg2}/g, reg2)
 .replace(/{literal}/g, literal);
 } else { 

 
 let arithmetic;
 let stack;
 let mem;
 let operations = [];
 let currentOpIndex = 0;

 if (selection[0] && selection[1] && selection[2]) {
 arithmetic = unifPickItem(arch_data[this.architecture]["arithBinary"].instructions);
 stack = unifPickItem(arch_data[this.architecture]["archOps"].instructions);
 mem = unifPickItem(arch_data[this.architecture]["memOps"].instructions);

 function shuffleThreeElements(array) {
 if (array.length !== 3) {
 throw new Error("The array must contain exactly 3 elements.");
 }
 
 for (let i = array.length - 1; i > 0; i--) {
 const j = Math.floor(Math.random() * (i + 1));
 [array[i], array[j]] = [array[j], array[i]];
 }
 return array;
 }
 operations = shuffleThreeElements([arithmetic, stack, mem])

 } else {
 
 operations = [
 ...selection[0] ? arch_data[this.architecture]["arithBinary"].instructions : [],
 ...selection[1] ? arch_data[this.architecture]["archOps"].instructions : [],
 ...selection[2] ? arch_data[this.architecture]["memOps"].instructions : []
 ];
 }
 
 const pickOperation = () => {
 if (selection[0] && selection[1] && selection[2]) {
 const op = operations[currentOpIndex];
 currentOpIndex = (currentOpIndex + 1) % 3; 
 return op;
 } else {
 return unifPickItem(operations);
 }
 };

 const op = pickOperation();
 let mySet = new Set();
 mySet.add(op);

 let format = (op === 'push' || op === 'pop') ? unifPickItem(stackFormats[op]) : unifPickItem(formats);
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
 }

 // Generates a list of memory addresses for the simulation
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

 // Selects registers for the simulation state
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
 
 // Generates a list of instructions for the simulation
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

 // Initializes the simulation state with register and memory values
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

 // Simulates the execution of instructions to ensure validity
 simulateInstructions(instructions, state) {
 for (let i = 0; i < instructions.length; i++) {
 const instruction = instructions[i];
 const parsed = this.parseInstruction(instruction);
 if (!parsed) return false; // Return false if can't parse

 const { op, args } = parsed;
 const [src, dest] = args;

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

 // Retrieves a value from the simulation state
 getSimValue(operand, state) {
 if (operand.startsWith('%')) return state[operand.slice(1)];
 if (operand.startsWith('$')) return parseInt(operand.slice(1), 10);
 return state[this.getMemoryAddress(operand, Object.entries(state).map(([register, value]) => ({register, value})), state)];
 }

 // Parses an instruction string into its components
 parseInstruction(instruction) {
 const regex = /(\w+)\s+(.+)/;
 const match = instruction.match(regex);
 if (!match) return null;

 const [, op, argsString] = match;
 const argRegex = /(?:\$|#)?-?(?:0x[\da-fA-F]+|\d+)(?:\([^)]+\))?|\([^)]+\)|%?\w+/g;
 const parsedArgs = (argsString.match(argRegex) || []).map(arg => /^[a-z]{3}$/.test(arg.trim()) ? `%${arg.trim()}` : /^\d+$/.test(arg.trim()) ? `$${arg.trim()}` : arg.trim());

 return { op, args: parsedArgs };
 }

 // Executes a list of instructions and returns the state after each step
 executeInstructions(input) {
 const [instructions, initialMemory, initialRegisters] = input;
 const memory = JSON.parse(JSON.stringify(initialMemory));
 const registers = JSON.parse(JSON.stringify(initialRegisters));
 return instructions.map((instruction, step) => {
 const parsed = this.parseInstruction(instruction);
 if (parsed) this.executeInstruction(parsed.op, parsed.args, registers, memory);
 return { instruction, step: step + 1, registers: JSON.parse(JSON.stringify(registers)), memory: JSON.parse(JSON.stringify(memory)) };
 });
 }

 // Executes a single instruction and updates the state
 executeInstruction(op, args, registers, memory) {

 if (op === 'push'){

 const [src] = args;
 const result = this.getValue(src, registers, memory);
 this.pushToStack(result, registers, memory);


 } else if ( op === 'pop'){

 const [dest] = args;
 this.popFromStack(dest, registers, memory);

 } else if (this.architecture != 'ARM64'){

 const [src, dest] = args;
 const srcValue = this.getValue(src, registers, memory);
 const destValue = this.getValue(dest, registers, memory);
 const result = op === 'mov' || op === 'movl' || op === 'mvn' ? srcValue : this.calculate(op, destValue, srcValue);
 this.setValue(dest, result, registers, memory);

 } else {

 const [dest, src1, src2] = args;
 console.log("args: " + args);
 const srcValue1 = this.getValue(src1, registers, memory);
 const srcValue2 = this.getValue(src2, registers, memory);
 const result = op === 'ldr' || op === 'str' ? srcValue1 : this.calculate(op, srcValue1, srcValue2); //placeholder for ldr and str
 this.setValue(dest, result, registers, memory);
 }
 }

 // Executes the push instruction
 pushToStack(value, registers, memory) {

 const baseReg = this.architecture == "X86_32" ? 'esp' : 'rsp';
 const rspAddress = this.getMemoryAddress(`(%${baseReg})`, registers, memory);

 const increment = this.architecture == "X86_32" ? 4 : 8;

 const rspMemory = memory.find(m => m.address === rspAddress);
 memory.find(m => m.location == (rspMemory.location - increment)).value = value;

 registers.find(r => r.register === 'rsp').value = memory.find(m => m.location === `${rspMemory.location - increment}`).address;

 }

 // Executes the pop instruction
 popFromStack(dest, registers, memory) {
 const baseReg = this.architecture == "X86_32" ? 'esp' : 'rsp';
 const rspAddress = this.getMemoryAddress(`(%${baseReg})`, registers, memory);

 const rspMemory = memory.find(m => m.address === rspAddress);
 this.setValue(dest, rspMemory.value, registers, memory);
 const increment = this.architecture == "X86_32" ? 4 : 8;

 registers.find(r => r.register === 'rsp').value = memory.find(m => m.location === `${Number(rspMemory.location) + increment}`).address;
 }

 // Acquire value from the given registers and memories
 getValue(operand, registers, memory) {
 if (operand.startsWith('%')) return registers.find(r => `%${r.register}` === operand).value;
 if (operand.startsWith('$') || operand.startsWith('#')) return parseInt(operand.slice(1), 10);
 if (operand.startsWith('X')) return registers.find(r => `${r.register}` === operand).value;
 const mem = memory.find(m => m.address === this.getMemoryAddress(operand, registers, memory));
 return mem && /^[0-9]+$/.test(mem.value) ? mem.value : 0;
 }

 // Set the value from the given registers and memories
 setValue(operand, value, registers, memory) {
 
 console.log("operand");
 console.log(operand);
 if (operand.startsWith('%')) {
 registers.find(r => `%${r.register}` === operand).value = value;
 } else if (operand.startsWith('X')) {
 registers.find(r => `${r.register}` === operand).value = value;
 console.log("value");
 console.log(value);
 } else {
 memory.find(m => m.address === this.getMemoryAddress(operand, registers, memory)).value = value;
 }
 }

 // Acquire the proper memory address with the given operand such as -8(%rax)
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

 // Calculation of the value
 calculate(op, destValue, srcValue) {
 const numDestValue = Number(destValue);
 const numSrcValue = Number(srcValue);
 return op === 'add' ? numDestValue + numSrcValue : numDestValue - numSrcValue;
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

 selectFlagRegisters(num_registers) {
 const registers = arch_data[this.architecture]['registers_regular'].slice(0, 2);
 return Array.from({ length: num_registers }, (_, i) => {
 const value = Math.floor(Math.random() * 255) - 127;
 return {
 register: registers[i],
 value: value.toString(),
 two: ((value < 0 ? (256 + value) : value).toString(2).padStart(8, '0'))
 };
 });
 }

 generateFlagInstructions(num_instructions, registers) {
 const instructions = [];
 const operations = arch_data[this.architecture]["comparison"].instructions;
 for (let i = 0; i < num_instructions; i++) {
 const op = unifPickItem(operations);
 let src = this.getRandomOperand(registers);
 let dest = this.getRandomOperand(registers);
 while (src === dest) {
 src = this.getRandomOperand(registers);
 }
 instructions.push(`${op} ${dest}, ${src}`);
 }
 return instructions;
 }

 getRandomOperand(registers) {
 const reg = unifPickItem(registers);
 return this.architecture === 'ARM64' ? `${reg.register}` : `%${reg.register}`;
 }

 analyzeFlagSettings(instruction, registers) {
 const parsedInstruction = this.parseInstruction(instruction);
 if (!parsedInstruction) {
 console.error('Failed to parse instruction:', instruction);
 return;
 }

 const { op, args } = parsedInstruction;
 const [src, dest] = args;

 const destVal = this.getFlagValue(dest, registers);
 const srcVal = this.getFlagValue(src, registers);

 let carryFlag = false, overflowFlag = false, zeroFlag = false, signFlag = false;

 const result = (destVal - srcVal) & 0xFF;

 if (op === 'cmp') {
 carryFlag = (destVal < srcVal);
 overflowFlag = (((destVal ^ srcVal) & (destVal ^ result)) & 0x80) !== 0;
 zeroFlag = result === 0;
 signFlag = (result & 0x80) !== 0;
 } else if (op === 'test' || op === 'tst') {
 carryFlag = false;
 overflowFlag = false;
 zeroFlag = result === 0;
 signFlag = (result & 0x80) !== 0;
 }

 // console.log(`Instruction: ${instruction}`);
 // console.log(`Destination Value: ${destVal}`);
 // console.log(`Source Value: ${srcVal}`);
 // console.log(`Carry Flag: ${carryFlag}`);
 // console.log(`Overflow Flag: ${overflowFlag}`);
 // console.log(`Zero Flag: ${zeroFlag}`);
 // console.log(`Sign Flag: ${signFlag}`);

 return { carryFlag, overflowFlag, zeroFlag, signFlag };
 }

 getFlagValue(operand, registers) {
 console.log(operand);
 if (operand.startsWith('$') || operand.startsWith('#')) {
 return parseInt(operand.slice(1), 16);
 } else {
 const reg = registers.find(r => `%${r.register}` === operand);
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