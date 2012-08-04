'''
Created on Jul 20, 2012

@author: cassiomelo
tutorial http://dev.lethain.com/a-django-middleware-for-google-analytics-repost/
tutorial http://www.djangobook.com/en/beta/chapter16/
'''
from cubix.workspace.models import ContextFile

class ListWorkspacesMiddleware(object):
    
    
    def process_request(self, request):
        context_list = ContextFile.objects.all();
        #self.REQUEST["workspace_list"] = 
        request.context_list = context_list
    
    def process_view(self, request, view, args, kwargs):
        context_list = ContextFile.objects.all();
        #self.REQUEST["workspace_list"] = 
        request.context_list = context_list
