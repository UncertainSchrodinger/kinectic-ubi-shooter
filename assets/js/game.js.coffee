qr = new QRCode "qr-code", {
  width: 300,
  height: 300,
  colorDark : "#000000",
  colorLight : "#EDDCA5",
  correctLevel : QRCode.CorrectLevel.H
}

channelId = $('#qr-code').data('channel');

qr.makeCode('http://192.168.0.104:3000/controller/' + channelId)

connection = new Connection

connection.onPlayerJoined ->
  window.location.pathname = '/game/' + channelId
