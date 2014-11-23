// NOTE: On all the trig calculations we completely ignore depth
//

var express = require('express');
var app = express();
var http = require('http').Server(app);
var GameSession = require('./game_session.js')

var io = require('socket.io')(http);

var OpenNi = require('openni');
var context = OpenNi();

var Vector = require('./vector');

var mongoose = require('mongoose');
var db = mongoose.connection;

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
}, 50);

app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

app.use(require("connect-assets")());

app.use(express.static(__dirname + '/public'));

io.on('connection', function(socket) {

  function fail(cb) {
    cb({
      status: false
    });
  }

  function success(session, cb) {
    cb({
      status: true
    });

    // Check if we need to notify game start
    if (session.canStartGame()) {
      io.sockets.in(session.id).emit('game start');
    }
  }

  socket.on('controller state', function(state) {
    socket.broadcast.to(socket.channelId).emit('controller state', state);
  });

  socket.on('game replay', function() {
    socket.broadcast.to(socket.channelId).emit('game replay');
  });

  socket.on('join player', function(data, fn) {
    var id = data.channel;

    GameSession.findById(id, function(err, session) {
      // Most likely session was not found
      if (err) {
        return fail(fn);
      }

      console.log("Found session", session);

      if (!session.hasPlayer()) {
        console.log("player joining session");
        socket.channelId = id;
        socket.join(id);

        // Check if this is a gesture player and save socket
        if (data.gestures) {
          gestures.push(socket);

          // Wait for calibration
          context.on('calibrationsuccess', function(userId) {
            socket.emit('game start');
          });
        } else {
          session.playerId = socket.id;
        }

        session.save(function(err) {
          if (err) {
            console.log("Could not save session");
            return fail(fn);
          }

          // Notify of new player
          console.log("Sending player joined to ", id);
          io.emit('game player joined');

          success(session, fn);
        });
      }
    });
  });

  socket.on('join game', function(data, fn) {
    var id = data.channel;

    GameSession.findById(id, function(err, session) {
      if (err) {
        console.log("Game could not join session!");
        return fail(fn);
      }

      if (!session.hasGame()) {
        console.log("Game joining session");

        socket.channelId = id;
        session.gameId = socket.id;
        socket.join(id);

        session.save(function(err, session) {
          if (err) {
            console.log("Could not save game to session!");
            return fail(fn)
          };

          success(session, fn);
        });
      } else {
        fail(fn);
      }
    });
  });
});

app.get('/', function(req, res) {
  var currentSession = new GameSession();

  currentSession.save(function(err, session) {
    console.log("Creating session for id", session.id);

    res.render('index', {
      channelId: session.id
    });
  });
});

app.get('/game/:id', function(req, res) {
  res.render('game');
});

app.get('/controller/:id', function(req, res) {
  res.render('controller');
});

db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function callback() {
  console.log("Got database connection");

  http.listen(3000, function() {
    console.log('listening on *:3000');
  });
});
