
// Context.prototype.isAttributeSubsetOf = function(relation, attr1, attr2) {
//    
// };



function Lattice(data) {
	
	
	this.concepts = data.nodes;
	this.edges = data.links
	
	
	this.getConcept = function(tid){
		for (var i=0; i < this.concepts.length; i++) {
		  if (this.concepts[i].id == tid) 
		  	return this.concepts[i];
		};
	};
	
	this.topConcept = this.getConcept(data.top_id);
	this.bottomConcept = this.getConcept(data.bottom_id);
	
	
	 this.isEmpty = function () {
	 	return false;
	 };
	 
	 this.conceptsCount = function(){
	 	return concepts.length;
	 }
	 
	 /*
	  * Concept operations // TODO ordem invertida!
	  */
	 this.getPredecessors = function(n){ // get predecessors for a node
	 	var ret = new Array();
	 	for (var i=0; i < n.children_ids.length; i++) {
		   ret.push(this.concepts[n.children_ids[i]]);
		 };
	 	return ret;
	 }
	 this.getSucessors = function(n){ // get predecessors for a node
	 	var ret = new Array();
	 	for (var i=0; i < n.parents_ids.length; i++) {
	 		var tid = n.parents_ids[i];
	 		//if (tid >= this.concepts.length) // if they're not in the list 
	 		//	ret.push(virtuals[tid]); 	 // they must be virtuals
	 		//else
		   		ret.push(this.concepts[tid]);
		 };
	 	return ret;
	 }
	 
	 this.getSuccessorsEdges = function(n){ // get edges for that node
	 	var ret = new Array();
	 	for (var i=0; i < this.edges.length; i++) {
		   if (this.edges[i].source.id == n.id)
		   		ret.push(this.edges[i]);
		 };
	 	return ret;
	 }
	 this.getPredecessorsEdges = function(n){ // get edges for that node
	 	var ret = new Array();
	 	for (var i=0; i < this.edges.length; i++) {
		   if (this.edges[i].target.id == n.id)
		   		ret.push(this.edges[i]);
		 };
	 	return ret;
	 }
	 
	 
	 
	 /*
	  * Layout methods
	  */
	 this.getHeight = function(){
	 	return this.bottomConcept.depth+1;
	 };
	 
	 this.getEdgeLength = function(edge) {
	 	//console.log("edge: "+edge.target.intent.join(",") + " ("+(lattice.getHeight() - edge.target.depth) +") - "+edge.source.intent.join(",")+" ("+ (lattice.getHeight() - edge.source.depth)+ ")");
	 	return   (lattice.getHeight() - edge.target.depth) - (lattice.getHeight() - edge.source.depth);  //edge.target.depth - edge.source.depth;
	 };
	 
	 this.doTopSort = function(block) {
        var conceptsCount = this.conceptsCount();
        var workArray = [conceptsCount];
        for (var i = workArray.length; --i >= 0;) {
            workArray[i] = this.getPredecessors(this.nodes[i]).length;
        }

        var tmp = this.topConcept;
        var queueEnd = this.concepts.indexOf(tmp);
        var currNo = 0;

        while (tmp != this.bottomConcept) {
            succ = this.getSuccessorsEdges(tmp);
            
            //block.assignTopSortNumberToElement(tmp, currNo++);
            block[this.concepts.indexOf(tmp)] = tmp.depth;
            
            for (var i=0; i < succ.length; i++) {
            	
                tmp2 = this.concepts(succ[i].target); ///get end
                if (0 == --workArray[this.concepts.indexOf(tmp2)]) {
                	
                    workArray[queueEnd] = this.concepts.indexOf(tmp2);
                    queueEnd = this.concepts.indexOf(tmp2);
                    
                    //block.elementAction(tmp2, tmp);
                }
            }
            tmp = this.concepts[(workArray[this.concepts.indexOf(tmp)])];
        }
        //block.assignTopSortNumberToElement(one, currNo);
        block[this.concepts.indexOf(this.bottomConcept)] = this.bottomConcept.depth;
    }
}



//var gemLayout = Viva.Graph.Layout.gem(graph);
//gemLayout.run();


function ElementInfo(){
        this.xPosDirect = 0;
        this.xPosReverse = 0;
        this.median = 0;
        this.savedPosInRank = 0;
        this.posInRank = 0;
        this.rank = 0;


        this.savePosition = function() {
            this.savedPosInRank = this.posInRank;
        };

        this.restorePosition = function() {
            this.posInRank = this.savedPosInRank;
        };
};

function VirtualConcept(){
        this.children_ids = [];
        this.parents_ids = [];
        this.id = -1;
};
function VirtualEdge(s, t){
        this.source = s;
        this.target = t;
};

function BreakEdgeInfo(replaced, start, end) {
		this.replaced = replaced;
		this.start = start;
		this.end = end;
};


function MinIntersect() {
	
	
	this.ranks = [];
	this.virtMap = new Array();
	this.virtualConcepts = new Array();
	this.elementMap = new Array(lattice.concepts.length);
	this.replacedEdges = [];
	this.transposeRank;
	
	this.run = function() {
   		this.calcCoordinates();
	};
	
	this.calcCoordinates = function() {
	   if (lattice.concepts.length > 0) {
	            this.initSearch();
	            this.performSearch();
// 	
	            // if (!showVirt) {
	                // restoreBreakedEdges();
	                // packPosInRanks();
	            // }
	         }
	        // assignCoordsToLattice();
	};
	
	
	 this.initSearch = function() {
        this.assignRanksToLatticeElements();

        var height = lattice.getHeight();

        var ranksSize =  new Array(height + 1);
        this.calculateRanksSizes(ranksSize);

        this.ranks = new Array(height + 1);
        for (var i = this.ranks.length; --i >= 0;) {
            this.ranks[i] = new Array(ranksSize[i]);
        }

        var currRankPos = new Array(height + 1);
        ArrayFill(currRankPos, 0);
        this.calculateInitialNodeOrderByDepthSearch(lattice.bottomConcept, currRankPos);

        transposeRank = new Array(height + 1);
   };
   
   this.calculateRanksSizes = function(ranksSize) {
        ArrayFill(ranksSize, 0);
        
        for (var i=0; i < lattice.concepts.length; i++) {
          	var curr = lattice.concepts[i];
          	ranksSize[this.getElementInfo(curr.id).rank]++;
			this.getElementInfo(curr.id).posInRank = -1;
			this.breakLongOutgoingEdges(curr, ranksSize); // rank size is updated here also
        };
   };
   
   this.edgeSlack = function(currEdge) {
   	return lattice.getEdgeLength(currEdge) - 1;
   };
   
   this.breakLongOutgoingEdges = function(curr, ranksSize) {
        var succ = lattice.getSuccessorsEdges(curr);
        console.log("for: "+curr.intent.join(","));
        
        for (var i=0; i < succ.length; i++) {
            if (this.edgeSlack(succ[i]) > 0) {
                this.breakEdgeAndUpdateRankSizes(succ[i], ranksSize);
            }
        }
   };
    
    
    
   this.breakEdgeAndUpdateRankSizes = function(edge, ranksSize) {
        var start = edge.source;
        var prev = start;
        var startEdge = null;
        
        
        for (var i = this.edgeSlack(edge); --i >= 0;) {
            var virt = this.makeVirtual();
           

            this.addVirtualConceptToMap(virt);
            
            var elinfo1 = this.getElementInfo(virt.id)
            elinfo1.rank = this.getElementInfo(prev.id).rank + 1;

            //updating rank size for virtual nodes
            ranksSize[this.getElementInfo(virt.id).rank]++;

            var newEdge = new VirtualEdge(prev, virt);
            if (null == startEdge) {
                startEdge = newEdge;
            } else {
                prev.parents_ids.push(newEdge.target.id)//prev.successors.push(newEdge);
            }
            virt.children_ids.push(newEdge.source.id) //virt.predessors.push(newEdge);
            
            prev = virt;
        }

        var end = edge.target;
        var endEdge = new VirtualEdge(prev, end);
        prev.parents_ids.push(endEdge.target.id); //  prev.successors.add(endEdge);
        this.replaceSucc(start, edge.target, startEdge.target); // start.replaceSucc(edge, startEdge);
        this.replacePred(end, edge.source, endEdge.source);//  end.replacePred(edge, endEdge);
        this.replacedEdges.push(new BreakEdgeInfo(edge, startEdge, endEdge)); // replacedEdges.add(new BreakEdgeInfo(edge, startEdge, endEdge));
        
    };
    
   this.replaceSucc = function(node, suc1, suc2) {
		var idx = node.parents_ids.indexOf(suc1.id);
		//if (idx >= 0) 
		node.parents_ids[idx] = suc2.id;
   }
   this.replacePred = function(node, pred1, pred2) {
		var idx = node.children_ids.indexOf(pred1.id);
		//if (idx >= 0) 
		node.children_ids[idx] = pred2.id;
   }
    
   this.makeVirtual = function (){
	   	var vc = new VirtualConcept();
	   	vc.id = lattice.concepts.length + this.virtualConcepts.length;
	    this.virtualConcepts[vc.id] = vc;
	   	return vc;
   };
    
   this.addVirtualConceptToMap = function(el) {
        //el.id = lattice.concepts.length + this.virtMap.length;
        var currInfo = new ElementInfo();
        currInfo.posInRank = -1;
        this.virtMap[el.id] = currInfo; 
   };

   this.getElementInfo = function(elmIdx){
   		if (elmIdx < lattice.concepts.length) 
			return this.elementMap[elmIdx];
		else 
			return this.virtMap[elmIdx];
   };
   
   this.assignRanksToLatticeElements = function() {
   		for (var i=0; i < lattice.concepts.length; i++) {
   			var cur = lattice.concepts[i];
   		    var elinfo = new ElementInfo();
   		    elinfo.rank = lattice.getHeight() - cur.depth;
   		    
   		    this.elementMap[cur.id] = elinfo
			 
		   };
   	
   	
        // getLayerAssignmentFunction().calculateLayersForLattice(lattice,
                // new ILayerAssignmentFunction.ILayerAssignmentFunctionCallback() {
                    // public void layerForLatticeElement(LatticeElement latticeElement, int layer) {
                        // getElementInfo(latticeElement).rank = layer;
                    // }
                // });
//                 
          // this.height_calculateLayersForLattice(function(){
//           	
          // });
    };
    
    this.height_calculateLayersForLattice = function(callback) {
       // Assert.isTrue(lattice.getHeight() >= 0);
       rank = [];
       lattice.doTopSort(rank);
       
        // lattice.doTopSort(new Lattice.DefaultTopSortBlock() {
            // public void assignTopSortNumberToElement(LatticeElement currentElement, int topSortNumber) {
                // callback.layerForLatticeElement(currentElement, currentElement.getHeight());
            // }
        // });
    };
    
    
    
     this.calculateInitialNodeOrderByDepthSearch = function(elm, currRankPos) {
     	
     	var elinfo = this.getElementInfo(elm.id);
     	
        elinfo.posInRank = currRankPos[elinfo.rank]++;
        elinfo.savePosition();
        this.ranks[elinfo.rank][elinfo.posInRank] = elm;

        var p_ids = elm.parents_ids;//lattice.getSucessors(elm);

        var sort = false;

        var prev = -1;
        for (var i=0; i < p_ids.length; i++) {
          	//var currId = lattice.concept; 
          	
          	var curElinfo = this.getElementInfo(p_ids[i]) 
          	
          	var curr = (p_ids[i] < lattice.concepts.length) ? lattice.getConcept([p_ids[i]]) : this.virtualConcepts[p_ids[i]];
          	//var curElinfo = (typeof curr == "undefined") ? this.getElementInfo(curr) : this.getElementInfo(curr.id);
          
            if (-1 == curElinfo.posInRank) {
                this.calculateInitialNodeOrderByDepthSearch(curr, currRankPos);
            } else if (curElinfo.posInRank < prev) {
                sort = true;
            }
            prev = curElinfo.posInRank;
        }
        if (sort) {
        	//causes an array to be sorted numerically and ascending
            lattice.getSucessors(elm).sort(function(a,b){
            	var pos1 = this.getElementInfo(a.id);
            	var pos2 = this.getElementInfo(b.id);
            	return pos1-pos2;
            });
        }
    };
    
    
    this.performSearch = function() {
        /*
        var bestCrossing = this.calcCrossings();

        var iterNo = 0;
        var lastIterBest = false;

        var iterationsWithoutImprovement = 0;

        while (iterationsWithoutImprovement < 2) {

            lastIterBest = false;

            wmedian(iterNo);
            transpose(iterNo);

            int delta = bestCrossing - calcCrossings();
            if (delta > 0) {
                bestCrossing -= delta;

                saveOrder();

                lastIterBest = true;
                iterationsWithoutImprovement = 0;
            } else {
                iterationsWithoutImprovement++;
            }

            iterNo++;
        }
        if (!lastIterBest) {
            restoreOrder();
        }*/
    };
    
    
    this.calcCrossings = function() {
        var ret = 0;
        for (var i = this.ranks.length; --i >= 0;) {
            var rankCrossing = 0;
            for (var j = this.ranks[i].length; --j >= 0;) {
                var outer = ranks[i][j];
                for (var k = j; --k >= 0;) {
                    rankCrossing += this.crossingSucc(ranks[i][k], outer);
                }
            }
            ret += rankCrossing;
        }
        return ret;
    };
    
    this.crossingSucc = function(first, second) {
        //Assert.isTrue(isSuccessorsOrdered(first), " Successors should be ordered ");
        //Assert.isTrue(isSuccessorsOrdered(second), " Successors should be ordered ");
        return this.calculateEdgeIntersectionsBetweenTwoElements(lattice.getSuccessors(first), lattice.getSuccessors(second));
    };

	/*
    this.calculateEdgeIntersectionsBetweenTwoElements(firstEdges, secondEdges) {
        if (!(firstEdges.hasNext() && secondEdges.hasNext())) {
            return 0;
        }
        int ret = 0;
        outer:
        {
            LatticeElement firstElement = firstEdges.nextConcept();
            LatticeElement secondElement = secondEdges.nextConcept();
            boolean secEdgeIsLast = false;
            for (; ;) {
                //processing first edges, that doesn't intersects
                int prevEdgeCross = ret;
                while (getElementInfo(firstElement).posInRank <= getElementInfo(secondElement).posInRank || secEdgeIsLast)
                {
                    if (!firstEdges.hasNext()) {
                        break outer;
                    }
                    firstElement = firstEdges.nextConcept();
                    ret += prevEdgeCross;         //next edge has all crossings, that a previous one
                }
                
                //Assert.isTrue(getElementInfo(firstElement).posInRank > getElementInfo(secondElement).posInRank, "Position should be greater");

                int edgeOwnCrossing = 0;
                noMoreSecEdges:
                {
                    while (getElementInfo(firstElement).posInRank > getElementInfo(secondElement).posInRank) {
                        ++edgeOwnCrossing;
                        if (!secondEdges.hasNext()) {
                            secEdgeIsLast = true;
                            break noMoreSecEdges;
                        }
                        secondElement = secondEdges.nextConcept();
                    }
                }//noMoreSecEdges
                ret += edgeOwnCrossing;
                if (!firstEdges.hasNext()) {
                    break outer;
                }
            }//for(;;)
        }//outer
        return ret;
    };
    */
    
	
	
};
