from django.db import models
from models import Concept
# -*- coding: utf-8 -*-
"""
Contains base class for formal concept
"""
class Metric(models.Model):
    concept = models.ForeignKey(Concept)
    name = models.CharField(max_length=200)
    value = models.CharField(max_length=100)
    calc_date = models.DateTimeField('date calculated')
    def __unicode__(self):
        return u"%s %s" % (self.name, self.value)
    