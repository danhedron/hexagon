var game = {
	canvas: document.getElementById('the_game'),
	gameoverdiv: document.getElementById('gameover'),
	gameovertimediv: document.getElementById('gameover_time'),
	timediv: document.getElementById('timer'),
	audio: document.getElementById('audio_player'),
	colorset: 1,
	background: 'rgb(0,0,0)',
	backgroundalt: 'rgb(255,255,255)',
	line: 'rgb(39,255,255)',
	linesize: 25,
	spawnbounds: 500,
	spawnmargin: 120,
	lastshapesize: 0,
	playersize: 5,
	playerang: 0,
	playerspeed: 0.1,
	playerdir: 0,
	segcount: 6,
	segsize: 1000,
	ramptime: 240,
	rampmulti: 1.5,
	tmulti: 90,
	last: 0,
	t: 0,
	tick: 0,
	time: 0,
	accum: 0,
	timestep: 1/60,
	over: false
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
		var t = f * 0.5;
		var tri = 360 / 3;
		var H1 = t % 360;
		var Hline = (t-tri) % 360;
		return [
			"hsl("+H1+", 95%, 35%)",
			"hsl("+H1+", 65%, 90%)",
			"hsl("+Hline+", 65%, 45%)"
		];
	}
];

game.shapes = [
	[
		[[0,30],[100,30]],
		[[0,30],[100,30]],
		[[0,30]],
		[[0,30],[100,30]],
		[[0,30],[100,30]],
		[[100,30]]
	],
	[
		[[0,30]],
		[[0,30]],
		[[0,30]],
		[[0,30]],
		[[0,30]],
		[[100,30]]
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
		[[40 ,30]],
		[[80,30]],
		[[0  ,30]],
		[[40 ,30]],
		[[80,30]]
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
		[[0 ,30],        [120,30],        [240,30]],
		[        [60,30],         [180,30]],
		[[0 ,30],        [120,30],        [240,30]],
		[        [60,30],         [180,30]],
		[[0 ,30],        [120,30],        [240,30]],
		[        [60,30],         [180,30]]
	],
	[
		[[0,50],         ,[240, 50]],
		[[0,50],[120, 50]],
		[       [120, 50],[240, 50]],
		[[0,50],         ,[240, 50]],
		[[0,50],[120, 50]],
		[       [120, 50],[240, 50]]
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
	switch(event.keyCode) {
		case 37:
			game.playerdir = 1;
			break;
		case 39:
			game.playerdir = -1;
			break;
		case 32:
			if(game.over) {
				reset();
				game.pause(false);
			}
			break;
	}
});
window.addEventListener('keyup', function(event) {
	switch(event.keyCode) {
		case 37:
		case 39:
			game.playerdir = 0;
			break;
	}
});

function reset() { 
	game.t = 0;
	game.hexajohns = [
			[[100,30]],
			[[200,30]],
			[],
			[[100,30]],
			[[200,30]],
			[],
		];
	game.time = 0;
	game.tick = 0;
	game.spawnHexagons(game.spawnbounds/2);
	game.over = false;
	game.pause(true);

	// Pick a new audio track.
	var track = game.audiotracks[Math.floor(game.audiotracks.length*Math.random())];
	game.audio.src = track.src;
	console.log('Now Playing: ' + track.title + " ("+game.audio.src+")");
	game.audio.load();
	game.audio.addEventListener("load", function() { 
		console.log('Track loaded');
	}, true);	
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
	shape.forEach(function(h, n){
		h.forEach(function(s) {
			shapesize = Math.max(s[1], shapesize);
			game.hexajohns[(n+offset)%6].push([game.t+p+game.lastshapesize+game.spawnmargin+s[0], s[1]]);
		});
	});
	game.lastshapesize = shapesize;
}

game.drawers = [
function updateColor(c) {
	setColor(game.colorset);	
},
	function backdrop(c) {
		var cnv = game.canvas;
		c.save();
		// Fill background with background color.
		c.fillStyle = game.background;
		c.fillRect(0, 0, cnv.width, cnv.height);
		// Hexabits
		c.translate(cnv.width/2, cnv.height/2);
		c.rotate(game.tick*(Math.PI/180));
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
	},

	function drawPlayer(c) {
		var cnv = game.canvas;
		c.save();
		c.fillStyle = game.line;
		c.translate(cnv.width/2, cnv.height/2);
		c.rotate(game.tick*(Math.PI/180) - game.playerang);
		c.beginPath();
		c.lineTo(0, game.linesize + 10);
		c.lineTo(-game.playersize, game.linesize + 5);
		c.lineTo( game.playersize, game.linesize + 5);
		c.fill();
		c.restore();
	},

	function drawHexagons(c) {
		var cnv = game.canvas;
		var segstep = (Math.PI*2) / game.segcount;
		c.save();
		c.translate(cnv.width/2, cnv.height/2);
		c.rotate(game.tick*(Math.PI/180));
		c.fillStyle = game.line;
		for(var s = 0, i=0; i < game.segcount; s +=segstep, i++) {
			var hexagones = game.hexajohns[i];
			hexagones.forEach(function(dat, n){
				var h = dat[0]-game.t+game.linesize+10, segsize = dat[1];
				var hb = h;
				h = Math.max(0, hb);
				c.beginPath();
				var a = [Math.sin(s), Math.cos(s)],
				b = [Math.sin(s+segstep), Math.cos(s+segstep)];
			c.lineTo(a[0]*h, a[1]*h);
			c.lineTo(a[0]*hb + a[0]*segsize, a[1]*hb + a[1]*segsize);
			c.lineTo(b[0]*hb + b[0]*segsize, b[1]*hb + b[1]*segsize);
			c.lineTo(b[0]*h, b[1]*h);
			c.fill();
			});
		}
		c.restore();
	},

	function drawCentroid(c) {
		var cnv = game.canvas;
		var segsize = game.linesize;
		var segstep = (Math.PI*2) / game.segcount;
		c.save();
		c.strokeStyle = game.line;
		c.fillStyle = game.background;
		c.lineWidth = 2;
		c.translate(cnv.width/2, cnv.height/2);
		c.rotate(game.tick*(Math.PI/180));
		c.beginPath();
		for(var s = 0, i=0; i < game.segcount; s +=segstep, i++) {
			c.lineTo(Math.sin(s)*segsize, Math.cos(s)*segsize);
			c.lineTo(Math.sin(s+(segstep))*segsize, Math.cos(s+(segstep))*segsize);
		}
		c.fill();
		c.stroke();
		c.restore();
	},
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
];

game.thinkers = [
function updateHexagons(dt) {
	var segstep = (Math.PI*2) / game.segcount;
	var maxH = 0;
	for(var i=0; i < game.segcount; i++) {
		var hexagones = game.hexajohns[i];
		hexagones.forEach(function(dat, n){
			var h = dat[0]-game.t, segsize = dat[1];
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
},

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
		for(var i=0; i < game.segcount; i++) {
			var hexagones = game.hexajohns[i];
			hexagones.forEach(function(dat, n){
				var h = dat[0]-game.t, segsize = dat[1];
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
]

function gloop(e) {
	if(game.last == 0) {
		game.last = e;
	}
	var rdt = (e-game.last)/1000;
	game.last = e;
	game.accum += rdt;

	if(game.accum > game.timestep) {
		var rampmod = Math.min(game.ramptime, game.time)/game.ramptime;
		game.dt = game.timestep * (game.tmulti + rampmod*game.rampmulti*game.tmulti);
		game.tick += game.over ? game.dt/2 : game.dt;
		if(!(game.over||game.paused)) {
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

reset();
gloop(0);
