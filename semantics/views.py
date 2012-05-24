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

def index(request):
    #Semantic.rdf_to_context("")
    return render_to_response('semantics/index.html', context_instance=RequestContext(request))

def search(request):
    theprefix = request.GET.get('search_prefix')
    thequery = request.GET.get('search_query')
    format = request.GET.get('format')
    
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
    
    
        
    
