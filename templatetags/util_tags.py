'''
Created on Aug 4, 2012

@author: cassiomelo
'''
from django.template import Library

register = Library()

def get_item(d, key_name):
    return d[key_name]

def commify(d):
    return ", ".join(d)

#getitem = register.filter('getitem', getitem)
register.filter('get_item', get_item)
register.filter('commify', commify)

