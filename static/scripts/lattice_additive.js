var fcafox_w = 600;							// width of the SVG
var fcafox_h = 500;							// height of the SVG

var fcafox_resObj = new XMLHttpRequest();		// for updating data from URL

var div_id_fcaFox = "divForLatticeViz";	// div-id to put the svg in
var fcafox_svg_id = "fdsvg";					// id given to the created svg

var fcafox_currentLatticeDataSet;				// current working DataSet
var fcafox_originalLatticeDataSet;				// DataSet at input-time

var fcafox_nodes;								// displayed fcafox_nodes
var fcafox_links;								// displayed links
var fcafox_seedNodes = [];
var fcafox_updateData;							// Data when partial update is performed
var fcafox_defaultLineStrength = 2;			// default-value for edges
var fcafox_bottomNodeId;						// node at bottom, that should not be displayed 

var fcafox_vizPaneGlobal;						// overlay-rectangle for zooming
var fcafox_vizPane;							// container containing links/nodes

var fcafox_transitionCounter = 0;				// counter for Transitions (so that we don't get conflicts)
var fcafox_updateTransitionsNeeded = 0;		// number of updateTransitions needed for partial Updates
var fcafox_initialZoomFinished = false;		        // flag for end of initialZoom
var fcafox_initialZoom = false;				// flag whether initialZoom should be performed

// parameter:
var fcafox_nodeTooltipsVisible = true;
var fcafox_nodeAttrLabelsVisible = true;
var fcafox_nodeObjLabelsVisible = true;
var fcafox_dragOnlySeeds = false;
var fcafox_showHeatmap = true;
var fcafox_selectionMode = false;
var fcafox_removeTransitionLength = 500;
var fcafox_createTransitionLength = 500;

// ------------ Initialization ----------- // 
// eventhandler for drag&drop of nodes
var fcafox_drag = d3.behavior.drag()
	.on("dragstart", fcafox_dragstart)
	.on("drag", fcafox_dragmove)
	.on("dragend", fcafox_dragend);

var fcafox_zoom = d3.behavior.zoom();

// initialize the SVG incl. zoom-overlay, labels, etc.
function fcafox_initSVG(){
	
	d3.selectAll("#"+div_id_fcaFox+" svg").remove(); 		// remove svg hence all child-elements
	
	d3.select("#"+div_id_fcaFox).append("svg:svg").attr("id",fcafox_svg_id).attr("width",fcafox_w).attr("height",fcafox_h); // append clean svg
	
	fcafox_vizPaneGlobal=d3.select("#"+fcafox_svg_id).append("svg:rect")			// append rectangle for zoom-handling
					.attr("id","zoomRect")
					.attr("width",fcafox_w)
					.attr("height",fcafox_h)
					.attr("style","fill:#fff;opacity:0;")
					.call(fcafox_zoom.on("zoom", fcafox_redraw));
	
	d3.select("#"+fcafox_svg_id).append("svg:g")							// append group-element to add 
					.attr("id","fdgroup");
					
	fcafox_vizPane = d3.select("#"+fcafox_svg_id).append("svg:g");
	
	fcafox_zoom.translate([0,0]).scale(1);
	
}


// ------------  Necessary methods ------- //

// methods to update the JSON-Data

//Update from URL
function fcafox_updateData(url){
	fcafox_resObj.open('get', url, false);
	fcafox_resObj.onreadystatechange = fcafox_handleUpdate;
	fcafox_resObj.send(null);
}

function fcafox_handleUpdate(){
	if(fcafox_resObj.readyState == 4){
		fcafox_updateData_text(fcafox_resObj.responseText);
	}
}

//Update with JSON-Text
function fcafox_updateData_text(json){
	
	fcafox_currentLatticeDataSet = JSON.parse(json);
	
	fcafox_originalLatticeDataSet = jQuery.extend(true, {} , fcafox_currentLatticeDataSet);
	
	fcafox_nodes = fcafox_currentLatticeDataSet.nodes;
	fcafox_links = fcafox_currentLatticeDataSet.links;
	
	fcafox_initSVG();
	
	fcafox_vizPane.attr("transform","scale(0.01)");
	fcafox_initialZoom = true;
	fcafox_enterNodes();
}

//Update from URL
function fcafox_updatePartialData(url){
	fcafox_resObj.open('get', url, false);
	fcafox_resObj.onreadystatechange = fcafox_handlePartialUpdate;
	fcafox_resObj.send(null);
}

function fcafox_handlePartialUpdate(){
	if(fcafox_resObj.readyState == 4){
		fcafox_partialUpdate(fcafox_resObj.responseText);
	}
}

// Method for single updates - removing/adding/modifying of nodes/edges
// modifies the originalDataset to set new basis
// adds new Nodes/Edges immediately and later completely redraws the svg to get the whole lattice connected in one databasis
function fcafox_partialUpdate(json){
	// Format:
	// {nodes:[{1},{2},{3},{4}],links:[{},{}],nodesToBeRemoved:[id1,id2,...],linksToBeRemoved:[{sourceId,targetId}...],nodesToModify:[{bekannteID1},{bekannteID2}]}
	fcafox_updateData = JSON.parse(json);
	var temporaryUpdateData = jQuery.extend(true, {} , fcafox_updateData);

	fcafox_updateTransitionsNeeded = fcafox_updateData.nodesToBeRemoved.length + fcafox_updateData.linksToBeRemoved.length;
	
	for(var j=0; j<fcafox_originalLatticeDataSet.nodes.length;j++){
		fcafox_originalLatticeDataSet.nodes[j].sx = fcafox_currentLatticeDataSet.nodes[fcafox_getNodeArrayPositionById(fcafox_originalLatticeDataSet.nodes[j].id)].sx;
		fcafox_originalLatticeDataSet.nodes[j].sy = fcafox_currentLatticeDataSet.nodes[fcafox_getNodeArrayPositionById(fcafox_originalLatticeDataSet.nodes[j].id)].sy;
	}
	
 //__________ modify existing Nodes __________ //
	for(var i = 0; i<fcafox_updateData.nodesToModify.length; i++){
		fcafox_originalLatticeDataSet.nodes[fcafox_getNodeArrayPositionById(fcafox_updateData.nodesToModify[i].id)] = fcafox_updateData.nodesToModify[i];
	}

	
	
	//___________ Adding/removing new nodes and lines __________ //
	
	// adding new Nodes and creating them at parentseed-position
	for(var i = 0; i<fcafox_updateData.nodes.length; i++){
		fcafox_originalLatticeDataSet.nodes.push(fcafox_updateData.nodes[i]);
		
		temporaryUpdateData.nodes[i].newNode = true; // set this parameter only in temporary data, will not appear in fcafox_originalLatticeDataSet => dataset stays clean
		
		fcafox_currentLatticeDataSet.nodes.push(temporaryUpdateData.nodes[i]);
	}
	

	fcafox_vizPane.selectAll(".latticeNode").data(fcafox_currentLatticeDataSet.nodes).enter()
		.append("svg:g")                 // append to each element of S an svg-circle         
		.attr("transform", function(d) {
			console.log("creating Node "+d.id);
			if(d.newNode){
				var tempParentNode = fcafox_currentLatticeDataSet.nodes[fcafox_getNodeArrayPositionById(d.genId)];
				return "translate("+tempParentNode.cx+","+tempParentNode.cy+")";
				}
			else return "translate("+d.cx+","+d.cy+")";
			}) 
		.each(function(d,i){if(d.extent.length < 1) fcafox_bottomNodeId = d.id;})				// LOOK FOR NEW BOTTOM-NODE
		.classed("bottomNodeRelated",function(d){return d.id == fcafox_bottomNodeId;})			// 
		.classed("latticeNode",true)
		.append("svg:circle")
		.classed("unhighlightedNode",true)
        .attr("r", function(d) {return d.r; });
	
	 // adding new Lines and creating them at parentseed-position
	for(var i = 0; i<fcafox_updateData.links.length; i++){
		fcafox_originalLatticeDataSet.links.push(fcafox_updateData.links[i]);
		
		temporaryUpdateData.links[i].newLink = true; // set this parameter only in temporary data, will not appear in fcafox_originalLatticeDataSet => dataset stays clean
		
		fcafox_currentLatticeDataSet.links.push(temporaryUpdateData.links[i]);
	}	
	
	
	fcafox_vizPane.selectAll(".latticeEdge")                            // selecting ths set of lines  with id="latticeEdge"
		 .data(fcafox_currentLatticeDataSet.links)                                   // making link to own dataset
		 .enter()                                          // select set S of all data elements which are not assigned a visual counterpart yet
		.append("svg:line")                      // append to each element of S an svg-line
		.classed("latticeEdge",true) 
		.classed("bottomNodeRelated",function(d){return d.link[0] == fcafox_bottomNodeId || d.link[1] == fcafox_bottomNodeId;})				// BOTTOM_NODE_RELATED
		.attr("id", function(d){
				console.log("Creating Link " +d.id);
				return "edge"+d.id;})           
		 .attr("x1", function(d,i) {
			 	var temp = fcafox_currentLatticeDataSet.nodes[fcafox_getNodeArrayPositionById(d.link[0])];
			 	return temp.newNode ? temp.cx + fcafox_w/2: temp.cx; })        
		 .attr("x2", function(d,i) {
			if(d.newLink){
			 	var temp = fcafox_currentLatticeDataSet.nodes[fcafox_getNodeArrayPositionById(d.link[0])];
			 	return temp.newNode ? temp.cx + fcafox_w/2: temp.cx;
			}	
			else
				return (fcafox_currentLatticeDataSet.nodes[fcafox_getNodeArrayPositionById(d.link[1])].cx); })        
		 .attr("y1", function(d,i) {return (fcafox_currentLatticeDataSet.nodes[fcafox_getNodeArrayPositionById(d.link[0])].cy); })        
		 .attr("y2", function(d,i) {
			if(d.newLink)
				return (fcafox_currentLatticeDataSet.nodes[fcafox_getNodeArrayPositionById(d.link[0])].cy);
			else				
				return (fcafox_currentLatticeDataSet.nodes[fcafox_getNodeArrayPositionById(d.link[1])].cy); });
	
	 // removing links
		for(var i = 0; i<fcafox_updateData.linksToBeRemoved.length; i++){
			//removing from originalDataSet
			var temp = fcafox_getLinkArrayPositionByIdOriginal(fcafox_updateData.linksToBeRemoved[i]);
			if(temp > -1){
				fcafox_originalLatticeDataSet.links.splice(temp,1);
				// removing from viz					
				fcafox_vizPane.selectAll(".latticeEdge").filter(function(d){
								if(d.id == fcafox_updateData.linksToBeRemoved[i]){
									console.log("REMOVE Link"+d.id);
									d.remove = true;
									return true;
								} else
									return false;
							})
						.transition().each("end",fcafox_afterUpdateTransition).duration(fcafox_removeTransitionLength)
						.attr("x1", function(d,i) {return (fcafox_nodes[fcafox_getNodeArrayPositionById(d.link[0])].cx); })        
						 .attr("x2", function(d,i) {return (fcafox_nodes[fcafox_getNodeArrayPositionById(d.link[0])].cx);})        
						 .attr("y1", function(d,i) {return (fcafox_nodes[fcafox_getNodeArrayPositionById(d.link[0])].cy); })        
						 .attr("y2", function(d,i) {return (fcafox_nodes[fcafox_getNodeArrayPositionById(d.link[0])].cy); });
			}
		}
	
	 // removing nodes
		for(var i = 0; i<fcafox_updateData.nodesToBeRemoved.length; i++){
			//removing from originalDataSet
			fcafox_originalLatticeDataSet.nodes.splice(fcafox_getNodeArrayPositionByIdOriginal(fcafox_updateData.nodesToBeRemoved[i]),1);
			
			// removing seed
			for(var j=0; j<fcafox_originalLatticeDataSet.nodes.length;j++){
				for(var h=0; h<fcafox_originalLatticeDataSet.nodes[j].seeds.length;h++){
					if(fcafox_originalLatticeDataSet.nodes[j].seeds[h] == fcafox_updateData.nodesToBeRemoved[i]){
						fcafox_originalLatticeDataSet.nodes[j].seeds.splice(h,1);
						break;
					}
				}
			}
			
			// removing from viz					
			fcafox_vizPane.selectAll(".latticeNode").filter(function(d){
							if(d.id == fcafox_updateData.nodesToBeRemoved[i]){ 
								console.log("REMOVE " +d.id);
								d.remove = true;
								return true;
							}
							else
								return false;
						})
					.selectAll("circle").transition().each("end",fcafox_afterUpdateTransition).duration(fcafox_removeTransitionLength).attr("r",0);
		}
	
		
	if(fcafox_updateTransitionsNeeded == 0){
		fcafox_afterUpdateTransition();
	}

}

function fcafox_afterUpdateTransition(){
	fcafox_transitionCounter++;
	if(fcafox_transitionCounter > fcafox_updateTransitionsNeeded-1){
		console.log("called fcafox_afterUpdateTransition");
		fcafox_vizPane.selectAll(".latticeNode").filter(function(d){
			if(d.remove){ 
				return true;
			}
			else
				return false;
		}).remove();
		
		fcafox_vizPane.selectAll(".latticeEdge").filter(function(d){
			if(d.remove){
				return true;
			} else
				return false;
		}).remove();
		
		fcafox_currentLatticeDataSet = jQuery.extend(true, {} , fcafox_originalLatticeDataSet);
		
		fcafox_nodes = fcafox_currentLatticeDataSet.nodes;
		fcafox_links = fcafox_currentLatticeDataSet.links;
		
		fcafox_transitionCounter = 0;
		
		fcafox_resetNodePositions();
		
		//fcafox_initSVG();
		//fcafox_enterNodes();
		//fcafox_resetNodePositions();
		
		
	}
}

// computes positions for single nodes from the seeds
function fcafox_computeNodePositions()
{
	var newCX=0;
	var newCY=0;
	var length; 
	for (var j=0; j<fcafox_nodes.length;j++){
		try {
					{
					node=fcafox_nodes[j];
					length =node.seeds.length;
					newCX=0;
					newCY=0;
					for (var i=0;i<node.seeds.length;i++)
								   {
								   n = node.seeds[i];
								   
								   newCX = newCX + fcafox_nodes[fcafox_getNodeArrayPositionById(n)].sx;
								   newCY = newCY + fcafox_nodes[fcafox_getNodeArrayPositionById(n)].sy;
								   }
					fcafox_nodes[j].cx = newCX+(fcafox_w/2);
					fcafox_nodes[j].cy = newCY;
					}
		   }
	   catch (e) {
		   console.log(e);
		   console.log("happend with Node " + j);
		   
	   }
	}
}

// resets the positions of the nodes to original dataset the view started with
function fcafox_resetNodePositions()
{

	for(var n=0;n<fcafox_nodes.length;n++){
		fcafox_nodes[n].sx = fcafox_originalLatticeDataSet.nodes[n].sx;
		fcafox_nodes[n].sy = fcafox_originalLatticeDataSet.nodes[n].sy;
	}
	
	fcafox_computeNodePositions();
	
	fcafox_vizPane.transition().duration(fcafox_createTransitionLength).each("end",fcafox_afterTransition)
			.attr("transform","translate(0,0)scale(1.0)");

	fcafox_vizPane.selectAll(".latticeNode").transition().duration(fcafox_createTransitionLength).each("end",fcafox_afterTransition)
		 .attr("transform", function(d,i) {return "translate("+fcafox_nodes[fcafox_getNodeArrayPositionById(d.id)].cx+","+fcafox_nodes[fcafox_getNodeArrayPositionById(d.id)].cy+")"; });
	
	fcafox_vizPane.selectAll(".latticeEdge").transition().duration(fcafox_createTransitionLength).each("end",fcafox_afterTransition)
		 .attr("x1", function(d,i) {return (fcafox_nodes[fcafox_getNodeArrayPositionById(d.link[0])].cx); })        
		 .attr("x2", function(d,i) {return (fcafox_nodes[fcafox_getNodeArrayPositionById(d.link[1])].cx); })        
		 .attr("y1", function(d,i) {return (fcafox_nodes[fcafox_getNodeArrayPositionById(d.link[0])].cy); })        
		 .attr("y2", function(d,i) {return (fcafox_nodes[fcafox_getNodeArrayPositionById(d.link[1])].cy); });                         
}

// Dragging-methods:
// Defines what to do when dragstart-event is fired
function fcafox_dragstart(d, i) {
	if(fcafox_showHeatmap)
		fcafox_drawHeatMap(d.id);
}

//Defines what to do when dragend-event is fired
function fcafox_dragend(d, i) {
	d3.selectAll("#fdgroup rect").remove(); // remove all rectangles drawn in background for Heatmap
	gwt_fcafox_stopHeatMap(JSON.stringify(fcafox_currentLatticeDataSet)); // provided by com.eu.cubist.gwt.client.controller.FCAController, 
														// sends currentDataset "=" updated positions to FCAFox for further Heatmap-calculations
}


// dragging a node 
function fcafox_dragmove(d, i) {
	var localSeedNodes = fcafox_nodes[i].seeds;
	if(fcafox_dragOnlySeeds){
		 for(var i=0;i<fcafox_seedNodes.length;i++){
			if(fcafox_seedNodes[i].id == d.id){
				var currentArrayIndex = fcafox_getNodeArrayPositionById(d.id);
				fcafox_nodes[currentArrayIndex].sx = fcafox_nodes[currentArrayIndex].sx + d3.event.dx;
				fcafox_nodes[currentArrayIndex].sy = d3.max([15,fcafox_nodes[currentArrayIndex].sy + d3.event.dy] );
				break;
			}
		 }
			fcafox_computeNodePositions();
			
			fcafox_vizPane.selectAll(".latticeNode")
				 .attr("transform", function(d) {return "translate("+d.cx+","+d.cy+")"; });
			fcafox_vizPane.selectAll(".latticeEdge")
				 .attr("x1", function(d,i) {return (fcafox_nodes[fcafox_getNodeArrayPositionById(d.link[0])].cx); })        
				 .attr("x2", function(d,i) {return (fcafox_nodes[fcafox_getNodeArrayPositionById(d.link[1])].cx); })        
				 .attr("y1", function(d,i) {return (fcafox_nodes[fcafox_getNodeArrayPositionById(d.link[0])].cy); })        
					 .attr("y2", function(d,i) {return (fcafox_nodes[fcafox_getNodeArrayPositionById(d.link[1])].cy); });
			 
	} else {
		for (var n=0; n<localSeedNodes.length; n++)
		  {				var currentArrayIndex = fcafox_getNodeArrayPositionById(localSeedNodes[n]);
						fcafox_nodes[currentArrayIndex].sx = fcafox_nodes[currentArrayIndex].sx + d3.event.dx/(localSeedNodes.length-0);
						fcafox_nodes[currentArrayIndex].sy = d3.max([15,fcafox_nodes[currentArrayIndex].sy + d3.event.dy/(localSeedNodes.length-0)] ); 
						// the "d3.max"-thingo ensures that no node can be placed above upper neighbors or below lower neighbors.
		  }
		fcafox_computeNodePositions();
	
		fcafox_vizPane.selectAll(".latticeNode")
			 .attr("transform", function(d) {return "translate("+d.cx+","+d.cy+")"; });
		fcafox_vizPane.selectAll(".latticeEdge")
			 .attr("x1", function(d,i) {return (fcafox_nodes[fcafox_getNodeArrayPositionById(d.link[0])].cx); })        
			 .attr("x2", function(d,i) {return (fcafox_nodes[fcafox_getNodeArrayPositionById(d.link[1])].cx); })        
			 .attr("y1", function(d,i) {return (fcafox_nodes[fcafox_getNodeArrayPositionById(d.link[0])].cy); })        
			 .attr("y2", function(d,i) {return (fcafox_nodes[fcafox_getNodeArrayPositionById(d.link[1])].cy); });
	}
}

//HIGHLIGHTING-METHODS
// on a mouseover of a node, all nodes of filter and ideal are highlighted
function fcafox_highlightNodes(d) {
 
//    // highlight nodes above (= seednodes):
//	var chosenNode = d.id;
//	var selectedDataNodes = nodes[fcafox_getNodeArrayPositionById(d.id)].seeds;   
//    fcafox_vizPane.selectAll(".latticeNode circle").filter(function(d){
//      for (var n=0; n< selectedDataNodes.length; n++)
//                   { if (selectedDataNodes[n] == d.id && selectedDataNodes[n] != chosenNode) return true; }    
//      return false;
//      }).classed("highlightedNodeFilter",true).classed("unhighlightedNode",false);

	// highlight nodes above:
	fcafox_highlightFilter(d.id);
	
	// highlight nodes below:
	fcafox_highlightIdeal(d.id);
}

// Highlight a single node by id
function fcafox_highlightNode(id){
    fcafox_vizPane.selectAll(".latticeNode circle").filter(function(d){
      if (d.id == id) return true;   
      return false;
      }).classed("highlightedNodeIdeal",true).classed("unhighlightedNode",false);
}

// This method highlights all nodes belonging to ideal of the lattice (="nodes below")
function fcafox_highlightIdeal(id){
	var selectedDataNodes = [];
	for(var i=0; i<fcafox_links.length; i++){
		if(fcafox_links[i].link[1] == id){ 
			selectedDataNodes.push(fcafox_links[i].link[0]);
			fcafox_highlightIdeal(fcafox_links[i].link[0]);
		}
	}	
	fcafox_vizPane.selectAll(".latticeNode circle").filter(function(d){
	  for (var n=0; n< selectedDataNodes.length; n++)
				   { if (selectedDataNodes[n] == d.id) return true; }    
	  return false;
	  }).classed("highlightedNodeIdeal",true).classed("unhighlightedNode",false);
	
}

//This method highlights all nodes belonging to ideal of the lattice (="nodes below")
function fcafox_highlightFilter(id){
	var selectedDataNodes = [];
	for(var i=0; i<fcafox_links.length; i++){
		if(fcafox_links[i].link[0] == id){ 
			selectedDataNodes.push(fcafox_links[i].link[1]);
			fcafox_highlightFilter(fcafox_links[i].link[1]);
		}
	}	
	fcafox_vizPane.selectAll(".latticeNode circle").filter(function(d){
	  for (var n=0; n< selectedDataNodes.length; n++)
				   { if (selectedDataNodes[n] == d.id) return true; }    
	  return false;
	  }).classed("highlightedNodeFilter",true).classed("unhighlightedNode",false);
	
}

function fcafox_unHighlightAllNodes() {
	d3.select("#"+fcafox_svg_id).selectAll(".latticeNode circle").classed("unhighlightedNode",true).classed("highlightedNodeIdeal",false).classed("highlightedNodeFilter",false);
}    

// define what to do after the transitions = reset or updates
function fcafox_afterTransition(){
	fcafox_transitionCounter++;
	// there are transitions for each node and link 
	// to be finished and for the svg-reset
	// after that completely redraw the SVG to reset the D3-internal zoom/pan-data
	if(fcafox_transitionCounter > fcafox_nodes.length+fcafox_links.length-1){
		fcafox_initSVG();
		fcafox_enterNodes();
		fcafox_toggleDragOnlySeeds(fcafox_dragOnlySeeds);
		fcafox_transitionCounter = 0;
		gwt_fcafox_updateFinished();
	}
}


// function for zooming - defines what to do with the events fired
function fcafox_redraw(){
	var oldTranslate = d3.event.translate;
	var oldScale = d3.event.scale;

	if(fcafox_initialZoomFinished){
		fcafox_vizPane.attr("transform",
				"translate(" + oldTranslate + ")"
				+ "scale(" + oldScale + ")");	
	
		d3.selectAll("#fdgroup").attr("transform",
				"translate(" + oldTranslate + ")"
				+ "scale(" + oldScale + ")");
	}
	
}

//manually zooming -> method for zoom-Buttons
function fcafox_manualZoom(direction) { 
	// --> working only in WEBKIT-Browsers. Event-Definition:
	// void initWebKitWheelEvent(int wheelDeltaX, int wheelDeltaY,DOMWindow 
	//             view, int screenX, int screenY, int clientX, int clientY, bool ctrlKey, 
	//             bool altKey, bool shiftKey, bool metaKey); 
	var deltaY;
	var delta = 1;
	
	if(navigator.appVersion.indexOf("Chrome") == -1)
		delta = 120;	
	
	if(direction == "in")
		deltaY = delta;
	else
		deltaY = -1*delta;
	
    var evt = document.createEvent("WheelEvent"); 
    evt.initWebKitWheelEvent(0, deltaY, window, fcafox_w, fcafox_h/2, fcafox_w, fcafox_h/2, false, false, false, false); 
            document.getElementById('zoomRect').dispatchEvent(evt); 
} 

// starting method for new Data
// creates nodes and edges displayed in svg
function fcafox_enterNodes()
{

	// first: add correct positions of nodes in order to get an additive line diagram
	fcafox_computeNodePositions();
	
	
	// adding edges and lines to the visualization pane    --> BEFORE NODES to have edges in background
	fcafox_vizPane.selectAll(".latticeEdge")                            // selecting ths set of lines  with id="latticeEdge"
		 .data(fcafox_links)                                   // making link to own dataset
		 .enter()                                          // select set S of all data elements which are not assigned a visual counterpart yet
		.append("svg:line")                      // append to each element of S an svg-line
		.classed("latticeEdge",true)                                                                            
		.attr("id", function(d){return "edge"+d.id;})   
		.attr("style", function(d){return d.strength == 0 ? "stroke-width" + fcafox_defaultLineStrength : "stroke-width:" + d.strength;})
		 .attr("x1", function(d,i) {return (fcafox_nodes[fcafox_getNodeArrayPositionById(d.link[0])].cx); })        
		 .attr("x2", function(d,i) {return (fcafox_nodes[fcafox_getNodeArrayPositionById(d.link[1])].cx); })        
		 .attr("y1", function(d,i) {return (fcafox_nodes[fcafox_getNodeArrayPositionById(d.link[0])].cy); })        
		 .attr("y2", function(d,i) {return (fcafox_nodes[fcafox_getNodeArrayPositionById(d.link[1])].cy); });
	
	fcafox_vizPane.selectAll(".latticeNode")              // selecting ths set of circles with id="latticeNode"
		.data(fcafox_nodes)                          // making link to own dataset
		.enter()                              // select set S of all data elements which are not assigned a visual counterpart yet
		.append("svg:g")                 // append to each element of S an svg-circle         
		.attr("transform", function(d) {return "translate("+d.cx+","+d.cy+")"; })
		.each(function(d,i){if(d.extent.length < 1) fcafox_bottomNodeId = d.id;})
		.classed("bottomNodeRelated",function(d){return d.id == fcafox_bottomNodeId;})
		.classed("latticeNode",true)
		.call(fcafox_drag) 					// adding eventhander for drag&drop
		.on("click",function(d){ fcafox_nodeClick(d); })
		.on("mouseover",  function(d){ fcafox_d3NodeMouseOver(d);})
		.on("mouseout", function(d){ fcafox_d3NodeMouseOut(d);})
		.append("svg:circle")
		.classed("unhighlightedNode",true)
	    .attr("r", function(d,i) {return (d.r); });
    
	fcafox_vizPane.selectAll(".latticeNode")	
		.append("svg:text")
		.text(function(d) {
				var tempText = "";
				for(var i=0;i<d.labelIntent.length;i++) {
					for(var j=0;j<d.intent.length;j++){
						if(d.labelIntent[i] == d.intent[j].id){
							tempText = tempText + d.intent[j].name + ",";
						}
					}
				}
				return tempText.slice(0,tempText.length-1);})
		.attr("class",function(){return fcafox_nodeAttrLabelsVisible ? "nodeAttrText" : "nodeAttrTextHidden";})
		.attr("x","15")
		.attr("y","-15");
		
	fcafox_vizPane.selectAll(".latticeNode")	
		.append("svg:text")
		.text(function(d) {
				var tempText = "";
				for(var i=0;i<d.labelExtent.length;i++) {
					for(var j=0;j<d.extent.length;j++){
						if(d.labelExtent[i] == d.extent[j].id){
							tempText = tempText + d.extent[j].name + ",";
						}
					}
				}
				return tempText.slice(0,tempText.length-1);})
		.attr("class",function(){return fcafox_nodeObjLabelsVisible ? "nodeObjText" : "nodeObjTextHidden";})
		.attr("x","15")
		.attr("y","15");
	
	
	//bottomnode-Related edges	
	fcafox_vizPane.selectAll(".latticeEdge")
		.filter(function(d){return d.link[0] == fcafox_bottomNodeId || d.link[1] == fcafox_bottomNodeId;})
		.classed("bottomNodeRelated",true);
	
	
	
	if(fcafox_initialZoom){
		fcafox_initialZoomFinished = false;
		fcafox_initialZoom = false;
		fcafox_vizPane.transition().each("end",fcafox_afterInitialZoom).ease("back").duration(1000).attr("transform","scale(1.0)");
		
	}
                 
}

function fcafox_afterInitialZoom(){
	
	fcafox_initialZoomFinished=true;
	fcafox_resetNodePositions();
}

//Tooltips and nodeLabels

// toggle display for tooltips in general -> if(on) -> show
function fcafox_toggleTooltips(on){
	if(on) { 
		fcafox_nodeTooltipsVisible = true;
		d3.selectAll("#toggleTooltipsButton").html("Tooltips: ON");
	} else { 
		fcafox_nodeTooltipsVisible = false; 
		d3.selectAll("#toggleTooltipsButton").html("Tooltips: OFF");
	}
}

// toggle display for labels of the Node-Attributes -> if(on) -> show
function fcafox_toggleNodeAttrLabels(on){
	if(on) { 
		fcafox_nodeAttrLabelsVisible = true;
		d3.selectAll(".nodeAttrTextHidden").attr("class","nodeAttrText");
	} else { 
		fcafox_nodeAttrLabelsVisible = false; 
		d3.selectAll(".nodeAttrText").attr("class","nodeAttrTextHidden");
	}	
}

// toggle display for labels of the Node-Objects -> if(on) -> show
function fcafox_toggleNodeObjLabels(on){
	if(on) { 
		fcafox_nodeObjLabelsVisible = true;
		d3.selectAll(".nodeObjTextHidden").attr("class","nodeObjText");
	} else { 
		fcafox_nodeObjLabelsVisible = false; 
		d3.selectAll(".nodeObjText").attr("class","nodeObjTextHidden");
	}	
}

//toggle display for labels of the Node-Attributes -> if(on) -> show
function fcafox_toggleDragOnlySeeds(on){
	if(on) { 
		fcafox_dragOnlySeeds = true;
		fcafox_seedNodes = [];
		// get all seeds and seedlinks for highlighting
		for(var i=0;i<fcafox_nodes.length;i++){
			if(fcafox_nodes[i].sx != 0 || fcafox_nodes[i].sy != 0){
				fcafox_seedNodes.push(fcafox_nodes[i]);
				fcafox_highlightNode(fcafox_nodes[i].id);
				console.log(fcafox_nodes[i].id);
			}
		}
		for(var i=0;i<fcafox_links.length;i++){
			for(var j=0;j<fcafox_seedNodes.length;j++){
				if(fcafox_links[i].link[0] == fcafox_seedNodes[j].id){
					var temp = "#edge"+fcafox_links[i].id;
					d3.selectAll(temp).classed("latticeEdgeHighlight",true);
				}
			}
		}
	} else { 
		fcafox_dragOnlySeeds = false; 
		fcafox_unHighlightAllNodes();
		d3.selectAll(".latticeEdge").classed("latticeEdgeHighlight",false);
	}	
}

function fcafox_toggleHeatmap(on){
	if(on)
		fcafox_showHeatmap = true;
	else
		fcafox_showHeatmap = false;
}

function fcafox_toggleSelectionMode(on){
	if(on)
		fcafox_selectionMode = true;
	else{
		fcafox_selectionMode = false;
		fcafox_removeAllBoxes();
	}
}

// Display tooltip (triggered by browserevent for mouseover
function fcafox_showTooltip(e,id){
	if(fcafox_nodeTooltipsVisible){
		// we could also use the data from currentNode-variable but it is sometimes 
		// still null when using it here (event to set it is sometimes too slow)
		// this explicite way seems better to me
		var d = fcafox_nodes[fcafox_getNodeArrayPositionById(id)];
		var xpos = e.pageX + 10;
		var ypos = e.pageY + 10;
		var html = "";
			html += "<b>Intent: </b><br>";
		for(var i=0;i<d.intent.length;i++)
			html += d.intent[i].name + "<br>";
		
		html += "<b>Extent: </b><br>"; 
		for(var i=0;i<d.extent.length;i++)
			html += d.extent[i].name + "<br>";
		
		$(".tooltipDiv").css("top",ypos).css("left",xpos).css("visibility","visible").html(html);
	}
}

// hide tooltips
function fcafox_hideTooltip(){
	d3.selectAll(".tooltipDiv").style("visibility","hidden");
}

// d3 - mouseover for nodes:
function fcafox_d3NodeMouseOver(d){
	if(!fcafox_dragOnlySeeds && !fcafox_selectionMode) fcafox_highlightNodes(d);
	if(fcafox_selectionMode){
		fcafox_d3_highlightBox(d.id);
		fcafox_highlightNode(d.id);
	}
	fcafox_showTooltip(d3.event,d.id);
}

//d3 - mouseover for nodes:
function fcafox_d3NodeMouseOut(d){
	if(!fcafox_dragOnlySeeds && !fcafox_selectionMode) fcafox_unHighlightAllNodes(d);
	if(fcafox_selectionMode){
		fcafox_d3_unHighlightBox(d.id);
		fcafox_unHighlightAllNodes();
	}
	fcafox_hideTooltip();
}

// what happens onNodeClick
function fcafox_nodeClick(nodeData){
	var id = nodeData.id;
	if(fcafox_selectionMode){
		if(!nodeData.selected){
			fcafox_addBox(id);
		} 
		else {
			fcafox_removeBox(id);
		}
	}
}

// trigger backend-method to get heatmap -> backend calls fcafox_drawRectangles() step by step
function fcafox_drawHeatMap(id){
	if(fcafox_dragOnlySeeds){								// Only request Heatmap for Seednodes
		for(var i=0;i<fcafox_seedNodes.length;i++){
			if(id == fcafox_seedNodes[i].id){			
				gwt_fcafox_getHeatMap(id,fcafox_dragOnlySeeds);
				return;
			}
		}
	}
	else {
		gwt_fcafox_getHeatMap(id, fcafox_dragOnlySeeds); // provided by GWT in com.eu.cubist.gwt.client.controller.FCAController
	}
}

// Draw rectangles behind nodes - used to display heatmap
// expects jsondata : {"rectangles":[{"x":2.1875,"y":1.140625,"w":0.625,"h":0.84375,"opacity":0.8324157178456318,"color":"#588"},...{}]}
function fcafox_drawRectangles(json){
	// console.log(json);
	var rects = JSON.parse(json);
	// console.log(rects);
	d3.selectAll("#fdgroup rect").remove(); 
	d3.selectAll("#fdgroup").selectAll("rect")
		.data(rects.rectangles)
		.enter()
		.append("svg:rect")
		.attr("x",function(d,i){return d.x + (fcafox_w/2);})
		.attr("y",function(d,i){return d.y;})
		.attr("width",function(d,i){return d.w;})
		.attr("height",function(d,i){return d.h;})
		.attr("style",function(d,i){return "fill:"+d.color+";opacity:"+d.opacity;});
	
}

//// Methods for displaying node-Data
function fcafox_removeBox(id){
	fcafox_vizPane.selectAll(".selectedNode").filter(function(d){
		if (d.id == id) {
			d.selected = false;
			return true;
		}   
		return false;
	}).classed("selectedNode",false);
	fcafox_unHighlightAllNodes();
	currentRemoveBoxID = "#nodeChartBox"+id; 
	d3.select(currentRemoveBoxID).transition().each("end",removeFadeOutBoxes).duration(400).style("opacity",0);
}

function fcafox_removeAllBoxes(){
	fcafox_vizPane.selectAll(".selectedNode").classed("selectedNode",false);
	fcafox_unHighlightAllNodes(); 
	d3.selectAll(".nodeChartBox").remove();
}

function removeFadeOutBoxes() {
	$(currentRemoveBoxID).remove();
}

function fcafox_addBox(id){
	
		fcafox_vizPane.selectAll(".latticeNode circle").filter(function(d){
			if (d.id == id) {
				d.selected = true;
				return true;
			}
			return false;
		}).classed("selectedNode",true);
	
		var d = fcafox_originalLatticeDataSet.nodes[fcafox_getNodeArrayPositionByIdOriginal(id)];
		var html ="";
 		html += "<div class='nodeChartBox' id='nodeChartBox"+d.id+"' style='opacity:0;' onmouseover='fcafox_highlightNode("+d.id+");fcafox_d3_highlightBox("+d.id+");' onmouseout='fcafox_unHighlightAllNodes();fcafox_d3_unHighlightBox("+d.id+");'><div class='nodeInfoBox'>";
		html += "Node "+d.id+":<br>";
		
		var tempText = "";
		for(var i=0;i<d.labelIntent.length;i++) {
			for(var j=0;j<d.intent.length;j++){
				if(d.labelIntent[i] == d.intent[j].id){
					tempText = tempText + d.intent[j].name + ",";
				}
			}
		}
		
		html += "Intent: " + tempText + "<br>";
		
		tempText = "";
		for(var i=0;i<d.labelExtent.length;i++) {
			for(var j=0;j<d.extent.length;j++){
				if(d.labelExtent[i] == d.extent[j].id){
					tempText = tempText + d.extent[j].name + ",";
				}
			}
		}
		html += "Extent: " + d.labelExtent + "<br>"; 
		html += "Data: not supported</div><div id='nodeBox"+d.id+"' class='chartBox'>No charts so far...</div><a href=\"javascript:fcafox_removeBox("+id+")\">remove box</a></div>"; 
		$("#d3NodeSelectionBox").append(html);
		if(d.dataset)
			createChart(d);
		var currentBoxID = "#nodeChartBox"+d.id; 
		d3.select(currentBoxID).transition().duration(400).style("opacity",1.0);
	
}

function fcafox_d3_highlightBox(id){
	d3.selectAll("#nodeChartBox"+id).classed("nodeChartBoxHighlighted",true);
}

function fcafox_d3_unHighlightBox(id){
	d3.selectAll("#nodeChartBox"+id).classed("nodeChartBoxHighlighted",false);
}


// HELPER-Methods
// is needed because nodes are linked by positions in array
function fcafox_getNodeArrayPositionById(id){
	for(var i = 0; i<fcafox_currentLatticeDataSet.nodes.length; i++){
		if(fcafox_currentLatticeDataSet.nodes[i].id == id)
			return i;
	}
	return -1;
}

function fcafox_getNodeArrayPositionByIdOriginal(id){
	for(var i = 0; i<fcafox_originalLatticeDataSet.nodes.length; i++){
		if(fcafox_originalLatticeDataSet.nodes[i].id == id)
			return i;
	}
	return -1;
}

// needed to remove links on update
function fcafox_getLinkArrayPositionById(id){
	for(var i = 0; i<fcafox_currentLatticeDataSet.links.length; i++){
		if(fcafox_currentLatticeDataSet.links[i].id == id)
			return i;
	}
	return -1;
}

//needed to remove links on update
function fcafox_getLinkArrayPositionByIdOriginal(id){
	for(var i = 0; i<fcafox_originalLatticeDataSet.links.length; i++){
		if(fcafox_originalLatticeDataSet.links[i].id == id)
			return i;
	}
	return -1;
}

