const { default: SlippiGame } = require('slp-parser-js');
const path = require('path');

const testFolder = './files/';
const fs = require('fs');

var stages = {};
stages[2] = 'Fountain Of Dreams';
stages[3] = 'Pokemon Stadium';
stages[8] = 'Yoshis Story';
stages[28] = 'Dream Land';
stages[31] = 'Battlefield';
stages[32] = 'Final Destination';

//console.log(stages);

fs.readdir(testFolder, function(err, items) {
    for (var i=0; i<items.length; i++) {

    	const game = new SlippiGame(testFolder + items[i]);
 	
		const settings = game.getSettings();
		console.log(settings);
		console.log('played on: ' + stages[settings.stageId]);

		const metadata = game.getMetadata();
		//console.log(metadata);

		const stats = game.getStats();
		//console.log(stats.actionCounts);
		//console.log(stats.overall);
    }
});


 //    const game = new SlippiGame(file);
 	
	// const settings = game.getSettings();
	// console.log(settings);

	// const metadata = game.getMetadata();
	// console.log(metadata);


// Get metadata - start time, platform played on, etc


// Get computed stats - openings / kill, conversions, etc
//const stats = game.getStats();
//console.log(stats);