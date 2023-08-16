'''
this algorithm generate a list of tag and a list of index with a certain number of repetitions, respectively.
shuffles the lists, and combines tag, index, and offset to form an address
'''
import random
from randAlgoStats import RandAlgo

random.seed()

'''global variables'''

#generate boundaries and counts
numUniqueTag = random.randrange(3, 5)
numUniqueIndex = random.randrange(3, 5)

def generateTag(tag_bits):
    tag = ""
    for i in range(tag_bits):
        tag += random.choice(["1", "0"])
    return tag

def generateIndex(index_bits):
    index = ""
    for i in range(index_bits):
        index += random.choice(["1", "0"])
    return index

def generateOffset(offset_bits):
    offset = ""
    for i in range(offset_bits):
        offset += random.choice(["1", "0"])
    return offset

# generate respectively two lists for tag and index for the memory address set
def generateTagNIndexList(ads_num, tag_bits, index_bits, tag_list, index_list, offset_list):
    same_tag = generateTag(tag_bits)
    for i in range(ads_num - numUniqueTag):
        tag_list.append((same_tag,))
    
    while (len(tag_list) < ads_num):
        unique_tag = generateTag(tag_bits)
        if (unique_tag not in tag_list):
            tag_list.append((unique_tag,))

    same_index = generateIndex(index_bits)
    for i in range(ads_num - numUniqueIndex):
        index_list.append((same_index,))
    
    while (len(index_list) < ads_num):
        unique_index = generateIndex(index_bits)
        if (unique_index not in index_list):
            index_list.append((unique_index,))

'''ads_num, offset_bits, index_bits, tag_bits'''
def main_bound(ads_num, offset_bits, index_bits, tag_bits):
    tag_list = []
    index_list = []
    offset_list = []

    # the list of addresses to return
    ret = []
    
    for i in range(ads_num):
        generateTagNIndexList(ads_num, tag_bits, index_bits, tag_list, index_list, offset_list)
        offset_list.append((generateOffset(offset_bits),))

    random.shuffle(tag_list)
    random.shuffle(index_list)

    for i in range(ads_num):
        ret.append(tag_list[i] + index_list[i] + offset_list[i])
    
    boost_Algo = RandAlgo()
    boost_Algo.name = 'bound'
    boost_Algo.addresses = ret
    boost_Algo.num_refs = ads_num
    boost_Algo.index_bits = index_bits
    boost_Algo.num_rows = 1 << index_bits
    boost_Algo.calcAll()
    return boost_Algo

if __name__ == '__main__':
    print(main_bound(8,2,2,4))
