window.onload = function() {
    document.getElementById("btnPlay").onclick = function() {
		chrome.extension.sendMessage({
			action: this.value
		});
		
        this.value = this.value == "Play" ? "Stop" : "Play";
    }
	
    document.getElementById("btnAddUrl").onclick = function() {
		document.getElementById("txtYoutubeUrl")
    }
}