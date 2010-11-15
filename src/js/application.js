var Tags = {
	strippedTagArray: function() { 
		var tags = new Array();
		this.value.split(",").each(function(tag){
			var strippedTag = tag.strip();
			if(strippedTag != "")
				tags.push(strippedTag);
		})
		return tags;
	},
};

var TagData = Class.create({
	initialize : function(url, description, matchingTags){
		this.url = url;
		this.description = description;
		this.matchingTags = matchingTags;
	},
});

var application;
var Application = Class.create({
	initialize : function(urlService,tinyUrl){
		this._urlService = urlService;
		this._tinyUrl = tinyUrl;
		this._addExtensions();
		this._hookEvents();
	},
	_hookEvents : function(){
		var that = this;
		submitTagsButton.observe('click',function(event){
			that._saveTags(that._url);
		});
		searchButton.observe('click',function(event){
			that._searchTags();
		});
	},
	_addExtensions : function(){
		Object.extend(tagsInput,Tags);
		Object.extend(searchInputTags,Tags);
	},	
	populateValues : function(){
		var that = this;
		chrome.tabs.getSelected(null,function (tab){
			that._tinyUrl.shorten(tab.url,function(shortenedUrl){
				that._url = shortenedUrl;
				that._populateDescriptionAndTags(shortenedUrl);
			});
		});
	},	
	_saveTags : function(url){
		this._urlService.saveOrUpdate(url,descriptionInput.value.strip(),tagsInput.strippedTagArray());
	},
	_populateDescriptionAndTags : function(url){
		this._urlService.searchByUrl(url, function(description,tags){
			descriptionInput.value = description;
			tagsInput.value = tags;
		});		
	},
	_searchTags : function(){
		var that = this;
		this._urlService.searchByTags(searchInputTags.strippedTagArray(),function(tagsData){
			that._renderResult(tagsData);
		});
	},
	_renderResult : function(tagsData){
		var tableHeader = '<table><tr><th>Url</th><th>Description</th><th>Matching Tags</th></tr>';
		var tableFooter = '</table>';
		var resultRowTemplate = '<tr><td><a href="{0}" onclick="application.openTab(\'{0}\')">{0}</a></td><td>{1}</td><td>{2}</td></tr>';
		var resultRows = "";
		tagsData.each(function(tagData){
			var template = resultRowTemplate;
			resultRows += template.replace(/\{0\}/gi,tagData.url).replace(/\{1\}/gi,tagData.description).replace(/\{2\}/gi,tagData.matchingTags);
		});
		searchResults.innerHTML = tableHeader + resultRows + tableFooter;
	},
	openTab : function(url){
		chrome.tabs.create({"url":url, "selected":false});
	},
});

function loadApplication(){
	var dao = new Dao();
	var urlService = new UrlService(dao);
	var tinyUrl = new TinyUrl();
	application = new Application(urlService,tinyUrl);
	application.populateValues();
}