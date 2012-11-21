import simplejson #as json # no jython: import json
from django.core.urlresolvers import reverse
from django.http import HttpResponse, HttpResponseRedirect
from django.contrib.auth.decorators import login_required
from django.shortcuts import render_to_response, get_object_or_404
from django.template import RequestContext
from django.middleware.csrf import get_token
from django.core import serializers
from semantics.search import Semantic
from django.utils.html import escape
from fca.concept_lattice import ConceptLattice

def index(request, workspace_slug):
    #Semantic.rdf_to_context("")
    
    example_prefix = """PREFIX :<http://www.w3.org/TR/2003/PR-owl-guide-20031209/wine#>
        PREFIX wordn-sc:<http://www.w3.org/2006/03/wn/wn20/schema/>
        PREFIX nytimes:<http://data.nytimes.com/>
        PREFIX geo-pos:<http://www.w3.org/2003/01/geo/wgs84_pos#>
        PREFIX dbp-prop:<http://dbpedia.org/property/>
        PREFIX geonames:<http://sws.geonames.org/>
        PREFIX umbel-ac:<http://umbel.org/umbel/ac/>
        PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>
        PREFIX sw-vocab:<http://www.w3.org/2003/06/sw-vocab-status/ns#>
        PREFIX ff:<http://factforge.net/>
        PREFIX music-ont:<http://purl.org/ontology/mo/>
        PREFIX vin:<http://www.w3.org/TR/2003/PR-owl-guide-20031209/wine#>
        PREFIX dc-term:<http://purl.org/dc/terms/>
        PREFIX dbpedia:<http://dbpedia.org/resource/>
        PREFIX om:<http://www.ontotext.com/owlim/>
        PREFIX opencyc-en:<http://sw.opencyc.org/2008/06/10/concept/en/>
        PREFIX factbook:<http://www.daml.org/2001/12/factbook/factbook-ont#>
        PREFIX rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX pext:<http://proton.semanticweb.org/protonext#>
        PREFIX oasis:<http://psi.oasis-open.org/iso/639/#>
        PREFIX ot:<http://www.ontotext.com/>
        PREFIX dc:<http://purl.org/dc/elements/1.1/>
        PREFIX geo-ont:<http://www.geonames.org/ontology#>
        PREFIX umbel-en:<http://umbel.org/umbel/ne/wikipedia/>
        PREFIX foaf:<http://xmlns.com/foaf/0.1/>
        PREFIX bbc-pont:<http://purl.org/ontology/po/>
        PREFIX ptop:<http://proton.semanticweb.org/protontop#>
        PREFIX lingvoj:<http://www.lingvoj.org/ontology#>
        PREFIX yago:<http://mpii.de/yago/resource/>
        PREFIX fb:<http://rdf.freebase.com/ns/>
        PREFIX dbtune:<http://dbtune.org/bbc/peel/work/>
        PREFIX psys:<http://proton.semanticweb.org/protonsys#>
        PREFIX umbel:<http://umbel.org/umbel#>
        PREFIX umbel-sc:<http://umbel.org/umbel/sc/>
        PREFIX pkm:<http://proton.semanticweb.org/protonkm#>
        PREFIX food:<http://www.w3.org/TR/2003/PR-owl-guide-20031209/food#>
        PREFIX dbp-ont:<http://dbpedia.org/ontology/>
        PREFIX wordnet16:<http://xmlns.com/wordnet/1.6/>
        PREFIX owl:<http://www.w3.org/2002/07/owl#>
        PREFIX xsd:<http://www.w3.org/2001/XMLSchema#>
        PREFIX ub:<http://www.lehigh.edu/~zhp2/2004/0401/univ-bench.owl#>
        PREFIX gr:<http://purl.org/goodrelations/v1#>
        PREFIX wordnet:<http://www.w3.org/2006/03/wn/wn20/instances/>
        PREFIX skos:<http://www.w3.org/2004/02/skos/core#>
        PREFIX opencyc:<http://sw.opencyc.org/concept/>"""
        
    example_query = """SELECT DISTINCT ?wine ?property ?value 
            WHERE {   
                ?o1 a ?class . 
                ?wine a ?o1 . 
                ?wine ?property ?value .  
        }"""
    
    
    if 'last_sparql_query' in request.session:
        cur_query = request.session['last_sparql_query']
    else:
        cur_query = example_query
        
    if 'last_sparql_prefix' in request.session:
        cur_prefix = request.session['last_sparql_prefix']
    else:
        cur_prefix = example_prefix
        
    return render_to_response('semantics/index.html', {'workspace_slug': workspace_slug, 'current_prefix': cur_prefix, 'current_query': cur_query}, context_instance=RequestContext(request))

def search(request, workspace_slug):
    theprefix = request.GET.get('search_prefix')
    thequery = request.GET.get('search_query')
    format = request.GET.get('format')
    
    
    request.session['last_sparql_query'] = thequery
    request.session['last_sparql_prefix'] = theprefix 
    
    request.session['cur_workspace']
    
    if request.is_ajax():
        if format == 'json':
            return HttpResponse(simplejson.dumps(Semantic.search_sparqlwrapper(theprefix,thequery)), mimetype="application/json")
    else :
        return HttpResponse(simplejson.dumps(Semantic.search_sparqlwrapper(theprefix,thequery)), mimetype="application/json")
    
    
def sparql2context(request):
    try:
        cxt = Semantic.sparql2context(None)
        cl = ConceptLattice(_context=cxt)
        cl.compute_lattice()
                
        cl.save()
        return HttpResponseRedirect('/fca/load_cxt/?lattice_id='+cl.id)
    
    except Exception, e: 
            error_msg =  e.message if e.message else str(e.reason)
            return render_to_response('shared/error.html', {'error_msg': error_msg}, context_instance=RequestContext(request))
    
    
        
    
