#!/usr/bin/env python

import os,sys
import numpy as np
from matplotlib import rc,colors,colorbar
rc('text',usetex=True)
from matplotlib import pyplot as plt
try:
    from pygraphviz import AGraph
except:
    print "WARNING: pygraphviz not available"

### convert a tuple of RGB values to hexidecimal ###
def rgb_to_hex(rgb):
    return '#%02x%02x%02x' % rgb[:3]

### returns a color map of blues ###
def get_cmap_blues():

    cdict = {'red': ((0.0, 0.0, 0.0),
                     (1.0, 1.0, 0.0)),
             'green': ((0.0, 0.0, 0.0),
                       (1.0, 1.0, 0.0)),
             'blue': ((0.0, 0.0, 0.5),
                      (1.0, 1.0, 1.0))}
    my_cmap = colors.LinearSegmentedColormap('my_colormap',cdict,256)
    
    return my_cmap

### plots a colormap ###
def plot_cmap(cmap):
    fig = plt.figure(figsize=(8,2))
    ax1 = fig.add_axes([0.05, 0.65, 0.9, 0.15])
    cb1 = colorbar.ColorbarBase(ax1, cmap=cmap,orientation='horizontal')
    cb1.set_label(r'Increasing distance $\longrightarrow$')
    plt.savefig(os.path.join("colorbar.pdf"))

### renders a network as a graph ###
def plot_network_data(G,header,labels=None,name=None,layout="neato",nameDict=None,cMap=None,viewNoise=False,
                      dataMax=None,weighted=False,viewPlot=False,fileType='pdf',vizThreshold=None):

    ## declare variables
    colorList = ['orange','blue','magenta','black','cyan','yellow','red','white','green']
    #vizCutOff = 0.7   # percentage of the max value that we see in plot

    if labels != None:
        labels = [int(l) for l in labels]

    distances = []
    if weighted == True:   
        for edge in G.edges_iter(data=True):
            weight = edge[2]['weight']
            distances.append(weight)
    
    if weighted == True and vizThreshold != None:
        distances = np.array(distances)
        vizCutOff = distances.max() * vizThreshold
    
        ## debug
        #print 'min', distances.min()
        #print 'max', distances.max()
        #print 'vizThresh', vizThreshold
        #print 'vizCutOff', vizCutOff

    ## if no name given give a generic name to plot 
    if name == None:
        name = re.sub("\s+|:","",time.asctime())

    name=name + ".%s"%fileType

    ## takes as input a networkx graph
    A = AGraph()
    for edge in G.edges_iter(data=True):
        if vizThreshold != None and edge[2]['weight'] < vizCutOff:  ## we use less than when it is affinity mat
            continue 

        if viewNoise == False:
            geneIndA = header.index(edge[0])
            geneIndB = header.index(edge[1])
            if int(labels[geneIndA]) == 999 or int(labels[geneIndB]) == 999:
                continue

        if A.has_edge(edge[0],edge[1]) == False:
            A.add_edge(edge[0],edge[1])
        
    if labels != None:
        numClusters = len(list(set(labels)))

    ## configure the nodes 
    for i in range(len(header)):
        node = header[i]
        if A.has_node(node) == False:
            continue
        n = A.get_node(node)
        n.attr['style'] = 'filled'
        n.attr['shape'] = 'oval'

        if labels !=None:
            if labels[i] == 999:
                n.attr['fillcolor'] = 'gray'
            else:
                n.attr['fillcolor'] = colorList[labels[i]]

                if colorList[labels[i]] in ['blue','green','black']:
                    n.attr['fontcolor'] = 'white'
                    
        else:
            n.attr['label'] = ' '

        if nameDict != None and labels != None:
            n.attr['label'] = nameDict[node]    
                    
    ## configure the edges if given a cmap
    #if cMap != None and weighted == True:
    #    for edge in G.edges_iter(data=1): 
    #        distance = edge[2]['weight']
    #
    #        if vizCutOff != None and edge[2]['weight'] > vizCutOff:
    #            continue
    #       
    #        e = A.get_edge(edge[0],edge[1])
    #        
    #        ### squish the data between 0 and 1
    #        normizedDist = distance / distances.max()
    # 
    #        rgbVal = cMap(normizedDist)
    #        rgbVal = tuple([val * 256 for val in rgbVal[:3]])
    #        hexVal = rgb_to_hex(rgbVal)
    #        e.attr['color'] = hexVal
    #        e.attr['style'] = "setlinewidth(3)"
    #
    

    ## configure graph attributes  
    A.graph_attr['overlap'] = 'false'
    A.graph_attr['outputorder'] = 'edgesfirst'
    A.node_attr['color'] = 'black'

    ## draw and view the plot
    A.draw(name,prog=layout)



    if viewPlot == True:
        os.system("eog %s" % name)

try:
    import matplotlib.pyplot as plt
except:
    raise

import networkx as nx
import math


#circular_layout
#fruchterman_reingold_layout
#graphviz_layout
#layout
#pygraphviz_layout
#random_layout
#shell_layout
#spectral_layout
#spring_layout

#try:
#    from networkx import graphviz_layout
#    layout=nx.graphviz_layout
#except ImportError:
#    print "PyGraphviz not found; drawing with spring layout; will be slow."
#    layout=nx.circular_layout

#def highlighted_subplot(G,header,labels=None,name=None,layout="neato",nameDict=None,cMap=None,viewNoise=False,
#                        dataMax=None,weighted=False,viewPlot=False,fileType='pdf',vizThreshold=None)


def highlighted_subplot(G,subgraphColored, subgraphHighlight,savefig=None,show=False,title=None,fig=None, showLabels=False,ax=None,excludedNodes=[],
                        excludedEdges=[],threshold=None):

    
    layout = nx.graphviz_layout#nx.circular_layout, nx.circular_layout
    G = G.copy()

    if type(subgraphColored) != type([]):
        print "ERROR: input error subgraphlist is a list"
        return

    colors = ["#0000FF","#FFFF00", "#9900CC","#FF3300", "#0099FF","#00CC00", "#FFCCCC","#330066"
              "#FF0000","#FF9999", "#FF9966", "#FFFF99", "#99FF99","#FFFF00","#99FFFF", "#66CCFF", "#9999FF", "#FF99FF",
              "#000000", "#999999", "#660000", "#003300","#003399", "#CCCCFF","#000066", "#660066",
              "#666666", "#CCCCCC", "#CCFFCC", "#FF0099","#FFCCFF", "#996633"]

    if ax == None:
        fig = plt.figure(1,figsize=(8,7))
        ax = fig.add_subplot(111)
    
    ax.clear()
    pos=layout(G)

    if showLabels == True:
        nodeSize = 800
    else:
        nodeSize = 1500

    ## remove any specified edges
    if len(excludedEdges) > 0:
        for edge in excludedEdges:
            if G.has_edge(edge[0],edge[1]) == False:
                print "wARNING: trying to remove edge not in graph", edge
            else:
                G.remove_edge(edge[0],edge[1])
        for subgraph in subgraphColored:
            if subgraph.has_edge(edge[0],edge[1]):
                subgraph.remove_edge(edge[0],edge[1])
        for subgraph in subgraphHighlight:
            if subgraph.has_edge(edge[0],edge[1]):
                subgraph.remove_edge(edge[0],edge[1])

    ## remove any specified nodes
    if len(excludedNodes) > 0:
        for node in excludedNodes:
            if G.has_node(node) == False:
                print 'WARNING: Trying to remove node not in graph', node
            else:
                G.remove_node(node)
        for subgraph in subgraphColored:
            if subgraph.has_node(node) == True:
                subgraph.remove_node(node)

        for subgraph in subgraphHighlight:
            if subgraph.has_node(node) == True:
                subgraph.remove_node(node)

    ## renumber the newlabels to be 
    ## add the labels
    subgraphCount = -1
    for nodeList in subgraphColored:
        subgraphCount+=1
        nx.draw_networkx_nodes(G,pos,
                               with_labels=True,
                               nodelist=nodeList,
                               node_color=colors[subgraphCount],
                               alpha=0.7,
                               node_size=nodeSize,
                               node_shape='o'
                               )

    ## reduce the edges shown
    for s in range(len(subgraphHighlight)):
        subgraph = subgraphHighlight[s]
        newSubgraph = nx.Graph()
        medianEdge = np.median(np.array([e[2]['weight'] for e in subgraph.edges_iter(data=True)]))

        for edge in subgraph.edges_iter(data=True):
            if edge[2]['weight'] > medianEdge:
                newSubgraph.add_edge(edge[0],edge[1])
            if newSubgraph.has_node(edge[0]) == False:
                newSubgraph.add_node(edge[0])
            if newSubgraph.has_node(edge[1]) == False:
                newSubgraph.add_node(edge[1])

        subgraphHighlight[s] = newSubgraph

    ## highlight the connected subgraph
    subgraphCount = -1
    for subgraph in subgraphHighlight:
        subgraphCount+=1 
        nx.draw_networkx_edges(subgraph,pos,
                               with_labels=False,
                               edge_color=colors[subgraphCount],
                               width=1.0,
                               alpha=0.5
                               )

    # some math labels
    if showLabels == True:
        nx.draw_networkx_labels(G,pos,font_size=9,font_color='k')

    ## plot configure
    if title != None:
        ax.set_title(title)

    if savefig != None:
        plt.savefig(savefig)

    if show == True:
        plt.show()

def permute_list(lst):
    sz = len(lst)
    if sz <= 1:
        return [lst]
    return [p[:i]+[lst[0]]+p[i:] for i in xrange(sz) for p in permute_list(lst[1:])]

def permute_labels(trueLabels,newLabels):
    trueLabels = np.array([int(l) for l in trueLabels])
    newLabels = np.array([int(l) for l in newLabels])

    k = np.sort(np.unique(trueLabels)).size
    permutations = permute_list(range(k))
    minDiff = np.sum(np.abs(trueLabels - newLabels))

    for perm in permutations:
        permLabels = np.array([perm[i] for i in newLabels])
        absDiff = np.abs(trueLabels - permLabels)
        diff = len(np.where(absDiff >= 1)[0])

        if diff < minDiff:
            newLabels = permLabels
            minDiff = diff

    return newLabels
