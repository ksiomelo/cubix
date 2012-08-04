from django.conf.urls.defaults import patterns, include, url
from django.conf import settings
from django.contrib import admin
admin.autodiscover()

## API
urlpatterns = patterns('api.views',
    (r'^api/v1/sparql/search$', 'sparql_search'),
    (r'^api/v1/context/$', 'get_context'),
    (r'^api/v1/lattice/$', 'get_lattice'),
    (r'^api/v1/lattices/$', 'get_lattices'),
    (r'^api/v1/lattice/sample$', 'sample_lattice'),
    (r'^api/v1/association_rules/$', 'mine_association_rules'),
    (r'^api/v1/metrics/$', 'calculate_metric'),
)

# WORKSPACES
urlpatterns += patterns('workspace.views',
    (r'^workspace/$', 'index'),
    (r'^(?P<workspace_slug>[-\w]+)/delete', 'delete'),
    (r'^(?P<workspace_slug>[-\w]+)/select', 'select'),
    
)

# CONTEXT
urlpatterns += patterns('context.views',
    (r'^(?P<workspace_slug>[-\w]+)/context/new', 'new'),
    (r'^(?P<workspace_slug>[-\w]+)/context/', 'show'),
)



# FCA
urlpatterns += patterns('fca.views',
    (r'^(?P<workspace_slug>[-\w]+)/fca/$', 'index'),
    (r'^(?P<workspace_slug>[-\w]+)/fca/load_cxt/$', 'load_cxt'),
    (r'^(?P<workspace_slug>[-\w]+)/fca/show$', 'load_cxt'),
    #(r'^fca/compute/(?P<metric>\w+)/$', 'compute_metric'),
)

# SEMANTICS
urlpatterns += patterns('semantics.views',
    (r'^semantics/$', 'index'),
    (r'^semantics/search$', 'search'),
    (r'^semantics/context$', 'sparql2context'),
    #(r'^semantics/search/(?P<format>\w+)$','search'),
)

## ADMIN
urlpatterns += patterns('',
    (r'^admin/', include(admin.site.urls)),
    (r'^login/$', 'django.contrib.auth.views.login', {'template_name': 'user/login.html'}),
    (r'^logout/$', 'django.contrib.auth.views.logout', {'next_page': '/login'}),
    (r'^home/$', 'workspace.views.index'),
    (r'^$', 'workspace.views.index'),

)

# STATIC
urlpatterns += patterns('',
    (r'^static/(?P<path>.*)$', 'django.views.static.serve', {'document_root': settings.STATIC_ROOT}),
)