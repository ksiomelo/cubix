#from org.openrdf.model import *
#from org.openrdf.query import *
#from org.openrdf.repository import *
#from org.openrdf.rio import *
#from org.openrdf.repository.sail import *
#from org.openrdf.repository.manager import RemoteRepositoryManager
#from org.openrdf.query.resultio import *
##from org.openrdf.repository.sail import SailRepository
##import org.openrdf.repository.sail.SailRepository
#from org.openrdf.sail.memory import *

# UNSUSED?
from SPARQLWrapper import SPARQLWrapper, SPARQLWrapper2, JSON
import urllib
import urllib2
from xml.dom.minidom import parseString
import httplib2
import simplejson
from fca.context import Context


class Semantic(object):
    
    
    @staticmethod
    def search_owlim(prefix, query):
        
        prefix = """PREFIX :<http://www.w3.org/TR/2003/PR-owl-guide-20031209/wine#>
                 PREFIX rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#>
                 PREFIX owl:<http://www.w3.org/2002/07/owl#>
                 PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>
                 PREFIX xsd:<http://www.w3.org/2001/XMLSchema#>
                 """
        
        query = prefix + """ SELECT ?subj ?prop ?obj WHERE { ?o1 a ?class . ?subj a ?o1 .  ?subj ?prop ?obj. }"""
                
                
#        prefix = """PREFIX :<http://www.cubist_project.eu/test#>
#                 PREFIX rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#>
#                 PREFIX owl:<http://www.w3.org/2002/07/owl#>
#                 PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>
#                 PREFIX xsd:<http://www.w3.org/2001/XMLSchema#>
#                 """
#        
#        query = prefix + """ select distinct ?o1 ?a1  where {  
#                ?x1 rdf:type :Tissue ; rdfs:label ?o1 .
#                ?x1 :has_theiler_stage :theiler_stage_TS07 .
#                ?x2 rdf:type :Gene  ;    rdfs:label ?a1 .
#                ?ta :in_tissue ?x1 ; :has_involved_gene ?x2  ; :has_strength :level_detected_derived . }"""
        
           
    
#        repositoryManager = RemoteRepositoryManager("http://127.0.0.1:8080/openrdf-sesame")
#        repositoryManager.initialize()
#        
#        #Get the repository to use
#        repository = repositoryManager.getRepository("wine")
#        repository.setPreferredTupleQueryResultFormat(TupleQueryResultFormat.JSON)
#        repository.initialize()
#        #Open a connection to this repository
#        repositoryConnection = repository.getConnection()
#        preparedQuery = repositoryConnection.prepareQuery(QueryLanguage.SPARQL, query);
#        result = preparedQuery.evaluate()
#    
#        return render_to_response('fca/index.html', context_instance=RequestContext(request))
        
        result = False

        return result
    
    
    @staticmethod
    def search_sparqlwrapper(prefix, query):
        sparql = SPARQLWrapper("http://127.0.0.1:8080/openrdf-sesame/repositories/wine2")
        #sparql = SPARQLWrapper("http://dbpedia.org/sparql")
        
        sparql.setQuery(prefix + """ """ + query)
        
        sparql.setReturnFormat(JSON)
        try:
            results = sparql.query().convert()
        except Exception, e: 
            
            results = {"error": e.message if e.message else str(e.reason) }
        return results
    
    
    @staticmethod
    def sparql2context(results): #TODO min supp
        objs = []
        attrs = []
        table = []
        tempRel = dict([])
        
        queryString = "SELECT ?subj ?prop ?obj WHERE { ?o1 a ?class . ?subj a ?o1 .  ?subj ?prop ?obj. }"
        sparql = SPARQLWrapper2("http://127.0.0.1:8080/openrdf-sesame/repositories/wine2")
        # add a default graph, though that can also be in the query string
        #sparql.addDefaultGraph("http://www.example.com/data.rdf")
        sparql.setQuery(queryString)

        ret = sparql.query()
        print ret.variables  # this is an array consisting of "subj" and "prop"
        print str(len(ret.bindings))
        for binding in ret.bindings :
            # each binding is a dictionary. Let us just print the results
            obj_name = binding[u"subj"].value.split("#")
            attr_name = binding[u"prop"].value.split("#")
            attr_value = binding[u"obj"].value.split("#")
            
            if len(obj_name) < 2 or len(attr_name) < 2 or len(attr_value) < 2:
                continue #skip literals? TODO skip uris
            else:
                obj_name = obj_name[1]
                attr_name = attr_name[1]
                attr_value = attr_value[1]
            
            attr_val = attr_name + "-" + attr_value
            
            # add obj
            if not obj_name in objs :
                objs.append(obj_name)
            obj_idx = objs.index(obj_name)
            
            #add attr
            if not attr_val in attrs :
                attrs.append(attr_val)
            attr_idx = attrs.index(attr_val)
            
#                if len(table) <= obj_idx:
#                    table.insert(obj_idx, [])
                
            #table[obj_idx].insert(attr_idx,True)
            if not obj_name in tempRel:
                tempRel[obj_name] = []
            tempRel[obj_name].append(attr_idx)
            
            
        # FILTER OBJECTS WITH LOW SUPP # TODO to it in the context class TODO fazer para attr supp tbm
        
        for obj_name in tempRel.keys():
            if len(tempRel[obj_name]) < 2:
                del tempRel[obj_name]
                objs.remove(obj_name)
                
                
        
        
        
        table = [None]*len(objs)
        
        
        for obj_name in tempRel.keys():
            
            row = [False]*len(attrs)
            
            for attr_idx in tempRel[obj_name]:
                row[attr_idx] = True
            obj_idx = objs.index(obj_name)
            table[obj_idx] = row
                
            
        
        return Context(_table=table, _attributes=attrs, _objects=objs)
    
    
    @staticmethod
    def sparql2context2(results_table, col_types, hide_prefix): #TODO min supp
        
        results_table = simplejson.loads(results_table)
        col_types = simplejson.loads(col_types)
        
        objs = []
        attrs = []
        table = []
        tempRel = dict([])
        
        obj_column = 'subj'
        attr_column = 'prop'
        attrval_column = None#'obj'
        
        for x in col_types:
            if col_types[x] == 'obj':
                obj_column = x
            elif col_types[x] == 'attr':
                attr_column = x
            elif col_types[x] == 'attrval':
                attrval_column = x
        
        
        for binding in results_table[u'results'][u'bindings'] :
            
            obj_name = binding[obj_column][u"value"]
            attr_name = binding[attr_column][u"value"]
            attr_value = None
            
            if attrval_column:
                attr_value = binding[attrval_column][u"value"]
            
            if hide_prefix:
                if '#' in obj_name: 
                    obj_name = obj_name.split("#")[1]
                if '#' in attr_name: 
                    attr_name = attr_name.split("#")[1]
                if attr_value and '#' in attr_value: 
                    attr_value = attr_value.split("#")[1]
            
            if attr_value:
                attr_val = attr_name + "-" + attr_value
            else:
                attr_val = attr_name
            
            # add obj
            if not obj_name in objs :
                objs.append(obj_name)
            obj_idx = objs.index(obj_name)
            
            #add attr
            if not attr_val in attrs :
                attrs.append(attr_val)
            attr_idx = attrs.index(attr_val)
            
#                if len(table) <= obj_idx:
#                    table.insert(obj_idx, [])
                
            #table[obj_idx].insert(attr_idx,True)
            if not obj_name in tempRel:
                tempRel[obj_name] = []
            tempRel[obj_name].append(attr_idx)
            
            
        # FILTER OBJECTS WITH LOW SUPP # TODO to it in the context class TODO fazer para attr supp tbm
        
        for obj_name in tempRel.keys():
            if len(tempRel[obj_name]) < 2:
                del tempRel[obj_name]
                objs.remove(obj_name)
                
                
        
        
        
        table = [None]*len(objs)
        
        
        for obj_name in tempRel.keys():
            
            row = [False]*len(attrs)
            
            for attr_idx in tempRel[obj_name]:
                row[attr_idx] = True
            obj_idx = objs.index(obj_name)
            table[obj_idx] = row
                
            
        
        return Context(_table=table, _attributes=attrs, _objects=objs)
    
    
    
    @staticmethod
    def search_http(prefix, query):
        
        prefix = """PREFIX :<http://www.cubist_project.eu/HWU#>
                 PREFIX rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#>
                 PREFIX owl:<http://www.w3.org/2002/07/owl#>
                 PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>
                 PREFIX xsd:<http://www.w3.org/2001/XMLSchema#>
                 """
        
        thequery = prefix + """ select distinct ?o1 ?a1  where {  
                ?x1 rdf:type :Tissue ; rdfs:label ?o1 .
                ?x1 :has_theiler_stage :theiler_stage_TS07 .
                ?x2 rdf:type :Gene  ;    rdfs:label ?a1 .
                ?ta :in_tissue ?x1 ; :has_involved_gene ?x2  ; :has_strength :level_detected_derived . }"""
    
        query = 'SELECT DISTINCT ?type WHERE { ?thing a ?type . } ORDER BY ?type'
        repository = 'cubix'
        endpoint = "http://127.0.0.1:8080/openrdf-sesame/repositories/%s" % (repository)
        params = { 'query': thequery }
        headers = { 
                   'content-type': 'application/x-www-form-urlencoded', 
                   'accept': 'application/sparql-results+json' 
        }
        (response, content) = httplib2.Http().request(endpoint, 'POST', urllib.urlencode(params), headers=headers)
        return content
        
        
