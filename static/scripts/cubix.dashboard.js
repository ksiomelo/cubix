Highcharts.theme = { colors: ['#4572A7'] };// prevent errors in default theme
var highchartsOptions = Highcharts.getOptions(); 

//Radial view rules list
var prevIndex=-1;

function removeWatermarks(){
	$('text[text-anchor="end"]').remove();
}

function initDashboard(){
	createDistributionChart();
	//createPolarChart();
}

function loadDashboard(){
	multiSelectOptionsForAttributes("#control_1");
	multiSelectOptionsForAttributes("#control_2");
	
	$("#control_1, #control_2").multiSelect(); // this line must be placed after the items to the option are loaded
	
	
	updateDistributionChart(lattice.topConcept); // shows the distribution chart for the top node initially
	
}
function multiSelectOptionsForAttributes(multiSelectControlId){
	
	var $el = $(multiSelectControlId);
	$el.empty(); // remove old options
	$el.append($("<option></option>"));
	
	$.each(context.attributeNames, function(key,value) {
	  
	  var optGrp = $("<optgroup label='"+key+"'></optgroup>");
	  $el.append(optGrp);
	  
	  	for (var i=0; i< value.length; i++) {
	  		
	  		$("<option label='"+value[i][0]+"' value='"+key+SEPARATOR+value[i][0]+"'>"+value[i][0]+"</option>").appendTo(optGrp)
	  			//.attr("value", item.name).text(item.valueName));
	  	}
	     
	});
}


/**
 * horizontal bar chart
 */

// TODO input: co-occorrence , objects, 

var chart;

function createHorizontalBarChart(renderTo, attrVals1, attrVals2){
	
	
	chart  = new Highcharts.Chart({
      chart: {
         renderTo: renderTo,
         defaultSeriesType: 'bar'
      },
      title: {
         text: 'Attribute Co-occurrence'
      },
      subtitle: {
         text: ''
      },
      xAxis: {
         categories: attrVals1,
         title: {
            text: null
         }
      },
      yAxis: {
         min: 0,
         title: {
            text: 'Objects',
            align: 'high'
         }
      },
      tooltip: {
         formatter: function() {
            return ''+
                this.series.name +': '+ this.y +' objects';
         }
      },
      plotOptions: {
         bar: {
            dataLabels: {
               enabled: true
            }
         }
      },
      legend: {
         layout: 'vertical',
         align: 'right',
         verticalAlign: 'top',
        // x: -100,
        // y: 100,
         floating: true,
         borderWidth: 1,
         backgroundColor: Highcharts.theme.legendBackgroundColor || '#FFFFFF',
         shadow: true
      },
      credits: {
         enabled: false
      },
     series: getStackedBarSeries(attrVals1, attrVals2)
   });
   
   
}

// input ["attr-val"] x ["attr-val"]
// TODO param: x-axis : co-occurence, objects,etc
function getStackedBarSeries(items1, items2){
	
	var series = [];
	
	for (var i=0; i < items2.length; i++) {
		
		var seriesObj = new Object();
	  	seriesObj.name = items2[i];
	  	seriesObj.data = [];
		
		for (var j=0; j < items1.length; j++) {
	  		var intersection = context.intersection(items1[j], items2[i])
	  		seriesObj.data.push(intersection.length);
	 	}
	 	series.push(seriesObj);
	 	
	};
	
	return series;
	
}



/*
 * Creates a generic vertical bar chart	
 */
var distributionChart;
function createVerticalBarChart(renderTo, title, thecategories, thedata){
	distributionChart = new Highcharts.Chart({
		chart: {
			renderTo: renderTo,
			type: 'column',
			margin: [ 50, 50, 100, 80]
		},
		title: {
			text: title
		},
		xAxis: {
			categories: thecategories,
			labels: {
				rotation: -45,
				align: 'right',
				style: {
					font: 'normal 13px Verdana, sans-serif'
				}
			}
		},
		yAxis: {
			min: 0,
			title: {
				text: 'Objects'
			}
		},
		legend: {
			enabled: false
		},
		tooltip: {
			formatter: function() {
				return '<b>'+ this.x +' : '+ this.y+ ' objects</b><br/>';
			}
		},
			series: [{
			name: 'Attributes',
			data: thedata,
			dataLabels: {
				enabled: true,
				rotation: -90,
				color: '#FFFFFF',
				align: 'right',
				x: -3,
				y: 10,
				formatter: function() {
					return this.y;
				},
				style: {
					font: 'normal 13px Verdana, sans-serif'
				}
			}
		}]
	});
}


/*
 * DISTRIBUTION CHART
 */

function createDistributionChart(){
	
	createVerticalBarChart("distribution-chart", "Distribution", [], []);
}

function updateDistributionChart(d){
			if (typeof d == "undefined")
				return;
	
			var sumData = [];
			
			var subcontext = context.getSubcontextForExtent(d.extent, false);
			for (var j=0; j < subcontext.attributes.length; j++) {
				var sum = 0;
				
				for (var k=0; k < subcontext.objects.length; k++) {
			  		if (subcontext.rel[k][j] == true) sum++;
			 	}
			 	sumData.push(sum);
			};
			
			distributionChart.series[0].setData(sumData);
			distributionChart.xAxis[0].setCategories(subcontext.attributeNames);
			//distributionChart.redraw();
	
}


/*
 * POLAR CHART
 */
var polarChart;
function createPolarChart(){
	polarChart = new Highcharts.Chart({
	            
	    chart: {
	        renderTo: 'polar-chart',
	        polar: true,
	        type: 'line'
	    },
	    
	    title: {
	        text: 'Budget vs spending',
	        x: -80
	    },
	    
	    pane: {
	    	size: '80%'
	    },
	    
	    xAxis: {
	        categories: ['Support', 'Stability', 'Probability', 'Separation'],
	        tickmarkPlacement: 'on',
	        lineWidth: 0
	    },
	        
	    yAxis: {
	        gridLineInterpolation: 'polygon',
	        lineWidth: 0,
	        min: 0
	    },
	    
	    tooltip: {
	    	shared: true,
	        valuePrefix: '$'
	    },
	    
	    legend: {
	        align: 'right',
	        verticalAlign: 'top',
	        y: 100,
	        layout: 'vertical'
	    },
	    
	    series: [{
	        name: 'Allocated Budget',
	        data: [43000, 19000, 60000, 35000],
	        pointPlacement: 'on'
	    }, {
	        name: 'Actual Spending',
	        data: [50000, 39000, 42000, 31000],
	        pointPlacement: 'on'
	    }]
	
	});
}

/*
* SCATTERPLOT CHART
*/


function createScatterPlotChart() {
	distributionChart = new Highcharts.Chart({
		chart : {
			renderTo : "sc_pl_div",
			type : 'area',
			margin : [50, 50, 100, 80]
		},
		title : {
			text : "Association Rules Distribution"
		}
	});

	distributionChart.container.innerHTML = "";
	init_scatter_plot(distributionChart.container);
}

/*
 * Rules list for radial view
 */

function createRulesList() {
	
	if (typeof association_rules == 'undefined') return;
	
	
	a1 = [];
	a2 = [];
	for( i = 0; i < association_rules.length; i++) {
		a1.push(association_rules[i].id);
		a2.push(association_rules[i].confidence);
	}
	
	var new_height = 50 + (association_rules.length * 20);
	
	chart = new Highcharts.Chart({

		chart : {
			height: new_height,
			renderTo : 'rules_render_area',
			type : 'bar',
			events : {
				'click' : function(event) {
					if(prevIndex !== -1) {

						for( t = 0; t < this.series[0].data.length; t++) {
							if(this.series[0].data[t].category == prevIndex) {
								this.series[0].data[t].update({
									color : '#4572A7'
								}, true, false);
								break;
							}
						}
						d3.select("#chart").select("svg").selectAll("path").style("opacity", 0.99);
						prevIndex = -1;
					}
				}
			}
		},
		title : {
			text : 'Generated rules'
		},
		legend : {
			enabled : null
		},
		xAxis : {
			categories : a1,
			title : {
				text : null
			}
		},
		yAxis : {
			min : 0,
			title : {
				text : null,
				align : 'high'
			},
			labels : {
				overflow : 'justify'
			}
		},
		tooltip : {
			formatter : function() {
				return '' + this.series.name + ': ' + this.y;
			}
		},
		plotOptions : {
			bar : {
				dataLabels : {
					enabled : true
				},
				events : {
					'click' : function(event) {

						if(prevIndex !== -1) {

							for( t = 0; t < this.data.length; t++) {
								if(this.data[t].category == prevIndex) {
									this.data[t].update({
										color : '#4572A7'
									}, true, false);
									break;
								}
							}
						}
						event.point.update({
							color : '#f00'
						}, true, false)
						vis.selectAll("path").style("opacity", function(d) {
							if (d[0].ids.indexOf(event.point.category) >= 0) return .99;
							else return .1;
							
							//return d[4].id == event.point.category ? .99 : .1;
						});
						prevIndex = event.point.category;
					}
				}
			}
		},

		series : [{
			name : 'Confidence',
			data : a2
		}]
	});

}


function updateDashboard(){
	//	multiSelectOptionsForAttributes("#control_1");
	//multiSelectOptionsForAttributes("#control_2");
	
	//chart.series[0].setData(context.attributes[serie.name], true);
}


