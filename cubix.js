// THIS JAVASCRIPT SHOULD BE LOADED BEFORE ALL OTHERS (cubix.x.js)

/*
 * Constants
 */
// context

var SEPARATOR = "-";

// layout
var DEFAULT_WIDTH = 570; //960
var DEFAULT_HEIGHT = 500; // 600


// lattice
var MAX_ENTITY_SIZE = 2; // max numer of attributes or objects


// size
var DEFAULT_NODE_RADIUS = 8;
var NODE_MAX_SIZE = 16;
var NODE_MIN_SIZE = 6;

var SIZE_STABILITY = 2;
var SIZE_SUPPORT = 2;
var SIZE_DEFAULT = 1;

// labels
var LABEL_REPETITIVE = 1;
var LABEL_MULTILABEL = 2;
var LABEL_SUPPORT = 3;

// colors
var SELECTED_FILL_COLOR = "#FF0000";
var DEFAULT_FILL_COLOR = "#aaaaff";
var DEFAULT_OPACITY = 0.3;


function getAssociationRules() {
	$.ajax({
		url : "/api/v1/",
		context : document.body
	}).done(function() {
		$(this).addClass("done");
	});
}

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
	for (a in a_rules_concerned_attributes) {
		s++;
		for(i=0;i<a_rules_concerned_attributes[a].length;i++){
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
					t.text=a.toString()+"-"+(a_rules_concerned_attributes[a])[i][0];
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
	 		for (t=0;t<association_rules.length;t++) {
	 			association_rules[t].id="id"+t;
	 			association_rules[t].highlighted=true;
	 			}
	 		hideLoading();
	 		
	 		// That's asynchronous!
	 		if (typeof callback != 'undefined') 
	 		{
	 			// Go through fiters for a_rules
				for (i=0;i<filter.history.length;i++)
				{
					filter.history[i].removedRules=[];	
					arrjs=[];
					for (j=0;j<association_rules.length;j++)
					{
						
						flag=true;
						
						for (k=0;k<association_rules[j].premise.length;k++)
						{
							if (association_rules[j].premise[k]==filter.history[i].attr+'-'+filter.history[i].value) { flag=false;} //break;}
						}
						for (k=0;k<association_rules[j].conclusion.length;k++)
						{
							if (association_rules[j].conclusion[k]==filter.history[i].attr+'-'+filter.history[i].value) { flag=false;} // break;}
						}
						
						//If attr=value is not in premise/conclusion => remove rule
						
						if (flag) {filter.history[i].removedRules.push(association_rules[j]); arrjs.push(j);}						 
					}
	        	
	        	for (t=0;t<arrjs.length;t++){association_rules.splice(arrjs[t]-t,1);}

					
					
					
				}
				if (!full_association_rules) full_association_rules = association_rules;	
	 			callback(); 
	 			createScatterPlotChart();
	 			createRulesList();
	 		};
	});
	
	
	
}

function select_rule(id)
{
	
	if(prevIndex !== -1) {
	updated_prev=false;
		for( t = 0; !(updated_prev) ; t++) {
			if(rules_list_chart.series[0].data[t].category == prevIndex) {
				rules_list_chart.series[0].data[t].update({
						color : '#4572A7'
				}, true, false);
			updated_prev=true;
			}
		}
	}
	updated_selection =  false;
	for( t = 0; !(updated_selection) ; t++) {
		if(rules_list_chart.series[0].data[t].category == id) {
			rules_list_chart.series[0].data[t].update({
				color : '#f00'
			}, true, false);
		updated_selection =  true;
		}					
	}
	
	if (currentVis=='radiagram')
	{
		d3.select("#chart").select("svg").selectAll("path").style("opacity", function(d) {
							flag=false;
							for (i=0;i<d[0].ids.length;i++)
							{
								if (d[0].ids[i]==id) {flag=true; break;}
							}
							return flag ? 0.99 : 0.1;
						});
	}
	else if (currentVis=='matrixview')
	{
		d3.select("#chart").select("svg").selectAll(".matrix-row").style("opacity",function(d){return d[0].id==id ? 0.99 : 0.05;});
	}
	else if (currentVis=='gg_ar_plot')
	{
		d3.select("#chart").select("svg").selectAll("line").style("opacity", function(d) {
							return d[3]==id ? 0.99 : 0.1;
						});
		d3.select("#chart").select("svg").selectAll("polygon").style("opacity", function(d) {
							return d[3]==id ? 0.99 : 0.1;
						});
		d3.select("#chart").select("svg").selectAll("circle").style("opacity", function(d) {
							flag=false;
							console.log(d);
							if (d.ids){
							for (i=0;i<d.ids.length;i++)
							{
								if (d.ids[i]==id) {flag=true; break;}
							}
							return flag ? 0.99 : 0.1;
							}
							else return 1.00;
						});					
	}
	
	prevIndex = id;
	
}

function unselect_all()
{
	
	if(prevIndex !== -1) {

						for( t = 0; t < rules_list_chart.series[0].data.length; t++) {
							if(rules_list_chart.series[0].data[t].category == prevIndex) {
								rules_list_chart.series[0].data[t].update({
									color : '#4572A7'
								}, true, false);
								break;
							}
						}
	
	if (currentVis=='radiagram')
	{
		d3.select("#chart").select("svg").selectAll("path").style("opacity",0.99);
	}
	else if (currentVis=='matrixview')
	{
		d3.select("#chart").select("svg").selectAll(".matrix-row").style("opacity", 1.00);
	}
	else if (currentVis=='gg_ar_plot')
	{
		d3.select("#chart").select("svg").selectAll("line").style("opacity", 0.99);
		d3.select("#chart").select("svg").selectAll("polygon").style("opacity",0.99);
		d3.select("#chart").select("svg").selectAll("circle").style("opacity", 1.00);			
	}
	prevIndex = -1;
	}
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
	for (i=0;i<array.length;i++)
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
					matrix[i][0].id=association_rules[i].id;
					matrix[i][k].id=association_rules[i].id;
				}
			for (var j=0;j<association_rules[i].conclusion.length;j++)
				if (attr_list[k].text ==association_rules[i].conclusion[j]){					
					matrix[i][k].z=2;
					matrix[i][k].confidence=association_rules[i].confidence;
					matrix[i][k].premise_supp=association_rules[i].premise_supp;
					matrix[i][k].conclusion_supp=association_rules[i].conclusion_supp;
					matrix[i][k].premise=association_rules[i].premise;
					matrix[i][k].conclusion=association_rules[i].conclusion;
					matrix[i][0].id=association_rules[i].id;
					matrix[i][k].id=association_rules[i].id;
				}
		}
	}
	//Adjusting margins
	for (i=0;i<n;i++){m[0]=Math.max(m[0],attr_list[i].text.length);}
	m[0]=m[0]*7;
	
	m[1]=20+10*Math.log(association_rules.length)/Math.LN10;
	
		vis = d3.select("#chart").append("svg:svg")
		.attr("width", w)
		.attr("height", Math.max(h, association_rules.length*10))
		.append("svg:g")
		.attr("transform","translate("+m[1]+","+m[0]+")");

	  
  var row = vis.selectAll(".matrix-row")
      .data(matrix)
    .enter().append("g")
      .attr("class", "matrix-row")
      .attr("id",function(d) {return d[0].id;})
      .attr("transform", function(d, i) {return "translate(0," + d[0].x*(Math.max(10,(h-m[0])/association_rules.length)) + ")"; })
      .each(row);

  row.append("line")
      .attr("x2", w)
      .attr("y1",(Math.max(10,(h-m[0])/association_rules.length)))
      .attr("y2",(Math.max(10,(h-m[0])/association_rules.length)))
      .attr("class","matrix_view_separator")
      .style("fill-opacity", 0.99);
    row.append("line")
      .attr("x2", w)
      .attr("class","matrix_view_separator")
      .style("fill-opacity", 0.99);

  row.append("text")
      .attr("x",0)
      .attr("dy", "1em")
      .attr("text-anchor", "end")
      .attr("class","label")
      .text(function(d) {return d[0].id;});
   var column = vis.selectAll(".column")
		.data(attr_list)    
    .enter().append("g")
      .attr("class", "column")
      .attr("transform", function(d, i) {if (d[i]) return "translate(" + i*(w-m[1]-1)/n + ")rotate(-90)"; else return "translate(0)rotate(-90)"});
  column.append("line")
      .attr("x1",-w) 
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
        .on("mouseout", Matrix_View_MouseOut)
        .on("click",function (p){console.log(p.id); select_rule(p.id)});
        
     
  }

}

function Matrix_View_MouseOver(p){

d3.selectAll(".matrix-row text").classed("highlighted", function(d, i) { return i == p.x; });
    d3.selectAll(".column text").classed("highlighted", function(d, i) { return i == p.y; });

var thenode = d3.select(this);
//console.log(p);
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
	for (a in context.attributeNames) {n++;}
	n+=attr_list.length;
	o=n-attr_list.length;
	
	//Adjusting margins	
	var m = [0, 120, 20, 120]; // margins
	for (i=0;i<attr_list.length;i++){m[0]=Math.max(m[0],attr_list[i].text.length);}
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

	//Null-antecedent
	s_parent=Object();
	s_parent.children=[];
	s_parent.name="<Nothing family>";
	s_parent.parent=parent;
	s_parent.x=(w/4-50);
	s_parent.y=0;
	f=Object();				
	f.family=s;
	f.parent=s_parent;
	f.x=(w/2-100);
	f.y=0;
	f.name="Nothing";
	s_parent.children.push(f);
	node_mas.push(f);
	z++;z++;
	o++;
	n++;

	//calculate layout
	for (a in context.attributeNames)
		{
			//attribution to family (attribute)
			var sub_parent=Object();
			sub_parent.children=[];
			sub_parent.name=a.toString();
			sub_parent.parent=parent;
			sub_parent.x=(w/4-50)*(Math.cos(s*2*Math.PI/o));
			sub_parent.y=(w/4-50)*(Math.sin(s*2*Math.PI/o))
			s++;
			for(i=0;i<context.attributeNames[a].length;i++){
				var c=Object();				
				if ( (context.attributeNames[a])[i][0]=="yes")
				{
					c.family=s;
					c.parent=sub_parent;
					c.x=(w/2-100)*(Math.cos(z*2*Math.PI/n));
					c.y=(w/2-100)*(Math.sin(z*2*Math.PI/n));
					c.name=a.toString();sub_parent.children.push(c); node_mas.push(c);z++;}
				else
					if ( (context.attributeNames[a])[i][0]=="no") continue;
					else
						{
						c.family=s;
						c.parent=sub_parent;
						c.x=(w/2-100)*(Math.cos(z*2*Math.PI/n));
						c.y=(w/2-100)*(Math.sin(z*2*Math.PI/n));
						c.name=a.toString()+"-"+(context.attributeNames[a])[i][0];
						z++;
						node_mas.push(c);sub_parent.children.push(c);	
						}	
		}
			parent.children.push(sub_parent);
			z++;
		}

	var rules_links=[];
	var general_links=[];
	//Now forming links
	for (u=0;u<node_mas.length;u++)
		{
		for (t=0;t<node_mas.length;t++)
		{
			if (u!==t) {
				//fill in ids and confidencies
				ids=[];
				confidencies=[];
				for (l=0;l<association_rules.length;l++){
					//attention for null - antecedent
					if (association_rules[l].premise.length==0 && t==0)
					{
						ids.push(association_rules[l].id);
						confidencies.push(association_rules[l].confidence);
					}
					else
					{
					//if link in rule, add ids
					link_in_rule=false;
					in_premise=false;
					in_conclusion=false;
					for (counter=0;counter<association_rules[l].premise.length;counter++)
					{if (association_rules[l].premise[counter]==node_mas[t].name){ in_premise=true; break;}}
					for (counter=0;counter<association_rules[l].conclusion.length;counter++)
					{if (association_rules[l].conclusion[counter]==node_mas[u].name) {in_conclusion=true; break;}}
					link_in_rule=in_premise && in_conclusion;
					if (link_in_rule)
					{
						//add id and confidence
						ids.push(association_rules[l].id);
						confidencies.push(association_rules[l].confidence);
					}
				
					}
					
				}
				if (ids.length>0)
				{
					source=Object();
					source.parent=node_mas[t].parent;
					source.ids=ids;
					source.conf=confidencies;
					source.x=node_mas[t].x;
					source.y=node_mas[t].y;
					target=Object();
					target.parent=node_mas[u].parent;
					target.x=node_mas[u].x;
					target.y=node_mas[u].y;
					z=Object();
					z.source=source;
					z.target=target;
					//z.conf=association_rules[l].confidence;
					general_links.push(z);
				}
				
			}	
		}
	}
	
	var cluster = d3.layout.cluster()		
    	.size([2 * Math.PI, 500]);
    	
    var bundle=d3.layout.bundle();
    m_splines= bundle(general_links); 
        
    //Adding gradients
    var defs=d3.select("#chart").select("svg").append("defs")
    addGradient(defs,"lt-rb",true,true);
    addGradient(defs,"lb-rt",true,false);
    addGradient(defs,"rt-lb",false,true);
    addGradient(defs,"rb-lt",false,false);
    
    //Drawing links
    vis.selectAll("path")
    	.data(m_splines)
   // 	.data(splines)
    .enter().append("path")
	    .style("stroke-width", function(d){return 2*d3.max(d[0].conf)+1;})
	    .style("fill", "none")
	    .attr("ids",function(d){return d[0].ids;})
	    .attr("confs",function(d){return d[0].conf;})
	    .attr("d",function(d,i){
	    	pathinfo=[];
	    	for (a=0;a<d.length;a++) {point={}; point.x=d[a].x; point.y=d[a].y; pathinfo.push(point);}
	    	var d3line2=d3.svg.line()
	    	 .x(function(d){return d.x;})
	    	 .y(function(d){return d.y;})
	         .interpolate("bundle").tension(0.1);
	    	 
	    	 return d3line2(pathinfo)})
	    .style("stroke",function(d,i){
	    	left_to_right=(d[0].x>d[d.length-1].x)? false : true ;
    		top_to_bottom=(d[0].y>d[d.length-1].y)? false : true ;
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
          	
          	for (i=0;i<association_rules.length;i++)
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
    createRulesList();
    /*
    d3.select("g.brush").style("pointer-events","all").selectAll(".resize").style("display", "none");
        d3.select("g.brush").select(".extent").style("display", "none");
        d3.select("body").style("cursor", null);
    
    d3.selectAll("rect.background").data([]).exit().remove();
    */
  }

  function sp_cross(a, b) {
    var c = [], n = a.length, m = b.length, i, j;
    for (i = -1; ++i < n;) for (j = -1; ++j < m;) c.push({x: a[i], i: i, y: b[j], j: j});
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

for (i=0;i<myobject.length;i++)
	{
	for (j=0;j<myobject[i].premise.length;j++)		
		for (k=0;k<attr_list.length;k++)
		{
			if (myobject[i].premise[j]==attr_list[k].text)
				{
					res = Object();
					res.family = attr_list[k].family;
					res.text = attr_list[k].text;
					myobject[i].premise[j] = res;
				}
		}
	
	for (j=0;j<myobject[i].conclusion.length;j++)		
		for (k=0;k<attr_list.length;k++)
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
		p_parent.ids=[];
		p_parent.ids.push(myobject[i].id);
		p_parent.text= objectJoin( myobject[i].premise,'&');
		p_parent.children=myobject[i].premise;
		p_parent.children=p_parent.children.map(function (element) {
			res=Object();
			res= element;
			res.occurencies=1; res.parent=p_parent; res.ids=p_parent.ids; return res;
			});
		c_parent=Object();
		c_parent.occurencies=1;
		c_parent.parent=common_parent;
		c_parent.ids=[];
		c_parent.ids.push(myobject[i].id);
		c_parent.text= objectJoin( myobject[i].conclusion,'&');
		c_parent.children=myobject[i].conclusion;
		c_parent.children=c_parent.children.map(function (element) {
			res=Object();
			res=element;
			res.occurencies=1; res.parent=p_parent; res.ids=c_parent.ids; return res;
			});
		
		for (j=0;j<common_parent.children.length;j++)
		{ 
			if (objectJoin( myobject[i].premise,'&')==common_parent.children[j].text) 
			{
				t_link[0]=j;
				common_parent.children[j].occurencies++;
				common_parent.children[j].ids.push(myobject[i].id);
				p_parent.occurencies++;
				common_parent.children[j].children=common_parent.children[j].children.map(function (element) {element.occurencies=common_parent.children[j].occurencies/common_parent.children[j].children.length; element.ids=common_parent.children[j].ids; return element;});
			};
			if (objectJoin( myobject[i].conclusion,'&')==common_parent.children[j].text)
			{
				t_link[1]=j; 
				common_parent.children[j].occurencies++;
				common_parent.children[j].ids.push(myobject[i].id);
				c_parent.occurencies++;
				common_parent.children[j].children=common_parent.children[j].children.map(function (element) {element.occurencies=common_parent.children[j].occurencies/common_parent.children[j].children.length; element.ids=common_parent.children[j].ids; return element;});			
			};
			
		}
		if (p_parent.occurencies==1) {t_link[0]=common_parent.children.length; common_parent.children.push(p_parent)};
		if (c_parent.occurencies==1) {t_link[1]=common_parent.children.length; common_parent.children.push(c_parent)};
		t_link[2]=myobject[i].confidence;
		t_link[3]=myobject[i].id;
		links.push(t_link);
	}

console.log(common_parent);
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
    .attr("ids", function(d) { return d.ids; })
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
     .attr("id",function(d){return d[3];})
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
     .attr("id",function(d){return d[3];})
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

/*
 * LAYOUT
 */


function flashAlert(alertType, msg) {
	if (alertType == "error") {
		$("div.alert-error > span").text(msg);
		$("div.alert-error").show();
	} else {
		$("div.alert-block > span").text(msg);
		$("div.alert-block").show();
	}
}

function showLoading(){
	$("div.alert").hide();
	$("div.alert-block > span").text("Loading...");
	$("div.alert-block").show();
}

function hideLoading(){
	$("div.alert").hide();
}


$(function() {
	$(".dismiss-alert").click(function(){
		$("div.alert").fadeOut('fast');
	});
	
	// Dropdown menus
	$('.dropdown-toggle').dropdown();
	
	
	// new data modal
	
	
});










var colorAttr = "colorAttr";
var selAttrs = ["attr1","attr2","attr3","attr4" ]
var dattrvalues = ["val1","val2","val3" ]
var cxt = ["age-<30", ""]
function prepareData(){
	
	
	// get color attr values
	
	
	
	var ret = new Object();
	
	for (var i=0; i < context.length; i++) { // for each row (obj)
	  var row = context[i]
	  for (var j=0; j < selAttrs.length; j++) { // for each selected attribute
		
		var objAttrValue = context.whatValueForThisAttribute(i,selAttrs[j])
		
	  };
	};
	
	ret[colorAttr] = context.getAttrValues(colorAttr);
	
	return ret;
	
}



function getImmediateAndRemainingNodes(node) {
	var ret = [];
	
	var immediate = [];
	var remaining = [];
	
	var children = getChildrenData(node);
	
	for (var i=0; i < children.length; i++) {
	  if (children[i].depth == node.depth+1) {
	  	immediate.push(children[i]);
	  } else remaining.push(children[i]);
	};
	
	ret.push(immediate, remaining); // ret[0] = immediate
	
	return ret;
}

function getMatrixData(lineNodes, columnNodes /*,remainingMap*/){
	var ret = [];
	for (var i=0; i < lineNodes.length + 1; i++) {
		var row = [];
	  for (var j=0; j < columnNodes.length + 1; j++) {
		if (i == 0) { // first line
			var mObj = new Object();
			mObj.label = (j < columnNodes.length) ? columnNodes[j] : null;
			mObj.i = i;
			mObj.j = j;
			mObj.id = i+","+j;
			row.push(mObj);
		} else {
			var mObj = new Object();
			mObj.label = (j == columnNodes.length) ? lineNodes[i-1] : null;
			mObj.i = i;
			mObj.j = j;
			mObj.id = i+","+j;
			row.push(mObj);
		}
	  };
	  ret.push(row);
	};
	return ret;
}

function getMatrixDataFlat(lineNodes, columnNodes /*,remainingMap*/){
	var ret = [];
	for (var i=0; i < lineNodes.length + 1; i++) {
	  for (var j=0; j < columnNodes.length + 1; j++) {
		if (i == 0) { // first line
			var mObj = new Object();
			mObj.label = (j < columnNodes.length) ? columnNodes[j] : null;
			mObj.i = i;
			mObj.j = j;
			mObj.id = i+","+j;
			ret.push(mObj);
		} else {
			var mObj = new Object();
			mObj.label = (j == columnNodes.length) ? lineNodes[i-1] : null;
			mObj.i = i;
			mObj.j = j;
			mObj.id = i+","+j;
			ret.push(mObj);
		}
	  };
	};
	return ret;
}


function layeredMatrix(){
	//data.depth 
            
    var lineNodes = getTopMostConcepts(data.nodes);     
    var remainingMap = [];
    
    var columnNodes = [];
    for (var i=0; i < lineNodes.length; i++) {
      var immedRemain = getImmediateAndRemainingNodes(lineNodes[i]);
      ArrayAddAll(immedRemain[0], columnNodes);// add all imediate nodes to the column
      remainingMap[lineNodes[i]] = immedRemain[1];
    };        
    
    var theData = getMatrixDataFlat(columnNodes,lineNodes);
            
	var sz = 30;
	var dw = 2;//theData[0].length;
	var dh = 4;//theData.length;
	
	var svg = d3.select("#compare-chart")
	 .append("svg:svg")
	 .attr("class", "quilts")
	  .attr("width", dw*sz)
	  .attr("height", dh*sz);

	  
	// Update the nodes…
	  matrixNode = svg.selectAll("rect.porra")
	      .data(theData);
	
	  // Enter any new nodes.
	  matrixNode.enter().append("svg:rect")
	      .attr("class", "porra")
	      //.style("fill","#000000")
	      .attr("transform", translateXY2)
	      .attr("width", sz)
	      .attr("height", sz)
	
	  // Exit any old nodes.
	  matrixNode.exit();//.remove();
	 
	      
	      
	      
	  // var g = svg.selectAll("g")
	  // .data(lineNodes)
	 // .enter().append("svg:g")
	 // .attr("transform", translateY);
// 	
	// g.selectAll("rect.quilts")
	  // .data(function(d) { return d; })
	 // .enter().append("svg:rect")
	  // .attr("class", "quilts")
	  // .attr("transform", translateX)
	  // .attr("width", sz)
	  // .attr("height", sz)

	
}

function translateY(d, i) { return "translate(0,"+(i*sz)+")"; }
function translateX(d, i) { return "translate("+(i*sz)+",0)"; }

function translateXY2(d, i) { return "translate("+(d.i*sz)+","+(d.j*sz)+")"; }


function plotCompare(){
	
	layeredMatrix();
	return;
	
	
	var mdata = [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 2, 2, 2, 0, 0, 0, 0],
            [0, 0, 0, 2, 2, 2, 2, 0, 0, 0],
            [0, 0, 2, 2, 2, 2, 2, 2, 0, 0],
            [0, 0, 2, 2, 2, 2, 2, 2, 2, 0],
            [0, 0, 2, 1, 0, 0, 2, 2, 2, 0],
            [0, 0, 1, 1, 0, 0, 2, 2, 2, 0],
            [0, 0, 0, 0, 1, 1, 2, 2, 0, 0],
            [0, 0, 0, 0, 1, 2, 2, 2, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
    fn = [grid0, grid1, grid2],
    dw = mdata[0].length,
    dh = mdata.length;
    sz = 30,
    grid = grid0;
    
    var svg = d3.select("#compare-chart")
	 .append("svg:svg")
	 .attr("class", "contour")
	  .attr("width", dw*sz)
	  .attr("height", dh*sz);

	var g = svg.selectAll("g")
	  .data(data)
	 .enter().append("svg:g")
	  .attr("transform", translateY);
	
	g.selectAll("rect.contour")
	  .data(function(d) { return d; })
	 .enter().append("svg:rect")
	  .attr("class", "contour")
	  .attr("transform", translateX)
	  .attr("width", sz)
	  .attr("height", sz)
	  //.attr("fill", getCColor)
	  //.attr("class", function(d) { return "d"+d; })
	  .on("mouseover", mouseover);
	
	contour(grid);
	
	
	
	
	function grid0(x,y) {
  if (x < 0 || y < 0 || x >= dw || y >= dh) return 0;
  return mdata[y][x];
}
function grid1(x,y) {
  if (x < 0 || y < 0 || x >= dw || y >= dh) return 0;
  return mdata[y][x]==1;
}
function grid2(x,y) {
  if (x < 0 || y < 0 || x >= dw || y >= dh) return 0;
  return mdata[y][x]==2;
}
	
function getCColor(d){
	var idx = Math.round(Math.random()*10);
	alert(idx)
	return ["blue", "yellow"][idx%2]
}

function translateY(d, i) { return "translate(0,"+(i*sz)+")"; }
function translateX(d, i) { return "translate("+(i*sz)+",0)"; }
function scale(p) { return [p[0]*sz, p[1]*sz]; }



function contour(grid, start) {
  svg.selectAll("path.contour")
    .data([d3.geom.contour(grid, start).map(scale)])
    .attr("d", function(d) { return "M" + d.join("L") + "Z"; })
    .attr("class", "contour")
   .enter().append("svg:path")
   .attr("class", "contour")
    .attr("d", function(d) { return "M" + d.join("L") + "Z"; });
}

function mouseover(d,i) {
  var s = undefined;
  grid = fn[d];
  if (d > 0) {
	// map mouse to grid coords, then find left edge
    var p = d3.svg.mouse(svg[0][0]);
    s = [Math.floor(p[0]/sz), Math.floor(p[1]/sz)];
    while (grid(s[0]-1,s[1])) s[0]--;
  }
  contour(grid, s);
}
    
    
}










/*
 * SCATTERPLOT MATRIX
 */

function drawSplom(){
	
	
	
	
	/////////
	
	flower = eg;
	
  // Size parameters.
  var size = 150,
      padding = 19.5,
      n = flower.traits.length;

  // Position scales.
  var x = {}, y = {};
  flower.traits.forEach(function(trait) {
    var value = function(d) { return d[trait]; },
    	domain = flower[trait],
        //domain = [d3.min(flower.values, value), d3.max(flower.values, value)],
        range = [padding / 2, size - padding / 2];
    x[trait] = d3.scale.ordinal().domain(domain).range(range);
    y[trait] = d3.scale.ordinal().domain(domain).range(range.reverse());
  });

  // Axes.
  var axis = d3.svg.axis()
      .ticks(5)
      .tickSize(size * n);

  // Brush.
  var brush = d3.svg.brush()
      .on("brushstart", brushstart)
      .on("brush", brush)
      .on("brushend", brushend);

  // Root panel.
  var svg = d3.select("#compare-chart").append("svg:svg")
      .attr("width", size * n + padding)
      .attr("height", size * n + padding);

  // X-axis.
  svg.selectAll("g.x.axis")
      .data(flower.traits)
    .enter().append("svg:g")
      .attr("class", "x axis")
      .attr("transform", function(d, i) { return "translate(" + i * size + ",0)"; })
      .each(function(d) { d3.select(this).call(axis.scale(x[d]).orient("bottom")); });

  // Y-axis.
  svg.selectAll("g.y.axis")
      .data(flower.traits)
    .enter().append("svg:g")
      .attr("class", "y axis")
      .attr("transform", function(d, i) { return "translate(0," + i * size + ")"; })
      .each(function(d) { d3.select(this).call(axis.scale(y[d]).orient("right")); });

  // Cell and plot.
  var cell = svg.selectAll("g.splcell")
      .data(cross(flower.traits, flower.traits))
    .enter().append("svg:g")
      .attr("class", "splcell")
      .attr("transform", function(d) { return "translate(" + d.i * size + "," + d.j * size + ")"; })
      .each(plot);

  // Titles for the diagonal.
  cell.filter(function(d) { return d.i == d.j; }).append("svg:text")
      .attr("x", padding)
      .attr("y", padding)
      .attr("dy", ".71em")
      .text(function(d) { return d.x; });

  function plot(p) {
    var cell = d3.select(this);

    // Plot frame.
    cell.append("svg:rect")
        .attr("class", "frame")
        .attr("x", padding / 2)
        .attr("y", padding / 2)
        .attr("width", size - padding)
        .attr("height", size - padding);

    // Plot dots.
    cell.selectAll("circle.spl")
        .data(flower.values)
      .enter().append("svg:circle")
        .attr("class", function(d) { return "spl "+ d.employment; }) // TODO modify
        .attr("cx", function(d) { return x[p.x](d[p.x]); })
        .attr("cy", function(d) { return y[p.y](d[p.y]); })
        .attr("r", 3);

    // Plot brush.
    cell.call(brush.x(x[p.x]).y(y[p.y]));
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
    svg.selectAll("circle").attr("class", function(d) {
      return e[0][0] <= d[p.x] && d[p.x] <= e[1][0]
          && e[0][1] <= d[p.y] && d[p.y] <= e[1][1]
          ? d.employment : null;						// TODO modify
    });
  }

  // If the brush is empty, select all circles.
  function brushend() {
    if (brush.empty()) svg.selectAll("circle").attr("class", function(d) {
      return d.employment;				// TODO modify
    });
  }

  function cross(a, b) {
    var c = [], n = a.length, m = b.length, i, j;
    for (i = -1; ++i < n;) for (j = -1; ++j < m;) c.push({x: a[i], i: i, y: b[j], j: j});
    return c;
  }
	
}








function Context(objs, attrs, rels, attrNames) {
//var context = new function(){
	
	this.initialAttributeNames = HashClone(attrNames); 
	this.initialObjects = objs.slice(0);
	
	this.attributeNames = attrNames;
	this.attributes = attrs;
	this.objects = objs;
	this.rel = rels;//new Array(); //rel[row][column] 
	
	var upArrow = null;
	
	var upArrowUpdate = false;
	
	 this.getEntitiesCount = function () {
	 	return this.objects.length;
	 };
	 
	 
	 this.whatValueForThisAttribute = function (objIdx, attrName) {
	 	for (var i=0; i < rel[objIdx].length; i++) {
		   var fullName = rel[objIdx][i];
		   var splitAttr = fullName.split(SEPARATOR);
		   if (splitAttr[0] == attrName) return fullName.substring(fullName.indexOf(SEPARATOR)+1,fullName.length);
		 };
	 	
	 	return null; // it doesn't have this attribute
	 };
	 
	  this.getAttrValues = function (attrName) {
	 	//{"name" : ["yes", 24, "no", 32]}
	 	var ret = [];
	 	var valuesNumber = attributes[attrName];
	 	for (var i=0; i < valuesNumber.length; i+=2) {
		   ret.push(valuesNumber[i]);
		 };
	 	return ret;//attributes[attrName]; 
	 };
	 
	 // Returns a list of objects that has both attributes
	 this.intersection = function (attrName1, attrName2) {
	 	var set1 = this.getObjectsHavingOrNot(attrName1);
	 
	 	var set2 = this.getObjectsHavingOrNot(attrName2);
	 	
	 	return ArrayIntersect(set1,set2);
	 }
	 
	 // Verifies if a boolean attribute is positive or not
	// e.g. "mammal", "mammal-yes"  -> true
	// e.g. "mammal", "mammal-no" -> false
	// e.g. 2. "preying", "mammal-yes" -> false
	// e.g. 3. "preying", "mammal-no" -> true
	this.booleanPositive = function (attr1, attr2) {
		if (attr1 == attr2) return true;
		if (attr1 + "-yes" == attr2) return true;
		else { 
			var rawAttr2 = attr2.split("-");
			if (rawAttr2.length > 0 && rawAttr2[0] != attr1 && rawAttr2[1] == "no") return true;
		}
		return false;
	}
	
	// e.g. "mammal-no" will return a list of all animals non mammals
	// e.g. "mammal-yes" or "mammal" will return a list of mammals
	
	this.getObjectsHavingOrNot = function (attrName) {
		var ret = [];
		
		var rawAttr = attrName.split("-");
		var lastIdx = rawAttr.length-1;
		var negation = (lastIdx >= 0 && rawAttr[lastIdx] == "no");
		
		if (rawAttr.length > 0 && (rawAttr[lastIdx] == "no" || rawAttr[lastIdx] == "yes")) { //boolean attr take raw name
			
			attrName = "";
			for (var i=0; i < lastIdx; i++) {
			  attrName += rawAttr[i];
			};
		}
		
		var attrIdx = this.attributes.indexOf(attrName);
		
		for (var j=0; j < this.objects.length; j++) {
		  var obj = this.objects[j];
		  
		 if (negation) { 
		 	if (!this.rel[j][attrIdx]) ret.push(obj);
		 } else { 
		 	if (this.rel[j][attrIdx]) ret.push(obj);
		 }
		};
		
		return ret;
		
	}
	this.getObjectIndex = function (obj) {
		for (var j=0; j < this.objects.length; j++) {
				if (this.objects[j] == obj) return j;
		}
		return -1;
	}
	
	this.getSubcontextForExtent = function (objsList) {
		
		var objs = [];
		var attrs = [];
		var rels = [];
		
		for (var i=0; i < objsList.length; i++) {
			
			objs.push(objsList[i]);
			rels[i] = new Array();
			
			var j = this.getObjectIndex(objsList[i]);
			
			for (var k=0; k < this.rel[j].length; k++) {
				if (this.rel[j][k]) {
					var attrIdx = attrs.indexOf(this.attributes[k]);
					if (attrIdx < 0)
						attrs.push(this.attributes[k]);
					attrIdx = attrs.indexOf(this.attributes[k]);
					rels[i][attrIdx] = true;
				}
			}
		}
		
		return new Context(objs, attrs,rels, attrs);
		
	}

	 
    
}



// eliminates objes and attributes IF they are not present in any concept
// return an array with  [0] = eliminated objects | [1] = eliminated attributes 
function eliminateEntities(){ // TODO how to optmize?? = interate over concepts adding attr/obj if exists 
	var ret = [];
	
	var remObjs = [];
	var remAttr = [];
	
	// Remove objects
	for (var j=0; j < context.objects.length;) {
		
		var contains = false;
		for (var i=0; i < lattice.concepts.length && !contains; i++) {
			// there's at least one node with that objct, keep it
			contains = (lattice.concepts[i].extent.indexOf(context.objects[j]) >= 0);
		}
		
		if (!contains) { // remove objm keep the same pointer (j)
			remObjs.push(context.objects[j]);
			context.objects.splice(j,1);
		} else j++;
		
	  };
	  
	  // Remove attributes
	   var attrNames = getAttributeValuesPairs(); 
	   
	  for (var j=0; j < attrNames.length; j++) {
		
		var contains = false;
		for (var i=0; i < lattice.concepts.length && !contains; i++) {
			// there's at least one node with that objct, keep it
			contains = (lattice.concepts[i].intent.indexOf(attrNames[j].name) >= 0);
		}
		
		if (!contains) { 
			// TODO refactor: attrNames[j] poderia ser armazenado diretamente
			var curAttrName = attrNames[j].attrName;
			var curAttrValue = attrNames[j].valueName;
			
			var theAttrVal = new Object();
			theAttrVal.name = attrNames[j].name;
			theAttrVal.booleanAttr = attrNames[j].booleanAttr;
			theAttrVal.attrName = curAttrName; // raw attr name
			if (curAttrValue) // mv attribute
				theAttrVal.value = context.attributeNames[curAttrName][getValueIdxfromAttr(curAttrName,curAttrValue)];
			else // boolean
				theAttrVal.value = context.attributeNames[curAttrName];
				
			remAttr.push(theAttrVal);
			
			if (attrNames[j].booleanAttr) { // if boolean remove the entire attribute
				delete context.attributeNames[curAttrName];
			} else {
				
				if (curAttrName in context.attributeNames) { // checks if the attribute is there (it might be already removed)
					if (context.attributeNames[curAttrName].length == 1)  // if it's a mv attr but it has only one value left, delete attr
						delete context.attributeNames[curAttrName];
					else
						removeValuefromAttr(curAttrName, curAttrValue);
				}
			}
			// see: getAttributeValuesPairs() gives an index for the value
		} 
		
	  };
	
	ret.push(remObjs);
	ret.push(remAttr);
	
	// update list
	  updateEntityList();
	  
	
	return ret;
}

// remove a value entry for an attribute from data
function removeValuefromAttr(attrString, valueString) { 
	var valueIdx = getValueIdxfromAttr(attrString, valueString); // format {"attribute":[["value1", n], ["value2", m] ]}
	
	if (valueIdx >= 0) context.attributeNames[attrString].splice(valueIdx,1);
}

function getValueIdxfromAttr(attrString, valueString){
	var valuesArray = context.attributeNames[attrString]; // format {"attribute":[["value1", n], ["value2", m] ]}
	for (var i=0; i < valuesArray.length; i++) {
	  if (valuesArray[i][0] == valueString) return i;
	};
	
	return -1;
}


function addEntities(objs, attrsVals){
	ArrayAddAll(objs, context.objects);
	
	for (var i=0; i < attrsVals.length; i++) {
	  if (attrsVals[i].attrName in context.attributeNames) { 
	  	if (context.attributeNames[attrsVals[i].attrName].indexOf(attrsVals[i].value) < 0) // assure that the value is not already there
	  		context.attributeNames[attrsVals[i].attrName].push(attrsVals[i].value);
	  } else {
	  	if (attrsVals[i].booleanAttr) // boolean
	  		context.attributeNames[attrsVals[i].attrName] = attrsVals[i].value;
	  	else // mv attr
	  		context.attributeNames[attrsVals[i].attrName] = [attrsVals[i].value];
	  }
	  
	};
	
	 updateEntityList();
}
Highcharts.theme = { colors: ['#4572A7'] };// prevent errors in default theme
var highchartsOptions = Highcharts.getOptions(); 

//Radial view rules list
var prevIndex=-1;

function removeWatermarks(){
	$('text[text-anchor="end"]').remove();
}

function loadDashboard(){
	multiSelectOptionsForAttributes("#control_1");
	multiSelectOptionsForAttributes("#control_2");
	
	$("#control_1, #control_2").multiSelect(); // this line must be placed after the items to the option are loaded
	
	
	updateDistributionChart(lattice.topConcept); // shows the distribution chart for the top node initially
	
}
function multiSelectOptionsForAttributes(multiSelectControlId){
	
	var $el = $(multiSelectControlId);
	$el.empty(); // remove old options
	$el.append($("<option></option>"));
	
	$.each(context.attributeNames, function(key,value) {
	  
	  var optGrp = $("<optgroup label='"+key+"'></optgroup>");
	  $el.append(optGrp);
	  
	  	for (var i=0; i< value.length; i++) {
	  		
	  		$("<option label='"+value[i][0]+"' value='"+key+SEPARATOR+value[i][0]+"'>"+value[i][0]+"</option>").appendTo(optGrp)
	  			//.attr("value", item.name).text(item.valueName));
	  	}
	     
	});
}


/**
 * horizontal bar chart
 */

// TODO input: co-occorrence , objects, 

var chart;

function createHorizontalBarChart(renderTo, attrVals1, attrVals2){
	
	
	chart  = new Highcharts.Chart({
      chart: {
         renderTo: renderTo,
         defaultSeriesType: 'bar'
      },
      title: {
         text: 'Attribute Co-occurrence'
      },
      subtitle: {
         text: ''
      },
      xAxis: {
         categories: attrVals1,
         title: {
            text: null
         }
      },
      yAxis: {
         min: 0,
         title: {
            text: 'Objects',
            align: 'high'
         }
      },
      tooltip: {
         formatter: function() {
            return ''+
                this.series.name +': '+ this.y +' objects';
         }
      },
      plotOptions: {
         bar: {
            dataLabels: {
               enabled: true
            }
         }
      },
      legend: {
         layout: 'vertical',
         align: 'right',
         verticalAlign: 'top',
        // x: -100,
        // y: 100,
         floating: true,
         borderWidth: 1,
         backgroundColor: Highcharts.theme.legendBackgroundColor || '#FFFFFF',
         shadow: true
      },
      credits: {
         enabled: false
      },
     series: getStackedBarSeries(attrVals1, attrVals2)
   });
   
   
}

// input ["attr-val"] x ["attr-val"]
// TODO param: x-axis : co-occurence, objects,etc
function getStackedBarSeries(items1, items2){
	
	var series = [];
	
	for (var i=0; i < items2.length; i++) {
		
		var seriesObj = new Object();
	  	seriesObj.name = items2[i];
	  	seriesObj.data = [];
		
		for (var j=0; j < items1.length; j++) {
	  		var intersection = context.intersection(items1[j], items2[i])
	  		seriesObj.data.push(intersection.length);
	 	}
	 	series.push(seriesObj);
	 	
	};
	
	return series;
	
}



/*
 * Creates a generic vertical bar chart	
 */
var distributionChart;
function createVerticalBarChart(renderTo, title, thecategories, thedata){
	distributionChart = new Highcharts.Chart({
		chart: {
			renderTo: renderTo,
			type: 'column',
			margin: [ 50, 50, 100, 80]
		},
		title: {
			text: title
		},
		xAxis: {
			categories: thecategories,
			labels: {
				rotation: -45,
				align: 'right',
				style: {
					font: 'normal 13px Verdana, sans-serif'
				}
			}
		},
		yAxis: {
			min: 0,
			title: {
				text: 'Objects'
			}
		},
		legend: {
			enabled: false
		},
		tooltip: {
			formatter: function() {
				return '<b>'+ this.x +' : '+ this.y+ ' objects</b><br/>';
			}
		},
			series: [{
			name: 'Attributes',
			data: thedata,
			dataLabels: {
				enabled: true,
				rotation: -90,
				color: '#FFFFFF',
				align: 'right',
				x: -3,
				y: 10,
				formatter: function() {
					return this.y;
				},
				style: {
					font: 'normal 13px Verdana, sans-serif'
				}
			}
		}]
	});
}


/*
 * DISTRIBUTION CHART
 */

function createDistributionChart(){
	
	createVerticalBarChart("distribution-chart", "Distribution", [], []);
}

function updateDistributionChart(d){
	
			var sumData = [];
			
			var subcontext = context.getSubcontextForExtent(d.extent);
			for (var j=0; j < subcontext.attributes.length; j++) {
				var sum = 0;
				
				for (var k=0; k < subcontext.objects.length; k++) {
			  		if (subcontext.rel[k][j] == true) sum++;
			 	}
			 	sumData.push(sum);
			};
			
			distributionChart.series[0].setData(sumData);
			distributionChart.xAxis[0].setCategories(subcontext.attributeNames);
			//distributionChart.redraw();
	
}

/*
* SCATTERPLOT CHART
*/


function createScatterPlotChart() {
	distributionChart = new Highcharts.Chart({
		chart : {
			renderTo : "sc_pl_div",
			type : 'area',
			margin : [50, 50, 100, 80]
		},
		title : {
			text : "Association Rules Distribution"
		}
	});

	distributionChart.container.innerHTML = "";
	init_scatter_plot(distributionChart.container);
}

/*
 * Rules list for radial view
 */

function createRulesList() {
	a1 = [];
	a2 = [];
	for( i = 0; i < association_rules.length; i++) {
		a1.push(association_rules[i].id);
		a2.push(association_rules[i].confidence);
	}
	chart = new Highcharts.Chart({

		chart : {
			renderTo : 'rules_render_area',
			type : 'bar',
			events : {
				'click' : function(event) {
					if(prevIndex !== -1) {

						for( t = 0; t < this.series[0].data.length; t++) {
							if(this.series[0].data[t].category == prevIndex) {
								this.series[0].data[t].update({
									color : '#4572A7'
								}, true, false);
								break;
							}
						}
						d3.select("#chart").select("svg").selectAll("path").style("opacity", 0.99);
						prevIndex = -1;
					}
				}
			}
		},
		title : {
			text : 'Generated rules'
		},
		legend : {
			enabled : null
		},
		xAxis : {
			categories : a1,
			title : {
				text : null
			}
		},
		yAxis : {
			min : 0,
			title : {
				text : null,
				align : 'high'
			},
			labels : {
				overflow : 'justify'
			}
		},
		tooltip : {
			formatter : function() {
				return '' + this.series.name + ': ' + this.y;
			}
		},
		plotOptions : {
			bar : {
				dataLabels : {
					enabled : true
				},
				events : {
					'click' : function(event) {

						if(prevIndex !== -1) {

							for( t = 0; t < this.data.length; t++) {
								if(this.data[t].category == prevIndex) {
									this.data[t].update({
										color : '#4572A7'
									}, true, false);
									break;
								}
							}
						}
						event.point.update({
							color : '#f00'
						}, true, false)
						d3.select("#chart").select("svg").selectAll("path").style("opacity", function(d) {
							return d[4].id == event.point.category ? 0.99 : 0.1;
						});
						prevIndex = event.point.category;
					}
				}
			}
		},

		series : [{
			name : 'Confidence',
			data : a2
		}]
	});

}


function updateDashboard(){
	//	multiSelectOptionsForAttributes("#control_1");
	//multiSelectOptionsForAttributes("#control_2");
	
	//chart.series[0].setData(context.attributes[serie.name], true);
}


/*
 * Facets
 */

// Create facets (lazyloading)
function createFacets(){
	
	// var theTree = getTree();
// 
	// $("#treepa").dynatree({
			// title : "Sample Theming",
			// // Image folder used for data.icon attribute.
			// onClick : function(node,event) {
				// alert("You selected " + node);
				// //openFacet(node);
			// },
			// children: [theTree]
		// });
// 
	// return;
	
	
	var top_concept = vis.select('circle[id="'+ data.top_id +'"]');
	//var nodelist = getOutgoingNodes(top_concept);
	
	var topfacets = top_concept.attr("intent");
	
	if (topfacets.length == 0) { // se nao tem nada no top
		var outnodes = getOutgoingNodes(top_concept);
		// pega labels do filhos?
		
	}
	
	
	
	
	$("#treepa").dynatree({
			title : "Sample Theming",
			// Image folder used for data.icon attribute.
			onActivate : function(node,event) {
				//alert("You selected " + node);
				openFacet(node);
			}
		});
		
	var rootNode = $("#treepa").dynatree("getRoot");
	
	
	for (var i=0; i < outnodes.length; i++) {
		//appendFacet(outnodes[i].attr("intent"), "#treepa-root", true);
		
		rootNode.addChild({
			title : outnodes[i].attr("intent")
			//tooltip : "This folder and all child nodes were added programmatically."
		});



	};
	
}

/*
 * Search for ANY of the attributes in the string
 */
		// vis.selectAll("circle").style("fill", function(d) {
// 
			// var query = $("#search").val();
			// if(d.intent != "" && d.intent.indexOf(query) >= 0) { // TODO check with empty spaces
				// return "#ff0000";
			// }
		// });
		
// returns a two element array: first is the found nodes, the other its complement (which may be used for hiding nodes later)
// perfomance reasons (only one iteraction)
function searchFacet(facetsString, removeEmptyConcepts) { // facetsString : "facet1,facet2" 

	removeWhiteSpaces(facetsString);

	var ret = [];
	var sel = [];
	var notSel = [];
	
	var keywords = facetsString.split(",");
	
	vis.selectAll("circle").each(function() { // TODO para cada circle?
      	var thenode = d3.select(this);
      	
      	var a1 = thenode.attr("intent").split(",");
      	
      	
      	
      	if (removeEmptyConcepts && thenode.attr("extent").length == 0) {
      			notSel.push(thenode);
      	} else {
      	
	      	if (ArrayContainsAll(a1,keywords)) { // TODO relax para string parciais
	      		
	      		sel.push(thenode);
	      	} else  {
	      		notSel.push(thenode);
	      	}
      	}
    });
    
    ret.push(sel);
    ret.push(notSel);
    
    return ret;
}

// On select facet...
	function openFacet(node){
	
	
	var names = '';
	node.visitParents(function(n) {
		if (n.data.title != null) names += n.data.title +  ",";
	}, true);
	
	var facetNodes = searchFacet(names,true)[0];

	for(var i = 0; i < facetNodes.length; i++) {
		
		var intents = facetNodes[i].attr("intent").split(',');
		var parentIntents = names.split(',');
		
		var thisIntent = ArraySubtract(intents,parentIntents);

		if(thisIntent.length > 0) {

			node.addChild({
				title : thisIntent.join(', ')//.split(',')[0]
				//icon: "customdoc1.gif"
			});
		}

	}
	
	node.expand(true);
	
	return;
	
	
	
	
	// append retrieved facets to current node position
	if (facetNodes.length > 0) {
		ul = $('<ul>').appendTo(node.li);
	}
	
	for(var i = 0; i < facetNodes.length; i++) {
		appendFacet(facetNodes[i].attr("intent"), ul);
	};

	return;

			
			/// old solution :
	

			// retrieve all names in hierarchy
			var names= '';
			var hierarchy = $(this).parentsUntil("#treepa").each(function(){
				//$(this)
				var thelink = $(this).children("a.facetLink"); // closest?
				if (thelink.length != 0) {
					names += thelink.text() + ",";
					thelink.removeClass("facetSel");
				}
			});
			
			$(this).siblings().find("a.facetLink").removeClass("facetSel"); //remove highlight in case they're siblings
			
			// highlight selected facet and add its name
			var liink = $(this).find(">a");
			liink.toggleClass("facetSel");
			//alert(liink.text());
			names += liink.text();
			
			// test
			// alert(names);
			// var ul = $('<ul>').appendTo(this);
			// var li = $('<li>').appendTo(ul);
			// var link = $('<a href="#" class="facetLink">').appendTo(li);
			// link.text("teste");
			
			
			var facetNodes = searchFacet(names,true)[0];
			
			// append retrieved facets to current node position
			for (var i=0; i < facetNodes.length; i++) {
				appendFacet(facetNodes[i].attr("intent"), this, false);
			};
			
}


var visualFilters = [];

var filter = new function() { // hashmap do filter (with excluded nodes from origin) : {"bird:yes", [n1, n2,..]}
    this.history = [];
    
    this.addFilter = function (filterType, attr, value, excludedNodes) {
			
			var removedEntities = eliminateEntities(); // eliminate objs attsr
			
			updateVisualFilters(); // this must be called AFTER add/remove entities
	
	        var obj = new Object();
	        obj.filterType = filterType;
	        obj.attr = attr;
	        obj.value = value;
	        obj.excludedNodes = excludedNodes;
	        obj.remObjs = removedEntities[0];
	        
	        //2 modes - one with generated a_rules and one without
	        if (association_rules!==undefined)
	        {
	        	
	        	// Here remove rules from global variable
	        	association_rules=full_association_rules;
	        	obj.removedRules=[];	
				arrjs=[];
					for (j=0;j<association_rules.length;j++)
					{
						
						flag=true;
						
						for (k=0;k<association_rules[j].premise.length;k++)
						{
							if (association_rules[j].premise[k]==obj.attr+'-'+obj.value) { flag=false;} //break;}
						}
						for (k=0;k<association_rules[j].conclusion.length;k++)
						{
							if (association_rules[j].conclusion[k]==obj.attr+'-'+obj.value) { flag=false;} // break;}
						}
						
						//If attr=value is not in premise/conclusion => remove rule
						
						if (flag) {obj.removedRules.push(association_rules[j]); arrjs.push(j);}					 
					}
	        	
	        	for (t=0;t<arrjs.length;t++){association_rules.splice(arrjs[t]-t,1);}
	        	
	        	full_association_rules=association_rules;
	        	
	        	
	        	createScatterPlotChart();
	        	
	        }
	        
	        //obj.remRules =[];
	        obj.remAttrsVals = removedEntities[1];
	        //obj.excludedEdges = excludedEdges;
		   
		   this.history.push(obj);

    };
    
    this.removeFilter = function (attr, value) {
		var idx = this.indexOfFilter(attr, value);
		removeFilterAt(idx);
		
    };
    
    this.removeFilterAt = function (idx) {
    	//if there are any reset rules
    	
    	if (this.history[idx].removedRules) {
    		/* Here we should distribute rules over filters*/
    		if (idx!==(this.history.length-1)) {
    		for (j=0;j<this.history[idx].removedRules.length;j++)
    		{
    			console.log("going through rule",j);
    			attributed=false;
	    		for (i=idx+1;(i<this.history.length && (!attributed));i++)
	    		{
    				console.log("going through filter",i);
	    			console.log(this.history[idx].removedRules[j].premise,this.history[idx].removedRules[j].conclusion);
	    			for (k=0;k<this.history[idx].removedRules[j].premise.length;k++)
	    			{
	    				if (this.history[idx].removedRules[j].premise[k]==this.history[i].attr+'-'+this.history[i].value) 
	    					{
	    					association_rules.push(this.history[idx].removedRules[j]);	   
	    					attributed=true;
	    					break;
	    					};
	    			}
	    			if (!attributed) for (k=0;k<this.history[idx].removedRules[j].conclusion.length;k++)
	    			{
	    				if (this.history[idx].removedRules[j].conclusion[k]==this.history[i].attr+'-'+this.history[i].value) 
	    					{
	    					association_rules.push(this.history[idx].removedRules[j]);
	    					attributed=true;
	    					break;
	    					};
	    			}
	    	
	    		//if (!attributed) {full_association_rules.push(this.history[idx].removedRules[j]);}		
	    		if (!attributed) {this.history[i].removedRules.push(this.history[idx].removedRules[j]);}		
	    		}
    		}
    		//full_association_rules=full_association_rules.concat(this.history[idx].removedRules);
    		
    		 
    		 		
    		
    	} else {
    	association_rules=association_rules.concat(this.history[idx].removedRules);
    	}
    	
    	full_association_rules=association_rules;
    	createScatterPlotChart();
    	}
    	
    	addEntities(this.history[idx].remObjs, this.history[idx].remAttrsVals); // re add entities
    	updateVisualFilters(); // this must be called AFTER add/remove entities
    	
		ArrayRemove(this.history,idx);
	
    };
    
    this.indexOfAttr = function (attr) {
    	
    	for (var i=0; i < this.history.length; i++) {
		  if (this.history[i].attr == attr) {
		  	return i;
		  }
		};
    	
        return -1;
    };
    
    this.indexOfFilter = function (attr, value) {
    	
    	for (var i=0; i < this.history.length; i++) {
		  if (this.history[i].attr == attr && this.history[i].value == value) {
		  	return i;
		  }
		};
    	
        return -1;
    };
    this.indexOfFilter = function (selection) {
    	
    	for (var i=0; i < this.history.length; i++) {
		  if (this.history[i].attr == selection) {
		  	return i;
		  }
		};
    	
        return -1;
    };
    
    this.getFilter = function (attr, value) {
    	
    	var idx = this.indexOfFilter(attr,value);
    	if (idx < 0) return null;
    	else return this.history[idx];
    };
    
    this.clear = function () {
    	
    	this.history.length = 0;
    };
    
    
}

//function updateFilte



function removeFilter(aname, avalue){
		var idxFilter;
		if (avalue) idxFilter = filter.indexOfFilter(aname,avalue);
		else idxFilter = filter.indexOfFilter(aname);
		
    	var existingFilter = filter.history[idxFilter];
    	
    	var remainingNodes = existingFilter.excludedNodes;
    	
    	filter.removeFilterAt(idxFilter);
    	
    	for (var i=0; (i < filter.history.length) && (remainingNodes.length > 0); i++) { //idxFilter+1 nao funciona (ex. mammal, preying, -preying)
		  remainingNodes = ArraySubtract(remainingNodes, filter.history[i].excludedNodes);
		  
		};
    	
    	 
    	for (var i=0; i < remainingNodes.length; i++) {
    		if (lattice.concepts.indexOf(remainingNodes[i]) < 0 ) // TODO review that - remove that
		  		lattice.concepts.push(remainingNodes[i]);
		};
    	
    	
    	keepLinks();
    	
    	// remove label 
    	if (avalue) $("#"+aname+'-'+avalue).remove(); //attr-value
    	else {  // click selection or objects selection
    		$("#"+aname).remove();
    		//$("input.search").tokenInput("clear"); // removes also string in search // update: already removed when added filter
    	}
    	
    	labelize2();
	    //updateLattice();
	    updateVis();
}



function resetFilters(){ 
	
	// TODO "fechar" fatias do graph
	
	$("#showFiltersPanel").html("<span>Filters &raquo;</span>");
	
	if (association_rules){
		for (i=0;i<filter.history.length;i++)
		{
			association_rules=association_rules.concat(filter.history[i].removedRules);
		}
	} 
	full_association_rules=association_rules;
	filter.clear();
	
	// close slices
	for (var i=0; i < visualFilters.length; i++) {
	  var thechart = visualFilters[i];
	  
	  // var segments = thechart.series[0].segments[0];
	  // for (var j=0; j < segments.length; j++) {
		// segments[j].sliced = false;
	  // };
	  
	  thechart.series[0].redraw();
	  //thechart.redraw();
	};
	
	// CLONE
	lattice.concepts = lattice.initialConcepts.slice(0);
	lattice.edges = lattice.initialEdges.slice(0);
	context.attributeNames = HashClone(context.initialAttributeNames); // TODO necessary?
	context.objects = context.initialObjects.slice(0);
	
	
	updateEntityList();
	
	updateVisualFilters();
	
	
	updateVis();
	createScatterPlotChart();
}



function keepLinks(){
	
	lattice.edges = lattice.initialEdges.filter(function(d) { 
		//return (lattice.concepts.indexOf(d.source) < 0 || lattice.concepts.indexOf(d.target) < 0)
		return (lattice.concepts.indexOf(d.source) >= 0 && lattice.concepts.indexOf(d.target) >= 0)
	});
}



function clickFilterValue(){ //boolean atributes
  //alert(this.series.name + '|'+this.name +'|'+ this.y +'|'+ this.sliced+' | was last selected');
    
    var svalue = this.name;
    var sname = this.series.name;
    
    if (!this.sliced) { // this operation removes the filter given by sname and svalue
    	
    	removeFilter(sname,svalue);
    	
    } else {
    
    	var removed = [];
	    // iterate over original data nodes
	    for (var i=0; i < lattice.initialConcepts.length; i++) { // this solution is preferreed over the next one because even if we need to iterate again to make the intersection with current filter,
	    												// this solution enables storing of affected nodes by a filter (and thus allowing user to remove filters non-sequentially later)
	      var d = lattice.initialConcepts[i];
	      
	      // eliminate bottom concept
	      if (d.extent.length == 0) {
	      	removed.push(d);
	      	continue;
	      }
	      
	     var query = sname;
	     if (svalue != 'yes' && svalue != 'no') { // mv context
	     	query += SEPARATOR + svalue;
	     }
	     
	      
	      if (d.intent.indexOf(query) < 0) { // e.g. bird : yes 
	    		if (svalue != 'no') { 
	    	    	removed.push(d);
	    	    }
	    	} else if (svalue == 'no') { // e.g.  preying: no|yes ...
	    		removed.push(d);
	    	} // e.g. else. dog : yes
	    };
	    
	    
	    lattice.concepts = ArraySubtract(lattice.concepts, removed);
	    
	    keepLinks();
	    
	    filter.addFilter("attribute",sname, svalue, removed );
	    
	    $("#"+sname +'-'+svalue).remove();
		$('<span id="'+ sname +'-'+svalue+'"> | '+sname+': '+svalue+' <a href="#" class="remove-filter"><img src="'+STATIC_URL+'/images/remove.gif"></a></span>').appendTo("#showFiltersPanel");
		
		labelize2();
	    //updateLattice();
	    updateVis();
    }
}



function loadFilters(){
	var rawAttrs = getKeys(context.attributeNames);
	
	for (var i=0; i < rawAttrs.length; i++) {
	  //var attribute = context.attributes[rawAttrs[i]];
	  
	  	var serie = [{
	  		animation: true,
			type: 'pie',
			name: rawAttrs[i],
			data: context.attributeNames[rawAttrs[i]]
		}];
		//context.attributes[rawAttrs[i]]
		var renderTo = $('<div class="chartFilter"><span> '+rawAttrs[i]+' </span><div id="chart_'+i+'" >').appendTo("#filters_container");
		visualFilters.push(createChart(rawAttrs[i], "chart_"+i, serie));	
	  
	}
}


// http://www.highcharts.com/ref/#plotOptions-pie--slicedOffset
function createChart(attrTitle, renderTo, theSeries){
		var chart = new Highcharts.Chart({
		chart: {
			renderTo: renderTo,//'container',
			backgroundColor: 'rgba(50,50,50,0)',//"#333",
			plotBorderWidth: null,
			plotShadow: false
			//style : { overflow: "auto"}
		},
		title: {
			text: ''//attrTitle
		},
		tooltip: {
			formatter: function() {
				return '<b>'+ this.point.name.escapeHTML() +'</b>: '+ Math.round(this.percentage) +' %';
			}
		},
		legend : {
			itemWidth : 80,
			style: {width: "100px" },
			
			layout: "vertical",
			backgroundColor: "#666",
			align: 'right',
        	verticalAlign: 'middle',
        	itemStyle: { color: '#fff'}
		},
		plotOptions: {
			pie: {
				allowPointSelect: true,
				innerSize: "40%",
				point: {
	                events: {
	                    select: clickFilterValue,
	                    unselect: clickFilterValue
	                }
            	},
				cursor: 'pointer',
				dataLabels: {
					enabled: false
				},
				showInLegend: true
			}
		},
	    series: theSeries
	});
	
	return chart;
}



function updateVisualFilters(){
	for (var i=0; i < visualFilters.length; i++) {
	  var serie = visualFilters[i].series[0];
	  
	  if (!(serie.name in context.attributeNames)) { // if there's not this attribute
	  	//visualFilters[i].options.chart.style.visibility = "visible";
	  	//visualFilters[i].redraw();
	  //	$("#highcharts-"+(i+1)).hide();
	  	document.getElementById("chart_"+i).style.opacity = 0;
	  	
	  	continue;
	  }
	  // else
	 // visualFilters[i].options.chart.style.visibility = "hidden";
		document.getElementById("chart_"+i).style.opacity = 1;
		
	  serie.setData(context.attributeNames[serie.name], true);
	  
	  
	};
}


/*
 *  Click Selection filters
 */


var selFilterCt = 0;
function filterSelected(){ // TODO melhor forma de fazer iss?
var selected = []
vis.selectAll('circle.selected').each(function(d){
	//d3.select(this)
	selected.push(d);
});

		var removed = ArraySubtract(lattice.concepts, selected);
		lattice.concepts = selected;//
		
	    
	    keepLinks();
	    
	    var sname= "selection_" + selFilterCt;
	    filter.addFilter("selection", sname, "filter", removed);
	    
	   // $("#"+sname).remove();
		$('<span id="'+ sname +'"> | selection <a href="#" class="remove-filter"><img src="'+STATIC_URL+'/images/remove.gif"></a></span>').appendTo("#showFiltersPanel");
	    
		selFilterCt++;
	

	labelizeData();
 	//labelize2();
    updateVis();
}

/*
 * Attribute / Object filters
 * 
 */
var attrFilterCt = 0;
function filterAttributes(){
	var attrNames = [];
	
	$("input[name='attr']:checked").each(function(){
		attrNames.push($(this).val());
	});
	
	
	var removed = [];
	for (var i=0; i < lattice.concepts.length; i++) {
		
		 if (lattice.concepts[i].extent.length == 0) { // remove bottom concept
	      	removed.push(lattice.concepts[i]);
	      	continue;
	      }
		
		
		if (! ArrayContainsAll(lattice.concepts[i].intent, attrNames)) {
			removed.push(lattice.concepts[i]);
		} 
	 // lattice.concepts[i].extent.contains()
	};	
	
	
	lattice.concepts = ArraySubtract(lattice.concepts, removed);
	    
    keepLinks();
    
    var sname= "attribute_" + attrFilterCt;
    filter.addFilter("attribute_sel", sname, "filter", removed);
    
    
    //$("#"+sname +'-'+svalue).remove();
	$('<span id="'+ sname +'" class="explain" data-tooltip="'+attrNames.join(", ")+'">' +
	 ' | attributes sel. <a href="#" class="remove-filter"><img src="'+STATIC_URL+'/images/remove.gif"></a></span>').appendTo("#showFiltersPanel");
	
	attrFilterCt++;
	
	labelize2();
    //updateLattice();
    updateVis();
	

}


var objFilterCt = 0;
function filterObjects(){

	var objNames = [];
	
	$("input[name='obj']:checked").each(function(){
		objNames.push($(this).val());
	});

	var removed = [];
	for (var i=0; i < lattice.concepts.length; i++) {
		
		
		if (lattice.concepts[i].intent.length == 0) { // remove top concept
	      	removed.push(lattice.concepts[i]);
	      	continue;
	      }
	      
	      
		if (! ArrayContainsAll(lattice.concepts[i].extent, objNames)) {
			removed.push(lattice.concepts[i]);
		} 
	 // lattice.concepts[i].extent.contains()
	};	
	
	
	lattice.concepts = ArraySubtract(lattice.concepts, removed);
	    
    keepLinks();
    
    var sname= "object_" + objFilterCt;
    filter.addFilter("object_sel", sname, "filter", removed);
    
    
    //$("#"+sname +'-'+svalue).remove();
	$('<span id="'+ sname +'" class="explain" data-tooltip="'+objNames.join(", ")+'">' +
	 ' | objects sel. <a href="#" class="remove-filter"><img src="'+STATIC_URL+'/images/remove.gif"></a></span>').appendTo("#showFiltersPanel");
	
	objFilterCt++;
	
	labelize2();
    //updateLattice();
    updateVis();
	
	
}

/*
 * Initial parameters
 */

 
var numberSelected = 0;


/*
 * Init Lattice
 */

var context;
var lattice;
//var lattice_id;

var a_rules_concerned_attributes;
var _data_a_rules_concerned_attributes;

function loadData(data){
	
	context = new Context(data.context.objects, data.context.attributes, data.context.rel, data.attributes) //TODO refactor
	lattice = new Lattice(data);
	
	a_rules_concerned_attributes=clone(data.attributes);
	_data_a_rules_concerned_attributes=clone(data.attributes);
	
	
	// load autosuggest for attributes
	$("input.search").tokenInput(getAttributeValuesPairs(),{
              propertyToSearch: "name",
              preventDuplicates: false,
              hintText:"Type an attribute name",
              theme: "facebook",
              onAdd: selectionAdded,
              onDelete: selectionAdded
              });
	
	
	
	hoverbox = d3.select("#hoverbox");
	A_rules_box = d3.select("#A_rules_box");
	
	checkLatticeConstraints();
	
	// Labels TODO colocar uma funcao no label que ja pega a intersecao com os parents?
	labelizeData();
	
	//initThisLattice();
	//initStaticLattice();
    initLattice();
    
    
    // lists
    updateEntityList();
    
    // Facets
   // createFacets();
	
	// Filters
	loadFilters();
	
	// Dashboard
	loadDashboard();
	
	$('a.lattice-json-link').attr("href", "/api/v1/lattice/?id="+lattice_id);
	$('a.ar-json-link').attr("href", "/api/v1/association_rules/?lattice_id="+lattice_id);
	
	$('text[text-anchor="end"]').remove();
	
}


function Lattice(data) {
	
	//lattice_id = data.id;
	// copy of initial parameters.. mainly used for reset
	// _data_nodes = lattice.concepts.slice(0);
	// _data_links = lattice.edges.slice(0);
	// _data_attributes = HashClone(data.attributes); // TODO deep copy??
	//_data_objects = data.objects.slice(0);
	
	this.initialConcepts = data.nodes.slice(0);
	this.initialEdges = data.links.slice(0);
	// _data_nodes = lattice.concepts.slice(0);
	// _data_links = lattice.edges.slice(0);
	
	this.concepts = data.nodes;
	this.edges = data.links
	
	this.id = data.id;
	
	
	
	this.getConcept = function(tid){
		for (var i=0; i < this.concepts.length; i++) {
		  if (this.concepts[i].id == tid) 
		  	return this.concepts[i];
		};
	};
	
	this.topConcept = this.getConcept(data.top_id);
	this.bottomConcept = this.getConcept(data.bottom_id);
	
	
	
	 this.isEmpty = function () {
	 	return false;
	 };
	 
	 this.conceptsCount = function(){
	 	return concepts.length;
	 }
	 
	 /*
	  * Concept operations // TODO ordem invertida!
	  */
	 this.getPredecessors = function(n){ // get predecessors for a node
	 	var ret = new Array();
	 	for (var i=0; i < n.children_ids.length; i++) {
		   ret.push(this.concepts[n.children_ids[i]]);
		 };
	 	return ret;
	 }
	 this.getSucessors = function(n){ // get predecessors for a node
	 	var ret = new Array();
	 	for (var i=0; i < n.parents_ids.length; i++) {
	 		var tid = n.parents_ids[i];
	 		//if (tid >= this.concepts.length) // if they're not in the list 
	 		//	ret.push(virtuals[tid]); 	 // they must be virtuals
	 		//else
		   		ret.push(this.concepts[tid]);
		 };
	 	return ret;
	 }
	 
	 this.getSuccessorsEdges = function(n){ // get edges for that node
	 	var ret = new Array();
	 	for (var i=0; i < this.edges.length; i++) {
		   if (this.edges[i].source.id == n.id)
		   		ret.push(this.edges[i]);
		 };
	 	return ret;
	 }
	 this.getPredecessorsEdges = function(n){ // get edges for that node
	 	var ret = new Array();
	 	for (var i=0; i < this.edges.length; i++) {
		   if (this.edges[i].target.id == n.id)
		   		ret.push(this.edges[i]);
		 };
	 	return ret;
	 }
	 
	 
	 
	 /*
	  * Layout methods
	  */
	 this.getHeight = function(){
	 	return this.bottomConcept.depth+1;
	 };
	 
	 this.getEdgeLength = function(edge) {
	 	//console.log("edge: "+edge.target.intent.join(",") + " ("+(lattice.getHeight() - edge.target.depth) +") - "+edge.source.intent.join(",")+" ("+ (lattice.getHeight() - edge.source.depth)+ ")");
	 	return   (lattice.getHeight() - edge.target.depth) - (lattice.getHeight() - edge.source.depth);  //edge.target.depth - edge.source.depth;
	 };
	 
	 this.doTopSort = function(block) {
        var conceptsCount = this.conceptsCount();
        var workArray = [conceptsCount];
        for (var i = workArray.length; --i >= 0;) {
            workArray[i] = this.getPredecessors(this.nodes[i]).length;
        }

        var tmp = this.topConcept;
        var queueEnd = this.concepts.indexOf(tmp);
        var currNo = 0;

        while (tmp != this.bottomConcept) {
            succ = this.getSuccessorsEdges(tmp);
            
            //block.assignTopSortNumberToElement(tmp, currNo++);
            block[this.concepts.indexOf(tmp)] = tmp.depth;
            
            for (var i=0; i < succ.length; i++) {
            	
                tmp2 = this.concepts(succ[i].target); ///get end
                if (0 == --workArray[this.concepts.indexOf(tmp2)]) {
                	
                    workArray[queueEnd] = this.concepts.indexOf(tmp2);
                    queueEnd = this.concepts.indexOf(tmp2);
                    
                    //block.elementAction(tmp2, tmp);
                }
            }
            tmp = this.concepts[(workArray[this.concepts.indexOf(tmp)])];
        }
        //block.assignTopSortNumberToElement(one, currNo);
        block[this.concepts.indexOf(this.bottomConcept)] = this.bottomConcept.depth;
    }
}





function initLattice(){
	
	w = DEFAULT_WIDTH;
	h = DEFAULT_HEIGHT;
	
	force = d3.layout.force()
        .gravity(0.1)
        .distance(100)
        .charge(-320)
        .on("tick", tick)
        .size([w, h]);
        
        
	
	vis = d3.select("#chart").append("svg:svg")
	.attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", "0 0 "+w+" "+h)
    .attr("preserveAspectRatio", "xMidYMid");
	
	
	updateLattice();
}


function updateLattice() {
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
   
   var k = .5 * e.alpha;
   cnode.each(function(d) {
   			d.y += ((d.depth) * 100 - d.y) * k;
   });    
   
   
      
}


/*
 * Ends lattice layout drawing
 */



function filterNodes(query){

    // remove links that are connected to descendants
    link.filter(function(d) {
      for (d = d.source; d; d = d.parent) {
        if (d === p) return true;
      }
    }).remove();

    // remove all descendants
    node.filter(function(d) {
      while (d = d.parent) {
        if (d === p) return true;
      }
    }).remove();
}



// clear 'hidden' styles (used e.g. for clear previous selections)
function showNodes() {
	vis.selectAll(".opaque").classed("opaque", false);
}


function hideNodes(nodelist){
	
	//var inverseNodes = ArraySubtract(vis.selectAll("circle"), nodelist);
	
	for (var i=0; i < nodelist.length; i++) {
		var anode = nodelist[i];
		//anode.style("opacity", DEFAULT_OPACITY);
		//anode.style("fill", DEFAULT_FILL_COLOR);
		anode.classed("selected", false);
		anode.classed("opaque", true);
		
		
		getIncomingEdges(anode, function(){
			//d3.select(this).style("opacity", DEFAULT_OPACITY);
			var thisInEdge = d3.select(this);
			thisInEdge.classed("selected",false);
			thisInEdge.classed("opaque",true);
			
		});
		getOutgoingEdges(anode, function(){
			//d3.select(this).style("opacity", DEFAULT_OPACITY);
			//d3.select(this).classed("hidden");
			var thisOutEdge = d3.select(this);
			thisOutEdge.classed("opaque",false);
			thisOutEdge.classed("selected",true);
		});
	}
}

function highlightNodes(nodelist, color) {
	for (var i=0; i < nodelist.length; i++) {
	  var anode = nodelist[i];
		//anode.style("opacity", 1); // TODO preferir trocar classes css
		//anode.style("fill", SELECTED_FILL_COLOR);
		anode.classed("selected", true);
		anode.classed("opaque", false);
		
		
		 getIncomingEdges(anode, function(){
			 //d3.select(this).style("opacity", 1);
			var thisInEdge = d3.select(this);
			thisInEdge.classed("opaque",false);
			thisInEdge.classed("selected",true);
		 });
		 getOutgoingEdges(anode, function(){
			// d3.select(this).style("opacity", 1);
			var thisOutEdge = d3.select(this);
			thisOutEdge.classed("opaque",false);
			thisOutEdge.classed("selected",true);
		 });
	};
}




/*
 * Search
 */





/*
 * Node mouse events 
 */
function visitEdges(node, callback) {
	for (var i=0; i < get.length; i++) {
	  get[i]
	};
}	
	
function nodeMouseOver(d){
	//    $('#node_3').popover({title:"hey", content: "now it works!"});
	//$('#node_3').popover('show');
	
	var thenode = d3.select(this);
	thenode.style("stroke", "red"); 
	
	//getIncomingNodes(thenode);
	
	if (highlightPath) {
		visitEdgesUp(d,function(l) {
			d3.select("line.link[source_id=\""+l.source.id+"\"][target_id=\""+l.target.id+"\"]").classed("highlighted", true);
		});
	}
	
	
	// show hoverbox
	//hoverbox.style("opacity", 0);
	hoverbox.style("display", "block");
	hoverbox.transition()
	  .delay(800)
      .duration(300)
      .style("opacity", 1);
      
    
    hoverbox
      .style("left", (d3.event.pageX + 20) + "px")
      .style("top", (d3.event.pageY - 20) + "px");
      //.select("div.hb_obj_list").text("attributes: "+thenode.attr("intent"));
     
    //var ul = $('ul.hb_attr_list');
	wrapperElementsInList($('ul.hb_attr_list'), d.intent)
	wrapperElementsInList($('ul.hb_obj_list'), d.extent)
	
	
	// Dashboard
	updateDistributionChart(d);
	
}

function nodeMouseOut(){
	if(mouseOverHoverBox) return;
	//while(mouseOverHoverBox){}
	
	// In case they are highlighted
	//var higg = d3.select("line.highlighted");
	d3.selectAll("line.highlighted").classed("highlighted", false);


	//function(){ (mouseOverHoverBox) ?   }
	var thenode = d3.select(this);
	thenode.style("stroke", "white");
	
	setTimeout(function(){
		if(!mouseOverHoverBox){
			// hide hoverbox
			hoverbox.transition()
	  		.duration(200)
	  		//.delay(1800)
      		.style("opacity", 0);
		};
		
	}, 1800);
	
	
    
    //hoverbox.style("display", "none");
}


function nodeClick(){ // select node	
	d3.select(this).classed("selected", function(){ 
		if (this.classList.contains("selected")) {
			numberSelected--;
			return false;
		} else {
			numberSelected++;
			return true
		}
		
	});
	clearSearch(); // if I made a click node to add/remove selection, the search is no longer valid
	updateSelectionList();
	
	$("#sel-count").text("("+numberSelected+")"); // update counter
}


function clearSearch(){ // show hidden nodes/edges from previous search
	$('#search').val('');
	showNodes();
}

function clearSelection(){ // remove selection
	clearSearch();
	vis.selectAll(".selected").classed("selected", false);
	$('#selection_list').empty();
	
}



/*
 *  LABELS
 */ 

function get_upper_label(d){
	if (labeling_type == LABEL_REPETITIVE) return d.intent; // repetitive
	else if (labeling_type == LABEL_MULTILABEL) return d.upperLabel; // multilabel
	else if (labeling_type == LABEL_SUPPORT) return ''; // support
	else return "upper"
}
function get_lower_label(d){
	if (labeling_type == LABEL_REPETITIVE) return d.extent;
	else if (labeling_type == LABEL_MULTILABEL) return d.lowerLabel; // multilabel
	else if (labeling_type == LABEL_SUPPORT) return Math.round(100*d.support) + "% (" + Math.round(context.objects.length*d.support) + ")" ;// multilabel
	else return "lower"
}

function changeLabel(type){
	labeling_type = type;
	labelizeData();
	
	vis.selectAll("text.intent")
        .text(get_upper_label); 
    vis.selectAll("text.extent")
        .text(get_lower_label); 
}


function labelize(){ // TODO work on data not on layout
	
	var labeling_type = 2;

	var top_concept =vis.select('circle[id="'+ lattice.topConcept.id +'"]');
	var nodelist = getOutgoingNodes(top_concept);
	
	// intent labels
	for (var i=0; i < nodelist.length; i++) {
		var cur = nodelist[i];
		var curIntent = cur.attr("intent").split(',');
		
		var parentlist = getIncomingNodes(cur);
		for (var j=0; j < parentlist.length && curIntent.length > 0; j++) {
		  var parentIntent = parentlist[j].attr("intent").split(',');
		  
		     curIntent = ArraySubtract(curIntent,parentIntent);
		};
		
		
		vis.select('text[id="intent_'+cur.attr("id")+'"]').text(curIntent.join(", ")); 
		
		//nodelist.addAll(getOutgoingNodes(cur));
		ArrayAddAll(getOutgoingNodes(cur), nodelist);
	}
	

	// objects: bottom up
	var bottom_concept = vis.select('circle[id="'+ lattice.bottomConcept.id +'"]');
	nodelist = getIncomingNodes(bottom_concept);
	
	// extent labels
	for (var i=0; i < nodelist.length; i++) {
		var cur = nodelist[i];
		var curExtent = cur.attr("extent").split(',');
		
		var childlist = getOutgoingNodes(cur);
		for (var j=0; j < childlist.length && curExtent.length > 0; j++) {
		  var childExtent = childlist[j].attr("extent").split(',');
		  
		     curExtent = ArraySubtract(curExtent,childExtent);
		};
		
		vis.select('text[id="extent_'+cur.attr("id")+'"]').text(curExtent.join(", ")); 
		
		//nodelist.addAll(getIncomingNodes(cur));
		ArrayAddAll(getIncomingNodes(cur), nodelist);
	}
	
}

/*
 * Check 
 */

function checkLatticeConstraints(){
	
	// check labels
	if (context.attributes > MAX_ENTITY_SIZE || context.objects > MAX_ENTITY_SIZE) {
		if (confirm("Labeling concepts in this lattice may be overwhelming, do you want to label them by percentage?"))
		labeling_type = LABEL_SUPPORT;
	}
}

function labelizeData(){ 
	
	if (labeling_type != LABEL_MULTILABEL) return; // not multi label
	
	//var top_concept = vis.select('circle[id="'+ data.top_id +'"]');
	var nodelist = getTopMostConcepts();
	
	// intent labels
	for (var i=0; i < nodelist.length; i++) {
		var cur = nodelist[i];
		
		var parentlist = getParentsData(cur);
		
		var curIntent = cur.intent;
		
		for (var j=0; j < parentlist.length && curIntent.length > 0; j++) {
		  var parentIntent = parentlist[j].intent;
		  
		     curIntent = ArraySubtract(curIntent,parentIntent);
		};
		
		var intLabel = curIntent.join(", ");
		//vis.select('text[id="intent_'+cur.id+'"]').text(intLabel); 
		cur.name = intLabel;
		cur.upperLabel = intLabel;
		
		
		//nodelist.addAll(getChildrenData(cur));
		ArrayAddAll(getChildrenData(cur), nodelist);
		
	}
	
	
	// extent labels
	nodelist = getBottomMostConcepts();
	
	for (var i=0; i < nodelist.length; i++) {
		var cur = nodelist[i];
		
		var childrenList = getChildrenData(cur);
		
		var curExtent = cur.extent;
		
		for (var j=0; j < childrenList.length && curExtent.length > 0; j++) {
		  var childExtent = childrenList[j].extent;
		  
		     curExtent = ArraySubtract(curExtent,childExtent);
		};
		
		var extLabel = curExtent.join(", ");
	//	vis.select('text[id="extent_'+cur.id+'"]').text(extLabel); 
		cur.lowerLabel = extLabel;
		//nodelist.addAll(getParentsData(cur));
		ArrayAddAll(getParentsData(cur), nodelist);
	}
	
}



function getTopMostConcepts(collection){
	
	if (!collection) collection = lattice.concepts;
	
	var ret = [];
	
	var minDepth = Number.MAX_VALUE;
	
	for (var i=0; i < collection.length; i++) { 
	  var cur = collection[i];
	  
	  if(cur.depth == 0){ //top possible
	  	ret.push(cur);
	  	return ret;
	  }
	  
	  if (cur.depth < minDepth) {
	  	ret.length = 0;
	  	ret.push(cur);
	  	minDepth = cur.depth;
	  } else if (cur.depth == minDepth){
	  	ret.push(cur);
	  }
	  
	};
	
	return ret;
}

function getBottomMostConcepts(){
	var ret = [];
	
	var maxDepth = Number.MIN_VALUE;
	
	for (var i=0; i < lattice.concepts.length; i++) { 
	  var cur = lattice.concepts[i];
	  
	  
	  if (cur.depth > maxDepth) {
	  	ret.length = 0;
	  	ret.push(cur);
	  	maxDepth = cur.depth;
	  } else if (cur.depth == maxDepth){
	  	ret.push(cur);
	  }
	  
	};
	
	return ret;
}


function labelize2(){ // TODO work on data not on layout
	


	//var top_concept = vis.select('circle[id="'+ data.top_id +'"]');
	var nodelist = getTopMostConcepts();
	
	// intent labels
	for (var i=0; i < nodelist.length; i++) {
		var cur = nodelist[i];
		
		var parentlist = getParentsData(cur);
		
		var curIntent = cur.intent;
		
		for (var j=0; j < parentlist.length && curIntent.length > 0; j++) {
		  var parentIntent = parentlist[j].intent;
		  
		     curIntent = ArraySubtract(curIntent,parentIntent);
		};
		
		var intLabel = curIntent.join(", ");
		vis.select('text[id="intent_'+cur.id+'"]').text(intLabel); 
		cur.name = intLabel;
		
		
		//nodelist.addAll(getChildrenData(cur));
		ArrayAddAll(getChildrenData(cur), nodelist);
		
	}
	
	
	// extent labels
	nodelist = getBottomMostConcepts();
	
	for (var i=0; i < nodelist.length; i++) {
		var cur = nodelist[i];
		
		var childrenList = getChildrenData(cur);
		
		var curExtent = cur.extent;
		
		for (var j=0; j < childrenList.length && curExtent.length > 0; j++) {
		  var childExtent = childrenList[j].extent;
		  
		     curExtent = ArraySubtract(curExtent,childExtent);
		};
		
		var extLabel = curExtent.join(", ");
		vis.select('text[id="extent_'+cur.id+'"]').text(extLabel); 
		
		//nodelist.addAll(getParentsData(cur));
		ArrayAddAll(getParentsData(cur), nodelist);
	}
	

}


function labelizeThis(col, isTree){ 
	
	//var top_concept = vis.select('circle[id="'+ data.top_id +'"]');
	var nodelist;
	
	if (isTree) {
		nodelist = flatten(col);
	}
	else {
		nodelist = getTopMostConcepts(col);
	}
	
	// intent labels
	for (var i=0; i < nodelist.length; i++) {
		var cur = nodelist[i];
		
		var parentlist = getParentsData(cur);
		
		var curIntent = cur.intent;
		
		for (var j=0; j < parentlist.length && curIntent.length > 0; j++) {
		  var parentIntent = parentlist[j].intent;
		  
		     curIntent = ArraySubtract(curIntent,parentIntent);
		};
		
		var intLabel = curIntent.join(", ");
		//vis.select('text[id="intent_'+cur.id+'"]').text(intLabel); 
		cur.name = intLabel;
		
		
		ArrayAddAll(getChildrenData(cur), nodelist);
		
	}
	
	
	// extent labels
	nodelist = getBottomMostConcepts();
	
	for (var i=0; i < nodelist.length; i++) {
		var cur = nodelist[i];
		
		var childrenList = getChildrenData(cur);
		
		var curExtent = cur.extent;
		
		for (var j=0; j < childrenList.length && curExtent.length > 0; j++) {
		  var childExtent = childrenList[j].extent;
		  
		     curExtent = ArraySubtract(curExtent,childExtent);
		};
		
		var extLabel = curExtent.join(", ");
		//vis.select('text[id="extent_'+cur.id+'"]').text(extLabel); 
		
		ArrayAddAll(getParentsData(cur), nodelist);
	}
	

}


/*
 * Hover box
 */

function wrapperElementsInList(ul,array){
	
	ul.empty();
	//var ul = $('<ul>').appendTo('body');
	$(array).each(function(index, item) {
	    ul.append(
	        $(document.createElement('li')).text(item)
	    );
	});
}

/*
 * Utils
 */
function visitEdgesUp(n, mycallback) {
	var inEdges = getIncomingEdgesData(n);
// 	
	// inEdges.each(function(e){
		// mycallback(e);
	    // visitUp(e,mycallback);
	// });
	
	for (var i=0; i < inEdges.length; i++) {
	  mycallback(inEdges[i]);
	  visitEdgesUp(inEdges[i].source,mycallback);
	};
	
}


function getIncomingEdgesData(n, eachCallback){
	var inEdges = [];
	
	for (var i=0; i <lattice.edges.length; i++) {
	  var curLink = lattice.edges[i]; 
	  if (curLink.target.id == n.id) { 
	  	inEdges.push(curLink)
	  	if (typeof(eachCallback)!='undefined') eachCallback(curLink);
	  };
	};
	
	return inEdges;
}


function getIncomingEdges(n, eachCallback){
	var inEdges = [];
	inEdges = vis.selectAll('line[target_id="'+ n.attr("id") +'"]');
	if (typeof(eachCallback)!='undefined') {
		inEdges.each(eachCallback);
	}
	return inEdges;
}

function getOutgoingEdges(n, eachCallback){
	var outEdges = [];
	outEdges = vis.selectAll('line[source_id="'+ n.attr("id") +'"]');
	if (typeof(eachCallback)!='undefined') {
		outEdges.each(eachCallback);
	}
	return outEdges;
}

function getIncomingNodes(n){
	var inNodes = [];
	vis.selectAll('line[target_id="'+ n.attr("id") +'"]').each(function() {
		var thecircle = vis.select('circle[id="'+d3.select(this).attr("source_id")+'"]');
		if (inNodes.indexOf(thecircle) < 0) {
			inNodes.push(thecircle);
		}
	});
	return inNodes;
}

function getOutgoingNodes(n){
	var inNodes = [];
	vis.selectAll('line[source_id="'+ n.attr("id") +'"]').each(function() {
		var thecircle = vis.select('circle[id="'+d3.select(this).attr("target_id")+'"]');
		if (inNodes.indexOf(thecircle) < 0) {
			inNodes.push(thecircle);
		}
	});
	return inNodes;
}
///

function getParentsData(nd){
	var parents = [];
	for (var i=0; i < lattice.concepts.length; i++) {
	  if(nd.parents_ids.indexOf(lattice.concepts[i].id) >= 0){
	  	parents.push(lattice.concepts[i]);
	  }
	};
	return parents;
}

function getChildrenData(nd){
	var children = [];
	for (var i=0; i < lattice.concepts.length; i++) {
	  if(nd.children_ids.indexOf(lattice.concepts[i].id) >= 0){
	  	children.push(lattice.concepts[i]);
	  }
	};
	return children;
}

function areNeighbor(n1, n2){
	  if((n1.parents_ids.indexOf(n2.id) >= 0 || n1.children_ids.indexOf(n2.id) >= 0) && 
	  (lattice.concepts.indexOf(n1) >= 0 &&  lattice.concepts.indexOf(n2) >= 0 )){  // assures that they are visible (not filtered)
	   return true;
	  }
	return false;
}

function hasChild(n1, n2){
	  if((n1.children_ids.indexOf(n2.id) >= 0) && 
	  (lattice.concepts.indexOf(n1) >= 0 &&  lattice.concepts.indexOf(n2) >= 0 )){  // assures that they are visible (not filtered)
	   return true;
	  }
	return false;
}



// visualisations options for lattice
var latticeVisOpts = [ { name: "Hasse diagram", val: "lattice", tooltip: "A Hasse diagram with dynamic arrangement" }, { name: "Tree", val: "tree", tooltip: "A concept in a tree has only one parent and no edges crossings" }, { name: "Treemap", val: "treemap", tooltip: "A treemap subdivides area into rectangles each of them is sized according to some metric" }, { name: "Sunburst", val: "sunburst", tooltip: "A radial tree-like layout where the root node is at the center, with leaves on the circumference" }, { name: "iCicle", val: "icicle", tooltip: "Similar to sunburst but not radial" } ];

// visualisations for association rules
var ARVisOpts = [ { name: "Matrix", val: "matrixview", tooltip: "Association rules interdependence" }, { name: "Radial diagram", val: "radiagram", tooltip: "Association rules interdependence" }, { name: "Grouped circles", val: "gg_ar_plot", tooltip: "Grouped graph of association rules" } ];


// size and color options 
// when a metric is calculated the corresponding option becomes available
var colorAndSizeOpts = [ { name: "Default", val: "default", tooltip: "Default option" }, { name: "Support", val: "support", tooltip: "Support" } ];




/*
 * Initialization
 */

var selectedConcepts = [];

// This is for when user click outside toolbar, that hides it
$(document).mouseup(function (e)
	{
	   if (!$(e.target).closest('.toolbarPanel').length) {
		$(".toolbarPanel").hide(); //toggleDiv(openDiv);
	}
});




$(function() {
	
	/* 
	 * Scroll lattice
	 */
	var scroller_object = $( "#chart" );
	
	 $(window).scroll(function() {
	 	
	 	// association rules
	 	if (currentVis == "matrixview" || currentVis == "radiagram" || currentVis == "gg_ar_plot" ) {
	 		scroller_object.css( { position: "absolute", top: "128px" } );
	 		return;
	 	}
	 	
	 	// lattice
        if( document.documentElement.scrollTop >= 102 || window.pageYOffset >= 102 )
			{
				if( $.browser.msie && $.browser.version == "6.0" )
				{
					scroller_object.css( "top", ( document.documentElement.scrollTop + 55 ) + "px" );
				}
				else
				{
					scroller_object.css( { position: "fixed", top: "55px" } );
				}
			}
			else if( document.documentElement.scrollTop < 102 || window.pageYOffset < 102 )
			{
				scroller_object.css( { position: "absolute", top: "128px" } );
			}
    });
 	
 	
 	/*
 	 * TOOLBAR
 	 */
 	
 	 $("#hideVisPanel").click(function(){
 	 		$(".toolbarPanel").hide();
		 });
	 $(".visButton").click(function(){
	 	 $(".toolbarPanel").hide();
	 	 $("#visPanel").show();
	 });
	 $(".highlightButton").click(function(){
	 	 $(".toolbarPanel").hide();
	 	 $("#highlightPanel").show();
	 });
	 $(".metricButton").click(function(){
	 	 $(".toolbarPanel").hide();
	 	 $("#metricPanel").show();
	 });
	 
	 $('li.explain').tooltip({
		title: 'data-tooltip',
		placement: "right",
		delay: 800
	});
	
		// Lattice / AR toggle
	$("input:radio[name='toggle']").change(function(){
		if($(this).val() == "rules") {
			
			$('#dashboard_lattice').hide();
			
			$('#dashboard_ar').show();
			
			d3.select("#chart").html("");
			
			fetchAssociationRules(initARView);
			currentVis="matrixview";
			buildOptionsForSelect(ARVisOpts, "select-vis", "matrixview");
		
		} else { // lattice
			$('#dashboard_ar').hide();
			$('#toolbar').show();
			$('#dashboard_lattice').show();
			changeVis('lattice'); // TODO back to the previous selected vis
			buildOptionsForSelect(latticeVisOpts, "select-vis", "matrix");
		}
		
	});
	
	
	
	// TOOLBAR - VISUALISATIONS
	buildOptionsForSelect(latticeVisOpts, "select-vis", "lattice");
	
	// TOOLBAR COLOR AND SIZE OPTIONS
	buildOptionsForSelect(colorAndSizeOpts,"select-size", "default");
	buildOptionsForSelect(colorAndSizeOpts,"select-color", "default");
	

	// TOOLBAR - METRICS   
 	$( "#slider-supp" ).slider({
			range: true,
			min: 0,
			max: 100,
			values: [ 30, 90 ],
			slide: function( event, ui ) {
				$( "#support" ).val( ui.values[ 0 ] + "% - " + ui.values[ 1 ] + '%' );
				changeNodeVisibility("support", ui.values[ 0 ], ui.values[ 1 ], false);
				
			}
		});
	
	$( "#slider-stab" ).slider({
			min: 0,
			max: 100,
			value: [ 50 ],
			slide: function( event, ui ) {
				$( "#stability" ).val( ui.value + "%");
				changeNodeVisibility("stability", ui.value, null, false);
				
			}
		});
		
		
	$( "#slider-conf" ).slider({
			min: 0,
			max: 100,
			value: [ 50 ],
			slide: function( event, ui ) {
				$( "#confidence" ).val( ui.value + "%");
				changeNodeVisibility("stability", ui.value, null, false);
				
			}
	});
	
	// TOOLBAR - drawing
	$( "#select-label" ).change(function(){
		changeLabel(parseInt($(this).attr('value')));
	});
	
 	$( "#select-size" ).change(function(){
		changeNodeSize($(this).attr('value'));
	});
	
	$( "#select-color" ).change(function(){
		changeNodeColor($(this).attr('value'));
	});
	
	$( "#select-vis" ).change(function(){
		changeVis($(this).attr('value'));
	});
	
	$('option.explain').tooltip({
		title: 'data-tooltip',
		placement: "right",
		delay: 600
	});
	
	$('span.explain').tooltip({
		live: true,
		title: 'data-tooltip',
		placement: "top",
		offset: 10,
		delay: 600
	});
	
	$( "input[name='highlight_path']" ).change( function(){
		highlightPath = $(this).is(':checked');
	});
 
 
	/*
	 * Filters and Search
	 */
	$(".distribution-view").click(function(){
		$(".graph-view").removeClass("active");
		$(".distribution-view").addClass("active");
		
		$("#filters_container").show();
		$("#graph_container").hide();
	});
	
	$(".graph-view").click(function(){
		$(".graph-view").addClass("active");
		$(".distribution-view").removeClass("active");
		
		$("#graph_container").show();//fadeOut('fast');
		$("#filters_container").hide();
	});
	
	
	$(".filter-search").click(function(){
		filterSelected();
		$("input.search").tokenInput("clear"); // removes also string in search
	});
	
	$("a.remove-filter").live("click",function(e){
		var pid = this.parentNode.id.split('-');
		if (pid.length > 1) removeFilter(pid[0],pid[1]);
		else removeFilter(pid[0]);
		
		e.stopPropagation();
		return false;
	});
	
	// end search
	
	
	/*
	 *  Entities
	 */
	
	$("#selAllAttr").click(function()				
			{
				var checked_status = this.checked;
				$("input[name='attr']").each(function()
				{
					this.checked = checked_status;
				});
	});
	
	$("#selAllObj").click(function()				
			{
				var checked_status = this.checked;
				$("input[name='obj']").each(function()
				{
					this.checked = checked_status;
				});
	});
	
	$(".filter-objs").click(function(){
		filterObjects();
	});
	$(".filter-attrs").click(function(){
		filterAttributes();
	});
	
	
	/*
	 * Interface components
	 */
	
		$( "#slider-layout" ).slider({
			value:2,
			min: 1,
			max: 2,
			step: 1,
			slide: function( event, ui ) {
				
				var layout_txt = "";
				
				if(ui.value == 1) {
					layout_txt = "Viewer";
				} else if(ui.value == 2) {
					layout_txt = "Dashboard"; // explorer
				} else if(ui.value == 3) {
					layout_txt = "Dashboard";
				}
				$( "#layout_type" ).val( layout_txt);
				
				inflateDiv(ui.value);
				
			}
		});
		
		$( "#layout_type" ).val( "Dashboard");	
		
		
		// drawing
		//$("#control_1").multiSelect();
		
		// hover box
		$("#hoverbox").hover(
		  function () {
		  	mouseOverHoverBox = true;
		  	//hoverbox.style("display", "block");
			//hoverbox.style("opacity", 1);
		  }, 
		  function () {
			mouseOverHoverBox = false;
				// hide hoverbox
			hoverbox.transition()
		  		.duration(200)
		  		.delay(800)
	      		.style("opacity", 0);
			  }
		);

		
		 // collapsible selection sidebar
		 $("#hidePanel").click(function(){
		 	 $("#showEntitiesPanel").show("normal").animate({width:"40px", opacity:1}, 200);
			 $("#panel").animate({marginLeft:"-175px"}, 500 );
			 $("#colleft").animate({width:"0px", opacity:0}, 400 );
			 $("#showPanel").show("normal").animate({width:"40px", opacity:1}, 200);
		 });
		 $("#showPanel").click(function(){
		 	 $("#showEntitiesPanel").hide();
			 $("#panel").animate({marginLeft:"0px"}, 400 );
			 $("#colleft").animate({width:"175px", opacity:1}, 400 );
			 $("#showPanel").animate({width:"0px", opacity:0}, 600).hide("slow");
		 });
		 
		  // collapsible entity sidebar
		 $("#hideEntPanel").click(function(){
		 	 $("#showPanel").show("normal").animate({width:"40px", opacity:1}, 200);
			 $("#entityPanel").animate({marginLeft:"-175px"}, 500 );
			 $("#entityContainer").animate({width:"0px", opacity:0}, 400 );
			 $("#showEntitiesPanel").show("normal").animate({width:"40px", opacity:1}, 200);
		 });
		 $("#showEntitiesPanel").click(function(){
		 	 $("#showPanel").hide();
			 $("#entityPanel").animate({marginLeft:"0px"}, 400 );
			 $("#entityContainer").animate({width:"175px", opacity:1}, 400 );
			 $("#showEntitiesPanel").animate({width:"0px", opacity:0}, 600).hide("slow");
		 });
		 
		 
		 $('.tabs').bind('change', function (e) {
			  e.target // activated tab
			  e.relatedTarget // previous tab
			});
		 
		 // collapsible filters bottom bar
		 $("#hideFiltersPanel").click(function(){
			 $("#thepanel").animate({marginLeft:"-210px"}, 500 );
			 $("#filtersPanel").animate({height:"1px", opacity:0}, 400 );
			// $("#filtersPanel").hide();
			 $("#showFiltersPanel").show("normal").animate({height:"20px", opacity:1}, 200);
			 
		 });
		 $("#showFiltersPanel").live("click",function(){

			 $("#thepanel").animate({marginLeft:"0px"}, 400 );
			 $("#filtersPanel").animate({height:"210px", opacity:1}, 400 );
			// $("#filtersPanel").show();
			 $("#showFiltersPanel").animate({height:"0px", opacity:0}, 600).hide("slow");
		 });
		 
		
		
		// calculate stability (test)
		 $("#calc-stab").change(function(){
			//$.get("/lattice/compute",  { metric: "stability"}, function(data) {
		    //    alert(data);
		   // });
		   calculate("stability");
		   
		 });
		 
		 // link clear selection
		 $("a.clear-sel").click(function(){
		 	clearSelection();
		 });
		 
		  // link clear selection
		 $("a.reset-filters").click(function(){
		 	resetFilters();
		 });
		
		// Transformations
		$("a.transf-tree").click(function(){
		 	//getTree();
		 	treeize();
		 });
		
		
		// DASHBOARD
		// row (dashboard)
		$(".draw-chart-1a").click(function(){
			createHorizontalBarChart("box1a-chart", $("#control_1").selectedPairsArray(), $("#control_2").selectedPairsArray());
		 });
		 
    	
    	createDistributionChart();
		 
		
		
		// end dashboard
		
		$("a.cancel-upload").live("click",function(){
			$('#cxt-file').popover('hide');

		 });
		$("#cxt-file").click(function(){
			$('#cxt-file').popover('show');

		 });
		
		$('#cxt-file').popover({
			placement: "bottom",
			html: "true",
			trigger: "manual",
			title: function() { return "Open cxt file";},
			content: function(){
				return $("#open-file").html();
				// return '<div> <form enctype="multipart/form-data" method="post" action="/lattice/load_cxt/" id="load_cxt_form">'+
	         // {% csrf_token %}  +
	         // {{ cxt_form.as_p }} +
	     // '<input type="submit" value="Upload" /> </form> </div>';
				
			}
		});
		
		// Operations
		
		  $('a.compare').click(function(){
		  	plotCompare();
	     });
	    
        
		
		
});


function inflateDiv(layoutType){
	if (layoutType == 1) {
		//$("#thepanel").animate({marginLeft:"-210px"}, 500 );
	    $("#columns").animate({width:"1px", opacity:0}, 400 );
	    $("#columns").hide();
		//$("#showFiltersPanel").show("normal").animate({height:"20px", opacity:1}, 200);
		$("#chart").animate({width:"1040px"}, 400 );
		
		// var aspect = w/h;
		// var chart = $("#chart");
		// chart.attr("width", 1040);
		// chart.attr("height", 1040 / aspect);



	} else {
		$("#chart").animate({width:"570px"}, 400 );
		$("#columns").show();
		$("#columns").animate({width:"570px", opacity:1}, 400 );
		
		//$("#showFiltersPanel").show("normal").animate({height:"20px", opacity:1}, 200);
		
	}	
}


function getAttributeValuesPairs(){ // TODO refatorar || eg output: [{name : "age->30", attrName: "age", valueName: ">30"}]// TODO colocar no context

		var ret = [];
		for (var attr in context.attributeNames) {
		  var valuesNumber = context.attributeNames[attr];
		  
		 	for (var j=0; j < valuesNumber.length; j++) {
		 		
		 		var obj = new Object();
		 		obj.valueIdx = j;
		 		
		 		if (valuesNumber[j][0] == "yes" || valuesNumber[j][0] == "no" ) { // boolean
		 			obj.name = attr;
		 			obj.attrName = attr; // raw attr name
		 			obj.booleanAttr = true;
		 			ret.push(obj);
		 			break;
		 		}
		 		else { 
		 			obj.booleanAttr = false;
		 			obj.attrName = attr; // raw attr name
		 			obj.valueName = valuesNumber[j][0]; 
		 			obj.name = attr + SEPARATOR + valuesNumber[j][0];
		 			  ret.push(obj);
		 		}
		 		
			 
			 };
		  
		};
		
	 	return ret;//attributes[attrName]; 
}



function selectionAdded(elem) {
	//var xs = $("input.search");
	//alert();

	var res = $("#search").tokenInput("get");
	//$("#search").val();
	var query = '';
	
	for (var i=0; i < res.length; i++) { // TODO fix that
	  query += res[i].name + ','
	};
	

	//alert(query);

	if(isBlank(query)) {// if search string is empty, invalidate previous searchs
		showNodes();
		vis.selectAll(".selected").classed("selected", false);
		return;
	}

	var selections = searchFacet(query, true); // TODO passar data e nao nodes
	//var nodes = selections[0];

	// add results to the selection
	addOrReplaceToSelectionList(selections[0], true); // TODO passar data?

	// highlight selected nodes (also in case they were hidden by previous selections)
	highlightNodes(selections[0]);

	// hide other nodes
	hideNodes(selections[1]);
}



/*
 * Visualisations
 */

// Dynamically populate visualisations for Lattice or Association Rules
function buildOptionsForSelect(options, selectId, defaultVal) {
    
    var $select = $('#'+selectId);
    $select.empty();
    
    var $option;

	for (var i=0; i < options.length; i++) {
	  
	   $option = $('<option value="' + options[i].val + '" class="explain"  data-tooltip="'+options[i].tooltip+'">' + options[i].name + '</option>');
        if (options[i].val == defaultVal) {
            $option.attr('selected', 'selected');
        }
        $select.append($option);
	  
	};
    
}




/*
 * Selections
 */

// add a list of nodes to the selection panel
function addOrReplaceToSelectionList(nodeList, replace) {
	if (replace){ //replace results
		$('#selection_list').empty();
	}
	
	for (var i=0; i < nodeList.length; i++) {
      	var thenode = nodeList[i];// d3.select(nodeList[i]);
      	var li = $('<li>').appendTo('#selection_list');
      	//li.html("Attributes: "+thenode.attr("intent") + "<BR/> Objects: "+thenode.attr("extent")) // TODO unificar com methodo abaixo
      	li.html("Attributes: <span>"+thenode.attr("intent") + "</span><BR/> Objects: <span>"+thenode.attr("extent")+"</span>")
    };
}


function updateSelectionList(){
	// $(nodes).each(function(){
        // $(this).attr("fill", SELECTED_FILL_COLOR);
      // });
      
      $('#selection_list').empty();
      
      vis.selectAll("circle.selected").each(function(d) { // TODO para cada selecao atualiza a lista inteira?
      	var li = $('<li>').appendTo('#selection_list');
      	li.html("Attributes: <span>"+d.intent.join(', ') + "</span><BR/> Objects: <span>"+d.extent.join(', ')+"</span>")
      	
      });
}

function updateEntityList(){
      
      $('#attr_list').empty();
      $('#obj_list').empty();
      
      // Update attribute names
      var attrNames = getAttributeValuesPairs(); // TODO this is returning an object[] instead of string[]
      for (var i=0; i < attrNames.length; i++) {
        var li = $('<li>').appendTo('#attr_list');
      	li.html("<span><input type='checkbox' name='attr' value='"+ attrNames[i].name +"'> "+ attrNames[i].name + "</span>")
      };
      
      // Update objects names
      var objsNames = context.objects;
      for (var i=0; i < objsNames.length; i++) {
        var li = $('<li>').appendTo('#obj_list');
      	li.html("<span><input type='checkbox' name='obj' value='"+ objsNames[i] +"'> "+ objsNames[i] + "</span>")
      };
      
      // update counters
      $('#attr-count').html(attrNames.length);
      $('#obj-count').html(objsNames.length);
      
}

// Updates all dashboards with current data
function updateLayout(){
	
}


   


function calculate(metric){
	if (metric == "stability") {
		calcStability();
	}
}


function calcStability(){
	if (typeof lattice_id == "undefined" || lattice_id == null) { // no lattice id
		flashAlert("error", "The current concept lattice is not saved in the server - could not compute metric.");
		return;
	}
	if (typeof metric_stability != "undefined") {// already fetched metric, return..
		//callback();
		return;
	}
	showLoading();
	
	var thetoken = $('input[name=csrfmiddlewaretoken]').val();
	var arlink = "/api/v1/metrics/";
	 $.getJSON(arlink,{ lattice_id: lattice_id, metric: "stability", csrfmiddlewaretoken:  thetoken}, function(data) {
	 		
	 		

	 		hideLoading();
	 		$("#calc-stab").attr("disabled", true);
	 		
	 		// That's asynchronous!
	 		if (typeof callback != 'undefined') 
	 		{
	 			
	 		};
	});
	
	
}


function calcSupport(intExt, useCurrentData){ // 'intent' , true (ira calcular a partir dos nos que estao la e nao no contexto)
	
	var total = 0;
	var n = 0;
	
	if (useCurrentData) {
		attrs = data.attributes.length; 
		objs = data.objects.length;
	} else {
		attrs = _data_attributes.length;
	}
	
	for (var i=0; i < data.nodes.length; i++) {
	  data.nodes[i];
	};
}
$(function() {
	
		$('ul.nav > li.active').removeClass("active");
		$('li#semantics').addClass("active");

// SEMANTICS
	    $('a.sparql-search').click(function(){
	     	var sp = $('textarea#search_prefix').val();
	     	var sq = $('textarea#search_query').val();
			var thetoken = $('input[name=csrfmiddlewaretoken]').val();
			
		     $.get('search',{ format:"json", search_prefix: sp, search_query: sq, csrfmiddlewaretoken:  thetoken}, function(data) {
			 
			// var content = (typeof data.error == "undefined") ? data.toString() : data.error;
			  
			  
			
			if (typeof data.error == "undefined") { 
			
				var table = $("div#sparql_result").append("<table></table>");
				var tHeader = table.append("<tr></tr>");
				for(var i = 0; i < data.head.vars.length; i++) {
					var headel = data.head.vars[i];
					tHeader.append("<th>"+ headel +"</th>");
				}
			
				for(var i = 0; i < data.results.bindings.length; i++)  {
					var binding = data.results.bindings[i];
					var val1 =  binding.wine.value.split("#")[1];
					var val2 =  binding.property.value.split("#")[1];
					var val3 =  binding.value.value.split("#")[1];
				
					table.append("<tr><td>"+ val1 +"</td><td>"+ val2 +"</td><td>"+ val3 +"</td></tr>");
				}
			} else {
				$('div#sparql_result').html(data.error);
			}
			
			//alert('Load was performed.');
			});
		});
        
		
		
});
/*
* Transform
*/
// function getChildrenDataNodes(children_ids){
// var ret = [];
// for (var i=0; i < children_ids.length; i++) {
// var found = false;
// for (var j=0; j < data.nodes.length && !found; j++) {
// if (data.nodes[j].id == children_ids[i]) {
// ret.push(data.nodes[j]);
// found = true;
// }
// };
// };
// return ret;
// }


function treeTransform() {
var top = getTopMostConcepts()[0];

function recurse(node) {



var children = getChildrenDataNodes(node.children_ids)
var newChildren = [];

for(var i = 0; i < children.length; i++) {
var chNode = recurse(children[i]);
newChildren.push(chNode);
};

node.children = newChildren;

return node;

// if (p != null) p.chidren.push(treeNode);

}

var topNode = recurse(top);
data.nodes = [topNode];

//return topNode;


}


function getTree0() {
var top = getTopMostConcepts()[0];

function recurse(node) {
if (node.children_ids.length==0) return null;
var treeNode = new Object();
treeNode.id = ""+node.id;
treeNode.name = node.intent.join(", ");//node.name;
treeNode.lowerLabel = node.lowerLabel;
treeNode.upperLabel = node.upperLabel;
treeNode.support = node.support;
treeNode.intent = node.intent;
treeNode.extent = node.extent;
treeNode.depth = node.depth;
//treeNode.children_ids = node.children_ids;
//treeNode.title = node.name;
treeNode.children = [];

var children = getChildrenData(node);//getChildrenDataNodes(node.children_ids)

for(var i = 0; i < children.length; i++) {

if (children[i].children_ids.length>0) { var chNode = recurse(children[i]);
chNode.id = node.id + "-" + chNode.id; // current node id = node_id-parent_id to avoid duplicates
treeNode.children.push(chNode);
}
};

return treeNode;

}
var topNode = recurse(top);
return topNode;

}


function getTree() {
var top = getTopMostConcepts()[0];

function recurse(node) {

// var treeNode = new Object();
// treeNode.name = node.name;
// treeNode.intent = node.intent;
// treeNode.extent = node.extent;
// treeNode.title = node.name;
// treeNode.children = [];
var children = getChildrenDataNodes(node.children_ids)
var newChildren = [];

for(var i = 0; i < children.length; i++) {
var chNode = recurse(children[i]);
newChildren.push(chNode);
};

node.children = newChildren;

return node;

// if (p != null) p.chidren.push(treeNode);

}

var topNode = recurse(top);

return topNode;

// var nt = []
// nt.push(topTreeNode);
//
// data.nodes = nt;
      // data.links = d3.layout.tree().links(nt);
//
// updateLattice();
//return topTreeNode;

}



// Returns a list of all nodes under the root.
function flatten(root) {
 // var nodes = [], i = 0;

  function recurse(node) {
  
   var treeNode = new Object();
   treeNode.name = node.name;
   treeNode.children = [];
  
   var children = getChildrenDataNodes(node.children_ids)
  
   //node.children = children;
    //if (children.length > 0) children.forEach(recurse);
    for (var i=0; i < children.length; i++) {
     var chTreeNode = recurse(treeNode, children[i]);
     treeNode.children.push(chTreeNode);
      
    };
    
    return treeNode;
    
  // if (p != null) p.chidren.push(treeNode);
  
    
  }

  var topTreeNode = recurse(root);
  return topTreeNode;
}function flatten(root) {
  var nodes = [], i = 0;

  function recurse(node) {
    if (node.children) node.children.forEach(recurse);
    if (!node.id) node.id = ++i;
    nodes.push(node);
  }

  recurse(root);
  return nodes;
}

/*
 * Clearing redundancy
 */

function unique_set (in_Array,is_rule_array)
{
	function compare_splines(spl1,spl2)
	{
		//true if equals
		result=true;
		if (spl1.length!==spl2.length) {return false;}
		else
		{
			for (k=0;k<spl1.length;k++){ 
				//console.log(spl1[k],spl2[k]);
				if (!compare_objects(spl1[k],spl2[k])) result=false;}
		}
		return result;
	}
is_rule_array || (is_rule_array = false);
arr=[];
if (is_rule_array)
{
	for (i=0;i<in_Array.length;i++)
	{
		flag=true;
		for (j=0;j<arr.length;j++)
		{
			if (compare_splines(arr[j],in_Array[i])) flag=false;
		}
		if (flag) arr.push(in_Array[i]);
	}	
}
else
{ for (i=0;i<in_Array.length;i++)
	{
		flag=true;
		for (j=0;j<arr.length;j++)
		{
			if (compare_objects(arr[j],in_Array[i])) flag=false;
		}
		if (flag) arr.push(in_Array[i]);
	}
}

return arr;
}

/*
 * Comparing objects
 */

var compare_objects = function (x, y){
  if ( x === y ) return true;
    // if both x and y are null or undefined and exactly the same

  if ( ! ( x instanceof Object ) || ! ( y instanceof Object ) ) return false;
    // if they are not strictly equal, they both need to be Objects

  if ( x.constructor !== y.constructor ) return false;
    // they must have the exact same prototype chain, the closest we can do is
    // test there constructor.

  for ( var p in x ) {
    if ( ! x.hasOwnProperty( p ) ) continue;
      // other properties were tested using x.constructor === y.constructor

    if ( ! y.hasOwnProperty( p ) ) return false;
      // allows to compare x[ p ] and y[ p ] when set to undefined

    if ( x[ p ] === y[ p ] ) continue;
      // if they have the same strict value or identity then they are equal

    if ( typeof( x[ p ] ) !== "object" ) return false;
      // Numbers, Strings, Functions, Booleans must be strictly equal

    if ( ! Object.equals( x[ p ],  y[ p ] ) ) return false;
      // Objects and Arrays must be tested recursively
  }

  for ( p in y ) {
    if ( y.hasOwnProperty( p ) && ! x.hasOwnProperty( p ) ) return false;
      // allows x[ p ] to be set to undefined
  }
  return true;
};

/*
 * Comparing association rules:: we can't use compare objects because rules have subarrays: premise & conclusion 
 */

function compare_a_rules(rule1,rule2)
{
	          	tmp1=Object();
          		tmp2=Object();
          		
          		tmp1.prem=clone(rule1.premise);
          		tmp1.conc=clone(rule1.conclusion);
          		tmp2.prem=clone(rule2.premise);
          		tmp2.conc=clone(rule2.conclusion);          		
          		
          		sub_sets_equal = compare_objects(tmp1.prem,tmp2.prem) && compare_objects(tmp1.conc,tmp2.conc);
          		
          		tmp1=clone(rule1);
          		tmp2=clone(rule2);
          		tmp1.premise=1;
          		tmp1.conclusion=1;
          		tmp2.premise=1;
          		tmp2.conclusion=1;	
	return compare_objects(tmp1,tmp2) && sub_sets_equal;
}

/*
 * Matrix Utils
 */
Array.prototype.transpose = function() {

  // Calculate the width and height of the Array
  var a = this,
    w = a.length ? a.length : 0,
    h = a[0] instanceof Array ? a[0].length : 0;

  // In case it is a zero matrix, no transpose routine needed.
  if(h === 0 || w === 0) { return []; }

  /**
* @var {Number} i Counter
* @var {Number} j Counter
* @var {Array} t Transposed data is stored in this array.
*/
  var i, j, t = [];

  // Loop through every item in the outer array (height)
  for(i=0; i<h; i++) {

    // Insert a new row (array)
    t[i] = [];

    // Loop through every item per item in outer array (width)
    for(j=0; j<w; j++) {

      // Save transposed data.
      t[i][j] = a[j][i];
    }
  }

  return t;
};

/*
 * Object cloning
 */

function clone(o) {
	if(!o || "object" !== typeof o)  {
		return o;
	}
	var c = "function" === typeof o.pop ? [] : {};
	var p, v;
	for(p in o) {
		if(o.hasOwnProperty(p)) {
			v = o[p];
			if(v && "object" === typeof v) {
				c[p] = clone(v);
			}
		else c[p] = v;
		}
	}
	return c;
}

/*
 * Colection Utils
 */

function ArrayAddAll(source, destination) { 
		for (var i=0; i < source.length; i++) {
		  if (destination.indexOf(source[i]) < 0) {
		  	destination.push(source[i]);
		  }
		};
};



function ArraySubtract(ara1,ara2) {
  var aRes = new Array() ;
  for(var i=0;i<ara1.length;i++) {
    if( ! (ara2.indexOf(ara1[i]) >= 0)) {
      aRes.push(ara1[i]) ;
    }
  }
  return aRes ;
} 


function ArraySubtractId(ara1,ara2) {
  var aRes = new Array() ;
  for(var i=0;i<ara1.length;i++) {
  	
  	var found = false;
  	for (var j=0; j < ara2.length && !found; j++) {
		
		if (ara1[i].id == ara2[j].id) found = true;
		
	}
	
	if (!found) aRes.push(ara1[i]) ;
	
  }
  return aRes ;
} 


function ArrayIntersect(ara1,ara2) {
  var aRes = new Array() ;
  for(var i=0;i<ara1.length;i++) {
    if( !isBlank(ara1[i]) && ara2.indexOf($.trim(ara1[i])) >= 0) {
      
      aRes.push(ara1[i]) ;
    }
  }
  return aRes ;
} 


function ArrayContainsAll(ara1,ara2) {
  var contains = false;
  
  if (ara1.length == 0) return false;
  
  for(var i=0;i<ara2.length;i++) {
  	
    if( !isBlank(ara2[i]) && ara1.indexOf($.trim(ara2[i])) < 0) {
      
		return false;
    } 
  }
  return true ;
} 



function ArrayIntersectId(ara1,ara2) {
  var aRes = new Array() ;
  for(var i=0;i<ara1.length;i++) {
  	
  	for (var j=0; j < ara2.length; j++) {
		
		if (ara1[i].id == ara2[j].id) {
			aRes.push(ara1[i]) ;
		}
		
	}
  }
  return aRes ;
} 

// Array Remove - By John Resig (MIT Licensed)
function ArrayRemove(array, from, to) {
  var rest = array.slice((to || from) + 1 || array.length);
  array.length = from < 0 ? array.length + from : from;
  return array.push.apply(array, rest);
};


function HashClone(hash){
	
	return jQuery.extend(true, {}, hash);
	
}

function getKeys(h){
	var keys = [];
	for (var k in h) keys.push(k);
	return keys;
}



/*
 * String utils
 */

String.prototype.escapeHTML = function () {                                       
        return(                                                                 
            this.replace(/&/g,'&amp;').                                         
                replace(/>/g,'&gt;').                                           
                replace(/</g,'&lt;').                                           
                replace(/"/g,'&quot;')                                         
        );                                                                     
};


function isBlank(str) {
    return (!str || /^\s*$/.test(str));
}

function removeWhiteSpaces(str){
	str = str.replace(/\s/g,"");
	return str;
}
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
    
    
     var nodes = lattice.concepts,
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
	  	lattice.concepts.forEach(function(o, i) {
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

var r,x,y,color;


function initSunburst(){
	
	// w = 960;
    // h = 500;
    r = Math.min(w, h) / 2;
    x = d3.scale.linear().range([0, 2 * Math.PI]);
    y = d3.scale.sqrt().range([0, r]);
    color = d3.scale.category20c();
	
	
	vis = d3.select("#chart").append("svg:svg")
	    .attr("width", w)
	    .attr("height", h)
	  .append("svg:g")
	    .attr("transform", "translate(" + w / 2 + "," + h / 2 + ")");
	    
	 partition = d3.layout.partition()
     .sort(null)
     //.size([2 * Math.PI, radius * radius])
     .value(function(d) { return 1; });
	    
	  updateSunburst();
	
}

function updateSunburst() {
		
       
       //	treeTransform();
       
       	
        var json = getTree0();// lattice.concepts[0]; //  no need to transform :)
        
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
    .value(function(d) { return  1; }); // TODO d.size
    //.value(function(d) { return  Math.round(d.support*100); }); // TODO d.size


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
