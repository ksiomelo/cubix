import simplejson #as json # no jython: import json

#from django.template import Context, loader
from django.core.urlresolvers import reverse
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render_to_response, get_object_or_404
from django.template import RequestContext
from django.middleware.csrf import get_token
from django.core import serializers
from processing.utils import FCAUtils, ContextUtils
from django.contrib.auth.decorators import login_required
from fca.forms import LoadCxtForm

#import fca #import Concept,ConceptLattice,Context
from fca.concept_lattice import ConceptLattice
from fca.context import Context
from fca.concept import Concept
from fca.concept_link import ConceptLink
from fca.association_rule import AssociationRule
from workspace.models import ContextFile
from fca.transform.tree_transform import extract_tree

from fca.algorithms.filtering.similarity import compute_similarity
from fca.clustering.spectral import compute_spectral_clustering

from fca.algorithms import incremental

@login_required
def index(request, workspace_slug):
    
    #incremental.test_incremental()
    
    cxt_form = LoadCxtForm()
    
    contextfile = ContextFile.objects.get(id=request.session['cur_context_id'])
    
    # TODO this is a hack
    try:
        lattice = contextfile.lattice
    except Exception, e:
        print "Exception: "+e.message
        #lattice = ConceptLattice.objects.get(id=contextfile.lattice_id)
        return HttpResponseRedirect('/'+workspace_slug+'/fca/generate/')
    
    
    if lattice:
        #lattice = ConceptLattice.objects.get(id=request.session['cur_lattice_id'])
       
        params = {'cxt_form': cxt_form, 'djson': FCAUtils.lattice_to_json_depth2(lattice), 'workspace_slug':workspace_slug}
       
        if lattice.original_id: # is a tree, add stats #TODO
            original = ConceptLattice.objects.get(id=lattice.original_id)
            params["n_concepts"] = len(original._concepts)
            params["n_links"] = len(original._links)
            
        return render_to_response('fca/index.html', params, context_instance=RequestContext(request))
           
    else:
        request.session['error_msg'] = "You must generate a concept lattice first."
        return HttpResponseRedirect('/'+workspace_slug+'/context/')
        #return render_to_response('fca/index.html', {'cxt_form': cxt_form, 'djson': None, 'workspace_slug':workspace_slug}, context_instance=RequestContext(request))

    
@login_required
def load_cxt(request, workspace_slug):
    cxt_form = LoadCxtForm()
    
    if request.method == 'POST':
        form = LoadCxtForm(request.POST, request.FILES)
        if form.is_valid():
            #try:
            
            context = ContextUtils.handle_cxt_file(request.FILES['cxtfile'])
            cl = ConceptLattice(_context=context)
            cl.compute_lattice()
            
            cl.save()
            
            return render_to_response('fca/index.html', {'cxt_form': cxt_form, 'djson': FCAUtils.lattice_to_json_depth2(cl), 'workspace_slug':workspace_slug}, context_instance=RequestContext(request))

            #except Exception,e:
            #    return render_to_response('shared/error.html', {'error_msg': 'It was not possible to read the file. Please be sure it is a valid cxt file.'}, context_instance=RequestContext(request))
    else:
        form = LoadCxtForm()
        
        lattice_id = request.GET.get('lattice_id')
        
        if lattice_id:
            try:
                lattice = ConceptLattice.objects.get(id=lattice_id)
                return render_to_response('fca/index.html', {'cxt_form': cxt_form, 'djson': FCAUtils.lattice_to_json_depth2(lattice), 'workspace_slug':workspace_slug}, context_instance=RequestContext(request))
            except Exception:
                return render_to_response('shared/error.html', {'error_msg': 'Invalid lattice id.'}, context_instance=RequestContext(request))
    
            
    return render_to_response('fca/lattice', {'form': form})


@login_required
def generate_lattice(request, workspace_slug):
    cxt_form = LoadCxtForm()
    
    
    context_id = request.session['cur_context_id']#request.POST['id']
    context_file = ContextFile.objects.get(id=context_id)
    
    
    if context_file.disabled_attrs:
        enabled_attributes = []#list(set(context_file.context._attributes) - set(context_file.disabled_attrs))
        for attr in context_file.context._attributes:
            disabled = False
            for dis_attr in context_file.disabled_attrs:
                if dis_attr in attr:
                    disabled = True
                    break
            if not disabled:
                enabled_attributes.append(attr)
            
            
        context = context_file.context.extract_subcontext(enabled_attributes)
    else:
        context = context_file.context

    
    #try :
    cl = ConceptLattice(_context=context)
    cl.compute_lattice()
    cl.save()
    
    # update the current concept lattice
    context_file.lattice = cl
    context_file.save()
    
    #request.session['cur_lattice_id'] = cl.id

    #return render_to_response('fca/index.html', {'cxt_form': cxt_form, 'djson': FCAUtils.lattice_to_json_depth2(cl), 'workspace_slug':workspace_slug}, context_instance=RequestContext(request))
    return HttpResponseRedirect('/'+workspace_slug+'/fca/')
#    except Exception:
#            return render_to_response('shared/error.html', {'error_msg': 'Error computing concept lattice.'}, context_instance=RequestContext(request))



@login_required
def tree_transformation(request, workspace_slug):
    cxt_form = LoadCxtForm()
    
    contextfile = ContextFile.objects.get(id=request.session['cur_context_id'])
    
    #lattice_id = request.session['cur_lattice_id']#request.POST['id']
    #lattice = ConceptLattice.objects.get(id=lattice_id)
    
    criteria = request.GET['criteria']
    
    try:
        new_lattice = extract_tree(contextfile.lattice, criteria)
        new_lattice.save()
    
        #request.session['cur_lattice_id'] = new_lattice.id
        contextfile.lattice = new_lattice
        contextfile.save()

        return HttpResponseRedirect('/'+workspace_slug+'/fca/')
    except Exception,e:
        return render_to_response('shared/error.html', {'error_msg': e.message}, context_instance=RequestContext(request))
    


@login_required
def undo(request, workspace_slug):
    cxt_form = LoadCxtForm()
    
    context_id = request.session['cur_context_id']#request.POST['id']
    context = ContextFile.objects.get(id=context_id)
    tree = context.lattice
    
    if tree.original_id:
        original = ConceptLattice.objects.get(id=tree.original_id)
        #request.session['cur_lattice_id'] = lattice.original_id
        context.lattice = original
        context.save()
        tree.delete()
        
        return HttpResponseRedirect('/'+workspace_slug+'/fca/')
#        original_lattice = ConceptLattice.objects.get(id=lattice.original_id)
#        return render_to_response('fca/index.html', {'cxt_form': cxt_form, 'djson': FCAUtils.lattice_to_json_depth2(original_lattice),'workspace_slug':workspace_slug}, context_instance=RequestContext(request))
    else:
        return render_to_response('shared/error.html', {'error_msg': "original lattice not found"}, context_instance=RequestContext(request))


@login_required
def cluster(request, workspace_slug):
    cxt_form = LoadCxtForm()
    
    contextfile = ContextFile.objects.get(id=request.session['cur_context_id'])
    
    #lattice_id = request.session['cur_lattice_id']#request.POST['id']
    #lattice = ConceptLattice.objects.get(id=lattice_id)
    
    n_clusters = request.GET['n_clusters']
    
    try:
        sim_matrix = compute_similarity(contextfile.lattice)
        clusters = compute_spectral_clustering(sim_matrix, n_clusters)
        
        #find super concepts
        superconcepts = {}
        for cid in clusters:
            if clusters[cid] not in superconcepts:
                superconcepts[clusters[cid]] = Concept(extent=set(), intent=set())
                
                curr_concept = contextfile.lattice.get_concept_by_id(cid)
                superconcepts[clusters[cid]].intent.union(curr_concept.intent)
                superconcepts[clusters[cid]].extent.union(curr_concept.extent)
        
        #find links
        # TODO
        
        print str(clusters)
#        new_lattice.save()
#    
#        #request.session['cur_lattice_id'] = new_lattice.id
#        contextfile.lattice = new_lattice
#        contextfile.save()

        return HttpResponseRedirect('/'+workspace_slug+'/fca/')
    except Exception,e:
        return render_to_response('shared/error.html', {'error_msg': e.message}, context_instance=RequestContext(request))


@login_required
def set_preferred_vis(request, workspace_slug):
    pref_vis = request.POST['pref_vis']
    
    if pref_vis:
        request.session['pref_vis'] = pref_vis
    
    return HttpResponse(simplejson.dumps({"response": "OK"}), mimetype='application/json')

@login_required
def set_overwhelming_off(request, workspace_slug):
    
    request.session['overwhelming'] = False
    
    return HttpResponse(simplejson.dumps({"response": "OK"}), mimetype='application/json')
            
   
            
    


