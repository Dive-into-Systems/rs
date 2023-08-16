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
'''
def generateOneAddress(curr_row, num_rows, curr_hit_chance, curr_conflict_chance, chance_hit, hit_incr, chance_conf, conf_incr, offset_bits, index_bits, tag_bits, tagIndexRef, hmRef, conflictRef):
    # set hmRef
    if curr_row == 0: # if first acess
        hmRef = False # force first memory access to be a miss
        conflictRef = False # force this miss to be a non-conflict miss
        curr_conflict_chance = chance_conf
        curr_hit_chance = chance_hit
    else:
        # determine hit/miss based on chance_hit and hit_incr
        if hmRef == True:
            curr_hit_chance = chance_hit
        else:
            curr_hit_chance += hit_incr

        # determine conflict type based on chance_conf and conflict increment
        if conflictRef == True:
            curr_conflict_chance = chance_conf
        else:
            curr_conflict_chance += conf_incr

        curr_rand = random.random()
        if (curr_rand < curr_hit_chance):
            hmRef = True
        else:
            hmRef = False
            curr_rand = random.random()
            if (curr_rand < curr_conflict_chance):
                conflictRef = True
            else:
                conflictRef = False

    validTagIndex = [] # collects all valid entries in current cache
    validIndex = []
    tags = []
    for x in range(num_rows):
        if (tagIndexRef[x][1] == True):
            validTagIndex.append(tagIndexRef[x][0] + toBinary(x, index_bits))
            validIndex.append(x)
            tags.append(tagIndexRef[x][0][0 : tag_bits])

    # create address based on hit/miss
    if hmRef == True: # if hit, pick a valid address to hit
        target = random.choice(validTagIndex)
        conflictRef = False
    else: # if miss, determine miss type (conflict/non conflict miss) and generate address            
        if conflictRef == True: # if should be a conflict miss, pick a valid index with a different tag
            tag, idx = generateTag(tag_bits), generateIndex(index_bits)
            idx = random.choice(validIndex)
            while (tag == tagIndexRef[idx][0]):
                tag = generateTag(tag_bits)
            idx = toBinary(idx, index_bits)
            target = tag + idx
        else: # else does not guarantee that this is a non-conflict miss
            target = generateTag(tag_bits) + generateIndex(index_bits)
            while (target in validTagIndex):
                target = generateTag(tag_bits) + generateIndex(index_bits)
    
    # partition address into tag, index, offset
    tagStr = target[0 : tag_bits]
    idxStr = target[tag_bits:]

    # update current cache status
    idxInt = int(idxStr, 2)
    tagIndexRef[idxInt][0] = tagStr
    tagIndexRef[idxInt][1] = True

    return ((tagStr, idxStr, generateOffset(offset_bits)), curr_hit_chance, curr_conflict_chance, hmRef, conflictRef)

def main_boost2(ads_num, offset_bits, index_bits, tag_bits, chance_hit, hit_incr, chance_conf, conf_incr):

    hmRef = False
    conflictRef = False
    tagIndexRef = []
    ret = [] # the list of addresses to return

    # init an empty cache
    num_rows = 1 << index_bits
    for i in range(num_rows):
        tagIndexRef.append(["", False])

    curr_hit_chance = chance_hit
    curr_conflict_chance = chance_conf
    for i in range(ads_num):
        oneAds, curr_hit_chance, curr_conflict_chance, hmRef, conflictRef = generateOneAddress(i, num_rows, curr_hit_chance, curr_conflict_chance, chance_hit, hit_incr, chance_conf, conf_incr, offset_bits, index_bits, tag_bits, tagIndexRef, hmRef, conflictRef)
        ret.append(oneAds)


    boost_Algo = RandAlgo()
    boost_Algo.name = 'boost'
    boost_Algo.addresses = ret
    # boost_Algo.hit_miss_list = hmRef
    
    boost_Algo.num_refs = ads_num
    boost_Algo.index_bits = index_bits
    boost_Algo.num_rows = 1 << index_bits
    
    boost_Algo.calcAll()
    return boost_Algo

if __name__ == '__main__':
    print(main_boost2(8,2,1,1, 1/3, 1/3, 1/2, 1/4))
