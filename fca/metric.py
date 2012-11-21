'''
Created on Oct 16, 2012

@author: cassiomelo
'''
from django.db import models
from djangotoolbox.fields import DictField
# -*- coding: utf-8 -*-
"""
Contains base class for formal concept
"""
class Metric(models.Model):
    name = models.CharField(max_length=70)
    human_name = models.CharField(max_length=100)
    scores = DictField(models.FloatField())
    link_score = models.BooleanField(default=False)
    
    
    
#    concept = models.ForeignKey(Concept)
#    name = models.CharField(max_length=200)
#    value = models.CharField(max_length=100)
#    calc_date = models.DateTimeField('date calculated')
#    def __unicode__(self):
#        return u"%s %s" % (self.name, self.value)
#

    def flatten_scores(self): # TODO optimize, avoid this operation
        ret = {}
        for id1, scores1 in self.scores.items():
            for id2, val in scores1.items():
                ret[id1+"-"+id2] = val
        self.scores = ret;
    
    def to_dict(self):
        
        if (self.name == 'istability'):
            self.human_name = 'Stability (Intent)';
        elif (self.name == 'esupport'):
            self.human_name = 'Support (Extent)';
        elif (self.name == 'separation'):
            self.human_name = 'Separation';
        elif (self.name == 'probability'):
            self.human_name = 'Probability';
        elif (self.name == 'confidence'):
            self.human_name = 'Confidence';
        elif (self.name == 'similarity'):
            self.human_name = 'Similarity';
        
        
        metric = {}
        metric["name"] = self.name
        metric["human_name"] = self.human_name
        metric["link_score"] = self.link_score
        
#        scores_dict = {}
#        for key, value in self.scores.items():
#            scores_dict[key] = value
        
        metric["scores"] = self.scores
        
        return metric