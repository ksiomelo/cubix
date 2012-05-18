from django.db import models
from djangotoolbox.fields import SetField, ListField,EmbeddedModelField


#class Graph(models.Model):
#    links = ListField(EmbeddedModelField('Link'))
#
#class Link(models.Model):
#
#    parent = EmbeddedModelField('Node')
#    child = EmbeddedModelField('Node')
#
#class Node(models.Model):
#    extent = SetField() # set of strings e.g. "Gene-Bmp4"
#    intent = SetField() # set of strings



