'''
Created on Jul 18, 2012

@author: cassiomelo
'''
from django import forms
from django.db import models
from djangotoolbox.fields import SetField, ListField,EmbeddedModelField
from django.contrib.auth.models import User
from django.template.defaultfilters import slugify
from fca import Context,ConceptLattice


class UserPrefs(models.Model):
    user = models.ForeignKey(User, editable=False,blank=True, null=True)
    current_visualisation = models.CharField(max_length=100)
    