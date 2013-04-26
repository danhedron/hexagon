var game = {
	canvas: document.getElementById('the_game'),
	gameoverdiv: document.getElementById('gameover'),
	gameovertimediv: document.getElementById('gameover_time'),
	diffdiv: document.getElementById('diff_text'),
	levelselectdiv: document.getElementById('level_select'),
	timediv: document.getElementById('timer'),
	audio: document.getElementById('audio_player'),
	colorset: 1,
	background: 'rgb(0,0,0)',
	backgroundalt: 'rgb(255,255,255)',
	line: 'rgb(39,255,255)',
	linesize: 25,
	spawnbounds: 500,
	spawnmargin: 160,
	lastshapesize: 0,
	playersize: 5,
	playerang: 0,
	playerspeed: 6,
	playerdir: 0,
	segcount: 6,
	segsize: 1000,
	difficulty: 'easy',
	last: 0,
	t: 0,
	time: 0,
	accum: 0,
	rotation: 0,
	direction: 1,
	rotspeed: 1,
	movespeed: 50,
	timestep: 1/60,
	over: false
};

function updateColor(c) {
	setColor(game.colorset);	
}

function backdrop(c) {
	var cnv = game.canvas;
	c.save();
	// Fill background with background color.
	c.fillStyle = game.background;
	c.fillRect(0, 0, cnv.width, cnv.height);
	// Hexabits
	c.translate(cnv.width/2, cnv.height/2);
	c.rotate(game.rotation);
	c.fillStyle = game.backgroundalt;
	var segsize = game.segsize;
	var segstep = (Math.PI*2) / game.segcount;
	for(var s = 0, i=0; i < game.segcount / 2; s +=segstep*2, i++) {
		c.beginPath();
		c.moveTo(0,0);
		c.lineTo(Math.sin(s)*segsize, Math.cos(s)*segsize);
		c.lineTo(Math.sin(s+(segstep))*segsize, Math.cos(s+(segstep))*segsize);
		c.lineTo(0,0);
		c.fill();
	}
	c.restore();
}

function drawPlayer(c) {
	var cnv = game.canvas;
	c.save();
	c.fillStyle = game.line;
	c.translate(cnv.width/2, cnv.height/2);
	c.rotate(game.rotation - game.playerang);
	c.beginPath();
	c.lineTo(0, game.linesize + 10);
	c.lineTo(-game.playersize, game.linesize + 5);
	c.lineTo( game.playersize, game.linesize + 5);
	c.fill();
	c.restore();
}

function drawHexagons(c) {
	var cnv = game.canvas;
	var segstep = (Math.PI*2) / game.segcount;
	c.save();
	c.translate(cnv.width/2, cnv.height/2);
	c.rotate(game.rotation);
	c.fillStyle = game.line;
	var hexT = game.t*game.movespeed;
	for(var s = 0, i=0; i < game.segcount; s +=segstep, i++) {
		var hexagones = game.hexajohns[i];
		hexagones.forEach(function(dat, n){
			var h = dat[0]-hexT+game.linesize+10, segsize = dat[1];
			var hb = h;
			h = Math.max(0, hb);
			c.beginPath();
			var a = [Math.sin(s-0.005), Math.cos(s-0.005)],
			b = [Math.sin(s+segstep+0.005), Math.cos(s+segstep+0.005)];
		c.lineTo(a[0]*h, a[1]*h);
		c.lineTo(a[0]*hb + a[0]*segsize, a[1]*hb + a[1]*segsize);
		c.lineTo(b[0]*hb + b[0]*segsize, b[1]*hb + b[1]*segsize);
		c.lineTo(b[0]*h, b[1]*h);
		c.fill();
		});
	}
	c.restore();
}

function drawCentroid(c) {
	var cnv = game.canvas;
	var segsize = game.linesize;
	var segstep = (Math.PI*2) / game.segcount;
	c.save();
	c.strokeStyle = game.line;
	c.fillStyle = game.background;
	c.lineWidth = 2;
	c.translate(cnv.width/2, cnv.height/2);
	c.rotate(game.rotation);
	c.beginPath();
	for(var s = 0, i=0; i < game.segcount; s +=segstep, i++) {
		c.lineTo(Math.sin(s)*segsize, Math.cos(s)*segsize);
		c.lineTo(Math.sin(s+(segstep))*segsize, Math.cos(s+(segstep))*segsize);
	}
	c.fill();
	c.stroke();
	c.restore();
}

function drawScore(c) {
	game.timediv.innerHTML = game.time.toFixed(2);
	game.gameovertimediv.innerHTML = game.time.toFixed(2);
	if(game.over) {
		game.gameoverdiv.style.display =
			game.gameovertimediv.style.display = 'block';
	}
	else {
		game.gameoverdiv.style.display =
			game.gameovertimediv.style.display = 'none';
	}
}

function updateRotation(dt) {
	var F = Math.random() * 100;
	if(F < 0.5) {
		game.direction = -game.direction;
	}
	game.rotation += game.direction * game.rotspeed * dt;
}

function updateHexagons(dt) {
	var segstep = (Math.PI*2) / game.segcount;
	var maxH = 0;
	var hexT = game.t * game.movespeed;
	for(var i=0; i < game.segcount; i++) {
		var hexagones = game.hexajohns[i];
		hexagones.forEach(function(dat, n){
			var h = dat[0]-hexT, segsize = dat[1];
			maxH = Math.max(h, maxH);
			if(h+segsize+game.linesize < 0) { game.hexajohns[i].splice(n,1); return; }
			if(!game.over && h<=0 && h+segsize>=0) {
				if((i*segstep)-0.001 < game.playerang && (i*segstep + segstep)+0.001 > game.playerang) {
					game.audio.pause();
					game.over = true;
				}
			}
		});
	}
	if(maxH < game.spawnbounds+game.lastshapesize) {
		// Not enough hexajohns.
		game.spawnHexagons(game.spawnbounds);
	}
}

function updatePlayer(dt) {
	var oldang = game.playerang;
	game.playerang += (game.playerdir * game.playerspeed) * dt;
	while(game.playerang < 0) {
		game.playerang += Math.PI * 2;
	}
	while(game.playerang > Math.PI * 2) {
		game.playerang -= Math.PI * 2;
	}
	// Check that this wouldn't kill the player.
	var murde = false;
	var segstep = (Math.PI*2) / game.segcount;
	var hexT = game.t * game.movespeed;
	for(var i=0; i < game.segcount; i++) {
		var hexagones = game.hexajohns[i];
		hexagones.forEach(function(dat, n){
			var h = dat[0]-hexT, segsize = dat[1];
			if(h<=0 && h+segsize>=0) {
				if((i*segstep)-0.001 < game.playerang && (i*segstep + segstep)+0.001 > game.playerang) {
					murde = true;
				}
			}
		});
	}
	// Move the player back in that case.
	if(murde) {
		game.playerang = oldang;
	}
}

game.levels = {
	easy: {
		ramptime: 240,
		rampmulti: 1.5,
		movespeed: 100,
		playerspeed: 6,
		rotspeed: 2,
		colorset: 3,
	},
	medium: {
		ramptime: 240,
		rampmulti: 1.5,
		movespeed: 150,
		playerspeed: 7,
		rotspeed: 2.5,
		colorset: 4,
	},
	hard: {
		ramptime: 240,
		rampmulti: 1.5,
		movespeed: 200,
		playerspeed: 8,
		rotspeed: 3,
		colorset: 1,
	},
	john: {
		ramptime: 240,
		rampmulti: 1.5,
		movespeed: 250,
		playerspeed: 9,
		rotspeed: 3.5,
		colorset: 1,
	},
	jade: {
		ramptime: 240,
		rampmulti: 1.5,
		movespeed: 250,
		playerspeed: 11,
		rotspeed: 4,
		colorset: 2,
	},
}

game.states = {
	ingame: {
		enter: function() {
			game.timediv.style.display = 'block';
			game.ramptime = game.levels[game.difficulty].ramptime;
			game.rampmulti = game.levels[game.difficulty].rampmulti;
			game.movespeed = game.levels[game.difficulty].movespeed;
			game.playerspeed = game.levels[game.difficulty].playerspeed;
			game.rotspeed = game.levels[game.difficulty].rotspeed;
			game.colorset = game.levels[game.difficulty].colorset;
			game.diffdiv.innerHTML = game.difficulty;
			reset();
		},
		thinkers: [
			updateRotation,
			updateHexagons,
			updatePlayer
			],
		drawers: [
			updateColor,
		backdrop,
		drawPlayer,
		drawHexagons,
		drawCentroid,
		drawScore
			],
		keydown: function(k) {
			switch(k) {
				case 37:
					game.playerdir = 1;
					break;
				case 39:
					game.playerdir = -1;
					break;
				case 32:
					if(game.over) {
						enterState('ingame');
					}
					break;
				case 27:
					enterState('level_select');
					break;
			}
		},
		keyup: function(k) {
			switch(k) {
				case 37:
				case 39:
					game.playerdir = 0;
					break;
			}
		},
		exit: function() {
			game.timediv.style.display = 'none';
			game.gameoverdiv.style.display =
				game.gameovertimediv.style.display = 'none';
		}
	},
	level_select: {
		enter: function() {
			game.levelselectdiv.style.display = 'block';
			game.ramptime = 1;
			game.rampmulti = 1;
			game.tmulti = 45;
		},
		keydown: function(k) {
		},
		keyup: function(k) {

		},
		thinkers: [

			],
		drawers: [
		updateColor,
		backdrop,
		drawCentroid,
			],
		exit: function() {
			game.levelselectdiv.style.display = 'none';
		}
	}
};

game.context = game.canvas.getContext('2d');

var coloursets = [
function(t){
	return [
		"rgb(221,231,225)",
		"rgb(255,255,255)",
		"rgb(39,103,237)",
		];
},
	function(f){
		var t = f * 50;
		var tri = 360 / 3;
		var H1 = t % 360;
		var Hline = (t-tri) % 360;
		return [
			"hsl("+H1+", 95%, 35%)",
			"hsl("+H1+", 65%, 10%)",
			"hsl("+Hline+", 65%, 30%)"
				];
	},
	function(f){
		var t = f * 50;
		var tri = 360 / 3;
		var H1 = t % 360;
		var Hline = (t-tri) % 360;
		return [
			"hsl("+(Math.sin(f)*360)+", 95%, 35%)",
			"hsl("+(Math.cos(f)*360)+", 95%, 35%)",
			"hsl("+Hline+", 65%, 30%)"
				];
	},
	function(f){
		var t = f * 50;
		var tri = 360 / 3;
		var H1 = t % 360;
		var Hline = (t-tri) % 360;
		return [
			"hsl(180, 65%, 20%)",
			"hsl(180, 65%, 10%)",
			"hsl(180, 95%, 35%)",
				];
	},
	function(f){
		var t = f * 50;
		var tri = 360 / 3;
		var H1 = t % 360;
		var Hline = (t-tri) % 360;
		return [
			"hsl(90, 65%, 20%)",
			"hsl(90, 65%, 10%)",
			"hsl(90, 95%, 35%)",
				];
	},
];

game.shapes = [
	[
		[[0,30],[120,30]],
		[[0,30],[120,30]],
		[[0,30]],
		[[0,30],[120,30]],
		[[0,30],[120,30]],
		[       [120,30]]
	],
	[
		[[0,30],[120,30],[240,30],[360,30]],
		[[0,30],[120,30],[240,30],[360,30]],
		[[0,30],         [240,30]],
		[[0,30],[120,30],[240,30],[360,30]],
		[[0,30],[120,30],[240,30],[360,30]],
		[       [120,30],         [360,30]]
	],
	[
		[[0,150]],
		[  ],
		[[0,150]],
		[  ],
		[[0,150]],
		[  ]
	],
	[
		[[0,30]],
		[[0,30]],
		[[0,30]],
		[[0,30]],
		[[0,30]],
		[]
	],
	[
		[[0  ,30]],
		[  [40 ,30]],
		[    [80,30]],
		[[0  ,30]],
		[  [40 ,30]],
		[    [80,30]]
	],
	[
		[[0  ,30],[120,30]],
		[  [40 ,30],[160,30]],
		[    [80,30],[200,30]],
		[[0  ,30],[120,30]],
		[  [40 ,30],[160,30]],
		[    [80,30],[200,30]]
	],
	[
		[[0  ,40],    [120,40]],
		[    [40 ,40],    [160,40]],
		[        [80 ,40],    [200,40]],
		[[0  ,40],   [120,40]],
		[    [40 ,40],   [160,40]],
		[        [80 ,40],   [200,40]]
	],
	[
		[[0 ,30],        [140,30],        [300,30]],
		[        [80,30],         [220,30]],
		[[0 ,30],        [140,30],        [300,30]],
		[        [80,30],         [220,30]],
		[[0 ,30],        [140,30],        [300,30]],
		[        [80,30],         [220,30]]
	],
	[
		[[0,40],         ,[200, 40],[300,40]],
		[[0,40],[100, 40],          [300,40]],
		[       [100, 40],[200, 40]],
		[[0,40],         ,[200, 40],[300,40]],
		[[0,40],[100, 40],          [300,40]],
		[       [100, 40],[200, 40]]
	],
	];

game.hexajohns = [
[[100,30]],
	[[200,30]],
	[],
	[[100,30]],
	[[200,30]],
	[],
	];

game.audiotracks = [
{src:'sound/Buskerdroid_-_01_-_Blast.ogg', title:'Buskerdroid - Blast'},
{src:'sound/Buskerdroid_-_03_-_God_Bless_His_Mess.ogg', title:'Buskerdroid - God Bless His Mess'},
{src:'sound/Buskerdroid_-_05_-_I_Want_You.ogg', title:'Buskerdroid - I Want You'},
{src:'sound/Buskerdroid_-_02_-_Gameboy_Love.ogg', title:'Buskerdroid - Gameboy Love'},
{src:'sound/Buskerdroid_-_04_-_3Distortion.ogg', title:'Buskerdroid - 3Distrortion.ogg'}
];

window.requestAnimFrame = (function(){
	return  window.requestAnimationFrame       ||
	window.webkitRequestAnimationFrame ||
	window.mozRequestAnimationFrame    ||
	function( callback ){
		window.setTimeout(callback, 1000 / 60);
	};
})();

window.addEventListener('keydown', function(event) {
	game.states[game.currentstate].keydown(event.keyCode);
});

window.addEventListener('keyup', function(event) {
	game.states[game.currentstate].keyup(event.keyCode);
});

function reset() { 
	game.t = 0;
	game.time = 0;
	game.hexajohns = [
		[],
		[],
		[],
		[],
		[],
		[]
		];
	game.spawnHexagons(game.spawnbounds/2);
	game.over = false;
	game.rotation = 0;
	game.direction = 1;

	// Pick a new audio track.
	var track = game.audiotracks[Math.floor(game.audiotracks.length*Math.random())];
	game.audio.src = track.src;
	console.log('Now Playing: ' + track.title + " ("+game.audio.src+")");
	game.audio.load();
	game.audio.play();
}

function over() {
	game.over = true;
	game.audio.pause();
}

game.pause = function(p) {
	game.paused = p;
	if(game.paused) {
		game.audio.pause();
	}
	else {
		game.audio.play();
	}
}

game.start = function() {
	game.pause(false);
	document.getElementById('start_button').style.display = 'none';
}

function setColor(i) {
	var cs = coloursets[i](game.t);
	game.background = cs[0];
	game.backgroundalt = cs[1];
	game.line = cs[2];
}

game.spawnHexagons = function(p) {
	var i = Math.floor((game.shapes.length)*Math.random());
	var shape = game.shapes[i];
	var shapesize = 0;
	var offset = Math.floor(7 * Math.random());
	var hexT = game.t * game.movespeed;
	shape.forEach(function(h, n){
		h.forEach(function(s) {
			shapesize = Math.max(s[0]+s[1], shapesize);
			game.hexajohns[(n+offset)%6].push([hexT+p+game.lastshapesize+game.spawnmargin+s[0], s[1]]);
		});
	});
	game.lastshapesize = shapesize;
}

function enterState(state) {
	if(game.currentstate) {
		game.states[game.currentstate].exit();
	}
	game.drawers = game.states[state].drawers;
	game.thinkers = game.states[state].thinkers;
	game.states[state].enter();
	game.currentstate = state;
}
enterState('level_select');

function gloop(e) {
	if(game.last == 0) {
		game.last = e;
	}
	var rdt = (e-game.last)/1000;
	game.last = e;
	game.accum += rdt;

	if(game.accum > game.timestep) {
		var ramp = Math.min(game.t, game.ramptime)/game.ramptime;
		game.dt = game.timestep * (1+ramp*game.rampmulti);
		if(!game.over) {
			game.time += rdt;
			game.t += game.dt;
		}
		var cnv = game.canvas;
		var c = game.context;

		//Handle thinking
		game.thinkers.forEach(function(t){ t.call(game, game.over ? 0 : game.dt); });
		game.drawers.forEach(function(d){ d.call(game, c); });

		game.accum -= game.timestep;
	}

	requestAnimFrame(function(t) {gloop(t)});
}

gloop(0);
