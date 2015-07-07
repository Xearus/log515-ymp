window.onload = function() {
    document.getElementById("btnPlay").onclick = function() {
		chrome.extension.sendMessage({
			action: "Play"
		});
    }
	
    document.getElementById("btnAddUrl").onclick = function() {
        chrome.extension.sendMessage({
            action: "AddUrl",
            data: document.getElementById("txtYoutubeUrl").value
        });
    }

    document.getElementById("btnAddCurrentUrl").onclick = function() {

        chrome.tabs.query({'active': true, 'lastFocusedWindow': true }, function (tabs) {

            var url = tabs[0].url;

            chrome.extension.sendMessage({
                action: "AddUrl",
                data: url
            });

            document.getElementById("txtYoutubeUrl").value = url;
        });
    }

    document.getElementById("btnNext").onclick = function() {
        chrome.extension.sendMessage({
            action: this.value
        });
    }

    document.getElementById("btnPrevious").onclick = function() {
        chrome.extension.sendMessage({
            action: this.value
        });
    }

    document.getElementById("btnLoop").onclick = function() {
        chrome.extension.sendMessage({
            action: this.value,
            data: document.getElementById("btnLoop").checked
        });
    }

    document.getElementById("btnShuffle").onclick = function() {
        chrome.extension.sendMessage({
            action: this.value
        });
    }
	
	chrome.extension.sendMessage({
		action: "GetInfo"
	});
}

function GetSongLabel(song)
{
	if(song === undefined)
		return "";
	else if(song.snippet !== undefined && song.snippet.title !== undefined)
		return song.snippet.title;
	else
		return song.id;
}

function AddAllSongs(playlist)
{
	var select = document.getElementById('selectMusiques');
	var length = Math.max(select.options.length, playlist.length);
	for (i = 0; i < length; i++) {
		var o = null;
		if (i < playlist.length)
		{
			var song = playlist[i];
			o = new Option(GetSongLabel(song), "");
		}
		select.options[i] = o;
	}
}

chrome.extension.onMessage.addListener(function(request, sender, sendResponse) 
{
    if ( sender === this)
        return false;

    switch(request.action) 
    {
        case "DisplayInfo":
			document.getElementById("btnPlay").hidden = request.data.status != "playing"
			document.getElementById("btnStop").hidden = request.data.status == "playing";
			
			AddAllSongs(request.data.playlist);
        break;
        case "ChangeSongPlaying":
        break;
		case "ChangePlayStatus":
		//document.getElementById("btnPlay").hidden = request.data;
		//document.getElementById("btnStop").hidden = !request.data;
		break;
    }

    return true;
});