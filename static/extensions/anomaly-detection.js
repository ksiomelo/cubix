;(function(){
	
	
	
	
	// ADDS A NEW METRIC
	cubixAPI.addMetric("Outlier Computation", "Seeks for outliers in concepts",  function(concept){
		if (concept.extent.length == 0) return 0;
		return concept.intent.length / concept.extent.length;
	});
	
	
	// ADDS A NEW METRIC
	cubixAPI.addMetric("Nearest Neighborhood", "Identify the closest concepts",  function(concept){
		if (concept.extent.length == 0) return 0;
		return concept.intent.length / concept.extent.length;
	});
	
	
	// CREATES A NEW WIDGET
	cubixAPI.addWidget("Outlier Detection", 
	"<div id='thegraph'></div>");
	
	
	var sdata = [];
	
	var tseries = [];
	
	for (var i=0; i < context.attributes.length; i++) {
	  
	  var attrName = context.attributes[i];
	  
	  var ct = context.getCountForAttribute(attrName);
	  
	  var sobject = {};
	  sobject.name = attrName;
	  //sobject.color = 'rgba(223, 83, 83, .5)';
	  
	  sobject.data = [[ct, ct]];
	  tseries.push(sobject);
	  
	};
	
	console.log(tseries);
	
	var setGraph = function(seriesData, mouseOverCallback){
		//new Highcharts.Chart
		var ch = new Highcharts.Chart({
		//$('#thegraph').highcharts({
            chart: {
            	renderTo: 'thegraph',
                type: 'scatter',
                zoomType: 'xy'
            },
            title: {
                text: 'Support per Attribute'
            },
            // subtitle: {
                // text: 'Source: Heinz  2003'
            // },
            xAxis: {
                title: {
                    enabled: true,
                    text: 'Support'
                },
                startOnTick: true,
                endOnTick: true,
                showLastLabel: true
            },
            yAxis: {
                title: {
                    text: 'Support'
                }
            },
            legend: {
                layout: 'vertical',
                align: 'left',
                verticalAlign: 'top',
                x: 100,
                y: 70,
                floating: true,
                backgroundColor: '#FFFFFF',
                borderWidth: 1
            },
            plotOptions: {
                scatter: {
                	point: {
                		events: {
                			mouseOver: mouseOverCallback
                		}
                	},
                    marker: {
                        radius: 5,
                        states: {
                            hover: {
                                enabled: true,
                                lineColor: 'rgb(100,100,100)'
                            }
                        }
                    },
                    states: {
                        hover: {
                            marker: {
                                enabled: false
                            }
                        }
                    },
                    tooltip: {
                        headerFormat: '<b>{series.name}</b><br>',
                        pointFormat: '{point.x} supp, {point.y} supp'
                    }
                }
            },
            series: seriesData
        });
		
	};
	
	// callback function for the mouseover
	var mOverCallback = function(){
		//alert(this.series.name);
		var attrName= this.series.name;
		
		for (var i=0; i < lattice.concepts.length; i++) {
		 	var curConcept = lattice.concepts[i];
		 	if (curConcept.intent.indexOf(attrName) >= 0) {
		 		cubixAPI.getSVGNode(curConcept).style("stroke", "green");
		 	} else {
		 		cubixAPI.getSVGNode(curConcept).style("stroke", "white");
		 	}
		};
		
	};
	
	// Sets graph into the widget
	setGraph(tseries, mOverCallback);
	
	
})();

