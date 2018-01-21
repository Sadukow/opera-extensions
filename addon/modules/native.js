var NATIVE_CLIENT = function(){

	const DEBUG = true;

	const MAX_NATIVE_POST_MESSAGE = 700;

	const NATIVE_SUPPORTED = 1;
	const NATIVE_NOT_INSTALL = 2;
	const NATIVE_NEED_UPDATE = 3;

	const IS_FOLGE = true;

	var portNative = null;
	var isRun = true;
	var isOpen = false;

	var hash = null;
	var tabId = null;

	var textOutput = null;
	var textError = null;
	var textData = null;

	var stateNative = NATIVE_NOT_INSTALL;
	var status = null;
	var necessaryUpdate = false;

	var xx = 0;
	var isOutput = 0;

	var nativeQueue = [];

	var native_msg = null;
	var encode_native_msg = [];
	var native_params = null;
	var native_callback = null;

	const VERSION_NATIVE = "1.0.8";

	const ENABLE_VERSION_FFMPEG = [
			new RegExp("^3\.([0-9]+)\(.([0-9]+))?", "i")	
		];	

	const NATIVE_MESSAGE_UPDATE = "Native CLient add method for stream download";

	const NATIVE_CONNECT_NAME = "com.nimbus.ffmpeg";
	const NATIVE_FOLGE_MESSAGE = "folge&befehl;-version";
	const NATIVE_KAPLAU_MESSAGE = "kaplau&befehl;-version";
	const NATIVE_CONNECT_INIT = "achu&befehl;-version";
	const NATIVE_FINISH_MESSAGE = "=====";

	// -----------------------------------------------------------
	function init( fl ) {

		stateNative = NATIVE_NOT_INSTALL;
		var port = chrome.runtime.connectNative(NATIVE_CONNECT_NAME);
		port.onMessage.addListener(on_message);
		port.onDisconnect.addListener(on_disconnect);
		
		function on_message( resp ) {
			if (DEBUG) console.log( resp )
			var text = resp.text;
			var status = resp.status ? resp.status : null;
			if ( text == 'ClientStarted' ) {
				port.postMessage(encode(NATIVE_CONNECT_INIT));	
				port.postMessage(NATIVE_FINISH_MESSAGE);	
			}	
			else if ( text == 'START_RUN' ) {
				textOutput = "";
				textError = "";
				textData = "";
			}	
			else if ( text == 'OUTPUT' ) {
				var output = resp.output ? resp.output : null;
				textOutput += output ? window.atob(output) : "";
			}	
			else if ( text == 'ERROR' ) {
				var error = resp.error ? resp.error : null;
				textError += error ? window.atob(error) : "";
			}	
			if ( text == 'END' && status == '0' ) {
				var version1 = resp.version;
				var version2 = resp.ffmpeg;
				necessaryUpdate = variation_of_versions(version1, version2);				
				stateNative = NATIVE_SUPPORTED;
				if (DEBUG) { 
					console.log(textOutput);
					console.log(textError);
					console.log(version1, version2, necessaryUpdate);
				}	
				if ( necessaryUpdate ) {
					console.log('FFMEG & NATIVE - It is necessary to update', version1, version2);
					stateNative = NATIVE_NEED_UPDATE;
				}
				else {
					console.log('=== FFMEG - successfull ===');
				}
				//test: stateNative = NATIVE_NOT_INSTALL;	
			}
		}
		function on_disconnect(  ) {
			if (DEBUG) console.log("Disconnected", port.error);
			if (port.error) stateNative = NATIVE_NOT_INSTALL;  
			
			if (stateNative) { 
				isRun = false;
				runQueue();
			}	
		}

	}	

	// -----------------------------------------------------------
	function variation_of_versions( v1, v2) {

		if ( v1 != VERSION_NATIVE ) return true;

		var vv = false;
		ENABLE_VERSION_FFMPEG.forEach(function( sign ){

			var m = v2.match( sign ); 
			if (m) vv = true;
			return;

		});

		return !vv;
	}	

	// -----------------------------------------------------------
	function enabled() {

		return stateNative;

	}	

	// -----------------------------------------------------------
	function version() {

		return VERSION_NATIVE;

	}	

	// -----------------------------------------------------------
	function update_message() {

		if (stateNative == NATIVE_NEED_UPDATE) 	return NATIVE_MESSAGE_UPDATE;

		return "";

	}	

	// -----------------------------------------------------------
	function union(params, callback) {

		if (DEBUG) console.log(params);

		if ( !params.video && !params.audio ) return;

		var msg = "ffmpeg&befehl;"
		if (params.video) msg += " -i &quot;" + params.video.replace(/\//g,'&sprt;').replace(/\\/g,'&sprt;')+"&quot;";
		if (params.audio) msg += " -i &quot;" + params.audio.replace(/\//g,'&sprt;').replace(/\\/g,'&sprt;')+"&quot;";
		msg +=    " -c copy -y";
		msg +=    " &quot;" + params.filename.replace(/\//g,'&sprt;').replace(/\\/g,'&sprt;')+"&quot;";

		if (params.workDir) msg += "&mappe;" + params.workDir.replace(/\//g,'&sprt;').replace(/\\/g,'&sprt;');


		sendQueue({  params:    params, 
					 msg:    	msg,
					 callback: 	callback
				 });

	}

	// -----------------------------------------------------------
	function playlist(params, callback) {

		if (DEBUG) console.log(params);

		var msg = "ffmpeg&befehl;";
		msg += " -i &quot;" + params.playlist.replace(/\//g,'&sprt;').replace(/\\/g,'&sprt;')+"&quot;";
		msg += ' -safe 0';
		msg += ' -cpu-used 4';
		msg += ' -threads 0';
		msg += ' -preset veryfast';
		msg += ' -c copy -y';

		if (params.bsf)   msg += ' -bsf:a aac_adtstoasc';

		msg += " &quot;" + params.filename.replace(/\//g,'&sprt;').replace(/\\/g,'&sprt;')+"&quot;";
		msg += "&mappe;" + params.workDir.replace(/\//g,'&sprt;').replace(/\\/g,'&sprt;');

		sendQueue({  params:    params, 
					 msg:    	msg,
					 callback: 	callback
				 });

	}

	// -----------------------------------------------------------
	function concat(params, callback) {

		if (DEBUG) console.log(params);

		var msg = "ffmpeg&befehl;";
		msg += " -i &quot;" + params.concat + "&quot;";
		msg += ' -safe 0';
		msg += ' -cpu-used 4';
		msg += ' -threads 0';
		msg += ' -preset veryfast';
		msg += ' -c copy -y';

		if (params.bsf)   msg += ' -bsf:a aac_adtstoasc';

		msg += " &quot;" + params.filename.replace(/\//g,'&sprt;').replace(/\\/g,'&sprt;')+"&quot;";
		msg += "&mappe;" + params.workDir.replace(/\//g,'&sprt;').replace(/\\/g,'&sprt;');

		sendQueue({  params:    params, 
					 msg:    	msg,
					 callback: 	callback
				 });

	}

	// -----------------------------------------------------------
	function thumbnail(params, callback) {

		if (DEBUG) console.log(params);

		if (!params.video) return;

		var msg = "thumbnail&befehl;";
		msg += params.video.replace(/\//g,'&slash;').replace(/\\/g,'&sprt;');

		sendQueue({  params:    params, 
					 msg:    	msg,
					 callback: 	_fin
				 });

		function _fin(rez) {

			var pp ={  command: 'finish',  
					   group:   rez.params.group, 
					   status:  rez.status,
					   data:    rez.data		};

			callback(pp);
		}

	}

	// -----------------------------------------------------------
	function beenden(params, callback) {

		if (DEBUG) console.log('BEENDEN (rename & clear): ', params);

		var msg = "beenden&befehl;" + params.tmpDir + "&sprt;" + params.filename;
		msg += "&filename;" + params.downloadName;
		msg += "&mappe;" + params.workDir.replace(/\//g,'&sprt;').replace(/\\/g,'&sprt;');
		msg += "&nachweis;";

		sendQueue({  params:    params, 
					 msg:    	msg,
					 callback: 	callback
				 });

	}


	// -----------------------------------------------------------
	function clear(params, callback) {

		if (DEBUG) console.log('CLEAR: ', params);

		var msg = "tazartu&befehl;" + params.workDir.replace(/\//g,'&sprt;').replace(/\\/g,'&sprt;');

		sendQueue({  params:    params, 
					 msg:    	msg,
					 callback: 	callback
				 });

	}


	function sendQueue( options ) {

		//if (DEBUG) console.log(options);	

		nativeQueue.push(options);

		runQueue();
	}	

	function encode_message( str ) {
		var list = [];
		var text = encode(str);

		while( text.length > MAX_NATIVE_POST_MESSAGE ) {
			var ss = text.substring(0, MAX_NATIVE_POST_MESSAGE);
			text = text.substring(MAX_NATIVE_POST_MESSAGE, text.length);
			list.push(ss);
		}

		list.push(text);
		list.push(NATIVE_FINISH_MESSAGE);
		return list;
	}

	function runQueue( ) {

		//console.log('runQueue', isRun, nativeQueue.length)

		if (!isRun) {
			if ( nativeQueue.length>0 ) {

				var opt = nativeQueue.shift();

				native_msg = opt.msg;
				encode_native_msg = encode_message(native_msg);

				native_params = opt.params;
				native_callback = opt.callback;
				isOutput = 0;

				if (portNative) {
					if (DEBUG) { 
						console.log(native_msg);
						console.log(encode_native_msg);
					}	
					for (var i=0; i<encode_native_msg.length; i++)	portNative.postMessage(encode_native_msg[i]);				
				}
				else {
					initNative();
				}

			}
			else {
				if (portNative) {
					portNative.postMessage(encode(NATIVE_KAPLAU_MESSAGE));	
					portNative.postMessage(NATIVE_FINISH_MESSAGE);	
				}	
			}    

		}

	}	

	function nativeMessage(msg) {

		if (DEBUG) console.log("Received", msg);

		if( msg.text == "ClientStarted" ) {
			if (DEBUG) { 
				console.log(native_msg);
				console.log(encode_native_msg);
			}	
			for (var i=0; i<encode_native_msg.length; i++) portNative.postMessage(encode_native_msg[i]);				
			isOpen = true;
		} 
		else if( msg.text == "ClientStopped" ) {
			_finish(isRun ? 1 : 0)
			isOpen = false;
		} 
		else if( msg.text == "START_RUN" ) {
			isRun = true;
			textOutput = "";
			textError = "";
			textData = "";
		} 
		else if ( msg.text == 'OUTPUT' ) {
			var output = msg.output ? msg.output : null;
			textOutput += output ? window.atob(output) : "";
		}	
		else if ( msg.text == 'ERROR' ) {
			var error = msg.error ? msg.error : null;
			textError += error ? window.atob(error) : "";
		}	
		else if ( msg.text == 'DATA' ) {
			var data = msg.data ? msg.data : null;
			textData += data ? data : "";
		}	
		else if( msg.text == "END" ) {
			status = msg.status ? msg.status : null;
			if (isOutput == 1) { 
				console.log(textOutput);
				console.log(textError);
			}	
			if (DEBUG) console.log('DATA:', textData);
			_finish(status)
		} 

		function _finish(st) {

			if ( IS_FOLGE && portNative && isOutput == 0 && st != "0" ) {
				isOutput = 1;
				console.log(native_msg);
				portNative.postMessage(encode(NATIVE_FOLGE_MESSAGE));
				portNative.postMessage(NATIVE_FINISH_MESSAGE);	
				return;
			}

			if (native_callback) native_callback({  command: 'finish',  
													params:  native_params, 
													status:  st,
													output:  textOutput,
													error:   textError,
													data:    textData
												} );

			if (st != 0)	console.error(native_msg);

			native_callback = null;	

			isRun = false;
			setTimeout( function() {  runQueue();	}, 0)
			
		}

	}

	function nativeDisconnect() {

		//if (DEBUG) console.log("Disconnected");

		portNative.onMessage.removeListener(nativeMessage);
		portNative.onDisconnect.removeListener(nativeDisconnect);

		if (native_callback) native_callback({  command: 'disconnected',  
												params:  native_params, 
												status:  -9,
											} );
		native_callback = null;	

		portNative = null;
		isOpen = false;
		isRun = false;

		runQueue();	
	}

	function initNative() {

		if (portNative) return;

		portNative = chrome.runtime.connectNative(NATIVE_CONNECT_NAME);

		portNative.onMessage.addListener(nativeMessage);

		portNative.onDisconnect.addListener(nativeDisconnect);

	}

	function encode(str) {
	    return window.btoa(unescape(encodeURIComponent(str)));
	}	
	function decode(str) {
	    //return window.btoa(unescape(encodeURIComponent(str)));
	}	

	// -----------------------------------------------------------
	function test(  ) {

		console.log('== TEST == NATIVE ==');

		// тестирование инициализации
		//init( true );

		// тестирование thumbnail
		//thumbnail( { 	group: 	1,	video:  "http://fvdmedia.com/native-client/test/qut_video.mp4" }, function(rez){	console.log(rez);	});

		// тестирование очистки
		//clear( {workDir: "/home/saduk/Загрузки/data"} , function(rez){	 console.log(rez);	});

		// тестирование ffmpeg
		//sendQueue({  params:    {},	 msg: "ffmpeg&befehl;-protocols&mappe;d:&sprt;TMP",		 callback: 	function(rez){  console.log(rez);  }	 });

		// тестирование вывода данных
		//sendQueue({  params:    {},	 msg: "folge&befehl;-version",		 callback: 	function(rez){  console.log(rez);  }	 });

		// тестирование переименования
		//sendQueue({  params:    {},	 msg: "beenden&befehl;_tmp_1509002093515&sprt;_media.mp4&filename;VGhhaWxhbmQgMjAxNyBvbiBWaW1lb1szNjAsIE1wNF0ubXA0&mappe;&sprt;home&sprt;saduk&sprt;Загрузки&sprt;",		 callback: 	function(rez){  console.log(rez);  }	 });

		// тестирование переименования
		//sendQueue({  params:    {},	 msg: 'ffmpeg&befehl; -i "concat:init_video.mp4|00235|00236|00237|00238|00239|00240|00241|00242|00243|00244|00245|00246|00247|00248|00249|00250|00251|00252|00253|00254|00255|00256|00257|00258|00259|00260|00261|00262|00263|00264|00265|00266|00267|00268|00269|00270|00271|00272|00273|00274|00275|00276|00277|00278|00279|00280|00281|00282|00283|00284|00285|00286|00287|00288|00289|00290|00291|00292|00293|00294|00295|00296|00297|00298|00299|00300|00301|00302|00303|00304|00305|00306|00307|00308|00309|00310|00311|00312|00313|00314|00315|00316|00317|00318|00319|00320|00321|00322|00323|00324|00325|00326|00327|00328|00329|00330|00331|00332|00333" -safe 0 -cpu-used 4 -threads 0 -preset veryfast -c copy -y -bsf:a aac_adtstoasc "_tmp_video.mp4"&mappe;C:\\Users\\saduk\\Downloads\\_tmp_1509088600252',		 callback: 	function(rez){  console.log(rez);  }	 });

		// тестирование объединение и переименования
		//sendQueue({  params:    {},	 msg: 'ffmpeg&befehl; -i &quot;_video.mp4&quot; -i &quot;_audio.mp3&quot; -c copy -y &quot;_media.mp4&quot;&mappe;&sprt;home&sprt;saduk&sprt;Загрузки&sprt;_tmp_1510332746481',		 
		//		     callback: 	function(rez){  
		//			   	console.log(rez);  	 
		//				sendQueue({  params:    {},	 msg: 'beenden&befehl;_tmp_1510332746481&sprt;_media.mp4&filename;Ferrari 488 GTB  TEST[Mobile,192x144].mp4&mappe;&sprt;home&sprt;saduk&sprt;Загрузки&sprt;&nachweis;',		 callback: 	function(rez){  console.log(rez);  }	 });
		//			}});	
		test_union();

	}
	function test_union(  ) {

		var params = {  
				video: "_video.mp4",
				audio: "_audio.mp3",
				filename: "_media.mp4",
				workDir:  "/home/saduk/Загрузки/_tmp_1510332746481",
			 };

		fvdSingleDownloader.native.union( params, function(rez){

					console.log(rez);
					if (rez.command == 'finish')  {

						fvdSingleDownloader.native.beenden( { filename: 	  "_media.mp4",
														downloadName: "Ferrari 488 GTB  TEST[Mobile,192x144].mp4",
														workDir: 	  "/home/saduk/Загрузки/",
														tmpDir:       "_tmp_1510332746481"
													  } , function(rez){	console.log(rez);		});

					}

		});
	}			


	return {
		init: init,
		union: union,
		test: test,
		playlist: playlist,
		concat: concat,
		thumbnail: thumbnail,
		beenden: beenden,
		clear: clear,
		enabled: enabled,
		version: version,
		update_message: update_message,
	}

}

fvdSingleDownloader.native = new NATIVE_CLIENT();
