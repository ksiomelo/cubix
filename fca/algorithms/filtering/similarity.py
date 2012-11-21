"""
Created on 12.02.2010

@author: jupp
"""

def compute_similarity(lattice):
    similarity_index = {}
    
    for c1 in lattice:
        for c2 in lattice:
            if not (c1.concept_id in similarity_index and c2.concept_id in similarity_index[c1.concept_id]):
                if c1.concept_id not in similarity_index:
                    similarity_index[c1.concept_id] = {}
                if c2.concept_id not in similarity_index:
                    similarity_index[c2.concept_id] = {}
                    
                    
                if c1 == c2:
                    similarity_index[c1.concept_id][c2.concept_id] = similarity_index[c2.concept_id][c1.concept_id]  = .0
                    continue 
                
                n1 = float(len(set(c1.extent).intersection(set(c2.extent))))
                d1 = float(len(set(c1.extent))+len(set(c2.extent)))
                n2 = float(len(set(c1.intent).intersection(set(c2.intent))))
                d2 = float(len(set(c1.intent))+len(set(c2.intent)))
                 
                p1 =  0
                p2 =  0
                
                if d1 != 0:
                    p1 = n1 / d1
                if d2 != 0:
                    p2 = n2 / d2
                
                sim =  p1 + p2
                
                similarity_index[c1.concept_id][c2.concept_id] = similarity_index[c2.concept_id][c1.concept_id]  = sim
    
    
        
    return similarity_index

