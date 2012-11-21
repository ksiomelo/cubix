#!/usr/bin/env python
from networkx import Graph


############################################################################### 
'''
make_input_graph
creates an input graph from a dictionary of objects (genes) and edges where the keys
are '#' deliminated and the values are the edge weight

Note that the syntax of this function is specific to networkx version >= 1.0
                
'''
############################################################################### 

def make_input_graph(distDict,objectList):
    G = Graph()
    for edge,distance in distDict.iteritems():
        objectI,objectJ = edge.split('#')
        if objectI not in objectList:
            print "WARNING: object in edges that is not in objectList",objectI
            continue
        if objectJ not in objectList:
            print "WARNING: object in edges that is not in objectList",objectJ
            continue

        if distance != None:
            G.add_edge(objectI,objectJ,weight=distance)

    return G


############################################################################### 
'''
combine_affinity_matrices(list):


'''


def combine_affinity_matrices(affinityMatrixList, geneListList):
    pass
