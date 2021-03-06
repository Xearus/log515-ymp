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
var selectedSong = undefined;

var ymp_state = "not playing";
var isMuted = false;

// Returns the first element compliant to the predicate.
Array.prototype.first = function (predicate) {
    for (var i = 0; i < this.length; i++) {
        if (predicate(this[i])) {
            return this[i];
        }
    }
	return undefined;
}

// Shuffles a list
// http://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array-in-javascript
function shuffle(o){
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
}

// Returns a new GUID generated.
function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

var api_key = "AIzaSyDRKWm5fN5nDmAzOCFqLvw6b4dmez_1byE";

// Gets the video data of a song.
function GetVideoData(id, callback, nfail) {
	//see https://developers.google.com/youtube/v3/getting-started
	var fields = ["snippet(title,channelTitle)", "contentDetails(duration)"];
	var parts = ["snippet", "contentDetails"];
	var s = "https://www.googleapis.com/youtube/v3/videos?id={0}&key={1}&fields=items({2})&part={3}";
	
	if (arguments.length == 2)
		nfail = 0;
	
	s = s.format(
		id, 
		api_key, 
		fields.join(','),
		parts.join(','));
		
	$.ajax({
		url: s, 
		success: function(result) {
			callback(result);
		},
		error: function(xhr, ajaxOptions, thrownError) {
			
			if (nfail < 5) {
				// This shall not fail!
				GetVideoData(id, callback, nfail + 1);
			} else {
				// The information couldn't be loaded.
				// There might be a connection issue.
				// Anyway, this is out of scope for this project.
			}
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
	isMuted = player.isMuted();
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

// Call upon YouTube Player is completely loaded.
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

// Queries YouTube Data API to get the playlist info.
function getPlayListVideosInfo(playListUrl) {
	var pathAndQuery = playListUrl.split('=');
	if (pathAndQuery.length != 2)
		return;
		
	$.get("https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=" + pathAndQuery[1] + "&key=" + api_key,
	null,
	function(data) {
		for(var i = 0; i < data.items.length; i++) {
			if(data.items[i].snippet.title == 'Deleted video')
				continue;
			
			playerPlaylist.push(new Song(data.items[i].snippet.resourceId.videoId, playListUrl, SendDisplayInfo));
		}
	});
}

// Copy all the attributes from one object to another.
function copyin(to, from) { for (var attrname in from) { to[attrname] = from[attrname]; } };
// Copy all the attributes from two objects to a new one.
function merge() { var to = {}; arguments.forEach(function(from) { copyin(to, from); }); return to; }

// Create a song object.
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

// Put a song at the end of the queue based on a youtube url
function cueSong(url) {
	if(url.includes('playlist')) {
		getPlayListVideosInfo(url);
	}
	
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

// Send the information to display to the GUI
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
		'playlist': playerPlaylist,
		'mute': isMuted,
		'selected': selectedSong
	};

	chrome.extension.sendMessage({ action: "DisplayInfo", data: d }); 
}

// Start the player at a specified index.
function playAt(i) {
	current = playerPlaylist[i];
	player.cueVideoById({ videoId: current.id, startSeconds: 0, suggestedQuality: "small" });
}

// Starts the player (index == 0 in the list)
function play() { 
	if(playerStatus === YT.PlayerState.PAUSED || playerStatus === YT.PlayerState.CUED) {
		player.playVideo();
	} else if (playerPlaylist.length > 0) {
		playAt(0);
	}
}

// Stops the current song
function stop() { 
	player.stopVideo(); 
	ymp_state = "stopped";
	SendDisplayInfo();
}

// Pauses the song currently playing (Player feature)
function pause() { player.pauseVideo(); }

// Moves the player to the next song in the list.
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

// Moves the player to the previous song in teh list.
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

// Shuffle the playlist once.
function shufflePlaylist() { playerPlaylist = shuffle(playerPlaylist); shuffled = true; }

// Turns on/off the loop feature. (after the last element, the first will play)
function setLoop(on) { loops = on; }

// Turns on/off mute in the player.
function setMute(on) { isMuted = on; on ? player.mute() : player.unMute(); SendDisplayInfo(); }

// Pushes up a song in the list. (songIndex must be an integer.)
function pushSongUp(songIndex){
	
	songIndex = parseInt(songIndex);
	
	// validates input with playlist borders.
	if( songIndex > 0 ){ 
		var songTemp = playerPlaylist[songIndex];
		
		playerPlaylist[songIndex]     = playerPlaylist[songIndex - 1];
		playerPlaylist[songIndex - 1] = songTemp;
	}	
}

// Pushes down a song in the list. (songIndex must be an integer.)
function pushSongDown(songIndex){
	
	songIndex = parseInt(songIndex);
	
	// validates input with playlist borders.
	if( (playerPlaylist.length >= 2) && (songIndex < (playerPlaylist.length - 1)) ){

		var songTemp = playerPlaylist[songIndex + 1];

		playerPlaylist[songIndex + 1] = playerPlaylist[songIndex];
		playerPlaylist[songIndex] = songTemp;

	}	
}

// Removes a single song from the list. (songIndex must be an integer.)
function removeSong(songIndex){

	songIndex = parseInt(songIndex);
	
	// validate input with playlist borders.
	if( (songIndex >= 0) && (songIndex < playerPlaylist.length) ){
		song = playerPlaylist[songIndex];
		
		// Change the song if we are removing the current one.
		if(ymp_state === "playing"
		&& current !== undefined 
		&& current.ymp_uuid === song.ymp_uuid) {
			next();
		}
		
		playerPlaylist.splice(songIndex, 1);
	}	
}

if(window["QUnit"] === undefined) {
	// Listen for front end commands.
	chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
		if (sender === this || request.action === undefined)
			return false;
		
		var action = ("" + request.action).toLowerCase();
		switch(action) {
			// these will SendDisplayInfo() upon player state change
			case "play": play(); break;
			case "stop": stop(); break;
			case "pause": pause(); break;
			case "next": next(); break;
			case "previous": previous(); break;
			case "loop": setLoop(request.data); SendDisplayInfo(); break;
			case "shuffle": shufflePlaylist(); SendDisplayInfo(); break;
			case "changelist": SetNewList(request.data); SendDisplayInfo(); break;
			case "addurl": cueSong(request.data); SendDisplayInfo(); break;
			case "getinfo": SendDisplayInfo(); break;
			case "mute": setMute(request.data); break;
			case "pushup": pushSongUp(request.data); SendDisplayInfo(); break;
			case "remove": removeSong(request.data); SendDisplayInfo(); break;
			case "pushdown": pushSongDown(request.data); SendDisplayInfo(); break;
			case "select": selectedSong = request.data; SendDisplayInfo(); break;
		}
	
		return true;
	});
}