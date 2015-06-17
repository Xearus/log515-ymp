//Ajouter un conteneur pour le player
var divPlayer = document.createElement('div');
divPlayer.setAttribute("id", "player");
document.body.appendChild(divPlayer);

//Injecter l'API de Youtube
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var currentSongIndex;
var songList;
var player;
var playerStatus;
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
    player.cueVideoByUrl({
        mediaContentUrl: url,
        startSeconds: 0,
        suggestedQuality: "small"
        });
}


function downloadPlayList() {
    songList = player.getPlaylist();
}

function shuffle() {
    player.setShuffle(true);
}

function setLoop(on) {
    player.setLoop(on);
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
    }
    return true;
});