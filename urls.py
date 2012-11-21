from django.conf.urls.defaults import patterns, include, url
from django.conf import settings
from django.contrib import admin
admin.autodiscover()


## ADMIN
urlpatterns = patterns('',
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

## API
urlpatterns += patterns('api.views',
    (r'^api/v1/metrics/$', 'calculate_metric'),
    (r'^api/v1/sparql/search$', 'sparql_search'),
    (r'^api/v1/context/$', 'get_context'),
    (r'^api/v1/context/n_concepts$', 'get_number_concepts'),
    (r'^api/v1/lattice/$', 'get_lattice'),
    (r'^api/v1/lattices/$', 'get_lattices'),
    (r'^api/v1/lattice/sample$', 'sample_lattice'),
    (r'^api/v1/association_rules/$', 'mine_association_rules'),
    
)


# FCA
urlpatterns += patterns('fca.views',
    (r'^(?P<workspace_slug>[-\w]+)/fca/$', 'index'),
    (r'^(?P<workspace_slug>[-\w]+)/fca/undo$', 'undo'),
    (r'^(?P<workspace_slug>[-\w]+)/fca/transform/$', 'tree_transformation'),
    (r'^(?P<workspace_slug>[-\w]+)/fca/cluster/$', 'cluster'),
    (r'^(?P<workspace_slug>[-\w]+)/fca/load_cxt/$', 'load_cxt'),
    (r'^(?P<workspace_slug>[-\w]+)/fca/show$', 'load_cxt'),
    (r'^(?P<workspace_slug>[-\w]+)/fca/generate', 'generate_lattice'),
    (r'^(?P<workspace_slug>[-\w]+)/fca/set_preferred_vis', 'set_preferred_vis'),
    (r'^(?P<workspace_slug>[-\w]+)/fca/set_overwhelming_off', 'set_overwhelming_off'),
    #(r'^fca/compute/(?P<metric>\w+)/$', 'compute_metric'),
)

# CONTEXT
urlpatterns += patterns('context.views',
    (r'^(?P<workspace_slug>[-\w]+)/context/select', 'select'),
    (r'^(?P<workspace_slug>[-\w]+)/context/disable_attr', 'disable_attr'),
    (r'^(?P<workspace_slug>[-\w]+)/context/new', 'new'),
    (r'^(?P<workspace_slug>[-\w]+)/context/cluster', 'cluster'),
    (r'^(?P<workspace_slug>[-\w]+)/context/delete', 'delete'),
    (r'^(?P<workspace_slug>[-\w]+)/context/load', 'load_from_sparql'),
    (r'^(?P<workspace_slug>[-\w]+)/context/', 'show'),

)




# SEMANTICS
urlpatterns += patterns('semantics.views',
    (r'^(?P<workspace_slug>[-\w]+)/semantics/$', 'index'),
    (r'^(?P<workspace_slug>[-\w]+)/semantics/search$', 'search'),
    (r'^(?P<workspace_slug>[-\w]+)/semantics/context$', 'sparql2context'),
    #(r'^semantics/search/(?P<format>\w+)$','search'),
)

# WORKSPACES
urlpatterns += patterns('workspace.views',
    (r'^workspace/$', 'index'),
    (r'^(?P<workspace_slug>[-\w]+)/$', 'show'),
    (r'^(?P<workspace_slug>[-\w]+)/delete', 'delete'),
)


