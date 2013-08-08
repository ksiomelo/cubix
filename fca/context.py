from django.db import models
from djangotoolbox.fields import ListField, EmbeddedModelField
# -*- coding: utf-8 -*-
"""
Holds class for context
"""
import copy

import fca.algorithms


class Context(models.Model):
    
#    formal_attributes = models.ManyToManyField(fca.models.FormalAttribute, through='FormalRelation')
#    formal_objects = models.ManyToManyField(fca.models.FormalObject, through='FormalRelation')
#    # formal_relation_set
#    def __unicode__(self):
#        return self.id
    
    
    """
    A Formal Context consists of two sets: *objects* and *attributes*
    and of a binary relation between them.

    As a data type we use a bit matrix.

    Examples
    ========

    Create a context.

    >>> ct = [[True, False, False, True],\
              [True, False, True, False],\
              [False, True, True, False],\
              [False, True, True, True]]
    >>> objs = [1, 2, 3, 4]
    >>> attrs = ['a', 'b', 'c', 'd']
    >>> c = Context(ct, objs, attrs)
    >>> c[0][0]
    True
    >>> c[0][2]
    False
    >>> 1 in c.objects
    True
    >>> 'f' in c.attributes
    False
    >>> for o in c:
    ...     print o
    ...     break
    ...
    [True, False, False, True]
    >>> transposed_c = c.transpose()
    >>> for o in transposed_c:
    ...     print o
    ...
    [True, True, False, False]
    [False, False, True, True]
    [False, True, True, True]
    [True, False, False, True]

    Class emulates container type.

    >>> len(c)
    4
    >>> c[1]
    [True, False, True, False]

    Usage of examples.

    >>> c.get_object_intent_by_index(1)
    set(['a', 'c'])
    >>> for ex in c.examples():
    ...     print ex
    ...     break
    ...
    set(['a', 'd'])
    
    Implications basis
    
    >>> for imp in c.attribute_implications:
    ...     print imp
    ...
    c, d => b
    b => c
    a, c, b => d
    
    >>> for imp in c.object_implications:
    ...     print imp
    ...
    3 => 4
    2, 4 => 3
    1, 3, 4 => 2
    """
    
    _table = ListField()
    _objects = ListField()
    _attributes = ListField()
    
#    def __init__(self, cross_table=[], objects=[], attributes=[]):
#        """Create a context from cross table and list of objects, list
#        of attributes
#        
#        cross_table - the list of bool lists
#        objects - the list of objects
#        attributes - the list of attributes 
#        """
#        if len(cross_table) != len(objects):
#            raise ValueError("Number of objects (=%i) and number of cross table"
#                   " rows(=%i) must agree" % (len(objects), len(cross_table)))
#        elif (len(cross_table) != 0) and len(cross_table[0]) != len(attributes):
#            raise ValueError("Number of attributes (=%i) and number of cross table"
#                    " columns (=%i) must agree" % (len(attributes),
#                        len(cross_table[0])))
#
#        _table = cross_table
#        _objects = objects
#        _attributes = attributes
        
    def __deepcopy__(self, memo):
        return Context(_table=copy.deepcopy(self._table, memo),
                       _objects=self._objects[:],
                       _attributes=self._attributes[:])

    def get_objects(self):
        return self._objects

    # objects = property(get_objects)

    def get_attributes(self):
        return self._attributes
    
    
    def get_attribute_names_and_values(self):
        ret = {}
        for attr in self._attributes:
            raw_attr = attr.split("-")[0]
            value = "-".join(attr.split("-")[1:])
            if not raw_attr in ret:
                ret[raw_attr] = []
            ret[raw_attr].append(value)
        return ret
    
    def get_attribute_objects(self):
        ret = {}
        for attr in self._attributes:
            raw_attr = attr.split("-")[0]
            abc = self.get_attribute_extent(attr)
            
            if not raw_attr in ret:
                ret[raw_attr] = list(abc)
            else:
                for aobj in abc:
                    if aobj not in ret[raw_attr]:
                        ret[raw_attr].append(aobj)
                
            
       
        return ret

    #attributes = property(get_attributes)
    
    def get_relations(self):
        return self._table

    
    def get_attribute_implications(self, 
                                   basis=fca.algorithms.compute_dg_basis,
                                   confirmed=[],
                                   cond=lambda x: True):
        return basis(self, imp_basis=confirmed, cond=cond)
        # if not self._attr_imp_basis or (confirmed != self._confirmed):
        #             self._attr_imp_basis = basis(self, imp_basis=confirmed)
        #             self._confirmed = confirmed
        #         return self._attr_imp_basis
    
    _attr_imp_basis = None
    _confirmed = None
    attribute_implications = property(get_attribute_implications)
    
    def get_object_implications(self, 
                                basis=fca.algorithms.compute_dg_basis,
                                confirmed=None):
        cxt = self.transpose()
        if not self._obj_imp_basis:
            self._obj_imp_basis = basis(cxt, imp_basis=confirmed)
        return self._obj_imp_basis
    
    _obj_imp_basis = None
    object_implications = property(get_object_implications)
        
    def examples(self):
        """Generator. Generate set of corresponding attributes
        for each row (object) of context
        """
        for obj in self._table:
            attrs_indexes = filter(lambda i: obj[i], range(len(obj)))
            yield set([self._attributes[i] for i in attrs_indexes])
            
    def intents(self):
        return self.examples()

    def get_object_intent_by_index(self, i):
        """Return a set of corresponding attributes for row with index i"""
        # TODO: !!! Very inefficient. Avoid using
        attrs_indexes = filter(lambda j: self._table[i][j],
                range(len(self._table[i])))
        return set([self._attributes[i] for i in attrs_indexes])
    
    def get_object_intent(self, o):
        index = self._objects.index(o)
        return self.get_object_intent_by_index(index)
    
    def get_attribute_extent_by_index(self, j):
        """Return a set of corresponding objects for column with index i"""
        objs_indexes = filter(lambda i: self._table[i][j],
                range(len(self._table)))
        return set([self._objects[i] for i in objs_indexes])
    
    def get_attribute_extent(self, a):
        index = self._attributes.index(a)
        return self.get_attribute_extent_by_index(index)
        
    def get_value(self, o, a):
        io = self._objects.index(o)
        ia = self._attributes.index(a)
        return self[io][ia]
    
    def add_attribute(self, col, attr_name):
        """Add new attribute to context with given name"""
        for i in range(len(self._objects)):
            self._table[i].append(col[i])
        self._attributes.append(attr_name)

    def add_column(self, col, attr_name):
        """Deprecated. Use add_attribute."""
        print "Deprecated. Use add_attribute."
        self.add_attribute(col, attr_name)

    def add_object(self, row, obj_name):
        """Add new object to context with given name"""
        self._table.append(row)
        self._objects.append(obj_name)
        
    def add_object_with_intent(self, intent, obj_name):
        self._attr_imp_basis = None
        self._objects.append(obj_name)
        row = [(attr in intent) for attr in self._attributes]
        self._table.append(row)
        
    def add_attribute_with_extent(self, extent, attr_name):
        col = [(obj in extent) for obj in self._objects]
        self.add_attribute(col, attr_name)
        
    def set_attribute_extent(self, extent, name):
        attr_index = self._attributes.index(name)
        for i in range(len(self._objects)):
            self._table[i][attr_index] = (self._objects[i] in extent)
            
    def set_object_intent(self, intent, name):
        obj_index = self._objects.index(name)
        for i in range(len(self._attributes)):
            self._table[obj_index][i] = (self._attributes[i] in intent)
        
    def delete_object(self, obj_index):
        del self._table[obj_index]
        del self._objects[obj_index]
        
    def delete_object_by_name(self, obj_name):
        self.delete_object(self._objects.index(obj_name))
    
    def delete_attribute(self, attr_index):
        for i in range(len(self._objects)):
            del self._table[i][attr_index]
        del self._attributes[attr_index]
        
    def delete_attribute_by_name(self, attr_name):
        self.delete_attribute(self._attributes.index(attr_name))
        
    def rename_object(self, old_name, name):
        self._objects[self._objects.index(old_name)] = name
        
    def rename_attribute(self, old_name, name):
        self._attributes[self._attributes.index(old_name)] = name
        
    def transpose(self):
        """Return new context with transposed cross-table"""
        new_objects = self._attributes[:]
        new_attributes = self._objects[:]
        new_cross_table = []
        for j in xrange(len(self._attributes)):
            line = []
            for i in xrange(len(self._objects)):
                line.append(self._table[i][j])
            new_cross_table.append(line)
        return Context(new_cross_table, new_objects, new_attributes)
        
    def extract_subcontext_filtered_by_attributes(self, attributes_names,
                                                    mode="and"):
        """Create a subcontext with such objects that have given attributes"""
        values = dict( [(attribute, True) for attribute in attributes_names] )
        object_names, subtable = \
                            self._extract_subtable_by_attribute_values(values, mode)
        return Context(_table=subtable,
                       _objects=object_names,
                       _attributes=self._attributes)
                            
    def extract_subcontext(self, attribute_names):
        """Create a subcontext with only indicated attributes"""
        return Context(_table=self._extract_subtable(attribute_names),
                       _objects=self._objects,
                       _attributes=attribute_names)
                                
    def _extract_subtable(self, attribute_names):
        self._check_attribute_names(attribute_names)
        attribute_indices = [self._attributes.index(a) for a in attribute_names] 
        table = []
        for i in range(len(self)):
            row = []
            for j in attribute_indices:
                row.append(self[i][j])
            table.append(row)
        
        return table
    
    def get_graph_of_attributes(self):
        
        nodes = []
        links = []
        
        for i,attr1 in enumerate(self._attributes):
            nodes.append({"name": attr1})
            for j,attr2 in enumerate(self._attributes):
                if attr1 != attr2: 
                    count = self._count_co_occurence_of_attributes(attr1, attr2)
                    if (count > 0):
                        links.append({"source_idx":i, "target_idx": j, "count": count, "total":len(self._objects)})
                        
        return (nodes,links)
            
                    
                    
    def _count_co_occurence_of_attributes(self, attr1, attr2):
        idx1 = self._attributes.index(attr1);
        idx2 = self._attributes.index(attr2);
        
        count = 0
        for i in range(len(self._table)):
            if self._table[i][idx1] and self._table[i][idx2]:
                count += 1
        return count
    
    
    def extract_subcontext_containing_attributes(self, attribute_names):
        attribute_indices = [self._attributes.index(a) for a in attribute_names]
        table = []
        tobjects =[]
        for i in range(len(self)):
            for aidx in attribute_indices: #row contains any of the attributes
                if self[i][aidx]:
                    table.append(self[i])
                    tobjects.append(self._objects[i])
                    break
        
        cols_for_removal = []
        tattributes = [] # filter attributes that are not marked
        
        if len(table) > 0:
            for j in range(len(table[0])):
                has_mark = False
                for i in range(len(table)):
                    if table[i][j]:
                        has_mark = True
                        break
                if not has_mark:
                    cols_for_removal.append(j)
                else:
                    tattributes.append(self._attributes[j])
        
        if cols_for_removal:
            table = self._remove_columns(table, cols_for_removal)
        
        return Context(_table=table,
                       _objects=tobjects,
                       _attributes=tattributes)
        
    
    def _remove_columns(self, table, col_idxs):
        ret = []
        for i in range(len(table)):
            row = []
            for j in range(len(table[i])):
                if j not in col_idxs:
                    row.append(table[i][j])
            ret.append(row)
        return ret
        
    def _extract_subtable_by_condition(self, condition):
        """Extract a subtable containing only rows that satisfy the condition.
        Return a list of object names and a subtable.
        
        Keyword arguments:
        condition(object_index) -- a function that takes an an object index and
            returns a Boolean value
        
        """
        indices = [i for i in range(len(self)) if condition(i)]
        return ([self._objects[i] for i in indices],
                [self._table[i] for i in indices])
                
    def _extract_subtable_by_attribute_values(self, values, 
                                                    mode="and"):
        """Extract a subtable containing only rows with certain column values.
        Return a list of object names and a subtable.
        
        Keyword arguments:
        values -- an attribute-value dictionary
        
        """
        self._check_attribute_names(values.keys())
        if mode == "and":
            indices = [i for i in range(len(self)) if self._has_values(i, values)]
        elif mode == "or":
            indices = [i for i in range(len(self)) if self._has_at_least_one_value(i, values)]
        return ([self._objects[i] for i in indices],
                [self._table[i] for i in indices])
                
    def _has_values(self, i, values):
        """Test if ith object has attribute values as indicated.
        
        Keyword arguments:
        i -- an object index
        values -- an attribute-value dictionary
        
        """
        for a in values:
            j = self._attributes.index(a)
            v = values[a]
            if self[i][j] != v:
                return False
        return True
        
    def _has_at_least_one_value(self, i, values):
        """Test if ith object has at least one attribute value as in values.
                
        Keyword arguments:
        i -- an object index
        values -- an attribute-value dictionary
        
        """
        for a in values:
            j = self._attributes.index(a)
            v = values[a]
            if self[i][j] == v:
                return True
        return False
            
    def _check_attribute_names(self, attribute_names):
        if not set(attribute_names) <= set(self._attributes):
            wrong_attributes = ""
            for a in set(attribute_names) - set(self._attributes):
                wrong_attributes += "\t%s\n" % a
            raise ValueError("Wrong attribute names:\n%s" % wrong_attributes)    

    ############################
    # Emulating container type #
    ############################

    def __len__(self):
        return len(self._table)

    def __getitem__(self, key):
        return self._table[key]

    ############################
    
    def __repr__(self):
        output = ", ".join(self._attributes) + "\n"
        output += ", ".join(self._objects) + "\n"
        cross = {True : "X", False : "."}
        for i in xrange(len(self._objects)):
            output += ("".join([cross[b] for b in self[i]])) + "\n"
        return output
    
    def to_dict(self, is_list=False):
        context = {}
        context["id"] = self.id
        if is_list :
            context["objects_length"] = len(self._objects)
            context["attributes_length"] = len(self._attributes)
        else :
            context["table"] = self._table
            context["objects"] = self._objects
            context["attributes"] = self._attributes
        return context

if __name__ == "__main__":
    import doctest
    doctest.testmod()
