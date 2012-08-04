#from fca.concept_lattice import ConceptLattice
import simplejson as json # no jython: import jsonm
from django.core.serializers import serialize
from django.db.models.query import QuerySet



#from io import StringIO
from django.db.models import Model
from django.utils.encoding import smart_unicode



import fca
import random
from django.conf import settings
from fca.algorithms.filtering.stability import (compute_estability, compute_istability)
from fca.algorithms import closure_operators
from fca.algorithms import implication_covers

from fca.implication import Implication
from fca.association_rule import AssociationRule
from fca.concept_link import ConceptLink

#from mongoengine import *
#import mongoengine
from pymongo.objectid import ObjectId
from types import ModuleType
from itertools import groupby

#class AlgorithmUtils(object):
#    @staticmethod
#    def compute_metric(lattice, metric):
#
#



#def encode_model(obj):
#    if isinstance(obj, (mongoengine.Document, mongoengine.EmbeddedDocument)):
#        out = dict(obj._data)
#        for k,v in out.items():
#            if isinstance(v, ObjectId):
#                out[k] = str(v)
#    elif isinstance(obj, mongoengine.queryset.QuerySet):
#        out = list(obj)
#    elif isinstance(obj, ModuleType):
#        out = None
#    elif isinstance(obj, groupby):
#        out = [ (g,list(l)) for g,l in obj ]
#    elif isinstance(obj, (list,dict)):
#        out = obj
#    else:
#        raise TypeError, "Could not JSON-encode type '%s': %s" % (type(obj), str(obj))
#    return out

from simplejson import dumps, loads, JSONEncoder, JSONDecoder
#import pickle
#class PythonObjectEncoder(JSONEncoder):
#    def default(self, obj):
#        if isinstance(obj, (list, dict, str, unicode, int, float, bool, type(None))):
#            return JSONEncoder.default(self, obj)
#        return {'_python_object': pickle.dumps(obj)}
    
    
#class SetEncoder(json.JSONEncoder):
#    def default(self, obj):
#        if isinstance(obj, set):
#            return list(obj)
#        if isinstance(obj, (fca.Concept, fca.Context, ConceptLink, fca.ConceptLattice, AssociationRule)):
#            return obj.to_dict(False)
#        return json.JSONEncoder.default(self, obj)
#    
#class ListEncoder(json.JSONEncoder):
#    def default(self, obj):
#        if isinstance(obj, set):
#            return list(obj)
#        if isinstance(obj, QuerySet):
#            # `default` must return a python serializable
#            # structure, the easiest way is to load the JSON
#            # string produced by `serialize` and return it
#            #b = serialize('python', obj, ensure_ascii=False)
#            #a = json.loads(b)
#            
#            ret = []
#            for e in QuerySet:
#                ret.append(e)
#            
#            return ret#a#json.loads(serialize('json', obj))
#        if isinstance(obj, (fca.Concept, fca.Context, ConceptLink, fca.ConceptLattice, AssociationRule)):
#            return obj.to_dict(True)
#        return json.JSONEncoder.default(self, obj)

    
#def as_python_object(dct):
#    if '_python_object' in dct:
#        return pickle.loads(str(dct['_python_object']))
#    return dct

import StringIO #on jython


class UnableToSerializeError(Exception):
    """ Error for not implemented classes """
    def __init__(self, value):
        self.value = value
        Exception.__init__(self)

    def __str__(self):
        return repr(self.value)

class JSONSerializer():
    boolean_fields = ['BooleanField', 'NullBooleanField']
    datetime_fields = ['DatetimeField', 'DateField', 'TimeField']
    number_fields = ['IntegerField', 'AutoField', 'DecimalField', 'FloatField', 'PositiveSmallIntegerField']
    #short_entities = False

    def serialize(self, obj, **options):
        self.options = options

        self.stream = options.pop("stream", StringIO.StringIO())
        self.selectedFields = options.pop("fields", None)
        self.ignoredFields = options.pop("ignored", None)
        self.use_natural_keys = options.pop("use_natural_keys", False)
        self.currentLoc = ''

        self.level = 0

        self.start_serialization()

        self.handle_object(obj)

        self.end_serialization()
        return self.getvalue()

    def get_string_value(self, obj, field):
        """Convert a field's value to a string."""
        return smart_unicode(field.value_to_string(obj))

    def start_serialization(self):
        """Called when serializing of the queryset starts."""
        pass

    def end_serialization(self):
        """Called when serializing of the queryset ends."""
        pass

    def start_array(self):
        """Called when serializing of an array starts."""
        self.stream.write(u'[')
    def end_array(self):
        """Called when serializing of an array ends."""
        self.stream.write(u']')

    def start_object(self):
        """Called when serializing of an object starts."""
        self.stream.write(u'{')

    def end_object(self):
        """Called when serializing of an object ends."""
        self.stream.write(u'}')

    def handle_object(self, object):
        """ Called to handle everything, looks for the correct handling """
        if isinstance(object, dict):
            self.handle_dictionary(object)
        elif isinstance(object, list):
            self.handle_list(object)
        elif isinstance(object, Model):
            self.handle_model(object)
        elif isinstance(object, QuerySet):
            self.handle_queryset(object)
        elif isinstance(object, bool):
            self.handle_simple(object)
        elif isinstance(object, int) or isinstance(object, float) or isinstance(object, long):
            self.handle_simple(object)
        elif isinstance(object, basestring):
            self.handle_simple(object)
        elif isinstance(object, set):
            self.handle_list(list(object))
        elif isinstance(object, (fca.Concept, fca.Context, ConceptLink, fca.ConceptLattice, AssociationRule)):
            self.handle_concept(object)
        else:
            raise UnableToSerializeError(type(object))

    def handle_dictionary(self, d):
        """Called to handle a Dictionary"""
        i = 0
        self.start_object()
        for key, value in d.iteritems():
            # self.currentLoc += key+'.'
            self.stream.write(unicode(self.currentLoc))
            i += 1
            self.handle_simple(key)
            self.stream.write(u': ')
            self.handle_object(value)
            if i != len(d):
                self.stream.write(u', ')
            self.currentLoc = self.currentLoc[0:(len(self.currentLoc)-len(key)-1)]
        self.end_object()

    def handle_list(self, l):
        """Called to handle a list"""
        self.start_array()

        #for value in l:
        for idx, value in enumerate(l) :
            self.handle_object(value)
            if idx != len(l) -1:
                self.stream.write(u', ')

        self.end_array()
        
        
    def handle_concept(self, c):
        self.handle_dictionary(c.to_dict(is_list=True))

    def handle_model(self, mod):
        """Called to handle a django Model"""
        
        if isinstance(mod, (fca.Concept, fca.Context, ConceptLink, fca.ConceptLattice, AssociationRule)):
            self.handle_concept(mod)
            return
        
        self.start_object()

        for field in mod._meta.local_fields:
            if field.rel is None:
                if self.selectedFields is None or field.attname in self.selectedFields or field.attname:
                    if self.ignoredFields is None or self.currentLoc + field.attname not in self.ignoredFields:
                        self.handle_field(mod, field)
            else:
                if self.selectedFields is None or field.attname[:-3] in self.selectedFields:
                    if self.ignoredFields is None or self.currentLoc + field.attname[:-3] not in self.ignoredFields:
                        self.handle_fk_field(mod, field)
        for field in mod._meta.many_to_many:
            if self.selectedFields is None or field.attname in self.selectedFields:
                if self.ignoredFields is None or self.currentLoc + field.attname not in self.ignoredFields:
                    self.handle_m2m_field(mod, field)
        self.stream.seek(self.stream.tell()-2)
        self.end_object()

    def handle_queryset(self, queryset):
        """Called to handle a django queryset"""
        self.start_array()
        it = 0
        for mod in queryset:
            it += 1
            self.handle_model(mod)
            if queryset.count() != it:
                self.stream.write(u', ')
        self.end_array()

    def handle_field(self, mod, field):
        """Called to handle each individual (non-relational) field on an object."""
        self.handle_simple(field.name)
        if field.get_internal_type() in self.boolean_fields:
            if field.value_to_string(mod) == 'True':
                self.stream.write(u': true')
            elif field.value_to_string(mod) == 'False':
                self.stream.write(u': false')
            else:
                self.stream.write(u': undefined')
        else:
            self.stream.write(u': ')
            self.handle_simple(field.value_to_string(mod))
        self.stream.write(u', ')

    def handle_fk_field(self, mod, field):
        """Called to handle a ForeignKey field."""
        related = getattr(mod, field.name)
        if related is not None:
            if field.rel.field_name == related._meta.pk.name:
                # Related to remote object via primary key
                pk = related._get_pk_val()
            else:
                # Related to remote object via other field
                pk = getattr(related, field.rel.field_name)
            d = {
                    'pk': pk,
                }
            if self.use_natural_keys and hasattr(related, 'natural_key'):
                d.update({'natural_key': related.natural_key()})
            if type(d['pk']) == str and d['pk'].isdigit():
                d.update({'pk': int(d['pk'])})

            self.handle_simple(field.name)
            self.stream.write(u': ')
            self.handle_object(d)
            self.stream.write(u', ')

    def handle_m2m_field(self, mod, field):
        """Called to handle a ManyToManyField."""
        if field.rel.through._meta.auto_created:
            self.handle_simple(field.name)
            self.stream.write(u': ')
            self.start_array()
            hasRelationships = False
            for relobj in getattr(mod, field.name).iterator():
                hasRelationships = True
                pk = relobj._get_pk_val()
                d = {
                        'pk': pk,
                    }
                if self.use_natural_keys and hasattr(relobj, 'natural_key'):
                    d.update({'natural_key': relobj.natural_key()})
                if type(d['pk']) == str and d['pk'].isdigit():
                    d.update({'pk': int(d['pk'])})

                self.handle_simple(d)
                self.stream.write(u', ')
            if hasRelationships:
                self.stream.seek(self.stream.tell()-2)
            self.end_array()
            self.stream.write(u', ')

    def handle_simple(self, simple):
        """ Called to handle values that can be handled via simplejson """
        self.stream.write(unicode(dumps(simple)))

    def getvalue(self):
        """Return the fully serialized object (or None if the output stream is  not seekable).sss """
        if callable(getattr(self.stream, 'getvalue', None)):
            return self.stream.getvalue()






class FCAUtils(object):
    separator = '-'
    
    @staticmethod
    def lattice_to_json_depth2(lattice):
        nodes = []
        links = []
        to_json = {}
        
        cxt = lattice.get_context()
        
        added_c = []
        
        c_list = []
        c_list.append(lattice.get_top_concept())
        
        #p_depth = 0
        for cur in c_list:
           
            
            if (not added_c.__contains__(cur)): # if it was not added
                concept = {}
                concept["id"] = str(cur.concept_id) #if cur.concept_id else lattice.index(cur) 
                #concept["name"] = "A: [" + ",".join(cur.intent) + '] === ' + "O: [" + ",".join(cur.extent) + "]"
                concept["intent"] = list(cur.intent)
                concept["extent"] = list(cur.extent)
                concept["parents_ids"] = map(lambda x: str(x.concept_id), lattice.parents(cur))
                concept["children_ids"] = map(lambda x: str(x.concept_id), lattice.children(cur))
                concept["support"] = len(cur.extent)/len(cxt._objects)
                concept["depth"] = 0 
                nodes.append(concept) 
                added_c.append(cur)
                
            
            for child in lattice.children(cur):
                p_index = added_c.index(cur)
                
                if (not added_c.__contains__(child)): # if it was not added
                    concept = {}
                    concept["id"] = str(child.concept_id) #if child.concept_id else lattice.index(child)
                    #concept["name"] = "A: [" + ",".join(child.intent) + '] === ' + "O: [" + ",".join(child.extent) + "]"
                    concept["intent"] = list(child.intent)
                    concept["extent"] = list(child.extent)
                    concept["parents_ids"] = map(lambda x: str(x.concept_id), lattice.parents(child))  #map(lambda x: lattice.index(x), lattice.parents(child))
                    concept["children_ids"] = map(lambda x: str(x.concept_id), lattice.children(child))
                    concept["support"] = len(child.extent)/len(cxt._objects)
                    concept["depth"] = 0
                    
                    nodes.append(concept) 
                    added_c.append(child)
                    c_list.append(child)
                
                child_index = added_c.index(child)
                    
                    
                link = {}
                link["source"] = child_index
                link["target"] = p_index 
                link["value"] = 1
                
                links.append(link)
                
                # update child's depth
                if (nodes[child_index]["depth"] <= nodes[p_index]["depth"]):
                    nodes[child_index]["depth"] = nodes[p_index]["depth"] +1 # parent depth +1
                
        to_json["nodes"] = nodes
        to_json["links"] = links
        
        to_json["top_id"] = lattice.index(lattice.get_top_concept())
        to_json["bottom_id"] = lattice.index(lattice.get_bottom_concept())
        
        to_json["objects"] = lattice.get_context().get_objects()
        
        
        attrs = {}
        
        
        groups = {}
        
        
        
        # get attr values
        
        for aIdx, attrString in enumerate(cxt.get_attributes()) :
        
            raw_attr = attrString.split('-')[0]
            
            if raw_attr in groups:
                continue
            
            values = []
            for attr in cxt.get_attributes():
                
                val = attr.split(FCAUtils.separator)
                if len(val) > 1 and val[0] == raw_attr : 
                    values.append([FCAUtils.separator.join(val[1:])])
            
            if len(values) > 1 :
                groups[raw_attr] = values
            elif len(values) == 1 : # not really a value after the attr (e.g. US-citizen)
                groups[attrString] = [["yes"],["no"]]
            else : # boolean
                groups[raw_attr] = [["yes"],["no"]]
        
        
        for raw_attr in groups.iterkeys():
            yes = 0
            no = 0
            
            for value in groups[raw_attr]:
            
                if value[0] == 'yes' and groups[raw_attr][1][0] == 'no': # BOOLEAN
                    
                    theIdx = cxt.get_attributes().index(raw_attr)     
                    for item in cxt :        
                        if item[theIdx] :
                            yes += 1
                        else :
                            no +=1
        
                    value.append(yes)
                    groups[raw_attr][1].append(no)
                    break
                    
                else :
            
                    fullAttr = raw_attr + FCAUtils.separator + value[0]
                    
                    theIdx = cxt.get_attributes().index(fullAttr)     
                    for item in cxt :        
                        if item[theIdx] :
                            yes += 1
        
                    value.append(yes)
            
        to_json["attributes"] = groups
        
        # ATTRIBUTE LATTICES
        #jsonSerializer = JSONSerializer()
        #abc = jsonSerializer.serialize(lattice._attr_lattices, use_natural_keys=True)
        to_json["attribute_lattices"] = lattice._attr_lattices
        
        # LATTICE PROPERTIES
        to_json["id"] = lattice.id
        
        cxtobj = dict({"objects": cxt._objects, "attributes" : cxt._attributes, "rel" : cxt._table})
        
        to_json["context"] = cxtobj
        
        # boolean context  :  {"name" : ["yes", 24, "no", 32]}
        # for multivalued context: {"name": ["value1", "value2"], }
        
        # lattice specificities
        #imp_basis = implication_covers.compute_implication_cover(cxt, closure_operators.simple_closure)
        
        #jsonSerializer = JSONSerializer()
        #return jsonSerializer.serialize(to_json, use_natural_keys=True)
        return json.dumps(to_json)

    def getAttrValues(self, attrs): {}
        

class ContextUtils(object):
    @staticmethod
    def handle_cxt_file(thefile):
        if thefile:
            file_path = getattr(settings,'FILE_UPLOAD_TEMP_DIR')+thefile.name
            
            destination = open(file_path, 'wb+')#open('/tmp/'+thefile.name, 'wb+')

            for chunk in thefile.chunks():  
                destination.write(chunk)
                
            destination.close()
            # print settings.MEDIA_URL + "/" + destination.name
            
            context = fca.read_cxt(file_path)
            return context
        

