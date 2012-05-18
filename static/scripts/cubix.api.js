

function getAssociationRules() {
	$.ajax({
		url : "/api/v1/",
		context : document.body
	}).done(function() {
		$(this).addClass("done");
	});
}

