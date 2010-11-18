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
		clearButton.observe('click',function(event){
			that._clearTags();
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
		var tagArray = searchInputTags.strippedTagArray();
		if(tagArray.length > 0){
			this._urlService.searchByTags(tagArray,function(searchTagsDto){
				if(searchTagsDto.length > 0)
					that._renderResult(searchTagsDto);
				else
					that._showError("Sorry, no matching urls found!!");
			});
		}
		else{
			this._showError("Please input some value for tag.");
		}
	},
	_clearTags : function(){
		searchInputTags.value = "";
		searchResults.innerHTML = "";
	},
	_showError : function(errorMessage){
		searchResults.innerHTML = errorMessage;
	},
	_renderResult : function(searchTagsDto){
		var that = this;
		var setTemplate = '<div class="{0}">{1}{2}{3}</div>';	
		var urlTemplate = '<div class="url">Url : <a href="{0}" onclick="application.openTab(\'{0}\')">{0}</a> </div>';
		var descriptionTemplate = '<div class="description">Description : {0} </div>';
		var tagsTemplate = '<div class="tags">Tags : {0} </div>';
		var resultSet = "";
		searchTagsDto.each(function(searchTagDto, index){
				var url = urlTemplate.replace(/\{0\}/gi,searchTagDto.url);
				var description = descriptionTemplate.replace(/\{0\}/gi,searchTagDto.description);
				var tags = tagsTemplate.replace(/\{0\}/gi,searchTagDto.matchingTags);
				resultSet += setTemplate.replace(/\{0\}/gi,that._getSetClass(index)).replace(/\{1\}/gi,url).replace(/\{2\}/gi,description).replace(/\{3\}/gi,tags);
		});
		searchResults.innerHTML = resultSet;
	},
	_getSetClass : function(index){
		if(index%2==0)
			return "set1";
		else
			return "set2";
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