/// elegant
    
    var removed = [];
    
    vis.selectAll("circle").each(function(d) {
    	
    	// bird : yes
    
    	if (d.intent.indexOf(sname) < 0) { // e.g. bird : yes 
    		if (svalue== 'yes') { 
    	    	removed.push(d);
    	    	data.nodes.splice(data.nodes.indexOf(d),1);
    	    }
    	} else if (svalue== 'no') { // e.g.  preying: no|yes ...
    		removed.push(d);
    	    data.nodes.splice(data.nodes.indexOf(d),1);
    			
    	} // e.g. else. dog : yes
    	
    });
    
    // filters history
    var spanId = sname;//+'-'+ this.name; (attribute name)
    
    filter.addFilter(sname, svalue, removed);
    
    // update filters labels
    
	
	$("#"+spanId).remove();
	$('<span id="'+ spanId +'"> | '+sname+': '+svalue+'</span>').appendTo("#showFiltersPanel");
    
    updateLattice();
    return;
    
    
    
	///////////// PRIMEIRA SOLUCAO
	    
    vis.selectAll("circle").filter(function(d) {
		return (d.intent.indexOf(sname) < 0);  
    }).remove(); 
    
    return;
    
    /////////////// SEGUNDA SOLUCAO
    
    var searchFor = '';
    	
	//boolean context
	if (this.name == "yes" || this.name == "no") {
		searchFor = this.series.name;
	} else { // mv TODO
		// ?? this.series.name + ':'+this.name ????
		searchFor = this.series.name + ':'+this.name;
	}
	
	
	var nodeList = searchFacet(searchFor); //TODO inverse (caso seja no)
	
	for (var i=0; i < nodeList[1].length; i++) {
	  nodeList[1][i].remove();
	};
	// remove
	//nodeList[1].remove();
    
    
    // this.color = "#000000";
    // this.options["color"] = "#000000";	
    // this.series.options["color"] = "#000000";