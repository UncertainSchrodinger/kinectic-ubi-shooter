pulseElement = (elem) ->
  elem.animate({
    'font-size': '120px'
  }, { duration: 80 }).animate({
    'font-size': '100px'
  }, { duration: 80 })

channelId = window.location.pathname.split('/').slice(-1)[0]

connection = new Connection

downEvent = window.navigator.msPointerEnabled ? "MSPointerDown" : "touchstart";
upEvent = window.navigator.msPointerEnabled ? "MSPointerUp" : "touchend";

connection.joinPlayer channelId,
  success: ->
    console.log("joining ok")
  error: ->
    console.log("joining failed")

controller = new Controller(connection)

$('#move-left').on downEvent, ->
  pulseElement($('#move-left'))
  controller.startMoveLeft()

$('#move-left').on upEvent, ->
  controller.stopMoveLeft()

$('#move-right').on downEvent, ->
  pulseElement($('#move-right'))
  controller.startMoveRight()

$('#move-right').on upEvent, ->
  controller.stopMoveRight()

$('#replay').click ->
  connection.replay()

$('#quit').one "click", ->
  connection.doEndGame()
