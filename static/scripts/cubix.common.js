/*
 * LAYOUT
 */


function flashAlert(alertType, msg) {
	if (alertType == "error") {
		$("div.alert-error > span").text(msg);
		$("div.alert-error").show();
	} else {
		$("div.alert-block > span").text(msg);
		$("div.alert-block").show();
	}
}

function showLoading(){
	$("div.alert").hide();
	$("div.alert-block > span").text("Loading...");
	$("div.alert-block").show();
}

function hideLoading(){
	$("div.alert").hide();
}


$(function() {
	$(".dismiss-alert").click(function(){
		$("div.alert").fadeOut('fast');
	});
	
	// Dropdown menus
	$('.dropdown-toggle').dropdown();
	
	
	// new data modal
	
	
});