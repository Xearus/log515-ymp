// Define the String.format method if not defined.
if (!String.prototype.format) { String.prototype.format = function() { var args = arguments; return this.replace(/{(\d+)}/g, function(match, number) { return typeof args[number] != 'undefined' ? args[number] : match; }); }; }

//Ajouter un conteneur pour le player
var divPlayer = document.createElement('div');
divPlayer.setAttribute("id", "player");
document.body.appendChild(divPlayer);

//Injecter l'API de Youtube

// https://developers.google.com/youtube/iframe_api_reference

var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var currentSongIndex;
var songList; // used to store the playlist for a save or reload
var player;
var playerStatus;
var shuffled = false;
var loops = false;
//It seems like YouTube API's playlist is always empty.
var playerPlaylist = [] // The actual playlist of the "player"
var current = undefined;
var stopRequested = false;

var ymp_state = "not playing";

Array.prototype.first = function (predicate) {
    for (var i = 0; i < this.length; i++) {
        if (predicate(this[i])) {
            return this[i];
        }
    }
	return undefined;
}

// http://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array-in-javascript
function shuffle(o){
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
}

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

function GetVideoData(id, callback) {
	//see https://developers.google.com/youtube/v3/getting-started
	var parts = "snippet";
	var fields = "snippet(title)";
	var parts = ["snippet"];
	var api_key = "AIzaSyDRKWm5fN5nDmAzOCFqLvw6b4dmez_1byE";
	var s = "https://www.googleapis.com/youtube/v3/videos?id={0}&key={1}&fields=items({2})&part={3}";
	
	s = s.format(
		id, 
		api_key, 
		fields,
		parts.join(','));
	$.ajax({
		url: s, 
		success: function(result) {
			// Maybe check for the data here
			callback(result);
		},
		error: function(xhr, ajaxOptions, thrownError) {
			// This shall not fail!
			GetVideoData(id, callback);
		}
	});
}

function onPlayerStateChange(event) {
	playerStatus = event.data != -1 ? event.data : playerStatus;
	
	switch (event.data) {
		case -1: break; // Will not happen
		case YT.PlayerState.ENDED:
		ymp_state = "ended";
		next();
		break;
		case YT.PlayerState.PLAYING:
		ymp_state = "playing";
		break;
		case YT.PlayerState.PAUSED:
		ymp_state = "paused";
		break;
		case YT.PlayerState.BUFFERING:
		ymp_state = "buffering";
		break;
		case YT.PlayerState.CUED:
			play();
		break;
	}
	stopRequested = false;
	SendDisplayInfo();
}

function onPlayerReady(event) {
	//console.debug("Player ready");
	//event.target.playVideo(); 
}

function ErrorMessage(code) {
	/*
	2 – The request contains an invalid parameter value. For example, this error occurs if you specify a video ID that does not have 11 characters, or if the video ID contains invalid characters, such as exclamation points or asterisks.
	5 – The requested content cannot be played in an HTML5 player or another error related to the HTML5 player has occurred.
	100 – The video requested was not found. This error occurs when a video has been removed (for any reason) or has been marked as private.
	101 – The owner of the requested video does not allow it to be played in embedded players.
	150 – This error is the same as 101. It's just a 101 error in disguise!
	*/
	switch (code) {
	// Invalid video ID.
	case 2: return "Invalid ID";
	
	// General HTML5 error.
	case 5: return "HTML5 error";
	
	// Video/Music not found.
	case 100: return "Not found";
	
	// Cannot be played on embedded player.
	case 101:
	case 150: return "Embed disabled";
	}
}

function onPlayerError(event) {
	
	
	chrome.extension.sendMessage({
		action: "OnError",
		data: event
	}); 
	current.error = { 
		last: {
			code: event.data, 
			message: ErrorMessage(event.data)
		}, 
		previous: current.error 
	};
	next();
}

function onYouTubeIframeAPIReady() {
	console.debug("Youtube API Ready");
	
	player = new YT.Player('player', {
		height: '200',
		width: '200',
		events: {
            'onReady': onPlayerReady,
			//'onPlaybackQualityChange': onPlayerPlaybackQualityChange,
			'onStateChange': onPlayerStateChange,
			'onError': onPlayerError
        }
	});
	
	//Remplacer les '//' htmlencoded par des vrais '//' htmldecoded
	var url = document.getElementById('player').getAttribute("src").replace("%3A%2F%2F", "://");
	document.getElementById('player').setAttribute('src', url);
}

function uploadPlayList() {
    player.loadPlaylist({
        list: songList,
        index: "",
        startSeconds: 0,
        suggestedQuality: "small"
	});
}
function copyin(to, from) { for (var attrname in from) { to[attrname] = from[attrname]; } };
function merge() { var to = {}; arguments.forEach(function(from) { copyin(to, from); }); return to; }

function Song(id, url, callback) {
	this.id = id;
	this.url = url;
	this.ymp_uuid = guid();
	
	var this_______scope_solver = this;
	
	// Call to YouTube Data to get more information.
	GetVideoData(this.id, function(video_data) {
		// Add the data to the video object
		video_data['items'].forEach(function(d){ 
			copyin(this_______scope_solver, d); 
		});
		// notify change
		callback();
	});
}

function cueSong(url) {
	var pathAndQuery = url.split('?');
	if (pathAndQuery.length != 2)
		return;
	
	var queries = pathAndQuery[1].split('&');
	
	queries.forEach(function(currentValue, index, array) {
		var query = currentValue;
		var s = query.split('=');
		var key = s[0];
		if (s.length === 2 && key === "v") {			
			var value = s[1];
			playerPlaylist.push(new Song(value, url, SendDisplayInfo));
		}
	});
}

function ConvertPlayerStateToString(s) {
	switch (s) {
		case -1: return "unstarted";
		case YT.PlayerState.ENDED: return "ended";
		case YT.PlayerState.PLAYING: return "playing";
		case YT.PlayerState.PAUSED: return "paused";
		case YT.PlayerState.BUFFERING: return "buffering";
		case YT.PlayerState.CUED: return "cued";
	}
}

function SendDisplayInfo() {
	var GetVideoObject = function(offset) {
		if (current === undefined)
			return undefined;
	
		var playlist = playerPlaylist;
		var i = playlist.indexOf(current) + offset; 
		
		if (i > playlist.length - 1 || i < 0)
			return undefined;
			
		var obj = playlist[i];
		
		if (offset === 0) {
			obj.time = player.getCurrentTime();
			if (obj.duration === undefined) {
				obj.duration = player.getDuration();
			}
		}
		
		return obj;
	};
	
	var d = {
		'state': ymp_state,
		'loop': loops,
		'shuffle': shuffled,
		'current': current,
		'previous': GetVideoObject(-1),
		'next': GetVideoObject(1),
		'playlist': playerPlaylist
	};

	chrome.extension.sendMessage({ action: "DisplayInfo", data: d }); 
}

function playAt(i) {
	current = playerPlaylist[i];
	player.cueVideoById({ videoId: current.id, startSeconds: 0, suggestedQuality: "small" });
}

function play() { 
	if(playerStatus === YT.PlayerState.PAUSED || playerStatus === YT.PlayerState.CUED) {
		player.playVideo();
	} else if (playerPlaylist.length > 0) {
		playAt(0);
	}
}
function stop() { 
	player.stopVideo(); 
	ymp_state = "stopped";
	SendDisplayInfo();
}
function pause() { 
	player.pauseVideo(); 
}
function next() { 
	var i = (current !== undefined)? playerPlaylist.indexOf(current) + 1 : 0;
	stop();
	if (i < playerPlaylist.length) {
		playAt(i);
	} else if (loops) {
		playAt(0);
	} else {
		current = undefined;
	}
}

function previous() { 
	var i = (current !== undefined)? playerPlaylist.indexOf(current) - 1 : 0;
	stop();
	if (i >= 0 && i < playerPlaylist.length) {
		playAt(i);
	} else if (loops) {
		playAt(playerPlaylist.length - 1);
	} else {
		current = undefined;
	}
}

function shufflePlaylist() { playerPlaylist = shuffle(playerPlaylist); shuffled = true; }
function setLoop(on) { loops = on; }

function downloadPlayList() {
    songList = player.getPlaylist();
}

// NOT TESTED YET
function ChangeList(newList) {
	var correctList = [];
	
	newList.forEach(function(song_newlist) {
		var equivalent = playerPlaylist.find(function(s) {
			return (song_newlist.ymp_uuid !== undefined && song_newlist.ymp_uuid === song_oldlist.ymp_uuid);
		});
		if (equivalent != undefined) {
			correctList.push(equivalent);
		} else {
			correctList.push(new Song(song_newlist.id, song_newlist.url, SendDisplayInfo));
		}
	});
	
	playerPlaylist = correctList;
	if (!playerPlaylist.contains(current))
		stop();
}

if(chrome && chrome.extension) {
	chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
		if (sender === this)
			return false;
		switch(request.action) {
			// these will SendDisplayInfo() upon player state change
			case "Play": play(); break;
			case "Stop": stop(); break;
			case "Pause": pause(); break;
			case "Next": next(); break;
			case "Previous": previous(); break;
			
			case "Loop": setLoop(request.data); SendDisplayInfo(); break;
			case "Shuffle": shufflePlaylist(); SendDisplayInfo(); break;
			case "ChangeList": SetNewList(request.data); SendDisplayInfo(); break;
			case "AddUrl": cueSong(request.data); SendDisplayInfo(); break;
			case "GetInfo": SendDisplayInfo(); break;
		}
		
		return true;
	});
}