import os
import pandas as pd
import numpy as np
from matplotlib import pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages
import argparse

from randomAds import main_random
from hitNmiss import main_hitNmiss
from boost import main_boost
from bound import main_bound
from randAlgoStats import RandAlgo, toBinary

# ------ set up cmdline partition ------ #

p = argparse.ArgumentParser(description='Enter tag length, index length, and offset length, number of ads in a group, num of repetition, algorithm name.')
p.add_argument('--tag', type = int, nargs = '+', required = True, help = 'Enter --tag followed by one or more int')
p.add_argument('--index', type = int, nargs = '+', required = True, help = 'Enter --index followed by one or more int')
p.add_argument('--offset', type = int, nargs = '+', required = True, help = 'Enter --offset followed by one or more int')
p.add_argument('--adsnum', type = int, nargs = "+", required = True, help = 'Enter --adsnum followed by one or more int')
p.add_argument('--reps', type = int, required = True, help = 'Enter --reps followed by one int')
p.add_argument('--algo', type = str, nargs = '+', help = 'Enter --algo followed by "rand", "hitNmiss", "boost", or "bound"')


# ------ get parameter list from cmdline ------ #
args = p.parse_args()
tag_bit_iterates = args.tag
index_bit_iterates = args.index
offset_bit_iterates = args.offset
ads_num_iterates = args.adsnum
num_reps = args.reps
algo_names = args.algo
if algo_names == None:
    algorithm_iterates = [main_random, main_hitNmiss, main_boost, main_bound]
else:
    algorithm_iterates = []
    if 'rand' in algo_names:
        algorithm_iterates.append(main_random)
    if 'hitNmiss' in algo_names:
        algorithm_iterates.append(main_hitNmiss)
    if 'boost' in algo_names:
        algorithm_iterates.append(main_boost)
    if 'bound' in algo_names:
        algorithm_iterates.append(main_bound)


# ------ preparation ------ #        

timeStamp_now = str(pd.Timestamp.now())
dir_name = "./Algorithm Test Result (cmdver)" + timeStamp_now
os.mkdir(dir_name)

# following is a dictionary
# - the dictionary map attribute name (str) to trail results (list)
# - the index of an element in the lists means the index of that trail in the experiment
# - the dictionary is later converted to a dateframe for data analysis


# ------ experiment ------ #

def drawCurrAlgoHist(currAdsDF, algorithm_name, file_gen_name):
    fig, ax = plt.subplots(2, 3)
    fig.tight_layout(pad=3.0)
    
    ax[0, 0].hist(currAdsDF["Cold Start Miss"])
    ax[0, 0].set_title(str(algorithm_name) + "_NoneConflictMiss")
    
    ax[1, 0].hist(currAdsDF["Conflict Miss"])
    ax[1, 0].set_title(str(algorithm_name) + "_ConflictMiss")
    
    ax[0, 1].hist(currAdsDF["Hit/Miss Ratio"])
    ax[0, 1].set_title(str(algorithm_name) + "_HitRatio")

    ax[1, 1].hist(currAdsDF["Indices Coverage"])
    ax[1, 1].set_title(str(algorithm_name) + "_IndicesCoverage")
    
    ax[0, 2].hist(currAdsDF["Address Variety"])
    ax[0, 2].set_title(str(algorithm_name) + "_AddressVariety")
    
    this_plot = file_gen_name + ".pdf"
    fig.savefig(this_plot, format = "pdf")

# nested for loop that loops through every "valid" set of parameters for num_reps trails
# statistics specific to each trail is recorded as a new "index" in currAdsSet or a new row in the dataframe
for tag_bits in tag_bit_iterates:
    print("start: tag " + str(tag_bits))
    for index_bits in index_bit_iterates:
        for offset_bits in offset_bit_iterates:
            for ads_num in ads_num_iterates:
                for fn in algorithm_iterates:
                    currAdsSet  = {
                        'Tag Bits': [],
                        'Index Bits': [],
                        'Offset Bits': [],
                        'Number of Addresses': [],
                        'Algorithm Name': [],
                        'Cold Start Miss': [],
                        'Conflict Miss': [],
                        'Hit/Miss Ratio':[],
                        'Indices Coverage':[],
                        'Address Variety':[],
                    }
                    for i in range(num_reps):
                        currAlgo = fn(ads_num, offset_bits, index_bits, tag_bits)
                        currAdsSet['Tag Bits'].append(tag_bits)
                        currAdsSet['Index Bits'].append(index_bits)
                        currAdsSet['Offset Bits'].append(offset_bits)
                        currAdsSet['Number of Addresses'].append(ads_num)
                        currAdsSet['Algorithm Name'].append(currAlgo.name)
                        currAdsSet['Cold Start Miss'].append(currAlgo.cold_start_miss)
                        currAdsSet['Conflict Miss'].append(currAlgo.conflict_miss)
                        currAdsSet['Hit/Miss Ratio'].append(currAlgo.hit_miss_ratio)
                        currAdsSet['Indices Coverage'].append(currAlgo.indices_coverage)
                        currAdsSet['Address Variety'].append(currAlgo.address_variety)
                    
                    currAdsDF = pd.DataFrame(currAdsSet)
                    # create a directory
                    file_gen_name = dir_name + "/" + currAlgo.name + "_result" + timeStamp_now +"_tag" + str(tag_bits) + "_index" + str(index_bits) + "_offset" + str(offset_bits) + "_adsnum" + str(ads_num) + "_reps" + str(num_reps)
                    file_table_name = file_gen_name + ".csv"
                    # the dataframe for current set of parameters is stored to the directory
                    currAdsDF.to_csv(file_table_name, index=False)
                    #print("start drawing")
                    drawCurrAlgoHist(currAdsDF, currAlgo.name, file_gen_name)
                    #print("finished")