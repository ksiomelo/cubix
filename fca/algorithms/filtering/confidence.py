"""
Created on 12.02.2010

@author: jupp
"""
from __future__ import division

# THIS IS AN ASSYMETRIC MEASURE
def compute_confidence(lattice):
    confidence_index = {}
    
    for c1 in lattice:
        for c2 in lattice:
            if c1 != c2:
                if c1.concept_id not in confidence_index:
                    confidence_index[c1.concept_id] = {}
                
                if len(c2.extent) == 0:
                    sim = 0
                else:
                    sim = float(len(set(c1.extent).intersection(set(c2.extent)))) / float((len(c2.extent))) 
                
                confidence_index[c1.concept_id][c2.concept_id]  = sim
    
    
        
    return confidence_index

