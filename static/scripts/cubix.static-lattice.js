var context = new function(){
	
	var attributes = [];
	var objects = [];
	var rel = new Array();
	
	var upArrow = null;
	
	var upArrowUpdate = false;
	
	 this.getEntitiesCount = function () {
	 	return objects.length;
	 };
	 
	 this.hasUpArrow = function (row, col) {
	 	
	 	//getUpArrow().getRelationAt(row, col);
	 	
	 	if (null == upArrow) {
            upArrow = this.createRelation(attributes.length, objects.length); // TODO ATTR E OBJETOS? NAO O CONTRATIO?
            upArrowUpdate = true;
        }
        if (upArrowUpdate) {
            calcUpArrow();
        }
        //return upArrow;
        
        return upArrow
        
	 	
	 };
	 
	 this.calcUpArrow = function() {
        depthSearchArrowCalculator.calcUpArrow(upArrow);
        upArrowUpdate = false;
    };
     
    this.computeEntitiesOrder = function() { // para attr
    	// calc attr order
        return this.calcAttributesOrder(rel);
    };
    
    this.calcAttributesOrder = function (relation) {
        var size = this.attributes.length;//relation.getColCount();

        ret = this.createRelation(size, size);
        for (var i = 0; i < size; i++) {
            for (var j = 0; j < size; j++) {
                //ret.setRelationAt(i, j, isAttributeSubsetOf(relation, i, j));
                ret[i][j] = this.isAttributeSubsetOf(relation,i,j);
            }
        }
        return ret;
    };

    this.isAttributeSubsetOf = function(relation, attr1, attr2) {
        for (var k = relation.length; --k >= 0;) { // for rel.getRowCount()
            if (relation[k, attr1] && !relation[k, attr2]) {
                return false;
            }
        }
        return true;
    };
    
    
    this.createRelation = function (rows,cols) {
    	var newRel = new Array();
    	for (var i=0; i < rows; i++) {
		  
		  var cols = new Array();
		  for (var j=0; j < cols; j++) {
			cols[j] = null;
		  };
		  newRel[i] = cols;
		};
		return newRel;
    }
    
}


var vectorsX = [];

var vectorsY = [];

var base = 1.0;
var stretch = 1.0;

function calcInitialPlacement() {
       // getDecompositionStrategy().setContext(lattice.getContext());
        
        computeDiagram();
}


function computeDiagram() {
        var size = context.attributes.length;//= getDecompositionStrategy().getEntitiesCount();
        
        chains = [];
        vectorsX = [];
        vectorsY = [];
        
        //BinaryRelation order = getDecompositionStrategy().computeEntitiesOrder();
        var order = context.computeEntitiesOrder();
        
        computeChainDecomposition(order);
        
        calcConceptsPlacement();
        
}

function computeChainDecomposition(order) {
        
        var reducibles = findReducibleEntities(order);
        var edges = calcOrderGraphOfIrreducibleEntities(order, reducibles);
        
        var SIZE = order.getRowCount();
        
        ModifiableSet notInStartOfEdgesOfMatching = ContextFactoryRegistry.createSet(SIZE);
        ModifiableSet endsOfEdgesOfMatching = ContextFactoryRegistry.createSet(SIZE);
        int[] matching = new int[SIZE]; // matching[v] - end of edge in matching for entity v, or -1, if entity isn't in matching
        
        notInStartOfEdgesOfMatching.fill();
        endsOfEdgesOfMatching.clearSet();
        
        ModifiableSet temp = ContextFactoryRegistry.createSet(size);
        //building of initial matching
        for (int v = 0; v < size; v++) {
            temp.copy(edges.getSet(v));
            temp.andNot(endsOfEdgesOfMatching);
            
            matching[v] = temp.firstIn();
            if (matching[v] != unknown) {
                
                notInStartOfEdgesOfMatching.remove(v);
                endsOfEdgesOfMatching.put(matching[v]);
            }
        }
        
        
        final int unlabelled = -1;
        //    label[v] has sense only for edges, which are in matching
        //  if(label[v]>=0) this mean, that edge (label[v], matching[v]) can be put in matching,
        //  as alternative to edge (v, matching[v])
        
        int[] label = new int[size];
        
        // Edges, that's start in entities, that are already in matching,
        // end ends in entities, that are not in matching
        int[] exposed = new int[size];
        ModifiableSet Q = (ModifiableSet) notInStartOfEdgesOfMatching.clone();
        
        for (int v = 0; v < size; v++) {
            if (notInStartOfEdgesOfMatching.in(v)) {
                exposed[v] = unknown;
            } else {
                temp.copy(edges.getSet(v));
                temp.andNot(endsOfEdgesOfMatching);
                exposed[v] = temp.firstIn();
            }
            label[v] = unlabelled;
        }
        
        while (!Q.isEmpty()) {
            int v = Q.firstIn();
            Q.remove(v);
            
            if (label[v] != unlabelled &&
                exposed[v] != unknown &&
                !endsOfEdgesOfMatching.in(exposed[v])) {
                //we find a path, that enlarges the matching.
                //calculating new matching
                endsOfEdgesOfMatching.put(exposed[v]);
                while (label[v] != unlabelled) {
                    exposed[label[v]] = matching[v];
                    matching[v] = exposed[v];
                    v = label[v];
                }
                
                // v is the first entry of improving path.
                matching[v] = exposed[v];
                exposed[v] = unknown;
                notInStartOfEdgesOfMatching.remove(v);
                
                //restarting search for improving path
                Q.copy(notInStartOfEdgesOfMatching);
                
                for (v = notInStartOfEdgesOfMatching.firstOut();
                     v >= 0;
                     v = notInStartOfEdgesOfMatching.nextOut(v)) {
                    temp.copy(edges.getSet(v));
                    temp.andNot(endsOfEdgesOfMatching);
                    
                    exposed[v] = temp.firstIn();
                    label[v] = unlabelled;
                }
                
            } else {
                // v, by definition, isn't in matching
                // width - is a start of one edges in matching
                //searching edges, which can be in matching
                for (int w = notInStartOfEdgesOfMatching.firstOut(); w >= 0; w = notInStartOfEdgesOfMatching.nextOut(w))
                {
                    //if(v == matching[width]) ==> edges.getRelationAt(v, matching[width]) == false);
                    //if(v==width) ==> edges.getRelationAt(v, matching[width]) == false
                    if (label[w] == unlabelled
                        && matching[w] >= 0
                        && edges.getRelationAt(v, matching[w])) {
                        //this mean, that edge (width, matching[width])    in matching can be replaced by edge (v, matching[width])
                        Q.put(w);
                        label[w] = v;
                    }
                }
            }
        }
        
        assignChainNumbersForEntities(chains, order, reducibles, endsOfEdgesOfMatching, matching);
}


function attr_isEntityIrreducible(v) {
        for (var i = context.objects.length; --i >= 0;) {
            if (cxt.hasUpArrow(i, v)) {
                return true;
            }
        }
        return false;
}

function findReducibleEntities(order) {
        var size = order.length;//order.getRowCount();
        
        var reducibles = new Array();//bidimensional array //ContextFactoryRegistry.createSet(size);
        
        for (var v=0; v < size; v++) {

            var isReducible = !getDecompositionStrategy().isEntityIrreducible(v);
            
            for (var w = order.getSet(v).firstIn();
                 w < v && w != -1;
                 w = order.getSet(v).nextIn(w)) {
                isReducible = isReducible || order.getRelationAt(w, v);
            }
            
            if (isReducible) {
                reducibles.push(v); //put(v);
            }
        }
        return reducibles;
}




var depthSearchArrowCalculator = new function(){
	var tempAttrSet;
	var tempObjectSet;
	var outAttribsDelta;
	var upArrow;
	
	var newIntent;
	var newExtent;
	
	this.initObjectsAndAttribs = function(){
		// super
		var cols = contet.attributes.length;//rel.getColCount();
        var rows = context.objects.length;//rel.getRowCount();
		var maxDepth = Math.min(cols, rows) + 1;
		
		
		tempAttrSet = new Array(cols);
        outerSet = new Array(cols);
        newIntent = new Array(cols);
        newExtent = new Array(rows);
		// this
		
		//tempObjectSet = ContextFactoryRegistry.createSet(rel.getRowCount());
        //outAttribsDelta = ContextFactoryRegistry.createSet(rel.getColCount());
        tempObjectSet = new Array(rows);
        outAttribsDelta = new Array(cols);
        
        
        currObjects = new Array(maxDepth);//new ModifiableSet[maxDepth];
        currAttribs = new Array(maxDepth);//new ModifiableSet[maxDepth];

        for (var i = 0; i < maxDepth; i++) {
            currObjects[i] = new Array(rows);//ContextFactoryRegistry.createSet(rows);
            currAttribs[i] = new Array(cols);//ContextFactoryRegistry.createSet(cols);
        }
        
        
	}

	this.calcUpArrow = function(upArrowRel){
	
	 	this.initObjectsAndAttribs();
        this.upArrow = upArrowRel;

        var cols = context.attributes.length;//rel.getColCount();
        var rows = context.objects.length;//rel.getRowCount();

        //upArrow.setDimension(rows, cols);

        this.fill(newIntent);

        this.fill(newExtent);//newExtent.fill();

        //clearing prohibited set
        this.clearSet(tempAttrSet);//.clearSet();

        this.clearRelation(upArrow);

        doCalcUpArrow(newExtent, newIntent, 0);
	
	};
	this.fill = function(theset){
		// ??? TODO
		for (var i=0; i < theset.length; i++) {
		  theset[i] = 1;
		};
	}
	this.clearSet = function(theset){
		// ??? TODO
		for (var i=0; i < theset.length; i++) {
		  theset[i] = 0;
		};
	}
	this.clearRelation = function(therelation){
		for (var j = context.objects.length; --j >= 0;) { // sizeX
            this.clearSet(therelation[j]);//.clearSet();
        }
	}

	this.doCalcUpArrow = function (objects, attribs, depth) {
        var prohibitedSet = tempAttrSet;
        // here it plays this role
        //*DBG*/ System.out.println("doUpCalcArrow:====================  "+depth);
        //*DBG*/ System.out.println("prohibited "+nextClosure);
        var _currObjects = currObjects[depth];
        _currObjects = objects.slice(0);  //_currObjects.copy(objects); // TODO é isso mesmo??
        //*DBG*/ System.out.println("objects:"+_currObjects);
        var _currAttribs = currAttribs[depth];
         _currAttribs = attribs.slice(0);// _currAttribs.copy(attribs);
        //*DBG*/ System.out.println("attribs:"+_currAttribs);
        for (var j = _currAttribs.length(); --j >= 0;) {
            //objects, that lay outside from current extent
            //newExtent.clearSet();
            this.clearSet(newExtent);
            //attribs, that have greater or equal extent with current
            newIntent = _currAttribs.slice(0); //newIntent.copy(_currAttribs); // TODO review
            this.clearSet(outerSet);//.clearSet();
            
            if (_currAttribs[j] == 1 && prohibitedSet[j] == 0) { // TODO substituir int por boolean
                for (var i = _currObjects.length; --i >= 0;) {
                    if (_currObjects[i]) {
                        var tmp = rel.getSet(i);
                        if (tmp.in(j)) {
                            newIntent.and(tmp);
                        } else {
                            outerSet.or(tmp);
                            newExtent.put(i);
                        }
                    }
                }
                outAttribsDelta.copy(newIntent);
                outAttribsDelta.andNot(outerSet);
                //*DBG*/ System.out.println( j+" outAttribsDelta="+outAttribsDelta);
                //now in outAttribsDelta attribs equal with current
                prohibitedSet.or(outAttribsDelta);

                newIntent.and(outerSet);
                //*DBG*/ System.out.println( j+" less than "+newIntent);
                //*DBG*/ System.out.println("out objects "+newExtent);
                //now in newIntent attribs with greater extent width.r.t. current
                if (!newExtent.isEmpty()) {
                    for (int i = newExtent.length(); --i >= 0;) {
                        if (newExtent.in(i)) {
                            Set tmp = rel.getSet(i);
                            //*DBG*/ System.out.println(i+" :"+tmp);
                            if (newIntent.isSubsetOf(tmp)) {
                                upArrow.getModifiableSet(i).or(outAttribsDelta);
                            }
                        }
                    }
                    if (!newIntent.isEmpty()) {
                        doCalcUpArrow(newExtent, newIntent, depth + 1);
                    }
                }
            }
        }
        //*DBG*/ System.out.println("------------------------------------");
    }
};