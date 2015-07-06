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

chrome.extension.onMessage.addListener(function(request, sender, sendResponse) 
{
    if ( sender === this)
        return false;

    switch(request.action) 
    {
        case "DisplayInfo":
			document.getElementById("btnPlay").hidden = request.data.status != "playing"
			document.getElementById("btnStop").hidden = request.data.status == "playing";
			var select = document.getElementById('selectMusiques');
			select.options[0] = new Option(request.data.previous.id, '');
			select.options[1] = new Option(request.data.current.id, '');
			select.options[2] = new Option(request.data.next.id, '');
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