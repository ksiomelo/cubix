# -*- coding: utf-8 -*-
"""Holds implementation of Norris' algorithm"""

from copy import copy
from fca import Concept, ConceptSystem,ConceptLink

#from fca.algorithms.incremental import derivation

def add_object(object, intent, lattice):
    
    sup_g = lattice.get_bottom_concept()
    
    sup_g.intent | intent #{Adjust (sup(G)) for new elements in E'}
    if len(sup_g.intent) == 0 and len(sup_g.extent) == 0:     # IF sup(G) = (Ø, Ø) THEN
        sup_g = Concept(intent=intent, extent=set(object))#Replace sup(G) by: ({x*},f({x*}))
    else:
        if not intent <= sup_g.intent: #IF NOT (f*({x*}) ⊆ X'(sup(G))) THEN
            if len(sup_g.extent) == 0: # IF X(sup(G)) = Ø THEN X'(sup(G)) := X'(sup(G)) ∪ f({x*})
                sup_g.intent |=  intent
            else:
                h = Concept(extent=set(), intent=(sup_g.intent | intent)) #Add new pair H {becomes sup(G*)}: (Ø,X'(sup(G)) ∪ f({x*}));
                lattice._concepts.append(h)
                cl = ConceptLink(_parent=sup_g, _child=h) #Add new edge sup(G)->H
                lattice._links.append(cl)
        
    #C[i] <- {H: ||X'(H)||=i}; {Class pairs in buckets with same cardinality of the X' sets}
    card = []
    sorted_card = sorted(lattice._concepts, key=lambda c: len(c.intent))
    cur_card = 0;
    row = []
    for c in sorted_card:
        if cur_card == len(c.intent):
            row.append(c)
        else:
            cur_card = len(c.intent)
            card.append(row) 
            row = [c] #TODO does it empty ??
    card.append(row) 
    
    max_card = len(sorted_card[-1].intent)
    #card_prime = []# C'[i] <- Ø; {Initialize the C' sets}
    card_prime = [ [] for i in range(0,max_card+1)]
    
    for i in range(0,max_card+1): # TODO does it take the max? # FOR i : 0 TO maximum cardinality DO
        for h in card[i]:#FOR each pair H in C[i]
            if h.intent <= intent: #IF X'(H) ⊆ f({x*}) THEN
                print "modified pair:"+str(h.intent) # {modified pair}
                h.extent.add(object)#Add x* to X(H);
                card_prime.insert(i,[h]) # Add H to C'[i] ;
            if h.intent == intent: #IF X'(H) = f({x*}) THEN exit algorithm
                return
            else:#{old pair}
                int = h.intent & intent# int <- X'(H) ∩ f({x*});
            
            #IF ¬∃ H1 ∈ C'[||int||] such that X'(H1)=Int THEN {H is a generator}
            exists_h1 = False
            for c_p in card_prime[len(int)]:
                if c_p.intent == int:
                    exists_h1 = True
                    break
            if not exists_h1:
                h_n = Concept(extent=(h.extent | set([object])), intent=int)#Create new pair Hn= (X(H) ∪{x*},int) and add to C'[||int||];
                if not card_prime[len(int)]:
                    card_prime[len(int)] = []
                card_prime[len(int)].append(h_n)
                
                cl2 = ConceptLink(_parent=h_n, _child=h) #Add edge Hn -> H;
                lattice._links.append(cl2)
                #{Modify edges}
                for j in range(0,len(int)):#FOR j : 0 TO ||int||-1
                    for h_a in card_prime[j]:#FOR each Ha ∈ C'[j]
                        if h_a.intent < int:#IF X'(Ha ) ⊂ int {Ha is a potential parent of Hn}
                            parent = True
                            
                            for h_d in lattice.children(h_a): #FOR each Hd child of Ha
                                if h_d.intent < int: #IF X'(Hd ) ⊂ Int parent<-false; exit FOR END IF
                                    parent = False
                                    break
                            if parent: #IF parent
                                if lattice.parents(h).index(h_a) >= 0: #IF Ha is a parent of H
                                    lattice.unlink(h_a, h)#eliminate edge Ha->H END IF;
                                cl3 = ConceptLink(_parent=h_a, _child=h_n) #Add edge Ha->Hn
                                lattice._links.append(cl3)
                if int == intent: # IF Int=f*({x*}) THEN exit algorithm END IF
                    return 

    
        

def test_incremental():
    from fca import ConceptLattice, Context
    ct = [[True, True, False, False], [False, False, True, True], \
        [True, False, True, True], [False, True, False, False], \
        [False,False,False,True]]
    objs = ['lion', 'finch', 'eagle', 'hare', 'ostrich']
    attrs = ['preying', 'mammal', 'flying', 'bird']
    c = Context()
    c._table=ct
    c._attributes=attrs
    c._objects=objs
    cl = ConceptLattice(c,None)
    cl._context=c
    cl.compute_lattice()
    
    add_object('snake', set(['preying','reptile']), cl, c)
    
    

