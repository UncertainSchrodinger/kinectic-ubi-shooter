var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.set('view engine', 'ejs');

app.engine('html', require('ejs').renderFile);

app.use(require("connect-assets")());

app.use(express.static(__dirname + '/public'));

io.on('connection', function(socket) {
  socket.on('controls move right', function() {
    console.log("moving right");
    socket.broadcast.emit('controls move right');
  });

  socket.on('controls move left', function() {
    console.log("moving left");
    socket.broadcast.emit('controls move left');
  });
});

app.get('/', function(req, res) {
  res.render('index');
});

app.get('/game', function(req, res) {
  res.render('game');
});

http.listen(3000, function() {
  console.log('listening on *:3000');
});
