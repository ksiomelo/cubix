
function Context(objs, attrs, rels, attrNames) {
//var context = new function(){
	
	// data.attributes      ["age"] = [["<= 30", 3][">30", 4]]
	
	
	this.attributeNames = attrNames;
	this.attributes = attrs;
	this.objects = objs;
	this.rel = rels;//new Array(); //rel[row][column] 
	
	var upArrow = null;
	
	var upArrowUpdate = false;
	
	 this.getEntitiesCount = function () {
	 	return this.objects.length;
	 };
	 
	 
	 this.whatValueForThisAttribute = function (objIdx, attrName) {
	 	for (var i=0; i < rel[objIdx].length; i++) {
		   var fullName = rel[objIdx][i];
		   var splitAttr = fullName.split(SEPARATOR);
		   if (splitAttr[0] == attrName) return fullName.substring(fullName.indexOf(SEPARATOR)+1,fullName.length);
		 };
	 	
	 	return null; // it doesn't have this attribute
	 };
	 
	  this.getAttrValues = function (attrName) {
	 	//{"name" : ["yes", 24, "no", 32]}
	 	var ret = [];
	 	var valuesNumber = attributes[attrName];
	 	for (var i=0; i < valuesNumber.length; i+=2) {
		   ret.push(valuesNumber[i]);
		 };
	 	return ret;//attributes[attrName]; 
	 };
	 
	 // Returns a list of objects that has both attributes
	 this.intersection = function (attrName1, attrName2) {
	 	var set1 = this.getObjectsHavingOrNot(attrName1);
	 
	 	var set2 = this.getObjectsHavingOrNot(attrName2);
	 	
	 	return ArrayIntersect(set1,set2);
	 }
	 
	 // Verifies if a boolean attribute is positive or not
	// e.g. "mammal", "mammal-yes"  -> true
	// e.g. "mammal", "mammal-no" -> false
	// e.g. 2. "preying", "mammal-yes" -> false
	// e.g. 3. "preying", "mammal-no" -> true
	this.booleanPositive = function (attr1, attr2) {
		if (attr1 == attr2) return true;
		if (attr1 + "-yes" == attr2) return true;
		else { 
			var rawAttr2 = attr2.split("-");
			if (rawAttr2.length > 0 && rawAttr2[0] != attr1 && rawAttr2[1] == "no") return true;
		}
		return false;
	}
	
	// e.g. "mammal-no" will return a list of all animals non mammals
	// e.g. "mammal-yes" or "mammal" will return a list of mammals
	
	this.getObjectsHavingOrNot = function (attrName) {
		var ret = [];
		
		var rawAttr = attrName.split("-");
		var negation = (rawAttr.length > 0 && rawAttr[1] == "no");
		
		if (rawAttr.length > 0 && (rawAttr[1] == "no" || rawAttr[1] == "yes")) { //boolean attr take raw name
			attrName = rawAttr[0];
		}
		
		var attrIdx = this.attributeNames.indexOf(attrName);
		
		for (var j=0; j < this.objects.length; j++) {
		  var obj = this.objects[j];
		  
		 if (negation) { 
		 	if (!this.rel[j][attrIdx]) ret.push(obj);
		 } else { 
		 	if (this.rel[j][attrIdx]) ret.push(obj);
		 }
		};
		
		return ret;
		
	}
	this.getObjectIndex = function (obj) {
		for (var j=0; j < this.objects.length; j++) {
				if (this.objects[j] == obj) return j;
		}
		return -1;
	}
	
	this.getSubcontextForExtent = function (objsList) {
		
		var objs = [];
		var attrs = [];
		var rels = [];
		
		for (var i=0; i < objsList.length; i++) {
			
			objs.push(objsList[i]);
			rels[i] = new Array();
			
			var j = this.getObjectIndex(objsList[i]);
			
			for (var k=0; k < this.rel[j].length; k++) {
				if (this.rel[j][k]) {
					var attrIdx = attrs.indexOf(this.attributes[k]);
					if (attrIdx < 0)
						attrs.push(this.attributes[k]);
					attrIdx = attrs.indexOf(this.attributes[k]);
					rels[i][attrIdx] = true;
				}
			}
		}
		
		return new Context(objs, attrs,rels, attrs);
		
	}

	 
    
}



// eliminates objes and attributes IF they are not present in any concept
// return an array with  [0] = eliminated objects | [1] = eliminated attributes 
function eliminateEntities(){ // TODO how to optmize?? = interate over concepts adding attr/obj if exists 
	var ret = [];
	
	var remObjs = [];
	var remAttr = [];
	
	// Remove objects
	for (var j=0; j < data.objects.length;) {
		
		var contains = false;
		for (var i=0; i < data.nodes.length && !contains; i++) {
			// there's at least one node with that objct, keep it
			contains = (data.nodes[i].extent.indexOf(data.objects[j]) >= 0);
		}
		
		if (!contains) { // remove objm keep the same pointer (j)
			remObjs.push(data.objects[j]);
			data.objects.splice(j,1);
		} else j++;
		
	  };
	  
	  // Remove attributes
	   var attrNames = getAttributeValuesPairs(); 
	   
	  for (var j=0; j < attrNames.length; j++) {
		
		var contains = false;
		for (var i=0; i < data.nodes.length && !contains; i++) {
			// there's at least one node with that objct, keep it
			contains = (data.nodes[i].intent.indexOf(attrNames[j].name) >= 0);
		}
		
		if (!contains) { 
			// TODO refactor: attrNames[j] poderia ser armazenado diretamente
			var curAttrName = attrNames[j].attrName;
			var curAttrValue = attrNames[j].valueName;
			
			var theAttrVal = new Object();
			theAttrVal.name = attrNames[j].name;
			theAttrVal.booleanAttr = attrNames[j].booleanAttr;
			theAttrVal.attrName = curAttrName; // raw attr name
			if (curAttrValue) // mv attribute
				theAttrVal.value = data.attributes[curAttrName][getValueIdxfromAttr(curAttrName,curAttrValue)];
			else // boolean
				theAttrVal.value = data.attributes[curAttrName];
				
			remAttr.push(theAttrVal);
			
			if (attrNames[j].booleanAttr) { // if boolean remove the entire attribute
				delete data.attributes[curAttrName];
			} else {
				
				if (curAttrName in data.attributes) { // checks if the attribute is there (it might be already removed)
					if (data.attributes[curAttrName].length == 1)  // if it's a mv attr but it has only one value left, delete attr
						delete data.attributes[curAttrName];
					else
						removeValuefromAttr(curAttrName, curAttrValue);
				}
			}
			// see: getAttributeValuesPairs() gives an index for the value
		} 
		
	  };
	
	ret.push(remObjs);
	ret.push(remAttr);
	
	// update list
	  updateEntityList();
	  
	
	return ret;
}

// remove a value entry for an attribute from data
function removeValuefromAttr(attrString, valueString) { 
	var valueIdx = getValueIdxfromAttr(attrString, valueString); // format {"attribute":[["value1", n], ["value2", m] ]}
	
	if (valueIdx >= 0) data.attributes[attrString].splice(valueIdx,1);
}

function getValueIdxfromAttr(attrString, valueString){
	var valuesArray = data.attributes[attrString]; // format {"attribute":[["value1", n], ["value2", m] ]}
	for (var i=0; i < valuesArray.length; i++) {
	  if (valuesArray[i][0] == valueString) return i;
	};
	
	return -1;
}


function addEntities(objs, attrsVals){
	ArrayAddAll(objs, data.objects);
	
	for (var i=0; i < attrsVals.length; i++) {
	  if (attrsVals[i].attrName in data.attributes) { 
	  	if (data.attributes[attrsVals[i].attrName].indexOf(attrsVals[i].value) < 0) // assure that the value is not already there
	  		data.attributes[attrsVals[i].attrName].push(attrsVals[i].value);
	  } else {
	  	if (attrsVals[i].booleanAttr) // boolean
	  		data.attributes[attrsVals[i].attrName] = attrsVals[i].value;
	  	else // mv attr
	  		data.attributes[attrsVals[i].attrName] = [attrsVals[i].value];
	  }
	  
	};
	
	 updateEntityList();
}
