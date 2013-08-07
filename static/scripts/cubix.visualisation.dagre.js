/*
 *  This class contains LATTICE visualisation algorithms
 */

var zoomBehavior = d3.behavior.zoom();
var dagreVis = new function() {
	
	
	this.config = {
		displayLabels : true,
		nodePadding : 10,
		widthLabelBox : 60,
		paddingToNode : 12
	
	};

	this.run = function(){
		
		d3.select("#chart").html("");
		
		vis = d3.select("#chart")
		    .on("mousewheel", this.blockScroll)
		    .on("DOMMouseScroll", this.blockScroll)
		  .append("svg")
		    .attr("width", "100%")
		    .attr("height", 500)
		    .attr("pointer-events", "all")
		    .call(zoomBehavior.on("zoom", redraw))
		    .append("g");
		
		
	  	// vis = d3.select("#chart")
		  // .append("svg:svg")
		    // .attr("width", w)
		    // .attr("height", h)
		    // .attr("viewBox", "0 0 "+w+" "+h)
	    	// .attr("preserveAspectRatio", "xMidYMid")
		    // //.attr("pointer-events", "all")
		  // .append('svg:g')
		    // //.call(d3.behavior.zoom().on("zoom", redraw));
// 		    
		// //vis.append('svg:g');
		
		
		/// not used:
		
		// vis.append('svg:rect')
		    // .attr('width', w)
		    // .attr('height', h)
		    // .attr('fill', 'white');
// 		    
		    
		// reset edges info (e.g. in case of filtering)
		lattice.concepts.forEach(function(d) {
			d.edges = [];
		});
		
		// re add
		lattice.edges.forEach(function(d) {
	
			if( typeof d.source === "number") {
				d.source = lattice.concepts[d.source];
				d.target = lattice.concepts[d.target];
			}
			d.source.edges.push(d);
			d.target.edges.push(d);
		});
	
	
		var dedges = vis
		    .selectAll("path .dedge")
		    .data(lattice.edges)
		    .enter()
		      .append("path")
		      .attr("class", "dedge")
		      .style("stroke-width", getEdgeThickness)
		     .attr("source_id", function(d) { return d.source.id; })
		      .attr("target_id", function(d) { return d.target.id; });
		
		
		var dnodes = vis
		    .selectAll("circle .concept")
		    .data(lattice.concepts)
		    .enter()
		      .append("circle")
		      .attr("class", "concept node")
		      .style("fill", getNodeColor)
		      .attr("x", function(d) { return -10; })
				.attr("y", function(d) { return -10; })
				.attr("r", getNodeSize)
		      .attr("id", function(d) { return "node-" + d.id })
		      .on("click", this.nodeClick)
			  .on("mouseover", this.nodeMouseOver)
		      .on("mouseout", this.nodeMouseOut);
	       
	    	
	    	 //Append text
	  	// var upperLabelbox = vis
		    // .selectAll("g .ulabelgroup")
		    // .data(lattice.concepts)
		    // .enter()
		      // .append("svg:g") //d.pos.x, y: d.pos.y
		        // .attr("id", function(d) { return "labelbox-" + d.id })
			    // .attr("class", "ulabelgroup");
// 			    
		// upperLabelbox.append('rect')
			    // .attr("class", "labelbox")
			    // .attr("width", function(d) { return dagreVis.config.widthLabelBox; })
			    // .attr("height", function(d) { return 20; });
		// upperLabelbox.append("text") //d.pos.x, y: d.pos.y
		        // .attr("id", function(d) { return "intent-" + d.id })
			    // .attr("class", "intent")
			    // .attr("x", 4) // TODO verify the bbox.width of the text to position it
		    	// .attr("y", -dagreVis.config.paddingToNode)
		    	// .text(get_upper_label);
		    	
		    	
		// var lowerLabelbox = vis
		    // .selectAll("g .llabelgroup")
		    // .data(lattice.concepts)
		    // .enter()
		      // .append("svg:g") //d.pos.x, y: d.pos.y
		        // .attr("id", function(d) { return "labelbox-" + d.id })
			    // .attr("class", "llabelgroup");
// 			    
		// lowerLabelbox.append('rect')
			    // .attr("class", "labelbox")
			    // .attr("width", function(d) { return dagreVis.config.widthLabelBox; })
			    // .attr("height", function(d) { return 20; });
		// lowerLabelbox.append("text") //d.pos.x, y: d.pos.y
		        // .attr("id", function(d) { return "extent-" + d.id })
			    // .attr("class", "intent")
			    // .attr("x", 4) // TODO verify the bbox.width of the text to position it
		    	// .attr("y", dagreVis.config.paddingToNode)
		    	// .text(get_lower_label);
// 			    
	
	
		var upperLabelbox = vis
			    .selectAll("text .intent")
			    .data(lattice.concepts)
			    .enter()
			    .append('text')
		        .attr("id", function(d) { return "intent-" + d.id })
			    .attr("class", "nlabel intent")
			    .attr("x", 4) // TODO verify the bbox.width of the text to position it
		    	.attr("y", this.getLabelPosition)//-dagreVis.config.paddingToNode)
		    	.text(get_upper_label);

		var lowerLabelbox = vis
			    .selectAll("text .extent")
			    .data(lattice.concepts)
			    .enter()
			    .append('text')
		        .attr("id", function(d) { return "extent-" + d.id })
			    .attr("class", "nlabel extent")
			    .attr("x", 4) // TODO verify the bbox.width of the text to position it
		    	.attr("y", dagreVis.config.paddingToNode)
		    	.text(get_lower_label);
		
		// lowerLabelbox
			    // .selectAll("tspan .extent")
			    // .data(d.extent)
			    // .enter()
			    // .append('tspan')
			    // .attr("class", "extent")
			    // //.attr("x", 4) // TODO verify the bbox.width of the text to position it
		    	// //.attr("y", dagreVis.config.paddingToNode);
		    	// .text(d);
	
	
	  // We need width and height for layout.
	  dnodes.each(function(d) { //labels.each
	    var bbox = this.getBBox();
	    d.bbox = bbox;
	    d.width = getNodeSize(d);//bbox.width + 2 * nodePadding;
	    d.height = getNodeSize(d);//bbox.height + 2 * nodePadding;
	  });
	
	
	  dagre.layout()
	  	.nodeSep(50)
	    .edgeSep(10)
	    .rankSep(80)
	    .invert(true)
	    .nodes(lattice.concepts)
	    .edges(lattice.edges)
	    .debugLevel(1)
	    .run();
	
	  dnodes.attr("transform", function(d) { return "translate(" + d.dagre.x + "," + d.dagre.y +")"; });
	  
	  
	  dedges
	    // Set the id. of the SVG element to have access to it later
	    .attr('id', function(e) { return "edge-"+e.dagre.id; })
	    .attr("d", function(e) { return dagreVis.spline(e); });
	    
	    
	 	upperLabelbox.attr("transform", function(d) { return "translate(" + (d.dagre.x-dagreVis.config.widthLabelBox/2) + "," +
	 	 														 (d.dagre.y-dagreVis.config.paddingToNode) +")"; });
	 	 					
	 	lowerLabelbox.attr("transform", function(d) { return "translate(" + (d.dagre.x-dagreVis.config.widthLabelBox/2) + "," +
	 	 														 (d.dagre.y+dagreVis.config.paddingToNode) +")"; });
	  
	
	  // Resize the SVG element
	  var svg = d3.select("#chart").select("svg");
	  var svgBBox = svg.node().getBBox();
	  
	  svg.attr("viewBox", "0 0 "+svgBBox.width+" "+h)
	  //svg.attr("width", 500 + 10);
	  //svg.attr("height", 400 + 10);
	  
	  // Drag handlers
	  var nodeDrag = d3.behavior.drag()
	    // Set the right origin (based on the Dagre layout or the current position)
	    .origin(function(d) { return d.pos ? {x: d.pos.x, y: d.pos.y} : {x: d.dagre.x, y: d.dagre.y}; })
	    .on('dragstart', function() {
	    	//console.log("drag started"); dragging = true;
	    	vis.on('mousedown.zoom', null);
	    	vis.on('mousemove.zoom', null);
	    	d3.event.sourceEvent.stopPropagation();
	    	//vis.on('mousedown.zoom', null);
	    })
	    .on('dragend', function() {
	    	console.log("drag ended"); dragging = false;
	    })
	    .on('drag', function (d, i) {
	      var prevX = d.dagre.x,
	          prevY = d.dagre.y;
	
	      // The node must be inside the SVG area
	      d.dagre.x = Math.max(d.width / 2, Math.min(svgBBox.width - d.width / 2, d3.event.x));
	      d.dagre.y = Math.max(d.height / 2, Math.min(svgBBox.height - d.height / 2, d3.event.y));
	      d3.select(this).attr('transform', 'translate('+ d.dagre.x +','+ d.dagre.y +')');
	
	      var dx = d.dagre.x - prevX,
	          dy = d.dagre.y - prevY;
	
	      // Edges position (inside SVG area)
	      d.edges.forEach(function(e) {
	        dagreVis.translateEdge(e, dx, dy);
	        d3.select('#edge-'+ e.dagre.id).attr('d', dagreVis.spline(e));
	      });
	      
	      // TODO translate label groups if not lpos (ie. dragged)
	      d3.select("#intent-"+d.id).attr('transform', 'translate('+ (d.dagre.x-dagreVis.config.widthLabelBox/2) +','+
	       (d.dagre.y-dagreVis.config.paddingToNode) +')');
	      
	      d3.select("#extent-"+d.id).attr('transform', 'translate('+ (d.dagre.x-dagreVis.config.widthLabelBox/2) +','+
	       (d.dagre.y+dagreVis.config.paddingToNode) +')');
	       
	    });
	
	  // var edgeDrag = d3.behavior.drag()
	    // .on('drag', function (d, i) {
	      // dagreVis.translateEdge(d, d3.event.dx, d3.event.dy);
	      // d3.select(this).attr('d', dagreVis.spline(d));
	    // });
	    
	    
	    
	    var labelDrag = d3.behavior.drag()
	    			//.origin(function(d) { return d.lpos ? {x: d.lpos.x, y: d.lpos.y} : {x: d.dagre.x, y: d.dagre.y}; })
		          .on("dragstart", function(d) {
		            this.__originx__ = (d.lpos) ? d.lpos.x : d.dagre.x-dagreVis.config.widthLabelBox/2;
		            this.__originy__ = (d.lpos) ? d.lpos.y : d.dagre.y-dagreVis.config.paddingToNode ;
		          })
		          .on("drag", function(d) {
		          	
				
		            d.lpos = { x : Math.max(0, Math.min(this.__originx__ += d3.event.dx, w)),
		            			y : Math.max(0, Math.min(this.__originy__ += d3.event.dy, h))} ;
		            
		             d3.select(this).attr('transform', 'translate('+ d.lpos.x +','+ d.lpos.y +')');
		            
		          });
	
	  dnodes.call(nodeDrag);
	  //dedges.call(edgeDrag);
	  upperLabelbox.call(labelDrag);
  
	};
	
	this.getLabelPosition = function() {
		return -Math.round(Math.random()*(50-10)) + 10;
	};
	
	this.blockScroll = function() { d3.event.preventDefault(); };
	
	this.move = function(){
	    this.parentNode.appendChild(this);
	    var dragTarget = d3.select(this);
	    dragTarget
	        .attr("cx", function(){return d3.event.dx + parseInt(dragTarget.attr("cx"))})
	        .attr("cy", function(){return d3.event.dy + parseInt(dragTarget.attr("cy"))});
	};
	

	this.spline = function(e) {
	    var points = e.dagre.points.slice(0);
	    var source = dagre.util.intersectRect(e.source.dagre, points.length > 0 ? points[0] : e.source.dagre);
	    var target = dagre.util.intersectRect(e.target.dagre, points.length > 0 ? points[points.length - 1] : e.source.dagre);
	    points.unshift(source);
	    points.push(target);
		
		pts = [source,target];
	
	    return d3.svg.line()
	      .x(function(d) { return d.x; })
	      .y(function(d) { return d.y; })
	      .interpolate("linear")
	      (pts);//(points);
  	}
  
	 // Translates all points in the edge using `dx` and `dy`.
	this.translateEdge = function(e, dx, dy) {
	    e.dagre.points.forEach(function(p) {
	      p.x = Math.max(0, Math.min(800, p.x + dx));
	      p.y = Math.max(0, Math.min(600, p.y + dy));
	    });
	}
	
	
	
	
  	
  	/*
	 * Node mouse events 
	 * 
	 */
	this.nodeMouseOver = function(d){
		//var oi = d3.select(this).select("circle");
		d3.select(this).transition()
	            .duration(250)
		    .attr("r", function(d,i) { 
		    	return 2*getNodeSize(d);
		    	//if(d.id==focalNodeID) {return 65;} else {return 15;} 
		    	} );
		// d3.select(this).select("text").transition()
	            // .duration(250)
	    // .style("font", "bold 20px Arial")
	    // .attr("fill", "Blue");
		
		nodeMouseOver(d);
		
		d3.select(this).classed("hover", true);

		if (highlightPath) {
			visitEdgesDown(d,function(l) {
				d3.select("path.dedge[source_id=\""+l.source.id+"\"][target_id=\""+l.target.id+"\"]").classed("highlighted", true);
			});
		}
		
	}
	
	this.nodeMouseOut = function(d){
		
		d3.select(this).transition()
	            .duration(250)
		    .attr("r", function(d,i) { 
		    	return getNodeSize(d);
		    	//if(d.id==focalNodeID) {return 65;} else {return 15;} 
		    	} );
		
		nodeMouseOut(d);
		
		d3.select(this).classed("hover", false);
		
		d3.selectAll("path.dedge.highlighted").classed("highlighted", false);
	
	}
	
	
	this.nodeClick = function(d){ // select node	
		
		
		nodeClick(d);
		//d3.select(this).classed("selected", !nodeClick(d));
		
		
		
		
		// d3.select(this).classed("selected", function(){ 
			// if (this.classList.contains("selected")) {
				// return false;
			// } else {
				// return true
			// }
// 			
		// });
		
	}




}





