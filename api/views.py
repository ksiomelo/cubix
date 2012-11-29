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

from fca.metric import Metric
from fca.clustering import spectral

from semantics.search import Semantic
import pymongo.json_util  
import pymongo


from fca.algorithms.filtering.probability import compute_probability
from fca.algorithms.filtering.stability import (compute_estability, compute_istability)
from fca.algorithms.filtering.separation import compute_separation_index
from fca.algorithms.filtering.extentsize import compute_extent_size
from fca.algorithms.filtering.confidence import compute_confidence
from fca.algorithms.filtering.similarity import compute_similarity

from fca.algorithms.norris import get_number_of_concepts
## CONTEXT

@login_required
def get_context(request):
    context_id = request.GET.get('id')
    context = Context.objects.get(id=context_id)
    return HttpResponse(simplejson.dumps(context), mimetype="application/json")

## CONCEPTS
@login_required
def get_number_concepts(request):
    context_id = request.GET.get('context_id')
    context = Context.objects.get(id=context_id)
    
    n_concepts = get_number_of_concepts(context)
    
    return HttpResponse(simplejson.dumps({"context_id":context_id, "number_of_concepts": n_concepts}), mimetype="application/json")


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
    metric = request.GET.get('metric')
    
    if "param" in request.GET:
        param = request.GET.get('param')
        
    
    link_score = False
    if (metric == 'cluster'):
        scores = spectral.spectral(lattice, param)
    elif (metric == 'istability'):
        scores = compute_istability(lattice)
    elif (metric == 'estability'):
        scores = compute_estability(lattice)
    elif (metric == 'esupport'):
        scores = compute_extent_size(lattice)
    elif (metric == 'separation'):
        scores = compute_separation_index(lattice)
    elif (metric == 'probability'):
        scores = compute_probability(lattice)
    elif (metric == 'confidence'):
        scores = compute_confidence(lattice)
        link_score = True 
    elif (metric == 'similarity'):
        scores = compute_similarity(lattice) 
        link_score = True
    elif (metric == 'root-distance'):
        scores = compute_extent_size(lattice) # TODO
    else:
        return HttpResponse(simplejson.dumps({"ERROR": "invalid metric" }), mimetype="application/json")
    
    metric = Metric(name=metric,scores=scores, link_score=link_score)
    
    if link_score:
        metric.flatten_scores()
    
    if lattice.metrics:
        for i, m in enumerate(lattice.metrics):
            if metric.name == m.name:
                lattice.metrics.pop(i)
                break
    
    lattice.metrics.append(metric)
    lattice.save()
    
    return HttpResponse(simplejson.dumps(metric.to_dict()), mimetype="application/json")
    



## SEMANTICS
@login_required
def sparql_search(request):
    theprefix = request.GET.get('search_prefix')
    thequery = request.GET.get('search_query')
    return HttpResponse(simplejson.dumps(Semantic.search_owlim(theprefix,thequery)), mimetype="application/json")
    

