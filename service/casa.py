'''
Created on Apr 26, 2012

@author: cassiomelo
'''
class Casa():
    
    def __init__(self, title,objects,attributes,rels):
        """Initialize a concept with given extent and intent """
        self.title = title
        self.objects = objects
        self.attributes = attributes
        self.rels = rels
        
    def to_dict(self, is_list=False):
        concept = {}
        concept["title"] = self.title
        concept["objects"] = self.objects
        concept["attributes"] = self.attributes
        concept["rels"] = self.rels
        return concept