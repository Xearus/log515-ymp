QUnit.test( "shuffle(o)", function( assert ) {
	var data = [1, 2, 3, 4];
	var shuffledData = shuffle(data);
	var allShuffled = true;
	for(var i = 0; i < data.length; i++){
		if(data[i] === shuffledData[i])
			allShuffled = false;
	}
	assert.ok( allShuffled, "Array is shuffled" );
});