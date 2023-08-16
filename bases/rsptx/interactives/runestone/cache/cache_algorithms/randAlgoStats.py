'''
This function represents values in binary form with certain number of bits (length)
'''
def toBinary(num, length):
    toStr = bin(num)[2:]
    if (len(toStr) < length):
        leading_zeros = ""
        for i in range(len(toStr), length):
            leading_zeros += "0"
        toStr = leading_zeros + toStr
    return toStr

'''
the RandAlgo class keeps track of four dimensions of an address-generating algorithm:
1. miss type (conflict miss/non conflict miss)
2. hit/miss ratio
3. indices coverage (number of unique indices generated over all possible indices)
4. address variety (number of unique addresses over the size of one address list)
'''
class RandAlgo:
    def __init__(self):
        
        self.name = "" # name of algorithm
        self.addresses = [] # list of generated addresses in one run
        self.num_refs = None # length of the list of generated addresses in one run
        self.index_bits = None # number of bits for index
        self.num_rows = None # number of entries in cache structure
        self.hit_miss_list = [] # store hit/miss history
        self.num_entries = None
        self.setAssoc = 1

        self.cold_start_miss = 0
        self.conflict_miss = 0
        self.hit_miss_ratio = None
        self.indices_coverage = None
        self.address_variety = None
        self.validPerUsed = None
        self.lruFlips = None
    
    # print out all info in current test run
    def __str__(self):
        toString = ""
        toString += ("There are in total " + str(len(self.addresses)) + " addresses: \n")
        for i in range(len(self.addresses)):
            toString += (str(self.addresses[i]) + "\n")
        toString += ("Hit miss ratio " + str(self.hit_miss_ratio) + "\n")
        toString += ("Address variety" + str(self.address_variety) + "\n")
        toString += ("Indices coverage" + str(self.indices_coverage) + "\n")
        toString += ("Number of conflict miss is " + str(self.conflict_miss) + "\n")
        toString += ("Number of non conflict miss is " + str(self.cold_start_miss) + "\n")
        return toString
    
    
    # keep track of hit/miss type and a hit/miss list
    def SA_updateAll(self):
        self.conflict_miss = 0
        self.non_conflict_miss = 0
        self.lruFlips = 0
        self.hit_miss_list = []

        # initialize an empty cache
        curr_cache_entries = []
        for i in range(self.num_refs):
            curr_cache_entries.append([0, [0, ""], [0, ""]])

        # fill in the cache with our list of addresses
        for i in range(self.num_refs):
            
            hitFlag = False
            recentlyUsedLine = 0
            curr_idx = int(self.addresses[i][1], 2)
            # the entry is valid and found
            if (curr_cache_entries[curr_idx][1][0] == 1 and curr_cache_entries[curr_idx][1][1] == self.addresses[i][0]):
                hitFlag = True
                # print("hit here")
                recentlyUsedLine = 0
            elif (curr_cache_entries[curr_idx][2][0] == 1 and curr_cache_entries[curr_idx][2][1] == self.addresses[i][0]):
                hitFlag = True
                # print("hit here")
                recentlyUsedLine = 1
            else:
                hitFlag = False
                recentlyUsedLine = curr_cache_entries[curr_idx][0]
                # if valid, we need to overwrite it and it is a conflict miss
                if curr_cache_entries[curr_idx][recentlyUsedLine + 1][0] == 1:
                    self.conflict_miss += 1
                    # print("conflict here")
                else:
                    self.cold_start_miss += 1
                curr_cache_entries[curr_idx][recentlyUsedLine + 1][0] = 1
                curr_cache_entries[curr_idx][recentlyUsedLine + 1][1] = self.addresses[i][0]
            if (curr_cache_entries[curr_idx][0] != (1-recentlyUsedLine)):
                self.lruFlips += 1
            curr_cache_entries[curr_idx][0] = 1 - recentlyUsedLine
            self.hit_miss_list.append(hitFlag)
            # print(curr_cache_entries)
        self.calculateHitMissRatio()
        
        usedLines = 0
        usedSets = 0
        for oneSet in curr_cache_entries:
            currSet = 0
            if oneSet[1][0] == 1:
                usedLines += 1
                currSet = 1
            if oneSet[2][0] == 1:
                usedLines += 1
                currSet = 1
            usedSets += currSet
        self.validPerUsed = usedLines/usedSets
        self.indices_coverage = usedSets/self.num_rows
        
        self.calculateAddressVariety()
                    
        
                
                

    # fill in the cache with the list of addresses, update hit_miss_list and record miss type step-wise
    def updateHitMissList_missType(self):
        self.conflict_miss = 0
        self.cold_start_miss = 0
        self.hit_miss_list = []
        
        curr_tagIndex_table = [] # represent current cache status
        for i in range(self.num_rows): # init cache as empty
            curr_tagIndex_table.append([0, ""])
        
        # fill in the cache with the list of addresses, update hit_miss_list and record miss type step-wise
        for i in range(self.num_refs):
            valid_tagIndex_list = []
            for j in range(self.num_rows): # collect all current valid tagIndices
                if (curr_tagIndex_table[j][0] == 1):
                    valid_tagIndex_list.append(curr_tagIndex_table[j][1] + toBinary(j, self.index_bits))
            # if current tag_index combination is not valid, record it as a miss
            if (self.addresses[i][0] + self.addresses[i][1]) not in valid_tagIndex_list:
                self.hit_miss_list.append(False)
                curr_tagIndex_table[int(self.addresses[i][1],2)][1] = self.addresses[i][0]
                # if this tag_index combination index into a valid entry, record it as a conflict miss
                if (curr_tagIndex_table[int(self.addresses[i][1], 2)][0] == 1):
                    self.conflict_miss += 1
                # otherwise, record it as a cold start miss
                else:
                    self.cold_start_miss += 1
                    curr_tagIndex_table[int(self.addresses[i][1], 2)][0] = 1
            #otherwise, record it as a hit
            else:
                self.hit_miss_list.append(True)
        
        self.calculateHitMissRatio()
    
    '''
    calculate the hit miss ratio 
    by dividing the number of hit over the total times of accessing the cache
    '''
    def calculateHitMissRatio(self):
        hits = 0
        for i in self.hit_miss_list:
            if i: 
                hits += 1
        self.hit_miss_ratio = hits/self.num_refs
        # print("The hit miss ratio is " + str(self.hit_miss_ratio))
    
    '''
    calculate indices coverage
    by divding the number of unique indices over the size of the cache
    '''
    def calculateIndicesCoverage(self):
        uniqueIndices = set()
        for address in self.addresses:
            if address[1] not in uniqueIndices:
                uniqueIndices.add(address[1])
        self.indices_coverage = len(uniqueIndices)/self.num_rows
        if self.address_variety > 1:
            print(uniqueIndices)
            print(self.addresses)
            raise Exception("indice coverage cannot be larger than 1")
        # print("The coverage of indices (uniqueIndices / numRows) is " + str(self.indices_coverage))
    
    '''
    calculate address variety
    by dividing the number of unique tag_index combination over the size of address list
    '''
    def calculateAddressVariety(self):
        uniqueTagIndex = set()
        for address in self.addresses:
            if (address[0] + address[1]) not in uniqueTagIndex:
                uniqueTagIndex.add(address[0] + address[1])
        self.address_variety = len(uniqueTagIndex)/self.num_refs
        if self.address_variety > 1:
            print(uniqueTagIndex)
            print(self.addresses)
            raise Exception("address variety cannot be larger than 1")
        # print("The address variety ratio (uniqueTagIndex / numRefs) is " + str(self.address_variety))
    
    def calcAll(self):
        self.updateHitMissList_missType()
        self.calculateHitMissRatio()
        self.calculateAddressVariety()
        self.calculateIndicesCoverage()