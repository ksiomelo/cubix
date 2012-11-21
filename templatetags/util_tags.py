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

def xif(cond, args):
    if cond:
        return args.split(',')[0]
    else:
        return args.split(',')[1]



#getitem = register.filter('getitem', getitem)
register.filter('get_item', get_item)
register.filter('xif', xif)
register.filter('commify', commify)

