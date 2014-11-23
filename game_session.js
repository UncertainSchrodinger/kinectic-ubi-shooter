var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test');

var GameSession = mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now
  },
  gameStartedAt: Date,
  gameEndedAt: Date,
  gestureUsed: {
    type: String,
    match: /kinect|mobile/
  },
  timesPlayed: Number,
  gameId: {
    type: String,
    default: null
  },
  playerId: {
    type: String,
    default: null
  }
})

GameSession.findById = function(id, cb) {
  GameSession.findOne({
    _id: id
  }, cb);
};

GameSession.methods.canStartGame = function() {
  return !!this.gameId && !!this.playerId;
};

GameSession.methods.hasGame = function() {
  return !!this.gameId;
};

GameSession.methods.hasPlayer = function() {
  return !!this.playerId;
};

module.exports = mongoose.model('GameSession', GameSession);
