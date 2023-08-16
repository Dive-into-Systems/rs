import os
import pandas as pd
import numpy as np
from matplotlib import pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages

from boost2_SA import main_boost2_SA
from codeFromStackOverflow import rand_jitter, jitter

# ------ preparation ------ #

timeStamp_now = str(pd.Timestamp.now())
dir_name = "./Boost2SA Test Result " + timeStamp_now
# create a directory
file_table_name = dir_name + "/result " + timeStamp_now + ".csv"
os.mkdir(dir_name)

# set up all params to permute through the test runs
ads_num = 12
tagIndexOffset1 = [[2,2,4],[3,2,3],[4,2,2],[5,2,1]]
tagIndexOffset2 = [[2,3,3],[3,3,2],[4,3,1]]
hm_chance = [[1/3,1/3],[1/4,1/4],[1/3,1/4], [1/5, 1/4]]
conflict_chance = [[1/3,1/3], [1/2,1/4], [1/3, 1/4],[2/3, 1/6]]
num_reps = 500

# ------ experiment ------ #

def drawCurrAlgoHist(currAdsDF, algorithm_name, file_gen_name):
    this_plot = file_gen_name + ".pdf"
    plt_pdf = PdfPages(this_plot)
    
    fig, ax = plt.subplots(2, 2)
    fig.tight_layout(pad=3.0)
    
    ax[0, 0].hist(currAdsDF["Conflict Miss"])
    ax[0, 0].set_title(str(algorithm_name) + "_ConflictMiss")

    ax[0, 1].hist(currAdsDF["Hit/Miss Ratio"])
    ax[0, 1].set_title(str(algorithm_name) + "_HitRatio")
    
    ax[1, 0].hist(currAdsDF["Valid per Used"])
    ax[1, 0].set_title(str(algorithm_name) + "_validPerUsed")
    
    ax[1, 1].hist(currAdsDF["LRU flips"])
    ax[1, 1].set_title(str(algorithm_name) + "_lruFlips")
    
    fig.savefig(plt_pdf, format= 'pdf')
    plt.close()
    
    fig, ax = plt.subplots(2, 2)
    fig.tight_layout(pad=3.0)
    
    ax[0, 0].hist(currAdsDF["Cold Start Miss"])
    ax[0, 0].set_title(str(algorithm_name) + "_NoneConflictMiss")

    ax[0, 1].hist(currAdsDF["Indices Coverage"])
    ax[0, 1].set_title(str(algorithm_name) + "_IndicesCoverage")
    
    ax[1, 0].hist(currAdsDF["Address Variety"])
    ax[1, 0].set_title(str(algorithm_name) + "_AddressVariety")
    
    fig.savefig(this_plot, format = "pdf")
    plt_pdf.close()
    plt.close()

subfolder = "/Result each param set " + timeStamp_now
os.mkdir(dir_name + subfolder)
# nested for loop that loops through every "valid" set of parameters for num_reps trails
# statistics specific to each trail is recorded as a new "index" in randomAdsSet or a new row in the dataframe
for tagIndexOffset in [tagIndexOffset1, tagIndexOffset2]:
    for chance_hit, hit_incr in hm_chance:
        for chance_conf, conf_incr in conflict_chance:
            # create a dictionary
            # - the dictionary map attribute name (str) to trail results (list)
            # - the index of an element in the lists means the index of that trail in the experiment
            # - the dictionary is later converted to a dateframe for data analysis
            randAdsDF = pd.DataFrame(columns=['Tag Bits','Index Bits','Offset Bits','Number of Addresses',
                                            'Algorithm Name','Cold Start Miss','Conflict Miss','Hit/Miss Ratio',
                                            'Indices Coverage','Address Variety','Valid per Used','LRU flips'])
            for i in range(len(tagIndexOffset)):
                tag_bits, index_bits, offset_bits = tagIndexOffset[i]
                print("progress: " + str(i/len(tagIndexOffset)))
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
                    'Valid per Used':[],
                    'LRU flips':[]
                }
                for i in range(num_reps):
                    ads_len = tag_bits + index_bits + offset_bits
                    currAlgo = main_boost2_SA(ads_num, offset_bits, index_bits, tag_bits, chance_hit, hit_incr, chance_conf, conf_incr)
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
                    currAdsSet['Valid per Used'].append(currAlgo.validPerUsed)
                    currAdsSet['LRU flips'].append(currAlgo.lruFlips)
                currAdsDF = pd.DataFrame(currAdsSet)
                # create a directory
                file_gen_name = dir_name + subfolder + "/" + currAlgo.name + "_result" + timeStamp_now +"_tag" + str(tag_bits) + "_index" + str(index_bits) + "_offset" + str(offset_bits) + "_adsnum" + str(ads_num) + "_reps" + str(num_reps) + "_hitchance" + str([round(chance_hit, 2), round(hit_incr, 2)]) + "_conflictchance" + str([round(chance_conf, 2), round(conf_incr, 2)])
                file_table_name = file_gen_name + ".csv"
                # the dataframe for current set of parameters is stored to the directory
                currAdsDF.to_csv(file_table_name, index=False)
                #print("start drawing")
                drawCurrAlgoHist(currAdsDF, currAlgo.name, file_gen_name)
                #print("finished")
                randAdsDF = pd.concat([randAdsDF, currAdsDF], ignore_index = True)        
            # the whole dataframe is stored to the directory
            randAdsDF.to_csv(file_table_name, index=False)
            
            file_acrossAlgo_name = dir_name + "/boost2 analysis index_bits=" + str(index_bits) + "_hitchance" + str([round(chance_hit,2), round(hit_incr, 2)]) + "_conflictchance" + str([round(chance_conf, 2), round(conf_incr, 2)]) + ".csv"
            file_plot_name = dir_name + "/boost2 analysis plot index_bits=" + str(index_bits) + "_hitchance" + str([round(chance_hit, 2), round(hit_incr, 2)]) + "_conflictchance" + str([round(chance_conf, 2), round(conf_incr, 2)]) + ".pdf"
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
                'Valid per Used avg':[],
                'Valid per Used sd':[],
                'LRU flips avg':[],
                'LRU flips sd':[]
            }
            
            plt_pdf = PdfPages(file_plot_name)

            currAlgo_df = randAdsDF
            algorithm_name = "boost2_SA"
            algoCompare["Algorithm Name"].append(algorithm_name)

            # calculate mean and std of conflict miss count
            algoCompare["Conflict Miss avg"].append(currAlgo_df['Conflict Miss'].mean())
            algoCompare["Conflict Miss sd"].append(currAlgo_df['Conflict Miss'].std())
            currAlgo_cflt = currAlgo_df["Conflict Miss"]
            
            fig, ax = plt.subplots(2, 2)
            fig.tight_layout(pad=3.0)
            # draw the histogram for conflict miss count
            ax[0, 0].hist(currAlgo_cflt)
            ax[0, 0].set_title(str(algorithm_name) + " Conflict Miss")
            
            # calculate the mean and std of hit/miss ratio
            algoCompare['Hit/Miss Ratio avg'].append(currAlgo_df['Hit/Miss Ratio'].mean())
            algoCompare['Hit/Miss Ratio sd'].append(currAlgo_df['Hit/Miss Ratio'].std())
            currAlgo_hm = currAlgo_df["Hit/Miss Ratio"]
            # draw the histogram of hit/miss ratio
            ax[0, 1].hist(currAlgo_hm)
            ax[0, 1].set_title(str(algorithm_name) + " Hit/Miss Ratio")
            
            # calculate the mean and std of valid per use
            algoCompare['Valid per Used avg'].append(currAlgo_df['Valid per Used'].mean())
            algoCompare['Valid per Used sd'].append(currAlgo_df['Valid per Used'].std())
            currAlgo_vpu = currAlgo_df["Valid per Used"]
            # draw the histogram of valid per use
            ax[1, 0].hist(currAlgo_vpu)
            ax[1, 0].set_title(str(algorithm_name) + " Valid per Use")

            # calculate the mean and std of lru flips
            algoCompare['LRU flips avg'].append(currAlgo_df['LRU flips'].mean())
            algoCompare['LRU flips sd'].append(currAlgo_df['LRU flips'].std())
            currAlgo_lf = currAlgo_df["LRU flips"]
            # draw the histogram of lru flips
            ax[1, 1].hist(currAlgo_lf)
            ax[1, 1].set_title(str(algorithm_name) + " LRU flips")
            
            fig.savefig(plt_pdf, format = "pdf")
            plt.close()
            
            fig, ax = plt.subplots(2, 2)
            fig.tight_layout(pad=3.0)
            # calculate mean and std of cold start miss count
            algoCompare["Cold Start Miss avg"].append(currAlgo_df["Cold Start Miss"].mean())
            algoCompare["Cold Start Miss sd"].append(currAlgo_df["Cold Start Miss"].std())
            currAlgo_cold = currAlgo_df["Cold Start Miss"]
            # draw the histogram for cold start miss
            ax[0, 0].hist(currAlgo_cold)
            ax[0, 0].set_title(str(algorithm_name) + " None Conflict Miss")
            
            # calculate the mean and std of indices coverage
            algoCompare['Indices Coverage avg'].append(currAlgo_df['Indices Coverage'].mean())
            algoCompare['Indices Coverage sd'].append(currAlgo_df['Indices Coverage'].std())
            currAlgo_idx = currAlgo_df["Indices Coverage"]
            # draw the histogram of indices coverage
            ax[0, 1].hist(currAlgo_idx)
            ax[0, 1].set_title(str(algorithm_name) + " Indices Coverage")
            
            # calculate the mean and std of address variety
            algoCompare['Address Variety avg'].append(currAlgo_df['Address Variety'].mean())
            algoCompare['Address Variety sd'].append(currAlgo_df['Address Variety'].std())
            currAlgo_var = currAlgo_df["Address Variety"]
            # draw the histogram of address variety
            ax[1, 0].hist(currAlgo_var)
            ax[1, 0].set_title(str(algorithm_name) + " Address Variety")
            
            fig.savefig(plt_pdf, format = "pdf")
            plt_pdf.close()
            plt.close()

            # save the dataframe
            algoCompare_df = pd.DataFrame(algoCompare)
            algoCompare_df.to_csv(file_acrossAlgo_name)

