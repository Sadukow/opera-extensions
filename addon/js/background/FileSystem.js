if (window == chrome.extension.getBackgroundPage()) {

	(function(){
		'use strict'
	
		var FileSystem = function(){

			const DEBUG = true;

			var self = this;
			
			var textFile = null;
			var error;
			
			// ===============================================================
			this.init = function(){
			
				console.log("FileSystem - init ");
				
				// ---------------------------  SendRequest
				chrome.extension.onRequest.addListener ( function(request, sender, sendResponse) {  
					if (request.action == 'files_delete') {
						self.clearFileSystem();
					}	
					else if (request.action == 'remove_file') {
						self.removeFile(request.filename);
					}	
					else if (request.action == 'load_file') {
						self.loadFile(request.url, sendResponse);
					}	
				});
				
				// очистим файловую систему	
				self.clearFileSystem();
				
			}
			
			// ===============================================================
			this.initFileSystem = function(){
				
				function onInitFs(fs) {
					if (DEBUG) console.log('Opened file system: ' + fs.name);
					var dirReader = fs.root.createReader();
					var readEntries = function() {
						dirReader.readEntries (function(results) {
							if (results.length>0) {
								results.forEach(function(entry, i) {
									entry.remove(function() {
										if (DEBUG) console.log('File removed.', entry.fullPath);
									}, self.errorHandler);
								});								
							} 
						}, self.errorHandler);
					  };
					readEntries();
				}

				window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;				
				var requestedBytes = 5*1024*1024*1024; 
				navigator.webkitTemporaryStorage.requestQuota(requestedBytes, function(grantedBytes) {
					_grantedBytes = grantedBytes;
					window.webkitRequestFileSystem(window.PERSISTENT, grantedBytes, onInitFs, self.errorHandler);
				}, self.errorHandler);				
				
			}
			
			// -------------------------------------------------------------------
			this.errorHandler = function(e){
				
				console.log(e);
				var msg = '';

				switch (e.code) {
					case FileError.QUOTA_EXCEEDED_ERR:
					  msg = 'QUOTA_EXCEEDED_ERR';
					  break;
					case FileError.NOT_FOUND_ERR:
					  msg = 'NOT_FOUND_ERR';
					  break;
					case FileError.SECURITY_ERR:
					  msg = 'SECURITY_ERR';
					  break;
					case FileError.INVALID_MODIFICATION_ERR:
					  msg = 'INVALID_MODIFICATION_ERR';
					  break;
					case FileError.INVALID_STATE_ERR:
					  msg = 'INVALID_STATE_ERR';
					  break;
					default:
					  msg = 'Unknown Error';
					  break;
				};

				console.log('Error: ' + msg);
			}
			
			// ===============================================================
			this.clearFileSystem = function(){

				function onInitFs(fs) {
					if (DEBUG) console.log('Opened file system: ' + fs.name);
					var dirReader = fs.root.createReader();
					var readEntries = function() {
						dirReader.readEntries (function(results) {
							if (results.length>0) {
								results.forEach(function(entry, i) {
									entry.remove(function() {
										if (DEBUG) console.log('File removed.', entry.fullPath);
									}, self.errorHandler);
								});	
								readEntries();	
							} 
						}, self.errorHandler);
					  };
					readEntries();
				}	
				
				fsReq(onInitFs);

			}
			
			// ===============================================================
			this.removeFile = function(fileName){

				fsReq(function(fs) {
					fs.root.getFile(fileName, {create: false}, function(file) {
						file.remove(function() {
							if (DEBUG) console.log('File: ',fileName,'- removed.');
						});
					});
				});
				
			}
			
			this.removeListFile = function(list){

				fsReq(function(fs) {
					list.forEach(function(filename, i) {
						fs.root.getFile(filename, {create: false}, function(file) {
							file.remove(function() {
								if (DEBUG) console.log('File: ',filename,'- removed.');
							});
						});
					});								
				});
				
			}
			
			// ===============================================================
			this.writeFile = function(fileName, blob, callback){
				
				write_file(fileName, blob, callback);
				
			}

			this.readFile = function(fileName, callback){

				fsReq(function(fs) {
					fs.root.getFile(fileName, {}, function(fileEntry) {
						
						fileEntry.file(function(file) {
							
							var reader = new FileReader();
						    reader.onloadend = function(e) {
							   var arrayBuffer = new Uint8Array(reader.result);
							   //var arrayBuffer = new Uint8Array(e.target.result);
								callback(arrayBuffer);	
						    };

						    reader.readAsArrayBuffer(file);
						   
						}, self.errorHandler);
					
					});
				});
			}	
			
			this.isFile = function(fileName, callback){

				fsReq(function(fs) {
					fs.root.getFile(fileName, {}, function(fileEntry) {
						if (fileEntry.isFile) {
							callback({error: false});
						}
						else {	
							callback({error: true});						
						}
					}, function(){
						callback({error: true});						
					});
				});
			}	
			
			
			// ===============================================================
			this.saveAllFiles = function(list){
				
				if (typeof list == 'undefined') list = null;
				
				var k = 0;

				function onInitFs(fs) {
					console.log('Opened file system: ' + fs.name);
					
					if (list) {
						list.forEach(function(filename, i) {
							fs.root.getFile(filename, {create: false}, function(file) {
								var url = 'filesystem:chrome-extension://'+chrome.i18n.getMessage('@@extension_id')+'/persistent'+file.fullPath;
								chrome.downloads.download({
									url: url,
									filename:  file.name,
									saveAs: true 
									},
									function (downloadId) {
										if (DEBUG) console.log(file.name, 'DOWNLOAD sucess' );
									}		
								);
							});
						});								
					}
					else {
						var dirReader = fs.root.createReader();
						var readEntries = function() {
							dirReader.readEntries (function(results) {
								if (results.length>0) {
									results.forEach(function(entry, i) {
										k++;
										if (k>20) return;
										if (DEBUG) console.log('Download: ', entry);
										var url = 'filesystem:chrome-extension://'+chrome.i18n.getMessage('@@extension_id')+'/persistent'+entry.fullPath;
										chrome.downloads.download({
											url: url,
											filename:  entry.name,
											saveAs: true 
											},
											function (downloadId) {
												console.log(entry.fullPath, 'DOWNLOAD sucess' );
												fs.root.getFile(entry.name, {create: false}, function(file) {
													file.remove(function() {
														if (DEBUG) console.log('File: ',entry.name,'- removed.');
													});
												});
											}		
										);
									});								
								} 
							}, self.errorHandler);
						  };
						readEntries();
					}	
				}	
				
				fsReq(onInitFs);

			}
			
			// ---------------------------
			function fsReq(cb) {
			  webkitRequestFileSystem(PERSISTENT, 5 * 1024 * 1024 * 1024, cb, self.errorHandler);
			}
			// ---------------------------
			function write_file(fileName, blob, cb) {
				
				var error;
				fsReq(function(fs) {
					fs.root.getFile(fileName, {create: true}, function(file) {
						file.createWriter(function(writer) {
							writer.onwriteend = function() {
								if (DEBUG) console.log("write success", fileName);
								cb(fileName);
							};
							writer.onerror = function(err) {
								error = err;
								console.log('ERROR fileSystem:', err);
							};
					
							writer.seek(writer.length);
							writer.write(blob);
						});
					});
				});
			}
			
			// ===============================================================
			// fileName		- С„Р°Р№Р» РІ С„Р°Р№Р»РѕРІРѕР№ СЃРёСЃС‚РµРјРµ
			// dirPath	    - РёРјСЏ РїР°РїРєРё
			// downloadName - РёРјСЏ С„Р°Р№Р»Р°
			// ext			- СЂР°СЃС€РёСЂРµРЅРёРµ С„Р°Р№Р»Р°
			// save         - РґРёР°Р»РѕРі
			this.saveVideo = function(params, callback){
				
				var save_as = params.save ? params.save : false;
				
				var url = 'filesystem:chrome-extension://'+chrome.i18n.getMessage('@@extension_id')+'/persistent/'+params.fileName;

				var file_name = self.removeChars(params.downloadName);
				
				var path_name = params.dirPath ? self.removeChars(params.dirPath)+'/' : '';

				chrome.downloads.download({
										url: url,
										filename:  path_name + file_name + '.' + params.ext,
										saveAs: save_as 
										},
										function (downloadId) {
											if (DEBUG) console.log('DOWNLOAD', downloadId );
											if (callback) callback(downloadId);
										}		
									);
				
			}
			
			// ===============================================================
			var lastMediaNumber = 0;
			this.Unique = function(){

				lastMediaNumber++;
				var str = '00000' + lastMediaNumber.toString();
				str = 'm'+str.substring(str.length - 3, str.length);
				return str;
				
			}
			
			// ===============================================================
			this.concat = function(listFile, fileName, callback){
				
				fvdSingleDownloader.Utils.Async.arrayProcess( listFile, function( filename, apCallback ){

							self.readFile( filename, function( data ){
								if (data) {
									var blob = new Blob([data], {type: "video/mp4"});
									write_file(fileName, blob, function(){
										apCallback(true);
									});
								}	
							});
				
						}, function(){
							callback(true);
						} 
				);
				
			}
			
			this.playlist = function(m3u8File, fileName, callback){
				
				if (DEBUG) console.log(m3u8File, fileName);
				
				var listFile = [];
				
				fvdSingleDownloader.Utils.Async.chain( [
				
					function( chainCallback ){		// 
					
							self.readFile( m3u8File, function( data ){
								if (data) {
									var text = fvdSingleDownloader.jspack.bytesToString(data);
									var line = text.split('\n');
				
									for (var i=0; i<line.length; i++) {
										if (line[i] && line[i].indexOf('#') != 0) {   
											listFile.push(line[i]);
										}
									}

									chainCallback();
								}	
							});				
					},
								
					function( chainCallback ){			// 
					
						fvdSingleDownloader.Utils.Async.arrayProcess( listFile, function( filename, apCallback ){

									self.readFile( filename, function( data ){
										if (data) {
											var blob = new Blob([data], {type: "video/mp4"});
											write_file(fileName, blob, function(){
												apCallback(true);
											});
										}	
									});
						
								}, function(){
									callback(true);
								} 
						);
					}
				] );
			}

			// ===============================================================
	        const REMOVE_CHARS = /[\\/\?<>\:\*\|\":\@\.']|[\x00-\x1f\x80-\x9f]/g;

			this.removeChars = function( text, dir ){
				
				if ( !text )  return 'media';
			
				var str = text.replace(REMOVE_CHARS, "");
				
				var arr = fvdSingleDownloader.utf16.toBytes(str);
				
				for (var i=0; i<arr.length; i++) {
					if (arr[i] == 8234) arr[i] = 95;
				}	
				
				str = fvdSingleDownloader.utf16.fromBytes(arr);
				str = str.trim();
				
				return str;	
			}	
			
			// ===============================================================
			function IsRequestSuccessful (httpReq) {
				var success = (httpReq.status == 0 || (httpReq.status >= 200 && httpReq.status < 300) || httpReq.status == 304 || httpReq.status == 1223);
				return success;
			}
			this.request = function( options ){
				
				if (!DEBUG) console.log( 'request: ', options.url );
				try	{
					var httpRequest = new XMLHttpRequest(); 
					
					httpRequest.open ("GET", url, true);
					httpRequest.responseType = "arraybuffer"; 
					httpRequest.onreadystatechange = function() {
							if (httpRequest.readyState==4) {
								if (IsRequestSuccessful (httpRequest)) 	{

									callback({ error: false, 
											   response: httpRequest.response,  
											   type: httpRequest.getResponseHeader("Content-Type") 
											 });	
								}
								else 	{
									callback({ error: true });	
								}
								//delete httpRequest;
								httpRequest = null;
							}
					};
					httpRequest.send();
					
					return httpRequest;
				}
				catch(err)	{
					console.log('ERROR:', err);
					callback({ error: true });
				}
				
			}	
			// ---------------------------------------------------------------
			this.loadFile = function( url, callback ){
			
				filename = (new Date().getTime()).toString();
				if (DEBUG) console.log(filename);
				
				this.request( url, function( rez ) {
					
					if ( !rez.error ) {
						var blob = new Blob([rez.stream], {type: rez.type});
						write_file(filename, blob, function(){
							callback(filename);
						});
					}
					else {
						console.log('===============ERROR===================== httpRequest ==========');
					}	
					
				});
			
			}	
			// ---------------------------------------------------------------
			this.loadText = function( url, callback ){
			
				var httpRequest = new XMLHttpRequest(); 
				httpRequest.open ("GET", url, true);
				httpRequest.onreadystatechange = function() {
					if (httpRequest.readyState==4) {
						if (IsRequestSuccessful (httpRequest)) 	{
					
							var x = httpRequest.getResponseHeader("Content-Length");
							var t = httpRequest.getResponseHeader("Content-Type");
							callback({error: false, response: httpRequest.response, length: x, type: t});

						}
						else 	{
							callback({error:  true});
							console.log('===============ERROR===================== httpRequest ==========');
						}
					}
				};
				httpRequest.send();
			}	
			// ---------------------------------------------------------------
			this.get = function( url, funcProgress, funcFinish ){
			
				var httpRequest = new XMLHttpRequest(); 
				httpRequest.open ("GET", url, true);
				httpRequest.responseType = "arraybuffer"; 
				
				httpRequest.addEventListener("progress", _progress, false);
				httpRequest.addEventListener("load", _load, false);
				httpRequest.addEventListener("error", _error, false);
				httpRequest.addEventListener("abort", _error, false);				
				httpRequest.send();
				
				return httpRequest;
				// -----------------------
				function _progress(ev) {
					if (ev.lengthComputable) {
						funcProgress(ev.loaded, ev.total);
					}
				}
				// -----------------------
				function _load(ev) {
					if (httpRequest.status == 200) {
						funcFinish({ error: false, 
									 stream: new Uint8Array(httpRequest.response),  
									 type: httpRequest.getResponseHeader("Content-Type") 
								   })
					}
				}
				// -----------------------
				function _error(ev) {
					console.log('ERROR: loadFile', httpRequest.statusText, ev.type, httpRequest.status);
					funcFinish({ error: true });
				}
			}	
			


			
			
		}
		
		this.FileSystem = new FileSystem();
		
	}).apply(fvdSingleDownloader);
	
}
else
{
	fvdSingleDownloader.FileSystem = chrome.extension.getBackgroundPage().fvdSingleDownloader.FileSystem;
}
