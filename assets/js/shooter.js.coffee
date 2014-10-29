connection = new Connection

connection.onMoveLeft ->
  console.log "MOVE LEFT"

connection.onMoveRight ->
  console.log "MOVE RIGHT"
