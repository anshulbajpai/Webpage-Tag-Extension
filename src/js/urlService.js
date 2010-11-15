Array.prototype.withoutArray = function(otherArray){
	var result = this;
	otherArray.each(function(element){ result = result.without(element) });
	return result;
};

var UrlService = Class.create({	
	initialize : function(dao){
		this._dao = dao;
	},
	saveOrUpdate : function(url, description, tags){
		var that = this;
		this._dao.findUrl(url,function (rows){
			if(rows.length > 0)
				that._update(rows, url, description, tags);
			else
				that._insert(url, description, tags)
			});
	},
	_update : function(rows, url, description, tags){
		if(description != rows.item(0).description)
			this._dao.updateDescription(description, url);
		var tagsFromDb = this._tagsFromDb(rows);
		var tagsToKeep = tags.intersect(tagsFromDb);
		this._deleteOldTags(tagsFromDb.withoutArray(tagsToKeep));
		this._insertNewTags(tags.withoutArray(tagsToKeep),rows.item(0).id);
	},
	_tagsFromDb : function(rows){
		var tagsFromDb = new Array();
		for(var i =0; i < rows.length; i++){
			tagsFromDb.push(rows.item(i).tag);
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
	searchByUrl : function(url,callback){
		this._dao.searchByUrl(url,callback);
	},
	searchByTags : function(tags,callback){
		this._dao.searchByTags(tags,callback);
	},
});