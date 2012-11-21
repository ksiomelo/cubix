'''
Created on Oct 7, 2012

@author: cassiomelo
'''
import time
import rpy2.robjects as robjects
#import numpy as np
#from sklearn import preprocessing
#
#from sklearn import cluster, datasets
#from sklearn.metrics import euclidean_distances
#from sklearn.neighbors import kneighbors_graph
#from sklearn.preprocessing import Scaler

def compute_spectral_clustering(sim_matrix, n_clusters):
    
    # A <- matrix(c(0,1,0,0,1,0,0,0,0,0,0,1,0,0,1,0),nrow=4)
    # A <- matrix(c(0,.8,0,0,.8,0,0,0,0,0,0,.9,0,0,.9,0),nrow=4)
    # A <- matrix(c(0,.8,.5,.8,0,.9,.5,.9,0),nrow=3)
    
    
    
    r = robjects.r
    
    spectral = robjects.r('''
            function(A,nC) {
                K = rowSums(A)
                Dinv = diag(1/K)
                D= diag(K)
                n = nrow(A)

                L = diag(1,n)-sqrt(Dinv) %*% A %*% sqrt(Dinv)
                #L = D - A

                evv = eigen(L,symmetric=TRUE)
                
                #eigenvector corresp. second smallest eigenvalue
                #c=2
                
                cl <- kmeans(evv$vectors[,(ncol(evv$vectors)-1):(ncol(evv$vectors))],4)
                
                
#                computeClusters <- function(A,v,c)
#                {
#                    cl <- kmeans(v,c)
#                    print(modularity(A,cl$cluster))
#                    showGraph(A,g,l,cl$cluster,'Spectral Clustering')
#                    xr=range(v[,1])
#                    yr=range(v[,2])
#                    plot(v[which(cl$cluster==1),1],v[which(cl$cluster==1),2],col=2,xlim=xr,ylim=yr)
#                    points(v[which(cl$cluster==2),1],v[which(cl$cluster==2),2],col=3)
#                }
#                
#                computeClusters(A,evv$vectors[,1:2],c)
                
            }
            ''')
    
    labels, v = convert_matrix_to_rmatrix(sim_matrix)
    #v = robjects.FloatVector([0,.8,.5,.8,0,.9,.5,.9,0])
    a = r.matrix(v, nrow = len(labels))
    
    cl = spectral(a,n_clusters)
    #print(cl.names)
    clusters = cl.rx2('cluster')
    print clusters
    
    
    ret = {}
    for i, el in enumerate(clusters):
        ret[labels[i]] = el
    
    return ret
    
def convert_matrix_to_rmatrix(input_matrix): # input matrix format: matrix[concept_id1][concept_id2] = 0.2 etc
    order = []
    output_matrix = []
    for val in input_matrix:
        order.append(val)
    
    idx = 0
    for val1 in order:
        for val2 in order:
            output_matrix.append(input_matrix[val1][val2])
            idx += 1
            
    return (order, robjects.FloatVector(output_matrix))
        
        
    
        
        
if __name__ == '__main__':
    
    compute_spectral_clustering()