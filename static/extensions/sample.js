;(function(){
	// CREATES A NEW WIDGET
	cubixAPI.addWidget("Custom widget", 
	"This lattice contains "+lattice.concepts.length+" concepts. <br><span id='mouse-info'></span>");
	
	// BINDS A MOUSE OVER EVENT TO THE CONCEPT LATTICE
	cubixAPI.bind("lattice", "mouseover", function(concept){
		$("#mouse-info").html("you are pointing to the concept: "+concept.intent.join(","));
	});
	// BINDS A MOUSE CLICK EVENT TO THE CONCEPT LATTICE
	cubixAPI.bind("lattice", "mouseclick", function(concept){
		$("#mouse-info").html("you clicked on the concept: "+concept.intent.join(","));
		
		cubixAPI.getSVGNode(concept).style("fill", "green"); // change default selection behavior
	});
	// ADDS A NEW METRIC
	cubixAPI.addMetric("Custom metric", "Ration between intent and extent",  function(concept){
		if (concept.extent.length == 0) return 0;
		return concept.intent.length / concept.extent.length;
	});
})();

