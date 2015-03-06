import os
import json
from pprint import pprint

def convert(inputfile,outputfile):

    json_data=open(inputfile)

    data = json.load(json_data)
    #pprint(data)
    json_data.close()
    
    # copy to file
    f = open(outputfile, 'w')
    for line in data:
        f.write(line +'\n')
       
    f.close()
    
    #json.loads('["foo", {"bar":["baz", null, 1.0, 2]}]')
    
if __name__ == '__main__':
    convert('/Users/cassiomelo/Downloads/formalcontext.json', '/Users/cassiomelo/Downloads/formalcontext.cxt')