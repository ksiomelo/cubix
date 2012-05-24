

var association_rules;//= '[{"confidence": 0.4666666666666667, "conclusion_supp": 7, "premise_supp": 15, "premise": ["Gene-Bmp4"], "conclusion": ["Theiler_Stage-20"]}, {"confidence": 0.8666666666666667, "conclusion_supp": 13, "premise_supp": 15, "premise": ["Gene-Bmp4"], "conclusion": ["Strength-detected"]}, {"confidence": 0.7142857142857143, "conclusion_supp": 5, "premise_supp": 7, "premise": ["Theiler_Stage-20", "Gene-Bmp4"], "conclusion": ["Strength-detected"]}, {"confidence": 0.2857142857142857, "conclusion_supp": 2, "premise_supp": 7, "premise": ["Theiler_Stage-20", "Gene-Bmp4"], "conclusion": ["Strength-strong"]}, {"confidence": 0.38461538461538464, "conclusion_supp": 5, "premise_supp": 13, "premise": ["Gene-Bmp4", "Strength-detected"], "conclusion": ["Theiler_Stage-20"]}, {"confidence": 0.23076923076923078, "conclusion_supp": 3, "premise_supp": 13, "premise": ["Gene-Bmp4", "Strength-detected"], "conclusion": ["Theiler_Stage-18"]}, {"confidence": 0.38461538461538464, "conclusion_supp": 5, "premise_supp": 13, "premise": ["Gene-Bmp4", "Strength-detected"], "conclusion": ["Theiler_Stage-19"]}, {"confidence": 0.2, "conclusion_supp": 1, "premise_supp": 5, "premise": ["Theiler_Stage-20", "Gene-Bmp4", "Strength-detected"], "conclusion": ["Tissue-footplate"]}, {"confidence": 0.2, "conclusion_supp": 1, "premise_supp": 5, "premise": ["Theiler_Stage-20", "Gene-Bmp4", "Strength-detected"], "conclusion": ["Tissue-handplate"]}, {"confidence": 0.4, "conclusion_supp": 2, "premise_supp": 5, "premise": ["Theiler_Stage-20", "Gene-Bmp4", "Strength-detected"], "conclusion": ["Tissue-epithelium"]}, {"confidence": 0.2, "conclusion_supp": 1, "premise_supp": 5, "premise": ["Theiler_Stage-20", "Gene-Bmp4", "Strength-detected"], "conclusion": ["Tissue-telencephalon"]}, {"confidence": 0.5, "conclusion_supp": 1, "premise_supp": 2, "premise": ["Theiler_Stage-20", "Gene-Bmp4", "Strength-strong"], "conclusion": ["Tissue-latero_nasal_process"]}, {"confidence": 0.5, "conclusion_supp": 1, "premise_supp": 2, "premise": ["Theiler_Stage-20", "Gene-Bmp4", "Strength-strong"], "conclusion": ["Tissue-medial_nasal_process"]}, {"confidence": 0.2, "conclusion_supp": 1, "premise_supp": 5, "premise": ["Theiler_Stage-20", "Gene-Bmp4", "Strength-detected"], "conclusion": ["Tissue-footplate"]}, {"confidence": 0.2, "conclusion_supp": 1, "premise_supp": 5, "premise": ["Theiler_Stage-20", "Gene-Bmp4", "Strength-detected"], "conclusion": ["Tissue-handplate"]}, {"confidence": 0.4, "conclusion_supp": 2, "premise_supp": 5, "premise": ["Theiler_Stage-20", "Gene-Bmp4", "Strength-detected"], "conclusion": ["Tissue-epithelium"]}, {"confidence": 0.2, "conclusion_supp": 1, "premise_supp": 5, "premise": ["Theiler_Stage-20", "Gene-Bmp4", "Strength-detected"], "conclusion": ["Tissue-telencephalon"]}, {"confidence": 0.3333333333333333, "conclusion_supp": 1, "premise_supp": 3, "premise": ["Gene-Bmp4", "Theiler_Stage-18", "Strength-detected"], "conclusion": ["Tissue-eye"]}, {"confidence": 0.3333333333333333, "conclusion_supp": 1, "premiseassociation_rulespp": 3, "premise": ["Gene-Bmp4", "Theiler_Stage-18", "Strength-detected"], "conclusion": ["Tissue-otocyst"]}, {"confidence": 0.3333333333333333, "conclusion_supp": 1, "premise_supp": 3, "premise": ["Gene-Bmp4", "Theiler_Stage-18", "Strength-detected"], "conclusion": ["Tissue-mandibular_component"]}, {"confidence": 0.2, "conclusion_supp": 1, "premise_supp": 5, "premise": ["Strength-detected", "Gene-Bmp4", "Theiler_Stage-19"], "conclusion": ["Tissue-apical_ectodermal_ridge"]}, {"confidence": 0.2, "conclusion_supp": 1, "premise_supp": 5, "premise": ["Strength-detected", "Gene-Bmp4", "Theiler_Stage-19"], "conclusion": ["Tissue-mesenchyme"]}, {"confidence": 0.4, "conclusion_supp": 2, "premise_supp": 5, "premise": ["Strength-detected", "Gene-Bmp4", "Theiler_Stage-19"], "conclusion": ["Tissue-inner_ear"]}, {"confidence": 0.2, "conclusion_supp": 1, "premise_supp": 5, "premise": ["Strength-detected", "Gene-Bmp4", "Theiler_Stage-19"], "conclusion": ["Tissue-embryo"]}, ]';
//var association_rules=eval('('+myjson_text+')');

function fetchAssociationRules(callback){
	
	if (typeof lattice_id == "undefined" || lattice_id == null) { // no lattice id
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
	 $.getJSON(arlink,{ lattice_id: lattice_id, csrfmiddlewaretoken:  thetoken}, function(data) {
	 		association_rules = data;
	 		hideLoading();
	 		if (typeof callback != 'undefined') callback();
	 		//myobject=eval('('+myjson_text+')');
			  // var content = (typeof data.error == "undefined") ? data.toString() : data.error;
			  // $('div#sparql_result').html(content);
			  //alert('Load was performed.');
	});
	
	
	// $.ajax({
    // type: "get", 
    // data: { lattice_id: lattice_id, csrfmiddlewaretoken:  thetoken},
    // url: arlink,
    // success: function (data, text) {
    	// alert("ok");
    // },
    // error: function (request, status, error) {
        // alert(request.responseText);
    // }
	// });

	
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
	
	var m = [0, 120, 20, 120]; // margins
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
	
	for (var i=0;i<association_rules.length;i++){
	matrix[i]=[];
	matrix[i]=d3.range(n).map(function(j){return {x:i, y:j, z:0}});
	}
	
	//fill matrix
	
	for (var i=0;i<association_rules.length;i++){
	
	for (var k=0;k<n;k++) {
	
	for (var j=0;j<association_rules[i].premise.length;j++)
		if (attr_list[k] ==association_rules[i].premise[j]){
			matrix[i][k].z=1;
			matrix[i][k].confidence=association_rules[i].confidence;
			matrix[i][k].premise_supp=association_rules[i].premise_supp;
			matrix[i][k].conclusion_supp=association_rules[i].conclusion_supp;
			matrix[i][k].premise=association_rules[i].premise;
			matrix[i][k].conclusion=association_rules[i].conclusion;
		}
	for (var j=0;j<association_rules[i].conclusion.length;j++)
		if (attr_list[k] ==association_rules[i].conclusion[j]){
			matrix[i][k].z=2;
			matrix[i][k].confidence=association_rules[i].confidence;
			matrix[i][k].premise_supp=association_rules[i].premise_supp;
			matrix[i][k].conclusion_supp=association_rules[i].conclusion_supp;
			matrix[i][k].premise=association_rules[i].premise;
			matrix[i][k].conclusion=association_rules[i].conclusion;
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
	
	for (var i=0;i<association_rules.length;i++) {
		ml=Math.max(ml,(association_rules[i].premise.toString().length))
	}
	
	m[1]=10+10*Math.log(association_rules.length)/Math.LN10;
	
	
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
      .attr("transform", function(d, i) {return "translate(0," + d[0].x*h/association_rules.length + ")"; })
      .each(row);


  row.append("line")
      .attr("x2", w)
      .attr("class","matrix_view_separator");


  row.append("text")
      .attr("x",0)
      .attr("dy", "1em")
      .attr("text-anchor", "end")
      .attr("class","label")
      .text(function(d, i) {return "R"+i.toString() /* association_rules[i].premise.toString(); */});

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
      .attr("transform", function(d, i) { return "translate(" + 10 + ",0)rotate(45)"; })
      .text(function(d, i) { return attr_list[i]; });

  function row(row) {
  
    var cell = d3.select(this).selectAll(".cell")
        .data(row.filter(function(d) { return d.z; }))
      .enter().append("rect")
        .attr("class", "cell")
        .attr("x", function(d) {return d.y*w/n; })
        .attr("width", w/n)
        .attr("height", h/association_rules.length)
        .style("fill-opacity", function(d) { return d.confidence; })
        .style("fill", function(d) {return c(d.z); })
        .on("mouseover", Matrix_View_MouseOver)
        .on("mouseout", Matrix_View_MouseOut);
     
  }

}


function Matrix_View_MouseOver(p){


d3.selectAll(".row text").classed("highlighted", function(d, i) { return i == p.x; });
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
      .style("top", (d3.event.pageY - 40) + "px");

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

//while(mouseOverHoverBox){}

//function(){ (mouseOverHoverBox) ? }
var thenode = d3.select(this);
thenode.style("stroke", "none");

// hide hoverbox
A_rules_box.transition()
.delay(800)
      .duration(200)
      .style("opacity", 0);
    
    A_rules_box.style("display", "none");
}