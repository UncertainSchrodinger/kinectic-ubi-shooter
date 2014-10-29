KEY_LEFT = 37
KEY_RIGHT = 39

class Controller
  constructor: (@connection) ->

  moveLeft: ->
    @connection.sendMoveLeft()

  moveRight: ->
    @connection.sendMoveRight()

  handleKeyCode: (keyCode) ->
    switch keyCode
      when KEY_LEFT then @moveLeft()
      when KEY_RIGHT then @moveRight()
