


function initFDLattice(){
	
	// w = DEFAULT_WIDTH;
	// h = DEFAULT_HEIGHT;
	
	force = d3.layout.force()
        .gravity(0.1)
        .distance(100)
        .charge(-320)
        .on("tick", tick)
        .size([w, h]);
        
    
    vis = d3.select("#chart")
	  .append("svg:svg")
	    .attr("width", w)
	    .attr("height", h)
	    .attr("pointer-events", "all")
	  .append('svg:g')
	    .call(d3.behavior.zoom().on("zoom", redraw))
	  .append('svg:g');
	
	vis.append('svg:rect')
	    .attr('width', w)
	    .attr('height', h)
	    .attr('fill', 'white');
    
    
	
	// vis = d3.select("#chart").append("svg:svg")
	// .attr("width", w)
    // .attr("height", h)
    // .attr("pointer-events", "all")
    // .call(d3.behavior.zoom().on("zoom", redraw));
    // .attr("viewBox", "0 0 "+w+" "+h)
    // .attr("preserveAspectRatio", "xMidYMid");
	
	
	updateFDLattice();
}


function updateFDLattice() {
	   // var nodes = flatten(data),
       // links = d3.layout.tree().links(nodes);
	
	  var nodes = lattice.concepts,
      links = lattice.edges;
	
	
	  // Restart the force layout.
	  force
	      .nodes(nodes)
	      .links(links)
	      .start();
	
	 // Update the links…
	  clink = vis.selectAll("line.link")
	      .data(links);
	
	  // Enter any new links.
	  clink.enter().insert("svg:line", ".node")
	      .attr("class", "link")
	      .attr("x1", function(d) { return d.source.x; })
	      .attr("y1", function(d) { return d.source.y; })
	      .attr("x2", function(d) { return d.target.x; })
	      .attr("y2", function(d) { return d.target.y; })
	      .attr("source_id", function(d) { return d.source.id; })
          .attr("target_id", function(d) { return d.target.id; });
	
	  // Exit any old links.
	  clink.exit().remove();
	
	  // Update the nodes…
	  cnode = vis.selectAll("circle.node")
	      .data(nodes, function(d) { return d.id; });
	
	  // Enter any new nodes.
	  cnode.enter().append("svg:circle")
	      .attr("class", "node")
	      .attr("cx", function(d) { return d.x; })
	      .attr("cy", function(d) { return d.y; })
	      .attr("r", getNodeSize)
	      .attr("intent", function(d) { return d.intent; })
		  .attr("extent", function(d) { return d.extent; })
		  .attr("id", function(d) { return  d.id; })
		  .attr("children", function(d) { return d.children; })
	      .on("click", nodeClick)
		  .on("mouseover", nodeMouseOver)
		  .on("mouseout", nodeMouseOut)
		  .call(force.drag);
	
	  // Exit any old nodes.
	  cnode.exit().remove();
	  
	  
	   // Update the labels…
	  ulabel = vis.selectAll("text.intent")
	      .data(nodes, function(d) { return d.id; });
	
	  // Enter any new labels.
	  ulabel.enter().append("svg:text")
	      .attr("class", "intent")
		  .attr("x", -22)
		  .attr("y", "-1em")
		  .attr("id", function(d){ return "intent_"+d.id})
		  .text(get_upper_label);
	  
	  // Exit any old labels.
	  ulabel.exit().remove();
	  
	  
	   // Update the labels…
	  llabel = vis.selectAll("text.extent")
	      .data(nodes, function(d) { return d.id; });
	
	  // Enter any new labels.
	  llabel.enter().append("svg:text")
		.attr("x", -22)
		.attr("y", "2em")
		.attr("class", "extent")
		.attr("id", function(d){ return "extent_"+d.id})
		.text(get_lower_label); 
	
	  // Exit any old labels.
	  llabel.exit().remove();
	  
}



function tick(e) {
      
  clink.attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });
  
  // first version
  cnode.attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; });
  
  // clabel.attr("cx", function(d) { return d.x; })
      // .attr("cy", function(d) { return d.y; });

   // other version
  // node.attr("transform", function(d) {
    // return "translate(" + d.x + "," + d.y + ")";
  // });
// 
   ulabel.attr("transform", function(d) {
     return "translate(" + d.x + "," + d.y + ")";
   });
  
  llabel.attr("transform", function(d) {
     return "translate(" + d.x + "," + d.y + ")";
   });
   
   var k = .2 * e.alpha;
   cnode.each(function(d) {
   			d.y += ((d.depth) * 100 - d.y) * k;
   });    
   
}



/*
 * Create mini lattices
 */

function labelizeLattice(nodes, links){ // links format: link.source = idxInNodes link.target = idxInNodes
	
	function visitNodesDownBreadth(n, mycallback) {
		mycallback(n);
		var queue = getChildrenOf(n);
		
		for (var i=0; i < queue.length; i++) {
		    mycallback(queue[i]);
		    
		    var children = getChildrenOf(queue[i]);
		    if (children.length > 0) ArrayAddAll(children, queue);
		};
	
	}

	
	function getParentsOf(n){
		var idx = nodes.indexOf(n);
		var parents = [];
		for (var i=0; i < links.length; i++) {
		  if (links[i].target == idx) parents.push(nodes[links[i].source])
		};
		
		return parents;
	}
	function getChildrenOf(n){
		var idx = nodes.indexOf(n);
		var children = [];
		for (var i=0; i < links.length; i++) {
		  if (links[i].source == idx) children.push(nodes[links[i].target])
		};
		
		return children;
	}
	
	function findTop(){
		for (var i=0; i < nodes.length; i++) {
		  if (getParentsOf(nodes[i]).length == 0) return nodes[i];
		};
	}
	function findBottom(){
		for (var i=0; i < nodes.length; i++) {
		  if (getChildrenOf(nodes[i]).length == 0) return nodes[i];
		};
	}
	
	function getAttributes(){
		return findBottom().intent;
		
	}
	
	var top = findTop();
	//top.upperLabel = top.intent.join(', ');
	// intent labels
	var curIntent = getAttributes();
	
	visitNodesDownBreadth(top, function(curNode){ 
	    
		curNode.upperLabel = ArrayIntersect(curIntent,curNode.intent).join(", ");
		curIntent = ArraySubtract(curIntent, curNode.intent);
	});
	
}


function createMiniLattice(nodes, links, container_id){
	var width = 200;
	var height = 150;
	
	labelizeLattice(nodes, links);
	
	
	var minivis = d3.select("#"+container_id)
	  .append("svg:svg")
	    .attr("width", width)
	    .attr("height", height)
	    .attr("viewBox", "0 0 "+width+" "+height)
	    .attr("preserveAspectRatio", "xMidYMid")
	    .append("svg:g")
    .attr("transform", "translate(" + width/2 + "," + 20 + ")");
	

	// reset edges info (e.g. in case of filtering)
	nodes.forEach(function(d,i) {
		d.id = container_id + "-"+ i; // container id + pos of node
		d.edges = [];
	});
	
	// re add
	links.forEach(function(d) {
		if( typeof d.source === "number") {
			d.source = nodes[d.source];
			d.target = nodes[d.target];
		}
		d.id = d.source.id + "-" + d.target.id;
		d.source.edges.push(d);
		d.target.edges.push(d);
	});


	var dedges = minivis
	    .selectAll("path .dedge")
	    .data(links)
	    .enter()
      	.append("path")
      	.attr("id", function(d,i) { return "mini-edge-" + d.id })
      	.attr("class", "dedge");   
	
	
	 var dnodes = minivis
	    .selectAll("circle .node")
	    .data(nodes)
	    .enter()
	      .append("circle")
	      .attr("class", "node")
	      .attr("x", function(d) { return -10; })
			.attr("y", function(d) { return -10; })
			.attr("r", 5)
	      .attr("id", function(d,i) { return "mini-node-" + d.id });

   var dupperLabelbox = minivis
	    .selectAll("text .mini-intent")
	    .data(nodes)
	    .enter()
	    .append('text')
        .attr("id", function(d) { return "mini-intent-" + d.id })
	    .attr("class", "mini-intent")
	    //.attr("x", 4) // TODO verify the bbox.width of the text to position it
    	//.attr("y", -5)
    	.text(function(d) { return d.upperLabel; });



  // var labels = dnodes
    // .append("text")
      // .attr("text-anchor", "middle")
      // .attr("x", 0);
// 
  // labels
    // .append("tspan")
    // .attr("class", "intent")
    // .attr("x", 0)
    // .attr("y", "-1em")
    // .text(function(d){ return d.intent.join(",")});//d.intent.join(",")
  
  // We need width and height for layout.
  dnodes.each(function(d) {
    //var bbox = d3.select(this).node().getBBox();
    //d.bbox = bbox;
    d.width = 10;//bbox.width + 2 * nodePadding;
    d.height = 10;//bbox.height + 2 * nodePadding;
  });


  dupperLabelbox
    .attr("x", function(d) { return -10;})//return -d.bbox.width / 2; }) // TODO
    .attr("y", function(d) { return -5 }); //

  dagre.layout()
  	.nodeSep(15)
    .edgeSep(15)
    .rankSep(25)
    .invert(false)
    .nodes(nodes)
    .edges(links)
    .debugLevel(1)
    .run();

  dnodes.attr("transform", function(d) { return "translate(" + d.dagre.x + "," + d.dagre.y +")"; });
  
  dupperLabelbox.attr("transform", function(d) { return "translate(" + (d.dagre.x-5) + "," + (d.dagre.y-5) +")"; });

  
  dedges
    // Set the id. of the SVG element to have access to it later
    //.attr('id', function(e) { return "edge-"+e.dagre.id; })
    .attr("d", function(e) { return spline(e); });
  

  // Resize the SVG element
   // var svg = d3.select("#"+container_id).select("svg");
   // var svgBBox = svg.node().getBBox();
   // svg.attr("viewBox", "0 0 "+svgBBox.width+" "+height);
   
    var svg2 = d3.select("#"+container_id).select("svg");
	  // var svgBBox2 = svg2.node().getBBox();
	  // svg2.attr("viewBox", "0 0 "+svgBBox2.width+" "+150);
   
  // svg.attr("width", svgBBox.width + 10);
  // svg.attr("height", svgBBox.height + 10);
  
  
  	  // Drag handlers
	  var nodeDrag = d3.behavior.drag()
	    // Set the right origin (based on the Dagre layout or the current position)
	    .origin(function(d) { return d.pos ? {x: d.pos.x, y: d.pos.y} : {x: d.dagre.x, y: d.dagre.y}; })
	    .on('drag', function (d, i) {
	      var prevX = d.dagre.x,
	          prevY = d.dagre.y;
	
	      // The node must be inside the SVG area
	      d.dagre.x = Math.max(d.width / 2, Math.min(svgBBox2.width - d.width / 2, d3.event.x));
	      d.dagre.y = Math.max(d.height / 2, Math.min(svgBBox2.height - d.height / 2, d3.event.y));
	      d3.select(this).attr('transform', 'translate('+ d.dagre.x +','+ d.dagre.y +')');
	
	      var dx = d.dagre.x - prevX,
	          dy = d.dagre.y - prevY;
	
	      // Edges position (inside SVG area)
	      d.edges.forEach(function(e) {
	        translateEdge(e, dx, dy);
	        d3.select('#mini-edge-'+ e.id).attr('d', spline(e));
	      });
	      
	      // TODO translate label groups if not lpos (ie. dragged)
	      d3.select("#mini-intent-"+d.id).attr('transform', 'translate('+ (d.dagre.x-5) +','+
	       (d.dagre.y-5) +')');
	    });
	
	    
	  //dnodes.call(nodeDrag);
  
  
}


function spline(e) {
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
function translateEdge(e, dx, dy) {
	    e.dagre.points.forEach(function(p) {
	      p.x = Math.max(0, Math.min(800, p.x + dx));
	      p.y = Math.max(0, Math.min(600, p.y + dy));
	    });
	}
	
	
	
/**********************************************
 * Attribute graph
 **********************************************/

function loadAttributeGraph(data) {
	var width = DEFAULT_ATTR_GRAPH_WIDTH,
	    height = DEFAULT_ATTR_GRAPH_HEIGHT;
	
	
	var links = data.links;
	var nodes = data.nodes;
	
		// Compute the distinct nodes from the links.
	links.forEach(function(link) {
	  link.source = nodes[link.source_idx] || (nodes[link.source_idx] = {name: link.source});
	  link.target = nodes[link.target_idx] || (nodes[link.target_idx] = {name: link.target});
	});
	
	
	
	var force = d3.layout.force()
	    .nodes(d3.values(nodes))
	    .links(links)
	    .size([width, height])
	    .linkDistance(150)
	    .charge(-300)
	    .on("tick", tick)
	    .start();
	
	var svg = d3.select("#attr-graph").append("svg:svg")
	    .attr("width", width)
	    .attr("height", height);
	
	// Per-type markers, as they don't inherit styles.
	svg.append("svg:defs").selectAll("marker")
	    .data(["suit", "licensing", "resolved"])
	  .enter().append("svg:marker")
	    .attr("id", String)
	    .attr("viewBox", "0 -5 10 10")
	    .attr("refX", 15)
	    .attr("refY", -1.5)
	    .attr("markerWidth", 10)
	    .attr("markerHeight", 10)
	    .attr("markerUnits", "userSpaceOnUse")
	    .attr("orient", "auto")
	    .style("stroke-width", 1)
	  .append("svg:path")
	    .attr("d", "M0,-5L10,0L0,5");
	
	var path = svg.append("svg:g").selectAll("path")
	    .data(force.links())
	  .enter().append("svg:path")
	    .attr("class", function(d) { return "aglink " + "suit"; })
	    .attr("marker-end", function(d) { return "url(#" + "suit" + ")"; })
	    //.attr("marker-style", )
	    .style("stroke-width", function(d) { if (d.total != 0) { 
	    	
	    	var min = 2;
	    	var max = 16;
	    	var val = Math.round((max-min)*(d.count/d.total))+min;
	    	
	    	return val ;
	    	} });
	
	var circle = svg.append("svg:g").selectAll("circle")
	    .data(force.nodes())
	  .enter().append("svg:circle")
	    .attr("class", "agcircle")
	    .attr("r", 6)
	    .call(force.drag);
	
	var text = svg.append("svg:g").selectAll("g")
	    .data(force.nodes())
	  .enter().append("svg:g");
	
	// A copy of the text with a thick white stroke for legibility.
	text.append("svg:text")
	    .attr("x", 8)
	    .attr("y", ".31em")
	    .attr("class", "shadow")
	    .text(function(d) { return d.name; });
	
	text.append("svg:text")
	    .attr("x", 8)
	    .attr("y", ".31em")
	    .text(function(d) { return d.name; });
	
	// Use elliptical arc path segments to doubly-encode directionality.
	function tick() {
	  path.attr("d", function(d) {
	    var dx = d.target.x - d.source.x,
	        dy = d.target.y - d.source.y,
	        dr = Math.sqrt(dx * dx + dy * dy);
	    return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
	  });
	
	  circle.attr("transform", function(d) {
	    return "translate(" + d.x + "," + d.y + ")";
	  });
	
	  text.attr("transform", function(d) {
	    return "translate(" + d.x + "," + d.y + ")";
	  });
	}
}


var color20=d3.scale.category20();

function radialAttributeGraph(data){
	var width = DEFAULT_ATTR_GRAPH_WIDTH,
	    height = DEFAULT_ATTR_GRAPH_HEIGHT;
	    
	    
	var links = data.links;
	var nodes = data.nodes;
	    
	var rx = width / 2,
    ry = width / 2,
    m0,
    s=n=data.nodes.length,
    rotate = 0;
    
	
    var line = function (d) { 
     	 return d3.svg.line()
        .x(function(d){return d.x;})
        .y(function(d){return d.y;})
        .interpolate("linear")([{x : d.source.x, y: d.source.y}, {x : d.target.x, y: d.target.y}]); 
     }
    
    var belzier = function(d) {
			    var dx = d.target.x - d.source.x,
			        dy = d.target.y - d.source.y,
			        dr = Math.sqrt(dx * dx + dy * dy);
			    return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
			  }

	for (var i=0; i < nodes.length; i++) {
	  	var a = nodes[i];
	  
	  	a.x=(width/2-50)*(Math.cos(i*2*Math.PI/n));
		a.y=(width/2-50)*(Math.sin(i*2*Math.PI/n));
	};
	
	
	links.forEach(function(l) {
			l.source = nodes[l.source_idx];
			l.target = nodes[l.target_idx];
	});
		
		


    
    var svg = d3.select("#attr-graph").append("svg:svg")
	.attr("width",width)
	.attr("height",height)
	.attr("viewBox", "0 0 "+width+" "+height)
	.attr("preserveAspectRatio", "xMidYMid")
 	//.attr("viewBox",((-1)*(m[0]+0*rx))+" "+((-1)*(m[0]+0*ry))+" "+(2*rx+0*m[0])+" "+(2*ry+0*m[0]))
  	.append("svg:g")
   		.attr("transform", "translate(" + width/2 + "," + height/2 + ")");
    
    //Drawing links
    svg.selectAll("path.attr-graph")
    	.data(links)
	    .enter().append("path")
	    	.attr("class", "attr-graph")
		    .style("stroke-width", function(d){if (d.total != 0) return Math.round(10*(d.count/d.total));})
		    .style("fill", "none")
		    .attr("d", (curvedEdgesAttrGraph) ? belzier : line) 
	    	.attr("x1", function(d){ return d.source.x; })
	    	.attr("y1", function(d){ return d.source.y; })
	    	.attr("x2", function(d){ return d.target.x; })
	    	.attr("y2", function(d){ return d.target.y; })
		    .style("stroke",function(d,i){
		    	return "#888";
	    		});
	    	 
	  var circle = svg.selectAll("g.node")
		.data(nodes)
	  .enter().append("svg:line")
	  	.attr("x1",function(d){return d.x-Math.max(1,(width/2-100)*(Math.PI/(2*n)));})
	  	.attr("y1",function(d){return d.y;})
	  	.attr("x2",function(d){return d.x+Math.max(1,(width/2-100)*(Math.PI/(2*n)));})
	  	.attr("y2",function(d){return d.y;})
	  	.attr("transform",function(d){return "rotate("+Math.atan((-1)*d.x/d.y)*180/Math.PI+" "+d.x+" "+d.y+")";})
	  	.style("stroke",function(d){ return "#000000";}); //color_set(d.family-1);})
	  	
      var text = svg.selectAll("g.node")
		.data(nodes)
	  .enter().append("svg:text")
	    .attr("dx", function(d){return d.x>0 ? "1em": "-1em";})
	    .attr("dy","0.31em")
	    .style("pointer-events","none")
	    .attr("text-anchor", function(d){return d.x>0 ? "start": "end";})
      	.text(function(d){return d.name;})
      	.style("fill",function(d){return color20(d.name);}) //color_set(d.family-1);})
      	.attr("transform",function(d){return "translate("+d.x+","+d.y+")rotate("+Math.atan(d.y/d.x)*180/Math.PI+")";});

		
}


$(function() {
	$("#attr-graph-layout").change(function(){
		changeAttributeGraphLayout($(this).attr('value'));
	});
	
	$("#attr-graph-curved-edges").change(function(){
		curvedEdgesAttrGraph = $(this).attr('checked');
		changeAttributeGraphLayout("radial");
	})
	
	
	
	$("#distribution-chart-type").change(function(){
		changeDistributionChartType($(this).attr('value'));
	});
	
	
	
});


function changeDistributionChartType(type){
	
	$("#distribution-chart").html("");
	
	if (type == "bar") createDistributionChart();
	else if (type == "pie") createDistributionPieChart();
	
}


var curvedEdgesAttrGraph = false;


function changeAttributeGraphLayout(type){
	
	$("#attr-graph").html("");
	
	if (type == "fd") loadAttributeGraph(lattice.attr_graph);
	else if (type == "radial") radialAttributeGraph(lattice.attr_graph);
	
}

//var color20=d3.scale.category20c();
var radarChart = new function(){
	
	var width = 500, height = 400;
	
	var series, 
    hours,
    minVal,
    maxVal,
    vizPadding = {
        top: 10,
        right: 0,
        bottom: 15,
        left: 0
    },
    radius,
    radiusLength,
    ruleColor = "#CCC";
	
	
	this.init = function(){
		// loadData();
		// buildBase();
		// setScales();
		// addAxes();
		// draw();
	}
	
	this.updateSeries = function(concepts) {
		
		var getSeries = function getSeries(concept){ // TODO cache this info in the data
			var serie = [];
			
			var subcontext = context.getSubcontextForExtent(concept.extent, true);
			for (var j=0; j < subcontext.attributes.length; j++) {
				var sum = 0;
				
			 	for (var k=0; k < subcontext.objects.length; k++) {
			  		if (subcontext.rel[k][j]) { 
			  			sum += 1;
			  		}
			 	}
			 	
			 	serie.push(sum);
			};
			
			return serie;
			
	    };
	    
		series = [];
		
		for (var i=0; i < concepts.length; i++) {
			series.push(getSeries(concepts[i]));
		};
		
		hours = context.attributes;
		
		mergedArr = [];
		for (var i=0; i < series.length; i++) {
		  mergedArr = mergedArr.concat(series[i]);
		};
	
	    minVal = d3.min(mergedArr);
	    maxVal = d3.max(mergedArr);
	    //give 25% of range as buffer to top
	    maxVal = maxVal + ((maxVal - minVal) * 0.25);
	    minVal = 0;
	
	    //to complete the radial lines
	    for (i = 0; i < series.length; i += 1) {
	        series[i].push(series[i][0]);
	    }
		
		
		buildBase();
		setScales();
		addAxes();
		draw();
		
		
	}
	
	var loadData = function(){
	    var randomFromTo = function randomFromTo(from, to){
	       return Math.floor(Math.random() * (to - from + 1) + from);
	    };
	
	    series = [
	      [],
	      []
	    ];
	
	    hours = [];
	
	    for (i = 0; i < 24; i += 1) {
	        series[0][i] = randomFromTo(0,20);
	        series[1][i] = randomFromTo(5,15);
	        hours[i] = i; //in case we want to do different formatting
	    }
	
	    mergedArr = series[0].concat(series[1]);
	
	    minVal = d3.min(mergedArr);
	    maxVal = d3.max(mergedArr);
	    //give 25% of range as buffer to top
	    maxVal = maxVal + ((maxVal - minVal) * 0.25);
	    minVal = 0;
	
	    //to complete the radial lines
	    for (i = 0; i < series.length; i += 1) {
	        series[i].push(series[i][0]);
	    }
	};

	var buildBase = function(){
		
		$("#polar-chart").html("");
		
	    var viz = d3.select("#polar-chart")
	        .append('svg:svg')
	        .attr('width', width)
	        .attr('height', height)
	        .attr('class', 'vizSvg');
	
	    viz.append("svg:rect")
	        .attr('id', 'axis-separator')
	        .attr('x', 0)
	        .attr('y', 0)
	        .attr('height', 0)
	        .attr('width', 0)
	        .attr('height', 0);
	    
	    vizBody = viz.append("svg:g")
	        .attr('id', 'body');
	};

	setScales = function () {
	  var heightCircleConstraint,
	      widthCircleConstraint,
	      circleConstraint,
	      centerXPos,
	      centerYPos;
	
	  //need a circle so find constraining dimension
	  heightCircleConstraint = height - vizPadding.top - vizPadding.bottom;
	  widthCircleConstraint = width - vizPadding.left - vizPadding.right;
	  circleConstraint = d3.min([
	      heightCircleConstraint, widthCircleConstraint]);
	
	  radius = d3.scale.linear().domain([minVal, maxVal])
	      .range([0, (circleConstraint / 2)]);
	  radiusLength = radius(maxVal);
	
	  //attach everything to the group that is centered around middle
	  centerXPos = widthCircleConstraint / 2 + vizPadding.left;
	  centerYPos = heightCircleConstraint / 2 + vizPadding.top;
	
	  vizBody.attr("transform",
	      "translate(" + centerXPos + ", " + centerYPos + ")");
	};

	addAxes = function () {
	  var radialTicks = radius.ticks(5),
	      i,
	      circleAxes,
	      lineAxes;
	
	  vizBody.selectAll('.circle-ticks').remove();
	  vizBody.selectAll('.line-ticks').remove();
	
	  circleAxes = vizBody.selectAll('.circle-ticks')
	      .data(radialTicks)
	      .enter().append('svg:g')
	      .attr("class", "circle-ticks");
	
	  circleAxes.append("svg:circle")
	      .attr("r", function (d, i) {
	          return radius(d);
	      })
	      .attr("class", "circle")
	      .style("stroke", ruleColor)
	      .style("fill", "none");
	
	  circleAxes.append("svg:text")
	      .attr("text-anchor", "middle")
	      .attr("dy", function (d) {
	          return -1 * radius(d);
	      })
	      .text(String);
	
	  lineAxes = vizBody.selectAll('.line-ticks')
	      .data(hours)
	      .enter().append('svg:g')
	      .attr("transform", function (d, i) {
	          return "rotate(" + ((i / hours.length * 360) - 90) +
	              ")translate(" + radius(maxVal) + ")";
	      })
	      .attr("class", "line-ticks");
	
	  lineAxes.append('svg:line')
	      .attr("x2", -1 * radius(maxVal))
	      .style("stroke", ruleColor)
	      .style("fill", "none");
	
	  lineAxes.append('svg:text')
	      .text(String)
	      .attr("text-anchor", "middle")
	      .attr("transform", function (d, i) {
	          return (i / hours.length * 360) < 180 ? null : "rotate(180)";
	      });
	};

	var draw = function () {
	  var groups,
	      lines,
	      linesToUpdate;
	
	  highlightedDotSize = 4;
	
	  groups = vizBody.selectAll('.series')
	      .data(series);
	  groups.enter().append("svg:g")
	      .attr('class', 'series')
	      .style('fill', function (d, i) { return p(context.attributes[i]); })
	      .style('stroke', function (d, i) { return p(context.attributes[i]); });
	  groups.exit().remove();
	
	  lines = groups.append('svg:path')
	      .attr("class", "line")
	      .attr("d", d3.svg.line.radial()
	          .radius(function (d) {
	              return 0;
	          })
	          .angle(function (d, i) {
	              if (i === 24) {
	                  i = 0;
	              } //close the line
	              return (i / 24) * 2 * Math.PI;
	          }))
	      .style("stroke-width", 3)
	      .style("fill", "none");
	
	  groups.selectAll(".curr-point")
	      .data(function (d) {
	          return [d[0]];
	      })
	      .enter().append("svg:circle")
	      .attr("class", "curr-point")
	      .attr("r", 0);
	
	  groups.selectAll(".clicked-point")
	      .data(function (d) {
	          return [d[0]];
	      })
	      .enter().append("svg:circle")
	      .attr('r', 0)
	      .attr("class", "clicked-point");
	
	  lines.attr("d", d3.svg.line.radial()
	      .radius(function (d) {
	          return radius(d);
	      })
	      .angle(function (d, i) {
	          if (i === 24) {
	              i = 0;
	          } //close the line
	          return (i / 24) * 2 * Math.PI;
	      }));
	};
	
	
}


