
$(function() {
	// TODO load metrics
	
	
	// calculate metric
	 $("input[name='metric']").change(function(){
	   calculate($(this).val());
	 });
});


function calculate(metric){
	if (typeof lattice.id == "undefined" || lattice.id == null) { // no lattice id
		flashAlert("The current concept lattice is not saved in the server - could not compute metric.","error");
		return;
	}
	if (typeof metric_stability != "undefined") {// already fetched metric, return..
		//callback();
		return;
	}
	//showLoading();
	$("input[name='metric'][value='"+metric+"']").parent().append("<img name='"+metric+"' src='"+STATIC_URL+"/images/loading-trans.gif'/>"); 
	
	var thetoken = $('input[name=csrfmiddlewaretoken]').val();
	var arlink = "/api/v1/metrics/";
	$.getJSON(arlink,{ lattice_id: lattice.id, metric: metric, csrfmiddlewaretoken:  thetoken}, function(data) {
	 		
	 		// That's asynchronous!
	 			// disable the checkbox
	 			$("img[name='"+metric+"']").remove();
	 			$("input[name='metric'][value='"+metric+"']").prop('disabled', true);
	 			
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



