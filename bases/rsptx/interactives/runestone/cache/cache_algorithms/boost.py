'''
This algorithm generates a list of addresses using a hit/miss ratio. 
Initially, the hit/miss ratio is 1:2, and the chance of hitting 
is increased if there is a miss; when a hit occurs, the hit/miss ratio 
is reset back to 1:2.
'''
import random
from randAlgoStats import RandAlgo
from randAlgoStats import toBinary
random.seed()

# generate tag randomly, returns string
def generateTag(tag_bits):
    tag = ""
    for i in range(tag_bits):
        tag += random.choice(["1", "0"])
    return tag

# generate index randomly, returns string
def generateIndex(index_bits):
    index = ""
    for i in range(index_bits):
        index += random.choice(["1", "0"])
    return index

# generate offset randomly, returns string
def generateOffset(offset_bits):
    offset = ""
    for i in range(offset_bits):
        offset += random.choice(["1", "0"])
    return offset

'''
generate one address.
hit/miss reference flag (hmRef) starts at a miss, its value is updated step-wise based on hit/miss ratio
current cache status (tagIndexRef) keeps track of everything currently in the cache
validTagIndex collects all valid entries in the current cache, refered to when creating a hit
return: 
'''
def generateOneAddress(curr_row, num_rows, chance_hit, offset_bits, index_bits, tag_bits, tagIndexRef, hmRef):
    # set hmRef
    if curr_row == 0: # if current row is the first row, force first one to be a miss
        hmRef.append(False)
    else: # if current row is not the first row, determine hit/miss based on chance_hit
        if hmRef[-1] == True: # if last one is hit, reset chance to initial, 1/3
            chance_hit = 1/3
        else: # otherwise, boost the chance of generating a hit
            increment = (round(random.uniform(chance_hit, 1), 2))*(2/3)
            chance_hit = chance_hit + increment
        # determine hit/miss based on new ratio
        curr_rand = random.random()
        if (curr_rand < chance_hit): 
            hmRef.append(True)
        else:
            hmRef.append(False)

    # collects all valid entries in current cache
    validTagIndex = [] 
    for x in range(num_rows):
        if (tagIndexRef[x][1] == True):
            validTagIndex.append(tagIndexRef[x][0] + toBinary(x, index_bits))

    # create address based on hit/miss
    if hmRef[-1] == False:
        target = generateTag(tag_bits) + generateIndex(index_bits)
        while (target in validTagIndex):
            target = generateTag(tag_bits) + generateIndex(index_bits)
    else:
        target = random.choice(validTagIndex)
    
    # partition address into tag, index, offset
    tagStr = target[0 : tag_bits]
    idxStr = target[tag_bits:]

    # update current cache status
    idxInt = int(idxStr, 2)
    tagIndexRef[idxInt][0] = tagStr
    tagIndexRef[idxInt][1] = True

    return (tagStr, idxStr, generateOffset(offset_bits))

def main_boost(ads_num, offset_bits, index_bits, tag_bits):

    hmRef = [] # create hit/miss reference, stores only hit/miss information
    tagIndexRef = []
    ret = [] # the list of addresses to return

    chance_hit = 1/3 # init the chance_hit, starting at 1/3

    # init an empty cache
    num_rows = 1 << index_bits
    for i in range(num_rows):
        tagIndexRef.append(["", False])

    for i in range(ads_num):
        oneAds = generateOneAddress(i, num_rows, chance_hit, offset_bits, index_bits, tag_bits, tagIndexRef, hmRef)
        ret.append(oneAds)


    boost_Algo = RandAlgo()
    boost_Algo.name = 'boost'
    boost_Algo.addresses = ret
    boost_Algo.hit_miss_list = hmRef
    
    boost_Algo.num_refs = ads_num
    boost_Algo.index_bits = index_bits
    boost_Algo.num_rows = 1 << index_bits
    
    boost_Algo.calcAll()
    return boost_Algo

if __name__ == '__main__':
    print(main_boost(8,2,1,1))
