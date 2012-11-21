#!/usr/bin/env python

## make imports 
import sys
import numpy as np
import matplotlib.mlab as mlab
import matplotlib.pyplot as plt
import scipy.stats as stats

class TwoComponentGaussian():

    def __init__(self, y, numIters, numRuns,verbose=False):
        self.y = y
        self.verbose = verbose
        self.maxLike, self.bestEst = self.run_em_algorithm(numIters, numRuns)

    ### make definations for initial guessing, expectation, and maximization
    def get_init_guesses(self,y):
        ## make intial guesses for the parameters (mu1, sig1, mu2, sig2 and pi)
        n    = len(self.y) 
        mu1  = y[np.random.randint(0,n)]
        mu2  = y[np.random.randint(0,n)]
        sig1 = np.random.uniform(0.5,1.5) #y.var() or 0.5,3.0 
        sig2 = np.random.uniform(0.5,1.5) #y.var() or 0.5,3.0
        pi   = 0.5
    
        return {'n':n, 'mu1':mu1, 'mu2':mu2, 'sig1':sig1, 'sig2':sig2, 'pi':pi}

    def perform_expectation(self, y, parms):
        gammaHat = np.zeros((parms['n']),'float')
    
        for i in range(parms['n']):
            phiTheta1 = stats.norm.pdf(y[i],loc=parms['mu1'],scale=np.sqrt(parms['sig1']))
            phiTheta2 = stats.norm.pdf(y[i],loc=parms['mu2'],scale=np.sqrt(parms['sig2']))
            numer = parms['pi'] * phiTheta2
            denom = ((1.0 - parms['pi']) * phiTheta1) + (parms['pi'] * phiTheta2)
            gammaHat[i] = numer / denom 
    
        return gammaHat


    def perform_maximization(self,y,parms,gammaHat):
        ## use weighted maximum likelihood fits to get updated parameter estimates
        numerMuHat1 = 0
        denomHat1 = 0
        numerSigHat1 = 0
        numerMuHat2 = 0
        denomHat2 = 0
        numerSigHat2 = 0
        piHat = 0
        
        ## get numerators and denomanators for updating of parameter estimates
        for i in range(parms['n']):
            numerMuHat1 = numerMuHat1 + ((1.0 - gammaHat[i]) * y[i])
            numerSigHat1 = numerSigHat1 + ( (1.0 - gammaHat[i]) * ( y[i] - parms['mu1'] )**2 )
            denomHat1 = denomHat1 + (1.0 - gammaHat[i])
            
            numerMuHat2 = numerMuHat2 + (gammaHat[i] * y[i])
            numerSigHat2 = numerSigHat2 + (gammaHat[i] * ( y[i] - parms['mu2'] )**2) 
            denomHat2 = denomHat2 + gammaHat[i]
            piHat = piHat + (gammaHat[i] / parms['n'])

        ## calculate estimates
        muHat1 = numerMuHat1 / denomHat1
        sigHat1 = numerSigHat1 / denomHat1
        muHat2 = numerMuHat2 / denomHat2
        sigHat2 = numerSigHat2 / denomHat2

        return {'mu1':muHat1, 'mu2':muHat2, 'sig1': sigHat1, 'sig2':sigHat2, 'pi':piHat, 'n':parms['n']}

    def get_likelihood(self,y,parms,gammaHat):
        part1 = 0
        part2 = 0

        for i in range(parms['n']):
            phiTheta1 = stats.norm.pdf(y[i],loc=parms['mu1'],scale=np.sqrt(parms['sig1'])) #r.dnorm(y[i], mean = parms['mu1'], sd = np.sqrt(parms['sig1']))
            phiTheta2 = stats.norm.pdf(y[i],loc=parms['mu2'],scale=np.sqrt(parms['sig2'])) #r.dnorm(y[i], mean = parms['mu2'], sd = np.sqrt(parms['sig2']))           
            part1 = part1 + ( (1.0 - gammaHat[i]) * np.log(phiTheta1) + gammaHat[i] * np.log(phiTheta2) )
            part2 = part2 + ( (1.0 - gammaHat[i]) * np.log(parms['pi']) + gammaHat[i] * np.log(1.0 - parms['pi']) )
        
        return part1 + part2 


    def run_em_algorithm(self, numIters, numRuns, verbose = True):
        '''
        main algorithm functions
        '''

        maxLike = -np.inf
        bestEstimates = None

        for j in range(numRuns):

            iterCount = 0
            parms = self.get_init_guesses(self.y)

            ## iterate between E-step and M-step
            while iterCount < numIters:
                iterCount += 1
    
                ## check to make sure the var estimates are > 0.5
                if parms['sig1'] < 0.0 or parms['sig2'] < 0.0:
                    #print "WARNING: negative variances starting with new intital guesses"
                    iterCount = 1
                    parms = get_init_guesses()
    
                ## E-step
                gammaHat = self.perform_expectation(self.y,parms)
                logLike = self.get_likelihood(self.y,parms,gammaHat)
    
                #if self.verbose == True:
                #    print 'iteration',iterCount,'mu1',round(parms['mu1'],2),'mu2',round(parms['mu2'],2),'sig1',round(parms['sig1'],2),
                #    print 'sig2',round(parms['sig2'],2),'pi',round(parms['pi'],2),'obs.data likelihood', round(logLike,4)

                ## M-step
                parms = self.perform_maximization(self.y,parms,gammaHat)
    
            if logLike > maxLike:
                maxLike = logLike
                bestEstimates = parms.copy()


            if self.verbose == True:
                print 'runNum: ',j + 1,'mu1: ',round(parms['mu1'],2),'mu2: ',round(parms['mu2'],2),'sig1: ',round(parms['sig1'],2),
                print 'sig2: ',round(parms['sig2'],2),'pi: ',round(parms['pi'],2),'obs.data likelihood: ', round(logLike,4)

        return maxLike, bestEstimates
 
if __name__ == '__main__':

    y1 = np.array([-0.39,0.12,0.94,1.67,1.76,2.44,3.72,4.28,4.92,5.53])
    y2 = np.array([ 0.06,0.48,1.01,1.68,1.80,3.25,4.12,4.60,5.28,6.22])
    y  = np.hstack((y1,y2))

    numIters = 25
    numRuns = 20
    verbose = True
    makePlots = True
    tcg = TwoComponentGaussian(y, numIters, numRuns,verbose=verbose)

    print 'maxLike', tcg.maxLike
    print 'bestEstimates', tcg.bestEst

    if makePlots == True:
        n, bins, patches = plt.hist(y,15,normed=1,facecolor='gray',alpha=0.75)
    
        ## add a 'best fit' line (book results)
        mu1 = 4.62
        mu2 = 1.06
        sig1 = 0.87
        sig2 = 0.77

        p1 = mlab.normpdf( bins, mu1, np.sqrt(sig1))
        p2 = mlab.normpdf( bins, mu2, np.sqrt(sig2))
        l1 = plt.plot(bins, p1, 'r--', linewidth=1)
        l2 = plt.plot(bins, p2, 'r--', linewidth=1)

        ## add a 'best fit' line (results from here)
        p3 = mlab.normpdf( bins, tcg.bestEst['mu1'], np.sqrt(tcg.bestEst['sig1']))
        p4 = mlab.normpdf( bins, tcg.bestEst['mu2'], np.sqrt(tcg.bestEst['sig2']))
        l3 = plt.plot(bins, p3, 'k-', linewidth=1)
        l4 = plt.plot(bins, p4, 'k-', linewidth=1)

        plt.xlabel('y')
        plt.ylabel('freq')
        plt.ylim([0,0.8])
    
        plt.legend( (l1[0], l3[0]), ('Book Estimate', 'My Estimate') )

        plt.savefig('../TwoComponentGauss.png')
        plt.show()
