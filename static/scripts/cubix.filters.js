

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
    
    
};

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
		return (lattice.concepts.indexOf(d.source) >= 0 && lattice.concepts.indexOf(d.target) >= 0);
	});
}

/**
 * AJAX function for filtering an attribute by re-adding/removing it from the context
 */
function filterAttributeAJAX(attrName, attrValue){
	
	var thetoken = $('input[name=csrfmiddlewaretoken]').val();
	var arlink = "/api/v1/context/filter";
	
	var params = { context_id: lattice.context_id, lattice_id: lattice.id, attr_name: attrName, attr_value: attrValue, csrfmiddlewaretoken:  thetoken};
	
	// loading img
	
	
	$.getJSON(arlink, params, function(data) {
	 		
	 		// reload visualisation, dashboard, filters, etc
	 		loadData(data, true);
	 			
	});
	
}


/*
 * function for filtering an attribute visually, i.e., 
 * does not change the context, only concerned concepts are hidden
 */
function filterAttributeLocal(sname, svalue) {
	
    
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
	   
	   	addFilterToFilterbar(sname, svalue);
	   
	   
		labelizeData();
	    //updateLattice();
	    updateVis();
}

function addFilterToFilterbar(sname, svalue){
	 
	    $("#"+sname +'-'+svalue).remove();
		$('<span id="'+ sname +'-'+svalue+'"> | '+sname+': '+svalue+' <a href="#" class="remove-filter"><img src="'+STATIC_URL+'/images/remove.gif"></a></span>').appendTo("#showFiltersPanel");
		
}


function clickFilterValue(){ //boolean atributes
  //alert(this.series.name + '|'+this.name +'|'+ this.y +'|'+ this.sliced+' | was last selected');
    
    var svalue = this.name;
    var sname = this.series.name;
    
    if (!this.sliced) { // this operation removes the filter given by sname and svalue
    	
    	removeFilter(sname,svalue);
    	
    } else {
    	
    	if (FILTER_CONTEXT) {
    		filterAttributeAJAX(sname, svalue);
    	}
    	else { 
    		filterAttributeLocal(sname, svalue);
    	}
    	
    }
}


/*
 *  Load filters in the filter bar
 */
function loadFilters(){
	
	
	// clear previous filters
	if (FILTER_CONTEXT)
		$("#filters_container").html("");
		
		
	// add filters to filter bar
	if (context.filtered_attributes.length > 0) {
		for (var i=0; i < context.filtered_attributes.length; i++) {
			
			var attr = context.filtered_attributes[i].split("-");
			//if ()
		  
		  	addFilterToFilterbar(attr[0], attr[1]);
		};
	}
	
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




