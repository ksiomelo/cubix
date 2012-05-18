


/*
 * Initialization
 */

var selectedConcepts = [];


$(function() {
 	
  	// Accordion
	$("#accordion").accordion({ header: "h3", autoHeight: false  });
   
 	
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
	//	$( "#support" ).val( $( "#slider-supp" ).slider( "values", 0 ) +
	//		"% - " + $( "#slider-supp" ).slider( "values", 1 ) + '%');
	
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
	
	// drawing
	$( "#select-label" ).change(function(){
		changeLabel(parseInt($(this).attr('value')));
	});
	
 	$( "#select-size" ).change(function(){
		changeNodeSize(parseInt($(this).attr('value')));
	});
	
	$( "#select-vis" ).change(function(){
		changeVis($(this).attr('value'));
	});
	
	$('option.explain').twipsy({
		title: 'data-tooltip',
		placement: "right",
		delayIn: 600
	});
	
	$('span.explain').twipsy({
		live: true,
		title: 'data-tooltip',
		placement: "above",
		offset: 10,
		delayIn: 600
	});
	
	$( "input[name='highlight_path']" ).change( function(){
		//changeNodeSize(parseInt($(this).attr('value')));
		highlightPath = $(this).is(':checked');
	});
 
 
	/*
	 * Filters and Search
	 */

	
	
	$(".filter-search").click(function(){
		filterSelected();
		$("input.search").tokenInput("clear"); // removes also string in search
	});
	
	$("a.remove-filter").live("click",function(){
		var pid = this.parentNode.id.split('-');
		if (pid.length > 1) removeFilter(pid[0],pid[1]);
		else removeFilter(pid[0]);
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
			value:1,
			min: 1,
			max: 3,
			step: 1,
			slide: function( event, ui ) {
				
				var layout_txt = "";
				
				if(ui.value == 1) {
					layout_txt = "Viewer";
				} else if(ui.value == 2) {
					layout_txt = "Explorer";
				} else if(ui.value == 3) {
					layout_txt = "Dashboard";
				}
				$( "#layout_type" ).val( layout_txt);
				
				inflateDiv(ui.value);
				
			}
		});
		
		$( "#layout_type" ).val( "Viewer");	
		
		
		// drawing
		//$("#control_1").multiSelect();
		
		
		
		
		// hover box
		$("#hoverbox").hover(
		  function () {
		  	mouseOverHoverBox = true;
		  }, 
		  function () {
			mouseOverHoverBox = false;
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
		 $("#showFiltersPanel").click(function(){
			 $("#thepanel").animate({marginLeft:"0px"}, 400 );
			 $("#filtersPanel").animate({height:"210px", opacity:1}, 400 );
			// $("#filtersPanel").show();
			 $("#showFiltersPanel").animate({height:"0px", opacity:0}, 600).hide("slow");
		 });
		 
		
		
		// calculate stability (test)
		 $("#calc-stab").change(function(){
			$.get("/lattice/compute",  { metric: "stability"}, function(data) {
		        alert(data);
		    });
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
		 
		$("#attr-y-1a").change(function() {
        	//alert($(this).val());
        	alert("oi4")
        	changeOptionsChart(".draw-chart-1a", $(this).val());
    	});
    	
		 
		// ADD		 
		 
		 
		
		
		// end dashboard
		
		$("a.cancel-upload").live("click",function(){
			$('#context').popover('hide');

		 });
		$("#context").click(function(){
			$('#context').popover('show');

		 });
		
		$('#context').popover({
			placement: "below",
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
	//var cnt = d3.select("#row1");
	
	if (layoutType == 1) $('#row1').slideUp('slow');
	else if (layoutType == 2) {
		$('#row1').slideDown('slow', function(){
			//createHorizontalBarChart("box1a-chart"); // TODO remove ?
			//getTimeLine();
		});
		
	   // d3.select("svg")
	      //.attr("viewBox", "0 0 600 600")
	    //  .attr("height", "1280")
	    //  .attr("preserveAspectRatio", "none"); 
   }  else if (layoutType == 3) {
   	 $("#column1").animate({width:"675px"}, 500 );
   //	 $('#column1').show("slide", { direction: "left" }, 500);//slideLeft('slow');
   }
   
}




/*
 * Search suggestion
 */
// function getAttributeValuesPairs(attr){ // eg output: ["mammal-yes", "size>30"]
	// var ret = [];
// 	
	// var values = data.attributes[attr];
	 // for (var j=0; j < values.length; j++) { 
	  // ret.push(attr+'-'+values[j][0]);
	 // };
// 	
// 	
	// return ret;
// }


// <optgroup label="Gene">
						// <option value="option_1">Bmp4</option>
						// <option value="option_1">Gast</option>
						// <option value="option_1">Lif</option>
						// <option value="option_2">Cxcr4</option>
						// <option value="option_2">Abo</option>
					// </optgroup>



function getAttributeValuesPairs(){ // TODO refatorar || eg output: [{name : "age->30", attrName: "age", valueName: ">30"}]// TODO colocar no context

		var ret = [];
		for (var attr in data.attributes) {
		  var valuesNumber = data.attributes[attr];
		  
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
      var objsNames = data.objects;
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


   
