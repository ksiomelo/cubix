from django.db import models
from djangotoolbox.fields import SetField
from pymongo.objectid import ObjectId
#from concept_lattice import ConceptLattice
#from models import FormalAttribute, FormalObject
#from lattice_edge import LatticeEdge
# -*- coding: utf-8 -*-
"""
Contains base class for formal concept
"""

class Concept(models.Model):
#    lattice = models.ForeignKey("ConceptLattice")
#    formal_objects = models.ManyToManyField("FormalObject")
#    formal_attributes = models.ManyToManyField("FormalAttribute")
    # metric_set
   # parents = models.ManyToManyField("self", through='LatticeEdge', symmetrical=False)
    #children = models.ManyToManyField(self, through='ConceptLink', symmetrical=False)
    
    
#    
#    def __unicode__(self):
#        return self.id
    
    
    
    
    """ 
    A formal concept, contains intent and extent 
    
    Examples
    ========

    Create a concept with extent=['Earth', 'Mars', 'Mercury', 'Venus']
    and intent=['Small size', 'Near to the sun'].
    
    >>> extent = ['Earth', 'Mars', 'Mercury', 'Venus']
    >>> intent = ['Small size', 'Near to the sun']
    >>> c = Concept(extent, intent)
    >>> 'Earth' in c.extent
    True
    >>> 'Pluto' in c.extent
    False
    >>> 'Small size' in c.intent
    True

    Print a concept.

    >>> print c
    (['Earth', 'Mars', 'Mercury', 'Venus'], ['Near to the sun', 'Small size'])

    """
    concept_id = models.CharField(max_length=200, default=ObjectId)
    extent = SetField()
    intent = SetField()
    #meta = {}
    
#    def __init__(self, extent, intent):
#        """Initialize a concept with given extent and intent """
#        extent = set(extent)
#        intent = set(intent)
#        self.meta = {}
        
        

#    def __str__(self):
#        """Return a string representation of a concept"""
#        if len(self.intent) > 0:
#            e = list(self.extent)
#            e.sort()
#        else:
#            # TODO: Sometimes |intent| > 0, but extent is G.
#            e = "G"
#        if len(self.extent) > 0:
#            i = list(self.intent)
#            i.sort()
#        else:
#            # TODO: Sometimes |extent| > 0, but intent is M.
#            i = "M"
#        if len(self.meta.keys()) != 0:
#            s = " meta: {0}".format(self.meta)
#        else:
#            s = ""
#        return "({0}, {1}){2}".format(e, i, s)
    def __eq__(self, other):
        if isinstance(other, Concept):
            return self.extent == other.extent and self.intent == other.intent
        return NotImplemented

    def __ne__(self, other):
        result = self.__eq__(other)
        if result is NotImplemented:
            return result
        return not result
    
    def fix_set_field_bug(self):
        self.extent = set(self.extent)
        self.intent = set(self.intent)
    
    def to_dict(self, is_list=False):
        concept = {}
        concept["intent"] = self.intent
        concept["extent"] = self.extent
        return concept

#if __name__ == "__main__":
#    import doctest
#    doctest.testmod()
