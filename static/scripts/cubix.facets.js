/*
 * Facets
 */

// Create facets (lazyloading)
function createFacets(){
	
	// var theTree = getTree();
// 
	// $("#treepa").dynatree({
			// title : "Sample Theming",
			// // Image folder used for data.icon attribute.
			// onClick : function(node,event) {
				// alert("You selected " + node);
				// //openFacet(node);
			// },
			// children: [theTree]
		// });
// 
	// return;
	
	
	var top_concept = vis.select('circle[id="'+ data.top_id +'"]');
	//var nodelist = getOutgoingNodes(top_concept);
	
	var topfacets = top_concept.attr("intent");
	
	if (topfacets.length == 0) { // se nao tem nada no top
		var outnodes = getOutgoingNodes(top_concept);
		// pega labels do filhos?
		
	}
	
	
	
	
	$("#treepa").dynatree({
			title : "Sample Theming",
			// Image folder used for data.icon attribute.
			onActivate : function(node,event) {
				//alert("You selected " + node);
				openFacet(node);
			}
		});
		
	var rootNode = $("#treepa").dynatree("getRoot");
	
	
	for (var i=0; i < outnodes.length; i++) {
		//appendFacet(outnodes[i].attr("intent"), "#treepa-root", true);
		
		rootNode.addChild({
			title : outnodes[i].attr("intent")
			//tooltip : "This folder and all child nodes were added programmatically."
		});



	};
	
}

/*
 * Search for ANY of the attributes in the string
 */
		// vis.selectAll("circle").style("fill", function(d) {
// 
			// var query = $("#search").val();
			// if(d.intent != "" && d.intent.indexOf(query) >= 0) { // TODO check with empty spaces
				// return "#ff0000";
			// }
		// });
		
// returns a two element array: first is the found nodes, the other its complement (which may be used for hiding nodes later)
// perfomance reasons (only one iteraction)
function searchFacet(facetsString, removeEmptyConcepts) { // facetsString : "facet1,facet2" 

	removeWhiteSpaces(facetsString);

	var ret = [];
	var sel = [];
	var notSel = [];
	
	var keywords = facetsString.split(",");
	
	vis.selectAll("circle").each(function() { // TODO para cada circle?
      	var thenode = d3.select(this);
      	
      	var a1 = thenode.attr("intent").split(",");
      	
      	
      	
      	if (removeEmptyConcepts && thenode.attr("extent").length == 0) {
      			notSel.push(thenode);
      	} else {
      	
	      	if (ArrayContainsAll(a1,keywords)) { // TODO relax para string parciais
	      		
	      		sel.push(thenode);
	      	} else  {
	      		notSel.push(thenode);
	      	}
      	}
    });
    
    ret.push(sel);
    ret.push(notSel);
    
    return ret;
}

// On select facet...
	function openFacet(node){
	
	
	var names = '';
	node.visitParents(function(n) {
		if (n.data.title != null) names += n.data.title +  ",";
	}, true);
	
	var facetNodes = searchFacet(names,true)[0];

	for(var i = 0; i < facetNodes.length; i++) {
		
		var intents = facetNodes[i].attr("intent").split(',');
		var parentIntents = names.split(',');
		
		var thisIntent = ArraySubtract(intents,parentIntents);

		if(thisIntent.length > 0) {

			node.addChild({
				title : thisIntent.join(', ')//.split(',')[0]
				//icon: "customdoc1.gif"
			});
		}

	}
	
	node.expand(true);
	
	return;
	
	
	
	
	// append retrieved facets to current node position
	if (facetNodes.length > 0) {
		ul = $('<ul>').appendTo(node.li);
	}
	
	for(var i = 0; i < facetNodes.length; i++) {
		appendFacet(facetNodes[i].attr("intent"), ul);
	};

	return;

			
			/// old solution :
	

			// retrieve all names in hierarchy
			var names= '';
			var hierarchy = $(this).parentsUntil("#treepa").each(function(){
				//$(this)
				var thelink = $(this).children("a.facetLink"); // closest?
				if (thelink.length != 0) {
					names += thelink.text() + ",";
					thelink.removeClass("facetSel");
				}
			});
			
			$(this).siblings().find("a.facetLink").removeClass("facetSel"); //remove highlight in case they're siblings
			
			// highlight selected facet and add its name
			var liink = $(this).find(">a");
			liink.toggleClass("facetSel");
			//alert(liink.text());
			names += liink.text();
			
			// test
			// alert(names);
			// var ul = $('<ul>').appendTo(this);
			// var li = $('<li>').appendTo(ul);
			// var link = $('<a href="#" class="facetLink">').appendTo(li);
			// link.text("teste");
			
			
			var facetNodes = searchFacet(names,true)[0];
			
			// append retrieved facets to current node position
			for (var i=0; i < facetNodes.length; i++) {
				appendFacet(facetNodes[i].attr("intent"), this, false);
			};
			
}
