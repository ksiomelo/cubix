import redis
import simplejson as json

r = redis.StrictRedis(host='localhost', port=6379, db=0)

class Concept():
    
    
    def __init__(self, extent, intent):
        self.intent = intent
        self.extent = extent
        
    def to_s(self):
        return ",".join(self.extent) + "#" + ",".join(self.intent)
        
#
#    UTILS
#
def sanitize(c):
    if not c:
        return
    
    if c["extent"]:
        c["extent"] = set(c["extent"].split(","))
    else:
        c["extent"] = set([])
        
    if c["intent"]:
        c["intent"] = set(c["intent"].split(","))
    else:
        c["intent"] = set([])
            
            
#def desanitize(concept):
#    if (type(concept["intent"]) == set):
#        concept["intent"] = list(concept["intent"])
#    if (type(concept["extent"]) == set):
#        concept["extent"] = list(concept["extent"])
        
def get_id(concept):
    return ",".join(sorted(concept["intent"]))

#
# CONCEPTS
#
def save_or_update_concept(concept):
    #sanitize(concept)
    cid = get_id(concept)
    
    existing = get_concept_by_intent(concept["intent"])
    if existing: # update
        if concept["extent"] == existing["extent"]:
            return # same concept
        new_extent = concept["extent"] | existing["extent"]
    else:
        new_extent = concept["extent"]
        
    pipe = r.pipeline()
    pipe.hmset("concept:"+cid, {'intent': ",".join(concept["intent"]), 'extent': ",".join(new_extent)}) 
    if not existing:
        pipe.zadd("concepts", len(concept["intent"]), "concept:"+cid)
        #pipe.lpush("concepts", "concept:"+cid) 
    pipe.execute()
    
    
def get_concept_by_intent(intent):
    cid = ",".join(intent)
    concept = r.hgetall("concept:"+cid)
    sanitize(concept)
    return concept
    
def get_concepts(max_card):
    
    concept_ids = r.zrangebyscore("concepts", 0, max_card)
    
    pipe = r.pipeline()
    for cid in concept_ids:
        pipe.hgetall(cid) 
    raw_concepts = pipe.execute()
    
    concepts = []
    for c in raw_concepts:
        sanitize(c)
        concepts.append(c)
    return concepts

def search_concepts(query): #format: mammal,preying,bird
    
    queryAttrs = set([x.strip() for x in query.split(',')])
    
    concept_ids = r.zrangebyscore("concepts", 0, "+inf")
    
    pipe = r.pipeline()
    for cid in concept_ids:
        cIntent = cid.split(":")[1]
        if not cIntent:
            cIntent = set([]) # prevents set([''])
        else:
            cIntent = set(cIntent.split(","))
        if len(queryAttrs & cIntent) > 0:
            pipe.hgetall(cid) 
    raw_concepts = pipe.execute()
    
    concepts = []
    for c in raw_concepts:
        sanitize(c)
        concepts.append(c)
    return concepts

def get_top():
    cid = r.get("top")
    c = r.hgetall("concept:"+cid) 
    sanitize(c)
    return c

def get_bottom():
    concept_ids = r.zrangebyscore("concepts", 0, "+inf")
    cid = concept_ids[-1]
    c = r.hgetall(cid) 
    sanitize(c)
    return c

def set_top(concept):
    r.set("top", get_id(concept))
    
#
#    LINKS
#    

def get_links():
    return r.smembers("links")

def add_link(source, destination):
    sid = get_id(source)
    did = get_id(destination)
    
    
    
    r.sadd("links", sid + "#"+ did)
    
def remove_link(source, destination):
    sid = get_id(source)
    did = get_id(destination)
    
    r.srem("links", sid + "#"+ did)