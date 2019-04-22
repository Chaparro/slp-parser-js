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

const characters = [{
  id: 0,
  name: "Captain Falcon",
  shortName: "Falcon",
}, {
  id: 1,
  name: "Donkey Kong",
  shortName: "DK",
}, {
  id: 2,
  name: "Fox",
  shortName: "Fox",
}, {
  id: 3,
  name: "Mr. Game & Watch",
  shortName: "G&W",
}, {
  id: 4,
  name: "Kirby",
  shortName: "Kirby",
}, {
  id: 5,
  name: "Bowser",
  shortName: "Bowser",
}, {
  id: 6,
  name: "Link",
  shortName: "Link",
}, {
  id: 7,
  name: "Luigi",
  shortName: "Luigi",
}, {
  id: 8,
  name: "Mario",
  shortName: "Mario",
}, {
  id: 9,
  name: "Marth",
  shortName: "Marth",
}, {
  id: 10,
  name: "Mewtwo",
  shortName: "Mewtwo",
}, {
  id: 11,
  name: "Ness",
  shortName: "Ness",
}, {
  id: 12,
  name: "Peach",
  shortName: "Peach",
}, {
  id: 13,
  name: "Pikachu",
  shortName: "Pikachu",
}, {
  id: 14,
  name: "Ice Climbers",
  shortName: "ICs",
}, {
  id: 15,
  name: "Jigglypuff",
  shortName: "Puff",
}, {
  id: 16,
  name: "Samus",
  shortName: "Samus",
}, {
  id: 17,
  name: "Yoshi",
  shortName: "Yoshi",
}, {
  id: 18,
  name: "Zelda",
  shortName: "Zelda",
}, {
  id: 19,
  name: "Sheik",
  shortName: "Sheik",
}, {
  id: 20,
  name: "Falco",
  shortName: "Falco",
}, {
  id: 21,
  name: "Young Link",
  shortName: "YLink",
}, {
  id: 22,
  name: "Dr. Mario",
  shortName: "Doc",
}, {
  id: 23,
  name: "Roy",
  shortName: "Roy",
}, {
  id: 24,
  name: "Pichu",
  shortName: "Pichu",
}, {
  id: 25,
  name: "Ganondorf",
  shortName: "Ganon",
}];

combos = {};

jsonCombo = {
    "mode": "queue",
    "replay": "",
    "isRealTimeMode": false,
    "queue": [] 
};

jsonString = '';

fs.readdir(testFolder, function(err, items) {
    for (var i=0; i<items.length; i++) {
    	var t_path = path.resolve() + '/files/' + items[i];
    	//console.log(t_path);
    	var absolutePath = t_path.replace(/\\/g,"/");
    	//console.log(absolutePath);

    	const game = new SlippiGame(testFolder + items[i]);
    	console.log(i + ' ' + items[i]);
 	
		const settings = game.getSettings();
		// console.log(settings);
		// console.log('played on: ' + stages[settings.stageId]);
		// console.log(characters[settings.players[0].characterId].name + ' VS ' + characters[settings.players[1].characterId].name);
		// console.log(settings.players[0].nametag + ' VS ' + settings.players[1].nametag);

		// const metadata = game.getMetadata();
		// //console.log(metadata);
		const stats = game.getStats();
		for (var j=0; j<stats.conversions.length; j++) {
			if (stats.conversions[j].endPercent - stats.conversions[j].startPercent >= 60 && stats.conversions[j].didKill == true){
				console.log(stats.conversions[j]) //get the combo
				comboData = {
					startFrame : stats.conversions[j].startFrame,
					endFrame : stats.conversions[j].endFrame,
					path : absolutePath
				};
				jsonCombo.queue.push(comboData);
			} 
		};
		//console.log(stats.conversions);
		// console.log(stats.actionCounts);
		// console.log(stats.overall);
    }
    //jsonString = JSON.stringify(jsonCombo);
    //console.log(jsonString);
    fs.writeFile('./comboData.json', JSON.stringify(jsonCombo), (err) => {
    	if (!err) {
        	console.log('done comboing!');
    	}
	});

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
