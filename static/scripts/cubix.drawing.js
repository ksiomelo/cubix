

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

function getEdgeValue(e){
	if (edge_type == 'default') return -1;
	else { 
		var metricValue = metrics.getLinkScore(e.source.id, e.target.id, edge_type)
		return Math.round(metricValue*100)/100;
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

var p=d3.scale.category10();
function getNodeColor(d) {
	if (color_type == 'ids') return mapColor(d.id);
	else if (color_type == 'cluster') {
		
		
		//p.domain();
		
		var metricValue = metrics.getScore(d.id,color_type);
		//console.log(metricValue + "-" + p(metricValue));
		
		return(p(metricValue));
		
		//return d3.scale.category20c()(metricValue*13);
		//return mapColor(""+metricValue*13);
	}
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

// Returns an ARRAY of strings containing the labels for this node according to the labeling strategy
function getUpperLabel(d){
	
	if (!displayAttrLabel) return '';
	
	if (labeling_type == LABEL_REPETITIVE) return d.intent; // repetitive
	else if (labeling_type == LABEL_MULTILABEL) return d.intentLabel; // multilabel
	else return d.intentLabel;
}
function getLowerLabel(d){
	
	if (!displayObjLabel) return '';
	
	if (labeling_type == LABEL_REPETITIVE) return d.extent;
	else if (labeling_type == LABEL_MULTILABEL) return d.extentLabel; // multilabel
	else {  // metric
		
		var metricValue = metrics.getScore(d.id,labeling_type);
		
		if (labeling_type == "esupport") // slightly different label for support
			return [Math.round(100*metricValue) + "% (" + Math.round(context.objects.length*metricValue) + ")"] ;
		else
			return [Math.round(100*metricValue) + "%"];
	}
}

function changeLabel(type){
	labeling_type = type;
	
	updateVis();
}

function changeLabelSize(type){
	
	var size = 14; // default
	size = (type == 'small') ? 10 : ((type == 'large') ? 18 : 14);
	
	vis.selectAll('text.nlabel').style("font-size", size);
}



// Algorithm to assign multi-labels to lattice and tree
function labelizeData(){ 
	
	//var top_concept = vis.select('circle[id="'+ data.top_id +'"]');
	var nodelist = getTopMostConcepts();
	
	// intent labels
	for (var i=0; i < nodelist.length; i++) {
		var cur = nodelist[i];
		
		var parentlist = /*(treeVis) ? getTreeParentData(cur) :*/ getParentsData(cur);
		
		var curIntent = cur.intent;
		
		for (var j=0; j < parentlist.length && curIntent.length > 0; j++) {
		  	var parentIntent = parentlist[j].intent;
		  
		     curIntent = ArraySubtract(curIntent,parentIntent);
		};
		
		var intLabel = curIntent.join(", ");
		//vis.select('text[id="intent_'+cur.id+'"]').text(intLabel); 
		//cur.name = intLabel;
		//cur.upperLabel = intLabel;
		cur.intentLabel = curIntent;
		
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
			
			var extLabel;
			if (curExtent.length > 5) { 
				var more = curExtent.length-5;
				extLabel = curExtent.join("\n") + "\n("+more+" more)";
			} else  extLabel = curExtent.join("\n");
			
			//cur.lowerLabel = extLabel;
			cur.extentLabel = curExtent;
			ArrayAddAll(getParentsData(cur), nodelist);
		}
	
}

// function labelizeTree(){
// 		
// 	
		// //var parent = null;
		// lattice.tree.intentLabel = lattice.tree.intent; // set root intent
// 		
		// var queue = [lattice.tree];
		// for (var i=0; i < queue.length; i++) {
		  // var current = queue[i];
// 		  
		  // for (var j=0; j < current.children.length; j++) {
			// var child = current.children[j];
			// child.intentLabel = ArraySubtract(child.intent,current.intent);
		  // };
// 		  
		  // queue.concat(current.children);
		// };
// }


function labelizeTree(){
	
		lattice.tree = lattice.getTree();
		
		 var partition = d3.layout.partition()
	    .value(function(d) { return 1; });
	    partition.nodes(lattice.tree);
	
		//var parent = null;
		lattice.tree.intentLabel = lattice.tree.intent; // set root intent
		
		var queue = lattice.tree.children;
		for (var i=0; i < queue.length; i++) {
		  var current = queue[i];
		  
		  if (current.parent != null && typeof current.parent != 'undefined') current.intentLabel = ArraySubtract(current.intent,current.parent.intent);
		  else current.intentLabel = current.intent;
		  
		  queue = queue.concat(current.children);
		};
		
		
		
}
