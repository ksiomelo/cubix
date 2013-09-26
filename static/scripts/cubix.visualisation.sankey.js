
/*
 * Sankey Visualisation
 */

var sankeyVis = new function() {
	
	var sankey, skpath, link;
	
	
	this.config = {
		nodeWidth : 15,
		nodePadding : 10
	};

	this.run = function(){
		
		vis = d3.select("#chart").append("svg")
	    .attr("width", w)
	    .attr("height", h)
	    .append("g");
	    //.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	    
		sankey = d3.sankey()
		    .nodeWidth(this.config.nodeWidth)
		    .nodePadding(this.config.nodePadding)
		    .size([w, h]);
	    
	    skpath = sankey.link();
	    
	    sankey
	      .nodes(lattice.concepts)
	      .links(lattice.edges)
	      .layout(32);

	  link = vis.append("g").selectAll(".sklink")
	      .data(lattice.edges)
	    .enter().append("path")
	      .attr("class", "sklink")
	      .attr("source_id", function(d) { return d.source_id;})
	      .attr("target_id", function(d) { return d.target_id;})
	      .attr("d", skpath)
	      .style("stroke-width", function(d) { return getEdgeThickness(d)*1.5;  }) //Math.max(1, d.dy);
	      .sort(function(a, b) { return b.dy - a.dy; });
	
	  link.append("title")
	      .text(function(d) { 
	      	var val = getEdgeValue(d);
	      	if (val < 0)  return d.source.name + " → " + d.target.name + "\n";
	      	else return edge_type+": "+ val*100 + "%";
	      	}); 
	
	  var node = vis.append("g").selectAll(".sknode")
	      .data(lattice.concepts)
	    .enter().append("g")
	      .attr("class", "sknode")
	      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
	      .on("click", this.nodeClick)
		  .on("mouseover", this.nodeMouseOver)
	      .on("mouseout", this.nodeMouseOut)
	    .call(d3.behavior.drag()
	      .origin(function(d) { return d; })
	      .on("dragstart", function() { this.parentNode.appendChild(this); })
	      .on("drag", this.dragmove));
	
	  node.append("rect")
	  	  .attr("class", "concept")
	  	  .attr("id", function(d) { return "node-"+d.id})
	      .attr("height", function(d) { return d.dy; })
	      .attr("width", sankey.nodeWidth())
	      .style("fill", function(d) { return d.color = getNodeColor(d);  }) //color(d.name.replace(/ .*/, ""));
	      //.style("stroke", function(d) { return d3.rgb(d.color).darker(2); })
	    .append("title")
	      .text(function(d) { return d.name + "\n" ; });
	
	  node.append("text")
	      .attr("x", -6)
	      .attr("y", function(d) { return d.dy / 2; })
	      .attr("dy", ".35em")
	      .attr("text-anchor", "end")
	      .attr("transform", null)
	      .text(function(d) { return d.name; })
	    .filter(function(d) { return d.x < w / 2; })
	      .attr("x", 6 + sankey.nodeWidth())
	      .attr("text-anchor", "start");
	};
	
	this.dragmove = function(d) {
	    d3.select(this).attr("transform", "translate(" + d.x + "," + (d.y = Math.max(0, Math.min(h - d.dy, d3.event.y))) + ")");
	    sankey.relayout();
	    link.attr("d", skpath);
  };
  	
  	
  	/*
	 * Node mouse events 
	 * 
	 */
	this.nodeMouseOver = function(d){
		
		nodeMouseOver(d);
		
		d3.select(this).classed("hover", true);

		if (highlightPath) {
			visitEdgesDown(d,function(l) {
				d3.select("path.sklink[source_id=\""+l.source.id+"\"][target_id=\""+l.target.id+"\"]").classed("highlighted", true);
			});
		}
		
	}
	
	this.nodeMouseOut = function(d){
		
		nodeMouseOut(d);
		
		d3.select(this).classed("hover", false);
		
		d3.selectAll("path.sklink.highlighted").classed("highlighted", false);
	
	}
	
	
	this.nodeClick = function(d){ // select node	
		
		nodeClick(d);
		
		// d3.select(this).classed("selected", function(){ 
			// if (this.classList.contains("selected")) {
				// numberSelected--;
				// return false;
			// } else {
				// numberSelected++;
				// return true
			// }
// 			
		// });
		
	}
  	
  	
  	
	
};