var Tags = {
	strippedTagArray: function() { 
		var tags = new Array();
		this.value.split(",").each(function(tag){
			var strippedTag = tag.strip();
			if(strippedTag != "")
				tags.push(strippedTag.toLowerCase());
		})
		return tags;
	},
};

var SearchTagDto = Class.create({
	initialize : function(url, description, matchingTags){
		this.url = url;
		this.description = description;
		this.matchingTags = matchingTags;
	},
});

var application;
var Application = Class.create({
	initialize : function(urlService){
		this._urlService = urlService;
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
		exportButton.observe('click',function(event){
			that._export();
		});
		importButton.observe('click',function(event){
			that._import();
		});
	},
	_addExtensions : function(){
		Object.extend(tagsInput,Tags);
		Object.extend(searchInputTags,Tags);
	},	
	populateValues : function(){
		var that = this;
		chrome.tabs.getSelected(null,function (tab){
			that._urlService.shortenUrl(tab.url,function(shortenedUrl){
				that._url = shortenedUrl;
				that._populateDescriptionAndTags(shortenedUrl);
			});
		});
	},	
	_saveTags : function(url){
		this._urlService.saveOrUpdate(url,descriptionInput.value.toLowerCase().strip(),tagsInput.strippedTagArray());
	},
	_populateDescriptionAndTags : function(url){
		this._urlService.searchByUrl(url, function(description,tags){
			descriptionInput.value = description;
			tagsInput.value = tags;
		});		
	},
	_searchTags : function(){
		var that = this;
		this._urlService.searchByTags(searchInputTags.strippedTagArray(),function(searchTagsDto){
			if(searchTagsDto.length > 0)
				that._renderResult(searchTagsDto);
			else
				that._showNoResults();
		});
	},
	_showNoResults : function(){
		searchResults.innerHTML = "Sorry, no matching urls found!!"
	},
	_renderResult : function(searchTagsDto){
		var tableHeader = '<table><tr><th>Url</th><th>Description</th><th>Matching Tags</th></tr>';
		var tableFooter = '</table>';
		var resultRowTemplate = '<tr><td><a href="{0}" onclick="application.openTab(\'{0}\')">{0}</a></td><td>{1}</td><td>{2}</td></tr>';
		var resultRows = "";
		searchTagsDto.each(function(searchTagDto){
			var template = resultRowTemplate;
			resultRows += template.replace(/\{0\}/gi,searchTagDto.url).replace(/\{1\}/gi,searchTagDto.description).replace(/\{2\}/gi,searchTagDto.matchingTags);
		});
		searchResults.innerHTML = tableHeader + resultRows + tableFooter;
	},
	openTab : function(url){
		chrome.tabs.create({"url":url, "selected":false});
	},
	_export : function(){
		var that = this;
		this._urlService.export(function(exportSql){
			exportOutput.value = exportSql;
		});
	},
	_import : function(){
		this._urlService.import(importInput.value);
	},
});

function loadApplication(){
	application = new Application(new UrlService(new TinyUrl(),new Dao()));
	application.populateValues();
}