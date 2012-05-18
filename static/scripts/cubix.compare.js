var eg2 = {
   "traits":[
      "sepalLength",
      "sepalWidth",
      "petalLength",
      "petalWidth"
   ],
   "employment":[
      "setosa",
      "versicolor",
      "virginica"
   ],
   "values":[
      {
         "sepalLength":5.1,
         "sepalWidth":3.5,
         "petalLength":1.4,
         "petalWidth":0.2,
         "employment":"setosa"
      },
      {
         "sepalLength":4.9,
         "sepalWidth":3.0,
         "petalLength":1.4,
         "petalWidth":0.2,
         "employment":"setosa"
      },
      {
         "sepalLength":4.7,
         "sepalWidth":3.2,
         "petalLength":1.3,
         "petalWidth":0.2,
         "employment":"setosa"
      },
      {
         "sepalLength":4.6,
         "sepalWidth":3.1,
         "petalLength":1.5,
         "petalWidth":0.2,
         "employment":"setosa"
      },
      {
         "sepalLength":5.0,
         "sepalWidth":3.6,
         "petalLength":1.4,
         "petalWidth":0.2,
         "employment":"setosa"
      }
      ]};




var eg = {
   "traits":[
      "education",
      "age",
      "US-citizen",
      "sex"
   ],
   "employment":[
      "Clerical",
      "Managerial",
      "Professional"
   ],
   "education":[
      "masters",
      "Bachelors",
      "phd"
   ],
    "age":[
      ">50",
      ">30"
   ],
    "US-citizen":[
      "yes",
      "no"
   ],
    "sex":[
      "male",
      "female"
   ],
   
   "values":[
      {
         "education":"masters",
         "age":">50",
         "US-citizen":"yes",
         "sex":"male",
         "employment":"Professional"
      },
      {
         "education":"Bachelors",
         "age":">30",
         "US-citizen":"yes",
         "sex":"female",
         "employment":"Clerical"
      },
      {
         "education":"phd",
         "age":">50",
         "US-citizen":"yes",
         "sex":"male",
         "employment":"Managerial"
      },
      {
         "education":"Bachelors",
         "age":">50",
         "US-citizen":"no",
         "sex":"female",
         "employment":"Professional"
      },
      {
         "education":"masters",
         "age":">30",
         "US-citizen":"no",
         "sex":"male",
         "employment":"Professional"
      },
]};




var colorAttr = "colorAttr";
var selAttrs = ["attr1","attr2","attr3","attr4" ]
var dattrvalues = ["val1","val2","val3" ]
var cxt = ["age-<30", ""]
function prepareData(){
	
	
	// get color attr values
	
	
	
	var ret = new Object();
	
	for (var i=0; i < context.length; i++) { // for each row (obj)
	  var row = context[i]
	  for (var j=0; j < selAttrs.length; j++) { // for each selected attribute
		
		var objAttrValue = context.whatValueForThisAttribute(i,selAttrs[j])
		
	  };
	};
	
	ret[colorAttr] = context.getAttrValues(colorAttr);
	
	return ret;
	
}



function getImmediateAndRemainingNodes(node) {
	var ret = [];
	
	var immediate = [];
	var remaining = [];
	
	var children = getChildrenData(node);
	
	for (var i=0; i < children.length; i++) {
	  if (children[i].depth == node.depth+1) {
	  	immediate.push(children[i]);
	  } else remaining.push(children[i]);
	};
	
	ret.push(immediate, remaining); // ret[0] = immediate
	
	return ret;
}

function getMatrixData(lineNodes, columnNodes /*,remainingMap*/){
	var ret = [];
	for (var i=0; i < lineNodes.length + 1; i++) {
		var row = [];
	  for (var j=0; j < columnNodes.length + 1; j++) {
		if (i == 0) { // first line
			var mObj = new Object();
			mObj.label = (j < columnNodes.length) ? columnNodes[j] : null;
			mObj.i = i;
			mObj.j = j;
			mObj.id = i+","+j;
			row.push(mObj);
		} else {
			var mObj = new Object();
			mObj.label = (j == columnNodes.length) ? lineNodes[i-1] : null;
			mObj.i = i;
			mObj.j = j;
			mObj.id = i+","+j;
			row.push(mObj);
		}
	  };
	  ret.push(row);
	};
	return ret;
}

function getMatrixDataFlat(lineNodes, columnNodes /*,remainingMap*/){
	var ret = [];
	for (var i=0; i < lineNodes.length + 1; i++) {
	  for (var j=0; j < columnNodes.length + 1; j++) {
		if (i == 0) { // first line
			var mObj = new Object();
			mObj.label = (j < columnNodes.length) ? columnNodes[j] : null;
			mObj.i = i;
			mObj.j = j;
			mObj.id = i+","+j;
			ret.push(mObj);
		} else {
			var mObj = new Object();
			mObj.label = (j == columnNodes.length) ? lineNodes[i-1] : null;
			mObj.i = i;
			mObj.j = j;
			mObj.id = i+","+j;
			ret.push(mObj);
		}
	  };
	};
	return ret;
}


function layeredMatrix(){
	//data.depth 
            
    var lineNodes = getTopMostConcepts(data.nodes);     
    var remainingMap = [];
    
    var columnNodes = [];
    for (var i=0; i < lineNodes.length; i++) {
      var immedRemain = getImmediateAndRemainingNodes(lineNodes[i]);
      ArrayAddAll(immedRemain[0], columnNodes);// add all imediate nodes to the column
      remainingMap[lineNodes[i]] = immedRemain[1];
    };        
    
    var theData = getMatrixDataFlat(columnNodes,lineNodes);
            
	var sz = 30;
	var dw = 2;//theData[0].length;
	var dh = 4;//theData.length;
	
	var svg = d3.select("#compare-chart")
	 .append("svg:svg")
	 .attr("class", "quilts")
	  .attr("width", dw*sz)
	  .attr("height", dh*sz);

	  
	// Update the nodes…
	  matrixNode = svg.selectAll("rect.porra")
	      .data(theData);
	
	  // Enter any new nodes.
	  matrixNode.enter().append("svg:rect")
	      .attr("class", "porra")
	      //.style("fill","#000000")
	      .attr("transform", translateXY2)
	      .attr("width", sz)
	      .attr("height", sz)
	
	  // Exit any old nodes.
	  matrixNode.exit();//.remove();
	 
	      
	      
	      
	  // var g = svg.selectAll("g")
	  // .data(lineNodes)
	 // .enter().append("svg:g")
	 // .attr("transform", translateY);
// 	
	// g.selectAll("rect.quilts")
	  // .data(function(d) { return d; })
	 // .enter().append("svg:rect")
	  // .attr("class", "quilts")
	  // .attr("transform", translateX)
	  // .attr("width", sz)
	  // .attr("height", sz)

	
}

function translateY(d, i) { return "translate(0,"+(i*sz)+")"; }
function translateX(d, i) { return "translate("+(i*sz)+",0)"; }

function translateXY2(d, i) { return "translate("+(d.i*sz)+","+(d.j*sz)+")"; }


function plotCompare(){
	
	layeredMatrix();
	return;
	
	
	var mdata = [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 2, 2, 2, 0, 0, 0, 0],
            [0, 0, 0, 2, 2, 2, 2, 0, 0, 0],
            [0, 0, 2, 2, 2, 2, 2, 2, 0, 0],
            [0, 0, 2, 2, 2, 2, 2, 2, 2, 0],
            [0, 0, 2, 1, 0, 0, 2, 2, 2, 0],
            [0, 0, 1, 1, 0, 0, 2, 2, 2, 0],
            [0, 0, 0, 0, 1, 1, 2, 2, 0, 0],
            [0, 0, 0, 0, 1, 2, 2, 2, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
    fn = [grid0, grid1, grid2],
    dw = mdata[0].length,
    dh = mdata.length;
    sz = 30,
    grid = grid0;
    
    var svg = d3.select("#compare-chart")
	 .append("svg:svg")
	 .attr("class", "contour")
	  .attr("width", dw*sz)
	  .attr("height", dh*sz);

	var g = svg.selectAll("g")
	  .data(data)
	 .enter().append("svg:g")
	  .attr("transform", translateY);
	
	g.selectAll("rect.contour")
	  .data(function(d) { return d; })
	 .enter().append("svg:rect")
	  .attr("class", "contour")
	  .attr("transform", translateX)
	  .attr("width", sz)
	  .attr("height", sz)
	  //.attr("fill", getCColor)
	  //.attr("class", function(d) { return "d"+d; })
	  .on("mouseover", mouseover);
	
	contour(grid);
	
	
	
	
	function grid0(x,y) {
  if (x < 0 || y < 0 || x >= dw || y >= dh) return 0;
  return mdata[y][x];
}
function grid1(x,y) {
  if (x < 0 || y < 0 || x >= dw || y >= dh) return 0;
  return mdata[y][x]==1;
}
function grid2(x,y) {
  if (x < 0 || y < 0 || x >= dw || y >= dh) return 0;
  return mdata[y][x]==2;
}
	
function getCColor(d){
	var idx = Math.round(Math.random()*10);
	alert(idx)
	return ["blue", "yellow"][idx%2]
}

function translateY(d, i) { return "translate(0,"+(i*sz)+")"; }
function translateX(d, i) { return "translate("+(i*sz)+",0)"; }
function scale(p) { return [p[0]*sz, p[1]*sz]; }



function contour(grid, start) {
  svg.selectAll("path.contour")
    .data([d3.geom.contour(grid, start).map(scale)])
    .attr("d", function(d) { return "M" + d.join("L") + "Z"; })
    .attr("class", "contour")
   .enter().append("svg:path")
   .attr("class", "contour")
    .attr("d", function(d) { return "M" + d.join("L") + "Z"; });
}

function mouseover(d,i) {
  var s = undefined;
  grid = fn[d];
  if (d > 0) {
	// map mouse to grid coords, then find left edge
    var p = d3.svg.mouse(svg[0][0]);
    s = [Math.floor(p[0]/sz), Math.floor(p[1]/sz)];
    while (grid(s[0]-1,s[1])) s[0]--;
  }
  contour(grid, s);
}
    
    
}










/*
 * SCATTERPLOT MATRIX
 */

function drawSplom(){
	
	
	
	
	/////////
	
	flower = eg;
	
  // Size parameters.
  var size = 150,
      padding = 19.5,
      n = flower.traits.length;

  // Position scales.
  var x = {}, y = {};
  flower.traits.forEach(function(trait) {
    var value = function(d) { return d[trait]; },
    	domain = flower[trait],
        //domain = [d3.min(flower.values, value), d3.max(flower.values, value)],
        range = [padding / 2, size - padding / 2];
    x[trait] = d3.scale.ordinal().domain(domain).range(range);
    y[trait] = d3.scale.ordinal().domain(domain).range(range.reverse());
  });

  // Axes.
  var axis = d3.svg.axis()
      .ticks(5)
      .tickSize(size * n);

  // Brush.
  var brush = d3.svg.brush()
      .on("brushstart", brushstart)
      .on("brush", brush)
      .on("brushend", brushend);

  // Root panel.
  var svg = d3.select("#compare-chart").append("svg:svg")
      .attr("width", size * n + padding)
      .attr("height", size * n + padding);

  // X-axis.
  svg.selectAll("g.x.axis")
      .data(flower.traits)
    .enter().append("svg:g")
      .attr("class", "x axis")
      .attr("transform", function(d, i) { return "translate(" + i * size + ",0)"; })
      .each(function(d) { d3.select(this).call(axis.scale(x[d]).orient("bottom")); });

  // Y-axis.
  svg.selectAll("g.y.axis")
      .data(flower.traits)
    .enter().append("svg:g")
      .attr("class", "y axis")
      .attr("transform", function(d, i) { return "translate(0," + i * size + ")"; })
      .each(function(d) { d3.select(this).call(axis.scale(y[d]).orient("right")); });

  // Cell and plot.
  var cell = svg.selectAll("g.splcell")
      .data(cross(flower.traits, flower.traits))
    .enter().append("svg:g")
      .attr("class", "splcell")
      .attr("transform", function(d) { return "translate(" + d.i * size + "," + d.j * size + ")"; })
      .each(plot);

  // Titles for the diagonal.
  cell.filter(function(d) { return d.i == d.j; }).append("svg:text")
      .attr("x", padding)
      .attr("y", padding)
      .attr("dy", ".71em")
      .text(function(d) { return d.x; });

  function plot(p) {
    var cell = d3.select(this);

    // Plot frame.
    cell.append("svg:rect")
        .attr("class", "frame")
        .attr("x", padding / 2)
        .attr("y", padding / 2)
        .attr("width", size - padding)
        .attr("height", size - padding);

    // Plot dots.
    cell.selectAll("circle.spl")
        .data(flower.values)
      .enter().append("svg:circle")
        .attr("class", function(d) { return "spl "+ d.employment; }) // TODO modify
        .attr("cx", function(d) { return x[p.x](d[p.x]); })
        .attr("cy", function(d) { return y[p.y](d[p.y]); })
        .attr("r", 3);

    // Plot brush.
    cell.call(brush.x(x[p.x]).y(y[p.y]));
  }

  // Clear the previously-active brush, if any.
  function brushstart(p) {
    if (brush.data !== p) {
      cell.call(brush.clear());
      brush.x(x[p.x]).y(y[p.y]).data = p;
    }
  }

  // Highlight the selected circles.
  function brush(p) {
    var e = brush.extent();
    svg.selectAll("circle").attr("class", function(d) {
      return e[0][0] <= d[p.x] && d[p.x] <= e[1][0]
          && e[0][1] <= d[p.y] && d[p.y] <= e[1][1]
          ? d.employment : null;						// TODO modify
    });
  }

  // If the brush is empty, select all circles.
  function brushend() {
    if (brush.empty()) svg.selectAll("circle").attr("class", function(d) {
      return d.employment;				// TODO modify
    });
  }

  function cross(a, b) {
    var c = [], n = a.length, m = b.length, i, j;
    for (i = -1; ++i < n;) for (j = -1; ++j < m;) c.push({x: a[i], i: i, y: b[j], j: j});
    return c;
  }
	
}







