import os,sys
import numpy as np
from scipy.stats import norm
from rpy import r
from scipy.cluster.vq import kmeans2
#r.library(mvtnorm)

## a class represent a k component mixture of Gaussian models using a latent 
# variable representation of the Gaussian function.
# the data matrix x is a numpy array (nxd)
class GaussianMix:

    ## Constructor
    # @param k is the number of components in the mixture
    def __init__(self,x,k,numRuns=25,numIters=25,useKmeans=False):
        self.numRuns = numRuns
        self.numIters = numIters
        self.k = k
        self.x = x
        self.n, self.d = np.shape(self.x)
        self.useKmeans = useKmeans
        print "\nRunning the EM algorithm for a mixture of Gaussian distributions"
        print "The data are %s dimensional and have %s observations"%(self.d,self.n)
        print "The input number of components are %s"%k
        print "For initial param guesses useKmeans is set to ", self.useKmeans
        self.maxLikelihood, self.maxEstimates = self.run_em_algorithm()

    ## make intial guesses for the parameters (mu1, sig1, mu2, sig2 and pi)
    # guess mu and sigma by randomly partitioning the data and using the (co)variences
    # the parameter dictionary will be a dict of k dicts where each represents a component
    # @params useKmeans specifies whether to use kmeans (default) or a uniform random partitioning
    def get_init_guesses(self,useKmeans):

        ## create a container for the params 
        params = {}
        for k in range(self.k):
            params[k] = {'mu':None,'var':None,'pi':None}
        
        ## use kmeans to get the initial estimates
        if useKmeans == True:
            tries = 0
            while tries < 5:
                try:
                    centroids,labels = kmeans2(self.x,self.k,iter=25)
                    tries = 5
                except:
                    tries+=1
                    print '\tRerunning kmeans...'
                
            for k in range(self.k):
                muHat = centroids[k,:]
                params[k]['mu'] = muHat
        else:
            labels = self.make_k_random_groups()
            print labels
            for k in range(self.k):
                dataInds = np.where(labels==k)[0]
                if len(dataInds) > 2:
                    data = self.x[dataInds,:]
                    params[k]['mu'] = data.mean(axis=0) 
                else:
                    params[k]['mu'] = self.x[np.random.randint(0,self.n),:]
                    
        ## guess the variance/covariance
        if self.d == 1:
            for k in range(self.k):
                dataInds = np.where(labels==k)[0]
                if len(dataInds) > 2:
                    data = self.x[dataInds,:]
                    params[k]['var'] = data.var()
                else:
                    params[k]['var'] = self.x.var(axis=0) + np.random.uniform(0.01,5.0)
        elif self.d > 1:
            print "ERROR: not set up yet for covariance"

        ## guess mixing parameter pi
        for k in range(self.k):
            dataInds = np.where(labels==k)[0]
            params[k]['pi'] = float(len(dataInds))/float(self.n)
                                
        return params

    ## main function to carry out EM
    # @param numRuns is the number of times that the algorithm should be run
    # @param numIters is the number of iterations that the algorithm carries out with each run
    def run_em_algorithm(self):
        maxLikelihood,maxEstimates = -np.inf,None
        
        ## iterate through the number of runs to be made
        for run in range(self.numRuns):
            print 'run: ', run + 1, maxLikelihood

            ## make initial guesses for parameter values (could use k-means here)
            params = self.get_init_guesses(useKmeans=self.useKmeans)

            ## iterate perscribed number of times else use convergence criteria
            for iter in range(self.numIters):

                ## perform the E-step -- evaluate the responsibilities using the current params
                gammaHat = self.perform_expectation(params)

                ## perform the M-step -- re-estimate parameters using current conditional probs
                params = self.perform_maximization(params,gammaHat)

                ## calculate the liklihood
                likelihood = self.eval_likelihood(params)

                print '\titer', iter,likelihood

                if likelihood > maxLikelihood:
                    maxLikelihood = likelihood
                    maxEstimates = params

            print "DEBUGGING"
            sys.exit()

        return maxLikelihood, maxEstimates

    ## function for expectation stop of algorithm
    # @param a dictionary of guesses for the model parameters
    def perform_expectation(self,params):

        ## for calculate responsibilities gamma is also the conditional probability 
        ## of z given x or p(z_k = 1|x)
        gammaHat = {}
        responsibilities = None
        for i in range(self.n):
            gammaZ = np.array([params[k]['pi'] * r.dnorm(self.x[i],mean=params[k]['mu'],sd=np.sqrt(params[k]['var'])) for k in range(self.k)]).T
            
            if responsibilities == None:
                responsibilities = gammaZ
            else:
                responsibilities = np.vstack([responsibilities,gammaZ])
   
        for i in range(self.n):
            gammaHat[i] = responsibilities[i,:] / responsibilities.sum(axis=1)[i]

        return gammaHat

    ## using the input responsibilities (gammaHat) re-estimate the 
    # @params dict of parameters estimates
    # @gammaHat dict of responsibilities
    def perform_maximization(self,params,gammaHat):
        
        ## get the component assignments
        assignments = np.array([np.where(gammaHat[i]==gammaHat[i].max())[0][0] for i in range(self.n)])
        #print 'assiignments', assignments
        nK = np.array([len(np.where(assignments==k)[0]) for k in range(self.k)])
        
        ## avoid singularities by resetting params
        if len(np.where(nK==0)[0]) > 0 or len(np.where(nK==1)[0]):
            print "\tResetting initial guesses to avoid singularities"
            params = self.get_init_guesses(useKmeans=self.useKmeans)
            return params
        
        ## get new estimates for mu
        newParams = {}
        ##muNew = np.zeros((self.k,self.d), dtype='float')
        for k in range(self.k):
            newParams[k] = {'mu':None,'var':None,'pi':None}
            newParams[k]['mu'] = np.array([gammaHat[i][k] * self.x[i,:] for i in range(self.n)]).sum(axis=0) / float(nK[k])
        
        ### get new estimates for covariance matrices
        if self.d == 1:
            for k in range(self.k):
                numeratorSum = np.zeros((self.d),dtype='float')
                for i in range(self.n):
                    xMinusTerm = np.array([self.x[i,:] - newParams[k]['mu']])
                    #print 'term1', gammaHat[i][k,:] 
                    #print 'term2', xMinusTerm, np.shape(xMinusTerm)
                    #print 'term3', 'blah'
                    numerator =  np.array([self.x[i,:] - newParams[k]['mu']])
                    numerator = gammaHat[i][k] * numerator
                    numeratorSum =  numeratorSum + np.dot(xMinusTerm.T,xMinusTerm)  ## finds the matrix product and sums them
                    newParams[k]['var'] = numeratorSum / float(nK[k])
        else:
            print "ERROR not yet implimented"


        ## get new estimates for mixing parameter 
        for k in range(self.k):
            newParams[k]['pi'] = float(nK[k]) / float(self.n)

        return newParams

    ## evaluate the liklihood
    # @params the dict of parameter estimates 
    def eval_likelihood(self,params):
        likelihood = 0.0
        
        ## for each component get the liklihood and log it
        for i in range(self.n):
            componentLikelihoods = np.zeros((self.n),dtype='float') 
            for k in range(self.k):
                if self.d == 1:
                    phi = r.dnorm(self.x[i],mean=params[k]['mu'],sd=np.sqrt(params[k]['var']))
                else:
                    print "ERROR: not implimented yet"
                #phi = norm.pdf(self.x[i,:],loc=params['mu'][k,:],scale=np.sqrt(params['sig'][k,:]))
                #print 'phi',phi
                componentLikelihoods[k] = np.log(phi * params[k]['pi'])

            ## sum over the components and add to the total
            likelihood = likelihood + componentLikelihoods.sum(axis=0)

        return likelihood

    ## error check that dims of sigma
    # @params sigma is DxD np array covarance matrix
    def _check_sigma(self,sigma):
        dim1,dim2 = np.shape(sigma)
        if self.d != dim1:
            print "ERROR: covariance matrix is not DxD"
        elif self.d != dim2:
            print "ERROR: covariance matrix is not DxD"

    ## randomly group the data into k groups in order to get initial param guesses
    def make_k_random_groups(self):
        inds = np.arange(self.n)
        np.random.shuffle(inds)
        points = np.random.uniform(0,1,self.k-1)
        points = np.sort(points)
        if points.size > 1:
            points = points / points.sum()
        startPoints = np.hstack([np.array([0]),points])
        startPoints = np.array([int(round(p * self.n)) for p in startPoints])
        stopPoints = np.array([int(i) for i in np.hstack([startPoints[1:],self.n])])
        labels = np.zeros((self.n),dtype='int')
        for k in range(self.k):
            labels[inds[startPoints[k]:stopPoints[k]]] = k
        
        ## error checking 
        if labels.size != self.n:
            print "ERROR: returned labels not of correct lenght"

        return labels
