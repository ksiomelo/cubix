'''
Created on Oct 3, 2012

@author: cassiomelo
'''

from django.db import models
from djangotoolbox.fields import SetField, ListField,EmbeddedModelField
from fca import Context,ConceptLattice

from fca import ConceptLattice, Context
from fca.algorithms.filtering.probability import compute_probability
from fca.algorithms.filtering.stability import (compute_estability, compute_istability)
from fca.algorithms.filtering.separation import compute_separation_index
from fca.algorithms.filtering.extentsize import compute_extent_size
from fca.algorithms.filtering.confidence import compute_confidence
from fca.algorithms.filtering.similarity import compute_similarity

def extract_tree(lattice_original, criteria):
    lattice = lattice_original.clone()
    
#    scores_sep = compute_separation_index(lattice)
#    scores_prob = compute_probability(lattice)
#    scores_supp = compute_extent_size(lattice) 
    
    
    link_score = False
    if (criteria == 'istability'):
        scores = compute_istability(lattice)
    elif (criteria == 'estability'):
        scores = compute_estability(lattice)
    elif (criteria == 'esupport'):
        scores = compute_extent_size(lattice)
    elif (criteria == 'separation'):
        scores = compute_separation_index(lattice)
    elif (criteria == 'probability'):
        scores = compute_probability(lattice)
    elif (criteria == 'confidence'):
        scores = compute_confidence(lattice)
        link_score = True 
    elif (criteria == 'similarity'):
        scores = compute_similarity(lattice) 
        link_score = True
    elif (criteria == 'root-distance'):
        scores = compute_extent_size(lattice) # TODO
    else:
        scores = compute_istability(lattice) # default: istability TODO replicar
    
    
    for current in lattice._concepts:
        
        if len(lattice.parents(current)) > 1:
            max = -1
            parent_selected = None
            for parent in lattice.parents(current): # First iteration selects the best parent
                
#                if parent not in remaining_concepts:
#                    remaining_concepts.append(parent)
                if link_score:
                    cur_concept_score = scores[current.concept_id][parent.concept_id]
                else:
                    cur_concept_score = scores[current.concept_id]
                    
                if (cur_concept_score >= max):
                    parent_selected = parent
                    max = cur_concept_score
            
            if parent_selected == None: raise Exception("Couldn't select a parent for :"+str(current)) 
            
            for parent in lattice.parents(current): # second iteration removes all other parents
                if (parent != parent_selected):
                    lattice.unlink(parent, current)
                    
    
    return lattice
                    

#class TransformStats(models.Model):
#    n_concepts = models.IntegerField()
#    n_edges = models.IntegerField()
#    tree = models.ForeignKey(ConceptLattice, editable=False,blank=True, null=True)

      
        
if __name__ == '__main__':
 
    ct = [[True, True, False, False], [False, False, True, True], \
          [True, False, True, True], [False, True, False, False], \
          [False,False,False,True], [True, False, False, False]]
    objs = ['lion', 'finch', 'eagle', 'hare', 'ostrich', 'snake']
    attrs = ['preying', 'mammal', 'flying', 'bird']
    c = Context()
    c._table=ct
    c._attributes=attrs
    c._objects=objs
    cl = ConceptLattice(c,None)
    cl._context=c
    cl.compute_lattice()
    
    tree = extract_tree(cl, "istability")
    print tree;
    