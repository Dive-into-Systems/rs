import RunestoneBase from "../../common/js/runestonebase";
import {
    FALSE
} from "../../dist/vendors-node_modules_jexcel_dist_jexcel_js-node_modules_jexcel_dist_jexcel_css.5671acb83e2f4648.bundle";

// Only necessary fields are mentioned here
export default class cachetable extends RunestoneBase {
    constructor(opts) {
        super(opts);
        this.num_ref = 8;
        this.lines_in_set = 1; // 1 for direct mapped, 2 for 2 way SA
        this.offset_bits = null;
        this.index_bits = null;
        this.tag_bits = null;
        this.chance_hit = 1/3;
        this.hit_incr = 1/3;
        this.chance_conf = 0.5;
        this.conf_incr = 0.25;
    }

    genRef_boost_init() {
        // we would use implicit parameters: num_ref, lines_in_set, offset_bits, tag_bits, chance_hit, hit_incr, chance_conf, conf_incr
        this.num_rows = 1<< this.index_bits;
        this.curr_hit_chance = this.chance_hit;
        this.hmFlag = false;
        this.curr_conflict_chance = this.chance_conf;
        this.conflictFlag = false;
        this.preconflictFlag = false;
        this.curr_ref = 0;

        // structure of current tagIndex table
        // [[V1, D1, "Tag1"],[V2, D2, "Tag2"], LRU]
        this.curr_tagIndex_table = [];
        for (let i = 0; i < this.num_rows; i++) {
            let current_row = [];
            for (let j = 0; j < this.lines_in_set; j++) {
                current_row.append([0,0,""]);
            }
            current_row.append(0);
            this.curr_tagIndex_table.append(current_row);
        }
    }

    genRef_boost_next() {
        // determine whether we should hit/miss conflict/non-conflict
        if (this.curr_ref) {
            this.hmFlag = false;
            this.conflictFlag = false;
            this.curr_conflict_chance = this.chance_conf;
            this.curr_hit_chance = this.chance_hit;
        } else {
            if (this.preconflictFlag) {
                this.curr_hit_chance = 1;
            } else {
                if (this.hmFlag) {
                    this.curr_hit_chance = this.chance_hit;
                } else {
                    this.curr_hit_chance += this.hit_incr;
                }
            }

            if (Math.random() < this.curr_hit_chance) {
                this.hmFlag = true;
            } else {
                this.hmFlag = false;
                this.conflictFlag = Math.random() < this.curr_conflict_chance;
            }
        }

        // collect valid information
        let validIndex = [];
        let validFullIndex = [];
        for (let i = 0; i < this.num_rows; i++) {
            let part_valid = false;
            let full_valid = true;
            for (let j = 0; i < this.lines_in_set; i++) {
                part_valid = (part_valid || this.curr_tagIndex_table[0][0]);
                full_valid = (full_valid && this.curr_tagIndex_table[0][0]);
            }
            if (part_valid) {
                validIndex.append(i);
            }
            if (full_valid) {
                validFullIndex.append(i);
            }
        }

        // create address based on hit/miss
        let currIndex = null;
        let currTag = null;
        let recentlyUsedLine = null;
        if (this.hmFlag) {
            // if it's a hit, select an index
            currIndex = validIndex[Math.floor(validIndex.length * Math.random())];
            recentlyUsedLine = Math.random() < 0.5 ? 0 : 1;
            if (1- this.curr_tagIndex_table[currIndex][recentlyUsedLine][0]) {
                recentlyUsedLine = this.lines_in_set - 1 - recentlyUsedLine;
            }
            currTag = this.curr_tagIndex_table[currIndex][recentlyUsedLine][2];
            this.conflictFlag = false;
            this.preconflictFlag = false;
        } else {
            if (this.conflictFlag) {
                if (validFullIndex.length) {
                    currIndex = validFullIndex[Math.floor(validFullIndex.length * Math.random())];
                    recentlyUsedLine = this.curr_tagIndex_table[currIndex][2];
                    let alreadyUsed = true;
                    do {
                        currTag = this.generateTag();
                        alreadyUsed = false;
                        for (let i = 0; i < this.lines_in_set; i++) {
                            alreadyUsed = alreadyUsed || (this.curr_tagIndex_table[currIndex][i][2] === currTag);
                        }
                    } while (alreadyUsed);
                    this.preconflictFlag = false;
                } else {
                    currIndex = validIndex[Math.floor(validIndex.length * Math.random())];
                    recentlyUsedLine = this.curr_tagIndex_table[currIndex][2];
                    do {
                        currTag = this.generateTag();
                    } while (currTag === this.curr_tagIndex_table[currIndex][this.lines_in_set - recentlyUsedLine]);
                    this.preconflictFlag = true;
                }
            } else {
                currIndex = Math.floor(this.num_rows * Math.random());
                recentlyUsedLine = this.curr_tagIndex_table[currIndex][2];
                let alreadyUsed = true;
                do {
                    currTag = this.generateTag();
                    alreadyUsed = false;
                    for (let i = 0; i < this.lines_in_set; i++) {
                        alreadyUsed = alreadyUsed || (this.curr_tagIndex_table[currIndex][i][2] === currTag);
                    }
                } while (alreadyUsed);
                this.preconflictFlag = false;
            }
        }
        let currIndex_str = this.toBinary(currIndex, this.index_bits);

        let currLRU = this.lines_in_set - 1 - recentlyUsedLine;
        let currRW = (Math.random() < 0.5);

        this.curr_tagIndex_table[currIndex][2] = currLRU;
        this.curr_tagIndex_table[currIndex][recentlyUsedLine][0] = 1;
        this.curr_tagIndex_table[currIndex][recentlyUsedLine][1] = this.calculateDirtyBit(currIndex, recentlyUsedLine, this.hmFlag, currRW);
        this.curr_tagIndex_table[currIndex][recentlyUsedLine][2] = currTag;

        let currAddress = currTag + currIndex_str + this.generateOffset();
        let currAnswer = [];
        this.currAnswer.concat([currAddress, currIndex]);
        for (let i = 0; i< this.lines_in_set; i++){
            this.currAnswer.concat(this.curr_tagIndex_table[currIndex])
        }
    }

    toBinary(num, len) {
        let str = num.toString(2);
        if (str.length < len) {
            let leading_zeros = "";
            for (let i = str.length ; i < len; i ++ ) {
                leading_zeros += "0";
            }
            str = leading_zeros + str;
        }
        return str;
    }

    generateAddress(len){
        let addr = "";
        for (let i = 0; i < len; i++) {
            addr += this.getRandomBit().toString();
        }
        return addr;
    }
    generateTag(){
        return this.generateAddress(this.tag_bits);
    }

    generateOffset() {
        return this.generateAddress(this.offset_bits);
    }

    calculateDirtyBit_helper(isValid, isWrite, isHit, PrevDirtyBit) {
        if (isWrite) { // if it is a write request, always set dirty bit to 1
            return 1;
        } else { // if it is a read request
            if (isHit) { // then if it is a hit, match current dirty bit state to that of the previous content
                if (PrevDirtyBit === 1 && isValid === 1) {
                    return 1;
                } else {
                    return 0;
                }
            } else { // then if it is a miss, would replace the original content, and always set dirty bit to 0
                return 0;
            }
        }
    }

    calculateDirtyBit(currIndex, recentlyUsedLine, curr_hm, curr_rw) {
        if (this.lines_in_set === 1) {
            return this.calculateDirtyBit_helper(this.curr_tagIndex_table[currIndex][0][0], curr_rw, curr_hm, this.curr_tagIndex_table[currIndex][0][1]);
        } else if (this.lines_in_set === 2) {
            let curr_lru = this.curr_tagIndex_table[currIndex][2];
            return this.calculateDirtyBit_helper(this.curr_tagIndex_table[currIndex][recentlyUsedLine][0], curr_rw, curr_hm, this.curr_tagIndex_table[currIndex][recentlyUsedLine][1]);
        }
    }
}