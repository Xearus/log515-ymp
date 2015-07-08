
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
	e('btnAddUrl').onclick = CreateHandler(function() {return 'AddUrl'}, CreateGetFnct('txtYoutubeUrl', 'value'));

	e('btnLoop').onclick = function ()
	{
		//send_to_background(get_action(), get_data());
		   if (this.checked)  {
		      this.parentElement.classList.add('active');
		   }
		   else {
		      this.parentElement.classList.remove('active');
		   }
		   send_to_background('Loop', this.checked);
	}
	
	// Force an update of the information in the GUI
	chrome.extension.sendMessage({
		action : "GetInfo"
	});
}



function GetSongLabel(song)
{
	var str = '';
	if (song !== undefined) {
		str = song.id;
		if (song.snippet !== undefined
			 && song.snippet.title !== undefined) {
			str = song.snippet.title;
		}
		str = str + " - " + song.ymp_uuid
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
		// TODO (Doesn't work): Manage button displayed.
		if (request.data.state === "playing") {
			e("btnPlay").getElementsByTagName("span")[0].className = "glyphicon glyphicon-pause";
			e("btnPlay").title = "Pause";
		} else if (request.data.state === "paused" || request.data.state === "stopped") {
			e("btnPlay").getElementsByTagName("span")[0].className = "glyphicon glyphicon-play";
			e("btnPlay").title = "Play";
		}

		AddAllSongs(request.data.playlist, request.data.current);
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
