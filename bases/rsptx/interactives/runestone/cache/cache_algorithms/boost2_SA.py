'''
This algorithm generates a list of addresses using a hit/miss ratio. 
Building upon the foundation of boost, we have reduced the hit/miss ratio to 
1:3 with a fixed increment of 1/3 while regulating the type of miss if we are
not getting sufficient conflict misses. To achieve this, we use the same 
logic used for determining hit/miss. As for conflicts, initially, the conflict
miss/non-conflict miss ratio stands at 1:1, and the likelihood of getting a 
conflict miss in the next access increases by 1/4 if a non-conflict miss occurs. 
'''

# ------ Causion: tag bits must be larger than 2 in this algo ------ #
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
def generateOneAddress(curr_row, num_rows, curr_hit_chance, curr_conflict_chance, chance_hit, hit_incr, chance_conf, conf_incr, offset_bits, index_bits, tag_bits, tagIndexRef, hmRef, conflictRef, preConflictRef):
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
        if preConflictRef:
            curr_conflict_chance = 1
        else:
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
    validFullIndex = []
    tags = []
    location = None
    for x in range(num_rows):
        if (tagIndexRef[x][1][1] == True) and (tagIndexRef[x][2][1] == True):
            validFullIndex.append(x)
            validIndex.append(x)
        elif (tagIndexRef[x][1][1] == True) or (tagIndexRef[x][2][1] == True):
            validIndex.append(x)
        # if (tagIndexRef[x][1][1] == True):
        #     validTagIndex.append(tagIndexRef[x][1][0] + toBinary(x, index_bits))
        #     validIndex.append(x)
        #     tags.append(tagIndexRef[x][1][0][0 : tag_bits])
        #     location = "left"
        # if (tagIndexRef[x][2][1] == True):
        #     validTagIndex.append(tagIndexRef[x][2][0] + toBinary(x, index_bits))
        #     validIndex.append(x)
        #     tags.append(tagIndexRef[x][2][0][0 : tag_bits])
        #     location = "right"

    # create address based on hit/miss
    currIndex = None
    recentlyUsedLine = None
    if hmRef == True: # if hit, pick a valid address to hit
        currIndex = random.choice(validIndex)
        recentlyUsedLine = 0
        if random.random() < 0.5:
            recentlyUsedLine = 1
        if tagIndexRef[currIndex][recentlyUsedLine + 1][1]:
            tagStr = tagIndexRef[currIndex][recentlyUsedLine + 1][0]
        else:
            recentlyUsedLine = 1 - recentlyUsedLine
            tagStr = tagIndexRef[currIndex][recentlyUsedLine + 1][0]
        conflictRef = False
        preConflictRef = False
    else: # if miss, determine miss type (conflict/non conflict miss) and generate address            
        if conflictRef == True: # if should be a conflict miss, pick a valid index with a different tag
            if len(validFullIndex) > 0: # the case where we can make a conflict miss
                currIndex = random.choice(validFullIndex)
                recentlyUsedLine = tagIndexRef[currIndex][0]
                tagStr = generateTag(tag_bits)
                # print("previous entries: " + tagIndexRef[currIndex][1][0] + tagIndexRef[currIndex][2][0])
                while tagStr == tagIndexRef[currIndex][1][0] or tagStr == tagIndexRef[currIndex][2][0]:
                    tagStr = generateTag(tag_bits)
                    # print("oneChoice: " + tagStr)
                preConflictRef = False
            else: # else, we fill one set and make the next reference a conflict miss
                currIndex = random.choice(validIndex)
                recentlyUsedLine = tagIndexRef[currIndex][0]
                tagStr = generateTag(tag_bits)
                while (tagStr == tagIndexRef[currIndex][2 - recentlyUsedLine][0]):
                    tagStr = generateTag(tag_bits)
                preConflictRef = True
                    
        else: # else does not guarantee that this is a non-conflict miss: it might not be able to give non-conflict miss
            currIndex = random.randint(0, num_rows-1)
            recentlyUsedLine = tagIndexRef[currIndex][0]
            tagStr = generateTag(tag_bits)
            while (tagStr == tagIndexRef[currIndex][1][0] or tagStr == tagIndexRef[currIndex][2][0]):
                tagStr = generateTag(tag_bits)
            preConflictRef = False
    
    # partition address into tag, index, offset
    idxStr = toBinary(currIndex, index_bits)

    # update current cache status
    tagIndexRef[currIndex][0] = 1 - recentlyUsedLine
    tagIndexRef[currIndex][recentlyUsedLine + 1][0] = tagStr
    tagIndexRef[currIndex][recentlyUsedLine + 1][1] = True

    return ((tagStr, idxStr, generateOffset(offset_bits)), curr_hit_chance, curr_conflict_chance, hmRef, conflictRef, preConflictRef)

def main_boost2_SA(ads_num, offset_bits, index_bits, tag_bits, chance_hit, hit_incr, chance_conf, conf_incr):

    hmRef = False
    conflictRef = False
    preConflictRef = False
    tagIndexRef = []
    ret = [] # the list of addresses to return


    # init an empty cache
    num_rows = 1 << index_bits
    lru = 0 # might have to randomly determine the LRU bit later
    for i in range(num_rows):
        tagIndexRef.append([lru, ["", False],["", False]])

    curr_hit_chance = chance_hit
    curr_conflict_chance = chance_conf
    for i in range(ads_num):
        oneAds, curr_hit_chance, curr_conflict_chance, hmRef, conflictRef, preConflictRef = generateOneAddress(i, num_rows, curr_hit_chance, curr_conflict_chance, chance_hit, hit_incr, chance_conf, conf_incr, offset_bits, index_bits, tag_bits, tagIndexRef, hmRef, conflictRef, preConflictRef)
        ret.append(oneAds)


    boostSA_algo = RandAlgo()
    boostSA_algo.name = 'boost2_SA'
    boostSA_algo.addresses = ret
    # boost_Algo.hit_miss_list = hmRef
    
    boostSA_algo.num_refs = ads_num
    boostSA_algo.index_bits = index_bits
    boostSA_algo.num_rows = 1 << index_bits
    boostSA_algo.setAssoc = 2
    
    boostSA_algo.SA_updateAll()
    return boostSA_algo

if __name__ == '__main__':
    print(main_boost2_SA(8,2,1,2, 1/3, 1/3, 1/2, 1/4))
