var express = require('express');
var app = express();
var http = require('http').Server(app);
var GameSession = require('./game_session.js')

var io = require('socket.io')(http);

var Body = require('./body.js');

var OpenNi = require('openni');
var context = OpenNi();

var mongoose = require('mongoose');
var db = mongoose.connection;

// List of sockets listening for gestures
var gestures = [];

var activeBody = new Body(0);

context.on('left_shoulder', function(user, x, y, z) {
  if (user === activeBody.id) {
    activeBody.setLeftShoulder(x, y, z);
  }
});

context.on('left_hand', function(user, x, y, z) {
  if (user === activeBody.id) {
    activeBody.setLeftHand(x, y, z);
  }
});

context.on('right_shoulder', function(user, x, y, z) {
  if (user === activeBody.id) {
    activeBody.setRightShoulder(x, y, z);
  }
});

context.on('right_hand', function(user, x, y, z) {
  if (user === activeBody.id) {
    activeBody.setRightHand(x, y, z);
  }
});

setInterval(function() {
  gestures.forEach(function(socket) {
    socket.emit('controller state', {
      direction: 'left',
      active: activeBody.isLeftHandActive()
    });

    socket.emit('controller state', {
      direction: 'right',
      active: activeBody.isRightHandActive()
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

  function ok(cb) {
    cb({
      status: true
    });
  }

  function success(session, cb) {
    ok(cb);

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

    // Update game count
    GameSession.findByIdAndUpdate(socket.channelId, {
      $inc: {
        timesPlayed: 1
      }
    }, function(err, sess) {
      if (err) {
        return console.log("Failed to update count", err);;
      }

      console.log("New replay count", sess);
    });
  });

  socket.on('game end', function(data, fn) {

    // Update game count
    GameSession.findByIdAndUpdate(socket.channelId, {
      gameEndedAt: Date.now()
    }, function(err, sess) {
      if (err) {
        return fail(fn);
      }

      console.log("Game ended", sess);
      ok(fn);
    });
  });

  socket.on('game should end', function() {
    socket.broadcast.to(socket.channelId).emit('game should end');
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

          session.markAsKinectGestureBased();

          // Wait for calibration
          context.on('calibrationsuccess', function(userId) {
            console.log("calibrated for user", userId);

            // Set body for calibrated user
            activeBody = new Body(userId);

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
