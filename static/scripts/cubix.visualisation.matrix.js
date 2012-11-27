/*
 *  This class contains LATTICE visualisation algorithms
 */


var matrixVis = new function() {
	
	
	this.config = {
		margin : {top: 80, right: 0, bottom: 10, left: 80},
		width : 60,
		height : 12
	};
	
	var x = d3.scale.ordinal().rangeBands([0, w]),
	y = d3.scale.ordinal().rangeBands([0, h]),
		    z = d3.scale.linear().domain([0, 4]).clamp(true),
		    c = d3.scale.category10().domain(d3.range(10));
		    
	var m; 
	var n;

	this.run = function(){
		
		m = context.objects.length;
		n = context.attributes.length;
		
		d3.select("#chart").html("");
		
	  	vis = d3.select("#chart")
		  .append("svg:svg")
		    .attr("width", w + matrixVis.config.margin.left + matrixVis.config.margin.right)
		    .attr("height", h + matrixVis.config.margin.top + matrixVis.config.margin.bottom)
		    .style("margin-left", -matrixVis.config.margin.left + "px")
		  .append("g")
		    .attr("transform", "translate(" + matrixVis.config.margin.left + "," + matrixVis.config.margin.top + ")");
		  

		//d3.json("miserables.json", function(miserables) {
		  var matrix = []; //,
		  
		      // nodes = miserables.nodes,
		      // n = nodes.length;
		
		  // Compute index per node.
		  context.objects.forEach(function(attr, i) {
		    //node.index = i;
		    //node.count = 0;
		    matrix[i] = d3.range(n).map(function(j) { return {x: j, y: i, z: 0}; });
		  });
		
		  for (var i=0; i < context.rel.length; i++) {
		  	for (var j=0; j < context.rel[i].length; j++) {
				matrix[i][j].z = (context.rel[i][j]) ? 1 : 0;
			 };
		  };
		  
		  lattice.concepts.forEach(function(concept) {
		  	for (var i=0; i < concept.intent.length; i++) {
				 
				 
				 for (var j=0; j < concept.extent.length; j++) {
				   var idxi = context.attributes.indexOf(concept.intent[i]);
				   var idxe = context.objects.indexOf(concept.extent[j]);
				   
				   if (typeof matrix[i][j].concepts == "undefined") matrix[i][j].concepts = [];
				   matrix[i][j].concepts.push(concept);
				   
				 };
				 
			  };
		  });
		  
		  // // Convert links to matrix; count character occurrences.
		  // miserables.links.forEach(function(link) {
		    // matrix[link.source][link.target].z += link.value;
		    // matrix[link.target][link.source].z += link.value;
		    // matrix[link.source][link.source].z += link.value;
		    // matrix[link.target][link.target].z += link.value;
		    // nodes[link.source].count += link.value;
		    // nodes[link.target].count += link.value;
		  // });
		
		  // Precompute the orders.
		  // var orders = {
		    // name: d3.range(n).sort(function(a, b) { return d3.ascending(nodes[a].name, nodes[b].name); }),
		    // count: d3.range(n).sort(function(a, b) { return nodes[b].count - nodes[a].count; }),
		    // group: d3.range(n).sort(function(a, b) { return nodes[b].group - nodes[a].group; })
		  // };
		
		  // The default sort order.
		  //x.domain(orders.name);
		
		  vis.append("rect")
		      .attr("class", "background")
		      .attr("width", w)
		      .attr("height", h);
		
		  var row = vis.selectAll(".row")
		      .data(matrix)
		    .enter().append("g")
		      .attr("class", "row")
		      .attr("transform", function(d, i) { return "translate(0," + i*(h/m) + ")"; })
		      .each(this.row);
		
		  row.append("line")
		      .attr("x2", w);
		
		  row.append("text")
		      .attr("x", -6)
		      .attr("y",  (h/m) / 2)
		      .attr("dy", ".32em")
		      .attr("text-anchor", "end")
		      .text(function(d, i) { return context.objects[i]; });
		
		  var column = vis.selectAll(".column")
		      .data(matrix[0])
		    .enter().append("g")
		      .attr("class", "column")
		      .attr("transform", function(d, i) { return "translate(" + (w/n)*i + ")rotate(-90)"; });
		
		  column.append("line")
		      .attr("x1", -h);
		
		  column.append("text")
		      .attr("x", 6)
		      .attr("y", (w/n) / 2)
		      .attr("dy", ".32em")
		      .attr("text-anchor", "start")
		      .text(function(d, i) { return context.attributes[i]; });
	}
	
		
	  this.row = function(row) {
	    var cell = d3.select(this).selectAll(".cell")
	        .data(row)//.filter(function(d) { return (d.z == 1); }))
	      .enter().append("g")
	   
	   // cell.append("rect")
	        // .attr("class", "cell")
	        // .attr("x", function(d) { return (w/n)*(d.x); }) // TODO x(d.x)
	        // .attr("width", (w/n))
	        // .attr("height", (h/m))
	        // .style("fill-opacity", function(d) { return .2; })
	        // .style("fill", function(d){ return "#0000FF"; })//function(d) { return nodes[d.x].group == nodes[d.y].group ? c(nodes[d.x].group) : null; })
	        // .on("mouseover", this.mouseover)
	        // .on("mouseout", this.mouseout);
	      .each(function(d){
	      	
	        if (typeof d.concepts == "undefined") return;
	      	for (var idx=0; idx < d.concepts.length; idx++) {
				// d.concepts[idx]
			 
		      	d3.select(this).append("rect")
		        .attr("class", "cell")
		        .attr("x", function(d) { return (w/n)*(d.x); }) // TODO x(d.x)
		        .attr("width", (w/n))
		        .attr("height", (h/m))
		        .style("fill-opacity", function(d) { return .2; })
		        .style("fill", function(d){ return mapColor(d.concepts[idx].id); })//function(d) { return nodes[d.x].group == nodes[d.y].group ? c(nodes[d.x].group) : null; })
		        .on("mouseover", this.mouseover)
		        .on("mouseout", this.mouseout);
	        
	         };
	      });
	    
	   
	    
	  }
	
	  this.mouseover = function(p) {
	    d3.selectAll(".row text").classed("active", function(d, i) { return i == p.y; });
	    d3.selectAll(".column text").classed("active", function(d, i) { return i == p.x; });
	  }
	
	  this.mouseout = function() {
	    d3.selectAll("text").classed("active", false);
	  }
	
	  // d3.select("#order").on("change", function() {
	    // clearTimeout(timeout);
	    // order(this.value);
	  // });
	
	  // function order(value) {
	    // x.domain(orders[value]);
// 	
	    // var t = svg.transition().duration(2500);
// 	
	    // t.selectAll(".row")
	        // .delay(function(d, i) { return x(i) * 4; })
	        // .attr("transform", function(d, i) { return "translate(0," + x(i) + ")"; })
	      // .selectAll(".cell")
	        // .delay(function(d) { return x(d.x) * 4; })
	        // .attr("x", function(d) { return x(d.x); });
// 	
	    // t.selectAll(".column")
	        // .delay(function(d, i) { return x(i) * 4; })
	        // .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });
	  // }
// 	
	  // var timeout = setTimeout(function() {
	    // order("group");
	    // d3.select("#order").property("selectedIndex", 2).node().focus();
	  // }, 5000);



}





