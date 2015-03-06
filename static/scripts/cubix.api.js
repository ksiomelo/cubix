var cubixAPI = (function() {
  var privateVar = '';
  
  var bindEnvents = {"mouseover":[],
  					  "mouseclick": []} ;
  					  
  var customMetrics = [];

  function privateMethod () {
    // ...
  }

  return { 
  	/*
  	 * SVG Elements
  	 */
  	getSVGNode: function(concept) {
  		return d3.select("#node-"+concept.id);
  	},
  	
	/*
	 * Widgets
	 */
    addWidget: function (title, htmlbody) {
      // all private members are accesible here
      //console.log(WIDGET);
      //$("#dashboard_lattice").animate({paddingTop:"175px"}, 500 );
       
      var content = "<li class='widget color-silver' style='display: none'>"+
          "<div class='widget-head'>"+
               "<h3>"+title+"</h3>"+
                "</div>"+
                "<div class='edit-box' style='display:none'>"+
					"No config available for this chart."+
				"</div>"+
                "<div class='widget-content'>"+
					htmlbody+
                "</div>"+
           "</li>";
      
      $("#dashboard_lattice").prepend(content);
      
      iNettuts.makeSortable(); // TODO do it in batch (after all custom widgets are loaded)
      
      showLoading();
      
      setTimeout(function(){
      	
      	$(".widget").show(); // TODO seeks all widgets, should precise seletor
      	
      	hideLoading();
      	
      	flashAlert("The extension is loaded!", "info", 2000);
      

	  },1500);
      
      
      
      
    },
    /*
     * Metrics
     */
    addMetric: function(title, shortDescription, scoreFunction){
    	// OBS: metrics with same title will be replaced!
    	// TODO test metrics with same title
    	title.replace(/\W/g, ''); // remove non alphanumeric chars
    	shortDescription.replace(/\W/g, ''); // remove non alphanumeric chars
    	
    	customMetrics[title] = scoreFunction;
    	
    	var content = "<div style='display: inline'>"+
				"<input type='checkbox'  name='metric' style='margin-right: 10px' onchange='cubixAPI.computeMetric(\""+title+"\")'/>"+
				"<span rel='tooltip' data-trigger='hover' data-placement='right' data-title='"+shortDescription+"'>"+title+"</span>"+
			"</div>"+
			"<br/>";
			
			
		$("#customMetrics").append(content);
    },
    
    computeMetric: function(title) {
    	title.replace(/\W/g, '');
    	
    	if (title in customMetrics) {
    		var scores = [];
    		for (var i=0; i < lattice.concepts.length; i++) {
    			var curConcept = lattice.concepts[i];
			  	var score = customMetrics[title](curConcept);
			  	scores[curConcept.id] = score;
			};
			
			metrics.appendMetricValues(title, title, scores);
    		
    	}
    },
    
    /*
     * Events
     */
    bind: function (entity, eventType, callback) {
    	if (eventType == "mouseover" || eventType == "mouseclick") { // prevents invalid events
     		bindEnvents[eventType].push(callback);
    	}
    },
    
    dispatchEvents : function(eventType, object){
    	if (eventType == "mouseover" || eventType == "mouseclick"){
    		
    		for (var i=0; i < bindEnvents[eventType].length; i++) {
			  bindEnvents[eventType][i](object);
			};
    	}
    }
  };
})();