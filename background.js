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
var songList;
var player;
var playerStatus;
var shuffled = false;
var loops = false;

// First, checks if it isn't implemented yet.
if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

function GetVideoData(id, callback)
{
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


//It seems like YouTube API's playlist is always empty.
var playerPlaylist = []

function onYouTubeIframeAPIReady() {
	console.debug("Youtube API Ready");
	
	player = new YT.Player('player', {
		height: '200',
		width: '200',
		events: {
            'onReady': onPlayerReady,
			'onStateChange': onPlayerStateChange
        }
	});
	
	function onPlayerStateChange(event) {
		//playerStatus = event.data;
        
		sendDisplayInfo();
	}
	
	function onPlayerReady(event) {
		//console.debug("Player ready");
        //event.target.playVideo();
    }
	
	//Remplacer les '//' htmlencoded par des vrais '//' htmldecoded
	var url = document.getElementById('player').getAttribute("src").replace("%3A%2F%2F", "://");
	document.getElementById('player').setAttribute('src', url);
}

function play() {
	if(playerStatus != YT.PlayerState.PLAYING)
		player.playVideo();
}

function stop() {
	if(playerStatus == YT.PlayerState.PLAYING)
		player.stopVideo();
}

function next() {
    player.nextVideo();
}

function previous() {
    player.previousVideo();
}


function uploadPlayList() {
    player.loadPlaylist({
        list: songList,
        index: "",
        startSeconds: 0,
        suggestedQuality: "small"
        });
}

function merge(obj1, obj2)
{
	var obj3 = {};
	for (var attrname in obj2) 
		obj3[attrname] = obj2[attrname];
	for (var attrname in obj1) 
		obj3[attrname] = obj1[attrname];
		
	return obj3;
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
		if (s.length === 2 && key === "v")
		{			
			var value = s[1];
			var i = playerPlaylist.length;
			playerPlaylist.push({"id": value, "url": url});
			GetVideoData(value, function(video_data) {
				var d = video_data['items'];
				for(var di in video_data['items'])
					playerPlaylist[i] = merge(playerPlaylist[i], d[di]);
				sendDisplayInfo();
			});
			player.cueVideoById({
				videoId: value,
				startSeconds: 0,
				suggestedQuality: "small"
				});
		}
	});
}


function downloadPlayList() {
    songList = player.getPlaylist();
}

function shuffle() {
    player.setShuffle(true);
	shuffled = true;
}

function setLoop(on) {
    player.setLoop(on);
	loops = on;
}

function ConvertPlayerStateToString(playerStatus)
{
	var str; 
	switch (playerStatus)
	{
		case -1:
		str = "unstarted";
		break;
		case YT.PlayerState.ENDED:
		str = "ended";
		break;
		case YT.PlayerState.PLAYING:
		str = "playing";
		break;
		case YT.PlayerState.PAUSED:
		str = "paused";
		break;
		case YT.PlayerState.BUFFERING:
		str = "buffering";
		break;
		case YT.PlayerState.CUED:
		str = "cued";
		break;
	}
	return str;
}

function getVideoIDRelativeToCurrent(offset)
{
	var playlist = playerPlaylist;//player.getPlaylist();
	var i = player.getPlaylistIndex() + offset; 
	
	if (typeof playlist === 'undefined' 
	|| playlist === null 
	|| playlist.length <= 0 
	|| i === NaN
	|| i > playlist.length - 1
	|| i < 0)
		return undefined;
	
	return playlist[i];
}

function getVideoObject(offset)
{
	var obj = {};
	obj.id = getVideoIDRelativeToCurrent(offset);
	
	if (offset == 0)
	{
		obj.time = player.getCurrentTime();
		obj.duration = player.getDuration();
		obj.url = player.getVideoUrl();
	}
	
	return ((obj.id === undefined) ? undefined : obj);
}

function sendDisplayInfo()
{
	var d = {};
	d.state = ConvertPlayerStateToString(player.getPlayerState())
	d.loop = loops;
	d.shuffle = shuffled;
	d.current = getVideoObject(0);
	d.previous = getVideoObject(-1);
	d.next = getVideoObject(1);
	d.playlist = playerPlaylist;
	
	chrome.extension.sendMessage({
		action: "DisplayInfo",
		data: d
	}); 
}

//TODO: NO WORK POUR L'INSTANT
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {

    if ( sender === this)
        return false;

    switch(request.action) {
        case "Play":
			play();
        break;
        case "Stop":
            stop();
        break;
        case "Next":
            next();
        break;
        case "Previous":
            previous();
        break;
        case "Loop":
            setLoop(request.data);
        break;
        case "Shuffle":
            shuffle();
        break;
        case "Remove":
            removeSong(request.data);
        break;
        case "AddUrl":
            cueSong(request.data);
        break;
		case "GetInfo":
			sendDisplayInfo();
		break;
    }
	
	return true;
	
});