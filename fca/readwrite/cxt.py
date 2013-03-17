# -*- coding: utf-8 -*-
"""Holds function that read context from tab separated txt file"""
import StringIO

import fca
from service.casa import Casa

def read_cxt_from_string(data):
    """Read context from path, which is .cxt file

    Format
    ======

    Example of .cxt file (tests/context.cxt):

    B

    4
    4

    Obj 1
    Obj 2
    Obj 3
    Obj 4
    a
    b
    c
    d
    X..X
    X.X.
    .XX.
    .XXX

    Examples
    ========

    Load example file from tests directory

    >>> c = read_cxt('tests/context.cxt')
    >>> len(c)
    4
    >>> len(c[0])
    4
    >>> for o in c:
    ...     print o
    ...
    [True, False, False, True]
    [True, False, True, False]
    [False, True, True, False]
    [False, True, True, True]
    >>> print c.objects
    ['Obj 1', 'Obj 2', 'Obj 3', 'Obj 4']
    >>> print c.attributes
    ['a', 'b', 'c', 'd']
    >>> c = read_cxt('tests/context.txt')
    Traceback (most recent call last):
        ...
    AssertionError: File is not valid cxt

    """
    
    input_file = StringIO.StringIO(data)

    assert input_file.readline().strip() == "B",\
        "File is not valid cxt"
    input_file.readline() # Empty line
    number_of_objects = int(input_file.readline().strip())
    number_of_attributes = int(input_file.readline().strip())
    input_file.readline() # Empty line

    objects = [input_file.readline().strip() for i in xrange(number_of_objects)]
    attributes = [input_file.readline().strip() for i in xrange(number_of_attributes)]

    table = []
    for i in xrange(number_of_objects):
        line = map(lambda c: c=="X", input_file.readline().strip())
        table.append(line)

    input_file.close()

    return Casa("sample", objects, attributes, table)



def read_cxt(path):
    """Read context from path, which is .cxt file

    Format
    ======

    Example of .cxt file (tests/context.cxt):

    B

    4
    4

    Obj 1
    Obj 2
    Obj 3
    Obj 4
    a
    b
    c
    d
    X..X
    X.X.
    .XX.
    .XXX

    Examples
    ========

    Load example file from tests directory

    >>> c = read_cxt('tests/context.cxt')
    >>> len(c)
    4
    >>> len(c[0])
    4
    >>> for o in c:
    ...     print o
    ...
    [True, False, False, True]
    [True, False, True, False]
    [False, True, True, False]
    [False, True, True, True]
    >>> print c.objects
    ['Obj 1', 'Obj 2', 'Obj 3', 'Obj 4']
    >>> print c.attributes
    ['a', 'b', 'c', 'd']
    >>> c = read_cxt('tests/context.txt')
    Traceback (most recent call last):
        ...
    AssertionError: File is not valid cxt

    """
    
    truncate_at = 80
    
    
    input_file = open(path, "r")
    assert input_file.readline().strip() == "B",\
        "File is not valid cxt"
    input_file.readline() # Empty line
    number_of_objects = int(input_file.readline().strip())
    number_of_attributes = int(input_file.readline().strip())
    input_file.readline() # Empty line
    
    
    objects = []
    for i in xrange(number_of_objects):
        objString = input_file.readline().strip()
        if i < truncate_at:
            objects.append(objString)
        
    attributes = [input_file.readline().strip() for i in xrange(number_of_attributes)]

    table = []
    for i in xrange(number_of_objects):
        line = map(lambda c: c=="X", input_file.readline().strip())
        if i < truncate_at:
            table.append(line)

    input_file.close()

    return fca.Context(_table=table, _objects=objects, _attributes=attributes)

def read_table(path):
    """Read context from path, which is .cxt file

    Format
    ======

    Example of .cxt file (tests/context.cxt):

    B

    4
    4

    Obj 1
    Obj 2
    Obj 3
    Obj 4
    a
    b
    c
    d
    X..X
    X.X.
    .XX.
    .XXX

    Examples
    ========

    Load example file from tests directory

    >>> c = read_cxt('tests/context.cxt')
    >>> len(c)
    4
    >>> len(c[0])
    4
    >>> for o in c:
    ...     print o
    ...
    [True, False, False, True]
    [True, False, True, False]
    [False, True, True, False]
    [False, True, True, True]
    >>> print c.objects
    ['Obj 1', 'Obj 2', 'Obj 3', 'Obj 4']
    >>> print c.attributes
    ['a', 'b', 'c', 'd']
    >>> c = read_cxt('tests/context.txt')
    Traceback (most recent call last):
        ...
    AssertionError: File is not valid cxt

    """
    input_file = open(path, "r")
    assert input_file.readline().strip() == "B",\
        "File is not valid cxt"
    input_file.readline() # Empty line
    number_of_objects = int(input_file.readline().strip())
    number_of_attributes = int(input_file.readline().strip())
    input_file.readline() # Empty line

    objects = [input_file.readline().strip() for i in xrange(number_of_objects)]
    attributes = [input_file.readline().strip() for i in xrange(number_of_attributes)]

    table = []
    for i in xrange(number_of_objects):
        line = map(lambda c: c=="X", input_file.readline().strip())
        table.append(line)

    input_file.close()

    return fca.Context(_table=table, _objects=objects, _attributes=attributes)


def write_cxt(context, path):
    output_file = open(path, "w")
    output_file.write("B\n\n")

    output_file.write(str(len(context.objects))+"\n")
    output_file.write(str(len(context.attributes))+"\n\n")

    for i in xrange(len(context.objects)):
        output_file.write(str(context.objects[i]))
        output_file.write("\n")

    for i in xrange(len(context.attributes)):
        output_file.write(str(context.attributes[i]))
        output_file.write("\n")

    cross = {True : "X", False : "."}
    for i in xrange(len(context.objects)):
        output_file.write("".join([cross[b] for b in context[i]]))
        output_file.write("\n")

    output_file.close()
    
def uwrite_cxt(context, path):
    import codecs
    
    output_file = codecs.open(path, "w", "utf-8")
    output_file.write("B\n\n")

    output_file.write(str(len(context.objects))+"\n")
    output_file.write(str(len(context.attributes))+"\n\n")

    for i in xrange(len(context.objects)):
        output_file.write(context.objects[i])
        output_file.write("\n")

    for i in xrange(len(context.attributes)):
        output_file.write(context.attributes[i])
        output_file.write("\n")

    cross = {True : "X", False : "."}
    for i in xrange(len(context.objects)):
        output_file.write("".join([cross[b] for b in context[i]]))
        output_file.write("\n")

    output_file.close()
    
def uread_cxt(path):
    import codecs
    
    input_file = codecs.open(path, "r", "utf-8")
    assert input_file.readline().strip() == "B",\
        "File is not valid cxt"
    input_file.readline() # Empty line
    number_of_objects = int(input_file.readline().strip())
    number_of_attributes = int(input_file.readline().strip())
    input_file.readline() # Empty line

    objects = [input_file.readline().strip() for i in xrange(number_of_objects)]
    attributes = [input_file.readline().strip() for i in xrange(number_of_attributes)]

    table = []
    for i in xrange(number_of_objects):
        line = map(lambda c: c=="X", input_file.readline().strip())
        table.append(line)

    input_file.close()

    return fca.Context(table, objects, attributes)


if __name__ == "__main__":
    import doctest
    doctest.testmod()
