import csv,sys,os
import numpy as np
from networkx import Graph
sys.path.append(os.path.join("..","tests","data"))

## a basic class to handle distance matrices used to describe pairwise relationships between 
# genes in a gene set.

class DistanceMatrix:
    ## Constructor. Makes an object reprensentation of a distance matrix.
    # @param convention is to use the species common name i.e. 'yeast', 'mouse' and 'human'.
    # @param a csv saved version of a distance matrix (see example in ../tests/data)
    def __init__(self,species,csvFile,forceInt=False):
        self.species = species
        self.csvFile = csvFile
        self.forceInt = forceInt
        self.load_pairwise_distance_from_csv()
        self.get_descriptive_stats()

    ## loads a dictionary that represents a pairwise distance matrix
    # also creates a unique list of the individual genes in the matrix 
    def load_pairwise_distance_from_csv(self):
        reader = csv.reader(open(self.csvFile,'r'))
        self.pairwiseDict = {}
        header = reader.next()
        
        self.geneNames = set([])

        for linja in reader:
            geneI = linja[0]
            geneJ = linja[1]
            dist = float(linja[2])

            if dist != 1e8:
                key = geneI + "#" + geneJ
                if self.forceInt == False:
                    self.pairwiseDict[key] = dist        
                else:
                    self.pairwiseDict[key] = int(dist)
                self.geneNames.update([geneI])

        self.geneNames = list(self.geneNames)
        self.geneNames.sort()

    def create_distribution(self):
        self.distances = np.array(self.pairwiseDict.values())

    ## returns the distance for given nodes i and j
    def get_dist(self,nodeI,nodeJ):
        key1 = nodeI + "#" + nodeJ
        key2 = nodeJ + "#" + nodeI

        if self.pairwiseDict.has_key(key1) == True:
            return self.pairwiseDict[key1]
        elif self.pairwiseDict.has_key(key2) == True:
            return self.pairwiseDict[key2]
        else:
            return None

    ## return a networkx graph given a set of genes
    def get_nx_graph(self,geneList):
        
        G = Graph()
        for i in range(len(geneList)):
            geneI = geneList[i]
            for j in range(len(geneList)):
                geneJ = geneList[j]
                dist = self.get_dist(geneI,geneJ)

                if dist != None:
                    G.add_edge(geneI,geneJ,weight=dist)
        return G


    ## return descriptive stats of the distance matrix
    def get_descriptive_stats(self):
        
        allDistances = np.zeros(len(self.pairwiseDict.keys()))
        i = 0
        for val in self.pairwiseDict.itervalues():
            allDistances[i] = val
            i+=1
        allDistances.sort()

        self.stats = {'mean':allDistances.mean(),
                      'std':allDistances.std(),
                      'min':allDistances.min(),
                      'max':allDistances.max(),
                      '75th':allDistances[int(round(0.75*allDistances.size))]}
        
        #import matplotlib.pyplot as plt
        #plt.hist(allDistances)
        #plt.show()
        
