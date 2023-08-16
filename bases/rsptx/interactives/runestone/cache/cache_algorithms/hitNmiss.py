'''
this algorithm generates a list of address based on the principle that
when there are two consecutive hits then the next one should be a miss
'''

from random import choice
from math import pow
from randAlgoStats import RandAlgo
from randAlgoStats import toBinary

def generateTag(tag_bits):
    tag = ""
    for i in range(tag_bits):
        tag += choice(["0", "1"])
    return tag

def generateIndex(index_bits):
    index = ""
    for i in range(index_bits):
        index += choice(["0", "1"])
    return index

def generateOffset(offset_bits):
    offset = ""
    for i in range(offset_bits):
        offset += choice(["0", "1"])
    return offset

def generateOneAddress(curr_ref, offset_bits, index_bits, tag_bits, num_rows, hit_miss_list, curr_tagIndex_table):
    if (curr_ref == 0): # first always a miss
        curr_hm = False
    elif (curr_ref == 1): # second half half
        curr_hm = choice([True, False])
    else:
        # if previous two hits, miss this time
        if (hit_miss_list[curr_ref - 2] and hit_miss_list[curr_ref - 1]):
            curr_hm = False
        else: # otherwise half half
            curr_hm = choice([True, False])               
    hit_miss_list.append(curr_hm)    
    
    # generate current tagIndex
    valid_tagIndex_list = []
    for j in range(num_rows): # collect all current valid tagIndices
        if (curr_tagIndex_table[j][0] == 1):
            valid_tagIndex_list.append(curr_tagIndex_table[j][1] + toBinary(j, index_bits))
    if (curr_hm):
        # if it is a hit, pick a valid tagIndex to proceed
        currtagIndex = choice(valid_tagIndex_list)
    else:
        # if it is a miss, then generate a new tagIndex
        currtagIndex = generateTag(tag_bits) + generateIndex(index_bits)
        while (currtagIndex in valid_tagIndex_list):
            currtagIndex = generateTag(tag_bits) + generateIndex(index_bits)
    curr_tag_b = currtagIndex[0: tag_bits]
    curr_idx_b = currtagIndex[tag_bits: ]
    # if (curr_idx_b == ""):
    #     print("curr_idx_b " + str(curr_idx_b))
    #     print("curr_hm " + str(curr_hm))
    #     print("curr_tagIndex_table " + str(curr_tagIndex_table))
    #     print("currtagIndex " + str(currtagIndex))
    #     print("num_rows " + str(num_rows))
    #     print("index_bits " + str(index_bits))
    curr_idx_d = int(curr_idx_b, 2)
    

    
    # reflect the changes in answer_list and curr_tagIndex_table
    curr_tagIndex_table[curr_idx_d][0] = 1 # change valid bit to 1
    curr_tagIndex_table[curr_idx_d][1] = curr_tag_b # change tag to corresponding string

    return (curr_tag_b, curr_idx_b, generateOffset(offset_bits))

def main_hitNmiss(ads_num, offset_bits, index_bits, tag_bits):
    hit_miss_list = []
    curr_tagIndex_table = []
    
    num_rows = 1 << index_bits
    hitNmiss_Algo = RandAlgo()
    hitNmiss_Algo.name = "hitNmiss"
    for i in range(num_rows):
        curr_tagIndex_table.append([0, ""])
    for i in range(ads_num):
        x = generateOneAddress(i, offset_bits, index_bits, tag_bits, num_rows, hit_miss_list, curr_tagIndex_table)
        hitNmiss_Algo.addresses.append(x)
    
    # print(hit_miss_list)
    hitNmiss_Algo.index_bits = index_bits
    hitNmiss_Algo.num_rows = num_rows
    hitNmiss_Algo.num_refs = ads_num
    hitNmiss_Algo.calcAll()
    return hitNmiss_Algo
    
    
if __name__ == '__main__':
    print(main_hitNmiss(4, 2, 1, 3))




