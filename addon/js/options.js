window.addEventListener( "load", function(){

	var tab_general = document.getElementById("tab_general")
	var tab_showfiles = document.getElementById("tab_showfiles")
	var tab_blacklist = document.getElementById("tab_blacklist")
	var tab_about = document.getElementById("tab_about")

	var container_general = document.getElementById("container_general")
	var container_showfiles = document.getElementById("container_showfiles")
	var container_blacklist = document.getElementById("container_blacklist")
	var container_about = document.getElementById("container_about")
	
	var query  = window.location.search.substring(1);
	console.log(query);
	var urlParams = {};
	var search = /([^&=]+)=?([^&]*)/g;
    while (match = search.exec(query))  urlParams[match[1]] = match[2];	
	var path = urlParams['tab'];
	
	if( path == 'default_folder' )  _setTab( 1 );
	else if( path == 'file_types' )  _setTab( 2 );
	else if( path == 'file_types_yt' )  _setTab( 3 );
	else if( path == 'ffmpeg_file' )  _setTab( 3 );
	else _setTab( 1 );

	tab_general.addEventListener('click', function(){
		_setTab( 1 );
	});	
	
	tab_showfiles.addEventListener('click', function(){
		_setTab( 2 );
	});	
	
	tab_blacklist.addEventListener('click', function(){
		_setTab( 3 );
	});	
	
	tab_about.addEventListener('click', function(){
		_setTab( 4 );
	});	
	
	function _setTab( x ) {
		tab_general.classList.remove('selected');	
		tab_showfiles.classList.remove('selected');	
		tab_blacklist.classList.remove('selected');	
		tab_about.classList.remove('selected');	

		container_general.setAttribute('style', 'display: none');
		container_showfiles.setAttribute('style', 'display: none');
		container_blacklist.setAttribute('style', 'display: none');
		container_about.setAttribute('style', 'display: none');
		
		if (x ==2) {
			tab_showfiles.classList.add('selected');	
			container_showfiles.setAttribute('style', 'display: block');
		}	
		else if (x==3) {
			tab_blacklist.classList.add('selected');	
			container_blacklist.setAttribute('style', 'display: block');
		}
		else if (x ==4) {
			tab_about.classList.add('selected');	
			container_about.setAttribute('style', 'display: block');
		}	
		else {
			tab_general.classList.add('selected');	
			container_general.setAttribute('style', 'display: block');
		}	
	}

	fvdDownloader.Prefs.initialize( false, function(){
		fvdDownloader.Options.init();		
	});	
    
	document.getElementById("donateDownloadNative").addEventListener( "click", function( event ){
							var url = null;
							if (navigator.appVersion.indexOf("Win")!=-1)   url = "http://fvdmedia.com/installation-guide-windows";
							if (navigator.appVersion.indexOf("Mac")!=-1)   url = "http://fvdmedia.com/installation-guide-mac";
							if (navigator.appVersion.indexOf("X11")!=-1)   url = "http://fvdmedia.com/installation-guide-linux-unix";
							if (navigator.appVersion.indexOf("Linux")!=-1) url = "http://fvdmedia.com/installation-guide-linux-unix";	
							if( url )	{
								browser.tabs.create({url: url,	active: true });			
							}
							event.stopPropagation();
						}, false );

});