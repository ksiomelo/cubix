// THIS JAVASCRIPT SHOULD BE LOADED BEFORE ALL OTHERS (cubix.x.js)

/*
 * Constants
 */
// context

var SEPARATOR = "-";

// layout
var DEFAULT_WIDTH = 570; //960
var DEFAULT_HEIGHT = 500; // 600

var MAXIMIZED_HEIGHT = 1040;
var MAXIMIZED_WIDTH = 800;

var DEFAULT_ATTR_GRAPH_WIDTH = 500;
var DEFAULT_ATTR_GRAPH_HEIGHT = 600;

// sunburst label strategy
var MIN_ANGLE_FOR_LABELS = 6; // 10


// lattice
var MAX_ENTITY_SIZE = 35; // max numer of attributes or objects


// size
var DEFAULT_NODE_RADIUS = 8;
var NODE_MAX_SIZE = 16;
var NODE_MIN_SIZE = 6;

var DEFAULT_EDGE_THICKNESS = 4;
var EDGE_MAX_THICK = 21;
var EDGE_MIN_THICK = 1;


var SIZE_STABILITY = 2;
var SIZE_SUPPORT = 2;
var SIZE_DEFAULT = 1;

// labels
var LABEL_REPETITIVE = "repetitive";
var LABEL_MULTILABEL = "multi-label";

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
	var attr_idx = []; // TODO this is to sort AR after
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
			else{
				if ( (a_rules_concerned_attributes[a])[i][0]=="no") continue;
				else
				{
					t.text=a.toString()+"-"+(a_rules_concerned_attributes[a])[i][0];
					attr_list.push( t );
				}
			}
			
			attr_idx.push(t.text);
			
			
		}
	}
	if (s<11) color_set=d3.scale.category10();
	return [attr_list,attr_idx];
}

function fetchAssociationRules(callback){	
	if (typeof lattice.id == "undefined" || lattice.id == null) { // no lattice id
		flashAlert("The current concept lattice is not saved in the server - could not compute association rules.","error");
		return;
	}
	if (typeof association_rules != "undefined") {// already fetched AR, return..
		callback();
		
		return;
	}
	flashAlert("Calculating association rules, this may take some minutes...");
	
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
		flashAlert("The association rules couldn't be fetched from the server","error");
		
		
		
	//initializing environement
	var m = [0, 0, 0, 0]; // margins
	var matrix=[];
	var n=0;
	
	var attr_list=get_attribute_list();
	var attr_idx = attr_list[1];
	attr_list = attr_list[0];
	
	n=attr_list.length;
		
	//initialize matrix
	
	for (var i=0;i<association_rules.length;i++){
	matrix[i]=[];
	matrix[i]=d3.range(n).map(function(j){return {x:i, y:j, z:0}});
	}
	
	// sort association rules
	association_rules.sort(function(x, y){ 
		
		
		for (var j=0;j<attr_idx.length;j++){
			var idx1 = x.premise.indexOf(attr_idx[j]);
			var idx2 = y.premise.indexOf(attr_idx[j]);
			
			if ((idx1>=0 && idx2>=0) || (idx1<0 && idx2<0)) continue; // neither or both has attr, continue
			else if(idx1>=0 && idx2<0) return -1; // x has, y not, x > y
			else if(idx1<0 && idx2>=0) return 1; // x doens't, y has, x < y
		}
		
		for (var j=0;j<attr_idx.length;j++){
			var idx1 = x.conclusion.indexOf(attr_idx[j]);
			var idx2 = y.conclusion.indexOf(attr_idx[j]);
			
			if ((idx1>=0 && idx2>=0) || (idx1<0 && idx2<0)) continue; // neither or both has attr, continue
			else if(idx1>=0 && idx2<0) return -1; // x has, y not, x > y
			else if(idx1<0 && idx2>=0) return 1; // x doens't, y has, x < y
		}
		
		return -1;
		
		
		// var sum1 = 0;
		// for (var j=0;j<x.premise.length;j++){
			// sum1 += attr_idx.indexOf(x.premise[j]) + 1;
		// }
// 		
		// var sum2 = 0;
		// for (var j=0;j<y.premise.length;j++){
			// sum1 += attr_idx.indexOf(y.premise[j]) + 1;
		// }
// 		
		// return sum1 > sum2;
	});
	
	
	
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
	
	var arHeight = (h < association_rules.length*10+m[0]+m[2]) ? association_rules.length*10+m[0]+m[2] : h; // TODO hack
	
		vis = d3.select("#chart").append("svg:svg")
		.attr("width", w)
		.attr("height", arHeight ) //Math.max(h, association_rules.length*10)
		//.attr("viewBox", "0 0 "+w+" "+h)
    	//.attr("preserveAspectRatio", "xMidYMid")
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
      .attr("x1",Math.min(-association_rules.length*10,-h)) 
      .attr("transform", function(d, i) { return "translate(0," + i*(w-m[1]-1)/n + ")"; })
      .attr("class","matrix_view_separator");
  column.append("text")
   .attr("class","label")
      .attr("x", 0)
      .attr("dy", "1em")
      .attr("text-anchor", "start")
      .attr("transform", function(d, i) { return "translate(12," + i*(w-m[1]-1)/n + ")rotate(+45)"; })
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

//d3.selectAll(".matrix-row").style("stroke", "red");
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
    wrapperElementsInList($('ul.hb_confidence'), [Math.round(p.confidence*100).toString()+"%"]);
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
	
	if (typeof association_rules == 'undefined') { 
		flashAlert("The association rules couldn't be fetched from the server","error");
		return;
	}
		
	flashAlert("Select a rule by clicking on a bar in the \"Generated Rules\" chart ", "info", 5000);
	
	//Processing attributes
	attr_list=get_attribute_list()[0];
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
	.attr("viewBox", "0 0 "+w+" "+h)
	.attr("preserveAspectRatio", "xMidYMid")
 	//.attr("viewBox",((-1)*(m[0]+0*rx))+" "+((-1)*(m[0]+0*ry))+" "+(2*rx+0*m[0])+" "+(2*ry+0*m[0]))
  .append("svg:g")
    .attr("transform", "translate(" + w/2 + "," + h/2 + ")");
	
	

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
      	
     // var svg = d3.select("#chart").select("svg");
	  // var svgBBox = svg.node().getBBox();
	  // svg
	  // .attr("width",svgBBox.width)
	// .attr("height",svgBBox.height)
	 // .attr("viewBox", "0 0 "+svgBBox.width+" "+svgBBox.height);
	  	
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
var attr_list=get_attribute_list()[0];
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
    redrawCurVis();
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
var attr_list=get_attribute_list()[0];
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

//console.log(common_parent);
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

function flashAlert(msg, alertType, time) {
	if (alertType && alertType == "error") {
		$("div.alert-error > span").text(msg);
		$("div.alert-error").show();
	} else if (alertType && alertType == "info") {
		$("div.alert-info > span").text(msg);
		$("div.alert-info").show();
	} else {
		$("div.alert-block > span").text(msg);
		$("div.alert-block").show();
	}
	
	if (time){
		setTimeout(function(){ 
			$("div.alert").fadeOut();
			}, time);
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
	
	this.getSubcontextForExtent = function (objsList, includeEmptyAttributes) {
		
		var objs = [];
		var attrs = [];
		var rels = [];
		
		for (var i=0; i < objsList.length; i++) {
			
			objs.push(objsList[i]);
			
			var j = this.getObjectIndex(objsList[i]);
			
			
			if (includeEmptyAttributes) { // copy the entire row
				rels.push(this.rel[j]);
			} else { 
			
				rels[i] = new Array();
				for (var k=0; k < this.rel[j].length; k++) {
					   // select only the attributes having relation with the object
						if (this.rel[j][k]) {
							var attrIdx = attrs.indexOf(this.attributes[k]);
							if (attrIdx < 0)
								attrs.push(this.attributes[k]);
							attrIdx = attrs.indexOf(this.attributes[k]);
							rels[i][attrIdx] = true;
						}
				}
			}
		}
		
		if (includeEmptyAttributes) attrs = this.attributes;
		
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

function initDashboard(){
	createDistributionChart();
	//createPolarChart();
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

function createDistributionPieChart(){
	createPieChart("distribution-chart", "Distribution", []);
}


function createPieChart(renderTo, title, thedata){
	distributionChart = new Highcharts.Chart({
            chart: {
                renderTo: renderTo,
                plotBackgroundColor: null,
                plotBorderWidth: null,
                plotShadow: false
            },
            title: {
                text: title
            },
            tooltip: {
                pointFormat: '{series.name}: <b>{point.percentage}%</b>',
                percentageDecimals: 1
            },
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: true,
                        color: '#000000',
                        connectorColor: '#000000',
                        formatter: function() {
                            return '<b>'+ this.point.name +'</b>: '+ Math.round(this.percentage*100)/100 +' %';
                        }
                    }
                }
            },
            series: 
            [{
                type: 'pie',
                name: 'Attributes',
                data: thedata
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
	
	
	var selected = $("#distribution-chart-type").val();
	if (selected == "bar") { 
	
	
			if (typeof d == "undefined")
				return;
	
			var sumData = [];
			
			var subcontext = context.getSubcontextForExtent(d.extent, false);
			for (var j=0; j < subcontext.attributes.length; j++) {
				var sum = 0;
				
				for (var k=0; k < subcontext.objects.length; k++) {
			  		if (subcontext.rel[k][j] == true) sum++;
			 	}
			 	sumData.push(sum);
			};
			
			distributionChart.series[0].setData(sumData);
			distributionChart.xAxis[0].setCategories(subcontext.attributeNames);
			
	} else if (selected=="pie") {
		
		if (typeof d == "undefined")
				return;
	
			var sumData = [];
			
			var subcontext = context.getSubcontextForExtent(d.extent, false);
			for (var j=0; j < subcontext.attributes.length; j++) {
				var sum = 0;
				
				for (var k=0; k < subcontext.objects.length; k++) {
			  		if (subcontext.rel[k][j] == true) sum++;
			 	}
			 	sumData.push([ subcontext.attributes[j] ,sum]);
			};
			
			distributionChart.series[0].setData(sumData);
			//distributionChart.xAxis[0].setCategories(subcontext.attributeNames);
		
	}
			
	
}


/*
 * POLAR CHART
 */
var polarChart;
function createPolarChart(){
	polarChart = new Highcharts.Chart({
	            
	    chart: {
	        renderTo: 'polar-chart',
	        polar: true,
	        type: 'line'
	    },
	    
	    title: {
	        text: 'Budget vs spending',
	        x: -80
	    },
	    
	    pane: {
	    	size: '80%'
	    },
	    
	    xAxis: {
	        categories: ['Support', 'Stability', 'Probability', 'Separation'],
	        tickmarkPlacement: 'on',
	        lineWidth: 0
	    },
	        
	    yAxis: {
	        gridLineInterpolation: 'polygon',
	        lineWidth: 0,
	        min: 0
	    },
	    
	    tooltip: {
	    	shared: true,
	        valuePrefix: '$'
	    },
	    
	    legend: {
	        align: 'right',
	        verticalAlign: 'top',
	        y: 100,
	        layout: 'vertical'
	    },
	    
	    series: [{
	        name: 'Allocated Budget',
	        data: [43000, 19000, 60000, 35000],
	        pointPlacement: 'on'
	    }, {
	        name: 'Actual Spending',
	        data: [50000, 39000, 42000, 31000],
	        pointPlacement: 'on'
	    }]
	
	});
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
	
	if (typeof association_rules == 'undefined') return;
	
	
	a1 = [];
	a2 = [];
	for( i = 0; i < association_rules.length; i++) {
		a1.push(association_rules[i].id);
		a2.push(Math.round(association_rules[i].confidence*100)/100);
	}
	
	var new_height = 50 + (association_rules.length * 20);
	
	chart = new Highcharts.Chart({

		chart : {
			height: new_height,
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
						vis.selectAll("path").style("opacity", function(d) {
							if (d[0].ids.indexOf(event.point.category) >= 0) return .99;
							else return .1;
							
							//return d[4].id == event.point.category ? .99 : .1;
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
 * Drawing options
 */

function disableDrawingOptionsForAR(disable){
	$("#select-color").prop("disabled", disable);
	$("#select-edge").prop("disabled", disable);
	$("#select-size").prop("disabled", disable);
	$("#select-label").prop("disabled", disable);
}


// Edges
var edge_type = "default";

function getEdgeThickness(e){
	if (edge_type == 'default') return DEFAULT_EDGE_THICKNESS;
	else { 
		var metricValue = metrics.getLinkScore(e.source.id, e.target.id, edge_type)
		return Math.round(metricValue*(EDGE_MAX_THICK-EDGE_MIN_THICK)) + EDGE_MIN_THICK;
	}
}

function getEdgeValue(e){
	if (edge_type == 'default') return -1;
	else { 
		var metricValue = metrics.getLinkScore(e.source.id, e.target.id, edge_type)
		return Math.round(metricValue*100)/100;
	}
}

function changeEdgeThickness(type){
	edge_type = type;
	
	if (noLinks.indexOf(type) >= 0) return; // TODO show error msg?
	else updateVis();
}




/*
 * Node drawing options
 * */
var color_type = "default";


function changeNodeSize(type){
	size_type = type;
	
	updateVis(); 	// this is necessary because some layout
					// strategies rely on the size of the node
	
}

function getNodeSize(d){ 
	
	if (size_type == 'default') return DEFAULT_NODE_RADIUS;
	else { 
		var metricValue = metrics.getScore(d.id,size_type)
		return Math.round(metricValue*(NODE_MAX_SIZE-NODE_MIN_SIZE)) + NODE_MIN_SIZE;
		}
	
}


function changeNodeColor(type){
	color_type = type;
	
	vis.selectAll(".concept").style("fill", function(d) { // TODO
		return getNodeColor(d);
	});
	
	// size_type = type;
	// if (currentVis=='treemap') {
		// console.log("changin");
		// tm_updateTree(getTree0);
	// }
	// else { 
		// vis.selectAll("circle").attr("r", function(d) { // TODO
			// return getNodeSize(d);
		// });
	// }
}

function getNodeColor(d) {
	if (color_type == 'ids') return mapColor(d.id);
	else if (color_type == 'cluster') {
		
		var p=d3.scale.category10();
		p.domain();
		// console.log(p(0));
		// console.log(p(1));
		// console.log(p(2));
		
		var metricValue = metrics.getScore(d.id,color_type)
		console.log(metricValue + "-" + p(metricValue));
		
		//return(p(metricValue+i));
		
		//return d3.scale.category20c()(metricValue*13);
		return mapColor(""+metricValue*13);
	}
	else return DEFAULT_FILL_COLOR;
}



/*
 * Colors
 */

/*
 * Map a string to a color (used to color nodes based on their id)
 */
function mapColor(str) {
		
		var hash = 0;
	    for (var i = 0; i < str.length; i++) {
	       hash = str.charCodeAt(i)+ ((hash << 20) - hash);
	    }
	    
	    // hash_str = 
	    // for (var i = 0; i < str.length; i++) {
	       // hash = str.charCodeAt(i) + ((hash << 5) - hash);
	    // }
	
		// var colorstr = ((hash>>16)&0xFF).toString(16) + 
	           // ((hash>>8)&0xFF).toString(16) + 
	           // (hash&0xFF).toString(16);
	// 
		// return "#"+colorstr;
		
		var colorss= ["#3182bd","#6baed6","#9ecae1","#c6dbef","#e6550d","#fd8d3c","#fdae6b","#fdd0a2","#31a354","#74c476","#a1d99b","#c7e9c0","#756bb1","#9e9ac8","#bcbddc","#dadaeb","#636363","#969696","#bdbdbd","#d9d9d9"];
		//var colorss=["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22"];
		
		var pos = (Math.abs(hash)%(colorss.length));
		
		return  colorss[pos]; 
		
}

/*
 * LABELS
 */
var displayAttrLabel, displayObjLabel = true;
	
function get_upper_label(d){
	
	if (!displayAttrLabel) return '';
	
	if (labeling_type == LABEL_REPETITIVE) return d.intent; // repetitive
	else if (labeling_type == LABEL_MULTILABEL) return d.upperLabel; // multilabel
	else return d.upperLabel;
}
function get_lower_label(d){
	
	if (!displayObjLabel) return '';
	
	if (labeling_type == LABEL_REPETITIVE) return d.extent;
	else if (labeling_type == LABEL_MULTILABEL) return d.lowerLabel; // multilabel
	else {  // metric
		
		var metricValue = metrics.getScore(d.id,labeling_type)
		
		if (labeling_type == "esupport") // slightly different label for support
			return Math.round(100*metricValue) + "% (" + Math.round(context.objects.length*metricValue) + ")" ;
		else
			return Math.round(100*metricValue) + "%";
	}
}

function changeLabel(type){
	labeling_type = type;
	
	if (labeling_type == LABEL_REPETITIVE || labeling_type == LABEL_MULTILABEL) labelizeData();
	
	updateVis();
}




function labelize(){ // TODO work on data not on layout
	alert("active");
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


function labelizeFirst(){ 
	
	//if (labeling_type != LABEL_MULTILABEL) return; // not multi label
	
	//var top_concept = vis.select('circle[id="'+ data.top_id +'"]');
	var nodelist = getTopMostConcepts();
	
	// intent labels
	for (var i=0; i < nodelist.length; i++) {
		var cur = nodelist[i];
		
		var parentlist =  getParentsData(cur);
		
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
		var childrenList = getChildrenData(cur);
		
		ArrayAddAll(childrenList, nodelist);
		
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

function labelizeData(){ 
	
	//if (labeling_type != LABEL_MULTILABEL) return; // not multi label
	
	//var top_concept = vis.select('circle[id="'+ data.top_id +'"]');
	var nodelist = getTopMostConcepts();
	
	// intent labels
	for (var i=0; i < nodelist.length; i++) {
		var cur = nodelist[i];
		
		var parentlist = ((typeof lattice.original_id != 'undefined') ? getTreeParentsData(cur) : getParentsData(cur));
		
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
		var childrenList = ((typeof lattice.original_id != 'undefined') ? getTreeChildrenData(cur) : getChildrenData(cur));
		
		ArrayAddAll(childrenList, nodelist);
		
	}
	
	
	if ($("input[name='label-for-attr']").is(':checked')) {
	
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
			
			var extLabel;
			if (curExtent.length > 5) { 
				var more = curExtent.length-5;
				extLabel = curExtent.join("\n") + "\n("+more+" more)";
			} else  extLabel = curExtent.join("\n");
			
			cur.lowerLabel = extLabel;
			ArrayAddAll(getParentsData(cur), nodelist);
		}
	}
	//updateVis();
	
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
    	
    	labelizeData();
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
		
		labelizeData();
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
		var renderTo = $('<div class="chartFilter"><span> '+rawAttrs[i]+' </span><div id="chart_'+i+'" />').appendTo("#filters_container");
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
	$('<span id="'+ sname +'" rel="tooltip" data-trigger="hover" data-placement="top" data-title="'+attrNames.join(", ")+'">' +
	 ' | attributes sel. <a href="#" class="remove-filter"><img src="'+STATIC_URL+'/images/remove.gif"></a></span>').appendTo("#showFiltersPanel");
	
	attrFilterCt++;
	
	labelizeData();
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
	$('<span id="'+ sname +'" rel="tooltip" data-trigger="hover" data-placement="top" data-title="'+objNames.join(", ")+'">' +
	 ' | objects sel. <a href="#" class="remove-filter"><img src="'+STATIC_URL+'/images/remove.gif"></a></span>').appendTo("#showFiltersPanel");
	
	objFilterCt++;
	
	labelize2();
    //updateLattice();
    updateVis();
	
	
}




// Attribute lattices
function loadAttributeLattices(data){
	
	var i = 0;
	for (var attr in context.attributeNames) {
		
		var lid = "minilattice_" + i++;
		var renderTo = $('<div class="chartFilter"><span> '+attr+' </span><div id="'+lid+'" />').appendTo("#graph_container");
		
		createMiniLattice(data[attr].nodes, data[attr].links, lid);
		
	}
	
}





/*
 * Initial parameters
 */

 
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
	
	
	if (typeof n_concepts != 'undefined') {
		var reduction = 1-(lattice.edges.length/n_links);
		
		// Tree buttom
		 $('#tree-opts').popover({
			title: 'Tree stats',
			placement: "bottom",
			html: true,
			trigger: "hover",
			content: 'Concepts (source): '+n_concepts+' <br/> Links (source): '+n_links+
			' <br/><br/> Concepts (tree): '+lattice.concepts.length+ ' <br/> Links (tree): '+lattice.edges.length+
			 '<br/><br/> Reduction: '+ Math.round(reduction*100)/100+ '%'
		});
	}
	
	// load autosuggest for attributes
	$("input.search").tokenInput(getAttributeValuesPairs(),{
              propertyToSearch: "name",
              preventDuplicates: false,
              hintText:"Type an attribute name",
              theme: "facebook",
              onAdd: searchInput,
              onDelete: searchInput
              });
    
    // load clustering slider
    $( "#slider-clustering" ).slider({
			min: 1,
			max: lattice.concepts.length,
			value: [ lattice.concepts.length ],
			slide: function( event, ui ) {
				$( "#n_clusters" ).val( ui.value);
				
			}
		});
	$( "#n_clusters" ).val( lattice.concepts.length);
	
	
	if (typeof lattice.original_id != "undefined") { 
		$("#tree-opts").show(); 
		$("a.undo-link").show();
	}
	
	
	hoverbox = d3.select("#hoverbox");
	A_rules_box = d3.select("#A_rules_box");
	
	labelizeFirst();
	
	checkLatticeConstraints();
	
    
    displayAttrLabel = $("input[name='label-for-attr']").is(':checked');
	displayObjLabel = $("input[name='label-for-attr']").is(':checked');
    labelizeData();

    
    // lists
    updateEntityList();
    
    // Facets
   // createFacets();
	
	// Filters
	loadFilters();
	
	// Dashboard
	loadDashboard();
	
	// $('a.lattice-json-link').attr("href", "/api/v1/lattice/?id="+lattice_id);
	// $('a.ar-json-link').attr("href", "/api/v1/association_rules/?lattice_id="+lattice_id);
	
	$('text[text-anchor="end"]').remove();
	
	// Attribute lattices
    if (data.attribute_lattices)
    	loadAttributeLattices(JSON.parse(data.attribute_lattices));
    
    // Attribute graph
    if (lattice.attr_graph)
    	loadAttributeGraph(lattice.attr_graph);
	
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
	
	this.attr_graph = JSON.parse(data.attribute_graph);
	
	this.concepts = data.nodes;
	this.edges = data.links
	
	this.id = data.id;
	
	this.original_id = data.original_id;
	
	
	this.getConcept = function(tid){
		for (var i=0; i < this.concepts.length; i++) {
		  if (this.concepts[i].id == tid) 
		  	return this.concepts[i];
		};
	};
	this.getConceptById = function(tid){
		for (var i=0; i < this.concepts.length; i++) {
		  if (this.concepts[i].id == tid) 
		  	return this.concepts[i];
		};
	};
	
	this.getEdge = function(concept1, concept2){
		for (var i=0; i < this.edges.length; i++) {
		  if ((this.edges[i].source.id == concept1.id && this.edges[i].target.id == concept2.id) ||
		    (this.edges[i].target.id == concept1.id && this.edges[i].source.id == concept2.id)) 
		  	return this.edges[i];
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
	 
	 this.resetLattice = function(){
	 	concepts = initialConcepts.slice(0);
	 	edges = initialEdges.slice(0);
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
	 };
	 
	 
	 this.removeConcept = function(concept){
	 	for (var idx=0; idx < lattice.concepts.length; idx++) {
		   var curCpt = lattice.concepts[idx];
		   if (curCpt.id == concept.id) { // found
		   	
			   	lattice.concepts.splice(idx,1); // remove concept
		 		
		 		// remove links to the concept
		 		for (var i=0; i < lattice.edges.length; i++) { 
				   var curEdge = lattice.edges[i];
				   if (curEdge.target.id == concept.id || curEdge.source.id == concept.id ) { 
				   		lattice.edges.splice(i,1);
				   		i = i -1;
				   	}
				   		//edgesMarkedForRemoval.push(i);
				 };
				 
				 // for (var j=0; j < edgesMarkedForRemoval.length; j++) {
				  	// lattice.edges.splice(edgesMarkedForRemoval[j],1); // BUG
				 // };
		   	
		   	return;
		   }
	 	}
	 };
	 
	 this.existsEdge = function(source_id, target_id) {
	 	for (var i=0; i < lattice.edges.length; i++) {
		   if (lattice.edges[i].source.id == source_id && lattice.edges[i].target.id == target_id) return true;
		 };
		return false;
	 };
	 
	 this.readdConcept = function(concept){
	 	var curCpt = lattice.getConceptById(concept.id);
	 	if (typeof curCpt == 'undefined') {
	 		lattice.concepts.push(concept);
	 		// readd links
	 		for (var i=0; i < lattice.initialEdges.length; i++) { 
				   var curEdge = lattice.initialEdges[i];
				   if (curEdge.target.id == concept.id && !lattice.existsEdge(curEdge.source.id,curEdge.target.id)) {
				   		 lattice.edges.push(curEdge);
				   } else if (curEdge.source.id == concept.id && !lattice.existsEdge(curEdge.source.id,curEdge.target.id)) {
				   		 lattice.edges.push(curEdge);
				   }
			};
	 		
	 	} // else it was already there
	 };
	 
	 
	 
	 /**
	  * Cluster
	  */
	 
	 /**
	  * Tree transform
	  */
	 this.treeCache =  new Array();
	 this.getTree = function() {
		var top = getTopMostConcepts()[0];
		
		function copyNode(node) {
			var treeNode = new Object();
			treeNode.id = node.id;
			treeNode.name = node.intent.join(", ");
			//node.name;
			treeNode.lowerLabel = node.lowerLabel;
			treeNode.upperLabel = node.upperLabel;
			treeNode.support = node.support;
			treeNode.intent = node.intent;
			treeNode.extent = node.extent;
			treeNode.depth = 0;//node.depth;
			//treeNode.children_ids = node.children_ids;
			//treeNode.title = node.name;
			treeNode.children = [];
			
			if (lattice.treeCache.indexOf(treeNode)<0)
					lattice.treeCache.push(treeNode); // cache
			
			return treeNode;
		}
	
		function recurse(node) {
			if(node.children_ids.length == 0)
				return null;
			
			var treeNode = copyNode(node)
	
			var children = getChildrenData(node);
			//getChildrenDataNodes(node.children_ids)
	
			for(var i = 0; i < children.length; i++) {
	
				if(children[i].children_ids.length > 0) {
					var chNode = recurse(children[i]);
				} else { 
					var chNode = copyNode(children[i])
				}
				chNode.depth = treeNode.depth + 1; // update depths for tree
				//chNode.id = node.id + "-" + chNode.id; // current node id = node_id-parent_id to avoid duplicates
				treeNode.children.push(chNode);
				
			};
	
			return treeNode;

		}
	
		var topNode = recurse(top);
		return topNode;

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






/*
 * Ends lattice layout drawing
 */

// 
// 
// function filterNodes(query){
// 
    // // remove links that are connected to descendants
    // link.filter(function(d) {
      // for (d = d.source; d; d = d.parent) {
        // if (d === p) return true;
      // }
    // }).remove();
// 
    // // remove all descendants
    // node.filter(function(d) {
      // while (d = d.parent) {
        // if (d === p) return true;
      // }
    // }).remove();
// }
// 
// 
// 
// // clear 'hidden' styles (used e.g. for clear previous selections)
// function showNodes() {
	// vis.selectAll(".opaque").classed("opaque", false);
// }
// 
// 
// function hideNodes(nodelist){
// 	
	// //var inverseNodes = ArraySubtract(vis.selectAll("circle"), nodelist);
// 	
	// for (var i=0; i < nodelist.length; i++) {
		// var anode = nodelist[i];
		// //anode.style("opacity", DEFAULT_OPACITY);
		// //anode.style("fill", DEFAULT_FILL_COLOR);
		// anode.classed("selected", false);
		// anode.classed("opaque", true);
// 		
// 		
		// getIncomingEdges(anode, function(){
			// //d3.select(this).style("opacity", DEFAULT_OPACITY);
			// var thisInEdge = d3.select(this);
			// thisInEdge.classed("selected",false);
			// thisInEdge.classed("opaque",true);
// 			
		// });
		// getOutgoingEdges(anode, function(){
			// //d3.select(this).style("opacity", DEFAULT_OPACITY);
			// //d3.select(this).classed("hidden");
			// var thisOutEdge = d3.select(this);
			// thisOutEdge.classed("opaque",false);
			// thisOutEdge.classed("selected",true);
		// });
	// }
// }
// 
// function highlightNodes(nodelist, color) {
	// for (var i=0; i < nodelist.length; i++) {
	  // var anode = nodelist[i];
		// //anode.style("opacity", 1); // TODO preferir trocar classes css
		// //anode.style("fill", SELECTED_FILL_COLOR);
		// anode.classed("selected", true);
		// anode.classed("opaque", false);
// 		
// 		
		 // getIncomingEdges(anode, function(){
			 // //d3.select(this).style("opacity", 1);
			// var thisInEdge = d3.select(this);
			// thisInEdge.classed("opaque",false);
			// thisInEdge.classed("selected",true);
		 // });
		 // getOutgoingEdges(anode, function(){
			// // d3.select(this).style("opacity", 1);
			// var thisOutEdge = d3.select(this);
			// thisOutEdge.classed("opaque",false);
			// thisOutEdge.classed("selected",true);
		 // });
	// };
// }






/*
 * Check 
 */

function checkLatticeConstraints(){
	
	if (typeof lattice.original_id != 'undefined') { // it was already transformed in tree, display the viusalisation
    		changeVis("sunburst");
    		return;
    }
	//else
	
	if (OVERWHELMING && (context.attributes.length > MAX_ENTITY_SIZE || context.objects.length > MAX_ENTITY_SIZE)) {
		
		if (confirm("Labeling concepts in this lattice may be overwhelming, do you want to switch to a suitable tree visualisation?")) {
			$('#modal-tree-transform').modal({ // option to transform tree
					keyboard: true,
					show: true
			});
			return;
		} else {
			setOverwhelmingOff(); // disable the message to not annoy the user every time
		}
		
	}
	
	$('#select-vis').val(PREF_VIS);
	changeVis(PREF_VIS);
		
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


/*
 * Utils
 */

function visitEdges(node, callback) {
	for (var i=0; i < get.length; i++) {
	  get[i]
	};
}	
	

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

function visitEdgesDown(n, mycallback) {
	var outEdges = getOutgoingEdgesData(n);
	
	for (var i=0; i < outEdges.length; i++) {
	  mycallback(outEdges[i]);
	  visitEdgesDown(outEdges[i].target,mycallback);
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
function getOutgoingEdgesData(n, eachCallback){
	var outEdges = [];
	
	for (var i=0; i <lattice.edges.length; i++) {
	  var curLink = lattice.edges[i]; 
	  if (curLink.source.id == n.id) { 
	  	outEdges.push(curLink)
	  	if (typeof(eachCallback)!='undefined') eachCallback(curLink);
	  };
	};
	
	return outEdges;
}




function getIncomingEdges(n, eachCallback){
	alert("avoid it. cubix.lattice.js line 668");
	var inEdges = [];
	inEdges = vis.selectAll('line[target_id="'+ n.attr("id") +'"]');
	if (typeof(eachCallback)!='undefined') {
		inEdges.each(eachCallback);
	}
	return inEdges;
}

function getOutgoingEdges(n, eachCallback){
	alert("avoid it. cubix.lattice.js line 678");
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

// TODO
function getTreeParentsData(nd){
	
		for (var i=0; i < lattice.treeCache.length; i++) {
			var children = lattice.treeCache[i].children;
			
			if (children == null) continue;
		  	
		  	for (var j=0; j < children.length; j++) {
		  		if (children[j].id == nd.id) return [lattice.treeCache[i]] 
		  	}
		  	
		};
		return [];
}

function getParentsData(nd){
		var parents = [];
		for (var i=0; i < lattice.concepts.length; i++) {
		  if(nd.parents_ids.indexOf(lattice.concepts[i].id) >= 0){
		  	parents.push(lattice.concepts[i]);
		  }
		};
		return parents;
}
function getTreeChildrenData(nd){
		for (var i=0; i < lattice.treeCache.length; i++) {
		  	if (lattice.treeCache[i].id == nd.id) return lattice.treeCache[i].children;
		};
		return [];
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

/*
 * Tree lattice
 */

isParentOf = function(p, c) {
	  if (p === c) return true;
	  if (p.children) {
	    return p.children.some(function(d) {
	      return isParentOf(d, c);
	    });
	  }
	  return false;
	}




var followScroll = true;			// visualisation follows scroll

// visualisations options for lattice
var latticeVisOpts = [
	{ 
		name: "Hasse diagram",
		val: "dagre",
		tooltip: "A layered graph diagram"
	}, 
	// { 
		// name: "Force Directed graph",
		// val: "lattice",
		// tooltip: "A Hasse diagram with dynamic arrangement"
	// }, 
	
	{ 
		name: "Matrix",
		val: "matrix",
		tooltip: "matrix"
	}, 
	{ 
		name: "Sankey",
		val: "sankey",
		tooltip: "Snakey"
	},
	{ 
		name: "Tree",
		val: "tree",
		tooltip: "A concept in a tree has only one parent and no edges crossings"
	}, 
	// { 
		// name: "Treemap",
		// val: "treemap",
		// tooltip: "A treemap subdivides area into rectangles each of them is sized according to some metric"
	// }, 
	{ 
		name: "Sunburst",
		val: "sunburst",
		tooltip: "A radial tree-like layout where the root node is at the center, with leaves on the circumference"
	}, 
	{ 
		name: "iCicle",
		val: "icicle",
		tooltip: "Similar to sunburst but not radial"
	}
	
];

// visualisations for association rules
var ARVisOpts = [
	{ 
		name: "Matrix",
		val: "matrixview",
		tooltip: "Association rules interdependence"
	}, 
	{ 
		name: "Radial diagram",
		val: "radiagram",
		tooltip: "Association rules interdependence"
	} 
	// { 
		// name: "Grouped circles",
		// val: "gg_ar_plot",
		// tooltip: "Grouped graph of association rules"
	// }, 
];


// size and color options 
// when a metric is calculated the corresponding option becomes available
var sizeOpts = [
	{ 
		name: "Default",
		val: "default",
		tooltip: "Default option"
	}
];

var colorOpts = [
	{ 
		name: "Default",
		val: "default",
		tooltip: "Default option"
	},
	{ 
		name: "IDs",
		val: "ids",
		tooltip: "Assign colors according to node id, making easier to identify the same concept across the visualisations"
	}
	
];


var LabelOpts = [
	{ 
		name: "Multi-label",
		val: "multi-label",
		tooltip: "Labels are not repeated down in the hierarchy"
	},
	{ 
		name: "Repetitive",
		val: "repetitive",
		tooltip: "Labels are repeated for each node"
	}
];

var edgeOpts = [
	{ 
		name: "Default",
		val: "default",
		tooltip: "Default edge"
	}
];


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
	 	
	 	if (!followScroll) return;
	 	
	 	// association rules
	 	if (currentVis == "matrixview" /*|| currentVis == "radiagram" || currentVis == "gg_ar_plot" */) {
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
    
    /**
	 * TOOLTIPS
	 */
	
	// $('option.explain').tooltip({
		// title: 'data-tooltip',
		// placement: "right",
		// delay: 600
	// });
	$('body').tooltip({
    	selector: '[rel=tooltip]',
    	delay: { show: 300, hide: 100 }
	});

	// $('li.explain').tooltip({
		// title: 'data-tooltip',
		// placement: "right",
		// delay: 800
	// });
	// $('span.explain').tooltip({
		// live: true,
		// title: 'data-tooltip',
		// placement: "top",
		// offset: 10,
		// delay: 600
	// });
	
	
	
 	
 	
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
	 

	
	
		// Lattice / AR toggle
	$("input:radio[name='toggle']").change(function(){
		if($(this).val() == "rules") {
			
			$('#dashboard_lattice').hide();
			
			$('#dashboard_ar').show();
			
			d3.select("#chart").html("");
			
			fetchAssociationRules(initARView);
			currentVis="matrixview";
			buildOptionsForSelect(ARVisOpts, "select-vis", "matrixview");
			disableDrawingOptionsForAR(true);
		
		} else { // lattice
			$('#dashboard_ar').hide();
			$('#toolbar').show();
			$('#dashboard_lattice').show();
			changeVis('dagre'); // TODO back to the previous selected vis
			buildOptionsForSelect(latticeVisOpts, "select-vis", "matrix");
			disableDrawingOptionsForAR(false);
		}
		
	});
	
	
	
	// TOOLBAR - VISUALISATIONS
	buildOptionsForSelect(latticeVisOpts, "select-vis", "dagre");
	
	// EDGES OPTIONS
	buildOptionsForSelect(edgeOpts,"select-edge", "default");
	
	// TOOLBAR COLOR AND SIZE OPTIONS
	buildOptionsForSelect(sizeOpts,"select-size", "default");
	buildOptionsForSelect(colorOpts,"select-color", "default");
	
	// LABEL OPTIONS
	buildOptionsForSelect(LabelOpts,"select-label", "multi-label");

	// TOOLBAR - METRICS   
	metrics.addLinkListener(addLinkMetricComponentsCallback);
 	metrics.addListener(addMetricComponentsCallback);
	metrics.addListener(appendMetricFilterCallback);
	
	
	// TOOLBAR - drawing
	$("input[name='label-for-attr']").change(function(){
		displayAttrLabel = $(this).is(':checked');
		updateVis();
	});
	$("input[name='label-for-obj']").change(function(){
		displayObjLabel = $(this).is(':checked');
		updateVis();
	});
	
	
	$( "#select-label" ).change(function(){
		changeLabel($(this).attr('value'));
	});
	
	$( "#select-edge" ).change(function(){
		changeEdgeThickness($(this).attr('value'));
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
	
	
	$( "input[name='highlight_path']" ).change( function(){
		highlightPath = $(this).is(':checked');
	});
 
 	// $( ".tree-transform" ).click(function(){
// 		
	// });
 
 
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
		$( "#slider-zoom" ).slider({
			value:100,
			min: 10,
			max: 500,
			step: 10,
			slide: function( event, ui ) {
				
				zoomInOut(ui.value);
				
				//$( "#zoom_level" ).val( ui.value + "%");
				//redraw();
				//inflateDiv(ui.value);
			}
		});
		
		$( "#zoom_level" ).val( "100%");	
		$( "#zoom_level" ).click( function(){
			resetZoom();
		});	
	
		// $( "#slider-layout" ).slider({
			// value:2,
			// min: 1,
			// max: 2,
			// step: 1,
			// slide: function( event, ui ) {
// 				
				// var layout_txt = "";
// 				
				// if(ui.value == 1) {
					// layout_txt = "Viewer";
				// } else if(ui.value == 2) {
					// layout_txt = "Dashboard"; // explorer
				// } else if(ui.value == 3) {
					// layout_txt = "Dashboard";
				// }
				// $( "#layout_type" ).val( layout_txt);
// 				
				// inflateDiv(ui.value);
// 				
			// }
		// });
		//$( "#layout_type" ).val( "Dashboard");
		
		
		$( "a.collapse-dashboard" ).click(function(){
			inflateDiv(1); // viewer
			$("#expand-dashboard").show();
		}); 
		
		$( "a.expand-dashboard" ).click(function(){
			inflateDiv(2); // viewer
			$("#expand-dashboard").hide();
		}); 
		
		
		
		
			
		
		
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
				
				setTimeout(function(){
					if(!mouseOverHoverBox){
						// hide hoverbox
						hoverbox.transition()
				  		.duration(200)
				  		//.delay(1800)
			      		.style("opacity", 0)
			      		.style("display", "none");
					};
					
				}, 1800);
				
		      		
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
		 
		
		
		
		 
		 // link clear selection
		 $("a.clear-sel").click(function(){
		 	clearSelection();
		 });
		 
		  // link clear selection
		 $("a.reset-filters").click(function(){
		 	resetFilters();
		 });
		
		
		
		// DASHBOARD
		// row (dashboard)
		$(".draw-chart-1a").click(function(){
			createHorizontalBarChart("box1a-chart", $("#control_1").selectedPairsArray(), $("#control_2").selectedPairsArray());
		 });
		 
    	
    	initDashboard();
		 
		
		
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
		
		followScroll = false;
		
		w = MAXIMIZED_WIDTH;
		h = MAXIMIZED_HEIGHT;//$("#chart").height();
		
		redrawCurVis();
		
		// var aspect = w/h;
		// var chart = $("#chart");
		// chart.attr("width", 1040);
		// chart.attr("height", 1040 / aspect);



	} else {
		
		followScroll = true;
		
		w = DEFAULT_WIDTH;
		h = $("#chart").height();
		
		redrawCurVis();
		
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



function searchInput(elem) {
	//var xs = $("input.search");
	//alert();

	var res = $("#search").tokenInput("get");
	//$("#search").val();
	var query = '';
	
	for (var i=0; i < res.length; i++) { // TODO fix that
	  query += res[i].name + ','
	};
	

	//alert(query);

	// if(isBlank(query)) {// if search string is empty, invalidate previous searchs
		// showNodes();
		// vis.selectAll(".selected").classed("selected", false);
		// return;
	// }

	searchConcept(query);
	//var selections = searchFacet(query, true); // TODO passar data e nao nodes
	//var nodes = selections[0];

	// add results to the selection
	//addOrReplaceToSelectionList(selections[0], true); // TODO passar data?

	// highlight selected nodes (also in case they were hidden by previous selections)
	//highlightNodes(selections[0]);

	// hide other nodes
	//hideNodes(selections[1]);
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
	   $option = $('<option value="' + options[i].val + '" rel="tooltip"  data-trigger="hover" data-placement="right" data-title="'+options[i].tooltip+'">' + options[i].name + '</option>');
        if (options[i].val == defaultVal) {
            $option.attr('selected', 'selected');
        }
        $select.append($option);
	  
	};
    
}

function appendOptionForSelect(name, val, tooltip, selectId) {
    
    var $option = $('<option value="' + val + '" rel="tooltip"  data-trigger="hover" data-placement="right" data-title="'+tooltip+'">' + name + '</option>');
    
    $('#'+selectId).append($option);
	  
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


/**
 * Filter by Metric
 */

function addMetricComponentsCallback(metric, metricHumanName, scores){
	
	var tooltip= "Nodes are drawn according to this metric value";
	
	if (metric == "cluster") {
		appendOptionForSelect(metricHumanName, metric, tooltip, "select-color");
	} else { 
		appendOptionForSelect(metricHumanName, metric, tooltip, "select-label");
		appendOptionForSelect(metricHumanName, metric, tooltip, "select-size");
	}
}

function addLinkMetricComponentsCallback(metric, metricHumanName, scores){
	
	var tooltip= "Edge thickness are drawn according to this metric value";
	
	appendOptionForSelect(metricHumanName, metric, tooltip, "select-edge");
}

function appendMetricFilterCallback(metric, metricHumanName, scores){
	
	if (metric == "cluster") return;
	
	var label = $('<label for="'+metric+'" style="text-align: left; ">'+metricHumanName+':</label>');
	var input = $('<input type="text" id="'+metric+'-value" class="metric-value" name="'+metricHumanName+'"  />');
	var sliderMetric = $('<div id="slider-'+metric+'" class="slider"></div>');
	
	
	var containermetric = $("<div></div>");
	
	$(containermetric).append(label);
	$(containermetric).append(input);
	$(containermetric).append(sliderMetric);
	
	$("#metric-filter-content").append(containermetric);
	
	if (metric == 'esupport') { // range selection for support
			$( "#slider-"+metric ).slider({
			range: true,
			min: 0,
			max: 100,
			values: [ 0, 100 ],
			slide: function( event, ui ) {
				$( "#"+metric+"-value" ).val( ui.values[ 0 ] + "% - " + ui.values[ 1 ] + '%' );
				filterConceptsByMetric(metric, ui.values[ 0 ], ui.values[ 1 ]);
			}
		});
	
		
	} else { 
		$( "#slider-"+metric).slider({
				min: 0,
				max: 100,
				value: [ 0 ],
				slide: function( event, ui ) {
					$( "#"+metric+"-value" ).val( ui.value + "%");
					filterConceptsByMetric(metric, ui.value, null);
				}
		});
	}
	
}





/*
 * Utils
 */

// Hoverbox

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
 * Add metrics to the hover box
 */
function wrapperMetricsinTable(containerId, metric_values) { 
	$("#"+containerId).html("");
	
	var table = $('<table></table>');
	var table = $('<table></table>');
	var table = $('<table></table>');
	
	var content = "<table><tr><th>Metric</th><th>Value</th></tr>";
	
	for(var metricName in metric_values){
	    content += '<tr><td>' + metrics.getHumanName(metricName) + '</td><td>' + Math.round(metric_values[metricName]*100) + '%</td></tr>';
	}
	content += "</table>"
	
	$("#"+containerId).append(content);
}


function showHoverbox(d){
	mouseOverHoverBox= true;
	
	// show hoverbox
		hoverbox.style("display", "block");
		//hoverbox.style("opacity", 1);
		hoverbox.transition()
		  .delay(800)
	      .duration(300)
	      .style("opacity", 1);
	      
	    
	    hoverbox
	      .style("left", (d3.event.pageX + 20) + "px")
	      .style("top", (d3.event.pageY - 20) + "px");
	     
	    $(".attr-count-concept").text(d.intent.length);
	    $(".obj-count-concept").text(d.extent.length);
	    
	    
		wrapperElementsInList($('ul.hb_attr_list'), d.intent)
		wrapperElementsInList($('ul.hb_obj_list'), d.extent)
		
		wrapperMetricsinTable("metrics-table", metrics.getScores(d.id));
		
}


function hideHoverbox(){
	
	mouseOverHoverBox= false;
	
	setTimeout(function(){
		if(!mouseOverHoverBox){
			// hide hoverbox
			hoverbox.transition()
	  		.duration(200)
	  		//.delay(1800)
      		.style("opacity", 0)
      		.style("display", "none");
		};
		
	}, 1800);
}



/*
 * Node mouse events 
 * 
 */
function nodeMouseOver(d){
		
	showHoverbox(d);
	
	// Dashboard
	updateDistributionChart(d);
	
}

function nodeMouseOut(d){
	
	hideHoverbox();
	
}



var selection = [];
function nodeClick(d){ // select node	
	
	clearSearch(); // if I made a click node to add/remove selection, the search is no longer valid
	
	// update selection if not there
	var idx = selection.indexOf(d);
	if (idx < 0) selection.push(d);
	else selection.splice(idx, 1);
	
	$("#sel-count").text("("+selection.length+")"); // update counter
	
	
	// update polar chart
	radarChart.updateSeries(selection);
	
	
	// update selection list
	 var exists = $('li#sel-'+d.id);
      if (exists.length) {
      	exists.remove();
      } else {
      	var li = $('<li id="sel-'+d.id+'">').appendTo('#selection_list');
      	li.html("Attributes: <span>"+d.intent.join(', ') + "</span><BR/> Objects: <span>"+d.extent.join(', ')+"</span>")
      }
      
      // select class
      d3.select("#node-"+d.id).classed("selected", !(exists.length));
	
	
}





$(function() {
	// TODO load metrics
	
	
	// calculate metric
	 $("input[name='metric']").change(function(){
	   calculate($(this).val());
	 });
	 
	 
	 	 // metric clustering
	 $(".clustering-ok").click(function(){
	 	//$(".modal").hide();
	 	calculate("cluster",$("#n_clusters").val() );
	 });
});


function calculate(metric, p){
	if (typeof lattice.id == "undefined" || lattice.id == null) { // no lattice id
		flashAlert("The current concept lattice is not saved in the server - could not compute metric.","error");
		return;
	}
	if (typeof metric_stability != "undefined") {// already fetched metric, return..
		//callback();
		return;
	}
	//showLoading();
	if (metric == "cluster") showLoading();
	else $("input[name='metric'][value='"+metric+"']").parent().append("<img name='"+metric+"' src='"+STATIC_URL+"/images/loading-trans.gif'/>"); 
	
	var thetoken = $('input[name=csrfmiddlewaretoken]').val();
	var arlink = "/api/v1/metrics/";
	
	var params = { lattice_id: lattice.id, metric: metric, csrfmiddlewaretoken:  thetoken};
	if (p) {
		params["param"] = p;
	}
	
	$.getJSON(arlink, params, function(data) {
	 		
	 		// That's asynchronous!
	 			// disable the checkbox
	 			
	 			if (metric == "cluster") { 
	 				hideLoading();
	 				data["human_name"] = "Cluster";
	 			}
	 			else {
		 			$("img[name='"+metric+"']").remove();
		 			$("input[name='metric'][value='"+metric+"']").prop('disabled', true);
	 			}
	 			
	 			if (data.link_score) 
	 				metrics.appendLinkMetric(data.name, data.human_name, data.scores);
	 			else
	 				metrics.appendMetricValues(data.name, data.human_name, data.scores);
	 			
	});
	
}


var metrics = new function() { // hashmap do filter (with excluded nodes from origin) : {"bird:yes", [n1, n2,..]}
    var metricTable = {}; // {"conceptId": {"metric1" : value, "metric2": value2}}
    var metricDict = {};
    var metricListeners = [];
    
    // link
    var linkMetrics = {}; // {"confidence": { "concept1" : { "concept 2": value, "concept 3 ": value} }}
    var linkListeners = [];
    
    
    this.addListener = function(callback){
    	metricListeners.push(callback);
    }
    
    this.addLinkListener = function(callback){
    	linkListeners.push(callback);
    }
    
    this.appendLinkMetric = function(metric, metricHumanName, scores){ // to provide direct access to the concepts
    	
    	var scoresMap = {};
    	for (var id12 in scores) {
    	 var split = id12.split("-");
    	 var id2 = split[1];
    	 if (typeof scoresMap[split[0]]== "undefined") scoresMap[split[0]] = {};
    	 
		 scoresMap[split[0]][id2] = scores[id12];
		};
    	
    	
    	linkMetrics[metric] = {"humanName": metricHumanName, "scores": scoresMap};
    	
    	// dispatch 
		for (var i=0; i < linkListeners.length; i++) {
		  linkListeners[i](metric,metricHumanName,scores);
		};
    }
    
    
	this.appendMetricValues = function(metric, metricHumanName, scores){ // to provide direct access to the concepts
		
		// append to the dictionary
		metricDict[metric] = metricHumanName;
		
		
		// create table concept|metricX -> valX
		for (var conceptId in scores) {
		  if (!(conceptId in metricTable)) metricTable[conceptId] = {};
		  metricTable[conceptId][metric] = scores[conceptId];
		};
		
		// dispatch 
		for (var i=0; i < metricListeners.length; i++) {
		  metricListeners[i](metric,metricHumanName,scores);
		};
	}
	
	this.getCalculatedMetrics = function(){
		var mNames = [];
		var randomid= Object.keys(metricTable)[0];
		
		for (metric in metricTable[randomid]) {
			mNames.push(metric);
		}
		
		return mNames;
	}
	
	this.getScore = function(conceptId, metricName){ // 'intent' , true (ira calcular a partir dos nos que estao la e nao no contexto)
		return metricTable[conceptId][metricName];
	}
	
	this.getScores = function(conceptId) {
		var ret = {};
		var calcMetrics = this.getCalculatedMetrics();
		for (var i=0; i < calcMetrics.length; i++) {
		  var metricName = calcMetrics[i];
		  ret[metricName] = this.getScore(conceptId, metricName);
		};
		return ret;
	}
	
	
	this.getLinkScore = function(conceptId1, conceptId2, metric) {
		return linkMetrics[metric]["scores"][conceptId1][conceptId2];
	}
	
	this.getHumanName=function(metricName) {
		return metricDict[metricName];
	}
}


function filterConceptsByMetric(metric, minValue, maxValue){
	
	$( "input.metric-value") // TODO  name
	
	for (var i=0; i < lattice.initialConcepts.length; i++) {
	  var cur = lattice.initialConcepts[i];
	  
	  if (maxValue != null) {
	  	 if ((metrics.getScore(cur.id, metric) < minValue/100) || (metrics.getScore(cur.id, metric) > maxValue/100)){ // hide
	  		lattice.removeConcept(cur);
		  } else { // show if it was removed
		  	lattice.readdConcept(cur);
		  }
	  } else if (metrics.getScore(cur.id, metric) < (minValue/100)){ // hide
	  		lattice.removeConcept(cur);
	  } else { // show if it was removed
	  		lattice.readdConcept(cur);
	  }
	  
	};
	
	updateVis();
	//updateVisualFilters(); // TODO
	
}



/*
 * Search
 */


function clearSearch(){ // show hidden nodes/edges from previous search
	if (selection.length > 0 && $('#search').val().length > 0)
		if (confirm("Selecting will discard your current search. Proceed?")) { 
			selection = []; // REMOVES CURRENT SELECTION
			$('#search').val('');
	}
	// showNodes();
}

function clearSelection(){ // remove selection
	clearSearch();
	vis.selectAll(".selected").classed("selected", false);
	$('#selection_list').empty();
	
}

		
// returns a two element array: first is the found nodes, the other its complement (which may be used for hiding nodes later)
// perfomance reasons (only one iteraction)
function searchConcept(facetsString) { // facetsString : "facet1,facet2" 

	var keywords = facetsString.split(",");
	keywords.splice(keywords.length-1,1);
	
	// if (selection.length > 0 && facetsString.length == 0)
		// if (confirm("searching will discard your current selection. Proceed?"))
			// selection = []; // REMOVES CURRENT SELECTION
		// else return;

	removeWhiteSpaces(facetsString);

	for (var i=0; i < lattice.concepts.length; i++) {
		
		var curConcept = lattice.concepts[i];
		
		if (curConcept.extent.length != 0) { // exclude bottom node
			
		
		  	if (ArrayContainsAll(curConcept.intent,keywords)) { // FOUND
		  		
		  		// update selection if not there
				var idx = selection.indexOf(curConcept);
				if (idx < 0) selection.push(curConcept);
		  		
		  		// update selection list
				 var exists = $('li#sel-'+curConcept.id);
			      if (exists.length) {
			      	exists.remove();
			      } else {
			      	var li = $('<li id="sel-'+curConcept.id+'">').appendTo('#selection_list');
			      	li.html("Attributes: <span>"+curConcept.intent.join(', ') + "</span><BR/> Objects: <span>"+curConcept.extent.join(', ')+"</span>")
			      }
		  		
		  		 // select class
     			 d3.select("#node-"+curConcept.id).classed("selected", true);
		  		
		  	} else  { // NOT FOUND
		  		// select class
		  		var idx = selection.indexOf(curConcept); // remove from the selection
				if (idx >= 0) selection.splice(idx, 1);
				
				
		  		d3.select("#node-"+curConcept.id).classed("selected", false);
     			 // var te = d3.select(curConcept);
//      			 
     			 // te.classed("selected", false);

		  	}
		}
	  
	  
	};
	
	
	$("#sel-count").text("("+selection.length+")"); // update counter
	
	// update polar chart
	radarChart.updateSeries(selection);
}

var queryResults;
var colTypes = {};//"objects":[], "attributes":[], "attribute_values":[]


$(function() {
		// disable export context button
		$("input.load-context").prop('disabled', true);
		$('ul.nav > li.active').removeClass("active");
		$('li#semantics').addClass("active");
		
		$('.sel-col-type').live('click',function(e){
			var coltype = (e.target.name).split("_col-");
			
			colTypes[coltype[0]] = coltype[1];
			
			$('i[name="'+coltype[0]+'-selected"]').remove();
			$(e.target).append("<i name=\""+coltype[0]+"-selected\" class=\"icon-ok\"></i>");
		});

// SEMANTICS
	    $('a.sparql-search').click(function(){
	     	var sp = $('textarea#search_prefix').val();
	     	var sq = $('textarea#search_query').val();
			var thetoken = $('input[name=csrfmiddlewaretoken]').val();
			
			$('div#sparql_result').empty();
			showLoading();
			
			
		     $.get('/semantics/search',{ format:"json", search_prefix: sp, search_query: sq, csrfmiddlewaretoken:  thetoken}, function(data) {
			 
			// var content = (typeof data.error == "undefined") ? data.toString() : data.error;
			  
			  queryResults = data;
			  
			  hideLoading();
			  // allows context export
			  $("input.load-context").prop('disabled', false);
			  $("input.load-context").removeClass('disabled');

			
			if (typeof data.error == "undefined") { 
			
				var table = $("<table class=\"table table-striped\"></table>");
				var tHeader = $("<tr></tr>");
				for(var i = 0; i < data.head.vars.length; i++) {
					var headel = data.head.vars[i];
					tHeader.append("<th>"+ getOptionsHeader(headel) +"</th>");
				}
				
				table.append(tHeader.appendTo("<thead></thead>"));
			
				for(var i = 0; i < data.results.bindings.length; i++)  {
					var tRow = $("<tr></tr>");
					var binding = data.results.bindings[i];
					for(var j = 0; j < data.head.vars.length; j++) {
						var varName = data.head.vars[j];
						var valLabel = binding[varName].value; 
						if (valLabel.indexOf("#") != -1) valLabel = valLabel.split("#")[1];
						
						tRow.append("<td>"+ valLabel +"</td>");
					}
					
					table.append(tRow);
				}
				
				table.appendTo("div#sparql_result");
				
			} else {
				$('div#sparql_result').html(data.error);
			}
			
			});
		});
        
});



function getOptionsHeader(label){
	  var dropDown =  " <ul class=\"nav nav-tabs\"> "+
    	" <li class=\"dropdown\"> " +
    	"<a class=\"dropdown-toggle\" data-toggle=\"dropdown\" href=\"#\">  "+label+ " <b class=\"caret\"></b> </a>"+
    	"<ul class=\"dropdown-menu\">"+
   		" <a href=\"#\" name=\""+label+ "_col-obj\" class=\"sel-col-type \">Object</a>"+
   		" <a href=\"#\" name=\""+label+ "_col-attr\" class=\"sel-col-type \"> Attribute name</a>"+
   		" <a href=\"#\" name=\""+label+ "_col-attrval\" class=\"sel-col-type \"> Attribute value</a>"+
    	"</ul>"+
    	"</li>"+
    	"</ul>"
    	
    	return dropDown;
}


function prepareForSubmission(){
	
	var json_text = JSON.stringify(queryResults, null, 2);
	var colTypesJson = JSON.stringify(colTypes, null, 2);

	$('input[name=col_types]').val(colTypesJson);
	$('input[name=results_table]').val(json_text);
	
	return true;
}
function flatten(root) {
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
 *  This class contains LATTICE visualisation algorithms
 */


var dagreVis = new function() {
	
	
	this.config = {
		displayLabels : true,
		nodePadding : 10,
		widthLabelBox : 60,
		paddingToNode : 12
	
	};

	this.run = function(){
		
		d3.select("#chart").html("");
		
	  	vis = d3.select("#chart")
		  .append("svg:svg")
		    .attr("width", w)
		    .attr("height", h)
		    .attr("viewBox", "0 0 "+w+" "+h)
	    	.attr("preserveAspectRatio", "xMidYMid")
		    //.attr("pointer-events", "all")
		  .append('svg:g')
		    //.call(d3.behavior.zoom().on("zoom", redraw));
		    
		//vis.append('svg:g');
		
		
		/// not used:
		
		// vis.append('svg:rect')
		    // .attr('width', w)
		    // .attr('height', h)
		    // .attr('fill', 'white');
// 		    
		    
		// reset edges info (e.g. in case of filtering)
		lattice.concepts.forEach(function(d) {
			d.edges = [];
		});
		
		// re add
		lattice.edges.forEach(function(d) {
	
			if( typeof d.source === "number") {
				d.source = lattice.concepts[d.source];
				d.target = lattice.concepts[d.target];
			}
			d.source.edges.push(d);
			d.target.edges.push(d);
		});
	
	
		var dedges = vis
		    .selectAll("path .dedge")
		    .data(lattice.edges)
		    .enter()
		      .append("path")
		      .attr("class", "dedge")
		      .style("stroke-width", getEdgeThickness)
		     .attr("source_id", function(d) { return d.source.id; })
		      .attr("target_id", function(d) { return d.target.id; });
		
		
		var dnodes = vis
		    .selectAll("circle .concept")
		    .data(lattice.concepts)
		    .enter()
		      .append("circle")
		      .attr("class", "concept node")
		      .style("fill", getNodeColor)
		      .attr("x", function(d) { return -10; })
				.attr("y", function(d) { return -10; })
				.attr("r", getNodeSize)
		      .attr("id", function(d) { return "node-" + d.id })
		      .on("click", this.nodeClick)
			  .on("mouseover", this.nodeMouseOver)
		      .on("mouseout", this.nodeMouseOut);
	       
	    	
	    	 //Append text
	  	// var upperLabelbox = vis
		    // .selectAll("g .ulabelgroup")
		    // .data(lattice.concepts)
		    // .enter()
		      // .append("svg:g") //d.pos.x, y: d.pos.y
		        // .attr("id", function(d) { return "labelbox-" + d.id })
			    // .attr("class", "ulabelgroup");
// 			    
		// upperLabelbox.append('rect')
			    // .attr("class", "labelbox")
			    // .attr("width", function(d) { return dagreVis.config.widthLabelBox; })
			    // .attr("height", function(d) { return 20; });
		// upperLabelbox.append("text") //d.pos.x, y: d.pos.y
		        // .attr("id", function(d) { return "intent-" + d.id })
			    // .attr("class", "intent")
			    // .attr("x", 4) // TODO verify the bbox.width of the text to position it
		    	// .attr("y", -dagreVis.config.paddingToNode)
		    	// .text(get_upper_label);
		    	
		    	
		// var lowerLabelbox = vis
		    // .selectAll("g .llabelgroup")
		    // .data(lattice.concepts)
		    // .enter()
		      // .append("svg:g") //d.pos.x, y: d.pos.y
		        // .attr("id", function(d) { return "labelbox-" + d.id })
			    // .attr("class", "llabelgroup");
// 			    
		// lowerLabelbox.append('rect')
			    // .attr("class", "labelbox")
			    // .attr("width", function(d) { return dagreVis.config.widthLabelBox; })
			    // .attr("height", function(d) { return 20; });
		// lowerLabelbox.append("text") //d.pos.x, y: d.pos.y
		        // .attr("id", function(d) { return "extent-" + d.id })
			    // .attr("class", "intent")
			    // .attr("x", 4) // TODO verify the bbox.width of the text to position it
		    	// .attr("y", dagreVis.config.paddingToNode)
		    	// .text(get_lower_label);
// 			    
	
	
		var upperLabelbox = vis
			    .selectAll("text .intent")
			    .data(lattice.concepts)
			    .enter()
			    .append('text')
		        .attr("id", function(d) { return "intent-" + d.id })
			    .attr("class", "intent")
			    .attr("x", 4) // TODO verify the bbox.width of the text to position it
		    	.attr("y", -dagreVis.config.paddingToNode)
		    	.text(get_upper_label);

		var lowerLabelbox = vis
			    .selectAll("text .extent")
			    .data(lattice.concepts)
			    .enter()
			    .append('text')
		        .attr("id", function(d) { return "extent-" + d.id })
			    .attr("class", "extent")
			    .attr("x", 4) // TODO verify the bbox.width of the text to position it
		    	.attr("y", dagreVis.config.paddingToNode)
		    	.text(get_lower_label);
		
		// lowerLabelbox
			    // .selectAll("tspan .extent")
			    // .data(d.extent)
			    // .enter()
			    // .append('tspan')
			    // .attr("class", "extent")
			    // //.attr("x", 4) // TODO verify the bbox.width of the text to position it
		    	// //.attr("y", dagreVis.config.paddingToNode);
		    	// .text(d);
	
	
	  // We need width and height for layout.
	  dnodes.each(function(d) { //labels.each
	    var bbox = this.getBBox();
	    d.bbox = bbox;
	    d.width = getNodeSize(d);//bbox.width + 2 * nodePadding;
	    d.height = getNodeSize(d);//bbox.height + 2 * nodePadding;
	  });
	
	
	  dagre.layout()
	  	.nodeSep(50)
	    .edgeSep(10)
	    .rankSep(80)
	    .invert(true)
	    .nodes(lattice.concepts)
	    .edges(lattice.edges)
	    .debugLevel(1)
	    .run();
	
	  dnodes.attr("transform", function(d) { return "translate(" + d.dagre.x + "," + d.dagre.y +")"; });
	  
	  
	  dedges
	    // Set the id. of the SVG element to have access to it later
	    .attr('id', function(e) { return "edge-"+e.dagre.id; })
	    .attr("d", function(e) { return dagreVis.spline(e); });
	    
	    
	 	upperLabelbox.attr("transform", function(d) { return "translate(" + (d.dagre.x-dagreVis.config.widthLabelBox/2) + "," +
	 	 														 (d.dagre.y-dagreVis.config.paddingToNode) +")"; });
	 	 					
	 	lowerLabelbox.attr("transform", function(d) { return "translate(" + (d.dagre.x-dagreVis.config.widthLabelBox/2) + "," +
	 	 														 (d.dagre.y+dagreVis.config.paddingToNode) +")"; });
	  
	
	  // Resize the SVG element
	  var svg = d3.select("#chart").select("svg");
	  var svgBBox = svg.node().getBBox();
	  
	  svg.attr("viewBox", "0 0 "+svgBBox.width+" "+h)
	  //svg.attr("width", 500 + 10);
	  //svg.attr("height", 400 + 10);
	  
	  // Drag handlers
	  var nodeDrag = d3.behavior.drag()
	    // Set the right origin (based on the Dagre layout or the current position)
	    .origin(function(d) { return d.pos ? {x: d.pos.x, y: d.pos.y} : {x: d.dagre.x, y: d.dagre.y}; })
	    .on('dragstart', function() {
	    	//console.log("drag started"); dragging = true;
	    	vis.on('mousedown.zoom', null);
	    	vis.on('mousemove.zoom', null);
	    	//vis.on('mousedown.zoom', null);
	    })
	    .on('dragend', function() {
	    	console.log("drag ended"); dragging = false;
	    })
	    .on('drag', function (d, i) {
	      var prevX = d.dagre.x,
	          prevY = d.dagre.y;
	
	      // The node must be inside the SVG area
	      d.dagre.x = Math.max(d.width / 2, Math.min(svgBBox.width - d.width / 2, d3.event.x));
	      d.dagre.y = Math.max(d.height / 2, Math.min(svgBBox.height - d.height / 2, d3.event.y));
	      d3.select(this).attr('transform', 'translate('+ d.dagre.x +','+ d.dagre.y +')');
	
	      var dx = d.dagre.x - prevX,
	          dy = d.dagre.y - prevY;
	
	      // Edges position (inside SVG area)
	      d.edges.forEach(function(e) {
	        dagreVis.translateEdge(e, dx, dy);
	        d3.select('#edge-'+ e.dagre.id).attr('d', dagreVis.spline(e));
	      });
	      
	      // TODO translate label groups if not lpos (ie. dragged)
	      d3.select("#intent-"+d.id).attr('transform', 'translate('+ (d.dagre.x-dagreVis.config.widthLabelBox/2) +','+
	       (d.dagre.y-dagreVis.config.paddingToNode) +')');
	      
	      d3.select("#extent-"+d.id).attr('transform', 'translate('+ (d.dagre.x-dagreVis.config.widthLabelBox/2) +','+
	       (d.dagre.y+dagreVis.config.paddingToNode) +')');
	       
	    });
	
	  // var edgeDrag = d3.behavior.drag()
	    // .on('drag', function (d, i) {
	      // dagreVis.translateEdge(d, d3.event.dx, d3.event.dy);
	      // d3.select(this).attr('d', dagreVis.spline(d));
	    // });
	    
	    
	    
	    var labelDrag = d3.behavior.drag()
	    			//.origin(function(d) { return d.lpos ? {x: d.lpos.x, y: d.lpos.y} : {x: d.dagre.x, y: d.dagre.y}; })
		          .on("dragstart", function(d) {
		            this.__originx__ = (d.lpos) ? d.lpos.x : d.dagre.x-dagreVis.config.widthLabelBox/2;
		            this.__originy__ = (d.lpos) ? d.lpos.y : d.dagre.y-dagreVis.config.paddingToNode ;
		          })
		          .on("drag", function(d) {
		          	
				
		            d.lpos = { x : Math.max(0, Math.min(this.__originx__ += d3.event.dx, w)),
		            			y : Math.max(0, Math.min(this.__originy__ += d3.event.dy, h))} ;
		            
		             d3.select(this).attr('transform', 'translate('+ d.lpos.x +','+ d.lpos.y +')');
		            
		          });
	
	  dnodes.call(nodeDrag);
	  //dedges.call(edgeDrag);
	  upperLabelbox.call(labelDrag);
  
	}
	
	
	this.move = function(){
	    this.parentNode.appendChild(this);
	    var dragTarget = d3.select(this);
	    dragTarget
	        .attr("cx", function(){return d3.event.dx + parseInt(dragTarget.attr("cx"))})
	        .attr("cy", function(){return d3.event.dy + parseInt(dragTarget.attr("cy"))});
	};
	

	this.spline = function(e) {
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
	this.translateEdge = function(e, dx, dy) {
	    e.dagre.points.forEach(function(p) {
	      p.x = Math.max(0, Math.min(800, p.x + dx));
	      p.y = Math.max(0, Math.min(600, p.y + dy));
	    });
	}
	
	
	
	
  	
  	/*
	 * Node mouse events 
	 * 
	 */
	this.nodeMouseOver = function(d){
		//var oi = d3.select(this).select("circle");
		d3.select(this).transition()
	            .duration(250)
		    .attr("r", function(d,i) { 
		    	return 2*getNodeSize(d);
		    	//if(d.id==focalNodeID) {return 65;} else {return 15;} 
		    	} );
		// d3.select(this).select("text").transition()
	            // .duration(250)
	    // .style("font", "bold 20px Arial")
	    // .attr("fill", "Blue");
		
		nodeMouseOver(d);
		
		d3.select(this).classed("hover", true);

		if (highlightPath) {
			visitEdgesDown(d,function(l) {
				d3.select("path.dedge[source_id=\""+l.source.id+"\"][target_id=\""+l.target.id+"\"]").classed("highlighted", true);
			});
		}
		
	}
	
	this.nodeMouseOut = function(d){
		
		d3.select(this).transition()
	            .duration(250)
		    .attr("r", function(d,i) { 
		    	return getNodeSize(d);
		    	//if(d.id==focalNodeID) {return 65;} else {return 15;} 
		    	} );
		
		nodeMouseOut(d);
		
		d3.select(this).classed("hover", false);
		
		d3.selectAll("path.dedge.highlighted").classed("highlighted", false);
	
	}
	
	
	this.nodeClick = function(d){ // select node	
		
		
		nodeClick(d);
		//d3.select(this).classed("selected", !nodeClick(d));
		
		
		
		
		// d3.select(this).classed("selected", function(){ 
			// if (this.classList.contains("selected")) {
				// return false;
			// } else {
				// return true
			// }
// 			
		// });
		
	}




}





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
	
	$.post("/fca/set_preferred_vis", {pref_vis : visType, csrfmiddlewaretoken:  thetoken}, function(data){});
	
}

function setOverwhelmingOff(){
	var thetoken = $('input[name=csrfmiddlewaretoken]').val(); // TODO move the fucking token to the header
	
	$.post("/fca/set_overwhelming_off", {csrfmiddlewaretoken:  thetoken}, function(data){});
	
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
		    	return "#000000";
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
      	.style("stroke",function(d){return "#000000";}) //color_set(d.family-1);})
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
	      .style('fill', function (d, i) { return mapColor(context.attributes[i]); })
	      .style('stroke', function (d, i) { return mapColor(context.attributes[i]); });
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
  	}
  	
  	
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



/*
 * Sunburst
 */


var sunburstVis = new function() {
	
	
	this.config = {
		// displayLabels : true,
		// nodePadding : 10,
		// widthLabelBox : 60,
		// paddingToNode : 30
	
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
		
		
		vis = d3.select("#chart").append("svg:svg")
		    .attr("width", w)
		    .attr("height", h)
		  .append("svg:g")
		    .attr("transform", "translate(" + w / 2 + "," + h / 2 + ")");
		    
		 partition = d3.layout.partition()
	     .sort(null)
	     //.size([2 * Math.PI, radius * radius])
	     .value(function(d) { return 1; });
		    

        var json = lattice.getTree();// lattice.concepts[0]; //  no need to transform :)
        
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
	 
	  		
	  sbLabel = vis.selectAll("text").data(sbnodes);
	  var textEnter = sbLabel.enter().append("svg:text")
	      .style("opacity", 1)
	      .style("fill", "#000")
	      .attr("text-anchor", function(d) {
	        return x(d.x + d.dx / 2) > Math.PI ? "end" : "start";
	      })
	      .attr("dy", ".2em")
	      .attr("transform", function(d) {
	        var multiline = (get_upper_label(d) || "").split(",").length > 1,
	            angle = x(d.x + d.dx / 2) * 180 / Math.PI - 90,
	            rotate = angle + (multiline ? -.5 : 0);
	        return "rotate(" + rotate + ")translate(" + (y(d.y) + p) + ","+(x(d.x))+")rotate(" + (angle > 90 ? -180 : 0) + ")";
	      })
	      .on("click", nodeClick)
	      .on("dblclick", sunburstVis.sbclick);
	  textEnter.append("svg:tspan")
	      .attr("x", 0)
	      .text(function(d) { 
	      	if (d.dx * 360 > MIN_ANGLE_FOR_LABELS)
	      	 return get_upper_label(d);
	      	else return '';
	      });
	  // textEnter.append("svg:tspan") // lower labels
	      // .attr("x", 0)
	      // .attr("dy", "1em")
	      // .text(function(d) { return get_lower_label(d) });		
		  
		
	}
	
	
	
	
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
	  }
	
	
	// function click(d) {
	    // path.transition()
	      // .duration(750)
	      // .attrTween("d", arcTween(d));
	  // }
	
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
	}

}