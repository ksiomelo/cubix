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
from workspace.models import ContextFile, Workspace
from workspace.forms import LoadCxtForm, WorkspaceForm
from context import views
from decorators import get_contexts

#def index(request):
#    #Semantic.rdf_to_context("")
#    workspace_list = ContextFile.objects.all()
#    return render_to_response('semantics/index.html', {'workspace_list': workspace_list, context_instance=RequestContext(request)} )

@login_required
@get_contexts
def index(request):
    # Handle file upload
    if request.method == 'POST':
        form = WorkspaceForm(request.POST, request.FILES)
        if form.is_valid():
            newdoc = Workspace(title = request.POST['title'], title_slug = request.POST['title_slug'], owner = request.user)
            newdoc.save()

            # Redirect to a new context form
            #return HttpResponseRedirect(reverse('context.views.new'))
            #return render_to_response('context/new.html', {'form': form, 'djson': None}, context_instance=RequestContext(request))
            #return views.new(request, newdoc.title_slug)
            
            request.session['cur_workspace_id'] = newdoc.id
            request.session['cur_workspace_slug'] = newdoc.title_slug
            
            return HttpResponseRedirect('/'+newdoc.title_slug+'/context/new')
            #return redirect('context.views.new', workspace_slug=newdoc.title_slug)
    else:
        form = WorkspaceForm() # A empty, unbound form

    # Load documents for the list page
    workspace_list = Workspace.objects.all()
    
    #contexts = ContextFile.objects.all(workspace=workspace.id)

    return render_to_response(
        'workspace/index.html',
        {'workspace_list': workspace_list, 'form': form},
        context_instance=RequestContext(request)
    )


@login_required  #TODO verify it the user has permission for it
def delete(request, workspace_slug):
    #workspace_id = request.GET['id']
    workspace = Workspace.objects.get(title_slug__exact=workspace_slug)
    ContextFile.objects.filter(workspace=workspace).delete() # remove dependencies
    workspace.delete()
    
    if request.session['cur_workspace_slug'] == workspace_slug:
        request.session['cur_context_id'] = None
        request.session['cur_context_slug'] = None
        request.session['cur_workspace_id'] = None
        request.session['cur_workspace_slug'] = None
        request.session['cur_workspace'] = None
        
    #return redirect('workspace.views.index')
    return HttpResponseRedirect('/home/')






@login_required  #TODO verify it the user has permission for it
def show(request, workspace_slug):
    
#   try:
    
    workspace = Workspace.objects.get(title_slug__exact=workspace_slug) 
    
    contexts = ContextFile.objects.filter(workspace=workspace.id)
    
    if 'cur_workspace_slug' not in request.session or request.session['cur_workspace_slug'] != workspace_slug :
        request.session['cur_workspace_id'] = workspace.id
        request.session['cur_workspace_slug'] = workspace.title_slug
        request.session['cur_context_id'] = None
        request.session['cur_context_slug'] = None
    
    
#        if len(workspace.contexts) > 0:
#            request.session['cur_context_id'] = workspace.contexts[0].id
#            request.session['cur_context_slug'] = workspace.contexts[0].title
#            return HttpResponseRedirect('/'+workspace_slug+'/context/')
#        else:
#            request.session['cur_context_id'] = None
#            request.session['cur_context_slug'] = None
#            return HttpResponseRedirect('/home/')    
    return render_to_response(
            'workspace/show.html',
            {'workspace': workspace, 'contexts': contexts, 'workspace_slug':workspace_slug},
            context_instance=RequestContext(request)
        )
    
#    except Exception, e: 
#        #error_msg =  e.message if e.message else str(e.reason)
#        return render_to_response('shared/error.html', {'error_msg': "Workspace not found"}, context_instance=RequestContext(request))
#        
    
    
    #workspace = request.session['cur_workspace']
    
    
    
    
    

    
    
        
    
