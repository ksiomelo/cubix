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
 * Clearing redundancy
 */

function unique_set (in_Array,is_rule_array)
{
	function compare_splines(spl1,spl2)
	{
		//true if equals
		result=true;
		if (spl1.length!==spl2.length) {return false;}
		else
		{
			for (k=0;k<spl1.length;k++){ 
				//console.log(spl1[k],spl2[k]);
				if (!compare_objects(spl1[k],spl2[k])) result=false;}
		}
		return result;
	}
is_rule_array || (is_rule_array = false);
arr=[];
if (is_rule_array)
{
	for (i=0;i<in_Array.length;i++)
	{
		flag=true;
		for (j=0;j<arr.length;j++)
		{
			if (compare_splines(arr[j],in_Array[i])) flag=false;
		}
		if (flag) arr.push(in_Array[i]);
	}	
}
else
{ for (i=0;i<in_Array.length;i++)
	{
		flag=true;
		for (j=0;j<arr.length;j++)
		{
			if (compare_objects(arr[j],in_Array[i])) flag=false;
		}
		if (flag) arr.push(in_Array[i]);
	}
}

return arr;
}

/*
 * Comparing objects
 */

var compare_objects = function (x, y){
  if ( x === y ) return true;
    // if both x and y are null or undefined and exactly the same

  if ( ! ( x instanceof Object ) || ! ( y instanceof Object ) ) return false;
    // if they are not strictly equal, they both need to be Objects

  if ( x.constructor !== y.constructor ) return false;
    // they must have the exact same prototype chain, the closest we can do is
    // test there constructor.

  for ( var p in x ) {
    if ( ! x.hasOwnProperty( p ) ) continue;
      // other properties were tested using x.constructor === y.constructor

    if ( ! y.hasOwnProperty( p ) ) return false;
      // allows to compare x[ p ] and y[ p ] when set to undefined

    if ( x[ p ] === y[ p ] ) continue;
      // if they have the same strict value or identity then they are equal

    if ( typeof( x[ p ] ) !== "object" ) return false;
      // Numbers, Strings, Functions, Booleans must be strictly equal

    if ( ! Object.equals( x[ p ],  y[ p ] ) ) return false;
      // Objects and Arrays must be tested recursively
  }

  for ( p in y ) {
    if ( y.hasOwnProperty( p ) && ! x.hasOwnProperty( p ) ) return false;
      // allows x[ p ] to be set to undefined
  }
  return true;
};

/*
 * Comparing association rules:: we can't use compare objects because rules have subarrays: premise & conclusion 
 */

function compare_a_rules(rule1,rule2)
{
	          	tmp1=Object();
          		tmp2=Object();
          		
          		tmp1.prem=clone(rule1.premise);
          		tmp1.conc=clone(rule1.conclusion);
          		tmp2.prem=clone(rule2.premise);
          		tmp2.conc=clone(rule2.conclusion);          		
          		
          		sub_sets_equal = compare_objects(tmp1.prem,tmp2.prem) && compare_objects(tmp1.conc,tmp2.conc);
          		
          		tmp1=clone(rule1);
          		tmp2=clone(rule2);
          		tmp1.premise=1;
          		tmp1.conclusion=1;
          		tmp2.premise=1;
          		tmp2.conclusion=1;	
	return compare_objects(tmp1,tmp2) && sub_sets_equal;
}

/*
 * Matrix Utils
 */
Array.prototype.transpose = function() {

  // Calculate the width and height of the Array
  var a = this,
    w = a.length ? a.length : 0,
    h = a[0] instanceof Array ? a[0].length : 0;

  // In case it is a zero matrix, no transpose routine needed.
  if(h === 0 || w === 0) { return []; }

  /**
* @var {Number} i Counter
* @var {Number} j Counter
* @var {Array} t Transposed data is stored in this array.
*/
  var i, j, t = [];

  // Loop through every item in the outer array (height)
  for(i=0; i<h; i++) {

    // Insert a new row (array)
    t[i] = [];

    // Loop through every item per item in outer array (width)
    for(j=0; j<w; j++) {

      // Save transposed data.
      t[i][j] = a[j][i];
    }
  }

  return t;
};

/*
 * Object cloning
 */

function clone(o) {
	if(!o || "object" !== typeof o)  {
		return o;
	}
	var c = "function" === typeof o.pop ? [] : {};
	var p, v;
	for(p in o) {
		if(o.hasOwnProperty(p)) {
			v = o[p];
			if(v && "object" === typeof v) {
				c[p] = clone(v);
			}
		else c[p] = v;
		}
	}
	return c;
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
