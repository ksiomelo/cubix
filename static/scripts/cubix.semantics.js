var queryResults;
var colTypes = {};//"objects":[], "attributes":[], "attribute_values":[]


$(function() {
		// disable export context button
		$("input.load-context").prop('disabled', true);
		$('ul.nav > li.active').removeClass("active");
		$('li#semantics').addClass("active");
		
		$('.sel-col-type').live('click',function(e){
			var coltype = (e.target.name).split("_col-");
			
			colTypes[coltype[0]] = coltype[1];
			
			$('i[name="'+coltype[0]+'-selected"]').remove();
			$(e.target).append("<i name=\""+coltype[0]+"-selected\" class=\"icon-ok\"></i>");
		});

// SEMANTICS
	    $('a.sparql-search').click(function(){
	     	var sp = $('textarea#search_prefix').val();
	     	var sq = $('textarea#search_query').val();
			var thetoken = $('input[name=csrfmiddlewaretoken]').val();
			
			$('div#sparql_result').empty();
			showLoading();
			
			
		     $.get('/'+WORKSPACE_SLUG+'/semantics/search',{ format:"json", search_prefix: sp, search_query: sq, csrfmiddlewaretoken:  thetoken}, function(data) {
			 
			// var content = (typeof data.error == "undefined") ? data.toString() : data.error;
			  
			  queryResults = data;
			  
			  hideLoading();
			  // allows context export
			  $("input.load-context").prop('disabled', false);
			  $("input.load-context").removeClass('disabled');

			
			if (typeof data.error == "undefined") { 
			
				var table = $("<table class=\"table table-striped\"></table>");
				var tHeader = $("<tr></tr>");
				for(var i = 0; i < data.head.vars.length; i++) {
					var headel = data.head.vars[i];
					tHeader.append("<th>"+ getOptionsHeader(headel) +"</th>");
				}
				
				table.append(tHeader.appendTo("<thead></thead>"));
			
				for(var i = 0; i < data.results.bindings.length; i++)  {
					var tRow = $("<tr></tr>");
					var binding = data.results.bindings[i];
					for(var j = 0; j < data.head.vars.length; j++) {
						var varName = data.head.vars[j];
						var valLabel = binding[varName].value; 
						if (valLabel.indexOf("#") != -1) valLabel = valLabel.split("#")[1];
						
						tRow.append("<td>"+ valLabel +"</td>");
					}
					
					table.append(tRow);
				}
				
				table.appendTo("div#sparql_result");
				
			} else {
				$('div#sparql_result').html(data.error);
			}
			
			});
		});
        
});



function getOptionsHeader(label){
	  var dropDown =  " <ul class=\"nav nav-tabs\"> "+
    	" <li class=\"dropdown\"> " +
    	"<a class=\"dropdown-toggle\" data-toggle=\"dropdown\" href=\"#\">  "+label+ " <b class=\"caret\"></b> </a>"+
    	"<ul class=\"dropdown-menu\">"+
   		" <a href=\"#\" name=\""+label+ "_col-obj\" class=\"sel-col-type \">Object</a>"+
   		" <a href=\"#\" name=\""+label+ "_col-attr\" class=\"sel-col-type \"> Attribute name</a>"+
   		" <a href=\"#\" name=\""+label+ "_col-attrval\" class=\"sel-col-type \"> Attribute value</a>"+
    	"</ul>"+
    	"</li>"+
    	"</ul>"
    	
    	return dropDown;
}


function prepareForSubmission(){
	
	var json_text = JSON.stringify(queryResults, null, 2);
	var colTypesJson = JSON.stringify(colTypes, null, 2);

	$('input[name=col_types]').val(colTypesJson);
	$('input[name=results_table]').val(json_text);
	
	return true;
}
