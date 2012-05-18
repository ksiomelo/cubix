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
from SPARQLWrapper import SPARQLWrapper, JSON
import urllib
import urllib2
from xml.dom.minidom import parseString
import httplib2




class Semantic(object):
    
    
    @staticmethod
    def search_owlim(prefix, query):
        
        prefix = """PREFIX :<http://www.cubist_project.eu/HWU#>
                 PREFIX rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#>
                 PREFIX owl:<http://www.w3.org/2002/07/owl#>
                 PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>
                 PREFIX xsd:<http://www.w3.org/2001/XMLSchema#>
                 """
        
        query = prefix + """ select distinct ?o1 ?a1  where {  
                ?x1 rdf:type :Tissue ; rdfs:label ?o1 .
                ?x1 :has_theiler_stage :theiler_stage_TS07 .
                ?x2 rdf:type :Gene  ;    rdfs:label ?a1 .
                ?ta :in_tissue ?x1 ; :has_involved_gene ?x2  ; :has_strength :level_detected_derived . }"""
        
           
    
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
#        prefix = """PREFIX :<http://www.cubist_project.eu/HWU#>
#                 PREFIX rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#>
#                 PREFIX owl:<http://www.w3.org/2002/07/owl#>
#                 PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>
#                 PREFIX xsd:<http://www.w3.org/2001/XMLSchema#>
#                 """
#        
#        query = """ select distinct ?o1 ?a1  where { 
#  ?x1 rdf:type :Tissue ; rdfs:label ?o1 .
#  ?x1 :has_theiler_stage :theiler_stage_07 .
#  ?x2 rdf:type :Gene ;    rdfs:label ?a1 .
#  ?ta rdf:type :Textual_Annotation ; :in_tissue ?x1 ; :has_involved_gene ?x2 . 
#  }"""            
        
        # sparql = SPARQLWrapper("http://127.0.0.1:8080/openrdf-sesame/repositories/cubix")
        sparql = SPARQLWrapper("http://dbpedia.org/sparql")
        
        
        
        sparql.setQuery(prefix + """ """ + query)
        
        sparql.setReturnFormat(JSON)
        results = sparql.query().convert()
        return results
    
    
    
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
        
        
