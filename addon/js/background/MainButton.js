if (window == chrome.extension.getBackgroundPage()) {

	(function(){
	
		var MainButton = function(){
		
			var self = this;

			const TRIGGER_VIDEO_SIZE = 1048576;
			const MIN_FILESIZE_TO_CHECK = 100 * 1024;
			
			var isButtonStatus = 0;		// 0 - disabled  1 - enabled  2 - downloader  3 - recorder
			
			// ----------------------------------------------
			function getActiveTab(callback){
				fvdSingleDownloader.Utils.getActiveTab(callback);
			}
			
			// -------------------------------------------------------------------------------
			this.MediaForTabUpdate = function( tabId )  {
				getActiveTab(function(tab){
					if (!tab) 	return;
					if (tabId == tab.id) {
						refreshMainButtonStatus(tabId);
					}
				});
			};
			
			// -----------------------------------------  window.addEventListener( "load"
			function MainButtonStatus(tabId, tabUrl){
				
				type_Page = 0;
			
			
			}
			
			// -----------------------------------------  
			function refreshMainButtonStatus(tabId){
				
				//console.log('refreshMainButtonStatus', tabId);
				
				if ( tabId ) {
					chrome.tabs.query( 	{  }, function( tabs ){
						if( tabs.length > 0 )	{
							for (var i=0; i<tabs.length; i++) {
								if (tabs[i].id == tabId ) {
									MainButtonStatus(tabs[i].id, tabs[i].url);
									return;
								}	
							}
						}
					});
				}
				else {	
					getActiveTab(function(tab){
					
						if (tab) 	{
							MainButtonStatus(tab.id, tab.url);
						}
					});
				}	
			}
			this.refreshMainButtonStatus = function(tabId){
				refreshMainButtonStatus(tabId);
			};
			
			// -------------------------------------------------------------------------------
			this.setPopup = function( tabId )  {
				chrome.browserAction.setPopup({ popup: 'popup.html' });	
			}	
			
			// -------------------------------------------------------------------------------
			
		};
		
		this.MainButton = new MainButton();
		
	}).apply(fvdSingleDownloader);
}
else{
	fvdSingleDownloader.MainButton = chrome.extension.getBackgroundPage().fvdSingleDownloader.MainButton;
}
