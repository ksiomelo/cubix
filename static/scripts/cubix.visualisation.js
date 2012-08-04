/*
 * Visualisations
 */

var labeling_type = LABEL_MULTILABEL; //  multi
var size_type = 'default';
var color_type = 'default';
var highlightPath = true;

var currentVis = 'lattice';
var previousVis = 'lattice';

var w = DEFAULT_WIDTH;
var h = DEFAULT_HEIGHT;

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
	prevIndex=-1;
	//$("#rules_container").css("display","none");
  	
  	d3.select("#chart").html("");

	if (visType == 'lattice') initLattice();
	else if (visType == 'static-lattice') initThisLattice();//initStaticLattice2();
    else if (visType == 'sunburst') initSunburst();
    else if (visType == 'icicle') initIcicle();
	else if (visType == 'treemap') treemap();
	else if (visType == 'tree') initTree();
	
	else if (visType == 'matrixview') { initARView(); createRulesList();}
	else if (visType == 'radiagram') { initDiagonalARView(); createRulesList();}
	else if (visType == 'gg_ar_plot') { init_gg_plot(); createRulesList(); }

	currentVis = visType;
}


function updateVis(){
	
	redrawVis();
	
	if (currentVis == 'lattice')  updateLattice();
	else if (currentVis == 'static-lattice')  updateStaticLattice();
    else if (currentVis == 'sunburst')  updateSunburst();
    else if (currentVis == 'icicle')  updateIcicle();
	else if (currentVis == 'treemap')  tm_updateTree(getTree0);//treemap();
	else if (currentVis == 'tree')  updateTree(getTree0());
}



/*
 * Drawing options
 */
	

function getNodeSize(d){ // TODO generalize
	
	// if (size_type == SIZE_SUPPORT) {
		// var radius = Math.round(d["support"]*(NODE_MAX_SIZE-NODE_MIN_SIZE)) + NODE_MIN_SIZE;
		// return radius;//(radius < NODE_MIN_SIZE) ? NODE_MIN_SIZE : radius;
	// } else if (size_type == SIZE_STABILITY) {
		// var radius = Math.round(d["stability"]*(NODE_MAX_SIZE-NODE_MIN_SIZE)) + NODE_MIN_SIZE;
		// return radius;//(radius < NODE_MIN_SIZE) ? NODE_MIN_SIZE : radius;
	// }
	
	//else return DEFAULT_NODE_RADIUS;
	if (size_type == 'default') return DEFAULT_NODE_RADIUS;
	else return Math.round(d[size_type]*(NODE_MAX_SIZE-NODE_MIN_SIZE)) + NODE_MIN_SIZE;
	
}


function changeNodeSize(type){
	size_type = type;
	if (currentVis=='treemap') {
		console.log("changin");
		tm_updateTree(getTree0);
	} else { 
		vis.selectAll("circle").attr("r", function(d) { // TODO 
			return getNodeSize(d);
		});
	}
}

function changeNodeColor(type){
	size_type = type;
	if (currentVis=='treemap') {
		console.log("changin");
		tm_updateTree(getTree0);
	}
	else { 
		vis.selectAll("circle").attr("r", function(d) { // TODO
			return getNodeSize(d);
		});
	}
}



function changeNodeVisibility(criteria, minValue, maxValue, toShow){
	vis.selectAll("circle").style("fill", function(d) {

		if(maxValue == null || typeof(maxValue) == 'undefined') { // single slider
			if((d[criteria])*100 >= minValue) {
				
				return "#ff0000";
			}
		} else {// range slider
			if((d[criteria])*100 >= minValue && (d[criteria])*100 <= maxValue) {
				return "#ff0000";
			}
		}
	});
}



/*
 * Static Lattice
 */


function initStaticLattice(){
	//calcInitialPlacement();
	new MinIntersect().run();
}



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
		  	.on("click", nodeClick)
	   		.on("dblclick", sbclick);
	   		
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
	      .on("click", nodeClick)
	      .on("dblclick", sbclick);
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
		  	  .on("click", nodeClick)
		      .on("dblclick", icclick);
		 
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
    //w = DEFAULT_WIDTH;// - m[1] - m[3];
    //h = DEFAULT_HEIGHT;// - m[0] - m[2];
   
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
      .on("dblclick", clickCollapse);

  nodeEnter.append("svg:circle")
      .attr("r", getNodeSize)//1e-6)
      .on("click", nodeClick)
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

var treemap, tm_root;

function treemap(){

/* New code */
console.log("initilizing treemap");

m = [20, 120, 20, 120]; // margins
    //h = DEFAULT_WIDTH - m[1] - m[3];
    //w = DEFAULT_HEIGHT - m[0] - m[2];
    duration = 500;
treemap = d3.layout.treemap()
   .size([h, w])
   .sticky(true)
.value( function(d){
if (size_type==SIZE_SUPPORT)
   return d.support;
   else {
   if (size_type==SIZE_STABILITY)
   return d.stability;
   else
   return 1;
   }
   }

   );

 vis = d3.select("#chart").append("svg:svg")
    .attr("width", w + m[1] + m[3])
    .attr("height", h + m[0] + m[2])
  .append("svg:g");
   // .attr("transform", "translate(" + m[3] + "," + m[0] + ")");

  tm_root = getTree0();//json;
  tm_root.x0 = 0;
  tm_root.y0 = 0;


 function collapse(d) {
if(d.children) {
d._children = d.children;
d._children.forEach(collapse);
d.children = null;
}
}

  tm_updateTree(tm_root);

}
function tm_updateTree(source) {

  console.log("updating");

  color = d3.scale.category20c();
  // Compute the new tree layout.
  var nodes = treemap.nodes(tm_root);//.reverse();
  // Normalize for fixed-depth.
  // Update the nodes…
  var node = vis.selectAll("g.node")
 /*function(d) { return 1 /*d.id;*/ /*|| (d.id = ++treei); } */
      .data(nodes, function(){

   if (size_type==SIZE_SUPPORT)
   return d.support;
   else {
   if (size_type==SIZE_STABILITY)
   return d.stability;
   else
   return 1;
   }}
   );

  // Enter any new nodes at the parent's previous position.
  var nodeEnter = node.enter().append("svg:g")
      .attr("class", "node")
      .attr("transform", function(d) { return "translate(" + tm_root.y0 + "," + tm_root.x0 + ")"; })
      .on("dblclick", clickCollapse);

  nodeEnter.append("svg:rect")
      .attr("x", function(d){return d.x; /*+3*d.depth*/})//1e-6)
      .attr("y", function(d){return d.y; /*+15*d.depth*/})
      .attr("width", function(d){return Math.max(0,d.dx /*-6*d.depth*/)})
      .attr("height", function(d){return Math.max(0,d.dy /*-17*d.depth*/)})
      .style("fill",function(d){return color(d.depth)})
      .style("stroke","white")
      .style("opacity",1/*0.5*/)
      .on("mouseover", nodeMouseOver)
.on("mouseout", nodeMouseOut);
     
  nodeEnter.append("svg:text")
   .attr("class", "intent")
      .attr("x", function(d) { return d.x; /*+7*d.depth*/})
      .attr("y", function(d) { return d.y+30; /*+15*(d.depth+1)-2*/})
  // .attr("dy", "-1.5em")
  // .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
      .text(get_upper_label)//function(d) { return d.name; })
      .style("fill-opacity", 1e-6);
  
  nodeEnter.append("svg:text")
   .attr("class", "extent")
      .attr("x", function(d) { return d.x; /*+7*d.depth +50*/})
      .attr("y", function(d) { return d.y +15;/**(d.depth+1)-2*/})
  // .attr("dy", "1.5em")
  // .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
      .text(get_lower_label)//function(d) { return d.name; })
      .style("fill-opacity", 1e-6);

  // Transition nodes to their new position.

  var nodeUpdate = node.transition()
      .duration(duration)
      .attr("transform", function(d) { return "translate(" + d.y0 + "," + d.x0 + ")"; });

 // nodeUpdate.select("circle") // TODO eliminate this
   // .attr("r", 4.5)
      //.style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

  nodeUpdate.selectAll("text")
      .style("fill-opacity", 1);

  // Transition exiting nodes to the parent's new position.
  var nodeExit = node.exit().transition()
      .duration(duration)
      .style("fill-opacity",1)
      .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
      .remove();

 // nodeExit.select("circle")
  // .attr("r", 1e-6);

  nodeExit.selectAll("text")
      .style("fill-opacity", 1e-6);
/*
// Stash the old positions for transition.
nodes.forEach(function(d) {
d.x0 = d.x;
d.y0 = d.y;
});
*/
}









/*
*
* Matrix View
*
*/

function init_matrix_view(){

//initializing environement

var m = [20, 120, 20, 120]; // margins
var matrix=[];
var n=0;
var attr_list=[];


for (a in data.attributes) {
for(i=0;i<data.attributes[a].length;i++){
if ( (data.attributes[a])[i][0]=="yes") attr_list.push( a.toString());
else
if ( (data.attributes[a])[i][0]=="no") continue;
else
attr_list.push( a.toString()+"-"+(data.attributes[a])[i][0]);
}
}
n=attr_list.length;

//get association rules



//initialize matrix

for (var i=0;i<myobject.length;i++){
matrix[i]=[];
matrix[i]=d3.range(n).map(function(j){return {x:i, y:j, z:0}});
}

//fill matrix

for (var i=0;i<myobject.length;i++){

for (var k=0;k<n;k++) {

for (var j=0;j<myobject[i].premise.length;j++)
if (attr_list[k] ==myobject[i].premise[j]){
matrix[i][k].z=1;
matrix[i][k].confidence=myobject[i].confidence;
matrix[i][k].premise_supp=myobject[i].premise_supp;
matrix[i][k].conclusion_supp=myobject[i].conclusion_supp;
matrix[i][k].premise=myobject[i].premise;
matrix[i][k].conclusion=myobject[i].conclusion;


}
for (var j=0;j<myobject[i].conclusion.length;j++)
if (attr_list[k] ==myobject[i].conclusion[j]){
matrix[i][k].z=2;
matrix[i][k].confidence=myobject[i].confidence;
matrix[i][k].premise_supp=myobject[i].premise_supp;
matrix[i][k].conclusion_supp=myobject[i].conclusion_supp;
matrix[i][k].premise=myobject[i].premise;
matrix[i][k].conclusion=myobject[i].conclusion;
}

}
}

var x = d3.scale.ordinal().rangeBand([0, w]),
    z = d3.scale.linear().domain([0, 4]).clamp(true),
    c = d3.scale.category10().domain(d3.range(10));

//Adjusting margins

var ml=0;
for (i in data.attributes) ml=Math.max(ml,i.length);
m[0]=ml*12;
ml=0;
for (var i=0;i<myobject.length;i++) {ml=Math.max(ml,(myobject[i].premise.toString().length))}

m[1]=10+10*Math.log(myobject.length)/Math.LN10;

vis = d3.select("#chart").append("svg:svg")
.attr("width", w + m[1] + m[3])
.attr("height", h + m[0] + m[2])
.append("svg:g")
.attr("transform","translate("+m[1]+","+m[0]+")");

vis.append("rect")
      .attr("class", "background")
      .attr("width", width)
      .attr("height", height);
  
  var row = vis.selectAll(".row")
      .data(matrix)
    .enter().append("g")
      .attr("class", "row")
      .attr("transform", function(d, i) {return "translate(0," + d[0].x*h/myobject.length + ")"; })
      .each(row);


  row.append("line")
      .attr("x2", w)
      .attr("class","matrix_view_separator");


  row.append("text")
      .attr("x",0)
      .attr("dy", "1em")
      .attr("text-anchor", "end")
      .attr("class","label")
      .text(function(d, i) {return "R"+i.toString() /* myobject[i].premise.toString(); */});

   var column = vis.selectAll(".column")
      .data(matrix.transpose())
    .enter().append("g")
      .attr("class", "column")
      .attr("transform", function(d, i) { return "translate(" + d[i].y*w/n + ")rotate(-90)"; });

  column.append("line")
      .attr("x1", -w)
      .attr("class","matrix_view_separator");

  column.append("text")
   .attr("class","label")
      .attr("x", 0)
      .attr("dy", "1em")
      .attr("text-anchor", "start")
      .text(function(d, i) { return attr_list[i]; });

  function row(row) {
  
    var cell = d3.select(this).selectAll(".cell")
        .data(row.filter(function(d) { return d.z; }))
      .enter().append("rect")
        .attr("class", "cell")
        .attr("x", function(d) {return d.y*w/n; })
        .attr("width", w/n)
        .attr("height", h/myobject.length)
        .style("fill-opacity", function(d) { return d.confidence; })
        .style("fill", function(d) {return c(d.z); });
        //.on("mouseover", Matrix_View_MouseOver)
        //.on("mouseout", Matrix_View_MouseOut);
     
  }

}

/*
*
* Scatter Plot
*
*/

function init_scatter_plot(){

//initializing environement

var m = [20, 120, 20, 120]; // margins
var matrix=[];
var n=0;
var attr_list=[];


for (a in data.attributes) {
for(i=0;i<data.attributes[a].length;i++){
if ( (data.attributes[a])[i][0]=="yes") attr_list.push( a.toString());
else
if ( (data.attributes[a])[i][0]=="no") continue;
else
attr_list.push( a.toString()+"-"+(data.attributes[a])[i][0]);
}
}
n=attr_list.length;

//get association rules

var myjson_text='[{"confidence":0.75,"conclusion_supp":6,"premise_supp":8,"premise":[],"conclusion":["US-citizen"]},{"confidence":0.375,"conclusion_supp":3,"premise_supp":8,"premise":[],"conclusion":["age-30to<40"]},{"confidence":0.375,"conclusion_supp":3,"premise_supp":8,"premise":[],"conclusion":["employment-Managerial"]},{"confidence":0.25,"conclusion_supp":2,"premise_supp":8,"premise":[],"conclusion":["employment-Clerical"]},{"confidence":0.5,"conclusion_supp":4,"premise_supp":8,"premise":[],"conclusion":["sex-Female"]},{"confidence":0.5,"conclusion_supp":3,"premise_supp":6,"premise":["US-citizen"],"conclusion":["education-Bachelors"]},{"confidence":0.5,"conclusion_supp":3,"premise_supp":6,"premise":["US-citizen"],"conclusion":["age->=50"]},{"confidence":0.6666666666666666,"conclusion_supp":4,"premise_supp":6,"premise":["US-citizen"],"conclusion":["sex-Male"]},{"confidence":0.6666666666666666,"conclusion_supp":2,"premise_supp":3,"premise":["age-30to<40"],"conclusion":["US-citizen","sex-Male"]},{"confidence":0.3333333333333333,"conclusion_supp":1,"premise_supp":3,"premise":["age-30to<40"],"conclusion":["employment-Managerial","education-Masters","sex-Female"]},{"confidence":0.6666666666666666,"conclusion_supp":2,"premise_supp":3,"premise":["employment-Managerial"],"conclusion":["sex-Female"]},{"confidence":0.6666666666666666,"conclusion_supp":2,"premise_supp":3,"premise":["employment-Managerial"],"conclusion":["US-citizen","age->=50"]},{"confidence":0.5,"conclusion_supp":1,"premise_supp":2,"premise":["employment-Clerical"],"conclusion":["education-Bachelors","US-citizen","sex-Male","age-30to<40"]},{"confidence":0.5,"conclusion_supp":1,"premise_supp":2,"premise":["employment-Clerical"],"conclusion":["age-40to<50","sex-Female"]},{"confidence":0.5,"conclusion_supp":2,"premise_supp":4,"premise":["sex-Female"],"conclusion":["US-citizen","education-Bachelors"]},{"confidence":0.5,"conclusion_supp":2,"premise_supp":4,"premise":["sex-Female"],"conclusion":["employment-Managerial"]},{"confidence":0.25,"conclusion_supp":1,"premise_supp":4,"premise":["sex-Female"],"conclusion":["employment-Clerical","age-40to<50"]},{"confidence":0.3333333333333333,"conclusion_supp":1,"premise_supp":3,"premise":["US-citizen","education-Bachelors"],"conclusion":["sex-Male","employment-Clerical","age-30to<40"]},{"confidence":0.6666666666666666,"conclusion_supp":2,"premise_supp":3,"premise":["US-citizen","education-Bachelors"],"conclusion":["sex-Female"]},{"confidence":0.6666666666666666,"conclusion_supp":2,"premise_supp":3,"premise":["US-citizen","age->=50"],"conclusion":["employment-Managerial"]},{"confidence":0.6666666666666666,"conclusion_supp":2,"premise_supp":3,"premise":["US-citizen","age->=50"],"conclusion":["sex-Male"]},{"confidence":0.5,"conclusion_supp":2,"premise_supp":4,"premise":["US-citizen","sex-Male"],"conclusion":["age-30to<40"]},{"confidence":0.5,"conclusion_supp":2,"premise_supp":4,"premise":["US-citizen","sex-Male"],"conclusion":["employment-Unskilled"]},{"confidence":0.5,"conclusion_supp":2,"premise_supp":4,"premise":["US-citizen","sex-Male"],"conclusion":["age->=50"]},{"confidence":0.5,"conclusion_supp":2,"premise_supp":4,"premise":["US-citizen","sex-Male"],"conclusion":["education-HS-grad"]},{"confidence":0.5,"conclusion_supp":1,"premise_supp":2,"premise":["US-citizen","sex-Male","age-30to<40"],"conclusion":["education-Bachelors","employment-Clerical"]},{"confidence":0.5,"conclusion_supp":1,"premise_supp":2,"premise":["US-citizen","sex-Male","age-30to<40"],"conclusion":["education-HS-grad","employment-Unskilled"]},{"confidence":0.5,"conclusion_supp":1,"premise_supp":2,"premise":["sex-Female","employment-Managerial"],"conclusion":["education-Bachelors","US-citizen","age->=50"]},{"confidence":0.5,"conclusion_supp":1,"premise_supp":2,"premise":["sex-Female","employment-Managerial"],"conclusion":["age-30to<40","education-Masters"]},{"confidence":0.5,"conclusion_supp":1,"premise_supp":2,"premise":["US-citizen","age->=50","employment-Managerial"],"conclusion":["education-Bachelors","sex-Female"]},{"confidence":0.5,"conclusion_supp":1,"premise_supp":2,"premise":["US-citizen","age->=50","employment-Managerial"],"conclusion":["education-HS-grad","sex-Male"]},{"confidence":0.5,"conclusion_supp":1,"premise_supp":2,"premise":["US-citizen","sex-Female","education-Bachelors"],"conclusion":["age->=50","employment-Managerial"]},{"confidence":0.5,"conclusion_supp":1,"premise_supp":2,"premise":["US-citizen","sex-Female","education-Bachelors"],"conclusion":["employment-Professional","age-<30"]},{"confidence":0.5,"conclusion_supp":1,"premise_supp":2,"premise":["sex-Female","employment-Managerial"],"conclusion":["education-Bachelors","US-citizen","age->=50"]},{"confidence":0.5,"conclusion_supp":1,"premise_supp":2,"premise":["sex-Female","employment-Managerial"],"conclusion":["age-30to<40","education-Masters"]},{"confidence":0.5,"conclusion_supp":1,"premise_supp":2,"premise":["US-citizen","sex-Female","education-Bachelors"],"conclusion":["age->=50","employment-Managerial"]},{"confidence":0.5,"conclusion_supp":1,"premise_supp":2,"premise":["US-citizen","sex-Female","education-Bachelors"],"conclusion":["employment-Professional","age-<30"]},{"confidence":0.5,"conclusion_supp":1,"premise_supp":2,"premise":["US-citizen","age->=50","employment-Managerial"],"conclusion":["education-Bachelors","sex-Female"]},{"confidence":0.5,"conclusion_supp":1,"premise_supp":2,"premise":["US-citizen","age->=50","employment-Managerial"],"conclusion":["education-HS-grad","sex-Male"]},{"confidence":0.5,"conclusion_supp":1,"premise_supp":2,"premise":["US-citizen","age->=50","sex-Male"],"conclusion":["employment-Unskilled","education-11th"]},{"confidence":0.5,"conclusion_supp":1,"premise_supp":2,"premise":["US-citizen","age->=50","sex-Male"],"conclusion":["education-HS-grad","employment-Managerial"]},{"confidence":0.5,"conclusion_supp":1,"premise_supp":2,"premise":["US-citizen","sex-Male","age-30to<40"],"conclusion":["education-Bachelors","employment-Clerical"]},{"confidence":0.5,"conclusion_supp":1,"premise_supp":2,"premise":["US-citizen","sex-Male","age-30to<40"],"conclusion":["education-HS-grad","employment-Unskilled"]},{"confidence":0.5,"conclusion_supp":1,"premise_supp":2,"premise":["US-citizen","sex-Male","employment-Unskilled"],"conclusion":["education-HS-grad","age-30to<40"]},{"confidence":0.5,"conclusion_supp":1,"premise_supp":2,"premise":["US-citizen","sex-Male","employment-Unskilled"],"conclusion":["education-11th","age->=50"]},{"confidence":0.5,"conclusion_supp":1,"premise_supp":2,"premise":["US-citizen","age->=50","sex-Male"],"conclusion":["employment-Unskilled","education-11th"]},{"confidence":0.5,"conclusion_supp":1,"premise_supp":2,"premise":["US-citizen","age->=50","sex-Male"],"conclusion":["education-HS-grad","employment-Managerial"]},{"confidence":0.5,"conclusion_supp":1,"premise_supp":2,"premise":["education-HS-grad","US-citizen","sex-Male"],"conclusion":["employment-Unskilled","age-30to<40"]},{"confidence":0.5,"conclusion_supp":1,"premise_supp":2,"premise":["education-HS-grad","US-citizen","sex-Male"],"conclusion":["age->=50","employment-Managerial"]}]';
var myobject=eval('('+myjson_text+')');

//initialize scatter plot

var size = 150,
        padding = 19.5,
        n = myobject.length;

//Position scales
var traits=['confidence','conclusion_supp','premise_supp','lift'];

var x = {}, y = {};
myobject.forEach(function(trait){trait['lift']=trait['confidence']/trait['conclusion_supp'];});

var Ololobject = {'traits':traits};

Ololobject['values'] = myobject;

  Ololobject.traits.forEach(function(trait) {
    var value = function(d) { return d[trait]; },
        domain = [d3.min(Ololobject.values, value), d3.max(Ololobject.values, value)],
        range = [padding / 2, size - padding / 2];
    x[trait] = d3.scale.linear()
    .domain(domain)
    .range(range);

    y[trait] = d3.scale.linear()
    .domain(domain)
    .range(range.slice().reverse());
  });

  // Axes.
  var axis = d3.svg.axis()
      .ticks(5)
      .tickSize(size * traits.length);

  // Brush.
  var brush = d3.svg.brush()
  
      .on("brushstart", brushstart)
      .on("brush", brush)
      .on("brushend", brushend);
  // Root panel.
  var svg = d3.select("#chart").append("svg")
      .attr("width", size * traits.length + padding)
      .attr("height", size * traits.length + padding);

  // X-axis.
  svg.selectAll("g.x.axis")
      .data(Ololobject.traits)
    .enter().append("g")
      .attr("class", "x axis")
      .attr("transform", function(d, i) { return "translate(" + i * size + ",0)"; })
      .each(function(d) { d3.select(this).call(axis.scale(x[d]).orient("bottom")); });

  // Y-axis.
  svg.selectAll("g.y.axis")
      .data(Ololobject.traits)
    .enter().append("g")
      .attr("class", "y axis")
      .attr("transform", function(d, i) { return "translate(0," + i * size + ")"; })
      .each(function(d) { d3.select(this).call(axis.scale(y[d]).orient("right")); });

  // Cell and plot.
  var cell = svg.selectAll("g.cell")
      .data(cross(Ololobject.traits, Ololobject.traits))
    .enter().append("g")
      .attr("class", "cell")
      .attr("transform", function(d) { return "translate(" + d.i * size + "," + d.j * size + ")"; })
      .each(plot);

  // Titles for the diagonal.
  cell.filter(function(d) { return d.i == d.j; }).append("text")
      .attr("x", padding)
      .attr("y", padding)
      .attr("dy", ".71em")
      .text(function(d) { return d.x; });

  function plot(p) {
    var cell = d3.select(this);

    // Plot frame.
    cell.append("rect")
        .attr("class", "frame")
        .attr("x", padding / 2)
        .attr("y", padding / 2)
        .attr("width", size - padding)
        .attr("height", size - padding);

    // Plot dot
    cell.selectAll("circle")
        .data(Ololobject.values)
      .enter().append("circle")
        .attr("class", function(d) { return 1; })
        .attr("cx", function(d) { return x[p.x](d[p.x]); })
        .attr("cy", function(d) { return y[p.y](d[p.y]); })
        .attr("r",function(d){return 3;})
        .on("mouseover", Matrix_View_MouseOver)
        .on("mouseout", Matrix_View_MouseOut);

    // Plot brush.
    cell.call(brush.x(x[p.x]).y(y[p.y]));
  d3.selectAll("rect.background").data([]).exit().remove();
  }

  // Clear the previously-active brush, if any.
  function brushstart(p) {
    if (brush.data !== p) {
      cell.call(brush.clear());
      brush.x(x[p.x]).y(y[p.y]).data = p;
    }
 // d3.select("g.brush").select(".extent").style("display", "block");
  }

  // Highlight the selected circles.
  function brush(p) {
    var e = brush.extent();
    svg.selectAll("circle").attr("class", function(d) {
      return e[0][0] <= d[p.x] && d[p.x] <= e[1][0]
          && e[0][1] <= d[p.y] && d[p.y] <= e[1][1]
          ? 1 : "spl";
    });
  }

  // If the brush is empty, select all circles.
  function brushend() {
    if (brush.empty()) svg.selectAll("circle").attr("class", function(d) {
      return 1;
    });
    d3.select("g.brush").style("pointer-events","all").selectAll(".resize").style("display", "none");
        d3.select("g.brush").select(".extent").style("display", "none");
        d3.select("body").style("cursor", null);
    d3.selectAll("rect.background").data([]).exit().remove();
  }

  function cross(a, b) {
    var c = [], n = a.length, m = b.length, i, j;
    for (i = -1; ++i < n;) for (j = -1; ++j < m;) c.push({x: a[i], i: i, y: b[j], j: j});
    return c;
  }
  
 }
