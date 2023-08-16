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

# ------ prepare and read the data set from saved csv file ------ #

timeStamp_now = str(pd.Timestamp.now())
dir_name = "./Algorithm Graphing from present " + timeStamp_now
csv_path = "./Algorithms test final result/result 2023-06-14 15:36:09.522653.csv"

randAdsDF = pd.read_csv(csv_path)

# ------ subset data to a set of reasonable parameters ------ #
randAdsDF['toKeep'] = [True] * len(randAdsDF)
for index, row in randAdsDF.iterrows():
    if (row['Tag Bits'] + row['Index Bits'] + row['Offset Bits']) not in [8, 10, 12]:
        row['toKeep'] = False
    if row['Index Bits'] < 2 or row['Index Bits'] > 4:
        row['toKeep'] = False
    if row['Tag Bits'] < 2 or row['Tag Bits'] > 6:
        row['toKeep'] = False

randAdsDF_subset = randAdsDF[randAdsDF['toKeep']]

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
    "Algorithm Name": [],
    "Cold Start Miss avg": [],
    "Cold Start Miss sd": [],
    "Conflict Miss avg": [],
    "Conflict Miss sd": [],
    'Hit/Miss Ratio avg': [],
    'Hit/Miss Ratio sd': [],
    'Indices Coverage avg': [],
    'Indices Coverage sd': [],
    'Address Variety avg': [],
    'Address Variety sd': [],
}

algorithm_name_iterates = ["rand", "hitNmiss", "boost", "bound"]
algoComp_figs = []  # this list of plots
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
os.mkdir(dir_name)
algoCompare_df.to_csv(file_acrossAlgo_name)

# save the pdf plot
plt_pdf = PdfPages(file_acrossAlgo_plot)  # initialize pdf and open it
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
    ax[0, 0].scatter(rand_jitter(curr_algo_df['Number of Addresses']), rand_jitter(curr_algo_df["Cold Start Miss"]),
                     s=1, alpha=0.05)
    ax[0, 0].set_xlabel("# of addresses")
    ax[0, 0].set_ylabel("# of none conflict miss")

    # draw the scatter plot of number of conflict misses (y-axis) against number of addresses (x-axis)
    ax[1, 0].scatter(rand_jitter(curr_algo_df['Number of Addresses']), rand_jitter(curr_algo_df["Conflict Miss"]), s=1,
                     alpha=0.05)
    ax[1, 0].set_xlabel("# of addresses")
    ax[1, 0].set_ylabel("# of conflict miss")

    # draw the scatter plot of hit/miss ratio (y-axis) against number of addresses (x-axis)
    ax[0, 1].scatter(rand_jitter(curr_algo_df['Number of Addresses']), rand_jitter(curr_algo_df["Hit/Miss Ratio"]), s=1,
                     alpha=0.05)
    ax[0, 1].set_xlabel("# of addresses")
    ax[0, 1].set_ylabel("hit/miss ratio")

    # draw the scatter plot of indices coverage (y-axis) against number of addresses (x-axis)
    ax[1, 1].scatter(rand_jitter(curr_algo_df['Number of Addresses']), rand_jitter(curr_algo_df["Indices Coverage"]),
                     s=1, alpha=0.05)
    ax[1, 1].set_xlabel("# of addresses")
    ax[1, 1].set_ylabel("indices coverage")

    # draw the scatter plot of address variety (y-axis) against number of addresses (x-axis)
    ax[0, 2].scatter(rand_jitter(curr_algo_df['Number of Addresses']), rand_jitter(curr_algo_df["Address Variety"]),
                     s=1, alpha=0.05)
    ax[0, 2].set_xlabel("# of addresses")
    ax[0, 2].set_ylabel("# of address variety")

    # save and store the pdf of plots for this algorithm
    fig.savefig(this_plot, format="pdf")

# %%
