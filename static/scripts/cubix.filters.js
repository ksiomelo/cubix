

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
	        obj.remAttrsVals = removedEntities[1];
	        //obj.excludedEdges = excludedEdges;
		   
		   this.history.push(obj);

    };
    
    this.removeFilter = function (attr, value) {
		var idx = this.indexOfFilter(attr, value);
		removeFilterAt(idx);
		
    };
    
    this.removeFilterAt = function (idx) {
    	
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
    		if (data.nodes.indexOf(remainingNodes[i]) < 0 ) // TODO review that - remove that
		  		data.nodes.push(remainingNodes[i]);
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
	data.nodes = _data_nodes.slice(0);
	data.links = _data_links.slice(0);
	data.attributes = HashClone(_data_attributes); // TODO necessary?
	data.objects = _data_objects.slice(0);
	
	
	updateEntityList();
	
	updateVisualFilters();
	
	
	updateVis();
}



function keepLinks(){
	
	data.links = _data_links.filter(function(d) { 
		//return (data.nodes.indexOf(d.source) < 0 || data.nodes.indexOf(d.target) < 0)
		return (data.nodes.indexOf(d.source) >= 0 && data.nodes.indexOf(d.target) >= 0)
	});
}



function clickFilterValue(){ //boolean aatributes
  //alert(this.series.name + '|'+this.name +'|'+ this.y +'|'+ this.sliced+' | was last selected');
    
    var svalue = this.name;
    var sname = this.series.name;
    
    if (!this.sliced) { // this operation removes the filter given by sname and svalue
    	
    	removeFilter(sname,svalue);
    	
    } else {
    
    	var removed = [];
	    // iterate over original data nodes
	    for (var i=0; i < _data_nodes.length; i++) { // this solution is preferreed over the next one because even if we need to iterate again to make the intersection with current filter,
	    												// this solution enables storing of affected nodes by a filter (and thus allowing user to remove filters non-sequentially later)
	      var d = _data_nodes[i];
	      
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
	    
	    
	    data.nodes = ArraySubtract(data.nodes, removed);
	    
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
	var rawAttrs = getKeys(data.attributes);
	
	for (var i=0; i < rawAttrs.length; i++) {
	  //var attribute = data.attributes[rawAttrs[i]];
	  
	  	var serie = [{
	  		animation: true,
			type: 'pie',
			name: rawAttrs[i],
			data: data.attributes[rawAttrs[i]]
		}];
		//data.attributes[rawAttrs[i]]
		var renderTo = $('<div class="chartFilter"><span> '+rawAttrs[i]+' </span><div id="chart_'+i+'" >').appendTo("#filters_container");
		visualFilters.push(createChart(rawAttrs[i], "chart_"+i, serie));	
	  
	}
}


// http://www.highcharts.com/ref/#plotOptions-pie--slicedOffset
function createChart(attrTitle, renderTo, theSeries){
		var chart = new Highcharts.Chart({
		chart: {
			renderTo: renderTo,//'container',
			backgroundColor: "#333",
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
	  
	  if (!(serie.name in data.attributes)) { // if there's not this attribute
	  	//visualFilters[i].options.chart.style.visibility = "visible";
	  	//visualFilters[i].redraw();
	  //	$("#highcharts-"+(i+1)).hide();
	  	document.getElementById("chart_"+i).style.opacity = 0;
	  	
	  	continue;
	  }
	  // else
	 // visualFilters[i].options.chart.style.visibility = "hidden";
		document.getElementById("chart_"+i).style.opacity = 1;
		
	  serie.setData(data.attributes[serie.name], true);
	  
	  
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

		var removed = ArraySubtract(data.nodes, selected);
		data.nodes = selected;//
		
	    
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
	for (var i=0; i < data.nodes.length; i++) {
		
		 if (data.nodes[i].extent.length == 0) { // remove bottom concept
	      	removed.push(data.nodes[i]);
	      	continue;
	      }
		
		
		if (! ArrayContainsAll(data.nodes[i].intent, attrNames)) {
			removed.push(data.nodes[i]);
		} 
	 // data.nodes[i].extent.contains()
	};	
	
	
	data.nodes = ArraySubtract(data.nodes, removed);
	    
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
	for (var i=0; i < data.nodes.length; i++) {
		
		
		if (data.nodes[i].intent.length == 0) { // remove top concept
	      	removed.push(data.nodes[i]);
	      	continue;
	      }
	      
	      
		if (! ArrayContainsAll(data.nodes[i].extent, objNames)) {
			removed.push(data.nodes[i]);
		} 
	 // data.nodes[i].extent.contains()
	};	
	
	
	data.nodes = ArraySubtract(data.nodes, removed);
	    
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
