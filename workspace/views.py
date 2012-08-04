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
            
            return redirect('context.views.new', workspace_slug=newdoc.title_slug)
            # OR title_slug/context/create
    else:
        form = WorkspaceForm() # A empty, unbound form

    # Load documents for the list page
    workspace_list = Workspace.objects.all()

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
def select(request, workspace_slug):
    
    workspace = Workspace.objects.get(title_slug__exact=workspace_slug)
    request.session['cur_workspace_slug'] = workspace_slug
    
    if len(workspace.contexts) > 0:
        request.session['cur_context_id'] = workspace.contexts[0].id
        request.session['cur_context_slug'] = workspace.contexts[0].title
        return HttpResponseRedirect('/'+workspace_slug+'/context/')
    else:
        request.session['cur_context_id'] = None
        request.session['cur_context_slug'] = None
        return HttpResponseRedirect('/home/')
    #return redirect('workspace.views.index')
    

#
#def list(request):
#    # Handle file upload
#    if request.method == 'POST':
#        form = LoadCxtForm(request.POST, request.FILES)
#        if form.is_valid():
#            newdoc = ContextFile(cxtfile = request.FILES['cxtfile'], title = request.POST['title'])
#            newdoc.save()
#
#            # Redirect to the document list after POST
#            return HttpResponseRedirect(reverse('workspace.views.index'))
#    else:
#        form = LoadCxtForm() # A empty, unbound form
#
#    # Load documents for the list page
#    workspace_list = ContextFile.objects.all()
#
#    # Render list page with the documents and the form
#    return render_to_response(
#        'workspace/index.html',
#        {'workspace_list': workspace_list, 'form': form},
#        context_instance=RequestContext(request)
#    )


    
    
        
    
