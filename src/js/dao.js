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
			tx.executeSql('SELECT u.id, u.description,t.tag from urls u left outer join tags t on u.id = t.urlid where url = ?', [url], function (tx, result){
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
			tx.executeSql('select u.description, t.tag from urls u left outer join tags t on u.id = t.urlid where url = ?',[url],function(tx,result){
				if(result.rows.length > 0){
					var description = result.rows.item(0).description;
					var tags = "";
					for(var i =0; i < result.rows.length; i++){
						var tag = result.rows.item(i).tag;
						if(tag)
							tags += tag + ",";
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
				that._getTagsForUrl(result.rows, onSearch)
			});
		});	
	},
	_getTagsForUrl : function(urlsData, onSearch){
		var that = this;
		var urlIds = this._createUrlsIds(urlsData);
		if(urlIds.length > 0){
			this._db.transaction(function (tx) {
				tx.executeSql(that._getTagForUrlQuery(urlIds.length),urlIds,function(tx,result){
					onSearch(that._createSearchTagsDato(result.rows,urlsData));
				});
			});
		}
		else{
			onSearch(new Array())
		}
	},
	_createUrlsIds : function(urlsData){
		var urlIds = new Array();
		for(var i=0; i < urlsData.length; i++){
			urlIds.push(urlsData.item(i).id);
		}
		return urlIds;
	},
	_createSearchTagsDato : function(rows,urlsData){
		var searchTagsDto = new Array();
		var urlTagMap = this._getUrlTagMap(rows);
		for(var i =0;i < urlsData.length;i++){
			var urlData = urlsData.item(i);
			searchTagsDto.push(new SearchTagDto(urlData.url,urlData.description,urlTagMap[urlData.id]));
		}
		return searchTagsDto;
	},
	_getUrlTagMap : function(rows){
		var map = {};
		for(var i = 0; i < rows.length; i++){
			var row = rows.item(i);
			var urlId = row.urlid;
			if(map[urlId])
				map[urlId] = map[urlId] + "," + row.tag;
			else
				map[urlId] = row.tag;
		}
		return map;
	},
	_getTagForUrlQuery : function(urlCount){
		return this._createInQuery('select urlid, tag from tags where urlid in (', urlCount);
	},
	_searchTagQuery : function(tagsCount){
		return this._createInQuery('select distinct u.id, u.url, u.description from urls u left outer join tags t on u.id = t.urlid where t.tag in (', tagsCount);
	},
	_createInQuery : function(baseQuery, count){
		for(var i = 0; i < count; i++){
			baseQuery += '?,'
		}
		return baseQuery.substr(0,baseQuery.lastIndexOf(',')) + ')';
	},
	export : function(onExport){
		var that = this;
		this._exportTable("urls","",function(exportSql){
			that._exportTable("tags",exportSql,onExport);
		});
	},
	_exportTable : function(table, exportSql, onExport){
		this._db.transaction(function (tx) {
			tx.executeSql('select * from ' + table,[],function(tx,result){
				for (var i = 0; i < result.rows.length; i++) {
					var row = result.rows.item(i);
					var fields = [];
					var values = [];
					for (col in row) {
						fields.push(col);
						values.push('"' + row[col] + '"');
					}
					exportSql += "INSERT INTO " + table + "(" + fields.join(",") + ") VALUES (" + values.join(",") + ");";
				}
				onExport(exportSql);
			});
		});
	},
	import : function(sqlInserts){
		var that = this;
		this._db.transaction(function (tx) {
			that._clearDb(tx);
			sqlInserts.each(function(sqlInsert){
				tx.executeSql(sqlInsert,[]);
			});
		});
	},
	_clearDb : function(tx){
		tx.executeSql('delete from tags',[]);
		tx.executeSql('delete from urls',[]);
		tx.executeSql('delete from sqlite_sequence',[]);
	},
});