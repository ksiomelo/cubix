from django.db import models
from djangotoolbox.fields import SetField
from pymongo.objectid import ObjectId
from workspace.models import Workspace
'''
Created on Nov 7, 2013

@author: cassiomelo
'''


class Extension(models.Model):
    workspace = models.ForeignKey(Workspace, editable=False,blank=True, null=False)
    
    title = models.CharField(max_length=70)
    description = models.CharField(max_length=200)
    extension_file = models.FileField(upload_to='extensions/')