// Module association rules visualisation 
// (c) Copyright 2012 Alexander Mikheev. All Rights Reserved.  

//Global variables
var association_rules;
var full_association_rules;
var color_set=d3.scale.category20();

var premiseColor="#3B14AF";
var conclusionColor="#FFD500";

//Common utilities and functions
function get_attribute_list()
{
	var attr_list=[];
	s=0;
	for (var a in a_rules_concerned_attributes) {
		s++;
		for(var i=0;i<a_rules_concerned_attributes[a].length;i++){
			t=Object();
			t.family=s;			
			if ( (a_rules_concerned_attributes[a])[i][0]=="yes") {
				t.text=a.toString(); 
				attr_list.push( t );
				}
			else
				if ( (a_rules_concerned_attributes[a])[i][0]=="no") continue;
				else
				{
					attr_list.push( t );
				}
		}
	}
	if (s<11) color_set=d3.scale.category10();
	return attr_list;
}

function fetchAssociationRules(callback){	
	if (typeof lattice.id == "undefined" || lattice.id == null) { // no lattice id
		flashAlert("error", "The current concept lattice is not saved in the server - could not compute association rules.");
		return;
	}
	if (typeof association_rules != "undefined") {// already fetched AR, return..
		callback();
		return;
	}
	showLoading();
	
	var thetoken = $('input[name=csrfmiddlewaretoken]').val();
	var arlink = "/api/v1/association_rules/";
	 $.getJSON(arlink,{ lattice_id: lattice.id, csrfmiddlewaretoken:  thetoken}, function(data) {
	 		association_rules = data;
	 		for (var t=0;t<association_rules.length;t++) {
	 			association_rules[t].id="id"+t;
	 			association_rules[t].highlighted=true;
	 			}
	 		hideLoading();
	 		
	 		// That's asynchronous!
	 		if (typeof callback != 'undefined') 
	 		{
	 			// Go through fiters for a_rules
				for (var i=0;i<filter.history.length;i++)
				{
					filter.history[i].removedRules=[];	
					arrjs=[];
					for (var j=0;j<association_rules.length;j++)
					{
						
						flag=true;
						
						for (var k=0;k<association_rules[j].premise.length;k++)
						{
							if (association_rules[j].premise[k]==filter.history[i].attr+'-'+filter.history[i].value) { flag=false;} //break;}
						}
						for (var k=0;k<association_rules[j].conclusion.length;k++)
						{
							if (association_rules[j].conclusion[k]==filter.history[i].attr+'-'+filter.history[i].value) { flag=false;} // break;}
						}
						
						//If attr=value is not in premise/conclusion => remove rule
						
						if (flag) {filter.history[i].removedRules.push(association_rules[j]); arrjs.push(j);}						 
					}
	        	
	        	for (var t=0;t<arrjs.length;t++){association_rules.splice(arrjs[t]-t,1);}

					
					
					
				}
				if (!full_association_rules) full_association_rules = association_rules;	
	 			callback(); 
	 			createScatterPlotChart();
	 		};
	});
	
	
	
}

function addGradient(param,id,lefttoright,toptobottom)
{
	
    var gradient = param.append("linearGradient")
    .attr("id",function(d,i){return "gradient"+id;})
    .attr("spreadMethod", "pad")
    .attr("x1",function (d){ return (lefttoright) ? "0%" : "100%"; })
    .attr("y1",function (d){ return (toptobottom) ? "0%" : "100%"; })
    .attr("x2",function (d){ return (lefttoright) ? "100%" : "0%"; })
    .attr("y2",function (d){ return (toptobottom) ? "100%" : "0%"; });
    
    gradient.append("svg:stop")
    .attr("offset", "0%")
    .attr("stop-color", d3.rgb(premiseColor))
    .attr("stop-opacity", 1);

	gradient.append("svg:stop")
    .attr("offset", "100%")
    .attr("stop-color", d3.rgb(conclusionColor))
    .attr("stop-opacity", 1);

}

function objectJoin (array,symbol)
{
	res="";
	for (var i=0;i<array.length;i++)
		res+=array[i].text+symbol;
	return res.substring(0,res.length-1);
}

/*
*
* Matrix View
*
*/

function initARView(){
	if (typeof association_rules == 'undefined') 
		flashAlert("error", "The association rules couldn't be fetched from the server");
		
		
		
	//initializing environement
	var m = [0, 20, 10, 20]; // margins
	var matrix=[];
	var n=0;
	var attr_list=get_attribute_list();
	n=attr_list.length;
		
	//initialize matrix
	
	for (var i=0;i<association_rules.length;i++){
	matrix[i]=[];
	matrix[i]=d3.range(n).map(function(j){return {x:i, y:j, z:0}});
	}
	
	//fill matrix
	for (var i=0;i<association_rules.length;i++){	
		for (var k=0;k<n;k++) {
			for (var j=0;j<association_rules[i].premise.length;j++)
				if (attr_list[k].text ==association_rules[i].premise[j]){		
					matrix[i][k].z=1;
					matrix[i][k].confidence=association_rules[i].confidence;
					matrix[i][k].premise_supp=association_rules[i].premise_supp;
					matrix[i][k].conclusion_supp=association_rules[i].conclusion_supp;
					matrix[i][k].premise=association_rules[i].premise;
					matrix[i][k].conclusion=association_rules[i].conclusion;
				}
			for (var j=0;j<association_rules[i].conclusion.length;j++)
				if (attr_list[k].text ==association_rules[i].conclusion[j]){					
					matrix[i][k].z=2;
					matrix[i][k].confidence=association_rules[i].confidence;
					matrix[i][k].premise_supp=association_rules[i].premise_supp;
					matrix[i][k].conclusion_supp=association_rules[i].conclusion_supp;
					matrix[i][k].premise=association_rules[i].premise;
					matrix[i][k].conclusion=association_rules[i].conclusion;
				}
		}
	}
	//console.log(association_rules);
	//Adjusting margins
	for (var i=0;i<n;i++){m[0]=Math.max(m[0],attr_list[i].text.length);}
	m[0]=m[0]*7;
	
	m[1]=10+10*Math.log(association_rules.length)/Math.LN10;
	
		vis = d3.select("#chart").append("svg:svg")
		.attr("width", w)
		.attr("height", Math.max(h, association_rules.length*10))
		.append("svg:g")
		.attr("transform","translate("+m[1]+","+m[0]+")");
		
		// vis.append("rect")
		// .attr("class", "background")
		// .attr("width", w)
		// .attr("height", h);

	  
  var row = vis.selectAll(".matrix-row")
      .data(matrix)
    .enter().append("g")
      .attr("class", "matrix-row")
      .attr("transform", function(d, i) {return "translate(0," + d[0].x*(Math.max(10,(h-m[0])/association_rules.length)) + ")"; })
      .each(row);

  row.append("line")
      .attr("x2", w)
      .attr("class","matrix_view_separator");

  row.append("text")
      .attr("x",0)
      .attr("dy", "1em")
      .attr("text-anchor", "end")
      .attr("class","label")
      .text(function(d, i) {return "R"+i.toString()});
   var column = vis.selectAll(".column")
		.data(attr_list)    
    //  .data(matrix.transpose())
    .enter().append("g")
      .attr("class", "column")
      .attr("transform", function(d, i) {if (d[i]) return "translate(" + i*(w-m[1]-1)/n + ")rotate(-90)"; else return "translate(0)rotate(-90)"});
      //.attr("transform", function(d, i) {if (d[i]) return "translate(" + d[i].y*(w-m[1]-1)/n + ")rotate(-90)"; else return "translate(0)rotate(-90)"});
  column.append("line")
      .attr("x1",-w) //-w
      .attr("transform", function(d, i) { return "translate(0," + i*(w-m[1]-1)/n + ")"; })
      .attr("class","matrix_view_separator");
  column.append("text")
   .attr("class","label")
      .attr("x", 0)
      
      .attr("dy", "1em")
      .attr("text-anchor", "start")
      .attr("transform", function(d, i) { return "translate(0," + i*(w-m[1]-1)/n + ")"; })
      .style("stroke",function(d,i){return color_set(attr_list[i].family-1);})
      .text(function(d, i) { return attr_list[i].text; });

  function row(row) {
    var cell = d3.select(this).selectAll(".cell")
        .data(row.filter(function(d) { return d.z; }))
      .enter().append("rect")
        .attr("class", "cell")
        .attr("x", function(d) {return d.y*(w-m[1]-1)/n; })
        .attr("width", (w-1-m[1])/(n))
        .attr("height", Math.max((h-m[0])/association_rules.length,10))
        .style("fill-opacity", function(d) { return d.confidence; })
        .style("fill", function(d) {return d.z==1 ? d3.rgb(premiseColor) : d3.rgb(conclusionColor) ;})
        .on("mouseover", Matrix_View_MouseOver)
        .on("mouseout", Matrix_View_MouseOut);
        
     
  }

}

function Matrix_View_MouseOver(p){

d3.selectAll(".matrix-row text").classed("highlighted", function(d, i) { return i == p.x; });
    d3.selectAll(".column text").classed("highlighted", function(d, i) { return i == p.y; });

var thenode = d3.select(this);
thenode.style("stroke", "red");

// show hoverbox
A_rules_box.style("opacity", 0);
A_rules_box.style("display", "block");
A_rules_box.transition()
.delay(800)
      .duration(300)
      .style("opacity", 1);
    A_rules_box
      .style("left", (d3.event.pageX + 0) + "px")
      .style("top", (d3.event.pageY - 40) + "px")
      .style("width",270+"px")
      .style("height",11+1.7*Math.max(p.premise.length,p.conclusion.length)+"em");

    if (p.z==1) wrapperElementsInList($('ul.hb_role'), ["Antecedent"])
    else wrapperElementsInList($('ul.hb_role'), ["Consequent"]);
    wrapperElementsInList($('ul.hb_confidence'), p.confidence);
    wrapperElementsInList($('ul.hb_p_support'), p.premise_supp);
    wrapperElementsInList($('ul.hb_c_support'), p.conclusion_supp);
	wrapperElementsInList($('ul.hb_premise_list'),p.premise);
	wrapperElementsInList($('ul.hb_consequence_list'), p.conclusion);

}

function Matrix_View_MouseOut(){
d3.selectAll("text").classed("highlighted", false);

if(mouseOverHoverBox) return;

var thenode = d3.select(this);
thenode.style("stroke", "none");

// hide hoverbox
A_rules_box.transition()
.delay(800)
      .duration(200)
      .style("opacity", 0);
    
    A_rules_box.style("display", "none");
}

/*
*
* Radial Diagram
*
*/

var rx = w / 2,
    ry = h / 2,
    rotate = 0;
    


function initDiagonalARView(){
	if (typeof association_rules == 'undefined') 
		flashAlert("error", "The association rules couldn't be fetched from the server");
		
	//Processing attributes
	attr_list=get_attribute_list();
	var n=0,
		o=0;
	for (a in data.attributes) {n++;}
	n+=attr_list.length;
	o=n-attr_list.length;
	
	//Adjusting margins	
	var m = [0, 120, 20, 120]; // margins
	for (var i=0;i<attr_list.length;i++){m[0]=Math.max(m[0],attr_list[i].text.length);}
	m[0]=m[0]*0;
	//initializing environement
	vis = d3.select("#chart").append("svg:svg")
	.attr("width",w)
	.attr("height",h)
 	.attr("viewBox",((-1)*(m[0]+0*rx))+" "+((-1)*(m[0]+0*ry))+" "+(2*rx+0*m[0])+" "+(2*ry+0*m[0]))
  .append("svg:g")
    .attr("transform", "translate(" + rx + "," + ry + "), scale(1.5)");
	
	

	//Building layout

	var node_mas=[];
	var z=0,
	    s=0;
	    
	//global parent for every node
	var parent=Object();
	parent.children=[];
	parent.x=0;
	parent.y=0;

	//calculate layout
	for (var a in data.attributes)
		{
			//attribution to family (attribute)
			var sub_parent=Object();
			sub_parent.children=[];
			sub_parent.name=a.toString();
			sub_parent.parent=parent;
			sub_parent.x=(w/4-50)*(Math.cos(s*2*Math.PI/o));
			sub_parent.y=(w/4-50)*(Math.sin(s*2*Math.PI/o))
			s++;
			for(var i=0;i<data.attributes[a].length;i++){
				var c=Object();				
				if ( (data.attributes[a])[i][0]=="yes")
				{
					c.family=s;
					c.parent=sub_parent;
					c.x=(w/2-100)*(Math.cos(z*2*Math.PI/n));
					c.y=(w/2-100)*(Math.sin(z*2*Math.PI/n));
					c.name=a.toString();sub_parent.children.push(c); node_mas.push(c);z++;}
				else
					if ( (data.attributes[a])[i][0]=="no") continue;
					else
						{
						c.family=s;
						c.parent=sub_parent;
						c.x=(w/2-100)*(Math.cos(z*2*Math.PI/n));
						c.y=(w/2-100)*(Math.sin(z*2*Math.PI/n));
						c.name=a.toString()+"-"+(data.attributes[a])[i][0];
						z++;
						node_mas.push(c);sub_parent.children.push(c);	
						}	
		}
			parent.children.push(sub_parent);
			z++;
		}

	var rules_links=[];
	
	for (var i=0;i<association_rules.length;i++)
		{
		
			for (var j=0;j<association_rules[i].premise.length;j++)
				{
					source=Object();
					for (var t=0;t<node_mas.length;t++)
						{
						if(node_mas[t].name==association_rules[i].premise[j])
							{						
								source.parent=node_mas[t].parent;
								source.x=node_mas[t].x;
								source.y=node_mas[t].y;
							}
							for (var k=0;k<association_rules[i].conclusion.length;k++)
								{
								var target=Object();
								for (var u=0;u<node_mas.length;u++)
									if(node_mas[u].name==association_rules[i].conclusion[k])
										{
											target.parent=node_mas[u].parent;
											target.x=node_mas[u].x;
											target.y=node_mas[u].y;
											target.id=association_rules[i].id;
											z=Object();
											z.source=source;
											z.target=target;
											z.conf=association_rules[i].confidence;
										
											rules_links.push(z);
										}
								}
						}
										
				}
		}
	var cluster = d3.layout.cluster()		
    	.size([2 * Math.PI, 500]);
    	
    var bundle=d3.layout.bundle();
    splines = bundle(rules_links);
    for (i=0;i<splines.length;i++) {
	for(j=0;j<splines[i].length;j++) 
	{
	splines[i][j].parent=0;  if (splines[i][j].children!==undefined) splines[i][j].children=0;
	}
	}
    splines=unique_set(splines,true);
    
    //Adding gradients
    var defs=d3.select("#chart").select("svg").append("defs")
    addGradient(defs,"lt-rb",true,true);
    addGradient(defs,"lb-rt",true,false);
    addGradient(defs,"rt-lb",false,true);
    addGradient(defs,"rb-lt",false,false);
    
    //Drawing links
    vis.selectAll("path")
    	.data(splines)
    .enter().append("path")
	    .style("stroke-width", function(d){return 2*z.conf+1;})
	    .style("fill", "none")
	    .attr("id",function(d){return d[4].id;})
	    .attr("d",function(d,i){
	    	pathinfo=[];
	    	for (var a=0;a<d.length;a++) {point={}; point.x=d[a].x; point.y=d[a].y; pathinfo.push(point);}
	    	var d3line2=d3.svg.line()
	    	 .x(function(d){return d.x;})
	    	 .y(function(d){return d.y;})
	         .interpolate("bundle").tension(0.1);
	    	 
	    	 return d3line2(pathinfo)})
	    .style("stroke",function(d,i){
	    	left_to_right=(d[0].x>d[4].x)? false : true ;
    		top_to_bottom=(d[0].y>d[4].y)? false : true ;
    		if (left_to_right && top_to_bottom) return "url(#gradientlt-rb)";
    		else if (!left_to_right && top_to_bottom) return "url(#gradientrt-lb)";
    		else if (left_to_right && !top_to_bottom) return "url(#gradientlb-rt)";
    		else return "url(#gradientrb-lt)";});
	    	 
	  circle = vis.selectAll("g.node")
		.data(node_mas)
	  .enter().append("svg:line")
	  	.attr("x1",function(d){return d.x-Math.max(1,(w/2-100)*(Math.PI/(2*n)));})
	  	.attr("y1",function(d){return d.y;})
	  	.attr("x2",function(d){return d.x+Math.max(1,(w/2-100)*(Math.PI/(2*n)));})
	  	.attr("y2",function(d){return d.y;})
	  	.attr("transform",function(d){return "rotate("+Math.atan((-1)*d.x/d.y)*180/Math.PI+" "+d.x+" "+d.y+")";})
	  	.style("stroke",function(d){return color_set(d.family-1);});
      text = vis.selectAll("g.node")
		.data(node_mas)
	  .enter().append("svg:text")
	    .attr("dx", function(d){return d.x>0 ? "1em": "-1em";})
	    .attr("dy","0.31em")
	    .style("pointer-events","none")
	    .attr("text-anchor", function(d){return d.x>0 ? "start": "end";})
      	.text(function(d){return d.name;})
      	.style("stroke",function(d){return color_set(d.family-1);})
      	.attr("transform",function(d){return "translate("+d.x+","+d.y+")rotate("+Math.atan(d.y/d.x)*180/Math.PI+")";});
	  	
}

function cross(a, b) {
  return a[0] * b[1] - a[1] * b[0];
}

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1];
}

function isParentOf(p, c) {

  if (p === c) return true;
  if (p.children) {
    return p.children.some(function(d) {
      return isParentOf(d, c);
    });
  }
  return false;
}

/*
*
* Scatter Plot
*
*/

function init_scatter_plot(renderTo){

renderTo = renderTo || "#chart";
//initializing environement

var m = [20, 120, 20, 120]; // margins

var n=0;
var attr_list=get_attribute_list();
var brush;
n=attr_list.length;

//get association rules
var myobject=full_association_rules;

//initialize scatter plot

var size = 90,
        padding = 17.5,
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
  brush = d3.svg.brush() 
      .on("brushstart", brushstart)
      .on("brush", brush)
      .on("brushend", brushend);
      
  // Root panel.
  var svg = d3.select(renderTo).append("svg")
      .attr("width", size * traits.length + padding)
      .attr("align","center")
      .attr("height", size * traits.length + padding);
  svg.append("svg:rect")
   .attr("x", 0)
   .attr("y", 0)
   .attr("height", "100%")
   .attr("width", "100%")
   .attr("fill", "#FFFFFF");
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
      .data(sp_cross(Ololobject.traits, Ololobject.traits))
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

    // Plot dots
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
    //d3.selectAll("rect.background").data([]).exit().remove();
  }

  // Clear the previously-active brush, if any.
  function brushstart(p) {
    if (brush.data !== p) {
      cell.call(brush.clear());
      brush.x(x[p.x]).y(y[p.y]).data = p;
    }
  }

  // Highlight the selected circles.
  function brush(p) {
    var e = brush.extent();
    association_rules=[];
    svg.selectAll("circle").attr("class", function(d) {
      if (e[0][0] <= d[p.x] && d[p.x] <= e[1][0]
          && e[0][1] <= d[p.y] && d[p.y] <= e[1][1])
          {
          	topush=true;
          	
          	for (var i=0;i<association_rules.length;i++)
          	{
          		//eliminate redundant association rules
          		if (compare_a_rules(association_rules[i],d)) topush=false;         		
          	}
          	
          	if (topush) {association_rules.push(d);}
          	return 1;
          }
          else
          {
          	return "spl";
          }
          
    });
    
  }

  // If the brush is empty, select all circles.
  function brushend() {
    if (brush.empty()) svg.selectAll("circle").attr("class", function(d) {
      association_rules=full_association_rules;
      return 1;
    });
    document.getElementById("chart").innerHTML="";
    //document.getElementById(renderTo).innerHTML="";
    redrawVis();
    /*
    d3.select("g.brush").style("pointer-events","all").selectAll(".resize").style("display", "none");
        d3.select("g.brush").select(".extent").style("display", "none");
        d3.select("body").style("cursor", null);
    
    d3.selectAll("rect.background").data([]).exit().remove();
    */
  }

  function sp_cross(a, b) {
    var c = [], n = a.length, m = b.length, i, j;
    for (var i = -1; ++i < n;) for (var j = -1; ++j < m;) c.push({x: a[i], i: i, y: b[j], j: j});
    return c;
  }
  
 }

/*
*
* Grouped graph plot
*
*/

function init_gg_plot(){

//initializing environement
var m = [20, 120, 20, 120]; // margins

var n=0;
var attr_list=get_attribute_list();
var brush;

//get and parse association rules
var myobject=clone(association_rules);
var n = myobject.length;

for (var i=0;i<myobject.length;i++)
	{
	for (var j=0;j<myobject[i].premise.length;j++)		
		for (var k=0;k<attr_list.length;k++)
		{
			if (myobject[i].premise[j]==attr_list[k].text)
				{
					res = Object();
					res.family = attr_list[k].family;
					res.text = attr_list[k].text;
					myobject[i].premise[j] = res;
				}
		}
	
	for (var j=0;j<myobject[i].conclusion.length;j++)		
		for (var k=0;k<attr_list.length;k++)
		{
			if (myobject[i].conclusion[j]==attr_list[k].text)
				{
					res = Object();
					res.family = attr_list[k].family;
					res.text = attr_list[k].text;
					myobject[i].conclusion[j] = res;
				}
		}
	}
//transform 'em to groups, form links with 2 indexes
var links = [];
//common parent - one node to rule them all, one node to bind them
common_parent = Object();
common_parent.children=[];

for (var i=0; i<n ; i++)
	{
	// parent - group representatif - to be pushed into common_parent
	// contains indexes
		t_link=[-1,-1];
		p_parent=Object();
		p_parent.occurencies=1;
		p_parent.parent=common_parent;
		p_parent.text= objectJoin( myobject[i].premise,'&');
		p_parent.children=myobject[i].premise;
		p_parent.children=p_parent.children.map(function (element) {
			res=Object();
			res= element;
			res.occurencies=1; res.parent=p_parent; return res;
			});
		c_parent=Object();
		c_parent.occurencies=1;
		c_parent.parent=common_parent;
		c_parent.text= objectJoin( myobject[i].conclusion,'&');
		c_parent.children=myobject[i].conclusion;
		c_parent.children=c_parent.children.map(function (element) {
			res=Object();
			res=element;
			res.occurencies=1; res.parent=p_parent; return res;
			});
		
		for (var j=0;j<common_parent.children.length;j++)
		{ 
			if (objectJoin( myobject[i].premise,'&')==common_parent.children[j].text) 
			{
				t_link[0]=j;
				common_parent.children[j].occurencies++;
				p_parent.occurencies++;
				common_parent.children[j].children=common_parent.children[j].children.map(function (element) {element.occurencies=common_parent.children[j].occurencies/common_parent.children[j].children.length; return element;});
			};
			if (objectJoin( myobject[i].conclusion,'&')==common_parent.children[j].text)
			{
				t_link[1]=j; 
				common_parent.children[j].occurencies++;
				c_parent.occurencies++;
				common_parent.children[j].children=common_parent.children[j].children.map(function (element) {element.occurencies=common_parent.children[j].occurencies/common_parent.children[j].children.length; return element;});			
			};
			
		}
		if (p_parent.occurencies==1) {t_link[0]=common_parent.children.length; common_parent.children.push(p_parent)};
		if (c_parent.occurencies==1) {t_link[1]=common_parent.children.length; common_parent.children.push(c_parent)};
		t_link[2]=myobject[i].confidence;
		links.push(t_link);
	}

// Root panel.
var xdom = d3.scale.linear().range([0,w]);
var ydom = d3.scale.linear().range([0,h]);

var vis = d3.select("#chart").append("svg")
    .attr("width", w)
    .attr("height", h);
    
//Adding gradient
//addGradient(d3.select("#chart").select("svg"));


var pack = d3.layout.pack()
	.size([w,h])
	.value(function(d) {return d.occurencies*100;});    
 
var origin = common_parent.children;
var nodes = pack.nodes(common_parent);
var node,root;
node=common_parent; root=common_parent;
 
vis.selectAll("circle")
    .data(nodes)
  .enter().append("svg:circle")
    .attr("class", function(d) { return d.children ? "parent" : "child"; })
    .style("fill", function(d) {if (d.family) return color_set(d.family-1);})
    .attr("cx", function(d) { return d.x; })
    .attr("cy", function(d) { return d.y; })
    .attr("r", function(d) { return d.r; })
    .on("click", function(d) { return zoom(node == d ? root : d); }); 

links= unique_set(links);

vis.selectAll("line")
    .data(links)
   .enter().append("svg:line")
     .style("stroke-width", function(d){return (2*d[2]+1);})
	 .attr("x1",function(d){return origin[d[0]].x;})
	 .attr("y1",function(d){return origin[d[0]].y;})
	 .attr("x2",function(d){return origin[d[1]].x;})
	 .attr("y2",function(d){return origin[d[1]].y;})
	 .style("stroke",d3.interpolateRgb(premiseColor,conclusionColor)(0.5));

//Arrows
vis.selectAll("polygon")
	.data(links)
   .enter().append("svg:polygon")
     //.style("stroke-width", function(d){return 3*d[2];})
	 .attr("points",function(d){
	 	
	 	return (-5)*(d[2]+1)+","+3*(d[2]+1)+" "+(-5)*(d[2]+1)+","+(-3)*(d[2]+1)+" "+3*(d[2]+1)+",0";
	 	})
	 .style("fill",d3.interpolateRgb(premiseColor,conclusionColor)(0.5))
	 .attr("transform",function(d){return "translate("+
	 0.5*(origin[d[0]].x+origin[d[1]].x)+","+
	 0.5*(origin[d[0]].y+origin[d[1]].y)+"), rotate("+
	 180*(1/Math.PI)*Math.atan((origin[d[1]].y-origin[d[0]].y)/(origin[d[1]].x-origin[d[0]].x))
	 +")";});


vis.selectAll("text")
      .data(nodes)
    .enter().append("svg:text")
      //.attr("class", function(d) { return d.children ? "parent" : "child"; })
      .style("pointer-events","none")
      .attr("x", function(d) { return d.x; })
      .attr("y", function(d) { return d.y; })
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .style("opacity", function(d) { return d.r > 30 ? 1 : 0; })
      .text(function(d) {return d.depth==2 ? d.text : ""; });

function zoom(d, i) {
  var k = common_parent.r / (d.r );

  if (w>h)
  {
  xdom.domain([d.x-Math.abs(h-w)/(2*k) - d.r, d.x+Math.abs(h-w)/(2*k) + d.r]);
  ydom.domain([d.y - d.r, d.y + d.r]);
  }
  else
  {
  xdom.domain([d.x - d.r, d.x + d.r]);
  ydom.domain([d.y-Math.abs(h-w)/(2*k) - d.r, d.y+Math.abs(h-w)/(2*k) + d.r]);
  } 
  
  var t = vis.transition()
      .duration(d3.event.altKey ? 7500 : 750); 
  t.selectAll("circle")
      .attr("cx", function(d) { return xdom(d.x) })
      .attr("cy", function(d) { return ydom(d.y); })
      .attr("r", function(d) { return k * d.r; });
  
  t.selectAll("line")
     .attr("x1",function(d){return xdom(origin[d[0]].x);})
	 .attr("y1",function(d){return ydom(origin[d[0]].y);})
	 .attr("x2",function(d){return xdom(origin[d[1]].x);})
	 .attr("y2",function(d){return ydom(origin[d[1]].y);});	
	
  t.selectAll("polygon")	
	.attr("transform",function(d){
		return "translate("+ xdom(0.5*(origin[d[0]].x+origin[d[1]].x))+","+	ydom(0.5*(origin[d[0]].y+origin[d[1]].y))+"), rotate("+180*(1/Math.PI)*Math.atan((origin[d[1]].y-origin[d[0]].y)/(origin[d[1]].x-origin[d[0]].x))+")";});
	
  t.selectAll("text")
      .attr("x", function(d) { return xdom(d.x); })
      .attr("y", function(d) { return ydom(d.y); })
      .style("opacity", function(d) { return k * d.r > 30 ? 1 : 0; });

  node = d;
}


 }

