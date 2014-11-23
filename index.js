// NOTE: On all the trig calculations we completely ignore depth
//

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var redis = require("redis");
var client = redis.createClient();

var OpenNi = require('openni');
var context = OpenNi();

var Vector = require('./vector');

var leftHand = null;
var leftShoulder = null;

var rightHand = null;
var rightShoulder = null;

// List of sockets listening for gestures
var gestures = [];

// Checks if the radians are between 22.5 to -22.5 degrees
function isInMovementRange(angleInRadians) {
  return angleInRadians >= -0.392699082 && angleInRadians <= 0.392699082;
}

// Normalize hand coordinates to the shoulder and return the angle between them
//
// We do this by setting shoulder as the origin and then
// adjusting the hand vector to this origin.
function calculateNormalizedArmAngle(shoulder, hand) {
  var normalizedHand = hand.subtract(shoulder);
  var normalizedShoulder = new Vector(normalizedHand.x, 0, 0);
  return normalizedShoulder.angleTo(normalizedHand);
}

function hasLeftHand() {
  return !!leftShoulder && !!leftHand;
}

function hasRightHand() {
  return !!rightShoulder && !!rightHand;
}

function isLeftHandActive() {
  if (!hasLeftHand()) {
    return false;
  }

  var angle = calculateNormalizedArmAngle(leftShoulder, leftHand);

  return isInMovementRange(angle);
}

function isRightHandActive() {
  if (!hasRightHand()) {
    return false;
  }

  var angle = calculateNormalizedArmAngle(rightShoulder, rightHand);

  return isInMovementRange(angle);
}

// Flips x-axis to be positive
function normalizedHand(x, y, z) {
  return new Vector(Math.abs(x), y, z);
}

context.on('left_shoulder', function(user, x, y, z) {
  leftShoulder = new Vector(x, y, 0);
});

context.on('left_hand', function(user, x, y, z) {
  leftHand = normalizedHand(x, y, 0);
});

context.on('right_shoulder', function(user, x, y, z) {
  rightShoulder = new Vector(x, y, 0);
});

context.on('right_hand', function(user, x, y, z) {
  rightHand = normalizedHand(x, y, 0);
});

setInterval(function() {
  gestures.forEach(function(socket) {
    socket.emit('controller state', {
      direction: 'left',
      active: isLeftHandActive()
    });

    socket.emit('controller state', {
      direction: 'right',
      active: isRightHandActive()
    });
  });
}, 100);

var GameSession = function(id) {
  this.id = id;
  this.game = null;
  this.player = null;
}

GameSession.prototype.setGame = function(game) {
  this.game = game;

  this.notifyGameStartIfNeeded();
};

GameSession.prototype.setPlayer = function(player) {
  this.player = player;

  io.emit('game player joined');

  this.notifyGameStartIfNeeded();
};

GameSession.prototype.notifyGameStartIfNeeded = function() {
  if (this.player && this.game) {
    console.log("starting game");
    this.game.emit('game start');
    this.player.emit('game start');
  }
};

var sessions = [];

function findSessionWithId(id) {
  for (var i = 0; i < sessions.length; i++) {
    if (("" + sessions[i].id) == id) {
      return sessions[i];
    }
  }

  return null;
}

app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

app.use(require("connect-assets")());

app.use(express.static(__dirname + '/public'));

io.on('connection', function(socket) {

  socket.on('controller state', function(state) {
    socket.broadcast.emit('controller state', state);
  });

  socket.on('game replay', function() {
    socket.broadcast.emit('game replay');
  });

  socket.on('join player', function(data, fn) {
    console.log("found session", session);
    var session = findSessionWithId(data.channel);

    if (session && !session.player) {
      console.log("player joining session");
      socket.channelId = data.channel;
      socket.join(data.channel);

      // Check if this is a gesture player and save socket
      if (data.gestures) {
        gestures.push(socket);

        // Wait for calibration
        context.on('calibrationsuccess', function(userId) {
          socket.emit('game start');
        });
      } else {
        session.setPlayer(socket);
      }

      fn({
        status: true
      });

    } else {
      fn({
        status: false
      });
    }
  });

  socket.on('join game', function(data, fn) {
    var session = findSessionWithId(data.channel);
    console.log("found session", session);

    if (session && !session.game) {
      console.log("game joining session");
      session.setGame(socket);
      socket.channelId = data.channel;
      socket.join(data.channel);

      fn({
        status: true
      });
    } else {
      fn({
        status: false
      });
    }
  });
});

app.get('/', function(req, res) {
  client.incr('id', function(err, id) {
    var newSession = new GameSession(id);
    sessions.push(newSession);

    console.log("Creating session for id", id);

    res.render('index', {
      channelId: id
    });
  });
});

app.get('/game/:id', function(req, res) {
  res.render('game');
});

app.get('/controller/:id', function(req, res) {
  res.render('controller');
});

http.listen(3000, function() {
  console.log('listening on *:3000');
});
