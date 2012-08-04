import simplejson #as json # no jython: import json
from django.core.urlresolvers import reverse
from django.http import HttpResponse, HttpResponseRedirect
from django.contrib.auth.decorators import login_required
from django.shortcuts import render_to_response, get_object_or_404
from django.template import RequestContext
from django.middleware.csrf import get_token
from django.core import serializers
from django.utils.html import escape

from processing.utils import FCAUtils, ContextUtils
from processing import utils

from fca.association_rule import AssociationRule
from fca.concept_lattice import ConceptLattice
from fca.context import Context
from fca.concept import Concept
from fca.algorithms import implication_fuzz
from fca.algorithms.filtering import stability

from semantics.search import Semantic
import pymongo.json_util  
import pymongo

## CONTEXT

@login_required
def get_context(request):
    context_id = request.GET.get('id')
    context = Context.objects.get(id=context_id)
    return HttpResponse(simplejson.dumps(context), mimetype="application/json")


## LATTICE
def sample_lattice(request):
    
    ct = [[True, True, False, False], [False, False, True, True], \
          [True, False, True, True], [False, True, False, False], \
          [False,False,False,True], [True, False, False, False]]
    objs = ['lion', 'finch', 'eagle', 'hare', 'ostrich', 'snake']
    attrs = ['preying', 'mammal', 'flying', 'bird']
    c = Context(_table=ct,_objects=objs, _attributes=attrs)
    cl = ConceptLattice(_context=c)
    cl.compute_lattice()
    return HttpResponse(FCAUtils.lattice_to_json_depth2(cl), mimetype="application/json")

@login_required
def get_lattice(request):
    lattice_id = request.GET.get('id')
    lattice = ConceptLattice.objects.get(id=lattice_id)
    #return HttpResponse(simplejson.dumps({u'time': 1000 }),mimetype=u'application/json') 
    #abse = simplejson.dumps(lattice,default=pymongo.json_util.default)
    
    
#    abse = simplejson.dumps(lattice, cls=utils.SetEncoder)#,cls=PythonObjectEncoder
#
#    return HttpResponse(abse, mimetype=u"application/json")

    jsonSerializer = utils.JSONSerializer()
    return HttpResponse(jsonSerializer.serialize(lattice, use_natural_keys=True), mimetype='application/json')



@login_required
def get_lattices(request):
    
     
    jsonSerializer = utils.JSONSerializer()
    #jsonSerializer.short_entities = True
    return HttpResponse(jsonSerializer.serialize(ConceptLattice.objects.all(), use_natural_keys=True), mimetype='application/json')

    
    
    #abse = simplejson.dumps(ConceptLattice.objects.all(), cls=utils.ListEncoder)#,cls=PythonObjectEncoder

    #return HttpResponse(abse, mimetype=u"application/json")

## ASSOCIATION RULES
@login_required
def mine_association_rules(request):
    
    lattice_id = request.GET.get('lattice_id')
    lattice = ConceptLattice.objects.get(id=lattice_id)
    
    miner = implication_fuzz.AssociationRulesMiner(lattice.context)
    #dependencies = miner.find_exact_dependencies()
    dependencies = miner.find_approximate_dependencies(lattice, 0.1, 0.25)

    jsonSerializer = utils.JSONSerializer()
    return HttpResponse(jsonSerializer.serialize(dependencies, use_natural_keys=True), mimetype='application/json')



## METRICS

@login_required
def calculate_metric(request):
    lattice_id = request.GET.get('lattice_id')
    lattice = ConceptLattice.objects.get(id=lattice_id)
    theid = lattice._concepts[0].id
    metric = request.GET.get('metric')
    st = stability.compute_estability(lattice)
    
    # SHOULD APPEND THE METRICS TO THE LATTICE SAVED AND TO THE VISUALISATION
    for concept_id in st:
        for concept in lattice._concepts:
            if concept_id == concept.concept_id:
                # concept.support  # HOW TO DYNAMICALLY ADD ATTRIBUTES?
                absc = 1
    return None



## SEMANTICS
@login_required
def sparql_search(request):
    theprefix = request.GET.get('search_prefix')
    thequery = request.GET.get('search_query')
    return HttpResponse(simplejson.dumps(Semantic.search_owlim(theprefix,thequery)), mimetype="application/json")
    

