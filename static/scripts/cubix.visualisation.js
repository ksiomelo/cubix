/*
 * Visualisations
 */
var currentVis = 'lattice';

var w = 960,
    h = 500;

var force;
var vis;
    
var r = Math.min(w, h) / 2,
    x = d3.scale.linear().range([0, 2 * Math.PI]),
    y = d3.scale.sqrt().range([0, r]),
    color = d3.scale.category20c();

function redrawVis(){
	if (currentVis != 'lattice')
	changeVis(currentVis);
}

function changeVis(visType){
	
	d3.select("#chart").html("");
	
	if (visType == 'lattice')  initLattice();
	else if (visType == 'static-lattice')  initThisLattice();//initStaticLattice2();
    else if (visType == 'sunburst')  initSunburst();
    else if (visType == 'icicle')  initIcicle();
	else if (visType == 'treemap')  treemap();
	else if (visType == 'tree')  initTree();
	
	currentVis = visType;
}


function updateVis(){
	
	redrawVis();
	
	if (currentVis == 'lattice')  updateLattice();
	else if (currentVis == 'static-lattice')  updateStaticLattice();
    else if (currentVis == 'sunburst')  updateSunburst();
    else if (currentVis == 'icicle')  updateIcicle();
	else if (currentVis == 'treemap')  treemap();
	else if (currentVis == 'tree')  updateTree(getTree0());
}






/*
 * Static Lattice
 */

function initStaticLattice2(){
	vis = d3.select("#chart").append("svg:svg")
	.attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", "0 0 "+w+" "+h);
    
    
     var nodes = data.nodes,
      links = data.links;
	
	
	
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
	      .attr("r", DEFAULT_NODE_RADIUS)
	      .attr("intent", function(d) { return d.intent; })
		  .attr("extent", function(d) { return d.extent; })
		  .attr("id", function(d) { return  d.id; })
		  .attr("children", function(d) { return d.children; })
	      .on("click", nodeClick)
		  .on("mouseover", nodeMouseOver)
		  .on("mouseout", nodeMouseOut);
	
	  // Exit any old nodes.
	  cnode.exit().remove();
    
	
	
}










var foci = [{x: 150, y: 150}, {x: 350, y: 250}, {x: 700, y: 400},{x: 150, y: 150}, {x: 350, y: 250}, {x: 700, y: 400},{x: 150, y: 150}, {x: 350, y: 250}, {x: 700, y: 400},{x: 150, y: 150}, {x: 350, y: 250}, {x: 700, y: 400},{x: 150, y: 150}, {x: 350, y: 250}, {x: 700, y: 400},{x: 150, y: 150}, {x: 350, y: 250}, {x: 700, y: 400},{x: 150, y: 150}, {x: 350, y: 250}, {x: 700, y: 400},{x: 150, y: 150}, {x: 350, y: 250}, {x: 700, y: 400},{x: 150, y: 150}, {x: 350, y: 250}, {x: 700, y: 400},{x: 150, y: 150}, {x: 350, y: 250}, {x: 700, y: 400},{x: 150, y: 150}, {x: 350, y: 250}, {x: 700, y: 400},{x: 150, y: 150}, {x: 350, y: 250}];

function initStaticLattice(){
	force = d3.layout.force()
        .gravity(0)
        .charge(0)
        .distance(100)
        .on("tick", tickStatic)
        .size([w, h]);
        
   	vis = d3.select("#chart").append("svg:svg")
	.attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", "0 0 "+w+" "+h);
   // .attr("width", w);
	
	
	updateStaticLattice();
	
	
}


function updateStaticLattice(){
	updateLattice();
	
}


function tickStatic(e) {
	
	return;
	
	 
     var k = .1 * e.alpha;
	  	data.nodes.forEach(function(o, i) {
	    o.y += (foci[o.id].y - o.y) * k;
	    o.x += (foci[o.id].x - o.x) * k;
	  });
   
	
      
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
   
   // var k = .5 * e.alpha;
   // cnode.each(function(d) {
   			// d.y += ((d.depth) * 100 - d.y) * k;
   // });    
   
 
   
   
      
}


/*
 * Sunburst
 */


var partition;
var path;
var sbLabel;

var p = 5;
var arc = d3.svg.arc()
	    .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x))); })
	    .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx))); })
	    .innerRadius(function(d) { return Math.max(0, y(d.y)); })
	    .outerRadius(function(d) { return Math.max(0, y(d.y + d.dy)); });



function initSunburst(){
	
	// w = 960;
    // h = 500;
	
	vis = d3.select("#chart").append("svg:svg")
	    .attr("width", w)
	    .attr("height", h)
	  .append("svg:g")
	    .attr("transform", "translate(" + w / 2 + "," + h / 2 + ")");
	    
	partition = d3.layout.partition()
	    .value(function(d) { return Math.round(d.support*100); });
	    
	    updateSunburst();
	
}

function updateSunburst() {
		
       
       //	treeTransform();
       
       	
        var json = getTree0();// data.nodes[0]; //  no need to transform :)
        
        //labelizeThis(json, true);
       	//$("body").html(JSON.stringify(json))
       	
       	vis.data([json]);
       
        var sbnodes = partition.nodes(json);
        
        path = vis.selectAll("path.sb")
	      .data(partition.nodes, function(d){ return d.id});
	      
 		path.enter().append("svg:path")
 			.attr("class", "sb")
 			.attr("id", function(d, i) { return "path-" + i; })
	     	.attr("d", arc)
	      	.style("fill", function(d) { return color((d.children ? d : d.parent).name); })
	      	.on("mouseover", nodeMouseOver)
		  	.on("mouseout", nodeMouseOut)
	   		.on("click", sbclick);
	   		
	   	 // Exit any old nodes.
	  		path.exit().remove();
	  		
	  		
	  	sbLabel = vis.selectAll("text").data(sbnodes);
	  var textEnter = sbLabel.enter().append("svg:text")
	      .style("opacity", 1)
	      .style("fill", "#000")
	      .attr("text-anchor", function(d) {
	        return x(d.x + d.dx / 2) > Math.PI ? "end" : "start";
	      })
	      .attr("dy", ".2em")
	      .attr("transform", function(d) {
	        var multiline = (d.name || "").split(" ").length > 1,
	            angle = x(d.x + d.dx / 2) * 180 / Math.PI - 90,
	            rotate = angle + (multiline ? -.5 : 0);
	        return "rotate(" + rotate + ")translate(" + (y(d.y) + p) + ","+(x(d.x)+20*d.depth)+")rotate(" + (angle > 90 ? -180 : 0) + ")";
	      })
	      .on("click", sbclick);
	  textEnter.append("svg:tspan")
	      .attr("x", 0)
	      .text(function(d) { return d.depth ? d.name.split(" ")[0] : ""; });
	  textEnter.append("svg:tspan")
	      .attr("x", 0)
	      .attr("dy", "1em")
	      .text(function(d) { return d.depth ? d.name.split(" ")[1] || "" : ""; });		
	  
	
       ///// ORIGINAL
        // path = vis.data([json]).selectAll("path")
	      // .data(partition.nodes)
	    // .enter().append("svg:path")
	      // .attr("d", arc)
	      // .style("fill", function(d) { return color((d.children ? d : d.parent).name); })
	      // .on("click", sbclick);
	
}

// function sbclick(d) {
	    // path.transition()
	      // .duration(750)
	      // .attrTween("d", arcTween(d));
// }
function isParentOf(p, c) {
  if (p === c) return true;
  if (p.children) {
    return p.children.some(function(d) {
      return isParentOf(d, c);
    });
  }
  return false;
}


function sbclick(d) {
    path.transition()
      .duration(750)
      .attrTween("d", arcTween(d));

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
  }


// function click(d) {
    // path.transition()
      // .duration(750)
      // .attrTween("d", arcTween(d));
  // }

// Interpolate the scales!
function arcTween(d) {
  var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
      yd = d3.interpolate(y.domain(), [d.y, 1]),
      yr = d3.interpolate(y.range(), [d.y ? 20 : 0, r]);
  return function(d, i) {
    return i
        ? function(t) { return arc(d); }
        : function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); return arc(d); };
  };
}

/*
 * Icicle
 */

var rect;

function initIcicle(){
	x = d3.scale.linear().range([0, w]);
    y = d3.scale.linear().range([0, h]);
    
    vis = d3.select("#chart").append("svg:svg")
    .attr("width", w)
    .attr("height", h);
    
    partition = d3.layout.partition()
    .value(function(d) { return  Math.round(d.support*100); }); // TODO d.size


	updateIcicle();
}


function updateIcicle(){
	
		var json = getTree0();
		
		
       	
       	vis.data([json]);
       
        partition.nodes(json);
        
        rect = vis.selectAll("rect")
	      .data(partition.nodes);
	      
 		rect.enter().append("svg:rect")
	     	.attr("x", function(d) { return x(d.x); })
		      .attr("y", function(d) { return y(d.y); })
		      .attr("width", function(d) { return x(d.dx); })
		      .attr("height", function(d) { return y(d.dy); })
		      .attr("fill", function(d) { return color((d.children ? d : d.parent).name); })
		      .on("mouseover", nodeMouseOver)
		  		.on("mouseout", nodeMouseOut)
		      .on("click", icclick);
		 
		 vis.selectAll("rect")
	          .data(partition.nodes)   
		      .enter().append("svg:text")
		      	.attr("class", "intent")
			   	.attr("x", -22)
			   	.attr("y", "-1em")
			   	.attr("id", function(d){ return "intent_"+d.id})
			   	.text(d.intent.join(", "));
	   		
	   	 // Exit any old nodes.
	  	rect.exit().remove();
	
	
	  // Update the labels…
	 // var iclabel = vis.selectAll("text.intent")
	      // .data(partition.nodes, function(d) { return d.id; });
// 	
	  // // Enter any new labels.
	  // iclabel.enter().append("svg:text")
	      // .attr("class", "intent")
		   // .attr("x", -22)
		   // .attr("y", "-1em")
		   // .attr("id", function(d){ return "intent_"+d.id})
		  // .text(d.intent.join(", "));
// 	  
	  // // Exit any old labels.
	  // iclabel.exit().remove();
	
	
	
	
	// rect = vis.data([json]).selectAll("rect")
      // .data(partition.nodes)
    // .enter().append("svg:rect")
      // .attr("x", function(d) { return x(d.x); })
      // .attr("y", function(d) { return y(d.y); })
      // .attr("width", function(d) { return x(d.dx); })
      // .attr("height", function(d) { return y(d.dy); })
      // .attr("fill", function(d) { return color((d.children ? d : d.parent).name); })
      // .on("click", icclick);
}

 function icclick(d) {
    x.domain([d.x, d.x + d.dx]);
    y.domain([d.y, 1]).range([d.y ? 20 : 0, h]);

    rect.transition()
      .duration(750)
      .attr("x", function(d) { return x(d.x); })
      .attr("y", function(d) { return y(d.y); })
      .attr("width", function(d) { return x(d.x + d.dx) - x(d.x); })
      .attr("height", function(d) { return y(d.y + d.dy) - y(d.y); });
  }



/*
 * Tree
 */

var tree, root, diagonal;
var m, duration;
 var treei = 0;
    
function initTree(){
    m = [20, 120, 20, 120];
    w = DEFAULT_WIDTH - m[1] - m[3];
    h = DEFAULT_HEIGHT - m[0] - m[2];
   
    duration = 500;

	 tree = d3.layout.tree()
    .size([h, w]);

    diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.y, d.x]; });

 vis = d3.select("#chart").append("svg:svg")
    .attr("width", w + m[1] + m[3])
    .attr("height", h + m[0] + m[2])
  .append("svg:g")
    .attr("transform", "translate(" + m[3] + "," + m[0] + ")");
    
  root = getTree0();//json;
  root.x0 = h / 2;
  root.y0 = 0;
  
  
   
	function collapse(d) {
		if(d.children) {
			d._children = d.children;
			d._children.forEach(collapse);
			d.children = null;
		}
	}


  root.children.forEach(collapse);
  
  
  
  updateTree(root);
}


function updateTree(source) {

  // Compute the new tree layout.
  var nodes = tree.nodes(root).reverse();

  // Normalize for fixed-depth.
  nodes.forEach(function(d) { d.y = d.depth * 180; });

  // Update the nodes…
  var node = vis.selectAll("g.node")
      .data(nodes, function(d) { return d.id; /*|| (d.id = ++treei);*/ });

  // Enter any new nodes at the parent's previous position.
  var nodeEnter = node.enter().append("svg:g")
      .attr("class", "node")
      .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
      .on("click", clickCollapse);

  nodeEnter.append("svg:circle")
      .attr("r", getNodeSize)//1e-6)
      .on("mouseover", nodeMouseOver)
	  .on("mouseout", nodeMouseOut);
     // .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

  nodeEnter.append("svg:text")
  	  .attr("class", "intent")
      .attr("x", function(d) { return d.children || d._children ? -10 : 10; })
      .attr("dy", "-1.5em")
      .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
      .text(get_upper_label)//function(d) { return d.name; })
      .style("fill-opacity", 1e-6);
  
  nodeEnter.append("svg:text")
  	  .attr("class", "extent")
      .attr("x", function(d) { return d.children || d._children ? -10 : 10; })
      .attr("dy", "1.5em")
      .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
      .text(get_lower_label)//function(d) { return d.name; })
      .style("fill-opacity", 1e-6);

  // Transition nodes to their new position.
  var nodeUpdate = node.transition()
      .duration(duration)
      .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

 // nodeUpdate.select("circle") // TODO eliminate this
   //   .attr("r", 4.5)
      //.style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

  nodeUpdate.selectAll("text")
      .style("fill-opacity", 1);

  // Transition exiting nodes to the parent's new position.
  var nodeExit = node.exit().transition()
      .duration(duration)
      .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
      .remove();

 // nodeExit.select("circle")
  //    .attr("r", 1e-6);

  nodeExit.selectAll("text")
      .style("fill-opacity", 1e-6);

  // Update the links…
  var link = vis.selectAll("path.treelink")
      .data(tree.links(nodes), function(d) { return d.target.id; });

  // Enter any new links at the parent's previous position.
  link.enter().insert("svg:path", "g")
      .attr("class", "treelink")
      .attr("d", function(d) {
        var o = {x: source.x0, y: source.y0};
        return diagonal({source: o, target: o});
      })
    .transition()
      .duration(duration)
      .attr("d", diagonal);

  // Transition links to their new position.
  link.transition()
      .duration(duration)
      .attr("d", diagonal);

  // Transition exiting nodes to the parent's new position.
  link.exit().transition()
      .duration(duration)
      .attr("d", function(d) {
        var o = {x: source.x, y: source.y};
        return diagonal({source: o, target: o});
      })
      .remove();

  // Stash the old positions for transition.
  nodes.forEach(function(d) {
    d.x0 = d.x;
    d.y0 = d.y;
  });
}

// Toggle children on click.
function clickCollapse(d) {
  if (d.children) {
    d._children = d.children;
    d.children = null;
  } else {
    d.children = d._children;
    d._children = null;
  }
  updateTree(d);
}







/*
 * Tree map
 */

function treemap(){
	var w = 960,
    h = 500,
    color = d3.scale.category20c();

	var treemap = d3.layout.treemap()
	    .size([w, h])
	    .sticky(true)
	    .value(function(d) { return 1;/*d.size;*/ });
	    
	d3.select("#chart").html("");
	
	var div = d3.select("#chart").append("div")
	    .style("position", "relative")
	    .style("width", w + "px")
	    .style("height", h + "px");
	   
	
	//d3.json("../data/flare.json", function(json) {
		var json = getTree0();
		
	  div.data([json]).selectAll("div")
	      .data(treemap.nodes)
	    .enter().append("div")
	      .attr("class", "cell")
	      .style("background", function(d) { return d.children ? color(d.name) : null; })
	      .call(cell)
	      .text(function(d) { return d.children ? null : d.name; });
	
	  
	  // d3.select("#size").on("click", function() {
	    // div.selectAll("div")
	        // .data(treemap.value(function(d) { return d.size; }))
	      // .transition()
	        // .duration(1500)
	        // .call(cell);
// 	
	    // d3.select("#size").classed("active", true);
	    // d3.select("#count").classed("active", false);
	  // });
// 	
	  // d3.select("#count").on("click", function() {
	    // div.selectAll("div")
	        // .data(treemap.value(function(d) { return 1; }))
	      // .transition()
	        // .duration(1500)
	        // .call(cell);
// 	
	    // d3.select("#size").classed("active", false);
	    // d3.select("#count").classed("active", true);
	  // });
	
}

function cell() {
  this
      .style("left", function(d) { return d.x + "px"; })
      .style("top", function(d) { return d.y + "px"; })
      .style("width", function(d) { return d.dx - 1 + "px"; })
      .style("height", function(d) { return d.dy - 1 + "px"; });
}
