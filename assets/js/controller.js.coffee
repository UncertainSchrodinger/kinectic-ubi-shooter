class Controller
  constructor: (@connection) ->

  startMoveLeft: ->
    @connection.sendControllerState 
      direction: 'left',
      active: true

  stopMoveLeft: ->
    @connection.sendControllerState 
      direction: 'left',
      active: false

  startMoveRight: ->
    @connection.sendControllerState 
      direction: 'right',
      active: true

  stopMoveRight: ->
    @connection.sendControllerState 
      direction: 'right',
      active: false
