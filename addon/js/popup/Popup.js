(function(){
	
	var Popup = function(){
		
		var self = this;
		var current_group_id = null;
		var groupContainer = null;
		
		var enabledStream = true;
		var adsVideoConverter = true;

		const ALLOWED_EXT_IMAGES = [
			"flv",
			"mp3",
			"mp4",
			"pdf",
			"swf",
			"webm",
			"3gp"
		];

		const VIDEO_CONVERTER_URL = 'https://chrome.google.com/webstore/detail/llaficoajjainaijghjlofdfmbjpebpa';

		// ----------------------------------------------------------------------
		function getExtImage( ext ){
		
			ext = ext.toLowerCase();
			
			if( ALLOWED_EXT_IMAGES.indexOf(ext) == -1 )		return;
		
			return "images/formats/"+ext+".png";
		}
		
		function str_download_size1111( size ) {
		
			if (size<1073741824)    return fvdSingleDownloader.Utils.bytesToMb(size) + "MB";
			        else return fvdSingleDownloader.Utils.bytesToGb(size) + "GB";
		
		}
		
		// ---------------------------------------------- INIT ---------------------------
		this.init = function(){	
		
			self.rebuildThreadsList();

			// сообщения по инициализации
			containerMessage( 'init' );
			
			// если страница не обновлена	
			if( !chrome.webRequest )	{
				var x = document.getElementById("updateChromeNotice");
				if (x) x.removeAttribute("hidden");
				x = document.getElementById("multiple_download_block_title");
				if (x) x.setAttribute("hidden", true);
			}
			
			// сообщения
			chrome.extension.onMessage.addListener( function( request ) {
				
								if( request.subject == "mediaForTabUpdate" )  {
									fvdSingleDownloader.Utils.getActiveTab( function( tab ){
													if( tab.id == request.data )   {
														self.rebuildThreadsList();
													}
												});
								}
								else if( request.subject == "mediaDownloadState" )  {
									set( request );
								}	
								else if( request.subject == "mediaGotSize" )  {
									console.log(request);
								}	
								else if( request.subject == "mediaGotParams" )  {
									//console.log(request);
									if ( request.params['load_url'] ) {
										item = document.querySelector('[media-id="'+request.id+'"');
										if (item) item.querySelector(".download_button").removeAttribute( "disabled" );	
									}	
								}	
								/*else if( request.subject == "mediaStreamerState" )  {
									var elems = document.querySelectorAll(".download_group_item");
									for (var ii=0; ii<elems.length; ii++) {
										var met = elems[ii].getAttribute( "media-type" );
										var id = elems[ii].getAttribute( "media-id" );
										if ( id == request.id ) continue;
										var st = elems[ii].getAttribute( "data-state" ) || false;
										if ( ['stream', 'convert'].indexOf(met) != -1 ) {
											var btn = elems[ii].querySelector(".download_button")
											if ( !st && request.state ) {
												btn.setAttribute( "disabled", true );	
												btn.setAttribute( "title", "You are already downloading streaming video. Please wait till it finishes." );	
											}
											else {
												btn.removeAttribute( "disabled");	
												btn.removeAttribute( "title");	
											}	
										}	
									}	
								}*/	
							} );
						
			var elem = document.getElementById("returnToThreads");
			if (elem) elem.addEventListener( "click", function(){
								displayDownloads();
							}, false );
			
			var elem = document.getElementById("slowDownloadHint_close");
			if (elem) elem.addEventListener( "click", function(){
								//fvdSingleDownloader.Prefs.set( "popup.display_slow_download_hint", false );
								//self.refreshTopHints();
							}, false );
			
			var e = document.getElementById("help_link_clear");
			if (e) e.addEventListener( "click", function(){
										self.clearList();
									}, false );
									
			Ps.initialize( document.getElementById('download_container_wrapped'), 
						  { suppressScrollX: true,   } );
									
		}
		
		function checkStream( threads ) {
			
			enabledStream = true;
			if ( ! fvdSingleDownloader.Media.isStream() )  {
				enabledStream = false;
				return;	
			}	
			
		}
		
		// ------------------------------------------------- перестроить дерево
		this.rebuildThreadsList = function(){

			threadsOfActiveTab( function( threads ) {

console.log('rebuildThreadsList: ',threads)						
						if( threads )	{
							checkStream( threads );
							
							var x = document.getElementById("snifferNotice");
							if (x) x.setAttribute("hidden", true);
							x = document.getElementById("multiple_download_block_title");
							if (x) x.removeAttribute("hidden");
							x = document.getElementById("help_link_clear");
							if (x) x.removeAttribute("hidden");
							
							var container = document.getElementById("download_item_container");
							while( container.firstChild )  {
								container.removeChild( container.firstChild );
							}
							current_group_id = 0;

							var currentGroup = null;
							threads.forEach(function( thread )  {
											buildThreadItem( thread );	
										});
						}
						
						if (!threads || threads.length==0) {
							var x = document.getElementById("snifferNotice");
							if (x) x.removeAttribute("hidden");
							x = document.getElementById("multiple_download_block_title");
							if (x) x.setAttribute("hidden", true);
							x = document.getElementById("help_link_clear");
							if (x) x.setAttribute("hidden", true);
						}

					} );

			document.getElementById("multiple_download_block").addEventListener("click", function(event){
				var elems = document.querySelectorAll(".rightDropDownn");
				for (var i=0; i<elems.length; i++)	elems[i].style.display = 'none';
			}, false);
					
		}	
		
		// ----------------------------------------------  запрос к данным
		function threadsOfActiveTab( callback ){
			
			fvdSingleDownloader.Utils.getActiveTab( function( tab ){
					if( !tab )	{
						callback( null );
					}
					else  {
						var media = fvdSingleDownloader.Media.getMedia( tab.id );
						callback( media );
					}
			});
		}
		
		// ----------------------------------------------------- построение строки
		function buildThreadItem( m ){

			var hash = m.hash;
			var id = m.id;
			var group_id = m.groupId;
			var item;

			function fbc( className ){
				return item.getElementsByClassName(className)[0];
			}
			
			if (current_group_id != group_id) {

				item = document.getElementById("download_template_group").cloneNode( true );
				item.removeAttribute( "id" );
				item.setAttribute( "id", 'group_'+group_id );
				item.classList.add( "one-item" );
				
				var elemUrl = fbc("group_download_title");
				elemUrl.setAttribute( "source", m.source );
				elemUrl.innerHTML = '<span class="stream-video-name">'+m.displayName+'</span>' + (m.metod == 'stream' ? '<span class="stream-video">(Stream)</span>' : '');	


				if (m.thumbnail) {
					var tmbImg = document.createElement("img");
					tmbImg.setAttribute("style", "width: 100%");
					tmbImg.setAttribute("src", m.thumbnail);
					fbc("thumbnail").appendChild(tmbImg);
					fbc("thumbnail").classList.add('thumbnail-active');
				}  
				else  {
					if ( m.tabUrl.indexOf('facebook.com') != -1) {
						var tmbImg = document.createElement("img");
						tmbImg.setAttribute("style", "width: 100px");
						tmbImg.setAttribute("src", "/images/thumbnail/facebook.png");
						fbc("thumbnail").appendChild(tmbImg);
					}
					else if ( m.ext.indexOf('mp3') != -1) {
						var tmbImg = document.createElement("img");
						tmbImg.setAttribute("style", "width: 100px");
						tmbImg.setAttribute("src", "/images/thumbnail/audio.png");
						fbc("thumbnail").appendChild(tmbImg);
					}	
					else {
						var tmbImg = document.createElement("img");
						tmbImg.setAttribute("style", "width: 100px");
						tmbImg.setAttribute("src", "/images/thumbnail/blank.png");
						fbc("thumbnail").appendChild(tmbImg);
					}
				}    

				current_group_id = group_id;
				groupContainer = fbc("group_download_block");
				
				var container = document.getElementById("download_item_container");
				container.appendChild( item );
				
				var cnt = fbc("group_download_count")
				cnt.querySelector('.count').textContent = '1';
				//cnt.addEventListener("click", onTitleClick, false);	

				var groupContent = fbc("group_download_content");
				add_item( groupContent );
			}	
			else if (current_group_id == group_id && groupContainer) {

				var prnt = closest(groupContainer, '.group-video');
				prnt.classList.remove( "one-item" );
				var cnt = prnt.querySelector('.group_download_count').querySelector('.count');
				var x = parseInt(cnt.textContent);
				cnt.textContent = (++x).toString();

				add_item( groupContainer );
			}
			else {
				console.error('insert_element ', m.id, m.groupId)
			}
			
			// --------------------------------
			function add_item( container ) {

				var parentContainer = closest(container, '.group-video');

				item = document.querySelector('[media-id="'+m.id+'"');
				
				if (!item) {
					var ln = document.createElement("div");
					ln.setAttribute("class", "line");
					container.appendChild( ln );
					
					item = document.getElementById("download_template_group_item").cloneNode( true );

					item.removeAttribute( "id" );
					item.setAttribute( "id", hash );
					item.setAttribute( "media-id", m.id );
					item.setAttribute( "media-type", m.metod );
					
				}	
				
				var elemLabel = fbc("label");
				fvdSingleDownloader.Utils.jsonToDOM(m.displayLabel, elemLabel);
				//elemLabel.innerHTML = m.displayLabel;	
				if (m.metod == 'stream')  elemLabel.setAttribute('title',  'Stream');	
				
				var btndDwnl = fbc("download_button");
				
				if (m.metod == 'not') {
					
					fbc("text").textContent = 'Not Allowed';
					fbc("text").setAttribute('title', 'Click to read why it is disabled');
									
					function onClickNot( event ) {
									console.log('fvdSingleDownloader.Media.NotAllowed');
									var BG = chrome.extension.getBackgroundPage();
									BG.navigateMessageDisabled(3);
									event.stopPropagation();												
								}
								
					btndDwnl.setAttribute( "href", "#" );	
					btndDwnl.addEventListener("click", onClickNot, false);	
					
					var copyElem = fbc("copyLink");	
					copyElem.addEventListener( "click", onClickNot, false );
					
				}	
				else {

					if( m.image && (m.image.indexOf('hd1080.png') != -1 || m.image.indexOf('4k.png') != -1)  )	{
						fbc("media_format").getElementsByTagName("img")[0].setAttribute( "src", m.image );
						parentContainer.classList.add("show-format");
					}

					if ( ['download', 'convert'].indexOf(m.metod) != -1) {
						if (m.status == 'stop') {  
							if( m.size )  {
								fbc("size").textContent = str_download_size(m.size);
							}
						}
						else {
							fbc("size").textContent = str_download_size(m.progressByte || m.size);
						}	
					}
					else if ( ['stream'].indexOf(m.metod) != -1) {
						if (m.status == 'start') {  
							fbc("size").textContent = str_download_size(m.progressByte || m.size);
							fbc("procent").textContent = '('+m.progress.toString() + '%)';
						}	
					}
					
					buttonLabel( item, m.status, m.metod );
					
					/*if ( ['stream', 'convert'].indexOf(m.metod) != -1 ) {
						if ( m.status == 'stop' && !enabledStream ) {
							btndDwnl.setAttribute( "disabled", true );	
							btndDwnl.setAttribute( "title", "You are already downloading streaming video. Please wait till it finishes." );	
						}
					}*/	

					function onClick( event ) {
									//if (m.metod == 'stream' && m.status == 'stop') containerMessage( 'stream' );
									if ( this.getAttribute("disabled") )  return;
									fvdSingleDownloader.Media.clickDownload( id );
									event.stopPropagation();	
								}
								
					btndDwnl.setAttribute( "href", "#" );	
					btndDwnl.addEventListener("click", onClick, false);	
					
					if (m.source == 'MediaCombine') {
						btndDwnl.setAttribute( "disabled", true );	
					}	
					
					var copyElem = fbc("copyLink");	
					copyElem.addEventListener( "click", function( event ){
									fvdSingleDownloader.Utils.copyToClipboard( m.url );
									event.stopPropagation();
								}, false );
					
				}				
				
				

				var removeElem = fbc("removeLink");	
				removeElem.addEventListener( "click", function( event ){

								fvdSingleDownloader.Media.Storage.removeItem( m.id );

								var prnt = closest(item, '.group-video');

								var el = item.previousElementSibling;
								if (el && el.classList.contains('line')) container.removeChild( el );
								container.removeChild( item );

								var cnt = prnt.querySelector('.group_download_count').querySelector('.count');
								var x = parseInt(cnt.textContent);
								cnt.textContent = (--x).toString();

								if (x == 1) prnt.classList.add( "one-item" );
								else if (x == 0)  document.getElementById("download_item_container").removeChild( prnt );

								event.stopPropagation();
							}, false );

				container.appendChild( item );
			}
		}
		
		// -------------------------------------------------------
		function buttonLabel( item, status, mode ) {
			
			if (status == 'start') {
				item.querySelector(".text").textContent = (mode == 'record' ? "Stop" : "Cancel");
				item.setAttribute('data-state', mode);
			}
			else if (status == 'stop') {
				if (mode == 'record') item.querySelector(".text").textContent = "Start";
				else item.querySelector(".text").textContent = "Download";
				
				item.removeAttribute('data-state');
			}
			else if (status == 'error') {
				item.querySelector(".text").textContent = "Error";
				item.removeAttribute('data-state');
			}
		}
		
		function str_download_size( size ) {

			function prepareVideoSize( size ){
				var label = '';
				var text = '';
				if (size<1000) {						// 0..900 B
					text = size.toString();
					label = "B";
				}	
				else if (size<1024000) {					// 1000..1000KB
					text = ( size / 1024 ).toString();
					text = text.substring(0,4);
					label = "KB";
				}	
				else if (size<1048576000) {			    // 1000КB..1000MB
					text = (size / 1024 /1024).toString();
					text = text.substring(0,4);
					label = "MB";
				}	
				else if (size<1073741824000) {			    // 1000MB..1000GB
					text = (size / 1024 /1024 /1024).toString();
					text = text.substring(0,4);
					label = "GB";
				}	
				else {
					text = (Math.round( size / 1024 / 1024 / 1024 ) ).toString();
					label = "GB";
				}
				text = text.replace(/\.+$/, '');
				return text + label;
			};	
			function prepareVideoSize_old( size ){  ///channels/52/413
				if (size<102400) {
					return (Math.round( 100 * size / 1024 ) / 100).toString() + "KB";
				}	
				else if (size<1048657) {
					return (Math.round( 10 * size / 1024 ) / 10).toString() + "KB";
				}	
				else if (size<104865700) {
					return (Math.round( 100 * size / 1024 / 1024 ) / 100).toString() + "MB";
				}
				else if (size<1073741824) {
					return (Math.round( 10 * size / 1024 / 1024 ) / 10).toString() + "MB";
				}
				else if (size<107374182400) {
					return (Math.round( 100 * size / 1024 / 1024 / 1024 ) / 100).toString() + "GB";
				}
				else if (size<1073741824000) {
					return (Math.round( 10 * size / 1024 / 1024 / 1024 ) / 10).toString() + "GB";
				}
				else {
					return (Math.round( size / 1024 / 1024 / 1024 ) ).toString() + "GB";
				}
			};	

			if (!size) return null;

			try {
				var x = parseInt(size);
				if (x) return prepareVideoSize(x);
			}
			catch(ex) {	 }

			return size;
		}
		
		// ----------------------------------------------
		this.navigate_url = function( url ){
			chrome.tabs.query( 	{
							url:  url 
						}, function( tabs ){

									if( tabs.length > 0 )
									{
										foundTabId = tabs[0].id;
										chrome.tabs.update( foundTabId, {
																		active: true
																		} );
									}
									else
									{
										chrome.tabs.create( {	active: true,
																url: url
															}, function( tab ){ }
														);
									}
					} );
		}
		
		// ----------------------------------------------
		this.clearList = function(){
			
			var container = document.getElementById("download_item_container");
			while( container.firstChild )
			{
				container.removeChild( container.firstChild );
			}
			
			fvdSingleDownloader.Utils.getActiveTab( function( tab ){
				
				if( tab )
				{
					fvdSingleDownloader.Media.Storage.removeTabData( tab.id );
				}
				
			} );
		}

		// ------------------------------------------------------------------
		function closest(target, selector) {	

			while (target) {
				if (target.matches && target.matches(selector)) return target;
				target = target.parentNode;
				if (target.tagName == 'body') return null;
			}
			return null;	

		}
		
		// ------------------------------------------------------------------
		function set(request) {	

			//console.log('SET: ', request);
			
			var item = document.querySelector( '[media-id="'+request.id+'"]' );
			if (!item) return;

			item.querySelector(".procent").textContent = "" 
			
 			if ( request.status )  {
				if (request.status == 'playlist') {
					item.querySelector(".size").textContent = 'preparing...';
				}
				else if (request.status == 'saving') {
					item.querySelector(".size").textContent = 'saving';
				}
				else {	
					buttonLabel( item, request.status, request.metod );
					item.querySelector(".size").textContent = str_download_size( request.size );
				}	
			}
			 
			// исправим размер файла
			if (request.size) {
				item.querySelector(".size").removeAttribute( "loading" );
				item.querySelector(".size").textContent = str_download_size( request.size );
			}

			// прогресс
			if ( request.progress )  {
				item.querySelector(".procent").textContent = '('+request.progress.toString() + '%)';
			}
			if (request.byte)	{
				item.querySelector(".size").textContent = str_download_size(request.byte);
			}

		}

		// ------------------------------------------------------------------
		function containerMessage( type ) {

			var enabledMessage = fvdSingleDownloader.MainButton.getMessage();
			adsVideoConverter = enabledMessage['stream'];
			
			if (enabledMessage[type]) {
				fvdSingleDownloader.PopupHints.message(type);
			}

		}

	}
	
	this.Popup = new Popup();
	
}).apply( fvdSingleDownloader );
