function flatten(root) {
  var nodes = [], i = 0;

  function recurse(node) {
    if (node.children) node.children.forEach(recurse);
    if (!node.id) node.id = ++i;
    nodes.push(node);
  }

  recurse(root);
  return nodes;
}




/*
 * Colection Utils
 */

function ArrayAddAll(source, destination) { 
		for (var i=0; i < source.length; i++) {
		  if (destination.indexOf(source[i]) < 0) {
		  	destination.push(source[i]);
		  }
		};
};



function ArraySubtract(ara1,ara2) {
  var aRes = new Array() ;
  for(var i=0;i<ara1.length;i++) {
    if( ! (ara2.indexOf(ara1[i]) >= 0)) {
      aRes.push(ara1[i]) ;
    }
  }
  return aRes ;
} 


function ArraySubtractId(ara1,ara2) {
  var aRes = new Array() ;
  for(var i=0;i<ara1.length;i++) {
  	
  	var found = false;
  	for (var j=0; j < ara2.length && !found; j++) {
		
		if (ara1[i].id == ara2[j].id) found = true;
		
	}
	
	if (!found) aRes.push(ara1[i]) ;
	
  }
  return aRes ;
} 


function ArrayIntersect(ara1,ara2) {
  var aRes = new Array() ;
  for(var i=0;i<ara1.length;i++) {
    if( !isBlank(ara1[i]) && ara2.indexOf($.trim(ara1[i])) >= 0) {
      
      aRes.push(ara1[i]) ;
    }
  }
  return aRes ;
} 


function ArrayContainsAll(ara1,ara2) {
  var contains = false;
  
  if (ara1.length == 0) return false;
  
  for(var i=0;i<ara2.length;i++) {
  	
    if( !isBlank(ara2[i]) && ara1.indexOf($.trim(ara2[i])) < 0) {
      
		return false;
    } 
  }
  return true ;
} 



function ArrayIntersectId(ara1,ara2) {
  var aRes = new Array() ;
  for(var i=0;i<ara1.length;i++) {
  	
  	for (var j=0; j < ara2.length; j++) {
		
		if (ara1[i].id == ara2[j].id) {
			aRes.push(ara1[i]) ;
		}
		
	}
  }
  return aRes ;
} 

// Array Remove - By John Resig (MIT Licensed)
function ArrayRemove(array, from, to) {
  var rest = array.slice((to || from) + 1 || array.length);
  array.length = from < 0 ? array.length + from : from;
  return array.push.apply(array, rest);
};


function HashClone(hash){
	
	return jQuery.extend(true, {}, hash);
	
}

function getKeys(h){
	var keys = [];
	for (var k in h) keys.push(k);
	return keys;
}



/*
 * String utils
 */

String.prototype.escapeHTML = function () {                                       
        return(                                                                 
            this.replace(/&/g,'&amp;').                                         
                replace(/>/g,'&gt;').                                           
                replace(/</g,'&lt;').                                           
                replace(/"/g,'&quot;')                                         
        );                                                                     
};


function isBlank(str) {
    return (!str || /^\s*$/.test(str));
}

function removeWhiteSpaces(str){
	str = str.replace(/\s/g,"");
	return str;
}
