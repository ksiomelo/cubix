/*
 * Transform
 */
// function getChildrenDataNodes(children_ids){
	// var ret = [];
	// for (var i=0; i < children_ids.length; i++) {
	  	// var found = false;
		// for (var j=0; j < data.nodes.length && !found; j++) {
		  // if (data.nodes[j].id == children_ids[i]) {
		  	// ret.push(data.nodes[j]);
		  	// found = true;
		  // }
		// };
	// };
	// return ret;
// }


function treeTransform() {
	var top = getTopMostConcepts()[0];

	function recurse(node) {

		

		var children = getChildrenDataNodes(node.children_ids)
		var newChildren = [];

		for(var i = 0; i < children.length; i++) {
			var chNode = recurse(children[i]);
			newChildren.push(chNode);
		};
		
		node.children = newChildren;

		return node;

		//	if (p != null) p.chidren.push(treeNode);

	}

	var topNode = recurse(top);
	data.nodes = [topNode];
	
	//return topNode;
	

}


function getTree0() {
	var top = getTopMostConcepts()[0];

	function recurse(node) {

		var treeNode = new Object();
		treeNode.id = ""+node.id;
		treeNode.name = node.intent.join(", ");//node.name;
		treeNode.lowerLabel = node.lowerLabel;
		treeNode.upperLabel = node.upperLabel;
		treeNode.support = node.support;
		treeNode.intent = node.intent;
		treeNode.extent = node.extent;
		treeNode.depth = node.depth;
		//treeNode.children_ids = node.children_ids;
		//treeNode.title = node.name;
		treeNode.children = [];
		
		var children = getChildrenData(node);//getChildrenDataNodes(node.children_ids)

		for(var i = 0; i < children.length; i++) {
			var chNode = recurse(children[i]);
			chNode.id = node.id + "-" + chNode.id; // current node id = node_id-parent_id to avoid duplicates
			treeNode.children.push(chNode);
		};
		
		return treeNode;

	}
	var topNode = recurse(top);
	return topNode;

}


function getTree() {
	var top = getTopMostConcepts()[0];

	function recurse(node) {

		// var treeNode = new Object();
		// treeNode.name = node.name;
		// treeNode.intent = node.intent;
		// treeNode.extent = node.extent;
		// treeNode.title = node.name;
		// treeNode.children = [];
		var children = getChildrenDataNodes(node.children_ids)
		var newChildren = [];

		for(var i = 0; i < children.length; i++) {
			var chNode = recurse(children[i]);
			newChildren.push(chNode);
		};
		
		node.children = newChildren;

		return node;

		//	if (p != null) p.chidren.push(treeNode);

	}

	var topNode = recurse(top);
	
	return topNode;
	
	// var nt = []
	// nt.push(topTreeNode);
// 	
	  // data.nodes = nt;
      // data.links = d3.layout.tree().links(nt);
// 	
	// updateLattice();
	//return topTreeNode;

}



// Returns a list of all nodes under the root.
function flatten(root) {
 // var nodes = [], i = 0;

  function recurse(node) {
  	
  	var treeNode = new Object();
  	treeNode.name = node.name;
  	treeNode.children = [];
  	
  	var children = getChildrenDataNodes(node.children_ids)
  	
  	//node.children = children;
    //if (children.length > 0) children.forEach(recurse);
    for (var i=0; i < children.length; i++) {
     var chTreeNode = recurse(treeNode, children[i]);
     treeNode.children.push(chTreeNode);
      
    };
    
    return treeNode;
    
  //	if (p != null) p.chidren.push(treeNode);
  	
    
  }

  var topTreeNode = recurse(root);
  return topTreeNode;
}




// 
// function treeize(){
// 	
// 	
	// var partition = d3.layout.partition()
	    // .value(function(d) { return 1; });
// 	
// 	
// 	
	// //d3.json("{{STATIC_URL}}files/flare.json", function(json) {
// 		
		// var json = getTree();
// 		
	  // path = vis.data([json]).selectAll("path")
	      // .data(partition.nodes)
	    // .enter().append("svg:path")
	      // .attr("d", arc)
	      // .style("fill", function(d) { return color((d.children ? d : d.parent).name); })
	      // .on("click", theclick);
// 	
// 	  
// //	});
// 
// }




















