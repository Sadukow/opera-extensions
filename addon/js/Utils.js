
function _b( v ){
	if( typeof v == "boolean" ){
		return v;
	}
	
	if( v == "true" ){
		return true;
	}

	return false;
}

function _isb( v ){
	if( typeof v == "boolean" ){
		return true;
	}
	
	if( v == "true" || v == "false" ){
		return true;
	}

	return false;
}

function _r( v ){
	
	if( _isb( v ) ){
		return _b(v);
	}
	return v;
	
}

// -----------------------------------------------------------------------------
if (typeof HTMLElement.prototype.removeClass !== "function")  {			
	HTMLElement.prototype.removeClass = function(remove) {

		var newClassName = "";
		var i;
		var classes = this.className.split(" ");
	
		for(i = 0; i < classes.length; i++) 
		{
			if(classes[i] !== remove) 
			{
				newClassName += classes[i] + " ";
			}
		}
		this.className = newClassName;
	}	
}			
// -----------------------------------------------------------------------------
if (typeof HTMLElement.prototype.addClass !== "function")  {			
	HTMLElement.prototype.addClass = function(add) {

		var newClassName = "";
		var i;
		var classes = this.className.split(" ");
		var flag = true;
	
		for(i = 0; i < classes.length; i++) 
		{
			if(classes[i] === add)  flag = false;
			newClassName += classes[i] + " ";
		}
		if (flag) newClassName = newClassName + " " + add;
		
		this.className = newClassName;
	}	
}			

// -----------------------------------------------------------------------------
(function(){

	var Utf8 = function(){
		
	}

	Utf8.prototype = {

		// public method for url encoding
		encode : function (string) {
			string = string.replace(/\r\n/g,"\n");
			var utftext = "";
			for (var n = 0; n < string.length; n++) {
				var c = string.charCodeAt(n);
				if (c < 128) {
					utftext += String.fromCharCode(c);
				}
				else if((c > 127) && (c < 2048)) {
					utftext += String.fromCharCode((c >> 6) | 192);
					utftext += String.fromCharCode((c & 63) | 128);
				}
				else {
					utftext += String.fromCharCode((c >> 12) | 224);
					utftext += String.fromCharCode(((c >> 6) & 63) | 128);
					utftext += String.fromCharCode((c & 63) | 128);
				}
			}
			return utftext;
		},
		// public method for url decoding
		decode : function (utftext) {
			var string = "";
			var i = 0;
			var c = c1 = c2 = 0;
			while ( i < utftext.length ) {
				c = utftext.charCodeAt(i);
				if (c < 128) {
					string += String.fromCharCode(c);
					i++;
				}
				else if((c > 191) && (c < 224)) {
					c2 = utftext.charCodeAt(i+1);
					string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
					i += 2;
				}
				else {
					c2 = utftext.charCodeAt(i+1);
					c3 = utftext.charCodeAt(i+2);
					string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
					i += 3;
				}
			}
			return string;
		}
	}
	
	this.Utf8 = new Utf8();

	
	var Utils = function(){
		
	}
	
	Utils.prototype = {
		
		_isFirstRun: false,
		_isVersionChanged: false,
		
		
		
		extractExtension: function( path ){
			try
			{
				var tmp = path.split("?");
				tmp = tmp[0].split( "." );
				var ext = tmp[tmp.length-1].toLowerCase();		
				return ext;	
			}
			catch(ex)
			{
				return null;
			}	
		},
		
		extractPath: function( path ){
			if ( !path ) return null;
			try{
				var name = null, 
					ext = null,
					tmp = path;
					
				var k = tmp.indexOf('?');
				if ( k != -1 )   tmp = tmp.substring(0, k);
				k = tmp.indexOf('#');
				if ( k != -1 )   tmp = tmp.substring(0, k);

				tmp = tmp.split( "/" );
				tmp = tmp[tmp.length-1].toLowerCase();
				var k = tmp.lastIndexOf('.');
				if ( k != -1 )  {
					name = tmp.substring(0, k);
					ext = tmp.substring(k+1, tmp.length);
					return {ext: ext.toLowerCase(), name: name};
				}
				
				return null;
			}
			catch(ex){
				console.log(ex);
				return null;
			}
		},

		getJSON: function( data, type ){

		    if (type == '/')  return data;

		    var p = type.split('/');

		    var h = data;
		    for (var i=0; i<p.length; i++) {
		        if ( h[p[i]] ) {
		            h = h[p[i]];
		        }
		    }

		    return h;
		},

		jsonToDOM: function( jsonTemplate, elem ){
		
			if (!jsonTemplate) return;

			while (elem.firstChild)  elem.removeChild(elem.firstChild);

			jsonTemplate.forEach(function(part) {

				if(["b", "span"].indexOf(part.tag) == -1)   return;

				var el = document.createElement(part.tag);
				el.textContent = part.content;

				if (part.class) el.setAttribute('class', part.class)
				if (part.style) el.setAttribute('style', part.class)
			  
				elem.appendChild(el);
			});
		},

		closest: function( target, selector ){
		
			while (target) {
				if (target.matches && target.matches(selector)) return target;
				target = target.parentNode;
				if (target.tagName == 'body') return null;
			}
			return null;	

		},
		
		getActiveTab: function( callback ){

			try {
				chrome.tabs.query( {
								active: true,
								currentWindow: true
							}, function( tabs ){
										if( tabs.length == 0 )	{
											callback( null );
										}
										else  {
											callback( tabs[0] );
										}
						} );
			}
			catch(ex) {
				callback(null);
			}	
		},
		
		decodeHtmlEntities: function( text ){
			var tmp = document.createElement("div");
			tmp.innerHTML = text;
			return tmp.textContent;
		},
		
		copyToClipboard: function( text ){
			var bg = chrome.extension.getBackgroundPage();
			
			var clipboardholder = bg.document.getElementById("clipboardholder");			
			clipboardholder.value = text;			
			clipboardholder.select();			
			bg.document.execCommand("Copy");
		},
		
		getOffset: function( obj ) {
			var curleft = curtop = 0;
			if (obj.offsetParent) {
				do {
					curleft += obj.offsetLeft;
					curtop += obj.offsetTop;
				}
				while(obj = obj.offsetParent);
			}
			
			
			
			return {
				"left": curleft,
				"top": curtop
			};
		},
		
		getOS: function(){
			
			if (navigator.appVersion.indexOf("Mac OS X") != -1) {
				
				return "mac";
				
			}
			else{
				
				return "win";
				
			}
			
		},
		
		get_X_INF: function( str ){
			var info = {};

			var m = str.match( /\s*([^=\s]+)\s*=\s*(?:\"([^\"]*?)\"|([^,]*)),?/gm ); 
			for (var jj=0; jj<m.length; jj++)  {
				var mm = m[jj].trim().match( /^([^=\s]+)\s*=\s*(?:\"([^\"]*?)\"|([^,]*)),?$/i ); 
				if (mm) {
					var x1 = mm[1];    
					var x2 = mm[2] || mm[3];    
					info[ x1.trim() ] = x2.trim();
				}
			}      

			return info;    
		},
		
		incrementRotateCounter: function( file ){
			
			this.downloadFromUrl( file, function( content ){
				
				if( !content ){
					callback( null );
					return;
				}
				
				var lastIndex = fvdSingleDownloader.Prefs.get( "ad_rotation.last_used_line." + file );
				
				if( lastIndex === null ){
					lastIndex = -1;
				}
				
				lastIndex = parseInt( lastIndex );
				
				var index = lastIndex + 1;
								
				var lines = content.split("\n");				
					
				if( lines.length < index + 1 || index < 0 ){
					index = 0;
				}		
				
				fvdSingleDownloader.Prefs.set( "ad_rotation.last_used_line." + file, index )
				
			} );
			
			
		},
		
		rotateText: function( file, callback ){
			
			this.downloadFromUrl( file, function( content ){
				
				if( !content ){
					callback( null );
					return;
				}
				
				var lastIndex = fvdSingleDownloader.Prefs.get( "ad_rotation.last_used_line." + file );
				
				if( lastIndex === null ){
					lastIndex = -1;
				}
				
				lastIndex = parseInt( lastIndex );
				
				var index = lastIndex + 1;
								
				var lines = content.split("\n");				
					
				if( lines.length < index + 1 || index < 0 ){
					index = 0;
				}		
				
				callback( lines[index] );
				
			} );
			
		},
		
		downloadFromUrl: function( url, callback ){
			this.downloadFromUrlsList( [url], callback );
		},		
		
		downloadFromUrlsList: function( listUrls, callback ){
			
			var that = this;
			
			that.Async.arrayProcess( listUrls, function( url, arrayProcessCallback ){
				
				var xhr = new XMLHttpRequest();
				
		        xhr.open('GET', url);
		        xhr.setRequestHeader('Cache-Control', 'no-cache');
		        xhr.onload = function( ){
					
					if( xhr.status != 200 ){
						arrayProcessCallback();
					}
					else{
						callback( xhr.responseText );
					}
					
				}
				
				xhr.onerror = function(){
					arrayProcessCallback();
				}
				
		        xhr.send(null);
				
			}, function(){
				callback( null );
			} );
			

			
		},
		
		bytesToKb: function( bytes ){
			return Math.round( 100 * bytes / 1024 ) / 100;
		},
		bytesToMb: function( bytes ){
			return Math.round( 100 * bytes / 1024 / 1024 ) / 100;
		},
		bytesToGb: function( bytes ){
			return Math.round( 100 * bytes / 1024 / 1024 / 1024 ) / 100;
		},
		
		getSizeByUrl: function( url, callback ){
			var ajax = new XMLHttpRequest();
			ajax.open('GET', url);
			ajax.setRequestHeader('Cache-Control', 'no-cache');
			ajax.url = url;
					
			ajax.onreadystatechange = function() {
			
							if( this.readyState == 3 )
							{
								var size = this.getResponseHeader("Content-Length");
								if (this.status == 200) 
								{
									if( size )
									{
										callback( size );		
										this.abort();
									}
								}				
							}
				
							if (this.readyState == 4) 
							{
								if (this.status == 200) 
								{
									var size = null;
									try
									{
										size = this.getResponseHeader("Content-Length");
									}
									catch(ex){}
	
									callback( size );					
								}
								else
								{
									callback( null );
								}
							}
				
						}		
			
			ajax.send( null );
		},

		upperFirst: function( str ){

			if (!str) return str;
			return str[0].toUpperCase() + str.slice(1);

		},	

		getAllTabs: function( callback ){
			chrome.windows.getAll( {populate:true}, function(wins) {
					if (wins && wins.length>0) {
						for(var t=0; t<wins.length; t++)	{
							if (wins[t].tabs) {
								var win = wins[t].tabs;
								for(var r=0; r<win.length; r++)	{
									var tab = win[r];
									if(tab.url.indexOf("http")==0){
										callback(tab);
									}
								}
							}
						}
					}
			});
		},
		
		Async: {
			
			chain: function( callbacksChain ){
				
				var dataObject = {};
				
				var f = function(){
					if( callbacksChain.length > 0 ){
						var nextCallback = callbacksChain.shift();						
						nextCallback( f, dataObject );
					}					
				}
				
				f();
				
			},
			
			arrayProcess: function( dataArray, callback, finishCallback ){
				
				var f = function( i ){
					
					if( i >= dataArray.length ){
						finishCallback();
					}
					else{
						callback( dataArray[i], function(){
							f(i + 1);
						} );
					}
					
				}	
				
				f(0);			
				
			}
			
		},
		
		isFirstRun: function(){
						
			if( this._isFirstRun ){
				return this._isFirstRun;
			}
			
			if( _b( fvdSingleDownloader.Prefs.get( "is_first_run" ) ) ){
				this._isFirstRun = true;
				return true;
			}
			
			return false;
			
		},
		
		isVersionChanged: function(){
			
			if( this._isVersionChanged ){
				return this._isVersionChanged;
			}
			
			var app = chrome.app.getDetails();
			
			if( fvdSingleDownloader.Prefs.get( "last_run_version" ) != app.version ){
				this._isVersionChanged = true;
				fvdSingleDownloader.Prefs.set( "last_run_version", app.version );
			}
			
			return this._isVersionChanged;
			
		},

		parseUrl: function(str, component){			
			
		    var key = ['source', 'scheme', 'authority', 'userInfo', 'user', 'pass', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'fragment'], ini = (this.php_js && this.php_js.ini) ||
		    {}, mode = (ini['phpjs.parse_url.mode'] &&
		    ini['phpjs.parse_url.mode'].local_value) ||
		    'php', parser = {
		        php: /^(?:([^:\/?#]+):)?(?:\/\/()(?:(?:()(?:([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?()(?:(()(?:(?:[^?#\/]*\/)*)()(?:[^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
		        strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
		        loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/\/?)?((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/ // Added one optional slash to post-scheme to catch file:/// (should restrict this)
		    };
		    
		    var m = parser[mode].exec(str), uri = {}, i = 14;
		    while (i--) {
		        if (m[i]) {
		            uri[key[i]] = m[i];
		        }
		    }
		    
		    if (component) {
		        return uri[component.replace('PHP_URL_', '').toLowerCase()];
		    }
		    if (mode !== 'php') {
		        var name = (ini['phpjs.parse_url.queryKey'] &&
		        ini['phpjs.parse_url.queryKey'].local_value) ||
		        'queryKey';
		        parser = /(?:^|&)([^&=]*)=?([^&]*)/g;
		        uri[name] = {};
		        uri[key[12]].replace(parser, function($0, $1, $2){
		            if ($1) {
		                uri[name][$1] = $2;
		            }
		        });
		    }
		    delete uri.source;
		    return uri;
		},
		
		// --------------------------------------------------------------------------------------------------------- Парсер URL
		parse_URL: function(url)	{
		
			const EXTENSIONS = ["htm", "html", "zhtml", "zhtm", "shtml", "php", "asp", "aspx", "ashx"];
			
			var pattern =
					// Match #0. URL целиком (#0 - это HREF, в терминах window.location).
					// Например, #0 == "https://example.com:8080/some/path/index.html?p=1&q=2&r=3#some-hash"
					"^" +
					// Match #1 & #2. SCHEME (#1 - это PROTOCOL, в терминах window.location).
					// Например, #1 == "https:", #2 == "https"
					"(([^:/\\?#]+):)?" +
					// Match #3-#6. AUTHORITY (#4 = HOST, #5 = HOSTNAME и #6 = PORT, в терминах window.location)
					// Например, #3 == "//example.com:8080", #4 == "example.com:8080", #5 == "example.com", #6 == "8080"
					"(" +
							"//(([^:/\\?#]*)(?::([^/\\?#]*))?)" +
					")?" +
					// Match #7. PATH (#7 = PATHNAME, в терминах window.location).
					// Например, #7 == "/some/path/index.html"    
					"([^\\?#]*)" +
					// Match #8 & #9. QUERY (#8 = SEARCH, в терминах window.location).
					// Например, #8 == "?p=1&q=2&r=3", #9 == "p=1&q=2&r=3"    
					"(\\?([^#]*))?" +
					// Match #10 & #11. FRAGMENT (#10 = HASH, в терминах window.location).
					// Например, #10 == "#some-hash", #11 == "some-hash"
					"(#(.*))?" + "$";			
					
					
					//var pattern = "^(([^:/\\?#]+):)?(//(([^:/\\?#]*)(?::([^/\\?#]*))?))?([^\\?#]*)(\\?([^#]*))?(#(.*))?$";
			var rx = new RegExp(pattern);
			var parts = rx.exec(url);					

			var href = parts[0] || "";
			var protocol = parts[1] || "";			// http
			var host = parts[4] || "";				
			var hostname = parts[5] || "";			// example.com
			var port = parts[6] || "";
			var pathname = parts[7] || "/";			// /some/path/index.html
			var search = parts[8] || "";			// ?gst=2&
			var hash = parts[10] || "";				// #12
					
			// проверим не путь ли вместо хоста		
			if (hostname == "." || hostname == "..")
			{
				pathname = hostname + pathname;
				hostname = "";
			}
			if (hostname != "")
			{
				var arr = hostname.split('.');
				if (arr == null || arr.length == 1)
				{
					pathname = hostname + parts[7];
					hostname = "";
				}
				else if (arr.length == 2)
				{
					if (EXTENSIONS.indexOf(arr[1]) != -1)
					{
						pathname = hostname + parts[7];
						hostname = "";
					}	
				}
			}
				
			if (pathname != "")
			{
				var arr = pathname.split('/');
				var k = arr.length-1;
				var file = arr[k];
				//if (file.indexOf('.') == -1)
				//{
					//k++;
					//file = '';	
				//}	
				var path = "";
				for (var i = 0;  i < k; i++)
				{
					path += (i==0 ? "" : "/" ) + arr[i];
				}	
			}
			
			var name = "";
			var ext = "";
			if ( file != "" )
			{
				var pos = file.lastIndexOf('.');
				if (pos != -1 )
				{
					name = file.substr(0, pos);	
					ext = file.substr(pos+1, file.length);
				}
				else
				{
					name = file;
				}
			}
			
			return { url: url,
					 protocol: protocol, 
					 port: port,
					 hostname: hostname,  
					 pathname: pathname,  
					 search: search,  
					 hash: hash, 
					 path: path, 
					 file: file, 
					 name: name, 
					 ext: ext };
		},
		
		// --------------------------------------------------------------------------------------------------------- Собрать URL
		complitURL: function( arr )	{
			var x = arr.protocol + "//" + arr.hostname + arr.path + (arr.file != "" ? "/" : "") + arr.file;
			x += arr.search;
			if (arr.hash != "")
			{	
				x += (arr.search == "" ? "/" : "") + arr.hash;
			}	
			return x;
		},
		
		// ----------------------------------------
		convertURL: function(url)	{
			
			const VIDEO_EXTENSIONS = ["flv", "rm", "ram", "mpg", "mpeg", "avi", "qt", "wmv", "mov", "asf", "rbs", "movie", "divx", "mp4", "ogg", "mpeg4", "m4v", "webm", "rv", "vob", "asx", "ogm", "ogv" ];
			const AUDIO_EXTENSIONS = ["mp3", "ra", "rm", "mid", "wav", "aif", "flac", "midi", "aac" , "wma", "mka", "ape", "m4a"];
			const GAME_EXTENSIONS = ["swf"];
			const ARC_EXTENSIONS = ["zip","rar","7z", "jar", "bz2", "gz", "tar", "rpm", "lzma", "xz"];
			const EXE_EXTENSIONS = ["exe","msi","dmg", "bin", "xpi", "iso", "crx", "nex", "oex"];
			const IMAGE_EXTENSIONS = ["jpg", "jpeg", "gif", "png", "bmp", "ico", "tiff", "tif"];
			const HTTP_EXTENSIONS = ["htm", "html", "shtml", "js", "php", "asp", "aspx", "ashx"];
			const FILE_EXTENSIONS = ["doc", "xls", "docx", "xlsx", "pdf", "odf", "odt", "rtf"];
			
			var uu = this.parse_URL(url);
			if (uu.ext != "")
			{
				var t = "";
				if (VIDEO_EXTENSIONS.indexOf(uu.ext) != -1)        	t = 'video';
				else if (IMAGE_EXTENSIONS.indexOf(uu.ext) != -1)    t = 'image';
				else if (AUDIO_EXTENSIONS.indexOf(uu.ext) != -1)    t = 'audio';
				else if (GAME_EXTENSIONS.indexOf(uu.ext) != -1)     t = 'game';
				else if (ARC_EXTENSIONS.indexOf(uu.ext) != -1)      t = 'archiv';
				else if (HTTP_EXTENSIONS.indexOf(uu.ext) != -1)     t = 'http';
				else if (FILE_EXTENSIONS.indexOf(uu.ext) != -1)     t = 'file';
				else if (EXE_EXTENSIONS.indexOf(uu.ext) != -1)      t = 'file';
			
				return { url: url, ext: uu.ext, name: uu.name, type: t  };
			}
			else
			{
				return { url: url, ext: "", name: "", type: "" };
			}
			
		},

		convertURL_match: function(url)	{
			const VIDEO_MATCH = "/\.(?:mpeg|ra?m|avi|mp(?:g|e|4)|mov|divx|asf|qt|wmv|m\dv|rv|vob|asx|ogm|ogv|webm)$/i";
			const AUDIO_MATCH = "/\.(?:mp3|wav|og(?:g|a)|flac|midi?|rm|aac|wma|mka|ape)$/i";
			const IMAGE_MATCH = "/\.(?:jp(?:e?g|e|2)|gif|png|tiff?|bmp|ico)$/i";
			const DOC_MATCH = "/\.(?:pdf|xlsx?|docx?|odf|odt|rtf)$/i";
			const EXE_MATCH = "/\.(?:exe|msi|dmg|bin|xpi|iso)$/i";
			const ARC_MATCH = "/\.(?:z(?:ip|[0-9]{2})|r(?:ar|[0-9]{2})|jar|bz2|gz|tar|rpm|7z(?:ip)?|lzma|xz)$/i";
			const JPEG_MATCH = "/\.jp(e?g|e|2)$/i";		
		},
		
		check_enable_type: function(type)	{
		
			if ( (fvdSingleDownloader.noLink == true ) && ( (type == "link") || (type == "http") ) ) return false;
			if ( (fvdSingleDownloader.noImage == true ) && (type == "image") ) return false;
			if ( (fvdSingleDownloader.noFile == true ) && ( (type == "file") || (type == "archiv" ) ) ) return false;
			if ( (fvdSingleDownloader.noGame == true ) && (type == "game") ) return false;
			
			return true;
		},
		
		decode_unicode: function(str)	{
		
			var r = /\\u([\d\w]{4})/gi;
			str = str.replace(r, function (match, grp) {	return String.fromCharCode(parseInt(grp, 16)); });
			str = unescape(str);
			return str;
		},
		
		parseXml: function(xmlStr)	{
			
			var parseXml;
			
			if (typeof window.DOMParser != "undefined") {
				parseXml = function(xmlStr) {
					return ( new window.DOMParser() ).parseFromString(xmlStr, "text/xml");
				};
			} 
			else if (typeof window.ActiveXObject != "undefined" && new window.ActiveXObject("Microsoft.XMLDOM")) {
				parseXml = function(xmlStr) {
					var xmlDoc = new window.ActiveXObject("Microsoft.XMLDOM");
					xmlDoc.async = "false";
					xmlDoc.loadXML(xmlStr);
					return xmlDoc;
				};
			} 
			else {
				console.log("No XML parser found", xmlStr);
				return null;
			}			
		
			return parseXml(xmlStr);
		},
		
		xmlToJson: function(xml, tab)	{
		   var X = {
			  toObj: function(xml) {
				 var o = {};
				 if (xml.nodeType==1) {   // element node ..
					if (xml.attributes.length)   // element with attributes  ..
					   for (var i=0; i<xml.attributes.length; i++)
						  o["@"+xml.attributes[i].nodeName] = (xml.attributes[i].nodeValue||"").toString();
					if (xml.firstChild) { // element has child nodes ..
					   var textChild=0, cdataChild=0, hasElementChild=false;
					   for (var n=xml.firstChild; n; n=n.nextSibling) {
						  if (n.nodeType==1) hasElementChild = true;
						  else if (n.nodeType==3 && n.nodeValue.match(/[^ \f\n\r\t\v]/)) textChild++; // non-whitespace text
						  else if (n.nodeType==4) cdataChild++; // cdata section node
					   }
					   if (hasElementChild) {
						  if (textChild < 2 && cdataChild < 2) { // structured element with evtl. a single text or/and cdata node ..
							 X.removeWhite(xml);
							 for (var n=xml.firstChild; n; n=n.nextSibling) {
								if (n.nodeType == 3)  // text node
								   o["#text"] = X.escape(n.nodeValue);
								else if (n.nodeType == 4)  // cdata node
								   o["#cdata"] = X.escape(n.nodeValue);
								else if (o[n.nodeName]) {  // multiple occurence of element ..
								   if (o[n.nodeName] instanceof Array)
									  o[n.nodeName][o[n.nodeName].length] = X.toObj(n);
								   else
									  o[n.nodeName] = [o[n.nodeName], X.toObj(n)];
								}
								else  // first occurence of element..
								   o[n.nodeName] = X.toObj(n);
							 }
						  }
						  else { // mixed content
							 if (!xml.attributes.length)
								o = X.escape(X.innerXml(xml));
							 else
								o["#text"] = X.escape(X.innerXml(xml));
						  }
					   }
					   else if (textChild) { // pure text
						  if (!xml.attributes.length)
							 o = X.escape(X.innerXml(xml));
						  else
							 o["#text"] = X.escape(X.innerXml(xml));
					   }
					   else if (cdataChild) { // cdata
						  if (cdataChild > 1)
							 o = X.escape(X.innerXml(xml));
						  else
							 for (var n=xml.firstChild; n; n=n.nextSibling)
								o["#cdata"] = X.escape(n.nodeValue);
					   }
					}
					if (!xml.attributes.length && !xml.firstChild) o = null;
				 }
				 else if (xml.nodeType==9) { // document.node
					o = X.toObj(xml.documentElement);
				 }
				 else
					alert("unhandled node type: " + xml.nodeType);
				 return o;
			  },
			  toJson: function(o, name, ind) {
				 var json = name ? ("\""+name+"\"") : "";
				 if (o instanceof Array) {
					for (var i=0,n=o.length; i<n; i++)
					   o[i] = X.toJson(o[i], "", ind+"\t");
					json += (name?":[":"[") + (o.length > 1 ? ("\n"+ind+"\t"+o.join(",\n"+ind+"\t")+"\n"+ind) : o.join("")) + "]";
				 }
				 else if (o == null)
					json += (name&&":") + "null";
				 else if (typeof(o) == "object") {
					var arr = [];
					for (var m in o)
					   arr[arr.length] = X.toJson(o[m], m, ind+"\t");
					json += (name?":{":"{") + (arr.length > 1 ? ("\n"+ind+"\t"+arr.join(",\n"+ind+"\t")+"\n"+ind) : arr.join("")) + "}";
				 }
				 else if (typeof(o) == "string")
					json += (name&&":") + "\"" + o.toString() + "\"";
				 else
					json += (name&&":") + o.toString();
				 return json;
			  },
			  innerXml: function(node) {
				 var s = ""
				 if ("innerHTML" in node)
					s = node.innerHTML;
				 else {
					var asXml = function(n) {
					   var s = "";
					   if (n.nodeType == 1) {
						  s += "<" + n.nodeName;
						  for (var i=0; i<n.attributes.length;i++)
							 s += " " + n.attributes[i].nodeName + "=\"" + (n.attributes[i].nodeValue||"").toString() + "\"";
						  if (n.firstChild) {
							 s += ">";
							 for (var c=n.firstChild; c; c=c.nextSibling)
								s += asXml(c);
							 s += "</"+n.nodeName+">";
						  }
						  else
							 s += "/>";
					   }
					   else if (n.nodeType == 3)
						  s += n.nodeValue;
					   else if (n.nodeType == 4)
						  s += "<![CDATA[" + n.nodeValue + "]]>";
					   return s;
					};
					for (var c=node.firstChild; c; c=c.nextSibling)
					   s += asXml(c);
				 }
				 return s;
			  },
			  escape: function(txt) {
				 return txt.replace(/[\\]/g, "\\\\")
						   .replace(/[\"]/g, '\\"')
						   .replace(/[\n]/g, '\\n')
						   .replace(/[\r]/g, '\\r');
			  },
			  removeWhite: function(e) {
				 e.normalize();
				 for (var n = e.firstChild; n; ) {
					if (n.nodeType == 3) {  // text node
					   if (!n.nodeValue.match(/[^ \f\n\r\t\v]/)) { // pure whitespace text node
						  var nxt = n.nextSibling;
						  e.removeChild(n);
						  n = nxt;
					   }
					   else
						  n = n.nextSibling;
					}
					else if (n.nodeType == 1) {  // element node
					   X.removeWhite(n);
					   n = n.nextSibling;
					}
					else                      // any other node
					   n = n.nextSibling;
				 }
				 return e;
			  }
		   };
		   if (xml.nodeType == 9) // document node
			  xml = xml.documentElement;
		   var json = X.toJson(X.toObj(X.removeWhite(xml)), xml.nodeName, "\t");
		   
		   var ss = "{" + (json.replace(/\t|\n/g, "")) + "}";
		   return JSON.parse(ss)
		},		
		
		convertHex: {
			
			toBytes: function( text ){
				var result = [];
				for (var i = 0; i < text.length; i += 2) {
					result.push(parseInt(text.substr(i, 2), 16));
				}
				return result;
			},
			
			fromBytes: function( bytes ){
				var Hex = '0123456789abcdef';
                var result = [];
                for (var i = 0; i < bytes.length; i++) {
                    var v = bytes[i];
                    result.push(Hex[(v & 0xf0) >> 4] + Hex[v & 0x0f]);
                }
                return result.join(' ');
			}
			
		},		

		utf16to8: function(str)	{
		
			var out, i, len, c;

			out = "";
			len = str.length;
			for(i = 0; i < len; i++) {
				c = str.charCodeAt(i);
				if ((c >= 0x0001) && (c <= 0x007F)) {
					out += str.charAt(i);
				} 
				else if (c > 0x07FF) {
					out += String.fromCharCode(0xE0 | ((c >> 12) & 0x0F));
					out += String.fromCharCode(0x80 | ((c >>  6) & 0x3F));
					out += String.fromCharCode(0x80 | ((c >>  0) & 0x3F));
				} 
				else {
					out += String.fromCharCode(0xC0 | ((c >>  6) & 0x1F));
					out += String.fromCharCode(0x80 | ((c >>  0) & 0x3F));
				}
			}
			return out;

		},		
		
		utf8to16: function(str)	{
		
			var out, i, len, c;
			var char2, char3;

			out = "";
			len = str.length;
			i = 0;
			while(i < len) {
				c = str.charCodeAt(i++);
				switch(c >> 4)	{ 
					case 0: 
					case 1: 
					case 2: 
					case 3: 
					case 4: 
					case 5: 
					case 6: 
					case 7:					// 0xxxxxxx
						out += str.charAt(i-1);
						break;
					case 12: 
					case 13:				// 110x xxxx   10xx xxxx
						char2 = str.charCodeAt(i++);
						out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
						break;
					case 14:				// 1110 xxxx  10xx xxxx  10xx xxxx
						char2 = str.charCodeAt(i++);
						char3 = str.charCodeAt(i++);
						out += String.fromCharCode(((c & 0x0F) << 12) | ((char2 & 0x3F) << 6) | ((char3 & 0x3F) << 0));
						break;
				}
			}

			return out;		
		},
		
}
	
	this.Utils = new Utils();
	
}).apply( fvdSingleDownloader );
