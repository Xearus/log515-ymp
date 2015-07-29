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
if(window["QUnit"] === undefined){
window.onload = function () {
	document.getElementById("btnAddCurrentUrl").onclick = function () {
		chrome.tabs.query({
			'active' : true,
			'lastFocusedWindow' : true
		}, function (tabs) {
			if (tabs.length === 0) {
				return;
			}
			var url = tabs[0].url;
			$("#txtYoutubeUrl").value = url;
			send_to_background('AddUrl', url);
		});
	};
	
	$('#btnShuffle').click(CreateHandler(CreateGetFnct('btnShuffle', 'title')));
	$('#btnNext').click(CreateHandler(CreateGetFnct('btnNext', 'title')));
	$('#btnPrevious').click(CreateHandler(CreateGetFnct('btnPrevious', 'title')));
	$('#btnPlay').click(CreateHandler(CreateGetFnct('btnPlay', 'title')));
	$('#btnStop').click(CreateHandler(CreateGetFnct('btnStop', 'title')));
	$('#btnAddUrl').click(CreateHandler(function () { return 'AddUrl' }, 
							CreateGetFnct('txtYoutubeUrl', 'value'))
	);

	$('#btnLoop').click(CreateHandler(CreateGetFnct('btnLoop', 'title'), CreateGetFnct('btnLoop', 'checked')));
	$('#btnMute').click(CreateHandler(CreateGetFnct('btnMute', 'title'), CreateGetFnct('btnMute', 'checked')));


	$('#btnPushUp').click(function(){
		send_to_background('PushUp', $('#playlist-ul>.selected').attr('index'));
	});
	
	$('#btnRemove').click(function(){
		send_to_background('Remove', $('#playlist-ul>.selected').attr('index'));
	});
	
	$('#btnPushDown').click(function(){
		send_to_background('PushDown', $('#playlist-ul>.selected').attr('index'));
	});

	// Force an update of the information in the GUI
	chrome.extension.sendMessage({
		action : "GetInfo"
	});
}
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
	}
	return str;
}

function OnClickSelectSong() {
	if ($(this).hasClass('selected')) {
		send_to_background('select', undefined);
	} else {
		send_to_background('select', $(this).attr('id'));
	}
}

function GetSongIcon(song, currentSong) {
	var s = '<i class="glyphicon ';
	if (currentSong !== undefined
	&&  song.ymp_uuid === currentSong.ymp_uuid) {
		s += "glyphicon-headphones";
	} else if (song.error !== undefined) {
		s += "glyphicon-warning-sign";
	}
	
	return s + '"></i>';
}

function GetListItemInnerHTML(song, currentSong) {
	var icon = GetSongIcon(song, currentSong);
	var lbl = GetSongLabel(song);
	return icon + lbl;
}

function zip(a, b) {
	var longest = a.length > b.length ? a : b
	var sortest = a.length <= b.length ? a : b
	var ret = [];
	for(var i = 0; i < longest.length; i++) {
		ret[i] = [a[i], b[i]];
	}
	return ret;
}

function AddAllSongs(playlist, currentSong, selectedID) {
	var pl_ul = $('#playlist-ul');

	var e;
	var z = zip(playlist, $('#playlist-ul>li'))
	
	for(var i = 0; i < z.length; i++) {
		e = z[i];
		var song = e[0];
		var li = $(e[1]);
		
		if(e[1] === undefined) {
			li = $('<li/>');
			li.click(OnClickSelectSong);
			li.appendTo(pl_ul);
		}
		
		if (song === undefined) {
			li.unbind('click', OnClickSelectSong);
			li.remove();
		} else {
			var li_inner = GetListItemInnerHTML(song, currentSong);
			li.attr('index', i).attr('id', song.ymp_uuid).html(li_inner);
			if (song.ymp_uuid === selectedID) {
				li.addClass('selected');
			} else {
				li.removeClass('selected');
			}
		}
	}
}
if(chrome.extension != undefined) {
chrome.extension.onMessage.addListener(function (request, sender, sendResponse) {
	if (sender === this)
		return false;

	switch (request.action) {
	case "DisplayInfo":
		// Manage play/pause button
		var playString = (request.data.state === "playing") ? "Pause" : "Play";
		$("#btnPlay").attr('title', playString);
		$("#btnPlay>span")[0].className = "glyphicon glyphicon-" + playString.toLowerCase();
		
		// Manage loop and mute 
		var setActive = function (e, active) { if (active) e.addClass('active'); else e.removeClass('active'); }
		setActive($("#btnLoop"), request.data.loop);
		setActive($("#btnMute"), request.data.mute);

		// Manage song list
		AddAllSongs(request.data.playlist, request.data.current, request.data.selected);
		
		// Manage status and current song
		var status = request.data.state;
		if (request.data.current !== undefined) {
			status = status + ". " + GetSongLabel(request.data.current);
		}
		$('#lblInfo').html(status);
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
}
