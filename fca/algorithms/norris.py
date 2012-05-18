# -*- coding: utf-8 -*-
"""Holds implementation of Norris' algorithm"""

from copy import copy
from fca import Concept, ConceptSystem, concept_link

def derivation(context, extent=0, intent=0):
    """Return result of derivation operator applied to intent or extent.
    If extent==0 applied to intent and
    if intent==0 applied to extent

    TODO: May be move to context module
    TODO: A lot of lines, rewrite shorter
    TODO: !!! Seems to be useless in this module

    Examples
    ========
    >>> from fca import Context
    >>> ct = [[True, False, False, True],\
              [True, False, True, False],\
              [False, True, True, False],\
              [False, True, True, True]]
    >>> objs = [1, 2, 3, 4]
    >>> attrs = ['a', 'b', 'c', 'd']
    >>> c = Context(ct, objs, attrs)
    >>> derivation(c, extent=set([1, 2]))
    set(['a'])
    >>> derivation(c, intent=set(['b', 'c']))
    set([3, 4])

    """
    result = set()
    if intent != 0: # if we apply to intent
        if intent == set(context._attributes):
            return set()
        elif len(intent) == 0:
            return set(context._objects)
        else:
            first_attr = True
            for attr in intent:
                objects = set()
                index = context._attributes.index(attr)
                for j in xrange(len(context)):
                    if context[j][index]: # if object has attribute
                        objects.add(context._objects[j])
                # if first_attr - result is empty set and we cant intersect it
                # with objects
                if first_attr:
                    result = copy(objects)
                    first_attr = False
                else:
                    result &= objects
                if len(result) == 0:
                    # if result become empty there are no meaning to complete
                    # computation
                    return result
            return result
    else: # extent
        if extent == set(context._objects):
            return set()
        elif len(extent) == 0:
            return set(context._attributes)
        else:
            first_attr = True
            for obj in extent:
                attrs = set()
                index = context._objects.index(obj)
                for j in xrange(len(context[index])):
                    if context[index][j]: # if attribute has object
                        attrs.add(context._attributes[j])
                # if first_attr - result is empty set and we cant intersect it
                # with attrs 
                if first_attr:
                    result = copy(attrs)
                    first_attr = False
                else:
                    result &= attrs
                if len(result) == 0:
                    # if result become empty there are no meaning to complete
                    # computation
                    return result
            return result
                        

def norris(context):
    """Build all concepts of a context
    
    Based on the Norris' algorithm for computing the maximal rectangles
    in a binary relation.

    Returns the ConceptSystem instance with a full set of concepts

    Examples
    ========

    >>> from fca import Context, ConceptLattice
    >>> ct = [[True, False, False, True],\
              [True, False, True, False],\
              [False, True, True, False],\
              [False, True, True, True]]
    >>> objs = [1, 2, 3, 4]
    >>> attrs = ['a', 'b', 'c', 'd']
    >>> c = Context(ct, objs, attrs)
    >>> cl = ConceptLattice(c, builder=norris)
    >>> print cl
    ([], M)
    ([1], ['a', 'd'])
    ([2], ['a', 'c'])
    ([1, 2], ['a'])
    ([3, 4], ['b', 'c'])
    ([2, 3, 4], ['c'])
    (G, [])
    ([4], ['b', 'c', 'd'])
    ([1, 4], ['d'])

    """
    # To be more efficient we store intent (as Python set) of every 
    # object to the list
    # TODO: Move to Context class?
    examples = []
    for ex in context.examples():
        examples.append(ex)
    
    cs = [Concept(extent=set(), intent=set(context._attributes))]
    for i in xrange(len(context)):
        # TODO:
        cs_for_loop = cs[:]
        for c in cs_for_loop:
            if c.intent.issubset(examples[i]):
                c.extent.add(context._objects[i])
            else:
                new_intent = c.intent & examples[i]
                new = True
                for j in xrange(i):
                    if new_intent.issubset(examples[j]) and\
                       context._objects[j] not in c.extent:
                        new = False
                        break
                if new:
                    appe = Concept(extent=(set([context._objects[i]]) | c.extent), intent=new_intent)
                    cs.append(appe)
    return (cs, compute_covering_relation(cs))


def compute_covering_relation(cs):
        """Computes covering relation for a given concept system.

        Returns a dictionary containing sets of parents for each concept.

        Examples
        ========

        """
        parents = dict([(c, set()) for c in cs])
        links = []

        for i in xrange(len(cs)):
            for j in xrange(len(cs)):
                if cs[i].intent < cs[j].intent:
                    parents[cs[j]].add(cs[i])
                   
                    #add_link(links, cs[i], cs[j])
                    add_link(links, i, j)
                    
                    for k in xrange(len(cs)):
                        if cs[i].intent < cs[k].intent and\
                           cs[k].intent < cs[j].intent:
                                parents[cs[j]].remove(cs[i])
                                remove_link(links, i, j)
                                break
        return links

def remove_link(thelinks, parent, child):
    for link in thelinks :
        if link._parent == parent and link._child == child :
            thelinks.remove(link)

def add_link(thelinks, parent,child):
    cl = concept_link.ConceptLink(_parent=parent, _child=child)
    if not cl in thelinks :
        thelinks.append(cl)

if __name__ == "__main__":
    import doctest
    doctest.testmod()

