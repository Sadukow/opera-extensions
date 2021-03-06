if (window == chrome.extension.getBackgroundPage()) {

	(function(){

		var WebSQL = function(){

			var self = this;

			const INTERVAL_REMOVE_OLD_FEEDS = 30 * 24 * 3600000;   // начинаем неделю назад

			var _connection = null;
			var _dbName = "fvdSingleDownloaderDataBase";
			var _estimatedSize = 500 * 1024 * 1024;

			// force use transaction
			var _transaction = null;
			var lastError = null;
			var table = 'feeds';

			// ---------------------------------------
			const VERSION_FORMAT_FEED = 1;
			const CREATE_TABLE = "CREATE TABLE IF NOT EXISTS  `feeds` (`id` int(10)"+
														   ", `category_id` int(5)"+
														   ", `author` varchar(1000)"+
														   ", `title` varchar(1000)"+
														   ", `text` varchar(2000)"+
														   ", `visual` varchar(256)"+
														   ", `show` tinyint(3) DEFAULT '1'"+
														   ", `mark` tinyint(3) DEFAULT '0'"+
														   ", `createdon` bigint(20)"+
														   ", `editedon` bigint(20) DEFAULT '0'"+
														   ", `vers` INT(5) DEFAULT 1"+
														   ", `feed_url` VARCHAR(256) DEFAULT ''"+
														   ", `feed_type` VARCHAR(45) DEFAULT ''"+
														   " )"
			const DROP_TABLE = "DROP TABLE `feeds`"

			const ALTER_TABLE = null;
			//const ALTER_TABLE = "ALTER TABLE `feeds` ADD COLUMN `vers` INT(5) DEFAULT 1"

			const REMOVE_OLD_FEEDS = "DELETE FROM `feeds` WHERE `createdon` < ?"

			// ===============================================================
			//  status = 1  - (addon installed)
			//  status = 2  - (addon updated)
			this.init = function( status, callback ){

				_connection = openDatabase(_dbName, '1.0', '', _estimatedSize);

				console.log('openDatabase: ', _dbName, status);

				chrome.extension.onRequest.addListener( function(request, sender, sendResponse) {

						if (request.command === 'websql_query') {
								self.query(request.sql, request.params, function(error, rows) {
									sendResponse({error: error, rows: rows, message: (lastError ? lastError : "")});
								});
						}


				});

				if ( status == 1 )  {
					self.query( DROP_TABLE, [], function(){
						self.query( CREATE_TABLE, [], callback);
					});
				}
				else if ( status == 2 )  {
						if (ALTER_TABLE) {
							self.query( ALTER_TABLE, [], callback);
						}
						else {
							callback();
						}
				}
				else {
					callback();
				}
			}

			// ------------------------------------------------
			function transaction( callback ){

				if( _transaction )	callback( _transaction );
				else	_connection.transaction( callback );

			}

			// ------------------------------------------------
			this.query = function(sql, params, callback){

				lastError = null;
				
				console.log(sql, params);

				transaction(function( tx ){
						tx.executeSql( sql,
									   params,
									   function( tx, results ){
									   		console.log(results);
											var data = [];
											for( var i = 0; i != results.rows.length; i++ ) 	{
												var dial = results.rows.item(i);
												data.push( dial );
											}

											if (callback) callback( false, data );
				  					   },
				  					   function(tx, error){
				  					   		lastError = error.message;
											console.error(error);
											console.log(sql, params);
											if (callback) callback( true, null );
				  					   });
				});

			}

			// ------------------------------------------------
			// добавим
			this.insert = function( feed, callback ){

				const SQL_SELECT = "SELECT * FROM `feeds` WHERE `id`=?";
				const SQL_UPDATE = "UPDATE `feeds` SET   `category_id` = ?, `author` = ?, `title` = ?, `text` = ?, `visual` = ?, `show` = ?, `editedon` = ?  WHERE `id` = ?";
				const SQL_INSERT = "INSERT INTO `feeds` (`id`, `category_id`, `author`, `title`, `text`, `visual`, `show`, `mark`, `createdon`, `editedon`, `vers`, `feed_url`, `feed_type`) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

				var id = feed.id;

				self.query(SQL_SELECT, [id], function(error, rows){

					if (error) {
						callback();
					}
					else if (rows.length == 1) {
						self.query(SQL_UPDATE, [ feed.category_id,
												 feed.author,
												 feed.title,
												 feed.text,
												 feed.visual,
												 feed.show,
												 feed.editedon,
												 id], 	callback );
					}
					else if (rows.length == 0) {
						self.query(SQL_INSERT, [ feed.id,
												 feed.category_id,
												 feed.author,
												 feed.title,
												 feed.text,
												 feed.visual,
												 feed.show,
												 0,
												 feed.createdon,
												 feed.editedon,
												 feed.vers,
												 feed.feed_url,
												 feed.feed_type
											 ], 	callback );
					}
					else {
						console.log(rows);
						callback();
					}
				});
			}

			// ------------------------------------------------
			// добавим
			this.insert_feeds = function( feeds, callback ){

				console.log('---insert_feeds-----', feeds);

				const SQL_SELECT = "SELECT `id`, `mark` FROM `feeds` WHERE `id` IN ";
				const SQL_UPDATE = "UPDATE `feeds` SET `author` = ?, `title` = ?, `text` = ?, `visual` = ?, `show` = ?, `editedon` = ?, `category_id` = ?  WHERE `id` = ?";
				const SQL_INSERT = "INSERT INTO `feeds` VALUES ";
				const SQL_DELETE = "DELETE FROM `feeds` WHERE `id` IN ";

				var list_sql = [];

				var deleteRows = [];
				var updateRows;

				fvdSingleDownloader.Utils.Async.chain([
					function(next) {			// select
						var d = [];
						for (var i=0; i<feeds.length; i++)  d.push( feeds[i].id );
						var sql = SQL_SELECT + '('+	d.join(',') + ')';

						self.query(sql, [], function(error, rows){
							if (error) {
								console.log(error);
								callback(false);
							}
							else {
								updateRows = rows;	
								next();
							}

						});

					},
					function(next) {			// update

						if (updateRows.length>0) {
							for (var j=0; j<updateRows.length; j++)  {
								var k = _find( updateRows[j].id );
								if ( k != -1 )  {
									if (feeds[k].is_delete) {
										deleteRows.push(feeds[k].id);	
									}
									else {
										list_sql.push({ sql: SQL_UPDATE, 
														data: [ feeds[k].author,
													 			feeds[k].title,
													 			feeds[k].text,
													 			feeds[k].visual,
													 			feeds[k].show,
													 			feeds[k].editedon,
													 			feeds[k].category_id,
													 			feeds[k].id ] });
										feeds[k].mark = updateRows[j].mark;
									}	
								}
							}
							next();
						}
						else {
							next();
						}
					},
					function(next) {			// delete
						if (deleteRows.length>0) {
							list_sql.push({ sql: SQL_DELETE + '('+	deleteRows.join(',') + ')',  data: [ ] });
						}
						next();
					},
					function(next) {			// insert

						if (feeds.length>0) {

							var k = 0;
							var sql, t, d = [];
							for (var i=0; i<feeds.length; i++) {

								if ( _no_insert( feeds[i].id ) ) continue;

								t = "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

								d.push( feeds[i].id.toString() );
								d.push( feeds[i].category_id.toString() );
								d.push( (feeds[i].author ? feeds[i].author : '') );
								d.push( (feeds[i].title ? feeds[i].title : '') );
								d.push( (feeds[i].text ? feeds[i].text : '') );
								d.push( (feeds[i].visual ? feeds[i].visual : '') );
								d.push( feeds[i].show.toString() );
								d.push( feeds[i].mark.toString() );
								d.push( feeds[i].createdon.toString() );
								d.push( feeds[i].editedon.toString() );
								d.push( feeds[i].vers.toString() );
								d.push( (feeds[i].feed_url ? feeds[i].feed_url : '') );
								d.push( (feeds[i].feed_type ? feeds[i].feed_type : '') );

								if (k == 0) {
									sql = SQL_INSERT + t;
								}
								else {
									sql += ', ' + t;	
								}

								k++;

								if (k == 30) {
									list_sql.push({sql: sql, data: d });
									k = 0;
									d = []
								}	
							}	

							if (k>0) {
								list_sql.push({sql: sql, data: d });
							}

							next();
						}
						else {
							next();
						}


					},
					function(next) {			// подправим отображение на экране

						if (list_sql.length>0) {

							fvdSingleDownloader.Utils.Async.arrayProcess(list_sql, function(x, apNext) {

								self.query(x.sql, x.data, function(error, rows){

									console.log(x, error, rows);

									apNext();

								});
									
							}, function() {		

								callback();

							});
						}
						else {
							callback();
						}

					}
				]);

				// ------------------------
				function _find( id ) {
					for (var i=0; i<feeds.length; i++) {
						if (feeds[i].id == id) return i;
					} 
					return -1;
				}
				// ------------------------
				function _no_insert( id ) {
					for (var i=0; i<updateRows.length; i++) {
						if (updateRows[i].id == id) return true;
					} 
					return false;
				}

			}

			// ------------------------------------------------
			// читаем все feed
			this.read = function(params, callback ){

				var feeds = [];

				fvdSingleDownloader.Utils.Async.arrayProcess(params, function(pp, apNext) {

					var sql = 'SELECT  * FROM `feeds` WHERE category_id = ? AND createdon < ? ';
					var from = fvdSingleDownloader.Prefs.get( "show_source" );
					if (from != 'all') {
						var ff = JSON.parse(from);	
						if (ff.indexOf("rss") != -1) ff.push("feedly");
						var str = "";
						for (var i=0; i<ff.length; i++)  str += (i>0 ? "," : '') + '"' + ff[i] + '"';
						sql += " AND feed_type IN ( "+str+" ) ";
					}
					sql += ' ORDER BY createdon DESC LIMIT 0,20';

					self.query(sql, [pp['category_id'], pp['last_createdon']], function(err, data){

						if (!err) {
							for (var j=0; j<data.length; j++)  feeds.push(data[j]);
						}
						else {
							console.log(err);
						}

						apNext();
					});

				}, function() {

					//console.log(feeds);

					callback(feeds);

				});
			}

			// ------------------------------------------------
			// подсчитаем все feed
			this.count_no_mark = function(category, callback ){

				if ( !category || category.length==0 ) return callback(0);

				var ss = '';
				var from = fvdSingleDownloader.Prefs.get( "show_source" );
				if (from != 'all') {
					var ff = JSON.parse(from);	
					if (ff.indexOf("rss") != -1) ff.push("feedly");
					var str = "";
					for (var i=0; i<ff.length; i++)  str += (i>0 ? "," : '') + '"' + ff[i] + '"';
					ss = " AND feed_type IN ( "+str+" ) ";
				}				

				var counts = {};

				fvdSingleDownloader.Utils.Async.arrayProcess(category, function(cat, apNext) {

					var sql = 'SELECT count(*) k FROM `feeds` WHERE category_id = '+cat+' AND mark=0 '+ss;

					self.query(sql, [], function(err, data){

						if (!err && data.length>0) {
							counts[cat] = data[0].k;
						}
						else {
							console.log(err);
						}

						apNext();
					});

				}, function() {

					callback(counts);

				});

			}

			// ------------------------------------------------
			// ------------------------------------------------
			// изменяем маркировку
			this.mark = function( id, value, callback ){

				self.query("UPDATE `feeds` SET `mark` = ? WHERE `id` = ? ", [value, id], function(){
					if (callback) callback();
				});

			}

			// ------------------------------------------------
			// изменяем маркировку списком
			this.mark_list = function( list, callback ){

				var sql = "UPDATE `feeds` SET `mark` = 1 WHERE `id` IN ("+list.join(",")+")";

				self.query(sql, [], function(){
					if (callback) callback();
				});

			}

			// ------------------------------------------------
			// изменяем маркировку категории
			this.mark_category = function( category_id, callback ){

				self.query("UPDATE `feeds` SET `mark` = 1 WHERE `category_id` = ? ", [category_id], function(){
					if (callback) callback();
				});

			}

			// ------------------------------------------------
			// удаляем новость
			this.delete = function( id, callback ){

				self.query("DELETE FROM `feeds` WHERE `id` = ? ", [id], function(){
					if (callback) callback();
				});

			}

			// ------------------------------------------------
			// удаляем новость списком
			this.delete_list = function( list, callback ){

				var sql = "DELETE FROM `feeds` WHERE `id` IN ("+list.join(",")+")";

				self.query(sql, [], function(){
					if (callback) callback();
				});

			}

			// удаляем новости этой категории
			this.delete_category = function( category_id, callback ){

				self.query("DELETE FROM `feeds` WHERE `category_id` = ? ", [category_id], function(e){
					if (callback) callback();
				});

			}

			// ------------------------------------------------
			this.enable_version_feed = function( ){
				return VERSION_FORMAT_FEED;
			}

		}

		this.WebSQL = new WebSQL();

	}).apply(fvdSingleDownloader);

}
else
{
	fvdSingleDownloader.WebSQL = chrome.extension.getBackgroundPage().fvdSingleDownloader.WebSQL;
}
