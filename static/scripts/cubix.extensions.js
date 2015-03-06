/*
 * DOM load  functions
 */

$(function() {

	 $(".get-extension-apply").click(function(){
	 	applyExtensions();
	 });
	 
	 // new extension button click
	 $(".new-extension-btn").click(function(){
	 	$('#modal-extensions').modal('hide');
	 	$('#modal-new-extension').modal('show');
	 });
	 
	 // new extension save button click
	  $(".new-extension-submit").click(function(){
	 	$('#modal-new-extension').modal('hide');
	 	
	 	var extensionCode = $('#extension-code').val();
	 	loadExtensionCode(extensionCode);
	 	
	 });
	
	  
});

function loadExtensionCode(code)
{
    var script   = document.createElement("script");
	script.type  = "text/javascript";
	//script.text  = "alert('voila!');";            // use this for inline script
	script.innerHTML = code;
	document.body.appendChild(script);
	    
    
}


function loadExtensions(){
	//$.getScript(STATIC_URL+"extensions/anomaly-detection.js", function(){ });
}

function applyExtensions(){
	
	$.getScript(STATIC_URL+"extensions/anomaly-detection.js");
	$('#modal-extensions').modal('hide');

}
