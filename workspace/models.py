'''
Created on Jul 18, 2012

@author: cassiomelo
'''
from django import forms
from django.db import models
from djangotoolbox.fields import SetField, ListField,EmbeddedModelField, DictField
from django.contrib.auth.models import User
from django.template.defaultfilters import slugify
from fca import Context,ConceptLattice
import os.path


class Workspace(models.Model):
    title = models.CharField(max_length=70)
    title_slug = models.SlugField(unique=True,blank=True)
    #owner = models.CharField(max_length=200)
    owner = models.ForeignKey(User, editable=False,blank=True, null=True)
    contexts = ListField(EmbeddedModelField('ContextFile')) #ListField()#
    
#    def save(self, *args, **kwargs):
#        try: 
#            existing_workspace = Workspace.objects.get(title_slug__exact=self.title_slug)
#            
#            if existing_workspace.id != self.id:
#                raise forms.ValidationError('Title slug already taken.')
#            else:
#                super(Workspace, self).save(*args, **kwargs)
#        except Exception,e:
#            super(Workspace, self).save(*args, **kwargs)
            
            
            
#        #if self.id != len(Workspace.objects.filter(title_slug=self.title_slug)) > 0:
#            raise forms.ValidationError('Title slug already taken.')
#        else:
#            super(Workspace, self).save(*args, **kwargs)



class ContextFile(models.Model):
    cxtfile = models.FileField(upload_to='contexts/%Y/%m/%d')
    
    
    title = models.CharField(max_length=200)
    owner = models.ForeignKey(User, editable=False,blank=True, null=True)
    workspace = models.ForeignKey(Workspace, editable=False,blank=True, null=True)
    context = models.ForeignKey(Context, editable=False,blank=True, null=True)
    lattice = models.ForeignKey(ConceptLattice, editable=False,blank=True, null=True)
    
    disabled_attrs = ListField()
    #meta.DateTimeField('create_date', 'date created'),
    
    def filename(self):
        return os.path.basename(self.cxtfile.name)



#class Link(models.Model):
#
#    parent = EmbeddedModelField('Node')
#    child = EmbeddedModelField('Node')
#
#class Node(models.Model):
#    extent = SetField() # set of strings e.g. "Gene-Bmp4"
#    intent = SetField() # set of strings

