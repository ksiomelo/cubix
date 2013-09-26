/*
 * ICicle
 */

var icicleVis = new function() {
	
	
	this.config = {
		// displayLabels : true,
		// nodePadding : 10,
		// widthLabelBox : 60,
		// paddingToNode : 30
	
	};
	
	var thisHeight = 500; // fixed height
	
	
	var  x = d3.scale.linear().range([0, w]),
	    y = d3.scale.linear().range([0, thisHeight]);

	var partition, kx, ky, g;
	
	this.run = function(){
		
		d3.select("#chart").html("");
		
		
		// vis = d3.select("#chart")
			// // .append("div")
		    // // .attr("class", "icicle")
		    // // .style("width", w + "px")
		    // // .style("height", h + "px")
		    // .append("svg:svg")
		    	// .attr("width", w)
		    	// .attr("height", h);
		
		
		
		vis = d3.select("#chart")
		    .on("mousewheel", dagreVis.blockScroll)
		    .on("DOMMouseScroll", dagreVis.blockScroll)
		  .append("svg")
		    .attr("width", "100%")
		    .attr("height", thisHeight)
		    .attr("pointer-events", "all")
		    .call(zoomBehavior.on("zoom", redraw))
		    .append("g");
		    	
		
		partition = d3.layout.partition()
	    .value(function(d) { return 1; });
	    
	    
	    var root = lattice.tree;
	    
	    vis.data([root]);

		//var sbnodes = partition.nodes(json);
	    
	    g = vis.selectAll("g")
	      .data(partition.nodes(root))
	    .enter().append("svg:g")
	      .attr("transform", function(d) { return "translate(" + x(d.y) + "," + y(d.x) + ")"; })
	      .on("mouseover", nodeMouseOver)
		  .on("mouseout", nodeMouseOut)
		  .on("click", nodeClick)
	      .on("dblclick", icicleVis.icicleClick);
	      
	
	  kx = w / root.dx;
	  ky = thisHeight / 1; 
	
	  g.append("svg:rect")
	      .attr("width", root.dy * kx)
	      .attr("height", function(d) { return d.dx * ky; })
	      .style("fill", getNodeColor)
	      //.attr("class", function(d) { return d.children ? "parent" : "child"; });
	      .attr("class", "concept sb");
	
	  g.append("svg:text")
	      .attr("transform", icicleVis.transform)
	      .attr("dy", ".35em")
	      .attr("class", "nlabel intent")
	      .style("opacity", function(d) { return d.dx * ky > 12 ? 1 : 0; })
	      .text(function(d) { 
	      	var label= getUpperLabel(d).join(", "); 
	      	return (label.length > 30 && w < MAXIMIZED_WIDTH) ? label.substring(0,30) + "..." : label;
	      	});
	  
	   // d3.select(window)
	      // .on("click", function() { click(root); })
		
	};


	
	  this.icicleClick = function(d) {
	    if (!d.children) return;
	
	    kx = (d.y ? w - 40 : w) / (1 - d.y);
	    ky = thisHeight / d.dx;
	    x.domain([d.y, 1]).range([d.y ? 40 : 0, w]);
	    y.domain([d.x, d.x + d.dx]);
	
	    var t = g.transition()
	        .duration(d3.event.altKey ? 7500 : 750)
	        .attr("transform", function(d) { return "translate(" + x(d.y) + "," + y(d.x) + ")"; });
	
	    t.select("rect")
	        .attr("width", d.dy * kx)
	        .attr("height", function(d) { return d.dx * ky; });
	
	    t.select("text")
	        .attr("transform", icicleVis.transform)
	        .style("opacity", function(d) { 
	        	return d.dx * ky > 12 ? 1 : 0; 
	        	});
	
	    d3.event.stopPropagation();
	  }; 
	
	  this.transform = function(d) {
	    return "translate(8," + d.dx * ky / 2 + ")";
	  };
	
};
