from django import forms
from django.core.files.storage import FileSystemStorage

#fs = FileSystemStorage(location='/media/context')

class LoadCxtForm(forms.Form):
    cxtfile  = forms.FileField()