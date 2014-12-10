pulseElement = (elem) ->
  elem.animate({
    'font-size': '120px'
  }, { duration: 80 }).animate({
    'font-size': '100px'
  }, { duration: 80 })

channelId = window.location.pathname.split('/').slice(-1)[0]

connection = new Connection

connection.joinPlayer channelId,
  success: ->
    console.log("joining ok")
  error: ->
    console.log("joining failed")

controller = new Controller(connection)

$('#move-left').on 'touchstart', ->
  pulseElement($('#move-left'))
  controller.startMoveLeft()

$('#move-left').on 'touchend', ->
  controller.stopMoveLeft()

$('#move-right').on 'touchstart', ->
  pulseElement($('#move-right'))
  controller.startMoveRight()

$('#move-right').on 'touchend', ->
  controller.stopMoveRight()

$('#replay').click ->
  connection.replay()

$('#quit').one "click", ->
  connection.doEndGame()
