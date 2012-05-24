Highcharts.theme = { colors: ['#4572A7'] };// prevent errors in default theme
var highchartsOptions = Highcharts.getOptions(); 



function removeWatermarks(){
	$('text[text-anchor="end"]').remove();
}

function loadDashboard(){
	multiSelectOptionsForAttributes("#control_1");
	multiSelectOptionsForAttributes("#control_2");
	
	$("#control_1, #control_2").multiSelect(); // this line must be placed after the items to the option are loaded
	
}
function multiSelectOptionsForAttributes(multiSelectControlId){
	
	var $el = $(multiSelectControlId);
	$el.empty(); // remove old options
	$el.append($("<option></option>"));
	
	$.each(data.attributes, function(key,value) {
	  
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
	
			var sumData = [];
			
			var subcontext = context.getSubcontextForExtent(d.extent);
			for (var j=0; j < subcontext.attributes.length; j++) {
				var sum = 0;
				
				for (var k=0; k < subcontext.objects.length; k++) {
			  		if (subcontext.rel[k][j] == true) sum++;
			 	}
			 	sumData.push(sum);
			};
			
			distributionChart.series[0].setData(sumData);
			distributionChart.xAxis[0].setCategories(subcontext.attributeNames);
			distributionChart.redraw();
	
}




function updateDashboard(){
	//	multiSelectOptionsForAttributes("#control_1");
	//multiSelectOptionsForAttributes("#control_2");
	
	//chart.series[0].setData(data.attributes[serie.name], true);
}


