import simplejson #as json # no jython: import json
from django.core.urlresolvers import reverse
from django.http import HttpResponse, HttpResponseRedirect
from django.contrib.auth.decorators import login_required
from django.shortcuts import render_to_response, get_object_or_404, redirect
from django.template import RequestContext
from django.middleware.csrf import get_token
from django.core import serializers
from semantics.search import Semantic
from django.utils.html import escape
from workspace.models import ContextFile
from workspace.forms import LoadCxtForm
from decorators import get_contexts
from fca.readwrite import cxt
from django.conf import settings

@get_contexts
def new(request, workspace_slug):
    # Handle file upload
    if request.method == 'POST':
        form = LoadCxtForm(request.POST, request.FILES)
        if form.is_valid():
            wkspace = request.session['cur_workspace']
            newdoc = ContextFile(cxtfile = request.FILES['cxtfile'], title = request.POST['title'], workspace = wkspace)
            
            wkspace.contexts.append(newdoc)
            wkspace.save()
            
            # READ FILE
            try:
                context = cxt.read_cxt(newdoc.cxtfile.path)
                context.save()
            except Exception,e:
                return render_to_response('shared/error.html', {'error_msg': 'It was not possible to read the file. Please be sure it is a valid cxt file.'}, context_instance=RequestContext(request))
    
            
            
            # SAVE DATA FILE AND UPDATE WORKSPACE
            newdoc.context = context
            newdoc.save() # TODO is it really necessary to save the entity twice????
            
            
            
            
            request.session['cur_context_id'] = newdoc.id
            request.session['cur_context_slug'] = newdoc.title

            # Redirect to the document list after POST
            #return render_to_response( 'context/index.html', {'context': newdoc, 'form': form}, context_instance=RequestContext(request) )
            return redirect('context.views.show')
            #return HttpResponseRedirect('/home/', {'context': newdoc, 'form': form}, context_instance=RequestContext(request) )
    else:
        form = LoadCxtForm() # A empty, unbound form

    # Load documents for the list page
    #workspace_list = ContextFile.objects.all()

    # Render list page with the documents and the form
    return render_to_response(
        'context/new.html',
        {'form': form, 'workspace_slug': workspace_slug},
        context_instance=RequestContext(request)
    )

def show(request, workspace_slug):
    
    context_id = request.session['cur_context_id']#request.POST['id']
    context_file = ContextFile.objects.get(id=context_id)
    
    form = LoadCxtForm() # A empty, unbound form

    # Load documents for the list page
    #workspace_list = ContextFile.objects.all()
    
    #thevalues = abc.values()
    
#    for a in abc:
#        print a 
    # Render list page with the documents and the form
    return render_to_response(
        'context/index.html',
        {'form': form, 'context_file':context_file, 'context': context_file.context, 'attr_values':  context_file.context.get_attribute_names_and_values(),\
         'attr_objects':context_file.context.get_attribute_objects()},
        context_instance=RequestContext(request)
    )

    
    
        
    
