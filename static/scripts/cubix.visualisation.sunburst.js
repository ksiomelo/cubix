/*
 * Sunburst
 */

var sunburstVis = new function() {
	
	
	this.config = {
	};

	var partition;
	var path;
	var sbLabel;
	
	var p = 5;
	var arc = d3.svg.arc()
		    .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x))); })
		    .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx))); })
		    .innerRadius(function(d) { return Math.max(0, y(d.y)); })
		    .outerRadius(function(d) { return Math.max(0, y(d.y + d.dy)); });
	
	var r,x,y;
	
	
	
	this.run = function(){
		
		d3.select("#chart").html("");
		
		// w = 960;
	    // h = 500;
	    r = Math.min(w, h) / 2;
	    x = d3.scale.linear().range([0, 2 * Math.PI]);
	    y = d3.scale.sqrt().range([0, r]);
	    color = mapColor;//d3.scale.category20c();
		
		// uncomment to disable pan & zoom
		// vis = d3.select("#chart").append("svg:svg")
		    // .attr("width", w)
		    // .attr("height", h)
		  // .append("svg:g")
		    // .attr("transform", "translate(" + w / 2 + "," + h / 2 + ")");
		    
		vis = d3.select("#chart")
		    .on("mousewheel", dagreVis.blockScroll)
		    .on("DOMMouseScroll", dagreVis.blockScroll)
		  .append("svg")
		    .attr("width", "100%")
		    .attr("height", 500)
		    .attr("pointer-events", "all")
		    .call(zoomBehavior.on("zoom", redraw))
		    .append("g")
		    .attr("transform", "translate(" + w / 2 + "," + h / 2 + ")");
		    
		    
		    
		 partition = d3.layout.partition()
	     .sort(null)
	     //.size([2 * Math.PI, radius * radius])
	     .value(function(d) { return 1; });
		    

        var json = lattice.tree;// lattice.concepts[0]; //  no need to transform :)
        
       	vis.data([json]);
       
        var sbnodes = partition.nodes(json);
        
        path = vis.selectAll("path.sb")
	      .data(partition.nodes, function(d){ return d.id});
	      
 		path.enter().append("svg:path")
 			.attr("class", "concept sb")
 			.attr("id", function(d, i) { return "path-" + i; })
	     	.attr("d", arc)
	      	.style("fill", getNodeColor)
	      	.on("mouseover", nodeMouseOver)
		  	.on("mouseout", nodeMouseOut)
		  	.on("click", nodeClick)
	   		.on("dblclick", sunburstVis.sbclick);
	   	
	   	 // Exit any old nodes.
	  		path.exit().remove();
	 
	 // start
	  		
	  sbLabel = vis.selectAll("g .ulabelgroup").data(sbnodes);
	  var textEnter = sbLabel.enter().append("svg:g")
	  	  .attr("id", function(d) { return "labelbox-" + d.id; })
		  .attr("class", "ulabelgroup")
	      .on("click", nodeClick)
	      .on("dblclick", sunburstVis.sbclick);
	 
	 textEnter.each(dagreVis.labelTextElements);  // use DagreVis function to append text boxes for each label in each concept   
	 
	  // We need width and height for each label box.
	  textEnter.each(function(d) { //labels.each
	    var bbox = this.getBBox();
	    d.bbox = bbox;
	    d.width = d.lwidth;//bbox.width + 2 * nodePadding;
	    d.height = d.lheight;//bbox.height + 2 * nodePadding;
	  });
	 
	 bitsign = -1;
	 
	 // rotate axis for the labels (+ chose non-overlapping position)
	 textEnter.attr("text-anchor", function(d) {
	        return x(d.x + d.dx / 2) > Math.PI ? "end" : "start";
	      })
	 // .attr("x", function(d) { return -50; })
	 // .attr("y", function(d) { return -50; })
	 .attr("dy", ".2em")
	 .attr("transform", function(d) {
	        var multiline = getUpperLabel(d).length > 1,
	            angle = x(d.x + d.dx / 2) * 180 / Math.PI - 90,
	            rotate = angle + (multiline ? -.5 : 0);
	            // new_y = (d.parent != null) ? bitsign*(d.parent.width + p) : p;
	            // bitsign = -1*bitsign;
	        return "rotate(" + rotate + ")translate(" + (y(d.y) + p) + ","+(x(d.x))+")rotate(" + (angle > 90 ? -180 : 0) + ")";
	     });
	 
		
	};
	
	
	this.sbclick = function(d) {
	    path.transition()
	      .duration(750)
	      .attrTween("d", sunburstVis.arcTween(d));
	
	    // Somewhat of a hack as we rely on arcTween updating the scales.
	    sbLabel
	      .style("visibility", function(e) {
	        return isParentOf(d, e) ? null : d3.select(this).style("visibility");
	      })
	      .transition().duration(750)
	      .attrTween("text-anchor", function(d) {
	        return function() {
	          return x(d.x + d.dx / 2) > Math.PI ? "end" : "start";
	        };
	      })
	      .attrTween("transform", function(d) {
	        var multiline = (d.name || "").split(" ").length > 1;
	        return function() {
	          var angle = x(d.x + d.dx / 2) * 180 / Math.PI - 90,
	              rotate = angle + (multiline ? -.5 : 0);
	          return "rotate(" + rotate + ")translate(" + (y(d.y) + p) + ")rotate(" + (angle > 90 ? -180 : 0) + ")";
	        };
	      })
	      .style("opacity", function(e) { return isParentOf(d, e) ? 1 : 1e-6; })
	      .each("end", function(e) {
	        d3.select(this).style("visibility", isParentOf(d, e) ? null : "hidden");
	      });
	 };
	
	
	// Interpolate the scales!
	this.arcTween = function(d) {
	  var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
	      yd = d3.interpolate(y.domain(), [d.y, 1]),
	      yr = d3.interpolate(y.range(), [d.y ? 20 : 0, r]);
	  return function(d, i) {
	    return i
	        ? function(t) { return arc(d); }
	        : function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); return arc(d); };
	  };
	};

};