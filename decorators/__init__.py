

from functools import wraps
from workspace.models import Workspace

def get_contexts(func):
    @wraps(func)
    def _decorator(request, *args, **kwargs):
#        from django.contrib.auth import authenticate, login
#        if request.META.has_key('HTTP_AUTHORIZATION'):
#            authmeth, auth = request.META['HTTP_AUTHORIZATION'].split(' ', 1)
#            if authmeth.lower() == 'basic':
#                auth = auth.strip().decode('base64')
#                username, password = auth.split(':', 1)
#                user = authenticate(username=username, password=password)
#                if user:
#                    login(request, user)

        if request.session['cur_workspace_slug']:
            workspace_slug = request.session['cur_workspace_slug']
            try:
                workspace = Workspace.objects.get(title_slug__exact=workspace_slug)
                request.session['cur_workspace'] = workspace
            except Exception, e:
                request.session['cur_workspace'] = None
        else:
            request.session['cur_workspace'] = None
        
        return func(request, *args, **kwargs)
    return _decorator