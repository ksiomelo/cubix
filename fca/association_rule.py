from django.db import models
from djangotoolbox.fields import ListField, SetField, EmbeddedModelField,DictField
# -*- coding: utf-8 -*-
"""
Contains base class for formal concept
"""

class AssociationRule(models.Model):
    premise = SetField()
    conclusion = SetField()
    premise_supp = models.IntegerField()
    conclusion_supp = models.IntegerField()
    confidence = models.DecimalField(max_digits=5, decimal_places=1)
    
    def to_dict(self, is_list=False):
        ar = {}
        ar["premise"] = self.premise
        ar["conclusion"] = self.conclusion
        ar["premise_supp"] = self.premise_supp
        ar["conclusion_supp"] = self.conclusion_supp
        ar["confidence"] = self.confidence
        return ar