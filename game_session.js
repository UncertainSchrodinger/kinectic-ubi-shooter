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
    match: /kinect|mobile/,
    default: 'mobile'
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

GameSession.methods.hasGame = function() {
  return !!this.gameId;
};

GameSession.methods.hasPlayer = function() {
  return !!this.playerId;
};

GameSession.methods.canStartGame = function() {
  return this.hasGame() && this.hasPlayer();
};

GameSession.methods.markAsKinectGestureBased = function() {
  this.gestureUsed = "kinect";
};

module.exports = mongoose.model('GameSession', GameSession);
