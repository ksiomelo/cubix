## \mainpage SpectralMix :: A Python library for to perform spectral clustering analyses 
# using multipe types of input data types.  Options for data integration are also included
# as part of the library.
                                                                                                                      
# \section desc Description     
# SpectralMix is a package for performing various forms of spectral clustering, where once 
# the data are projected into eigenvector space a number of options exist to partition the
# data into classes including k-means and Gaussian mixture models. 
# 
# \section Prerequisites
# \li Numpy at http://numpy.scipy.org/
# \li NetworkX at http://networkx.lanl.gov/
# \li Matplotlib at http://matplotlib.sourceforge.net/
# \li SciPy at http://www.scipy.org/
# \section Resources
# \li The source, docs, bug reporting, and more info can be found at http://projects.dbbe.musc.edu/trac/SpectralMix
# \section Authors
# \li Adam J Richards <richa@musc.edu> 
# \li Xinghua Lu <lux@musc.edu>

from SilValueGenerator import SilValueGenerator
from DistanceCalculator import DistanceCalculator
from ClusterBase import *
from SpectralCluster import *
from DistanceMatrix import *
from GraphingLib import *
from DataManipLib import *

