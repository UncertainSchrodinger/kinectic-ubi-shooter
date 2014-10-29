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

qr.makeCode('http://www.google.com')
