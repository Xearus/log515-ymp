module("background.js");

test( "shuffle(o)", function( assert ) {
	var check = [1, 2, 3, 4];
	var data = [1, 2, 3, 4];
	var shuffledData = shuffle(data);
	var allSame = true;
	for(var i = 0; i < data.length; i++){
		if(check[i] !== shuffledData[i])
			allSame = false;
	}
	assert.ok( !allSame, "Array is shuffled" );
});

test( "ErrorMessage(code)", function( assert ) {
	assert.ok( ErrorMessage(2) == "Invalid ID", "2 = Invalid ID" );
	assert.ok( ErrorMessage(5) == "HTML5 error", "5 = HTML5 error" );
	assert.ok( ErrorMessage(100) == "Not found", "100 = Not found" );
	assert.ok( ErrorMessage(101) == "Embed disabled", "101 = Embed disabled" );
	assert.ok( ErrorMessage(150) == "Embed disabled", "150 = Embed disabled" );
});

module("popup.js");

test("GetSongLabel(song)", function(assert){
	var song = {
		id: 1234,
		snippet: {
			title: "TEST SONG",
			channelTitle: "TEST CHANNEL",
			contentDetails: {
				duration: 100
			},
		},
		error: {
			last: {
				message: "TEST ERROR"
			}
		}
	}
	
	var string = GetSongLabel(song);
	
	assert.ok(string = song.snippet.title + " - " + song.snippet.channelTitle + " (" + song.snippet.contentDetails.duration + ") (" + song.error.last.message + ")", string);
});