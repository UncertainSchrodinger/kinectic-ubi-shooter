class @Connection
  constructor: ->
    @socket = io()

  sendControllerState: (state) ->
    @socket.emit 'controller state', state

  onNewControllerState: (cb) ->
    @socket.on('controller state', cb)

  replay: () ->
    @socket.emit('game replay')

  notifyGameEnd: (cb) ->
    @socket.emit 'game end', {}, cb

  joinPlayer: (channel, options) ->
    @socket.emit 'join player', {channel: channel, gestures: options.gestures}, (status) ->
      options.success() unless status.error
      options.error() if status.error

  joinGame: (channel, options) ->
    @socket.emit 'join game', {channel: channel}, (status) ->
      options.success() unless status.error
      options.error() if status.error

  onGameStart: (cb) ->
    @socket.on('game start', cb)

  onPlayerJoined: (cb) ->
    @socket.on('game player joined', cb)

  onGameRestart: (cb) ->
    @socket.on('game replay', cb);

  doEndGame: ->
    @socket.emit('game should end')

  onGameShouldEnd: (cb) ->
    @socket.on('game should end', cb);
