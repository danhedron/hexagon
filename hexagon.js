var game = {
	canvas: document.getElementById('the_game'),
	background: 'rgb(0,0,0)',
	backgroundalt: 'rgb(255,255,255)',
	line: 'rgb(39,255,255)',
	linesize: 25,
	playersize: 5,
	playerang: 0,
	playerspeed: 0.1,
	playerdir: 0,
	segcount: 6,
	segsize: 1000,
	tmulti: 0.05,
	last: (new Date()).getTime(),
	t: 0,
	time: 0
};

game.context = game.canvas.getContext('2d');

var coloursets = [
	[[221,231,225],[255,255,255],[39,103,237]]
];

game.hexajohns = [
	[[100,60],[200,60]],
	[[240,60],[340,60]],
	[[360,60],[400,60]],
	[[100,60],[200,60]],
	[[240,60],[340,60]],
	[[360,60],[400,60]],
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
			game.playerdir = -1;
			break;
		case 39:
			game.playerdir = 1;
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

function backdropColor(i) {
	game.background = "rgb("+coloursets[i][0]+")";
	game.backgroundalt = "rgb("+coloursets[i][1]+")";
	game.line = "rgb("+coloursets[i][2]+")";
}

game.drawers = [function backdrop(c) {
	var cnv = game.canvas;
	c.save();
	// Fill background with background color.
	c.fillStyle = game.background;
	c.fillRect(0, 0, cnv.width, cnv.height);
	// Hexabits
	c.translate(cnv.width/2, cnv.height/2);
	c.rotate(game.t*(Math.PI/180));
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
	c.rotate(game.t*(Math.PI/180) + game.playerang);
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
	c.rotate(game.t*(Math.PI/180));
	c.fillStyle = game.line;
	for(var s = 0, i=0; i < game.segcount; s +=segstep, i++) {
		var hexagones = game.hexajohns[i];
		hexagones.forEach(function(dat, n){
			var h = dat[0]-game.t, segsize = dat[1];
			if(h+segsize < 0) { game.hexajohns[i].splice(n); }
			var hb = h;
			h = Math.max(0, h);
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
	c.rotate(game.t*(Math.PI/180));
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
		c.save();
		c.fillStyle = "rgb(0,0,0)";
		c.fillRect(0,0,150,30);
		c.fillStyle = "rgb(255,255,255)";
		c.font = "15px sans-serif";
		c.fillText(game.time/1000, 5, 20);
		c.restore();
	}
];
function gloop(e) {
	e = e || (new Date()).getTime();
	game.time += (e - game.last);
	game.dt = (e - game.last) * game.tmulti;
	game.t += game.dt;
	game.last = e;
	var cnv = game.canvas;
	var c = game.context;
	// Move player
	game.playerang += (game.playerdir * game.playerspeed) * game.dt;
	game.drawers.forEach(function(d){ d.call(game, c); })
	requestAnimFrame(function() {gloop()});
}

backdropColor(0);
gloop();
