from django.db import models
from djangotoolbox.fields import EmbeddedModelField
# -*- coding: utf-8 -*-
"""
Contains base class for formal concept
"""

class ConceptLink(models.Model):

    _parent = models.IntegerField()#EmbeddedModelField('Concept')
    _child = models.IntegerField()#EmbeddedModelField('Concept')
    confidence = models.DecimalField(max_digits=5, decimal_places=1)#IntegerField(default=0)#
    
    def __eq__(self, other):
        if isinstance(other, ConceptLink):
            return self._parent == other._parent and self._child == other._child
        return NotImplemented

    def __ne__(self, other):
        result = self.__eq__(other)
        if result is NotImplemented:
            return result
        return not result
    
    def to_dict(self, is_list=False):
        conceptLink = {}
        conceptLink["parent"] = self._parent
        conceptLink["child"] = self._child
        if (self.confidence):
            conceptLink["confidence"] = self.confidence
        
        return conceptLink