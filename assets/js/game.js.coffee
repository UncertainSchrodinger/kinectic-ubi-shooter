class Game
  constructor: ->
    @connection = new Connection
    @controller = new Controller(@connection)

    $(window).keyup (e) =>
      @controller.handleKeyCode(e.keyCode)

new Game

qr = new QRCode "qr-code", {
  width: 300,
  height: 300,
  colorDark : "#000000",
  colorLight : "#EDDCA5",
  correctLevel : QRCode.CorrectLevel.H
}

channelId = $('#qr-code').data('channel');

qr.makeCode('http://192.168.1.121:3000/controller/' + channelId)

connection = new Connection

connection.onPlayerJoined ->
  window.location.pathname = '/game/' + channelId
