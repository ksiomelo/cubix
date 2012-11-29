


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
	}, 
	
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
	}, 
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
	},
	
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




