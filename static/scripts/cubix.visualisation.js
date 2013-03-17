/*
 * Visualisations
 */

var labeling_type = LABEL_MULTILABEL; //  multi
var size_type = 'default';
var color_type = 'default';
var highlightPath = true;

var color = mapColor;//d3.scale.category20c();

var currentVis = 'dagre';
var previousVis = 'dagre';

var w = DEFAULT_WIDTH;
var h = DEFAULT_HEIGHT;
var trans=[0,0];
var scale=1;

var force;
var vis;

var dragging = false;

var noLinks = ["sunburst", "icicle", "sankey"];
    
function resetZoom(){
	scale=1;
	//d3.event.scale = 1;
	
	d3.behavior.zoom()
    .scale(1);

	vis.attr("transform",
      "translate(" + w/2 + ","+ h/2+")"
      + " scale(" + scale + ")");
      
   $( "#zoom_level" ).val("100%");
}

function zoomInOut(value){
	
	var scale = Math.round((value/100)*100)/100;
	
	d3.behavior.zoom()
    .scale(1);

	// TODO only radial vis?
       vis.attr("transform",
      "translate(" + w/2 + ","+ h/2+")"
      + " scale(" + scale + ")");
       
				
	 $( "#zoom_level" ).val( value + "%");
}


function redraw() {
	//if (dragging) return;
	
  trans=d3.event.translate;
  scale=d3.event.scale;
  
  $( "#zoom_level" ).val( Math.round(scale*100)+"%");

  vis.attr("transform",
      "translate(" + trans + ")"
      + " scale(" + scale + ")");
}



function redrawCurVis() { // redraw current visualisation (used e.g. when resizing window)
	d3.select("#chart").html("");
	
	if (currentVis == 'lattice') initFDLattice();
	else if (currentVis == 'sankey') sankeyVis.run(); //initSankey();
	else if (currentVis == 'matrix') matrixVis.run();
	else if (currentVis == 'dagre') dagreVis.run();
    else if (currentVis == 'sunburst') sunburstVis.run();
    else if (currentVis == 'icicle') initIcicle();
	else if (currentVis == 'treemap') treemap();
	else if (currentVis == 'tree') initTree();
	
	else if (currentVis == 'matrixview') { initARView(); createRulesList();}
	else if (currentVis == 'radiagram') { initDiagonalARView(); createRulesList();}
	else if (currentVis == 'gg_ar_plot') { init_gg_plot(); createRulesList(); }
}

function changeVis(visType){
	prevIndex=-1;
  	
  	currentVis = visType;

	redrawCurVis(); // init visualisation

	setPreferredVis(visType); // save preference in the session
}


function updateVis(){
	
	//redrawVis();
	redrawCurVis();
	//d3.select("#chart").html("");
	
	// if (currentVis == 'lattice')  updateFDLattice();
	// else if (currentVis == 'sankey') sankeyVis.run();//updateSankey();
	// else if (currentVis == 'dagre')  dagreVis.run();
    // else if (currentVis == 'sunburst')  sunburstVis.run();
    // else if (currentVis == 'icicle')  updateIcicle();
	// else if (currentVis == 'treemap')  tm_updateTree();//treemap();
	// else if (currentVis == 'tree')  updateTree();
}

// function isTree(){
	// if (currentVis == 'sunburst' || currentVis == 'icicle' || currentVis == 'treemap' || currentVis == 'tree' )
		// return true;
	// else return false;
// }

function setPreferredVis(visType){
	var thetoken = $('input[name=csrfmiddlewaretoken]').val(); // TODO move the fucking token to the header
	
	$.post("/"+WORKSPACE_SLUG+"/fca/set_preferred_vis", {pref_vis : visType, csrfmiddlewaretoken:  thetoken}, function(data){});
	
}

function setOverwhelmingOff(){
	var thetoken = $('input[name=csrfmiddlewaretoken]').val(); // TODO move the fucking token to the header
	
	$.post("/"+WORKSPACE_SLUG+"/fca/set_overwhelming_off", {csrfmiddlewaretoken:  thetoken}, function(data){});
	
}


function exportCurVis(){

 // var sgvel = $("#chart").children()[0];
         // $(sgvel).attr("version", 1.1);
      	 // $(sgvel).attr("xmlns", "http://www.w3.org/2000/svg");
// 
// 
 // var $container = $('#chart'),
        // // Canvg requires trimmed content
        // content = $container.html().trim(),
        // canvas = document.getElementById('svg-canvas');
// 
    // // Draw svg on canvas
    // canvg(canvas, content);
// 
    // // Change img be SVG representation
    // var theImage = canvas.toDataURL('image/png');
    // //$('#svg-img').attr('src', theImage);
//     
    // document.write('<img src="'+theImage+'"/>');
	
	
	
	
	
	var html2 = d3.select("svg")
      .attr("version", 1.1)
      .attr("xmlns", "http://www.w3.org/2000/svg")
      .node().parentNode.innerHTML;

  d3.select("#export-link")
      .attr("title", "file.svg")
      .attr("target", "_blank")
      .attr("href-lang", "image/svg+xml")
      .attr("href", "data:image/svg+xml;base64,\n" + btoa(html2))
      .text("Download");


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
    .value(function(d) { return  1; }); // TODO d.size
    //.value(function(d) { return  Math.round(d.support*100); }); // TODO d.size


	updateIcicle();
}


function updateIcicle(){
	
		var json = lattice.getTree();
       	
       	vis.data([json]);
       
        partition.nodes(json);
        
        rect = vis.selectAll("rect")
	      .data(partition.nodes);
	      
 		rect.enter().append("svg:rect")
	     	.attr("x", function(d) { return x(d.x); })
		      .attr("y", function(d) { return y(d.y); })
		      .attr("width", function(d) { return x(d.dx); })
		      .attr("height", function(d) { return y(d.dy); })
		      .attr("fill", getNodeColor)
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
    
  root = lattice.getTree();//json;
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
  	  .attr("class", "node concept")
  	  .attr("id", function(d) { return "node-"+d.id})
      .attr("r", getNodeSize)//1e-6)
      .style("fill", getNodeColor)
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
      .attr("source_id", function(d) { return d.source_id;})
	  .attr("target_id", function(d) { return d.target_id;})
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


for (a in context.attributeNames) {
for(i=0;i<context.attributeNames[a].length;i++){
if ( (context.attributeNames[a])[i][0]=="yes") attr_list.push( a.toString());
else
if ( (context.attributeNames[a])[i][0]=="no") continue;
else
attr_list.push( a.toString()+"-"+(context.attributeNames[a])[i][0]);
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
for (i in context.attributeNames) ml=Math.max(ml,i.length);
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
