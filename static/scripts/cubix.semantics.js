$(function() {
	
		$('ul.nav > li.active').removeClass("active");
		$('li#semantics').addClass("active");

// SEMANTICS
	    $('a.sparql-search').click(function(){
	     	var sp = $('textarea#search_prefix').val();
	     	var sq = $('textarea#search_query').val();
			var thetoken = $('input[name=csrfmiddlewaretoken]').val();
			
		     $.get('search',{ format:"json", search_prefix: sp, search_query: sq, csrfmiddlewaretoken:  thetoken}, function(data) {
			 
			// var content = (typeof data.error == "undefined") ? data.toString() : data.error;
			  
			  
			
			if (typeof data.error == "undefined") { 
			
				var table = $("div#sparql_result").append("<table></table>");
				var tHeader = table.append("<tr></tr>");
				for(var i = 0; i < data.head.vars.length; i++) {
					var headel = data.head.vars[i];
					tHeader.append("<th>"+ headel +"</th>");
				}
			
				for(var i = 0; i < data.results.bindings.length; i++)  {
					var binding = data.results.bindings[i];
					var val1 =  binding.wine.value.split("#")[1];
					var val2 =  binding.property.value.split("#")[1];
					var val3 =  binding.value.value.split("#")[1];
				
					table.append("<tr><td>"+ val1 +"</td><td>"+ val2 +"</td><td>"+ val3 +"</td></tr>");
				}
			} else {
				$('div#sparql_result').html(data.error);
			}
			
			//alert('Load was performed.');
			});
		});
        
		
		
});
