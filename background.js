//Ajouter un conteneur pour le player
var divPlayer = document.createElement('div');
divPlayer.setAttribute("id", "player");
document.body.appendChild(divPlayer);

//Injecter l'API de Youtube
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var player;
var playerStatus;
function onYouTubeIframeAPIReady() {
	console.debug("Youtube API Ready");
	
	player = new YT.Player('player', {
		height: '200',
		width: '200',
		videoId: 'nqLArgCbh70',
		events: {
            'onReady': onPlayerReady,
			'onStateChange': onPlayerStateChange
        }
	});
	
	function onPlayerStateChange(event) {
		playerStatus = event.data;
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

//TODO: NO WORK POUR L'INSTANT
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    switch(request.action) {
        case "Play":
			play();
		case "Stop":
			stop();
        break;
    }
    return true;
});