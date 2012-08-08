
/*
 * Initial parameters
 */

 
var numberSelected = 0;


/*
 * Init Lattice
 */

var context;
var lattice;
//var lattice_id;

var a_rules_concerned_attributes;
var _data_a_rules_concerned_attributes;

function loadData(data){
	
	context = new Context(data.context.objects, data.context.attributes, data.context.rel, data.attributes) //TODO refactor
	lattice = new Lattice(data);
	
	a_rules_concerned_attributes=clone(data.attributes);
	_data_a_rules_concerned_attributes=clone(data.attributes);
	
	
	// load autosuggest for attributes
	$("input.search").tokenInput(getAttributeValuesPairs(),{
              propertyToSearch: "name",
              preventDuplicates: false,
              hintText:"Type an attribute name",
              theme: "facebook",
              onAdd: selectionAdded,
              onDelete: selectionAdded
              });
	
	
	
	hoverbox = d3.select("#hoverbox");
	A_rules_box = d3.select("#A_rules_box");
	
	checkLatticeConstraints();
	
	// Labels TODO colocar uma funcao no label que ja pega a intersecao com os parents?
	labelizeData();
	
	//initThisLattice();
	//initStaticLattice();
    initLattice();
    
    
    // lists
    updateEntityList();
    
    // Facets
   // createFacets();
	
	// Filters
	loadFilters();
	
	// Dashboard
	loadDashboard();
	
	$('a.lattice-json-link').attr("href", "/api/v1/lattice/?id="+lattice_id);
	$('a.ar-json-link').attr("href", "/api/v1/association_rules/?lattice_id="+lattice_id);
	
	$('text[text-anchor="end"]').remove();
	
}


function Lattice(data) {
	
	//lattice_id = data.id;
	// copy of initial parameters.. mainly used for reset
	// _data_nodes = lattice.concepts.slice(0);
	// _data_links = lattice.edges.slice(0);
	// _data_attributes = HashClone(data.attributes); // TODO deep copy??
	//_data_objects = data.objects.slice(0);
	
	this.initialConcepts = data.nodes.slice(0);
	this.initialEdges = data.links.slice(0);
	// _data_nodes = lattice.concepts.slice(0);
	// _data_links = lattice.edges.slice(0);
	
	this.concepts = data.nodes;
	this.edges = data.links
	
	this.id = data.id;
	
	
	
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





function initLattice(){
	
	w = DEFAULT_WIDTH;
	h = DEFAULT_HEIGHT;
	
	force = d3.layout.force()
        .gravity(0.1)
        .distance(100)
        .charge(-320)
        .on("tick", tick)
        .size([w, h]);
        
        
	
	vis = d3.select("#chart").append("svg:svg")
	.attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", "0 0 "+w+" "+h)
    .attr("preserveAspectRatio", "xMidYMid");
	
	
	updateLattice();
}


function updateLattice() {
	   // var nodes = flatten(data),
       // links = d3.layout.tree().links(nodes);
	
	  var nodes = lattice.concepts,
      links = lattice.edges;
	
	
	  // Restart the force layout.
	  force
	      .nodes(nodes)
	      .links(links)
	      .start();
	
	 // Update the links…
	  clink = vis.selectAll("line.link")
	      .data(links);
	
	  // Enter any new links.
	  clink.enter().insert("svg:line", ".node")
	      .attr("class", "link")
	      .attr("x1", function(d) { return d.source.x; })
	      .attr("y1", function(d) { return d.source.y; })
	      .attr("x2", function(d) { return d.target.x; })
	      .attr("y2", function(d) { return d.target.y; })
	      .attr("source_id", function(d) { return d.source.id; })
          .attr("target_id", function(d) { return d.target.id; });
	
	  // Exit any old links.
	  clink.exit().remove();
	
	  // Update the nodes…
	  cnode = vis.selectAll("circle.node")
	      .data(nodes, function(d) { return d.id; });
	
	  // Enter any new nodes.
	  cnode.enter().append("svg:circle")
	      .attr("class", "node")
	      .attr("cx", function(d) { return d.x; })
	      .attr("cy", function(d) { return d.y; })
	      .attr("r", getNodeSize)
	      .attr("intent", function(d) { return d.intent; })
		  .attr("extent", function(d) { return d.extent; })
		  .attr("id", function(d) { return  d.id; })
		  .attr("children", function(d) { return d.children; })
	      .on("click", nodeClick)
		  .on("mouseover", nodeMouseOver)
		  .on("mouseout", nodeMouseOut)
		  .call(force.drag);
	
	  // Exit any old nodes.
	  cnode.exit().remove();
	  
	  
	   // Update the labels…
	  ulabel = vis.selectAll("text.intent")
	      .data(nodes, function(d) { return d.id; });
	
	  // Enter any new labels.
	  ulabel.enter().append("svg:text")
	      .attr("class", "intent")
		  .attr("x", -22)
		  .attr("y", "-1em")
		  .attr("id", function(d){ return "intent_"+d.id})
		  .text(get_upper_label);
	  
	  // Exit any old labels.
	  ulabel.exit().remove();
	  
	  
	   // Update the labels…
	  llabel = vis.selectAll("text.extent")
	      .data(nodes, function(d) { return d.id; });
	
	  // Enter any new labels.
	  llabel.enter().append("svg:text")
		.attr("x", -22)
		.attr("y", "2em")
		.attr("class", "extent")
		.attr("id", function(d){ return "extent_"+d.id})
		.text(get_lower_label); 
	
	  // Exit any old labels.
	  llabel.exit().remove();
	  
}



function tick(e) {
      
  clink.attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });
  
  // first version
  cnode.attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; });
  
  // clabel.attr("cx", function(d) { return d.x; })
      // .attr("cy", function(d) { return d.y; });

   // other version
  // node.attr("transform", function(d) {
    // return "translate(" + d.x + "," + d.y + ")";
  // });
// 
   ulabel.attr("transform", function(d) {
     return "translate(" + d.x + "," + d.y + ")";
   });
  
  llabel.attr("transform", function(d) {
     return "translate(" + d.x + "," + d.y + ")";
   });
   
   var k = .5 * e.alpha;
   cnode.each(function(d) {
   			d.y += ((d.depth) * 100 - d.y) * k;
   });    
   
   
      
}


/*
 * Ends lattice layout drawing
 */



function filterNodes(query){

    // remove links that are connected to descendants
    link.filter(function(d) {
      for (d = d.source; d; d = d.parent) {
        if (d === p) return true;
      }
    }).remove();

    // remove all descendants
    node.filter(function(d) {
      while (d = d.parent) {
        if (d === p) return true;
      }
    }).remove();
}



// clear 'hidden' styles (used e.g. for clear previous selections)
function showNodes() {
	vis.selectAll(".opaque").classed("opaque", false);
}


function hideNodes(nodelist){
	
	//var inverseNodes = ArraySubtract(vis.selectAll("circle"), nodelist);
	
	for (var i=0; i < nodelist.length; i++) {
		var anode = nodelist[i];
		//anode.style("opacity", DEFAULT_OPACITY);
		//anode.style("fill", DEFAULT_FILL_COLOR);
		anode.classed("selected", false);
		anode.classed("opaque", true);
		
		
		getIncomingEdges(anode, function(){
			//d3.select(this).style("opacity", DEFAULT_OPACITY);
			var thisInEdge = d3.select(this);
			thisInEdge.classed("selected",false);
			thisInEdge.classed("opaque",true);
			
		});
		getOutgoingEdges(anode, function(){
			//d3.select(this).style("opacity", DEFAULT_OPACITY);
			//d3.select(this).classed("hidden");
			var thisOutEdge = d3.select(this);
			thisOutEdge.classed("opaque",false);
			thisOutEdge.classed("selected",true);
		});
	}
}

function highlightNodes(nodelist, color) {
	for (var i=0; i < nodelist.length; i++) {
	  var anode = nodelist[i];
		//anode.style("opacity", 1); // TODO preferir trocar classes css
		//anode.style("fill", SELECTED_FILL_COLOR);
		anode.classed("selected", true);
		anode.classed("opaque", false);
		
		
		 getIncomingEdges(anode, function(){
			 //d3.select(this).style("opacity", 1);
			var thisInEdge = d3.select(this);
			thisInEdge.classed("opaque",false);
			thisInEdge.classed("selected",true);
		 });
		 getOutgoingEdges(anode, function(){
			// d3.select(this).style("opacity", 1);
			var thisOutEdge = d3.select(this);
			thisOutEdge.classed("opaque",false);
			thisOutEdge.classed("selected",true);
		 });
	};
}




/*
 * Search
 */





/*
 * Node mouse events 
 */
function visitEdges(node, callback) {
	for (var i=0; i < get.length; i++) {
	  get[i]
	};
}	
	
function nodeMouseOver(d){
	//    $('#node_3').popover({title:"hey", content: "now it works!"});
	//$('#node_3').popover('show');
	
	var thenode = d3.select(this);
	thenode.style("stroke", "red"); 
	
	//getIncomingNodes(thenode);
	
	if (highlightPath) {
		visitEdgesUp(d,function(l) {
			d3.select("line.link[source_id=\""+l.source.id+"\"][target_id=\""+l.target.id+"\"]").classed("highlighted", true);
		});
	}
	
	
	// show hoverbox
	//hoverbox.style("opacity", 0);
	hoverbox.style("display", "block");
	hoverbox.transition()
	  .delay(800)
      .duration(300)
      .style("opacity", 1);
      
    
    hoverbox
      .style("left", (d3.event.pageX + 20) + "px")
      .style("top", (d3.event.pageY - 20) + "px");
      //.select("div.hb_obj_list").text("attributes: "+thenode.attr("intent"));
     
    //var ul = $('ul.hb_attr_list');
	wrapperElementsInList($('ul.hb_attr_list'), d.intent)
	wrapperElementsInList($('ul.hb_obj_list'), d.extent)
	
	
	// Dashboard
	updateDistributionChart(d);
	
}

function nodeMouseOut(){
	if(mouseOverHoverBox) return;
	//while(mouseOverHoverBox){}
	
	// In case they are highlighted
	//var higg = d3.select("line.highlighted");
	d3.selectAll("line.highlighted").classed("highlighted", false);


	//function(){ (mouseOverHoverBox) ?   }
	var thenode = d3.select(this);
	thenode.style("stroke", "white");
	
	setTimeout(function(){
		if(!mouseOverHoverBox){
			// hide hoverbox
			hoverbox.transition()
	  		.duration(200)
	  		//.delay(1800)
      		.style("opacity", 0);
		};
		
	}, 1800);
	
	
    
    //hoverbox.style("display", "none");
}


function nodeClick(){ // select node	
	d3.select(this).classed("selected", function(){ 
		if (this.classList.contains("selected")) {
			numberSelected--;
			return false;
		} else {
			numberSelected++;
			return true
		}
		
	});
	clearSearch(); // if I made a click node to add/remove selection, the search is no longer valid
	updateSelectionList();
	
	$("#sel-count").text("("+numberSelected+")"); // update counter
}


function clearSearch(){ // show hidden nodes/edges from previous search
	$('#search').val('');
	showNodes();
}

function clearSelection(){ // remove selection
	clearSearch();
	vis.selectAll(".selected").classed("selected", false);
	$('#selection_list').empty();
	
}



/*
 *  LABELS
 */ 

function get_upper_label(d){
	if (labeling_type == LABEL_REPETITIVE) return d.intent; // repetitive
	else if (labeling_type == LABEL_MULTILABEL) return d.upperLabel; // multilabel
	else if (labeling_type == LABEL_SUPPORT) return ''; // support
	else return "upper"
}
function get_lower_label(d){
	if (labeling_type == LABEL_REPETITIVE) return d.extent;
	else if (labeling_type == LABEL_MULTILABEL) return d.lowerLabel; // multilabel
	else if (labeling_type == LABEL_SUPPORT) return Math.round(100*d.support) + "% (" + Math.round(context.objects.length*d.support) + ")" ;// multilabel
	else return "lower"
}

function changeLabel(type){
	labeling_type = type;
	labelizeData();
	
	vis.selectAll("text.intent")
        .text(get_upper_label); 
    vis.selectAll("text.extent")
        .text(get_lower_label); 
}


function labelize(){ // TODO work on data not on layout
	
	var labeling_type = 2;

	var top_concept =vis.select('circle[id="'+ lattice.topConcept.id +'"]');
	var nodelist = getOutgoingNodes(top_concept);
	
	// intent labels
	for (var i=0; i < nodelist.length; i++) {
		var cur = nodelist[i];
		var curIntent = cur.attr("intent").split(',');
		
		var parentlist = getIncomingNodes(cur);
		for (var j=0; j < parentlist.length && curIntent.length > 0; j++) {
		  var parentIntent = parentlist[j].attr("intent").split(',');
		  
		     curIntent = ArraySubtract(curIntent,parentIntent);
		};
		
		
		vis.select('text[id="intent_'+cur.attr("id")+'"]').text(curIntent.join(", ")); 
		
		//nodelist.addAll(getOutgoingNodes(cur));
		ArrayAddAll(getOutgoingNodes(cur), nodelist);
	}
	

	// objects: bottom up
	var bottom_concept = vis.select('circle[id="'+ lattice.bottomConcept.id +'"]');
	nodelist = getIncomingNodes(bottom_concept);
	
	// extent labels
	for (var i=0; i < nodelist.length; i++) {
		var cur = nodelist[i];
		var curExtent = cur.attr("extent").split(',');
		
		var childlist = getOutgoingNodes(cur);
		for (var j=0; j < childlist.length && curExtent.length > 0; j++) {
		  var childExtent = childlist[j].attr("extent").split(',');
		  
		     curExtent = ArraySubtract(curExtent,childExtent);
		};
		
		vis.select('text[id="extent_'+cur.attr("id")+'"]').text(curExtent.join(", ")); 
		
		//nodelist.addAll(getIncomingNodes(cur));
		ArrayAddAll(getIncomingNodes(cur), nodelist);
	}
	
}

/*
 * Check 
 */

function checkLatticeConstraints(){
	
	// check labels
	if (context.attributes > MAX_ENTITY_SIZE || context.objects > MAX_ENTITY_SIZE) {
		if (confirm("Labeling concepts in this lattice may be overwhelming, do you want to label them by percentage?"))
		labeling_type = LABEL_SUPPORT;
	}
}

function labelizeData(){ 
	
	if (labeling_type != LABEL_MULTILABEL) return; // not multi label
	
	//var top_concept = vis.select('circle[id="'+ data.top_id +'"]');
	var nodelist = getTopMostConcepts();
	
	// intent labels
	for (var i=0; i < nodelist.length; i++) {
		var cur = nodelist[i];
		
		var parentlist = getParentsData(cur);
		
		var curIntent = cur.intent;
		
		for (var j=0; j < parentlist.length && curIntent.length > 0; j++) {
		  var parentIntent = parentlist[j].intent;
		  
		     curIntent = ArraySubtract(curIntent,parentIntent);
		};
		
		var intLabel = curIntent.join(", ");
		//vis.select('text[id="intent_'+cur.id+'"]').text(intLabel); 
		cur.name = intLabel;
		cur.upperLabel = intLabel;
		
		
		//nodelist.addAll(getChildrenData(cur));
		ArrayAddAll(getChildrenData(cur), nodelist);
		
	}
	
	
	// extent labels
	nodelist = getBottomMostConcepts();
	
	for (var i=0; i < nodelist.length; i++) {
		var cur = nodelist[i];
		
		var childrenList = getChildrenData(cur);
		
		var curExtent = cur.extent;
		
		for (var j=0; j < childrenList.length && curExtent.length > 0; j++) {
		  var childExtent = childrenList[j].extent;
		  
		     curExtent = ArraySubtract(curExtent,childExtent);
		};
		
		var extLabel = curExtent.join(", ");
	//	vis.select('text[id="extent_'+cur.id+'"]').text(extLabel); 
		cur.lowerLabel = extLabel;
		//nodelist.addAll(getParentsData(cur));
		ArrayAddAll(getParentsData(cur), nodelist);
	}
	
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


function labelize2(){ // TODO work on data not on layout
	


	//var top_concept = vis.select('circle[id="'+ data.top_id +'"]');
	var nodelist = getTopMostConcepts();
	
	// intent labels
	for (var i=0; i < nodelist.length; i++) {
		var cur = nodelist[i];
		
		var parentlist = getParentsData(cur);
		
		var curIntent = cur.intent;
		
		for (var j=0; j < parentlist.length && curIntent.length > 0; j++) {
		  var parentIntent = parentlist[j].intent;
		  
		     curIntent = ArraySubtract(curIntent,parentIntent);
		};
		
		var intLabel = curIntent.join(", ");
		vis.select('text[id="intent_'+cur.id+'"]').text(intLabel); 
		cur.name = intLabel;
		
		
		//nodelist.addAll(getChildrenData(cur));
		ArrayAddAll(getChildrenData(cur), nodelist);
		
	}
	
	
	// extent labels
	nodelist = getBottomMostConcepts();
	
	for (var i=0; i < nodelist.length; i++) {
		var cur = nodelist[i];
		
		var childrenList = getChildrenData(cur);
		
		var curExtent = cur.extent;
		
		for (var j=0; j < childrenList.length && curExtent.length > 0; j++) {
		  var childExtent = childrenList[j].extent;
		  
		     curExtent = ArraySubtract(curExtent,childExtent);
		};
		
		var extLabel = curExtent.join(", ");
		vis.select('text[id="extent_'+cur.id+'"]').text(extLabel); 
		
		//nodelist.addAll(getParentsData(cur));
		ArrayAddAll(getParentsData(cur), nodelist);
	}
	

}


function labelizeThis(col, isTree){ 
	
	//var top_concept = vis.select('circle[id="'+ data.top_id +'"]');
	var nodelist;
	
	if (isTree) {
		nodelist = flatten(col);
	}
	else {
		nodelist = getTopMostConcepts(col);
	}
	
	// intent labels
	for (var i=0; i < nodelist.length; i++) {
		var cur = nodelist[i];
		
		var parentlist = getParentsData(cur);
		
		var curIntent = cur.intent;
		
		for (var j=0; j < parentlist.length && curIntent.length > 0; j++) {
		  var parentIntent = parentlist[j].intent;
		  
		     curIntent = ArraySubtract(curIntent,parentIntent);
		};
		
		var intLabel = curIntent.join(", ");
		//vis.select('text[id="intent_'+cur.id+'"]').text(intLabel); 
		cur.name = intLabel;
		
		
		ArrayAddAll(getChildrenData(cur), nodelist);
		
	}
	
	
	// extent labels
	nodelist = getBottomMostConcepts();
	
	for (var i=0; i < nodelist.length; i++) {
		var cur = nodelist[i];
		
		var childrenList = getChildrenData(cur);
		
		var curExtent = cur.extent;
		
		for (var j=0; j < childrenList.length && curExtent.length > 0; j++) {
		  var childExtent = childrenList[j].extent;
		  
		     curExtent = ArraySubtract(curExtent,childExtent);
		};
		
		var extLabel = curExtent.join(", ");
		//vis.select('text[id="extent_'+cur.id+'"]').text(extLabel); 
		
		ArrayAddAll(getParentsData(cur), nodelist);
	}
	

}


/*
 * Hover box
 */

function wrapperElementsInList(ul,array){
	
	ul.empty();
	//var ul = $('<ul>').appendTo('body');
	$(array).each(function(index, item) {
	    ul.append(
	        $(document.createElement('li')).text(item)
	    );
	});
}

/*
 * Utils
 */
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


function getIncomingEdges(n, eachCallback){
	var inEdges = [];
	inEdges = vis.selectAll('line[target_id="'+ n.attr("id") +'"]');
	if (typeof(eachCallback)!='undefined') {
		inEdges.each(eachCallback);
	}
	return inEdges;
}

function getOutgoingEdges(n, eachCallback){
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

function getParentsData(nd){
	var parents = [];
	for (var i=0; i < lattice.concepts.length; i++) {
	  if(nd.parents_ids.indexOf(lattice.concepts[i].id) >= 0){
	  	parents.push(lattice.concepts[i]);
	  }
	};
	return parents;
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


