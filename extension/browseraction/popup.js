
var e;

function CreateGetElementByID() {
	return function (id) {
		return document.getElementById(id);
	};
}

function CreateGetFnct(control, attr) {
	return function () {
		return document.getElementById(control)[attr];
	};
}

function send_to_background(a, d) {
	var m = {
		'action' : a
	};
	if (d !== undefined) {
		m.data = d;
	};
	chrome.extension.sendMessage(m);
};

function send_to_background(a, d, response) {
	var m = {
		'action' : a
	};
	if (d !== undefined) {
		m.data = d;
	};
	chrome.extension.sendMessage(m, response);
};

function CreateHandler(get_action, get_data) {
	if (get_data !== undefined)
		return function () {
			send_to_background(get_action(), get_data());
		};
	else
		return function () {
			send_to_background(get_action());
		};
}

window.onload = function () {
	e = CreateGetElementByID();

	e("btnAddCurrentUrl").onclick = function () {
		chrome.tabs.query({
			'active' : true,
			'lastFocusedWindow' : true
		}, function (tabs) {
			var url = tabs[0].url;
			e("txtYoutubeUrl").value = url;
			send_to_background('AddUrl', url);
		});
	}
	
	e('btnShuffle').onclick = CreateHandler(CreateGetFnct('btnShuffle', 'title'));
	e('btnNext').onclick = CreateHandler(CreateGetFnct('btnNext', 'title'));
	e('btnPrevious').onclick = CreateHandler(CreateGetFnct('btnPrevious', 'title'));
	e('btnPlay').onclick = CreateHandler(CreateGetFnct('btnPlay', 'title'));
	e('btnStop').onclick = CreateHandler(CreateGetFnct('btnStop', 'title'));
	e('btnAddUrl').onclick = CreateHandler(function () {
			return 'AddUrl'
		}, CreateGetFnct('txtYoutubeUrl', 'value'));

	e('btnLoop').onclick = CreateHandler(CreateGetFnct('btnLoop', 'title'), CreateGetFnct('btnLoop', 'checked'));
	e('btnMute').onclick = CreateHandler(CreateGetFnct('btnMute', 'title'), CreateGetFnct('btnMute', 'checked'));

	e('btnImport').onclick = function () {
		importPlaylist();
	}
	
	var select = e('selectMusiques');

	e('btnPushUp').onclick = function(){
		var selectedIndex = select.options[select.selectedIndex].value;
		send_to_background('PushUp', selectedIndex);
	}
	
	e('btnRemove').onclick = function(){
		var selectedIndex = select.options[select.selectedIndex].value;
		send_to_background('Remove', selectedIndex);
	}
	
	e('btnPushDown').onclick = function(){
		var selectedIndex = select.options[select.selectedIndex].value;
		send_to_background('PushDown', selectedIndex);
	}


	// Force an update of the information in the GUI
	chrome.extension.sendMessage({
		action : "GetInfo"
	});
}

function GetSongLabel(song) {
	var str = '';
	if (song !== undefined) {
		str = song.id;
		
		if (song.snippet !== undefined )
		{
			if (song.snippet.title !== undefined) 
				str = song.snippet.title;

			if (song.snippet.channelTitle !== undefined) 
				str += " - " + song.snippet.channelTitle;
		}

		if (song.contentDetails !== undefined )
		{
			if (song.contentDetails.duration !== undefined) 
				str += " ("+song.contentDetails.duration+")";
		}
		
		if (song.error !== undefined) {
			str = song.error.last.message + " (" + str + ")";
		}
	}
	return str;
}

function AddAllSongs(playlist, currentSong) {
	var select = e('selectMusiques');
	var length = Math.max(select.options.length, playlist.length);
	for (i = 0; i < length; i++) {
		var o = null;
		if (i < playlist.length) {
			var song = playlist[i];

			o = new Option(GetSongLabel(song), "");

			if (song === currentSong)
				o.selected = true;
		}
		select.options[i] = o;
	}
}

chrome.extension.onMessage.addListener(function (request, sender, sendResponse) {
	if (sender === this || e === undefined)
		return false;

	switch (request.action) {
	case "DisplayInfo":
		// Manage play/pause button
		var playString = (request.data.state === "playing") ? "Pause" : "Play";
		e("btnPlay").title = playString;
		e("btnPlay").getElementsByTagName("span")[0].className = "glyphicon glyphicon-" + playString.toLowerCase();
		
		// Manage loop and mute 
		var setActive = function (element, active) { var c = element.parentElement.classList; if (active) c.add('active'); else c.remove('active'); }
		setActive(e("btnLoop"), request.data.loop);
		setActive(e("btnMute"), request.data.mute);

		// Manage song list
		AddAllSongs(request.data.playlist, request.data.current);
		
		// Manage status and current song
		var status = request.data.state;
		if (request.data.current !== undefined) {
			status = status + ". Current song: " + GetSongLabel(request.data.current);
		}
		e('txtYoutubeUrl').value = status;
		break;
	case "ChangeSongPlaying":
		break;
	case "ChangePlayStatus":
		break;
	case "OnError":
		//alert(event.data.data);
		break;
	}

	return true;
});

function importPlaylist() {
	var f = e('txtFile').files[0];

	if (f) {
		var r = new FileReader();
		r.onload = function (e) {
			var contents = e.target.result;
			
			send_to_background('Import', contents.split(","));
		}
		r.readAsText(f);
	} else {
		alert("Failed to load file");
	}
}
