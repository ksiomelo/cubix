from __future__ import division

def compute_extent_size(lattice):
    number_of_objects = len(lattice._context._objects)
    extent_size_index = {}
    
    for c in lattice:
        extent_size_index[c.concept_id] = len(c.extent) / number_of_objects
            
    return extent_size_index