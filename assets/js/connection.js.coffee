class @Connection
  constructor: ->
    @socket = io()

  sendMoveLeft: ->
    @socket.emit('controls move left')

  sendMoveRight: ->
    @socket.emit('controls move right')

  onMoveLeft: (cb) ->
    @socket.on('controls move left', cb)

  onMoveRight: (cb) ->
    @socket.on('controls move right', cb)
