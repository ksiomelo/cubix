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

@login_required
def index(request):
    cxt_form = LoadCxtForm()
    return render_to_response('fca/index.html', {'cxt_form': cxt_form, 'djson': None}, context_instance=RequestContext(request))

    
@login_required
def load_cxt(request):
    cxt_form = LoadCxtForm()
    
    if request.method == 'POST':
        form = LoadCxtForm(request.POST, request.FILES)
        if form.is_valid():
            try:
            
                context = ContextUtils.handle_cxt_file(request.FILES['cxtfile'])
                cl = ConceptLattice(_context=context)
                cl.compute_lattice()
                
                cl.save()
                
                return render_to_response('fca/index.html', {'cxt_form': cxt_form, 'djson': FCAUtils.lattice_to_json_depth2(cl)}, context_instance=RequestContext(request))
    
            except Exception,e:
                return render_to_response('shared/error.html', {'error_msg': 'It was not possible to read the file. Please be sure it is a valid cxt file.'}, context_instance=RequestContext(request))
    
    
    else:
        form = LoadCxtForm()
        
        lattice_id = request.GET.get('lattice_id')
        
        if lattice_id:
            try:
                lattice = ConceptLattice.objects.get(id=lattice_id)
                return render_to_response('fca/index.html', {'cxt_form': cxt_form, 'djson': FCAUtils.lattice_to_json_depth2(lattice)}, context_instance=RequestContext(request))
            except Exception:
                return render_to_response('shared/error.html', {'error_msg': 'Invalid lattice id.'}, context_instance=RequestContext(request))
    
            
    return render_to_response('fca/lattice', {'form': form})
    


