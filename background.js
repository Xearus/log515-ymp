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
		playerStatus = event.data;
        switch (playerStatus)
        {
            case YT.PlayerState.ENDED:

            break;
            case YT.PlayerState.PLAYING:

            break;
            case YT.PlayerState.PAUSED:

            break;
            case YT.PlayerState.BUFFERING:

            break;
            case YT.PlayerState.CUED:

            break;
        }
	}
	
	function onPlayerReady(event) {
		console.debug("Player ready");
        event.target.playVideo();
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
			
			player.cueVideoById({
				videoId: value,
				startSeconds: 0,
				suggestedQuality: "small"
				});
				
			sendDisplayInfo();
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
	var playlist = player.getPlaylist();
	var i = player.getPlaylistIndex() + offset; 
	
	if (typeof playlist === 'undefined' || playlist === null || playlist.length <= 0)
		return {};
	
	if ( i > playlist.length - 1)
		return {};
	else
		return playlist[i];
}

function sendDisplayInfo()
{
	chrome.extension.sendMessage({
		action: "DisplayInfo",
		data: 
		{
			state: ConvertPlayerStateToString(player.getPlayerState()),
			loop: loops,
			shuffle: shuffled,
			current: {
				time: player.getCurrentTime(),
				duration: player.getDuration(),
				url: player.getVideoUrl(),
				id: getVideoIDRelativeToCurrent(0)
			},
			previous: {
				id: getVideoIDRelativeToCurrent(-1)
			},
			next: {
				id: getVideoIDRelativeToCurrent(1)
			}
		}
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