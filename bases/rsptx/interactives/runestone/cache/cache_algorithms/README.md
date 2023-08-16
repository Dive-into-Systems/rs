# Caching Algorithms

For our interactive cache table problem, we need to auto-generate a sequence of memory addresses that would elicit interesting cache performances as similar as possible to the sequence of hand-picked addresses in the curated exercises. 
To that end, we designed six algorithms that do this task and tracked several dimensions of statistics regarding their performance at generating "good" memory addresses. 
For the algorithms, we have ```randomAds```, ```hitNmiss```, ```boost```, ```boost2```, ```bound```, and ```bound2```.
The essential idea behind all these algorithms is that most addresses are generated step-wise based on whether if we want the next access to be a hit or a miss, and if a miss, what type. 
For statistics, we are keeping track of miss type (conflict miss/non conflict miss), hit/miss ratio, indices coverage (number of unique indices generated over all possible indices), and address variety (number of unique addresses over the size of one address list). Among them hit/miss ratio and miss type are most important in that they reflect most directly the interesting cache behaviors such as conflict miss, eviction, etc.

## randomAds
```randomAds``` generates memory addresses completely randomly. We observe that it has a very low hit/miss ratio, let alone the number of conflict misses.

## hitNmiss
```hitHmiss``` uses the principle that there's a fifty-fifty chance of creating a hit, yet when there are two consecutive hits then the next one should be a miss (miss type if not regulated). Although ```hitNmiss``` performs fairly well at giving ~0.4 hit percentage and a good number of conflict miss, its procedure of generation is not very manipulatable if we want to alter its performance by changing the chances as parameters.

## boost
```boost``` utilizes hit/miss ratio. Initially, the hit/miss ratio is set at 1:2, and the chance of getting a hit in the next access increases by a few if there is a miss. Upon a hit, the hit/miss ratio is reset back to 1:2. With these ratios, it has a 0.5~ hit percentage and sadly also a conflict miss number close to 0. So we decided to make some modification to ```boost``` to create ```boost2```. 

## boost 2.0
Building upon the foundation of ```boost```, we have reduced the hit/miss ratio to 1:3 with a fixed increment of 1/3 while regulating the type of miss if we are not getting sufficient conflict misses. To achieve this, we use the same logic used for determining hit/miss. As for conflicts, initially, the conflict miss/non-conflict miss ratio stands at 1:1, and the likelihood of getting a conflict miss in the next access increases by 1/4 if a non-conflict miss occurs. We decided to incorporate ```boost2``` into our cache table problem because it resolves the issue of low conflict misses and offers nice flexibility.

## bound and bound 2.0
For these two algorithms, we attempted to add a cap to the number of unique ```tag``` and ```index``` when pre-generating each sub-portion of an address. Beyond these unique ones, all others are the same. After that we mix and match each sub-portion to create one complete sequence of addresses. In contrast to ```bound```, ```bound2``` offers the capability to specify the caps. Sadly, both algorithms exhibit a low hit/miss ratio. 