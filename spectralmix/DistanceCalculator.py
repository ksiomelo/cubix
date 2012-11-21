#!/usr/bin/env python

import time
import numpy as np
from scipy.spatial.distance import cdist, squareform
from scipy.linalg import inv
from scipy.cluster.vq import whiten

class DistanceCalculator():
    def __init__(self,matrixMeans=None,distType='euclidean'):
        
        '''
        this class calculates the distance from a set of vectors (features) and another set of means
        
        '''

        ## variables
        self.distType = distType

        ## error checking
        validMetrics = ['euclidean','mahalanobis']
        if self.distType not in validMetrics:
            raise RuntimeError("ERROR in distance calculator - input distance type is invalid \nmust be in %s"%validMetrics)
            return None
    
    def calculate(self,mat,matrixMeans=None,inverseCov=None):
        ## error checking
        if type(np.array([])) != type(mat):
            raise RuntimeError("ERROR in distance calculator - input matrix must be of type np.array()")
            return None
        
        ## gather dimensions of the input matrix
        dims = mat.shape
        
        if len(dims) == 1:
            n = dims[0]
            d = 1
        elif len(dims) == 2:
            n,d = dims
        else:
            raise RuntimeError("ERROR in distance calculator - input matrix does not have reasonable dimensions - %s"%dims)

        if matrixMeans != None:
            if matrixMeans.size != d:
                raise RuntimeError("ERROR in distance calculator - badly formated matrix means - %s")

        ## find matrix means
        if matrixMeans == None:
            matrixMeans = self.get_mean(mat)

        ## get distances using scipy 
        matrixMeans = matrixMeans.reshape((1,d))

        if self.distType == 'euclidean':
            self.dists = cdist(mat,matrixMeans,self.distType)
        elif self.distType == 'mahalanobis':
            try:
                self.dists = cdist(mat,matrixMeans,self.distType, VI=None)
            except:
                self.dists = cdist(mat,matrixMeans,'euclidean')
                self.dists = whiten(self.dists)

        self.dists = self.dists[:,0]

    def get_mean(self,mat):
        ## get distances using scipy 
        dims = mat.shape
        if len(dims) == 1:
            n = dims[0]
            d = 1
        elif len(dims) == 2:
            n,d = dims
        else:
            raise RuntimeError("ERROR in distance calculator - input matrix does not have reasonable dimensions - %s"%dims)
        
        matrixMeans = mat.mean(axis=0)

        return matrixMeans

    def get_inverse_covariance(self,mat):

        ## get distances using scipy 

        dims = mat.shape
        if len(dims) == 1:
            n = dims[0]
            d = 1
        elif len(dims) == 2:
            n,d = dims
        else:
            raise RuntimeError("ERROR in distance calculator - input matrix does not have reasonable dimensions - %s"%dims)
        
        a = mat.T

        ## get the covariance matrix and its inverse
        cov = np.cov(a)
        try:
            invCov = np.linalg.inv(cov)
        except:
            print "WARNING: inverse of covariance failed -- matrix is singlular"
            return None

        if invCov.shape[0] != d and invCov.shape[1] != d:
            raise RuntimeError("ERROR in distance calculator - input matrix does not have reasonable dimensions - %s"%dims)

        return invCov


    def get_distances(self):
        return self.dists
