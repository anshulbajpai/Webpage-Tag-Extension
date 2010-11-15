Array.prototype.withoutArray = function(otherArray){
	var result = this;
	otherArray.each(function(element){ result = result.without(element) });
	return result;
};

var FindUrlDto = Class.create({
	initialize : function(id,description,tag){
		this.id = id;
		this.description = description;
		this.tag = tag;
	},
});

var UrlService = Class.create({	
	initialize : function(tinyUrl,dao){
		this._tinyUrl = tinyUrl;
		this._dao = dao;
	},
	saveOrUpdate : function(url, description, tags){
		var that = this;
		this._dao.findUrl(url,function (findUrlDtos){
			if(findUrlDtos.length > 0)
				that._update(findUrlDtos, url, description, tags);
			else
				that._insert(url, description, tags)
			});
	},
	_update : function(findUrlDtos, url, description, tags){
		var firstDto = findUrlDtos.first();
		if(description != firstDto.description)
			this._dao.updateDescription(description, url);
		var tagsFromDb = this._tagsFromDb(findUrlDtos);
		var tagsToKeep = tags.intersect(tagsFromDb);
		this._deleteOldTags(tagsFromDb.withoutArray(tagsToKeep));
		this._insertNewTags(tags.withoutArray(tagsToKeep),firstDto.id);
	},
	_tagsFromDb : function(findUrlDtos){
		var tagsFromDb = new Array();
		for(var i =0; i < findUrlDtos.length; i++){
			tagsFromDb.push(findUrlDtos[i].tag);
		}
		return tagsFromDb;
	},
	_deleteOldTags : function(oldTags){
		var that = this;
		oldTags.each(function(tag){
			that._dao.deleteTag(tag)
		});
	},
	_insertNewTags : function(newTags,urlId){
		var that = this;
		newTags.each(function(tag){
			that._dao.insertTag(urlId,tag);
		});
	},
	_insert : function(url, description, tags){
		var that = this;
		this._dao.insertUrl(url, description);
		this._dao.maxUrlId(function(maxUrlId){
			tags.each(function(tag){
				that._dao.insertTag(maxUrlId,tag);
			});
		});
	},
	searchByUrl : function(url,onSearch){
		this._dao.searchByUrl(url,onSearch);
	},
	searchByTags : function(tags,onSearch){
		this._dao.searchByTags(tags,onSearch);
	},
	shortenUrl : function(url, afterShorten){
		this._tinyUrl.shorten(url,afterShorten);
	},
});