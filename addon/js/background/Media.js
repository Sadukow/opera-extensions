if (window == chrome.extension.getBackgroundPage()) {

	(function(){
		'use strict'
	
		var Media = function(){

			var self = this;
			
			var textFile = null;
			
			var _onMediaForTabUpdateListeners = [];
			
			const DETECT_MODULES = ["Youtube", "Vimeo", "BreakCom", "VKontakte", "FaceBook", "OdnoKlassniki", 
									"Twitch", "Twitter", "MediaManifest", "MediaStream", "MediaMaster", 
									"Sniffer" ];
									
			// ===============================================================
			this.init = function(){
			
				// ---------------------------   
				chrome.tabs.onRemoved.addListener( function( tabId ){
					console.log('onRemoved', tabId)					
				});
				
				// --------------------------- 
				chrome.tabs.onUpdated.addListener( function( tabId, changeInfo ){
					console.log('onUpdated', tabId, changeInfo)					
				});
				
				// --------------------------- 
				chrome.tabs.onActivated.addListener(function(info){
					console.log('onActivated', info)					
				});
				
				
				// ---------------------------  SendRequest
				chrome.extension.onRequest.addListener ( function(request, sender, sendResponse) {        
					console.log(request);
					if(request.command=="getVideoData")	{
						fvdSingleDownloader.Utils.getActiveTab( function( tab ) {
									if( tab )	{
										var media = self.getMedia( tab.id );
										sendResponse(media);
									}
								});	
					}
					if(request.command=="getVideoHash")	{
						sendResponse({media: [], fileName: fvdSingleDownloader.FileSystem.Unique( )});
					}
					else if(request.command=="clickDownload")	{
						console.log('clickDownload')
					}
				});
			}

			// ===============================================================
			this.mediaForTabUpdate = function( tabId ){

				chrome.extension.sendMessage( {
											subject: "mediaForTabUpdate",
											data: tabId
										} );
										
				fvdSingleDownloader.MainButton.MediaForTabUpdate( tabId );							
										
			
			}	

			// ===============================================================
			this.getMedia = function( tabId ){
				
				return [];
			}
			
			// ===============================================================
			function saveTSFile(data)	{ 	
				// If we are replacing a previously generated file we need to
				// manually revoke the object URL to avoid memory leaks.
				if (textFile !== null) 	{
					window.URL.revokeObjectURL(textFile);
				}
			
				textFile = window.URL.createObjectURL(data);		
				return textFile;
			}
			
		}
		
		this.Media = new Media();
		
	}).apply(fvdSingleDownloader);
	
}
else
{
	fvdSingleDownloader.Media = chrome.extension.getBackgroundPage().fvdSingleDownloader.Media;
}
