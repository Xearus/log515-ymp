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
}

chrome.extension.onMessage.addListener(function(request, sender, sendResponse) 
{
    if ( sender === this)
        return false;

    switch(request.action) 
    {
        case "DisplayInfo":

        break;
        case "ChangeSongPlaying":
        
        break;
    }

    return true;
});