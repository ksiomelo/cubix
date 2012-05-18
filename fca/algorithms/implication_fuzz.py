# -*- coding: utf-8 -*-
"""
Holds functions that compute implication covers for a given context 
"""
import copy

import closure_operators
from fca.implication import Implication
import fca
from fca.concept_lattice import ConceptLattice
from fca.association_rule import AssociationRule
from fca.concept_link import ConceptLink



#class AssociationRule(object):
#    premise = None
#    conclusion = None
#    type = ""
#    premise_supp = 0
#    conclusion_supp = 0
#    confidence = 0
#    
#    def __init__(self,p, p_supp, c, c_supp, conf):
#        self.premise = p
#        self.conclusion = c
#        self.premise_supp = p_supp
#        self.conclusion_supp = c_supp
#        self.confidence = conf
        

class ImplicationSet(object):
    
    dependencies = None
    
    def __init__(self):
        self.dependencies = []
    
    def add_dependency(self, implication):
        self.dependencies.append(implication)
    
    def set_closure(self, to_close):
        
        if not self.dependencies : 
            return False
        
        toquit = False
        modified = False
        
        while (not toquit) :
            toquit = True
            
            for imp in self.dependencies :
            
                if (AssociationRulesMiner.is_superset_of(to_close,imp.premise)) :
                    cmp2 = AssociationRulesMiner.compare_sets(to_close,imp.conclusion);
                    if (1 == cmp2 or -1 == cmp2) :
                        AssociationRulesMiner.or_array(to_close,imp.conclusion)
                        toquit = False
                        modified = True

        return modified;
    
    
class AssociationRulesMiner(object):
    #NextClosedSetImplicationCalculator

    objInImpl = 0
    attrSet = []
    closedObjects = []
    allAttrSet = None
    cxt = None
    nextClosure = None
    impSet = None
    nextElementInLecticalOrder = None
    
    numAttr = 0
    numObjs = 0
    maxDepth = 0
    
    def __init__(self,cxt, min_support=0):
        self.cxt = cxt
        self.allAttrSet = [ True for x in cxt[0]]
        self.impSet = ImplicationSet()
        self.nextElementInLecticalOrder = [ False for x in cxt[0]]
        self.nextClosure = [ False for x in cxt[0]]
        self.attrSet = [ False for x in cxt[0]]
        
        self.numAttr = len(self.cxt[0])
        self.numObjs = len(self.cxt)
        self.maxDepth = min(self.numAttr, self.numObjs) + 1
        

    def find_exact_dependencies(self):#, cxt, min_support=0):
            
        #nextClosure.clearSet();
        
        while True :
            
            self.zero_closure_attr()
            
            if self.is_empty(self.attrSet) : break
            
#            int acceptRes = acceptImplication(nextClosure, attrSet);
#            if (acceptRes == AttributeExplorationCallback.STOP) {
#                return;
#            }
#            if (acceptRes == AttributeExplorationCallback.ACCEPT) {
#                addImplication(nextClosure, attrSet);
#                break;
#            }
            
        #attrSet - last closed pseudointent
        
        
        next_closed_set = [ False for x in range(0,self.numAttr) ]
        not_j = [ False for x in range(0,self.numAttr) ]
        
        j = self.numAttr - 1
        while j >= 0 :
            #that is a not equal g
            j = self.numAttr - 1
            
            self.clear_array(not_j)
            
            while j >= 0 :
                
                not_j[j] = True
                
                if not self.attrSet[j] :
                    #nextClosedSet.copy(attrSet);
                    self.copy_array(next_closed_set,self.attrSet)
                    self.and_not(next_closed_set,not_j)
                    
                    if (self.closure_impl(next_closed_set, j, not_j)) : #  isPseudoIntentPart1
                    #for all Q \subseteq P  Q" \subseteq P should also hold
                        if (not self.is_attrset_closed(next_closed_set)) :
                            
                            self.and_not(self.nextClosure,next_closed_set)
                            
                            # THIS IS FOR ATTRIBUTE EXPLORATION
                            #int acceptRes = acceptImplication(nextClosedSet, nextClosure);
                            #if (acceptRes == AttributeExplorationCallback.STOP) {
                            #    return;
                            #}
                            #if (acceptRes == AttributeExplorationCallback.ACCEPT) {
                            #    addImplication(nextClosedSet, nextClosure);
                            
                            ar = AssociationRule(premise=next_closed_set[:], premise_supp=self.objInImpl,\
                                                 conclusion=self.nextClosure[:], conclusion_supp=self.objInImpl,confidence=1)
                            
                            self.impSet.add_dependency(ar)
                            
                            #} else {
                            #    break; // restart after rejection of current implication
                            #}
                        self.copy_array(self.attrSet,next_closed_set)
                        break;

                j -= 1 
        
        return self.impSet.dependencies
    
    
    
    
    def find_approximate_dependencies(self, lattice, minSupp, conf):
        edge_list = self.calculate_confidence(lattice)
        for edge in edge_list:
            premise = lattice._concepts[edge._parent]
            conclusion = lattice._concepts[edge._child]
            
            # temp = conclusion[:] # ModifiableSet temp = conclusion.getAttribs().makeModifiableSetCopy();
            temp = self.and_not2(conclusion.intent, premise.intent) # temp.andNot(premise.getAttribs());
            
            ar2 = AssociationRule(premise=premise.intent, premise_supp=len(premise.extent),\
                                                 conclusion=temp, conclusion_supp=len(conclusion.extent),confidence=edge.confidence)
            self.impSet.add_dependency(ar2)
           
            #AssociationRule(premise.getAttribs(), premise.getObjCnt(), temp, conclusion.getObjCnt());
        return self.impSet.dependencies
      
      
    def calculate_confidence(self,lattice):
        edge_list = []
        
        c_list = [lattice.get_top_concept()]
        for concept in c_list:
            children = lattice.children(concept)
            for child in children:
                parent_id = lattice.index(concept)
                child_id = lattice.index(child)
                confidence = len(child.extent)/float(len(concept.extent))
                
                if confidence > 0 :
                    #edge_list.append(ConceptLink(parent_id, child_id, confidence)) 
                    #edge_list.append(ConceptLink(_parent=concept, _child=child, confidence=confidence)) 
                    edge_list.append(ConceptLink(_parent=parent_id, _child=child_id, confidence=confidence)) 
                c_list.append(child)
                
        return edge_list
                
    
    
    
    def zero_closure_attr(self):
    
        # numObj = len(self.cxt);#getObjectCount();
        # numAttr = len(self.cxt[0])
        
        attrSet = self.allAttrSet[:] #attrSet.copy(allAttrSet);
        for i in range(0,self.numObjs) :
            for j in range(0,self.numAttr) :
                attrSet[j] &= (self.cxt[i][j]);
            
        self.closedObjects = [True for x in self.cxt]
        #objInImpl = getObjectCount();
    
    def create_set(self, num):
        #return [False for x in range(0,num)]
        [False]*num
    
    def and_not(self, arr1, arr2):
        for i in range(len(arr1)) :
            arr1[i] &= not arr2[i] 
    
    def and_not2(self, arr1, arr2):
        ret = []
        for coisa in arr1 :
            if not coisa in arr2 :
                #arr1.remove(coisa)
                ret.append(coisa)
        return ret
            
    def and_array (self, arr1, arr2):
        if arr1 == arr2 : return
        
        for i in range(len(arr1)) :
            arr1[i] &= arr2[i] 
    
    @staticmethod 
    def or_array (arr1, arr2):
        if arr1 == arr2 : return
        
        for i in range(len(arr1)) :
            arr1[i] |= arr2[i] 
    
    def copy_array(self, arr1, arr2):
        if len(arr1) != len(arr2) : 
            arr1 = [ x for x in arr2]
        else :
            for i in range(len(arr2)) :
                arr1[i] = arr2[i]
    
    def clear_array(self,arr1):
        for i in range(len(arr1)) :
                arr1[i] = False
                
    def is_equals(self, arr1, arr2):
        if len(arr1) != len(arr2) : return False
        else :
            for i in range(len(arr1)) : 
                if arr1[i] != arr2[i] : return False
        return True
    
    def is_empty(self,arr1):
        if not arr1 : return True
        for i in range(len(arr1)) : 
            if arr1[i] : return False
        return True
    
    
    @staticmethod
    def is_superset_of(arr1, arr2):
        return AssociationRulesMiner.is_subset_of(arr2, arr1)
    
    @staticmethod
    def is_subset_of(arr1, arr2):
        if arr1 == arr2 : return True
        
        u1 = AssociationRulesMiner.get_unit(arr1) 
        u2 = AssociationRulesMiner.get_unit(arr2)
        
        if u1 != (u1 & u2): return False
        else : return True
    
    @staticmethod
    def compare_sets(arr1, arr2):
        if arr1 == arr2 : return 0 #equals
        
        u1 = AssociationRulesMiner.get_unit(arr1) 
        u2 = AssociationRulesMiner.get_unit(arr2)
        tmp = (u1 & u2)
        
        if u1 == tmp: return 1 # 1 subset of 2
        elif u2 == tmp: return 2 # 1 superset of 2
        else : return -1 # not comparable
    
    @staticmethod
    def get_unit(arr1):
        soma = 0
        
        for i in range(len(arr1)) :
            
            bit = 0
            if ( arr1[i] ) : 
                bit = 1 
               
            inv_idx = (len(arr1)-1) - i
            
            soma += bit * pow(2,inv_idx)
            
        return soma

    
    def closure_impl(self, possible_pseudo_intent, j, not_j):
    
        self.copy_array(self.nextClosure, possible_pseudo_intent)
        
        possible_pseudo_intent[j] = True 
        
        self.impSet.set_closure(possible_pseudo_intent);
        
        self.copy_array(self.nextElementInLecticalOrder, possible_pseudo_intent)
        self.and_not(self.nextElementInLecticalOrder, not_j)
        
        return self.is_equals(self.nextClosure, self.nextElementInLecticalOrder)
    
    
    def is_attrset_closed(self, theset) :
        
        self.copy_array(self.nextClosure, self.allAttrSet)
        
        self.objInImpl = 0
        
        for i in range(len(self.cxt)-1,-1,-1) : #for (int i = rel.getRowCount(); --i >= 0;) {
            
            tmp = self.cxt[i]

            if (AssociationRulesMiner.is_subset_of(theset,tmp)) :
                self.and_array(self.nextClosure,tmp)
                self.objInImpl += 1
        
        return self.is_equals(self.nextClosure, theset)                 






def test_it():
    
    ct = [[True, True, False, False], [False, False, True, True], \
      [True, False, True, True], [False, True, False, False], \
      [False,False,False,True]]
    objs = ['lion', 'finch', 'eagle', 'hare', 'ostrich']
    attrs = ['preying', 'mammal', 'flying', 'bird']
    c = fca.Context(ct, objs, attrs)
    cl = ConceptLattice(c)
    
    
    miner = AssociationRulesMiner(c)
    #dependencies = miner.find_exact_dependencies()
    dependencies = miner.find_approximate_dependencies(cl, 0.1, 0.25)
    
    
    print(dependencies)
#    imp_basis = compute_implication_cover(cxt, closure_operators.closure)
#    print_basis(imp_basis)
#    minimize(imp_basis)
#    print(len(imp_basis))
#    for imp in imp_basis:
#        print imp
            
            
            
            