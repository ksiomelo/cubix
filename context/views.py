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
from workspace.forms import LoadCxtForm
from decorators import get_contexts
from fca.readwrite import cxt, comma_separated
from django.conf import settings
from fca.context import Context

@get_contexts
def new(request, workspace_slug):
    # Handle file upload
    if request.method == 'POST':
        form = LoadCxtForm(request.POST, request.FILES)
        if form.is_valid():
            wkspace = request.session['cur_workspace']
            newdoc = ContextFile(cxtfile = request.FILES['cxtfile'], title = request.POST['title'], workspace = wkspace)
            
            newdoc.save() # TODO is it really necessary to save the entity twice????
            
            wkspace.contexts.append(newdoc) # newdoc.id
            wkspace.save()
            
            # READ FILE
            try:
                
                if request.POST["file_type"] == "cxt":
                    context = cxt.read_cxt(newdoc.cxtfile.path)
                elif request.POST["file_type"] == "csv":
                    context = comma_separated.read_csv(newdoc.cxtfile.path)
                context.save()
            except Exception,e:
                return render_to_response('shared/error.html', {'error_msg': 'It was not possible to read the file. Please be sure it is a valid '+request.POST["file_type"]+' file.'}, context_instance=RequestContext(request))
    
            
            
            # SAVE DATA FILE AND UPDATE WORKSPACE
            newdoc.context = context
            newdoc.save() # TODO is it really necessary to save the entity twice????
            
            
            
            
            request.session['cur_context_id'] = newdoc.id
            request.session['cur_context_slug'] = newdoc.title

            # Redirect to the document list after POST
            #return render_to_response( 'context/index.html', {'context': newdoc, 'form': form}, context_instance=RequestContext(request) )
            #return redirect('context.views.show')
            return HttpResponseRedirect('/'+workspace_slug+'/context')
            #return HttpResponseRedirect('/home/', {'context': newdoc, 'form': form}, context_instance=RequestContext(request) )
    else:
        form = LoadCxtForm() # A empty, unbound form

        request.session['cur_context_id'] = None
        request.session['cur_context_slug'] = None

    # Render list page with the documents and the form
    return render_to_response(
        'context/new.html',
        {'form': form, 'workspace_slug': workspace_slug},
        context_instance=RequestContext(request)
    )

@get_contexts
def show(request, workspace_slug):
    
    context_id = request.session['cur_context_id']#request.POST['id']
    context_file = ContextFile.objects.get(id=context_id)
    form = LoadCxtForm() # A empty, unbound form

    #TODO this logic should be applied to all actions in all views
    error_msg = ''
    if "error_msg" in request.session:
        error_msg = request.session['error_msg']
        request.session['error_msg'] = None
    
    return render_to_response(
        'context/index.html',
        {'cxtform': form, 'context_file':context_file, 'context': context_file.context, 'attr_values':  context_file.context.get_attribute_names_and_values(),\
         'attr_objects':context_file.context.get_attribute_objects(), 'workspace_slug':workspace_slug, 'error_msg': error_msg},
        context_instance=RequestContext(request)
    )

    
@login_required  #TODO verify it the user has permission for it
@get_contexts
def delete(request, workspace_slug):
    context_id = request.GET['id']
    contextfile = ContextFile.objects.get(id=context_id)
    
    
    workspace = Workspace.objects.get(id=request.session['cur_workspace_id'])
    workspace.contexts.remove(contextfile)
    workspace.save()
    
    contextfile.delete()
    
    if request.session['cur_context_id'] == context_id:
        request.session['cur_context_id'] = None
        request.session['cur_context_slug'] = None
        
    #return redirect('workspace.views.index')
    return HttpResponseRedirect('/'+workspace_slug+'/')


@login_required  #TODO verify it the user has permission for it
def select(request, workspace_slug):
    
    context_id = request.GET['id']
    contextfile = ContextFile.objects.get(id=context_id)
    
    workspace = Workspace.objects.get(title_slug__exact=workspace_slug)
    
    request.session['cur_workspace_slug'] = workspace_slug
    request.session['cur_workspace_id'] = workspace.id
    request.session['cur_context_id'] = contextfile.id
    request.session['cur_context_slug'] = contextfile.title
    
    return HttpResponseRedirect('/'+workspace_slug+'/context/')


@login_required  #TODO verify it the user has permission for it
@get_contexts
def cluster(request, workspace_slug):
    context_id = request.session['cur_context_id'] #request.GET['id']
    contextfile = ContextFile.objects.get(id=context_id)
    
    #new_context = Context()
    threshold = float(request.POST["similarity_value"][:-1])/float(100)
    new_table = []
    new_attributes = []
    similarity_matrix = {}
    
    if request.POST['cluster_type'] == 'attr':
        for attribute1 in contextfile.context._attributes:
            for attribute2 in contextfile.context._attributes:
                if attribute1 != attribute2:
                    
                    set1 = set(contextfile.context.get_attribute_extent(attribute1))
                    set2 = set(contextfile.context.get_attribute_extent(attribute2))
                    
                    sim = len(set1.intersection(set2))/float(len(set1.union(set2)))
                    
                    if  (attribute1 not in similarity_matrix) or (attribute2 not in similarity_matrix):
                        similarity_matrix[attribute1] = {attribute2:sim}
                        similarity_matrix[attribute2] = {attribute1:sim}
                    else:
                        similarity_matrix[attribute1][attribute2] = sim
                        similarity_matrix[attribute2][attribute1] = sim
                    
                    
                    
    #merge
    marked_to_merge = {}
    to_merge = []
    for attr1 in similarity_matrix:
        max = 0
        if attr1 in marked_to_merge:
                continue

        for attr2 in similarity_matrix[attr1]:
            if attr2 in marked_to_merge:
                continue
            if similarity_matrix[attr1][attr2] > max:
                max = similarity_matrix[attr1][attr2]
                if max >= threshold:
                    marked_to_merge[attr1] = True
                    marked_to_merge[attr2] = True
                    to_merge.append([attr1,attr2])
                    
                    
    for attr in contextfile.context._attributes:
        if attr not in marked_to_merge:
            new_attributes.append(attr)
            
#    for merge_attrs in to_merge:
#        new_attributes.append(attr).
         
    return HttpResponseRedirect('/'+workspace_slug+'/context/')


@get_contexts
def load_from_sparql(request,workspace_slug):
    try:
        results_table = request.POST.get('results_table')
        hide_prefix = (request.POST.get('hide_prefix')=='true')
        col_types = request.POST.get('col_types')
        
        cxt = Semantic.sparql2context2(results_table, col_types, hide_prefix)
        cxt.save()
        
        cxtfile = ContextFile()
        cxtfile.title = 'Untitled'
        cxtfile.owner = request.user
        cxtfile.context = cxt
        cxtfile.workspace = request.session['cur_workspace']
        
        cxtfile.save()
        
        request.session['cur_context_id'] = cxtfile.id
        
        #transform and save context
        
                
        #cl.save()
        return HttpResponseRedirect('/'+workspace_slug+'/context/')
    
    except Exception, e: 
            error_msg =  e.message if e.message else str(e.reason)
            return render_to_response('shared/error.html', {'error_msg': error_msg}, context_instance=RequestContext(request))
        
"""
DISABLES AN ATTRIBUTE FROM THE CONTEXT (KEEPS IT BUT NOT ACTIVE) 
"""
def disable_attr(request, workspace_slug):
    try:
        attr_name = request.POST.get('attribute_name')
        disable = (request.POST.get('disable')=='true') #disable= False then enable
        
        context_id = request.session['cur_context_id']
        context_file = ContextFile.objects.get(id=context_id)
        
        if disable:
            if attr_name not in context_file.disabled_attrs: #avoid duplicates
                context_file.disabled_attrs.append(attr_name)
        else:
            context_file.disabled_attrs.remove(attr_name)
        
        context_file.save()
        
        return HttpResponse('{ success: true }', mimetype="application/json")
    
    except Exception, e: 
            return HttpResponse('{ success: false }', mimetype="application/json")
    
    
        
    
