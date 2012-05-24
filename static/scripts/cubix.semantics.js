$(function() {
	
		$('ul.nav > li.active').removeClass("active");
		$('li#semantics').addClass("active");

// SEMANTICS
	    $('a.sparql-search').click(function(){
	     	var sp = $('textarea#search_prefix').val();
	     	var sq = $('textarea#search_query').val();
			var thetoken = $('input[name=csrfmiddlewaretoken]').val();
			
		     $.get('search',{ format:"json", search_prefix: sp, search_query: sq, csrfmiddlewaretoken:  thetoken}, function(data) {
			  var content = (typeof data.error == "undefined") ? data.toString() : data.error;
			  $('div#sparql_result').html(content);
			  //alert('Load was performed.');
			});
		});
        
		
		
});
