import sys,os,re,time,cPickle
import numpy as np
from networkx import bidirectional_dijkstra,shortest_path_length
import networkx as nx
from scipy.cluster.vq import kmeans2
import scipy.stats as stats
import matplotlib.pyplot as plt
from scipy.spatial.distance import pdist,cdist,squareform
#from SpectralMix import SilValueGenerator
#from mpl_toolkits.mplot3d import Axes3D
EPS = np.finfo(float).eps
## the base cluster class for other spectral clustering methods 


class ClusterBase:
    ## constructor   
    # this class takes as input a raw matrix consisting of observations and features
    # the observations occupy the rows and the features the rows     
    # the class also takes as input a similarity matrix or a networkx graph
    # @param mat is a raw matrix (numpp.array((n,d))) or a networkx graph
    # @param k is the number of components in the mixture
    # @param dataHeader is a list or numpy.array() of length n consisting of labels for the data 
    # @param labels are an optional vector corresponding to dataHeader that is used for evalutaion purposes  
    # @param dtype is the data type that may be 'raw', 'similarity' or 'graph'
    # @param weighted defines whether the input graph is of type weighted or not (True or False)
    # @param verbose generally used for debugging mode
    # @param refine used to specify the method for noise refinement 'kmeans'
    # @param classify step used to carry out the clustering of the normalized stacked and ranked eigenvectors
    # Note on distance matrics:
    # \li chebyshev - the Chebyshev distance.
    # \li cityblock - the Manhattan distance.
    # \li correlation - the Correlation distance.
    # \li cosine - the Cosine distance.
    # \li euclidean - the Euclidean distance.
    # \li hamming - the Hamming distance (boolean).
    # \li mahalanobis - the Mahalanobis distance.
    # \li minkowski - the Minkowski distance.
    # \li seuclidean - the normalized Euclidean distance.
    # \li sqeuclidean - the squared Euclidean distance.
    def __init__(self,mat,k=None,dataHeader=None,labels=None,dtype='raw',weighted=False,verbose=False,classifyStep='kmeans',dmatPath=None,projID='generic'):
            
        ## error check input
        if dtype not in ['raw','graph','distance']:
            raise ValueError, "matrix input type not valid", dtype

        ## class-wide variables
        self.k = k
        self.dtype = dtype
        self.weighted = weighted
        self.verbose = verbose
        self.noiseValue = 999
        self.projID = projID
        self.dmatPath = dmatPath
        self.unusedGenes = None
        self.unusedIndices = None
        usedIndices = None

        if dtype == 'graph':
            self.G = mat
            self.n = len(self.G.nodes())
        else:
            self.mat = mat
            self.n ,self.d = np.shape(mat)

        ## handle header and labels
        if dataHeader != None:
            self.dataHeader = [dat for dat in dataHeader]
            self.origDataHeader = [odat for odat in dataHeader]
        else:
            self.dataHeader = None
            self.origDataHeader = None
        if labels != None:
            self.origLabels = np.array([float(l) for l in labels])
            self.labels  = np.array([float(l) for l in labels])
        else:
            self.labels = None
            self.origLabels = None

    #################
    ###  methods  ###
    #################

    def graph_to_distance_mat(self,G,dataHeader,weighted=False,reweighting=True,verbose=False):
        nodeList = dataHeader
        n = len(nodeList)
        dMat = np.zeros((n,n))
        
        if verbose == True:
            print "\tINFO: making graph from distance matrix... reweighting is %s"%reweighting 

        ### get all pairwise shortest paths and add distance to matrix
        total = (n * (n-1)) / 2.0
        count = 0 
        for i in range(n):
            nodeI = nodeList[i]
            for j in range(n):
                nodeJ = nodeList[j]

                if j >= i:
                    continue

                if reweighting == True:
                    if weighted == True:
                        bdResults = bidirectional_dijkstra(G,nodeI,nodeJ)
                        if bdResults == False:
                            distance = 1e08
                        else:
                            distance, dijkPath = bdResults
                    else:
                        distance = shortest_path_length(G,nodeI,nodeJ)
                
                    dMat[i,j] = distance
                    dMat[j,i] = distance
                else:
                    if G.has_edge(nodeI,nodeJ) == True or G.has_edge(nodeJ,nodeI) == True:
                        weight = G[nodeI][nodeJ]['weight']
                        dMat[i,j] = weight
                        dMat[j,i] = weight
            
                count+=1
                #if verbose == True:
                #    if count%100.0 == 0.0:
                #        print "\t\tpercent complete",round(float(count) / float(total) * 100.0,2), '%'
        #print "\t\tpercent complete 100", '%'
        return dMat

    # mat is a matrix of type numpy.array(n,d) where n are the observations and d are features
    def raw_to_distance_mat(self,mat):
        values = pdist(mat,'sqeuclidean')     # sqeuclidean, euclidean
        dMat = squareform(values)

        return dMat

    # dMmat is a symmetric positive distance matrix of type numpy.array(n,n) where n are the observations
    # sigma is the bandwidth parameter that controls how quickly the affinity drops off 
    # the 1.0 or -1.0 in the numerator is used to control the direction of the drop.
    def distance_to_affinity_mat(self,dMat,sigma,reshape=True):
        if dMat == None:
            print "ERROR: distance matrix is None cannot find affinity"
            return None

        aMat = np.exp(-1.0 * (dMat**2.0)  /  2.0 * (sigma**2.0))
       
        if reshape == True:
             aMat = self._reshape_affinity_matrix_to_original_header(aMat)

        return aMat
    
    # aram sigma is the bandwidth parameter that controls how quickly the affinity drops off 
    def get_affinity_matrix(self,sigma,reshape=True,reweighting=True,verbose=False):
        self._error_check_input_data()
        dmatPickle = 'NotAFile'

        if self.dtype == 'raw':
            self.dMat = self.raw_to_distance_mat(self.mat)
        elif self.dtype == 'graph':
            print 'dtype is ', self.dtype
            if self.dmatPath != None and os.path.isfile(self.dmatPath) == False:
                if verbose == True:
                    print '\t...............creating new dMat to be pickled...'
                self.dMat = self.graph_to_distance_mat(self.G,self.dataHeader,weighted=self.weighted,reweighting=reweighting,verbose=verbose)
                cPickle.dump(self.dMat,open(self.dmatPath,'w'))
            elif self.dmatPath != None and os.path.isfile(self.dmatPath) == True:
                if verbose== True:
                    print '\t...............using pickled dmat'
                self.dMat = cPickle.load(open(self.dmatPath,'r'))
            else:
                self.dMat = self.graph_to_distance_mat(self.G,self.dataHeader,weighted=self.weighted,reweighting=reweighting,verbose=verbose)
       
        elif self.dtype == 'distance':
            self.dMat = self.mat

        if self.dMat == None:
            print "ERROR: did not find dMat"
            return None

        aMat = self.distance_to_affinity_mat(self.dMat,sigma,reshape=reshape)
        
        if aMat == None:
            print "ERROR: could not find aMat"
            return None

        return aMat
            
    def affinity_to_diagonal_mat(self,aMat):
        diaMat = np.diag(aMat.sum(axis=1)**-0.5)

        return diaMat

    def affinity_to_nx(self,aMat,header):
        G = nx.Graph()
        distances = []
        n,m =  np.shape(aMat)
        if n != m or n != np.size(header):
            print "INPUT ERROR: for affinity to nx - sizes must be the same"
            return None

        for i in range(n):
            nodeI = header[i]
            for j in range(n):
                nodeJ = header[j]
                if j >= i:
                    continue
                
                G.add_edge(nodeI, nodeJ, weight=aMat[i,j])
                distances.append(aMat[i,j])
        
        return G, distances

    def get_silhouette_values(self,rawMat,dMat=None,labels=None):

        if labels == None:
            centroids, labels = kmeans2(rawMat,self.k,iter=25,minit='points')
   
        svg= SilValueGenerator(rawMat,labels)
        return svg.silValues
        
    def _generate_heatmap(self,mat):
        cMap = self.plt.cm.spectral   # jet, hot, gist_stern  
        self.plt.imshow(mat,aspect='auto',interpolation='nearest',cmap=cMap)
        #self.plt.colorbar()

    def _plot_scatter_data(self,mat,color='blue',labels=None,buffer=0.2,use3D=False):
        colors = ['blue','orange','red','green','yellow','magenta','cyan','black']

        ## error checking
        if type(labels) == type([]):
            labels = np.array(labels)

        if use3D == False: 
            if labels == None:
                print 'labels are none'
                self.plt.plot([mat[:,0]],[mat[:,1]], marker='o',color=color,markersize=8.0)
            else:
                numLabels = len(list(set(labels)))

                for l in labels:
                    x = mat[:,0][np.where(labels==l)]
                    y = mat[:,1][np.where(labels==l)]

                    if l == self.noiseValue:
                        self.plt.plot([x],[y],marker='o',markersize=10.0,color='gray')
                    else:
                        self.plt.plot([x],[y],marker='o',markersize=10.0,color=colors[l])
        
            self.plt.xlim([mat[:,0].min()-buffer,mat[:,0].max()+buffer])
            self.plt.ylim([mat[:,1].min()-buffer,mat[:,1].max()+buffer])

    def calculate_distortion_measure(self,clustResults):
        clusteredData = {}
        totalJ = 0
        errorCk = 0

        for k in range(self.k):
            clusteredData[k] = clustResults['yMat'][np.where(clustResults['labels']==k)[0],:]

        for k in range(self.k):
            sumOfSquares = (clusteredData[k] - clusteredData[k].mean(axis=0))**2.0
            totalJ = totalJ + sumOfSquares.sum()
            errorCk = errorCk + len(sumOfSquares) 

        if errorCk != len(clustResults['labels']):
            print "ERROR: Did not pass error check in distortion measure calc"

        return totalJ

    def _error_check_input_data(self):
        ## check gene list for genes not in G 
        newLabels = []
        self.unusedGenes = []
        if self.dtype == 'graph':
            if type(self.dataHeader)==type([]):
                self.dataHeader = np.array(self.dataHeader)

            for g1 in range(len(self.dataHeader)):
                gene = self.dataHeader[g1]
                geneIndex = np.where(np.array(self.G.nodes())==gene)

                if len(geneIndex[0]) == 0:
                    self.unusedGenes.append(gene)

            ## save original labels and orig data header    
            self.unusedGenes = np.array(self.unusedGenes)
            if self.labels != None:
                self.origLabels = self.labels.copy()
            self.origDataHeader = self.dataHeader.copy()
            self.unusedIndices = np.array([np.where(self.origDataHeader==gene)[0][0] for gene in self.unusedGenes])
            usedIndices = []
            
            for ind in range(len(self.origDataHeader)): #origLabels
                if self.unusedIndices.__contains__(ind) == False:
                    usedIndices.append(ind)
            self.usedIndices = np.array(usedIndices)
            self.dataHeader = self.origDataHeader[self.usedIndices]
            if self.labels != None:
                self.labels = self.origLabels[self.usedIndices]

            ## error check for genes in G that are not in header  
            for g2 in range(len(self.G.nodes())):
                node = self.G.nodes()[g2]
                nodeIndex = np.where(self.dataHeader==node)

                if len(nodeIndex[0]) == 0:
                    print "WARNING: a gene was found in the graph that was not listed in the data header", node
                    continue

            self.n = len(self.dataHeader)
            if self.verbose == True:
                print "\tINFO: out of %s genes possible genes only %s appear in the graph"%(len(self.origDataHeader),len(self.dataHeader))

        ## error checking input  
        if self.dtype not in ['raw','distance','affinity','graph']:
            raise ValueError, "matrix input type not valid"
        if self.labels != None:
            if len(self.labels) != self.n:
                raise ValueError, "labels length not matching number observations"
    
    def _reshape_affinity_matrix_to_original_header(self,aMat):
        origLength = len(self.origDataHeader)
        newAMat = np.zeros((origLength,origLength),)
        newAMat = newAMat + EPS
    
        for i in range(origLength):
            obj = self.origDataHeader[i]
            if i in self.usedIndices:
                newRow = np.zeros((origLength),) + EPS
                aMatInd = np.where(self.dataHeader==obj)[0][0]
                newRow[self.usedIndices] = aMat[aMatInd,:]
                newAMat[i,:] = newRow

        return newAMat
