from django import forms
from django.core.files.storage import FileSystemStorage
from workspace.models import Workspace

#fs = FileSystemStorage(location='/media/context')

#FILE_TYPES = ('cxt', 'csv')

class SlugField(forms.CharField):
    def clean(self, request, initial=None):
        field = super(SlugField, self).clean(request)

        if len(Workspace.objects.filter(title_slug=request)) > 0:
        #slug = Workspace(title_slug=request)
        #if slug is not None:
            raise forms.ValidationError("That slug is already taken")
        
class LoadCxtForm(forms.Form):
    title = forms.CharField(max_length=200);
    
    cxtfile = forms.FileField(
        label='Select a file',
        help_text='max. 42 megabytes'
    )
    
class WorkspaceForm(forms.Form):
    class Meta:
        model = Workspace

    title = forms.CharField(max_length=70);
    title_slug = SlugField(max_length=100);
    
    

