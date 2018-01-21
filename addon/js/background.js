
window.addEventListener( "load", function(){
	
	fvdSingleDownloader.Media.init();
	fvdSingleDownloader.FileSystem.init();
	fvdSingleDownloader.MainButton.refreshMainButtonStatus();
	
	fvdSingleDownloader.native.init( true );
	
	var st = 0;
	if( fvdSingleDownloader.Utils.isVersionChanged() && !fvdSingleDownloader.noWelcome )	{
		var url = null;

		if (fvdSingleDownloader.Prefs.get("install_time") == 0)  {
			url = "http://operadownloaders.com/";
			st = 1;
		}
		else {
			st = 2;
		}			
			
		if( url )	{
			chrome.tabs.create({
						url: url,
						active: true
					});			
		}

	}
	
	if( fvdSingleDownloader.Prefs.get( "install_time" ) == 0 )	{
		fvdSingleDownloader.Prefs.set( "install_time", new Date().getTime() )
	}
	
	fvdSingleDownloader.WebSQL.init( st, function(){	});
	
	
	// устанавливаем страницу при удаление
	//chrome.runtime.setUninstallURL("http://fvdmedia.com/to/s/dwunstl");

	// --------------------------------------------------------------------------------
	chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
		
			if (request.akse == 'Page_Options') {
				
				var params = {};
				for (var i = 0; i != request.list.length; i++) 	{
					var v = fvdSingleDownloader.Prefs.get( request.list[i] );
					if (v == 'true')  v = true;
					else if (v == 'false')  v = false;
					params[ request.list[i] ] = v;
				}
				
				var message = {};
				for (var i = 0; i != request.msg.length; i++) 	{
					message[request.msg[i]] =  chrome.i18n.getMessage(request.msg[i]);
				}
				
				var addon = {};
				addon.id = chrome.i18n.getMessage("@@extension_id");
				addon.title = chrome.i18n.getMessage("extension_title");
				addon.description = chrome.i18n.getMessage("extension_description");
				
				sendResponse({paramsOptions: params,  paramsMessage: message,  paramsAddon: addon});
				
			}
			else if (request.akse == 'Save_Options') {
				
				for ( var k in request.params ) {
					fvdSingleDownloader.Prefs.set( k, request.params[k].toString() );
				}
				
				sendResponse({});
			}	
			else if (request.akse == 'Close_Options') {
				
				chrome.tabs.query( {
						active: true,
						currentWindow: true
					}, function( tabs ){
								if( tabs.length > 0 )	{
									chrome.tabs.remove(tabs[0].id);
								}
				} );
			}	
			else if (request.action == 'SettingOptions') {
				
				display_settings(  );
			}	
			else if (request.action == 'open_test_html5fs') {
  				chrome.tabs.create({url: "html5fs.html"}, function (tab) {	});	  
			}	
			else if (request.action == 'open_test_websql') {
  				chrome.tabs.create({url: "websql.html"}, function (tab) {	});	  
			}	
			
	});
	
	chrome.tabs.query( {
			active: true,
			currentWindow: true
		}, function( tabs ){
					if( tabs.length > 0 )	{
						fvdSingleDownloader.MainButton.setPopup(tabs[0].id);
					}
	} );
	
	
}, false );


// ------------------------------------
chrome.management.getAll(function(extensions){

        for (var i in extensions) {
//            if (extensions[i].enabled) 	{
				if ( extensions[i].name.indexOf("FVD Suggestions") != -1) {
//console.log(extensions[i]);
					if ('MainButton' in fvdSingleDownloader) {
						fvdSingleDownloader.MainButton.isGtaSuggestion = true;
					}	
				}	
				if ( extensions[i].name.indexOf("Smart Pause for YouTube") != -1) {
					if ('MainButton' in fvdSingleDownloader) {
						fvdSingleDownloader.MainButton.isSmartPause = true;
					}	
				}	
//            }
        }
		
});


// ---------------------------------------- ОПЦИИ  --------------------------
function display_settings(  )  {

	chrome.tabs.query( 	{  }, function( tabs ){
		
					var myid = chrome.i18n.getMessage("@@extension_id");
		
					if( tabs.length > 0 )	{
						
						for (var i=0; i<tabs.length; i++) {
						
							if ( tabs[i].url.indexOf( "addon="+myid ) != -1 ) {	
								chrome.tabs.update( tabs[i].id, { active: true } );
								return;
							}
						}
						
						chrome.tabs.create( {	active: true,
												url: chrome.extension.getURL("/options.html")
											}, function( tab ){ }
										);
					}
	} );
}

// ------------------------------------

	

