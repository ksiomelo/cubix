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

