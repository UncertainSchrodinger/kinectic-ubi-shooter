class Game
  constructor: ->
    @connection = new Connection
    @controller = new Controller(@connection)

    $(window).keyup (e) =>
      @controller.handleKeyCode(e.keyCode)

new Game
