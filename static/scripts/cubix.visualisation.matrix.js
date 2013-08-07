/*
 *  This class contains LATTICE visualisation algorithms
 */


var matrixVis = new function() {
	
	
	this.config = {
		margin : {top: 80, right: 0, bottom: 10, left: 100},
		width : 60,
		height : 12
	};
	
	var x = d3.scale.ordinal().rangeBands([0, w]),
	y = d3.scale.ordinal().rangeBands([0, h]),
		    z = d3.scale.linear().domain([0, 4]).clamp(true),
		    c = d3.scale.category10().domain(d3.range(10));
		    
	var m; 
	var n;
	
	this.matrix = [];

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
		 // var matrix = []; //,
		  
		      // nodes = miserables.nodes,
		      // n = nodes.length;
		
		  // Compute index per node.
		  context.objects.forEach(function(attr, i) {
		    //node.index = i;
		    //node.count = 0;
		    matrixVis.matrix[i] = d3.range(n).map(function(j) { return {x: j, y: i, z: 0}; });
		  });
		
		  for (var i=0; i < context.rel.length; i++) {
		  	for (var j=0; j < context.rel[i].length; j++) {
				matrixVis.matrix[i][j].z = (context.rel[i][j]) ? 1 : 0;
			 };
		  };
		  
		  lattice.concepts.forEach(function(concept) {
		  	for (var i=0; i < concept.intent.length; i++) {
				 
				 
				 for (var j=0; j < concept.extent.length; j++) {
				   var idxi = context.attributes.indexOf(concept.intent[i]);
				   var idxe = context.objects.indexOf(concept.extent[j]);
				   
				   if (typeof matrixVis.matrix[idxe][idxi].concepts == "undefined") matrixVis.matrix[idxe][idxi].concepts = [];
				   matrixVis.matrix[idxe][idxi].concepts.push(concept);
				   
				 };
				 
			  };
		  });
		  
		  vis.append("rect")
		      .attr("class", "background")
		      .style("fill", "#FFFFFF")
		      .attr("width", w)
		      .attr("height", h);
		
		  var row = vis.selectAll(".row")
		      .data(matrixVis.matrix)
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
		      .data(matrixVis.matrix[0])
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
	    var cell = d3.select(this).selectAll("g.cell")
	        .data(row)//.filter(function(d) { return (d.z == 1); }))
	      .attr("class", "cell")
	      .enter().append("g")
	   
	      .each(function(d){
	      	
	        if (typeof d.concepts == "undefined") return;
	      	for (var idx=0; idx < d.concepts.length; idx++) {
				// d.concepts[idx]
			 
		      	d3.select(this).append("rect")
		        //.attr("class", "concept_cell")
		        .attr("class", function(d){ return "ccel-"+d.concepts[idx].id;})
		        .attr("x", function(d) { return (w/n)*(d.x); }) // TODO x(d.x)
		        .attr("width", (w/n) - idx*20)
		        .attr("height", (h/m) - idx*20)
		        //.style("fill-opacity", function(d) { return .4; })
		        .style("fill", function(d){ return p(d.concepts[idx].id); })//function(d) { return nodes[d.x].group == nodes[d.y].group ? c(nodes[d.x].group) : null; })
		        .on("click", function(d){ 
		        	matrixVis.ordercolumns(d3.select(this).attr("class").split("-")[1]); 
		        	})
		        .on("mouseover", function(d){ 
		        	var ccels = d3.selectAll("rect."+d3.select(this).attr("class"));
		        	ccels.style("stroke-width", 2);
		        	ccels.style("stroke", "#FF0000"); 
		        	})
		        .on("mouseout", function(d){ 
		        	//d3.select(this).style("stroke-width", 2);
		        	var ccels = d3.selectAll("rect."+d3.select(this).attr("class"));
		        	ccels.style("stroke", null); 
		        	});
	        
	         };
	      });
	    
	   
	    
	  }
	  
	  
	  var hasConcept = function(d, conceptId) {
	  	if (typeof d.concepts != 'undefined') { 
		  	for (var i = 0; i < d.concepts.length; i++) {
		  		if (d.concepts[i].id == conceptId) return true;
		  	}
	  	}
	  	return false;
	  };
	  
	  this.ordercolumns = function(conceptId){
	  	//var x = d3.scale.ordinal().rangeBands([0, width]);
	  	var n = lattice.concepts.length;
	  	var objCount = context.objects.length;
	  	var attrCount = context.attributes.length;
	  	
	  	
	  	
	  	x.domain(d3.range(attrCount).sort(function(a, b) { 
	  		
	  		for (var i=0; i< objCount; i++) {
	  			var hc1 = hasConcept(matrixVis.matrix[i][a], conceptId);
	  			var hc2 = hasConcept(matrixVis.matrix[i][b], conceptId);
	  			
	  			if  (hc1 && hc2) return 0;
	  		}
	  		
	  		return 1; 
	  	}));
	  	
	  	y.domain(d3.range(objCount).sort(function(a, b) { 
	  		
	  		for (var j=0; j< attrCount; j++) {
	  			var hc1 = hasConcept(matrixVis.matrix[a][j], conceptId);
	  			var hc2 = hasConcept(matrixVis.matrix[b][j], conceptId);
	  			
	  			if  (hc1 && hc2) return 0;
	  		}
	  		
	  		return 1; 
	  	}));
	  		
	  
	    var t = vis.transition().duration(2500);
	
	    t.selectAll(".row")
	        .delay(function(d, i) { return y(i) * 4; })
	        .attr("transform", function(d, i) { return "translate(0," + y(i) + ")"; })
	      .selectAll(".cell")
	        .delay(function(d) { return y(d.x) * 4; })
	        .attr("x", function(d) { return y(d.x); });
	
	
	    // t.selectAll(".column")
	        // .delay(function(d, i) { return x(i) * 4; }) 
	        // .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });
	 
	  };
	
	  this.mouseover = function(p) {
	  		d3.select(p).style("stroke-width", 2);
	    //d3.selectAll(".row text").classed("active", function(d, i) { return i == p.y; });
	    //d3.selectAll(".column text").classed("active", function(d, i) { return i == p.x; });
	  };
	
	  this.mouseout = function() {
	    d3.selectAll("text").classed("active", false);
	  };
	
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





