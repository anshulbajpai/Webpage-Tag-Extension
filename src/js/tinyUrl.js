var TinyUrl = Class.create({
	shorten : function(url, callback){
		var targetUrl = 'http://tinyurl.com/api-create.php?url=' + url;
		new Ajax.Request(targetUrl, {
			onSuccess: function(response) {
				callback(response.responseText);
		}
		});
	},
});