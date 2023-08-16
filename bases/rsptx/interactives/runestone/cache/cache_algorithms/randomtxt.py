from randAlgoStats import RandAlgo
SA_algo = RandAlgo()
SA_algo.name = "SA_boost2"
SA_algo.addresses = [('11','1','11'),('01','1','01'),('11','1','10'),('01','1','10'),('01','1','01'),('00','1','10'),('00','1','00'),('10','0','00')]
SA_algo.num_refs = 8
SA_algo.index_bits = 1
SA_algo.num_rows = 2
SA_algo.setAssoc = 2
SA_algo.SA_updateAll()
print(SA_algo)