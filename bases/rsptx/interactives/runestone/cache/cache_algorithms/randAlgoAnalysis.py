import os
import pandas as pd
import numpy as np
from matplotlib import pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages

from randomAds import main_random
from hitNmiss import main_hitNmiss
from boost import main_boost
from bound import main_bound
from randAlgoStats import RandAlgo, toBinary
from codeFromStackOverflow import rand_jitter, jitter

# ------ preparation ------ #

timeStamp_now = str(pd.Timestamp.now())
dir_name = "./Algorithm Test Result " + timeStamp_now
# create a directory
file_table_name = dir_name + "/result " + timeStamp_now + ".csv"
os.mkdir(dir_name)

# set up all params to permute through the test runs
tagIndexOffset = [[1,2,1], [2,1,1], 
                  [2,2,4], [2,3,3], [2,4,2], [3,2,3], [3,3,2], [4,2,2], 
                  [2,3,5], [2,4,4], [2,5,3], [3,2,5], [3,3,4], [3,4,3], 
                  [3,5,2], [4,2,4], [4,3,3], [4,4,2], [5,2,3], [5,3,2],
                  [3,3,6], [3,4,5], [3,5,4], [3,6,3], [4,3,5], [4,4,4],
                  [4,5,3], [5,3,4], [5,4,3], [6,3,3],
                  [4,4,8], [4,5,7], [4,6,6], [5,4,7], [5,5,6], [5,6,5],
                  [5,7,4], [6,4,6], [6,5,5], [6,6,4], [7,4,5], [7,5,4], 
                  [8,4,4]]
ads_num_iterates = range(4,16,2)
num_reps = 500
algorithm_iterates = [main_random, main_hitNmiss, main_boost, main_bound]

# create a dictionary
# - the dictionary map attribute name (str) to trail results (list)
# - the index of an element in the lists means the index of that trail in the experiment
# - the dictionary is later converted to a dateframe for data analysis
randAdsDF = pd.DataFrame(columns=['Tag Bits','Index Bits','Offset Bits','Number of Addresses',
                                  'Algorithm Name','Cold Start Miss','Conflict Miss','Hit/Miss Ratio',
                                  'Indices Coverage','Address Variety'])


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
    plt.close()

subfolder = "/Result each param set " + timeStamp_now
os.mkdir(dir_name + subfolder)
# nested for loop that loops through every "valid" set of parameters for num_reps trails
# statistics specific to each trail is recorded as a new "index" in randomAdsSet or a new row in the dataframe
for i in range(len(tagIndexOffset)):
    tag_bits, index_bits, offset_bits = tagIndexOffset[i]
    print("start: tag " + str(tag_bits))
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
                ads_len = tag_bits + index_bits + offset_bits
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
            file_gen_name = dir_name + subfolder + "/" + currAlgo.name + "_result" + timeStamp_now +"_tag" + str(tag_bits) + "_index" + str(index_bits) + "_offset" + str(offset_bits) + "_adsnum" + str(ads_num) + "_reps" + str(num_reps)
            file_table_name = file_gen_name + ".csv"
            # the dataframe for current set of parameters is stored to the directory
            currAdsDF.to_csv(file_table_name, index=False)
            #print("start drawing")
            drawCurrAlgoHist(currAdsDF, currAlgo.name, file_gen_name)
            #print("finished")
            randAdsDF = pd.concat([randAdsDF, currAdsDF], ignore_index = True)
            
# the whole dataframe is stored to the directory
randAdsDF.to_csv(file_table_name, index=False)



# ------ analysis comparing different algorithms ------ #

# this file stores mean and standard diviation of statistics for each algorithm regardless of other parameters
# - each algorithm is a row in this dataframe
file_acrossAlgo_name = dir_name + "/across algorithms analysis" + timeStamp_now + ".csv"
# this file stores the histograms drawn for each algorithm
# - each algorithm is a page in this pdf plot
# - on each page, a histogram of each statistics for this algorithm is drawn
file_acrossAlgo_plot = dir_name + "/across algorithms analysis" + timeStamp_now + ".pdf"

print("start: algo compare")

# set up the dictionary (to be converted to dataframe)
algoCompare = {
    "Algorithm Name" : [],
    "Cold Start Miss avg" : [],
    "Cold Start Miss sd" : [],
    "Conflict Miss avg" : [],
    "Conflict Miss sd" : [],
    'Hit/Miss Ratio avg' : [],
    'Hit/Miss Ratio sd' : [],
    'Indices Coverage avg' : [],
    'Indices Coverage sd' : [],
    'Address Variety avg' : [],
    'Address Variety sd' : [],
}

algorithm_name_iterates = ["rand", "hitNmiss", "boost", "bound"]
algoComp_figs = [] # this list of plots
# loop through each algorithms
for algorithm_name in algorithm_name_iterates:
    # initialize figure drawing for this algorithm in pyplot
    # - this fig stores all histograms of the algorithm in one page
    fig, ax = plt.subplots(2, 3)
    fig.tight_layout(pad=3.0)
    algoCompare["Algorithm Name"].append(algorithm_name)
    currAlgo_df = randAdsDF[randAdsDF['Algorithm Name'] == algorithm_name]
    
    # calculate mean and std of cold start miss count
    algoCompare["Cold Start Miss avg"].append(currAlgo_df["Cold Start Miss"].mean())
    algoCompare["Cold Start Miss sd"].append(currAlgo_df["Cold Start Miss"].std())
    currAlgo_cold = currAlgo_df["Cold Start Miss"]
    # draw the histogram for cold start miss
    ax[0, 0].hist(currAlgo_cold)
    ax[0, 0].set_title(str(algorithm_name) + " None Conflict Miss")
    
    # calculate mean and std of conflict miss count
    algoCompare["Conflict Miss avg"].append(currAlgo_df['Conflict Miss'].mean())
    algoCompare["Conflict Miss sd"].append(currAlgo_df['Conflict Miss'].std())
    currAlgo_cflt = currAlgo_df["Conflict Miss"]
    # draw the histogram for conflict miss count
    ax[1, 0].hist(currAlgo_cflt)
    ax[1, 0].set_title(str(algorithm_name) + " Conflict Miss")
    
    # calculate the mean and std of hit/miss ratio
    algoCompare['Hit/Miss Ratio avg'].append(currAlgo_df['Hit/Miss Ratio'].mean())
    algoCompare['Hit/Miss Ratio sd'].append(currAlgo_df['Hit/Miss Ratio'].std())
    currAlgo_hm = currAlgo_df["Hit/Miss Ratio"]
    # draw the histogram of hit/miss ratio
    ax[0, 1].hist(currAlgo_hm)
    ax[0, 1].set_title(str(algorithm_name) + " Hit/Miss Ratio")
    
    # calculate the mean and std of indices coverage
    algoCompare['Indices Coverage avg'].append(currAlgo_df['Indices Coverage'].mean())
    algoCompare['Indices Coverage sd'].append(currAlgo_df['Indices Coverage'].std())
    currAlgo_idx = currAlgo_df["Indices Coverage"]
    # draw the histogram of indices coverage
    ax[1, 1].hist(currAlgo_idx)
    ax[1, 1].set_title(str(algorithm_name) + " Indices Coverage")
    
    # calculate the mean and std of address variety
    algoCompare['Address Variety avg'].append(currAlgo_df['Address Variety'].mean())
    algoCompare['Address Variety sd'].append(currAlgo_df['Address Variety'].std())
    currAlgo_var = currAlgo_df["Address Variety"]
    # draw the histogram of address variety
    ax[0, 2].hist(currAlgo_var)
    ax[0, 2].set_title(str(algorithm_name) + " Address Variety")
    
    algoComp_figs.append(fig)

# save the dataframe
algoCompare_df = pd.DataFrame(algoCompare)
algoCompare_df.to_csv(file_acrossAlgo_name)

# save the pdf plot
plt_pdf = PdfPages(file_acrossAlgo_plot) # initialize pdf and open it
# iterating over all pages and save the pages to the pdf
for fig in algoComp_figs:    
    fig.savefig(plt_pdf, format='pdf')   
plt_pdf.close()  # close the pdf file



# ------ analysis of each individual algorithm ------ #

print("start: individual algo analysis")

# iterate through each individual algorithm
for algorithm_name in algorithm_name_iterates:
    # subset the data specific to current algorithm
    curr_algo_df = randAdsDF[randAdsDF['Algorithm Name'] == algorithm_name]
    
    # initialize plotting of the algorithm
    # - each algorithm have plots saved to separated pdf file
    fig, ax = plt.subplots(2, 3)
    fig.tight_layout(pad=2.0)
    # set up the pdf
    this_plot = dir_name + "/" + algorithm_name + " analysis" + timeStamp_now + ".pdf"
    
    # NOTE: rand_jitter is a function found on Stack Overflow
    # - it adds a little bit of random noises to each statistics drawn
    # - it helps set each data point a little apart from each other to avoid data point overlapping
    # - it helps us understand how dense data points are at each area in the plot
    
    # draw the scatter plot of number of non conflict misses (y-axis) against number of addresses (x-axis)
    ax[0, 0].scatter(rand_jitter(curr_algo_df['Number of Addresses']), rand_jitter(curr_algo_df["Cold Start Miss"]), s=1, alpha = 0.01)
    ax[0, 0].set_xlabel("# of addresses")
    ax[0, 0].set_ylabel("# of none conflict miss")
    
    # draw the scatter plot of number of conflict misses (y-axis) against number of addresses (x-axis)
    ax[1, 0].scatter(rand_jitter(curr_algo_df['Number of Addresses']), rand_jitter(curr_algo_df["Conflict Miss"]), s=1, alpha = 0.01)
    ax[1, 0].set_xlabel("# of addresses")
    ax[1, 0].set_ylabel("# of conflict miss")
    
    # draw the scatter plot of hit/miss ratio (y-axis) against number of addresses (x-axis)
    ax[0, 1].scatter(rand_jitter(curr_algo_df['Number of Addresses']), rand_jitter(curr_algo_df["Hit/Miss Ratio"]), s=1, alpha = 0.01)
    ax[0, 1].set_xlabel("# of addresses")
    ax[0, 1].set_ylabel("hit/miss ratio")
    
    # draw the scatter plot of indices coverage (y-axis) against number of addresses (x-axis)
    ax[1, 1].scatter(rand_jitter(curr_algo_df['Number of Addresses']), rand_jitter(curr_algo_df["Indices Coverage"]), s=1, alpha = 0.01)
    ax[1, 1].set_xlabel("# of addresses")
    ax[1, 1].set_ylabel("indices coverage")
    
    # draw the scatter plot of address variety (y-axis) against number of addresses (x-axis)
    ax[0, 2].scatter(rand_jitter(curr_algo_df['Number of Addresses']), rand_jitter(curr_algo_df["Address Variety"]), s=1, alpha = 0.01)
    ax[0, 2].set_xlabel("# of addresses")
    ax[0, 2].set_ylabel("# of address variety")

    # save and store the pdf of plots for this algorithm
    fig.savefig(this_plot, format = "pdf")
