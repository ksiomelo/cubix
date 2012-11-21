

/*
 * Drawing options
 */

function disableDrawingOptionsForAR(disable){
	$("#select-color").prop("disabled", disable);
	$("#select-edge").prop("disabled", disable);
	$("#select-size").prop("disabled", disable);
	$("#select-label").prop("disabled", disable);
}


// Edges
var edge_type = "default";

function getEdgeThickness(e){
	if (edge_type == 'default') return DEFAULT_EDGE_THICKNESS;
	else { 
		var metricValue = metrics.getLinkScore(e.source.id, e.target.id, edge_type)
		return Math.round(metricValue*(EDGE_MAX_THICK-EDGE_MIN_THICK)) + EDGE_MIN_THICK;
	}
}

function changeEdgeThickness(type){
	edge_type = type;
	
	if (noLinks.indexOf(type) >= 0) return; // TODO show error msg?
	else updateVis();
}




/*
 * Node drawing options
 * */
var color_type = "default";


function changeNodeSize(type){
	size_type = type;
	
	updateVis(); 	// this is necessary because some layout
					// strategies rely on the size of the node
	
}

function getNodeSize(d){ 
	
	if (size_type == 'default') return DEFAULT_NODE_RADIUS;
	else { 
		var metricValue = metrics.getScore(d.id,size_type)
		return Math.round(metricValue*(NODE_MAX_SIZE-NODE_MIN_SIZE)) + NODE_MIN_SIZE;
		}
	
}


function changeNodeColor(type){
	color_type = type;
	
	vis.selectAll(".concept").style("fill", function(d) { // TODO
			return getNodeColor(d);
	});
	
	// size_type = type;
	// if (currentVis=='treemap') {
		// console.log("changin");
		// tm_updateTree(getTree0);
	// }
	// else { 
		// vis.selectAll("circle").attr("r", function(d) { // TODO
			// return getNodeSize(d);
		// });
	// }
}

function getNodeColor(d) {
	if (color_type == 'ids') return mapColor(d.id);
	else return DEFAULT_FILL_COLOR;
}



/*
 * Colors
 */

/*
 * Map a string to a color (used to color nodes based on their id)
 */
function mapColor(str) {
		
		var hash = 0;
	    for (var i = 0; i < str.length; i++) {
	       hash = str.charCodeAt(i)+ ((hash << 20) - hash);
	    }
	    
	    // hash_str = 
	    // for (var i = 0; i < str.length; i++) {
	       // hash = str.charCodeAt(i) + ((hash << 5) - hash);
	    // }
	
		// var colorstr = ((hash>>16)&0xFF).toString(16) + 
	           // ((hash>>8)&0xFF).toString(16) + 
	           // (hash&0xFF).toString(16);
	// 
		// return "#"+colorstr;
		
		var colorss= ["#3182bd","#6baed6","#9ecae1","#c6dbef","#e6550d","#fd8d3c","#fdae6b","#fdd0a2","#31a354","#74c476","#a1d99b","#c7e9c0","#756bb1","#9e9ac8","#bcbddc","#dadaeb","#636363","#969696","#bdbdbd","#d9d9d9"];
		//var colorss=["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22"];
		
		var pos = (Math.abs(hash)%(colorss.length));
		
		return  colorss[pos]; 
		
}

/*
 * LABELS
 */
var displayAttrLabel, displayObjLabel = true;
	
function get_upper_label(d){
	
	if (!displayAttrLabel) return '';
	
	if (labeling_type == LABEL_REPETITIVE) return d.intent; // repetitive
	else if (labeling_type == LABEL_MULTILABEL) return d.upperLabel; // multilabel
	else return d.upperLabel;
}
function get_lower_label(d){
	
	if (!displayObjLabel) return '';
	
	if (labeling_type == LABEL_REPETITIVE) return d.extent;
	else if (labeling_type == LABEL_MULTILABEL) return d.lowerLabel; // multilabel
	else {  // metric
		
		var metricValue = metrics.getScore(d.id,labeling_type)
		
		if (labeling_type == "esupport") // slightly different label for support
			return Math.round(100*metricValue) + "% (" + Math.round(context.objects.length*metricValue) + ")" ;
		else
			return Math.round(100*metricValue) + "%";
	}
}

function changeLabel(type){
	labeling_type = type;
	
	if (labeling_type == LABEL_REPETITIVE || labeling_type == LABEL_MULTILABEL) labelizeData();
	
	updateVis();
}




function labelize(){ // TODO work on data not on layout
	alert("active");
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


function labelizeFirst(){ 
	
	//if (labeling_type != LABEL_MULTILABEL) return; // not multi label
	
	//var top_concept = vis.select('circle[id="'+ data.top_id +'"]');
	var nodelist = getTopMostConcepts();
	
	// intent labels
	for (var i=0; i < nodelist.length; i++) {
		var cur = nodelist[i];
		
		var parentlist =  getParentsData(cur);
		
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
		var childrenList = getChildrenData(cur);
		
		ArrayAddAll(childrenList, nodelist);
		
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

function labelizeData(){ 
	
	//if (labeling_type != LABEL_MULTILABEL) return; // not multi label
	
	//var top_concept = vis.select('circle[id="'+ data.top_id +'"]');
	var nodelist = getTopMostConcepts();
	
	// intent labels
	for (var i=0; i < nodelist.length; i++) {
		var cur = nodelist[i];
		
		var parentlist = ((typeof lattice.original_id != 'undefined') ? getTreeParentsData(cur) : getParentsData(cur));
		
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
		var childrenList = ((typeof lattice.original_id != 'undefined') ? getTreeChildrenData(cur) : getChildrenData(cur));
		
		ArrayAddAll(childrenList, nodelist);
		
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
	
	//updateVis();
	
}
