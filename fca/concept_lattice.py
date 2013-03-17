from algorithms import norris
from django.db import models
from processing import utils
from djangotoolbox.fields import ListField, SetField, EmbeddedModelField,DictField
#from models import Concept, Context
#from context import Context
#import fca.concept

class ConceptLattice(models.Model):
    
#    top_concept = models.ForeignKey("Concept", related_name='top_cpt')
#    context = models.ForeignKey("Context")
    
    
    
    """ConceptLattice class

    Examples
    ========
    
    >>> from fca import (Context, Concept)
    >>> ct = [[True, False, False, True],\
              [True, False, True, False],\
              [False, True, True, False],\
              [False, True, True, True]]
    >>> objs = ['1', '2', '3', '4']
    >>> attrs = ['a', 'b', 'c', 'd']
    >>> c = Context(ct, objs, attrs)
    >>> cl = ConceptLattice(c)
    >>> print cl
    ([], M)
    (['1'], ['a', 'd'])
    (['2'], ['a', 'c'])
    (['1', '2'], ['a'])
    (['3', '4'], ['b', 'c'])
    (['2', '3', '4'], ['c'])
    (G, [])
    (['4'], ['b', 'c', 'd'])
    (['1', '4'], ['d'])
    >>> print cl.parents(cl[5]) == set((cl[6],))
    True
    >>> print cl.children(cl[6]) == set((cl[5], cl[3], cl[8]))
    True

    """
   
    _top_concept =  EmbeddedModelField('Concept')
    _bottom_concept =  EmbeddedModelField('Concept')
    _context = EmbeddedModelField('Context')
    _concepts =  ListField(EmbeddedModelField('Concept'))
    _links = ListField(EmbeddedModelField('ConceptLink'))
    _attr_lattices = models.TextField() #EmbeddedModelField('ConceptLattice')
    _attr_graph= models.TextField()
    original_id = models.CharField(max_length=200)
    
    metrics = ListField(EmbeddedModelField('Metric'))
    
    one = None
    zero = None
    
#    def __init__(self, context, builder=norris):
#        if builder != "dont" : 
#            (_concepts, self._parents) = norris(context)
#        _bottom_concept = [c for c in self._concepts if not self.ideal(c)][0]
#        _top_concept = [c for c in self._concepts if not self.filter(c)][0]
#        _context = context
#        self.one = None
#        self.zero = None
  
    def compute_lattice(self, builder=norris):
        print "computing lattice.."
        if self._context is None :
            raise Exception("context is not set")
        if builder != "dont" : 
            (self._concepts, self._links) = norris(self._context)
        self._bottom_concept = [c for c in self._concepts if not self.ideal(c)][0]
        self._top_concept = [c for c in self._concepts if not self.filter(c)][0]
        #_context = context
        self.one = None
        self.zero = None
        print "done! computing attribute lattices.."
        self.compute_attribute_lattices()
        print "done! computing attribute graph.."
        self.compute_attribute_graph()
        print "done!"
        
    def compute_attribute_graph(self):
        
        attr_lattices = {}
        nodes_links = self._context.get_graph_of_attributes()
        attr_lattices["nodes"] = nodes_links[0]
        attr_lattices["links"] = nodes_links[1]
        
        # convert it to json to be saved
        jsonSerializer = utils.JSONSerializer()
        abc = jsonSerializer.serialize(attr_lattices, use_natural_keys=True)
        self._attr_graph = abc
        print "end"
    
    def compute_attribute_lattices(self):
        subcontexts = {}
        pairs = {}
        # select attributes-values pairs
        for attr in self._context._attributes:
            attrvalue = attr.split('-')
            if (len(attrvalue) > 1):
                attrname = attrvalue[0]
                attrvalue = "-".join(attrvalue[1:])
                if (not (attrname in pairs)): 
                    pairs[attrname] = []
                pairs[attrname].append(attrvalue)
            else:
                pairs[attr] = [] # TODO 
                
        # extract sub contexts for each attribute
        for attrname in pairs:
            attrvalues = []
            
            if len(pairs[attrname]) > 0: # there're values for this attribute (ex: education-masters)
                for value in pairs[attrname]:
                    attrvalues.append(attrname + "-"+ value)
            else : # there's no value (eg.: preying)
                attrvalues.append(attrname)
   
                
                
            attr_context = self._context.extract_subcontext_containing_attributes(attrvalues)

            #HACK to fix consistency between this method and the javascript
            if len(attrvalues) == 1:
                attrname = attrvalues[0]
                
            subcontexts[attrname] = attr_context
            
        # compute lattice for each context
        #sublattices = []
        attr_lattices = {}
        for attr, cxt in subcontexts.iteritems():
            attr_lattices[attr] = {}
            nodes_links = norris(cxt)
            attr_lattices[attr]["nodes"] = nodes_links[0]
            attr_lattices[attr]["links"] = nodes_links[1]
            
        # convert it to json to be saved
        jsonSerializer = utils.JSONSerializer()
        abc = jsonSerializer.serialize(attr_lattices, use_natural_keys=True)
        self._attr_lattices = abc
        print "end"
        
    def get_concept_by_id(self, cid):
        for c in self._concepts:
            if c.concept_id == cid:
                return c
        return None
    
    def get_context(self):
        return self._context
    
    context = property(get_context)
    
    def get_top_concept(self):
        # TODO: change
        return self._top_concept
    top_concept = property(get_top_concept)

    def get_bottom_concept(self):
        # TODO: change
        return self._bottom_concept

    bottom_concept = property(get_bottom_concept)

    def filter(self, concept):
        # TODO: optimize
        return [c for c in self._concepts if concept.intent > c.intent]

    def ideal(self, concept):
        # TODO: optimize
        return [c for c in self._concepts if c.intent > concept.intent]

    def __len__(self):
        return len(self._concepts)

    def __getitem__(self, key):
        return self._concepts[key]

    def __contains__(self, value):
        return value in self._concepts

    def __str__(self):
        s = ""
        for c in self._concepts:
            s = s + "%s\n" % str(c)
        return s[:-1]

    def index(self, concept):
        #return self.get_index_of(concept)
        return self._concepts.index(concept)
    
    def parents(self, concept):
        #return self._parents[concept]
        
        #return set([cl._parent for cl in self._links if cl._child==concept])
        try:
            idx = self.index(concept)
        except Exception, e:
            print concept.concept_id
        return set([self._concepts[cl._parent] for cl in self._links if cl._child==idx])

    def children(self, concept):
        #return set([c for c in self._concepts if concept in self.parents(c)])
#        ret = set([])
#        for cl in self._links : 
#            if cl.parent==concept :
#                ret.add(cl.child)
#        return ret

        # return set([cl._child for cl in self._links if cl._parent==concept])
        
        idx = self.index(concept)
        return set([self._concepts[cl._child] for cl in self._links if cl._parent==idx])
        
    def to_dict(self, is_list=False):
        lattice = {}
        lattice["id"] = self.id
        if is_list :
            lattice["nodes_length"] = len(self._concepts)
            lattice["links_length"] = len(self._links)
        else :
            lattice["nodes"] = self._concepts
            lattice["links"] = self._links
            lattice["top_concept"] = self._top_concept
            lattice["bottom_concept"] = self._bottom_concept
            lattice["context"] = self._context
        return lattice
    
    def unlink(self, concept1, concept2):
        for link in self._links:
            if ((self._concepts[link._parent] == concept1 and self._concepts[link._child] == concept2) or \
                (self._concepts[link._parent] == concept2 and self._concepts[link._child] == concept1)):
                self._links.remove(link)
    
    def clone(self):
        clone = ConceptLattice()
        clone._top_concept =  self._top_concept
        clone._bottom_concept =  self._bottom_concept
        clone._context = self._context
        clone._concepts =  self._concepts
        clone._links = self._links
        clone.original_id = self.id
        return clone
        #_attr_lattices = models.TextField() 
    
    one = None
    zero = None
if __name__ == "__main__":
    import doctest
    doctest.testmod()