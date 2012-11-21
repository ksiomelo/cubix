#!/usr/bin/env python

## A handler class that that takes input data and performed specified analyses.
#  A number of possible models are available through this class

### make imports
import sys,os,re,time,cPickle
import numpy as np
from scipy.cluster.vq import kmeans2,kmeans
from scipy.cluster.vq import whiten
from scipy.spatial.distance import pdist,cdist,squareform
import scipy.stats as stats
import matplotlib.pyplot as plt
from ClusterBase import ClusterBase
from DistanceMatrix import DistanceMatrix
from GraphingLib import *

## use numpy 
from numpy.linalg import eig
## use scipy and sparse matrices 
try:
    from scipy.sparse.linalg.eigen.arpack import eigen_symmetric, eigen
except: "WARNING: scipy.sparse.linalg is not available"

sys.path.append(os.path.join('.','MixModel'))

try:
    from GraphingLib import *
except:
    print "WARNING: GraphingLib not available -- is Pygraphviz installed?"

## turn off warning about casting complex numbers to real ones
import warnings
warnings.simplefilter("ignore", np.ComplexWarning)


### handle warnings
import warnings
warnings.simplefilter('error', UserWarning)

class SpectralCluster(ClusterBase):  
    '''
    constructor
        description
            this class takes as input a raw matrix consisting of observations and features
            the observations occupy the rows and the features the are the columns          
            also takes as input a distance matrix or a networkx graph
       
        args    
            data              - a raw matrix, a distance matrix, an affinity matrix or a networkx graph  
            k                 - the number of components in the mixture
            labels            - a list of the true labels if available
            projID            - the project id (that may include a path) to be used when saving results
            dataHeader        - are the names of the individual objects to cluster (i.e. [gene1,gene2])
            dtype             - specifies to the constructor which data type is being input
            weighted          - specifies whether or not a graph-type input is weighted 
            dataMax           - this is the maximal value for a given data source with respect to the genome
            refine            - used to specify the method for noise refinement 'kmeans'
            paramEstimator    - 'distortion','silvalue' or 'fscore'
            sigmaRange        - range of sigmas to be searched
            dmatPath          - if raw data are given the dmat will be saved to increase compute speed          
            fileType          - specify output file type -- types supported by matplotlib pdf, png, jpg
            classifyStep      - kmeans is the only current option
            handleExtremeVals - if true extreme values in affinity matrix are mapped to a larger value 
            reweighting       - true 

        algorithm:
            (1) create an affinity matrix using a_ij = exp( d_ij^2 / 2*sigma^2)
            (2) define the matrix D and create the matrix L
            (3) create the matrix X using the eigenvectors of L
            (4) create the normalized matrix Y from X  
            (5) cluster the rows in Y using K-means 
            (6) assign the points to clusters
    '''

    def __init__(self,data,k=None,labels=None,dataHeader=None,projID="generic",dtype='raw',weighted=False,dataMax=None,penalty=False,
                 fileType='pdf',verbose=False,sigma=None,refine=None,paramEstimator='distortion',sigmaRange=None,dmatPath=None,
                 classifyStep='kmeans',handleExtremeVals=False,reweighting=True):
        if verbose == True:
            print "INFO: running spectral clustering............." 
        
        if data == None:
            print "ERROR: Bad data given"
            return None

        ## class-wide variables
        self.data = data
        self.k = k
        self.sigHat=sigma
        self.verbose = verbose
        self.dtype = dtype
        self.projID = projID
        self.weighted = weighted
        self.dataMax = dataMax
        self.fileType = fileType
        self.refine = refine
        self.paramEstimator = paramEstimator
        self.handleExtremeVals = handleExtremeVals
        self.unusedGenes = []
        self.unusedIndices = []
        self.clustResults = None
        self.penalty = penalty
        self.dmatPath = dmatPath
        self.noiseValue = 999
        self.classifyStep = classifyStep
        self.reweighting = reweighting

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

        ## set the range of sigma
        if sigma == None and sigmaRange != None:
            if type(sigmaRange) == type(np.array([])):
                self.sigmaRange = sigmaRange
            else:
                print "WARNING: Invalid input for sigmaRange must be np.array"
        elif sigma == None:
            self.sigmaRange = np.arange(0.01,0.6,0.001)

        if sigma != None and sigmaRange != None:
            print "WARNING: both sigma and sigmaRange specified -- ignoring sigmaRange"

        ## class-wide variables
        if self.dtype == 'graph':
            self.G = data
            if self.dataHeader == None:
                print "ERROR: header values must be input along with the graph"
        else:
            if type(data) != type(np.array([])):
                return None
            self.n, self.d = np.shape(data)

        ## error check gene list
        if self.verbose == True:
            print "\tINFO: error checking data..."
        self._error_check_input_data()
    
        ## determine how to run algorithm
        if self.dtype == 'affinity':
            self.run_from_affinity_matrix()
        elif self.sigHat == None:
            self.run_by_estimating_sigma()
        else:
            self.run_with_given_sigma()

        ## save results s.t. they are easily accessible
        if self.clustResults != None:
            self.aMat = self.clustResults['aMat']
            self.eigVals = self.clustResults['eigVals']
            self.xMat = self.clustResults['xMat']
            self.yMat = self.clustResults['yMat']
        else:
            "WARNING: the algorithm returned no results"

        ## perform evaluation (here we panalize for genes that are thown out by calling them noise)
        if self.clustResults == None:
            print "ERROR: ClustResults returned None -skipping evaluation"
        elif self.labels == None:
            pass
        elif self.penalty == True:
            try:
                self.evaluation = self.evaluate_cluster_assignments(self.origLabels,self.clustResults['labels'])
            except:
                print "ERROR: there was an error in the penalized evaluation"
        else:
            try:
                self.evaluation = self.evaluate_cluster_assignments(self.labels,self.clustResults['labels'])
            except:
                print "ERROR: there was an error in the nonpenalized evaluation"
        
        ## add final distortion and sil values
        if self.clustResults != None and self.clustResults['centroids'] != None:
            self.distortion = self.calculate_distortion_measure(self.clustResults)
            self.silVals = self.get_silhouette_values(self.clustResults['yMat'],labels=self.clustResults['labels'])
        else:
            self.distortion = 0
            self.silValus = 0

        ## perform inference
        #self.perform_noise_inference()

    ####################################################################
    # 
    # methods to run spectral clustering 
    #
    ####################################################################

    ## scan a region for sigma    
    def run_by_estimating_sigma(self):
        ## run the algorithm for a range of sigma values
        if self.verbose == True:
            print "\tfinding sigma..."
            print "\tusing %s"%self.paramEstimator
    
        if self.paramEstimator not in ['distortion','silvalue','fscore']:
            print "ERROR: Input value for paramEstimator must be 'distortion', silvalue' or 'fscore'"

        if self.paramEstimator == 'fscore' and self.labels == None:
            print "ERROR: if estimator is 'fscore' labels must be known"
                     
        ## prepare progress points
        progressPercents = np.array([0,0.25,0.50,0.75,1.0])
        progress = [int(round(i)) for i in progressPercents * len(self.sigmaRange)]  

        self.fscore = -1e08
        self.distortion = 1e08
        self.silValue = -1e-08
        self.clustResults = None

        for s in range(len(self.sigmaRange)):
            sigma = self.sigmaRange[s]

            clustResults = None
            numTries = 0

            while numTries < 10:
                try:
                    clustResults = self.run_spectral_clust_ng(sigma)
                except:
                    clustResults = None
                        
                if clustResults == None:
                    numTries += 1
                else:
                    numTries = 100
            
            ## calculate value for sigma estimator
            if clustResults == None:
                continue

            if self.paramEstimator == 'distortion':
                distortion = self.calculate_distortion_measure(clustResults)
            elif self.paramEstimator == 'silvalue':
                silVals = self.get_silhouette_values(clustResults['yMat'],labels=clustResults['labels'])
            elif self.paramEstimator == 'fscore':
                if self.penalty == True:
                    evaluation = self.evaluate_cluster_assignments(self.origLabels,clustResults['labels'])
                else:
                    evaluation = self.evaluate_cluster_assignments(self.labels,clustResults['labels'])
            
            ## report progress
            if s in progress and self.verbose == True:
                print progressPercents[progress.index(s)]*100, "%complete"
         
            ## error checking
            if self.paramEstimator == 'distortion' and distortion < 0:
                continue

            ## save best results
            if self.paramEstimator == 'distortion' and distortion < self.distortion:
                self.distortion = distortion
                self.clustResults = clustResults
                self.sigHat = sigma
            elif self.paramEstimator == 'silvalue' and silVals.mean() > self.silValue:
                self.silValue = silVals.mean()
                self.clustResults = clustResults
                self.sigHat = sigma
            elif self.paramEstimator == 'fscore' and evaluation['f1score'] > self.fscore:
                self.fscore = evaluation['f1score']
                self.clustResults = clustResults
                self.sigHat = sigma

    def run_with_given_sigma(self):
        ## run the algorithm for the a given sigma value
        if self.verbose == True:
            print "\tINFO: running for specified sigma:", self.sigHat

        self.clustResults = None
        numTries = 0

        while numTries < 10:
            try:
                self.clustResults = self.run_spectral_clust_ng(self.sigHat)
            except:
                self.clustResults = None
                        
            if self.clustResults == None:
                numTries += 1
            else:
                numTries = 100

    def run_from_affinity_matrix(self):
        if self.verbose == True:
            print "\tINFO:running from affinity matrix"
        self.clustResults = self.run_spectral_clust_ng(self.sigHat)

    ##############################################
    #
    # main spectral clustering implimentation 
    #
    ##############################################

    ## the method that carries out the algorithm for spectral clustering as proposed by Andrew Ng (2001)
    def run_spectral_clust_ng(self,sigma,plots=False):
        dmatPickle = 'NotAFile'

        ## create a distance (similarity) matrix
        if self.dtype=='raw':
            self.dMat = self.raw_to_distance_mat(self.data)
        if self.dtype=='graph':
            if self.dmatPath != None and os.path.isfile(self.dmatPath) == False:
                if self.verbose == True:
                    print '...............creating new dMat to be pickled...'
                self.dMat = self.graph_to_distance_mat(self.G,self.dataHeader,weighted=self.weighted,reweighting=self.reweighting,verbose=self.verbose)
                cPickle.dump(self.dMat,open(self.dmatPath,'w'))
            elif self.dmatPath != None and os.path.isfile(self.dmatPath) == True:
                if self.verbose == True:
                    print '...............using pickled dmat'
                self.dMat = cPickle.load(open(self.dmatPath,'r'))
            else:
                self.dMat = self.graph_to_distance_mat(self.G,self.dataHeader,weighted=self.weighted,reweighting=self.reweighting,verbose=self.verbose)

        if self.dtype == 'distance':
            self.dMat = self.data

        ## handle the affinity matrix
        if self.dtype == 'affinity':
            aMat = self.data
        else:
            aMat = self.distance_to_affinity_mat(self.dMat,sigma,reshape=self.penalty)

        ## handle extreme values in affinity matrix
        if self.handleExtremeVals == True:
            aMat[np.where(aMat < 0.00001)] = 0.00001

        ## create the diagonal matrix D
        diaMat = self.affinity_to_diagonal_mat(aMat)

        ## find the matrix L
        result = np.dot(diaMat,aMat)                                     # multiply A and D^{-1/2} 
        lMat = np.dot(result,diaMat)                                     # multiply the above result times D^{-1/2}

        # test to make sure lMat is finite and does not contain NaNs
        testNan = np.where(np.isnan(lMat) == True)
        testNanResult = [len(z) for z in testNan]
        testFinite = np.where(np.isfinite(lMat) == False)
        testFiniteResult = [len(z) for z in testFinite]
        
        if np.array(testFiniteResult).sum() > 0 and self.verbose == True:
            print "WARNING: failed finite check"
        elif np.array(testNanResult).sum() > 0 and self.verbose == True:
            print "WARNING: failed nan check"

        ## find the k largest eigenvectors of L
        eigVals, eigVecs = eig(lMat) 
        #eigVals, eigVecs = eigen_symmetric(lMat, k=self.k) # use scipy for sparse matrices eigen eigen_symmetric
    
        eigVecs = -1.0 * eigVecs
        sortedEigInds = np.argsort(np.sum(abs(eigVecs),0))
        xMat = eigVecs[:,sortedEigInds[-self.k:]]

        ## compute normalized matrix Y from X
        n,k = np.shape(xMat)
        yMat = np.zeros([n,k])
        unitLengths = np.sum(xMat**2,axis=0)**(0.5)
        
        for col in range(k):
            yMat[:,col] = xMat[:,col] / unitLengths[col]
    
        ## cluster the rows of Y using Kmeans
        tries = 0
        iters = 0
        minDistortion = 1e08
        bestClusters = None
        bestKmeanLabels = None
                
        ## use kmeans to cluster in eigen space
        if self.classifyStep == 'kmeans':
            tries = 0
            while tries < 5: 
                try:
                    kmeanResults, kmeanLabels = kmeans2(yMat,self.k)
                    localDistortion = self.calculate_distortion_measure({'centroids':kmeanResults, 'labels':kmeanLabels, 'yMat':yMat})
                    tries = 100
                except:
                    kmeanResults = None
                    tries += 1

            if kmeanResults == None:
                kmeanResults, localDistortion = kmeans(yMat,self.k,iter=25)
             
                ### get the labels
                try:
                    if self.penalty == True:
                        n = len(self.origDataHeader)
                    else:
                        n = self.n

                    kmeanLabels = np.zeros((n),)
                    for o in range(n):
                        minDist = 1e08
                        lab = None 
                        obs = yMat[o,:]
                        
                        for c in range(self.k):
                            centroid = kmeanResults[c,:]
                            dist = np.linalg.norm(obs-centroid)
             
                            if dist < minDist:                                  
                                minDist = dist
             
                                lab = c
                        if minDist == 1e08: 
                            print 'error: issue when calculating labels in kmeans1 SpectralCluster.py'
                        kmeanLabels[o] = lab             
                except:
                    kmeanLabels = None
 
            if kmeanResults == None or kmeanLabels == None:
            #    print 'ERROR: failed at eigenspace clustering step'
                return None
            else:
                return {'centroids':kmeanResults,'labels':kmeanLabels,'aMat':aMat,'yMat':yMat,'xMat':xMat,'eigVals':eigVals}
        else:
            print "ERROR: additional classifyStep methods have not been implemented use kmeans"
            sys.exit()

    ## permute the newLabels until the difference from true is minimuzed
    def permute_labels(self,trueLabels,newLabels):
    
        permutations = self.permute_list(range(self.k))
        minDiff = np.sum(np.abs(trueLabels - newLabels))

        for perm in permutations:
            permLabels = np.array([perm[i] for i in newLabels])
            absDiff = np.abs(trueLabels - permLabels)
            diff = len(np.where(absDiff >= 1)[0])

            if diff < minDiff:
                newLabels = permLabels
                minDiff = diff
            
        return newLabels
    
    def permute_list(self,lst):
        sz = len(lst)
        if sz <= 1:
            return [lst]
        return [p[:i]+[lst[0]]+p[i:] for i in xrange(sz) for p in self.permute_list(lst[1:])]

    ## evaluate clustering performance (assumes labels are permuted to best match)
    def evaluate_cluster_assignments(self,trueLabels,newLabels):
        trueLabels = [int(l) for l in trueLabels]
        newLabels = [int(l) for l in newLabels]

        if len(trueLabels) != len(newLabels):
            print "INPUT ERROR: len of true and new labels must be the same",len(trueLabels),len(newLabels)
            return None

        posCalls,allPosCalls,allMadeCalls = 0,0,0

        for i in range(len(trueLabels)):
            for j in range(len(trueLabels)):

                if j >= i:
                    continue
                if trueLabels[i] == trueLabels[j]:
                    allPosCalls += 1

                if newLabels[i] == newLabels[j]:
                    allMadeCalls += 1

                if trueLabels[i] == trueLabels[j] and newLabels[i] == newLabels[j]:
                    posCalls += 1

        #print "\t", posCalls, allPosCalls, allMadeCalls, newLabels
        posCalls,allPosCalls,allMadeCalls = map(float,[posCalls,allPosCalls,allMadeCalls])
        recall = posCalls/allPosCalls
        precision = posCalls/allMadeCalls
        f1score = 2.0 * (precision*recall) / (precision + recall)

        return {'recall':recall,'precision':precision,'f1score':f1score}

    def make_plot(self,plotType,header=None,data=None,labels=None,weighted=False,name='',fileType='pdf',vizThreshold=None,viewNoise=False):
        if plotType not in ['dMat','aMat','diaMat','lMat','xMat','yMat','scatter','graph','eigenspace']:
            print "INPUT ERROR: plotType in valid must be 'dMat','aMat','diaMat','lMat','xMat','yMat','scatter','graph'"

        if plotType != 'graph':
            self.plt = plt
            self.fig= self.plt.figure(figsize = (7,7)) 
            self.ax=self.fig.add_subplot(111)

        if plotType=='eigenspace':
            self.plt.title(r"Points in eigenvector space - with $\mathbf{\mu}$ estimates")
            
            ## plot mean estimates
            for k in range(self.k):
                self.plt.plot(self.clustResults['centroids'][k,0],self.clustResults['centroids'][k,1],'kx',markersize=10.0,markeredgewidth=5.0)

            ## plot data by class
            if self.k == 2:
                self._plot_scatter_data(self.yMat,labels=labels)
            elif self.k == 3:
                self._plot_scatter_data(self.yMat,labels=labels,use3D=False)     ## toggle experimental 3D mode here
            else:
                self._plot_scatter_data(self.yMat[:,[0,1]],labels=labels)
                print "WARNING: plotting not possible for dimesions greater than 3 - using only first 2"
    
        elif plotType == 'graph':
            #self.my_cmap = get_cmap_blues()
            plot_network_data(self.G,header, labels=labels,name="graph_"+name,layout="neato",
                              nameDict=None,dataMax=self.dataMax,weighted=weighted,
                              viewPlot=False,fileType=fileType,vizThreshold=vizThreshold)
        elif plotType == 'scatter':
            if data == None:
                "ERROR: plot type 'scatter' must have data specified as input.. skipping"
            else:
                self._plot_scatter_data(data,labels=labels)

        elif plotType == 'dMat':
            self._generate_heatmap(self.dMat,labels=labels)
        elif plotType == 'aMat':
            self._generate_heatmap(self.aMat,labels=labels)
        elif plotType == 'diaMat':
            self._generate_heatmap(self.diaMat,labels=labels)
        elif plotType == 'lMat':
            self._generate_heatmap(self.lMat,labels=labels)
        elif plotType == 'xMat':
            self._generate_heatmap(self.xMat,labels=labels)
        elif plotType == 'yMat':
            self._generate_heatmap(self.yMat,labels=labels)

        ## retrun plt if available
        if plotType != 'graph':
            plt.savefig(self.projID+"_%s.%s"%(plotType,self.fileType))
            return plt

    def kmeans_inference(self):
        kmeanData = {}
        if self.clustResults == None:
            return None

        newLabels = self.clustResults['labels'].copy()

        for k in range(self.k):
            kmeanData[k] = self.yMat[np.where(self.clustResults['labels']==k)[0],:]

        ## get the euclidean distances from the centroids
        criticalVals = {}
        for k in range(self.k):
            euclidDist = (kmeanData[k] - kmeanData[k].mean(axis=0))**2.0
            euclidDist = np.sqrt(euclidDist.sum(axis=1))
            pvals = np.array([np.nan]).repeat(euclidDist.size) #zeros(euclidDist.size,dtype='float')

            for p in range(euclidDist.size):
                point = euclidDist[p] 
                
                ### perform two sided hypothesis test
                if point < euclidDist.mean():
                    pvals[p] = 1.0
                elif point > euclidDist.mean():
                    pvals[p] = 1.0 - stats.norm.cdf(point,loc=euclidDist.mean(), scale=euclidDist.std())
                        
            if len(np.where(pvals<0.05)) > 0:
                noiseInds = np.where(self.clustResults['labels']==k)[0][np.where(pvals<0.05)[0]]
           
            newLabels[noiseInds] = self.noiseValue

        return {'labels':newLabels,'criticalVals':criticalVals}
   
    def _eigenvalue_plot(self):
         plt.plot([range(len(self.eigVals))],[self.eigVals], marker='o',color='k',markersize=8.0)
         plt.ylim([0,1.2])
         plt.xlim([-0.5,len(self.eigVals) + 0.5])

         return plt
