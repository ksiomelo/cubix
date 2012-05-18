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

def index(request):
    #Semantic.rdf_to_context("")
    return render_to_response('semantics/index.html', context_instance=RequestContext(request))

#def search(request):
#    theprefix = request.GET.get('search_prefix')
#    thequery = request.GET.get('search_query')
#    return HttpResponse(simplejson.dumps(Semantic.search(theprefix,thequery)), mimetype="application/json")
    

