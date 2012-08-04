

function calculate(metric){
	if (metric == "stability") {
		calcStability();
	}
}


function calcStability(){
	if (typeof lattice_id == "undefined" || lattice_id == null) { // no lattice id
		flashAlert("error", "The current concept lattice is not saved in the server - could not compute metric.");
		return;
	}
	if (typeof metric_stability != "undefined") {// already fetched metric, return..
		//callback();
		return;
	}
	showLoading();
	
	var thetoken = $('input[name=csrfmiddlewaretoken]').val();
	var arlink = "/api/v1/metrics/";
	 $.getJSON(arlink,{ lattice_id: lattice_id, metric: "stability", csrfmiddlewaretoken:  thetoken}, function(data) {
	 		
	 		

	 		hideLoading();
	 		$("#calc-stab").attr("disabled", true);
	 		
	 		// That's asynchronous!
	 		if (typeof callback != 'undefined') 
	 		{
	 			
	 		};
	});
	
	
}


function calcSupport(intExt, useCurrentData){ // 'intent' , true (ira calcular a partir dos nos que estao la e nao no contexto)
	
	var total = 0;
	var n = 0;
	
	if (useCurrentData) {
		attrs = data.attributes.length; 
		objs = data.objects.length;
	} else {
		attrs = _data_attributes.length;
	}
	
	for (var i=0; i < data.nodes.length; i++) {
	  data.nodes[i];
	};
}
