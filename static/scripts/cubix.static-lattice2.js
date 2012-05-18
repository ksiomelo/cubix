//* Point Stuff **********************************************/
function dot(p){
	return (this.x*p.x+this.y*p.y+this.z*p.z);
	}
function norm(){
	return Math.sqrt(this.dot(this));
	}
function plus(b){
	c=new point(this.x+b.x, this.y+b.y, this.z+b.z);
	return(c);
	}
function sub(b){
	c=new point(this.x-b.x, this.y-b.y, this.z-b.z);
	return(c);
	}
function scale(s){
	c=new point(s*this.x, s*this.y, s*this.z);
	return(c);
	}
function zero(){
	this.x=0;
	this.y=0;
	this.z=0;
	}
function rand(n){
	this.x=Math.random() % n;
	this.y=Math.random() % n;
	this.z=Math.random() % n;

	}
function printInfo(){
	return("("+this.x+", "+this.y+", "+this.z+")");
	}
function point(x,y,z){
	this.x=x;
	this.y=y;
	this.z=z;
	this.dot=dot;
	this.norm=norm;
	this.plus=plus;
	this.sub=sub;
	this.scale=scale;
	this.zero=zero;
	this.rand=rand;
	this.printInfo=printInfo;
	}
//**************************************************************/
//* 3D drawing stuff *******************************************/
var theCanvas;
var theContext;
var theForm;
var width;
var height;
var reach=10;			//maximum coordinate in DRAWING plane
var reachScale=0.9;		//zooming factor
var Pi=Math.PI;
var angleSteps=20;		//half number of rotation steps in 
					//one full revolution
var aStep=Pi/angleSteps;	//added to angle for rotation
var theta=0; 			//angle to eye from positive x-axis
var phi=0; 			//angle to eye from xy-plane
var projX;			//basis vectors for drawing plane
var projY;
var changed=0;			//flag to indicate if need redraw

function setProjectionMatrix(){
//set up basis for drawing plane
	projX.x=-Math.sin(theta);
	projX.y=Math.cos(theta);
	projX.z=0;
	projY.x=-Math.cos(theta)*Math.sin(phi);
	projY.y=-Math.sin(theta)*Math.sin(phi);
	projY.z= Math.cos(phi);
	}
function initProjectionMatrix(){
//begin with eye on positive x-axis
	projX=new point(0,0,0);
	projY=new point(0,0,0);
	theta=0;
	phi=0;
	setProjectionMatrix();
	}
function projectAndScaleX(p){
//find x-component of point on drawing plane
	return (width*(projX.dot(p)+reach)/(2*reach));
	}
function projectAndScaleY(p){
//find y-component of point on drawing plane
	return height-(height*(projY.dot(p)+reach)/(2*reach));
	}
function drawLine(p,q){
	theContext.beginPath();
	theContext.moveTo(projectAndScaleX(p), projectAndScaleY(p));
	theContext.lineTo(projectAndScaleX(q), projectAndScaleY(q));
	theContext.stroke();
	}
function drawSphere(p, r){
	theContext.beginPath();
	theContext.arc(projectAndScaleX(p), projectAndScaleY(p), width*(r/(2*reach)), 0, 2*Pi, false);
	theContext.fill();
	}




function drawAxis(){
	var p,q;
	p=new point(-reach,0,0)
	q=new point(reach,0,0);
	drawLine(p,q);

	p.x=0;p.y=-reach;p.z=0;
	q.x=0;q.y=reach;q.z=0;
	drawLine(p,q);

	p.x=0;p.y=0;p.z=-reach;
	q.x=0;q.y=0;q.z=reach;
	drawLine(p,q);
	}
//*****************************************************************/
//* Controls ******************************************************/
function rotateLeft(){
	theta+=aStep;
	setProjectionMatrix();
	changed=1;
	}
function zoomIn(){
	reach=reach*reachScale;
	changed=1;
	}
function zoomOut(){
	reach=reach/reachScale;
	changed=1;
	}
function rotateRight(){
	theta-=aStep;
	setProjectionMatrix();
	changed=1;
	}
function rotateUp(){
	if (phi<Pi/4){
		phi+=aStep;
		setProjectionMatrix();
		changed=1;
		}
	}
function rotateDown(){
	if (phi>-Pi/4){
		phi-=aStep;
		setProjectionMatrix();
		changed=1;
		}
	}
function handleKeyDown(event){
	var k=event.keyCode;

	if	(k==39)
		rotateRight();
	else if	(k==79)
		zoomOut();
	else if	(k==73)
		zoomIn();
	else if	(k==37)
		rotateLeft();
//uncomment the next 4 lines if you want to be able to rotate
	//up and down.  This is dangerous for ordered sets
	//because the maximal and minimal elements may rotate out
	//of those positions.
//	else if	(k==38)
//		rotateUp();
//	else if (k==40)
//		rotateDown();
	drawScene();
	}


//* drawLat Stuff ********************************************/

var tStep=0.01;		//time step
var N;				//number of elements in ordered set
var thePoints; 			//arrays for points, velocities, forces
var theVelocities
var theForces;
var theGraph;			//graph of covering relation
var theOrder;			//order relation
var theHeights; 		//height
var theDepths;			//max height - depth
var sorted;			//elements are bubble sorted to find height
var radius=0.1;			//radius of ball drawn for each point
var improve=0;			//flag to indicate when forces applied
var repulsion=1;		//constants for proportional forces
var attraction=1;
var coverAttraction=1;


var slink, snode;

function initThisLattice(){
	
	
	width = w;
	height = h;
	
	vis = d3.select("#chart").append("svg:svg")
	.attr("width", "100%")
    .attr("height", "100%")
   .attr("viewBox", "0 0 "+w+" "+h);
    
    reload();
}

function getProjectedX(d){
	//if (typeof d == 'undefined') return;
	if (d.dd0) return d.dd0;
	return projectAndScaleX(thePoints[d.theIdx]);
}
function getProjectedY(d){
	if (d.dd1) return d.dd1;
	return projectAndScaleY(thePoints[d.theIdx]);
}

function updatePos(){
	
	vis.selectAll("circle.node").each(function(d){
		var thenode = d3.select(this);
		
		 thenode.attr("cx", getProjectedX(d));
	     thenode.attr("cy", getProjectedY(d));
	});
	
	
	vis.selectAll("line.link").each(function(d){
		var thelink = d3.select(this);
		
		thelink.attr("x1", getProjectedX(data.nodes[d.source]) );
	    thelink.attr("y1", getProjectedY(data.nodes[d.source]) );
	    thelink.attr("x2", getProjectedX(data.nodes[d.target]) );
	    thelink.attr("y2", getProjectedY(data.nodes[d.target]) );
	});
}

var __origin__;

function drawGraph(){
	var x,y,i;
	
	
	
	var nodes = data.nodes,
      links = data.links;
	
	
	  // Restart the force layout.
	   // force
	       // .nodes(nodes)
	       // .links(links);
	      // .start();
	
	 // Update the links…
	  slink = vis.selectAll("line.link")
	      .data(links);
	
	  // Enter any new links.
	  slink.enter().insert("svg:line", ".node")
	      .attr("class", "link")
	      .attr("x1", function(d) { return getProjectedX(getFuckingNode(d.source.id)); })
	      .attr("y1", function(d) { return getProjectedY(getFuckingNode(d.source.id)); })
	      .attr("x2", function(d) { return getProjectedX(getFuckingNode(d.target.id)); })
	      .attr("y2", function(d) { return getProjectedY(getFuckingNode(d.target.id)); })
	      // .attr("x1", function(d) { return getProjectedX(data.nodes[(typeof d.source.index != 'undefined') ? d.source.index : d.source]); })
	      // .attr("y1", function(d) { return getProjectedY(data.nodes[(typeof d.source.index != 'undefined') ? d.source.index : d.source]); })
	      // .attr("x2", function(d) { return getProjectedX(data.nodes[(typeof d.target.index != 'undefined') ? d.target.index : d.target]); })
	      // .attr("y2", function(d) { return getProjectedY(data.nodes[(typeof d.target.index != 'undefined') ? d.target.index : d.target]); })
	      .attr("source_id", function(d) { return d.source.id; })
          .attr("target_id", function(d) { return d.target.id; });
	
		  
// 	
	
	  // Exit any old links.
	  slink.exit().remove();
	  
	  // clink.transition()
      	// .duration(duration)
      	// .attr("d", diagonal);
	
	  // Update the nodes…
	  snode = vis.selectAll("circle.node")
	      .data(nodes, function(d) { return d.id; });
	
	  // Enter any new nodes.
	  snode.enter().append("svg:circle")
	  	  .each(function(d){ d._origin = [getProjectedX(d) , getProjectedY(d)]; })
	      .attr("class", "node")
	      //.attr("cx", getProjectedX)
	      //.attr("cy", getProjectedY)
	      .attr("r", getNodeSize)
	      .attr("intent", function(d) { return d.intent; })
		  .attr("extent", function(d) { return d.extent; })
		  .attr("id", function(d) { return  d.id; })
		  .attr("children", function(d) { return d.children; })
	      .on("click", nodeClick)
		  .on("mouseover", nodeMouseOver)
		  .on("mouseout", nodeMouseOut)
		  .call(d3.behavior.drag()
          .on("dragstart", function(d) {
          	d._origin = [getProjectedX(d) , getProjectedY(d)];
            //d.__originx__ = d.slice();
          })
          .on("drag", function(d) {
          	d.dd0 = Math.max(0, Math.min(d._origin[0] += d3.event.dx, w));
            d.dd1 = Math.max(0, Math.min(d._origin[1] += d3.event.dy, h));
            updatePos();
          })
          .on("dragend", function(d) {
            delete d.dd0;
             delete d.dd1;
          }));
    snode
        .attr("cx", function(d) { return (d.dd0) ? d.dd0 : d._origin[0]; })
        .attr("cy", function(d) { return (d.dd1) ? d.dd1 : d._origin[1]; });
	
	  // Exit any old nodes.
	  snode.exit().remove();
	
	


	// theContext.fillStyle="gray";
	// theContext.fillRect(0,0,width,height);
	// theContext.fillStyle="black";
// 
	// for (x=0;x<N;x++)
		// for (y=0;y<N;y++)
			// if (theGraph[x][y])
				// drawLine(thePoints[x], thePoints[y]);
	// for (x=0;x<N;x++)
		// drawSphere(thePoints[x], radius);
	changed=0;
	
}


function getFuckingNode(nodeId){
	for (var i=0; i < data.nodes.length; i++) {
	  if (data.nodes[i].id == nodeId) return data.nodes[i];
	};
}
	
function findForces(){
	var i,j,d,l,r,a,one;
	r=2;
	a=1;
	one = new point(1,1,0);
	for (i=0;i<N;i++)
		theForces[i].zero();
	for (i=0;i<N;i++)
		for (j=0;j<N;j++)
			if (i != j) {
			d=thePoints[j].sub(thePoints[i]);
			l=d.dot(d);
			//Attraction for comparables
			if ((theGraph[i][j])){
				theForces[j].x-=((coverAttraction)*d.x);
				theForces[j].y-=((coverAttraction)*d.y);
				theForces[i].x+=((coverAttraction)*d.x);
				theForces[i].y+=((coverAttraction)*d.y);
				}
			//Attraction for covers
			if ((theOrder[i][j])){
				theForces[j].x-=((attraction/l)*d.x);
				theForces[j].y-=((attraction/l)*d.y);
				theForces[i].x+=((attraction/l)*d.x);
				theForces[i].y+=((attraction/l)*d.y);
				}
			//Repulsion for incomparables
			else if (!(theOrder[i][j] || theOrder[i][j]) ){
				theForces[j].x+=((repulsion/l)*d.x);
				theForces[j].y+=((repulsion/l)*d.y);
				theForces[i].x-=((repulsion/l)*d.x);
				theForces[i].y-=((repulsion/l)*d.y);
				}
			}
	}
function findVelocities(){
// Used F=MV rather than F=MA.  Assume all M are 1, so F=V.
	var i;
	for (i=0;i<N;i++){
		theVelocities[i].x=theForces[i].x;
		theVelocities[i].y=theForces[i].y;
		}
	}
function updatePositions(){
//new position = old position + velocity * tStep
	var i;
	for (i=0;i<N;i++){
		thePoints[i].x+=tStep*theVelocities[i].x;
		thePoints[i].y+=tStep*theVelocities[i].y;
		}	
	}

function recenter(){
//translate points so CM is at orgin for zooming and rotation
	var i,j, c;
	c=new point(0,0,0);
	for (i=0;i<N;i++)
		c=c.plus(thePoints[i]);
	c=c.scale(1/N);
	for (i=0;i<N;i++)
		thePoints[i]=thePoints[i].sub(c);
	}
function updatePoints(){
	findForces();
	findVelocities();
	updatePositions();
	recenter();
	changed=1;
	}
function transitiveClosure(){
	var i, x,y,z;
	for (i=0;i<N+1;i++)
	for (x=0;x<N;x++)
	for (y=0;y<N;y++)
	for (z=0;z<N;z++)
		theOrder[x][z]=theOrder[x][z] || (theOrder[x][y] && theOrder[y][z]);
	}
function bubbleSort(){
//bubble sort elements to find heights
	var x,y,t;
	for (x=0;x<N;x++)
		sorted[x]=x;
	for (x=0;x<N;x++)
		for (y=x+1;y<N;y++)
			if (theOrder[sorted[y]][sorted[x]]){
				t=sorted[y];
				sorted[y]=sorted[x];
				sorted[x]=t;
				}
	}
function findHeights(){
	var x,y;
	for (x=0;x<N;x++)
		theHeights[x]=0;
	for (x=0;x<N;x++)
		for (y=x+1;y<N;y++)
			if (theGraph[sorted[x]][sorted[y]])
				theHeights[sorted[y]]=theHeights[sorted[x]]+1;
	}
function findDepths(){
	var m, x, y;
	m=0;
	for (x=0;x<N;x++)
		if (m<theHeights[x])
			m=theHeights[x];
	reach=Math.max(m, N/m);
	for (x=0;x<N;x++)
		theDepths[x]=m;
	for (y=N-1;y>=0;y--)
		for (x=y-1;x>=0;x--)
			if (theGraph[sorted[x]][sorted[y]])
				theDepths[sorted[x]]=theHeights[sorted[y]]-1;
	}
function findZs(){
	var x;
	for (x=0;x<N;x++)
		thePoints[x].z=(theHeights[x]+theDepths[x])/2;
	}
function centerSingles(){
//if there is exactly on maximal (minimal) element then
//its initial position is on the z-axis to help symmetry
	var i,j,h,n,max, min;

	for (i=0;i<N;i++){
		h=thePoints[i].z;
		n=0;
		max=1;
		min=1;
		for (j=0;j<N;j++){
			if (thePoints[j].z == h)
				n++;
			else if ((thePoints[j].z>h))
				max=0;
			else if ((thePoints[j].z<h))
				min=0;
			}
		if ((n==1) && ((max) || (min))){
			thePoints[i].x=0;
			thePoints[i].y=0;
			}
		}
	}
function initializeArrays(){
	var i,j,x,y;
	initProjectionMatrix();
	thePoints=new Array(N);
	theVelocities=new Array(N);
	theForces=new Array(N);
	theHeights=new Array(N);
	theDepths=new Array(N);
	sorted = new Array(N);
	for(i=0;i<N;i++){
		thePoints[i]=new point(0,0,0);
		theVelocities[i]=new point(0,0,0);
		theForces[i]=new point(0,0,0);
		}
	theGraph=new Array(N);
	for (i=0;i<N;i++)
		theGraph[i]=new Array(N);

	theOrder=new Array(N);
	for (i=0;i<N;i++)
		theOrder[i]=new Array(N);

	for (i=0;i<N;i++)
		for (j=0;j<N;j++){
			theGraph[i][j]=0;
			theOrder[i][j]=0;
			theOrder[i][i]=1;
			}
	}
	
	
function loadGraph(){
	// canvas = document.getElementById("pageCanvas");
	// theContext = canvas.getContext("2d");
	// width=canvas.width;
	// height=canvas.height;
	
	initProjectionMatrix();
	
	
	
	var i,j, x,y;

	//get size
	N=data.nodes.length;//parseInt(theForm.nElements.value); // concepts number
	initializeArrays();
	//get cover pairs
	// var coverText=theForm.covers.value;
// 
	// //strip all non-digit characters and convert to an array
	// coverText=coverText.replace(new RegExp(/\D/g)," ");
	// coverText=coverText.replace(new RegExp(/^\s+/),"");
	// coverText=coverText.replace(new RegExp(/\s+$/),"");
	// a=coverText.split(/\s+/);
	// var l=a.length/2;




	for (var i=0; i < data.nodes.length; i++) {
		data.nodes[i].theIdx = i;
	  for (var j=0; j < data.nodes.length; j++) {
		if (i != j && hasChild(data.nodes[i],data.nodes[j])) {
			
			
			theGraph[i][j] = 1;
			theOrder[i][j] = 1;
		}
	  };
	};

	//load cover graph
	// for (i=0;i<l;i++){
		// x=2*i;
		// y=2*i+1;
		// theGraph[parseInt(a[x])][parseInt(a[y])]=1;
		// theOrder[parseInt(a[x])][parseInt(a[y])]=1;
		// }

	//initial positions are random
	for (i=0;i<N;i++) {
		thePoints[i].rand(N);
	}
	
	transitiveClosure();
	bubbleSort();
	findHeights();
	findDepths();
	findZs();
	centerSingles();
	improve=1;
	}
function reload(){ // iniit
	loadGraph();
	recenter();
	drawGraph();
	vai();
}
function drawScene(){
	//update if improve button clicked
	if (improve) { 
		updatePoints();
	}
	//draw only if a change has happened
	if (changed) { 
		updatePos();
		//drawGraph();
	}
}

function vai(){
	drawScene();
	setTimeout('vai()', 0);
}