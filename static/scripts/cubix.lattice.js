
/*
 * Initial parameters
 */

 
/*
 * Init Lattice
 */

var context;
var lattice;

var a_rules_concerned_attributes;
var _data_a_rules_concerned_attributes;

function loadData(data, reload){
	
	context = new Context(data.context.objects, data.context.attributes, data.context.rel, data.attributes, data.context.filtered_attributes); //TODO refactor
	lattice = new Lattice(data);
	
	a_rules_concerned_attributes=clone(data.attributes);
	_data_a_rules_concerned_attributes=clone(data.attributes);
	
	
	if (typeof n_concepts != 'undefined') {
		var reduction = 1-(lattice.edges.length/n_links);
		
		// Tree buttom
		 $('#tree-opts').popover({
			title: 'Tree stats',
			placement: "bottom",
			html: true,
			trigger: "hover",
			content: 'Concepts (source): '+n_concepts+' <br/> Links (source): '+n_links+
			' <br/><br/> Concepts (tree): '+lattice.concepts.length+ ' <br/> Links (tree): '+lattice.edges.length+
			 '<br/><br/> Reduction: '+ Math.round(reduction*100)/100+ '%',
		});
	}
	
	if (!reload) {
		// load autosuggest for attributes
		$("input.search").tokenInput(getAttributeValuesPairs(),{
	              propertyToSearch: "name",
	              preventDuplicates: false,
	              hintText:"Type an attribute name",
	              theme: "facebook",
	              onAdd: searchInput,
	              onDelete: searchInput
	              });
	    
	    // load clustering slider
	    $( "#slider-clustering" ).slider({
				min: 1,
				max: lattice.concepts.length,
				value: [ lattice.concepts.length ],
				slide: function( event, ui ) {
					$( "#n_clusters" ).val( ui.value);
					
				}
			});
		$( "#n_clusters" ).val( lattice.concepts.length);
		
		
		if (typeof lattice.original_id != "undefined") { 
			$("#tree-opts").show(); 
			$("a.undo-link").show();
		}
		
		
		hoverbox = d3.select("#hoverbox");
		A_rules_box = d3.select("#A_rules_box");
		
		// load extensions
		loadExtensions();
	
	
	} // end of !reload block
	
	//labelizeFirst();
	
	//checkLatticeConstraints();
	
    
    //displayAttrLabel = $("input[name='label-for-attr']").is(':checked');
	//displayObjLabel = $("input[name='label-for-attr']").is(':checked');
    labelizeData();

    
    // lists
    updateEntityList();
    
    // Facets
   // createFacets();
	
	// Filters
	loadFilters();
	
	// Dashboard
	loadDashboard();
	
	// $('a.lattice-json-link').attr("href", "/api/v1/lattice/?id="+lattice_id);
	// $('a.ar-json-link').attr("href", "/api/v1/association_rules/?lattice_id="+lattice_id);
	
	$('text[text-anchor="end"]').remove();
	
	// Attribute lattices
    if (data.attribute_lattices)
    	loadAttributeLattices(JSON.parse(data.attribute_lattices));
    
    // Attribute graph
    if (lattice.attr_graph)
    	loadAttributeGraph(lattice.attr_graph);
    	
    	
   
   lattice.tree = lattice.getTree(); // refactor Design
    
    // update visualisation
    updateVis();
    
    
	
}


// function reloadData(data){
// 	
	// context = new Context(data.context.objects, data.context.attributes, data.context.rel, data.attributes, data.context.filtered_attributes);
	// lattice = new Lattice(data);
// 	
// }




function Lattice(data) {
	
	
	this.initialConcepts = data.nodes.slice(0);
	this.initialEdges = data.links.slice(0);
	
	this.attr_graph = JSON.parse(data.attribute_graph);
	
	this.concepts = data.nodes;
	this.edges = data.links;
	
	this.id = data.id;
	
	this.context_id = data.context_id;
	
	this.original_id = data.original_id;
	
	this.tree = null;	
	
	this.getConcept = function(tid){
		for (var i=0; i < this.concepts.length; i++) {
		  if (this.concepts[i].id == tid) 
		  	return this.concepts[i];
		};
	};
	this.getConceptById = function(tid){
		for (var i=0; i < this.concepts.length; i++) {
		  if (this.concepts[i].id == tid) 
		  	return this.concepts[i];
		};
	};
	
	this.getEdge = function(concept1, concept2){
		for (var i=0; i < this.edges.length; i++) {
		  if ((this.edges[i].source.id == concept1.id && this.edges[i].target.id == concept2.id) ||
		    (this.edges[i].target.id == concept1.id && this.edges[i].source.id == concept2.id)) 
		  	return this.edges[i];
		};
	};
	
	this.topConcept = this.getConcept(data.top_id);
	this.bottomConcept = this.getConcept(data.bottom_id);
	
	
	 this.isEmpty = function () {
	 	return false;
	 };
	 
	 this.conceptsCount = function(){
	 	return concepts.length;
	 };
	 
	 this.resetLattice = function(){
	 	concepts = initialConcepts.slice(0);
	 	edges = initialEdges.slice(0);
	 };
	 
	 /*
	  * Concept operations // TODO ordem invertida!
	  */
	 this.getPredecessors = function(n){ // get predecessors for a node
	 	var ret = new Array();
	 	for (var i=0; i < n.children_ids.length; i++) {
		   ret.push(this.concepts[n.children_ids[i]]);
		 };
	 	return ret;
	 };
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
	 };
	 
	 this.getSuccessorsEdges = function(n){ // get edges for that node
	 	var ret = new Array();
	 	for (var i=0; i < this.edges.length; i++) {
		   if (this.edges[i].source.id == n.id)
		   		ret.push(this.edges[i]);
		 };
	 	return ret;
	 };
	 this.getPredecessorsEdges = function(n){ // get edges for that node
	 	var ret = new Array();
	 	for (var i=0; i < this.edges.length; i++) {
		   if (this.edges[i].target.id == n.id)
		   		ret.push(this.edges[i]);
		 };
	 	return ret;
	 };
	 
	 
	 this.removeConcept = function(concept){
	 	for (var idx=0; idx < lattice.concepts.length; idx++) {
		   var curCpt = lattice.concepts[idx];
		   if (curCpt.id == concept.id) { // found
		   	
			   	lattice.concepts.splice(idx,1); // remove concept
		 		
		 		// remove links to the concept
		 		for (var i=0; i < lattice.edges.length; i++) { 
				   var curEdge = lattice.edges[i];
				   if (curEdge.target.id == concept.id || curEdge.source.id == concept.id ) { 
				   		lattice.edges.splice(i,1);
				   		i = i -1;
				   	}
				   		//edgesMarkedForRemoval.push(i);
				 };
				 
				 // for (var j=0; j < edgesMarkedForRemoval.length; j++) {
				  	// lattice.edges.splice(edgesMarkedForRemoval[j],1); // BUG
				 // };
		   	
		   	return;
		   }
	 	}
	 };
	 
	 this.existsEdge = function(source_id, target_id) {
	 	for (var i=0; i < lattice.edges.length; i++) {
		   if (lattice.edges[i].source.id == source_id && lattice.edges[i].target.id == target_id) return true;
		 };
		return false;
	 };
	 
	 this.readConcept = function(concept){
	 	var curCpt = lattice.getConceptById(concept.id);
	 	if (typeof curCpt == 'undefined') {
	 		lattice.concepts.push(concept);
	 		// readd links
	 		for (var i=0; i < lattice.initialEdges.length; i++) { 
				   var curEdge = lattice.initialEdges[i];
				   if (curEdge.target.id == concept.id && !lattice.existsEdge(curEdge.source.id,curEdge.target.id)) {
				   		 lattice.edges.push(curEdge);
				   } else if (curEdge.source.id == concept.id && !lattice.existsEdge(curEdge.source.id,curEdge.target.id)) {
				   		 lattice.edges.push(curEdge);
				   }
			};
	 		
	 	} // else it was already there
	 };
	 
	 
	 
	 /**
	  * Cluster
	  */
	 
	 /**
	  * Tree transform
	  */
	 this.treeCache =  new Array();
	 this.getTree = function() {
		var top = getTopMostConcepts()[0];
		
		function copyNode(node) {
			var treeNode = new Object();
			treeNode.id = node.id;
			treeNode.name = node.intent.join(", ");
			//node.name;
			treeNode.intentLabel = node.intentLabel;
			treeNode.extentLabel = node.extentLabel;
			treeNode.support = node.support;
			treeNode.intent = node.intent;
			treeNode.extent = node.extent;
			treeNode.depth = 0;//node.depth;
			//treeNode.children_ids = node.children_ids;
			//treeNode.title = node.name;
			treeNode.children = [];
			treeNode.parent = null;
			
			if (lattice.treeCache.indexOf(treeNode)<0)
					lattice.treeCache.push(treeNode); // cache
			
			return treeNode;
		};
	
		function recurse(node) {
			if(node.children_ids.length == 0)
				return null;
			
			var treeNode = copyNode(node);
	
			var children = getChildrenData(node);
			//getChildrenDataNodes(node.children_ids)
	
			for(var i = 0; i < children.length; i++) {
	
				if(children[i].children_ids.length > 0) {
					var chNode = recurse(children[i]);
				} else { 
					var chNode = copyNode(children[i]);
				}
				chNode.depth = treeNode.depth + 1; // update depths for tree
				//chNode.id = node.id + "-" + chNode.id; // current node id = node_id-parent_id to avoid duplicates
				treeNode.children.push(chNode);
				treeNode.parent = node;
				
			};
	
			return treeNode;

		};
	
		var topNode = recurse(top);
		return topNode;
	};
	
	
	 
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
   };
}



/*
 * Check 
 */

function checkLatticeConstraints(){
	
	if (typeof lattice.original_id != 'undefined') { // it was already transformed in tree, display the viusalisation
    		changeVis("sunburst");
    		return;
    }
	//else
	
	if (OVERWHELMING && (context.attributes.length > MAX_ENTITY_SIZE || context.objects.length > MAX_ENTITY_SIZE)) {
		
		if (confirm("Labeling concepts in this lattice may be overwhelming, do you want to switch to a suitable tree visualisation?")) {
			$('#modal-tree-transform').modal({ // option to transform tree
					keyboard: true,
					show: true,
			});
			return;
		} else {
			setOverwhelmingOff(); // disable the message to not annoy the user every time
		}
		
	}
	
	$('#select-vis').val(PREF_VIS);
	changeVis(PREF_VIS);
		
}




function getTopMostConcepts(collection){
	
	if (!collection) collection = lattice.concepts;
	
	var ret = [];
	
	var minDepth = Number.MAX_VALUE;
	
	for (var i=0; i < collection.length; i++) { 
	  var cur = collection[i];
	  
	  if(cur.depth == 0){ //top possible
	  	ret.push(cur);
	  	return ret;
	  }
	  
	  if (cur.depth < minDepth) {
	  	ret.length = 0;
	  	ret.push(cur);
	  	minDepth = cur.depth;
	  } else if (cur.depth == minDepth){
	  	ret.push(cur);
	  }
	  
	};
	
	return ret;
}

function getBottomMostConcepts(){
	var ret = [];
	
	var maxDepth = Number.MIN_VALUE;
	
	for (var i=0; i < lattice.concepts.length; i++) { 
	  var cur = lattice.concepts[i];
	  
	  
	  if (cur.depth > maxDepth) {
	  	ret.length = 0;
	  	ret.push(cur);
	  	maxDepth = cur.depth;
	  } else if (cur.depth == maxDepth){
	  	ret.push(cur);
	  }
	  
	};
	
	return ret;
}


/*
 * Utils
 */

function visitEdges(node, callback) {
	for (var i=0; i < get.length; i++) {
	  get[i]
	};
}	
	

function visitEdgesUp(n, mycallback) {
	var inEdges = getIncomingEdgesData(n);
// 	
	// inEdges.each(function(e){
		// mycallback(e);
	    // visitUp(e,mycallback);
	// });
	
	for (var i=0; i < inEdges.length; i++) {
	  mycallback(inEdges[i]);
	  visitEdgesUp(inEdges[i].source,mycallback);
	};
	
}

function visitEdgesDown(n, mycallback) {
	var outEdges = getOutgoingEdgesData(n);
	
	for (var i=0; i < outEdges.length; i++) {
	  mycallback(outEdges[i]);
	  visitEdgesDown(outEdges[i].target,mycallback);
	};
	
}



function getIncomingEdgesData(n, eachCallback){
	var inEdges = [];
	
	for (var i=0; i <lattice.edges.length; i++) {
	  var curLink = lattice.edges[i]; 
	  if (curLink.target.id == n.id) { 
	  	inEdges.push(curLink)
	  	if (typeof(eachCallback)!='undefined') eachCallback(curLink);
	  };
	};
	
	return inEdges;
}
function getOutgoingEdgesData(n, eachCallback){
	var outEdges = [];
	
	for (var i=0; i <lattice.edges.length; i++) {
	  var curLink = lattice.edges[i]; 
	  if (curLink.source.id == n.id) { 
	  	outEdges.push(curLink)
	  	if (typeof(eachCallback)!='undefined') eachCallback(curLink);
	  };
	};
	
	return outEdges;
}




function getIncomingEdges(n, eachCallback){
	alert("avoid it. cubix.lattice.js line 668");
	var inEdges = [];
	inEdges = vis.selectAll('line[target_id="'+ n.attr("id") +'"]');
	if (typeof(eachCallback)!='undefined') {
		inEdges.each(eachCallback);
	}
	return inEdges;
}

function getOutgoingEdges(n, eachCallback){
	alert("avoid it. cubix.lattice.js line 678");
	var outEdges = [];
	outEdges = vis.selectAll('line[source_id="'+ n.attr("id") +'"]');
	if (typeof(eachCallback)!='undefined') {
		outEdges.each(eachCallback);
	}
	return outEdges;
}

function getIncomingNodes(n){
	var inNodes = [];
	vis.selectAll('line[target_id="'+ n.attr("id") +'"]').each(function() {
		var thecircle = vis.select('circle[id="'+d3.select(this).attr("source_id")+'"]');
		if (inNodes.indexOf(thecircle) < 0) {
			inNodes.push(thecircle);
		}
	});
	return inNodes;
}

function getOutgoingNodes(n){
	var inNodes = [];
	vis.selectAll('line[source_id="'+ n.attr("id") +'"]').each(function() {
		var thecircle = vis.select('circle[id="'+d3.select(this).attr("target_id")+'"]');
		if (inNodes.indexOf(thecircle) < 0) {
			inNodes.push(thecircle);
		}
	});
	return inNodes;
}
///

// // TODO 
// function getTreeParentData(nd){
// 	
		// var parent = null;
// 		
		// var queue = [nd];
		// for (var i=0; i < queue.length; i++) {
		  // var current = queue[i];
		  // if (parent != null) current.intentLabel = ArraySubtract(current.intent,parent.intent);
		  // else current.intentLabel = current.intent;
		// };
// 		
		// // var parent = [];
		// // for (var i=0; i < lattice.tree.length; i++) {
		  // // if(nd.parents_ids.indexOf(lattice.concepts[i].id) >= 0){
		  	// // parents.push(lattice.concepts[i]);
		  	// // break;
		  // // }
		// // };
		// // return parents;
// 	
	// // TODO uncomment if using tree transformation
		// // for (var i=0; i < lattice.treeCache.length; i++) {
			// // var children = lattice.treeCache[i].children;
// // 			
			// // if (children == null) continue;
// // 		  	
		  	// // for (var j=0; j < children.length; j++) {
		  		// // if (children[j].id == nd.id) return [lattice.treeCache[i]] 
		  	// // }
// // 		  	
		// // };
		// // return [];
// }

function getParentsData(nd){
		var parents = [];
		for (var i=0; i < lattice.concepts.length; i++) {
		  if(nd.parents_ids.indexOf(lattice.concepts[i].id) >= 0){
		  	parents.push(lattice.concepts[i]);
		  }
		};
		return parents;
}
function getTreeChildrenData(nd){
		for (var i=0; i < lattice.treeCache.length; i++) {
		  	if (lattice.treeCache[i].id == nd.id) return lattice.treeCache[i].children;
		};
		return [];
}
	
function getChildrenData(nd){
		var children = [];
		for (var i=0; i < lattice.concepts.length; i++) {
		  if(nd.children_ids.indexOf(lattice.concepts[i].id) >= 0){
		  	children.push(lattice.concepts[i]);
		  }
		};
		return children;
}

function areNeighbor(n1, n2){
	  if((n1.parents_ids.indexOf(n2.id) >= 0 || n1.children_ids.indexOf(n2.id) >= 0) && 
	  (lattice.concepts.indexOf(n1) >= 0 &&  lattice.concepts.indexOf(n2) >= 0 )){  // assures that they are visible (not filtered)
	   return true;
	  }
	return false;
}

function hasChild(n1, n2){
	  if((n1.children_ids.indexOf(n2.id) >= 0) && 
	  (lattice.concepts.indexOf(n1) >= 0 &&  lattice.concepts.indexOf(n2) >= 0 )){  // assures that they are visible (not filtered)
	   return true;
	  }
	return false;
}

/*
 * Tree lattice
 */

isParentOf = function(p, c) {
	  if (p === c) return true;
	  if (p.children) {
	    return p.children.some(function(d) {
	      return isParentOf(d, c);
	    });
	  }
	  return false;
	}

