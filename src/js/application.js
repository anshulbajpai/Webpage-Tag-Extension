var Tags = {
	strippedTagArray: function() { 
		var tags = new Array();
		this.value.split(",").each(function(tag){
			var strippedTag = tag.strip();
			if(strippedTag != "")
				tags.push(strippedTag.toLowerCase());
		})
		return tags;
	}
};

var SearchTagDto = Class.create({
	initialize : function(url, description, matchingTags){
		this.url = url;
		this.description = description;
		this.matchingTags = matchingTags;
	}
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
		submitTagsButton.observe('click',function(){
			that._saveTags(that._url);
		});
		searchButton.observe('click',function(){
			that._searchTags();
		});
		clearButton.observe('click',function(){
			that._clearTags();
		});
		exportButton.observe('click',function(){
			that._export();
		});
		importButton.observe('click',function(){
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
		this._emptySearchResults();
	},
	_showError : function(errorMessage){
		searchResults.update(errorMessage);
		searchResults.addClassName('error');
	},
	_emptySearchResults : function(){
		searchResults.update('');
		searchResults.removeClassName('error');
	},
	_renderResult : function(searchTagsDto){
		var that = this;
		this._emptySearchResults();
		searchTagsDto.each(function(searchTagDto, index){
			searchResults.insert(that._createSetElement(searchTagDto, index));
		});
	},
	_createSetElement : function(searchTagDto, index){
		return new Element('div', {class : this._getSetClass(index)})
		.insert(this._createUrlElement(searchTagDto.url))
		.insert(this._createDescriptionElement(searchTagDto.description))
		.insert(this._createTagsElement(searchTagDto.matchingTags))
	},
	_createUrlElement : function(url){
		return this._div().insert(this._link(url, 'url'));
	},
	_createDescriptionElement : function(description){
		return this._div().insert(this._label(description, 'description'));
	},
	_createTagsElement : function(tags){
		return this._div().insert(this._label(tags, 'tags'));
	},
	_link : function(url, class){
		var that = this;
		return new Element('a',{href : url, class : class}).update(url).observe('click', function(){
			that._openTab(url);
		});
	},
	_div : function(){
		return new Element('div');
	},
	_label : function(content, class){
		return new Element('label', {class : class}).update(content);
	},
	_getSetClass : function(index){
		return index%2==0 ? "set1" : "set2"
	},
	_openTab : function(url){
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