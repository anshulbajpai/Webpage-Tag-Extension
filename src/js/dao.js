var Dao = Class.create({
	initialize : function(){
		this._db = openDatabase('tagsdb', '0.1', 'tags database', 1 * 1024 * 1024);
		this._db.transaction(function (tx) {
			tx.executeSql('CREATE TABLE IF NOT EXISTS urls (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, url TEXT UNIQUE NOT NULL, description TEXT)');
			tx.executeSql('CREATE TABLE IF NOT EXISTS tags (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, urlid INTEGER NOT NULL, tag TEXT)');
		});
	},
	findUrl : function(url, onSelect){
		this._db.transaction(function (tx) {
			tx.executeSql('SELECT u.id, u.description,t.tag from urls u join tags t on u.id = t.urlid where url = ?', [url], function (tx, result){
				var findUrlDtos = new Array();
				for(var i =0; i < result.rows.length; i++){	
					var row = result.rows.item(i);
					findUrlDtos.push(new FindUrlDto(row.id,row.description,row.tag));
				}
				onSelect(findUrlDtos);
			});
		});	
	},
	updateDescription : function(description, url){
		this._db.transaction(function (tx) {
			tx.executeSql('UPDATE urls SET description = ? where url = ?',[description, url]);
		});	
	},
	deleteTag : function(tag){
		this._db.transaction(function (tx) {
			tx.executeSql('DELETE FROM tags where tag = ?',[tag]);
		});	
	},
	insertTag : function(urlId, tag){
		this._db.transaction(function (tx) {
			tx.executeSql('INSERT INTO tags (urlid, tag) VALUES (?, ?)',[urlId,tag]);
		});	
	},
	insertUrl : function(url,description){
		this._db.transaction(function (tx) {
			tx.executeSql('INSERT INTO urls (url, description) VALUES (?,?)',[url,description]);
		});	
	},
	maxUrlId : function(callback){
		this._db.transaction(function (tx) {
			tx.executeSql('select max(id) from urls',[],function(tx,result){
				callback(result.rows.item(0)['max(id)']);
			});
		});	
	},
	searchByUrl : function(url,onSearch){
		this._db.transaction(function (tx) {
			tx.executeSql('select u.description, t.tag from urls u join tags t on u.id = t.urlid where url = ?',[url],function(tx,result){
				if(result.rows.length > 0){
					var description = result.rows.item(0).description;
					var tags = "";
					for(var i =0; i < result.rows.length; i++){
						tags += result.rows.item(i).tag + ",";
					}
					onSearch(result.rows.item(0).description,tags.substr(0,tags.lastIndexOf(",")));
				}
			});
		});	
	},
	searchByTags : function(tags,onSearch){
		var that = this;
		this._db.transaction(function (tx) {
			tx.executeSql(that._searchTagQuery(tags.length),tags,function(tx,result){
				var searchTagsDto = new Array();
				for(var i =0; i < result.rows.length; i++){	
					var row = result.rows.item(i);
					var matchingSearchTagDto = that._matchingSearchTagDto(searchTagsDto, row.url);
					if(matchingSearchTagDto != null)
						matchingSearchTagDto.updateTags(row.tag);
					else	
						searchTagsDto.push(new SearchTagDto(row.url,row.description,row.tag));
				}
				onSearch(searchTagsDto);
			});
		});	
	},
	_matchingSearchTagDto : function(searchTagsDto, url){
		var matchingSearchTagDto;
		searchTagsDto.each(function(searchTagDto){
			if(searchTagDto.url == url){
				matchingSearchTagDto =  searchTagDto;
			}
		});
		return matchingSearchTagDto;
	},
	_searchTagQuery : function(tagsCount){
		var query= 'select u.url, u.description, t.tag from urls u join tags t on u.id = t.urlid where t.tag in (';
		for(var i = 0; i < tagsCount; i++){
			query += '?,'
		}
		return query.substr(0,query.lastIndexOf(',')) + ')';
	},
});