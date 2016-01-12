function draw(clear) {
  if (clear === true) {
    cleartheCanvas();
    cleartheDragCanvas();
  }

  drawBoard();
  drawPiece();
}

function drawBoard() {
  for (var y = 0; y < 8; y++) {
    for (var x = 0; x < 8; x++) {
      drawSquare(GAME.elem.context,
        {x: x, y: y});
    }
  }
}

function drawSquare(context, point) {
  context.save();
  context.fillStyle = GAME.player.color != 'B' ? (point.x ^ point.y) & 1 ? GAME.conf.color.black : GAME.conf.color.white : (point.x ^ point.y) & 1 ? GAME.conf.color.white : GAME.conf.color.black;
  context.fillRect(point.x * GAME.conf.size.piece, point.y * GAME.conf.size.piece, GAME.conf.size.piece, GAME.conf.size.piece);
  context.restore();

  if (point.x == 0) {
    context.save();
    context.font = '10px serif';
    context.fillStyle = GAME.player.color == 'B' ? (point.x ^ point.y) & 1 ? GAME.conf.color.black : GAME.conf.color.white : (point.x ^ point.y) & 1 ? GAME.conf.color.white : GAME.conf.color.black;
    context.fillText(GAME.player.color == 'B' ? point.y + 1 : Math.abs(8 - point.y), (point.x * GAME.conf.size.piece) + 2, (point.y * GAME.conf.size.piece) + 11);
    context.restore();
  }

  if (point.y == 7) {
    context.save();
    context.font = '10px serif';
    context.fillStyle = GAME.player.color == 'B' ? (point.x ^ point.y) & 1 ? GAME.conf.color.black : GAME.conf.color.white : (point.x ^ point.y) & 1 ? GAME.conf.color.white : GAME.conf.color.black;
    context.fillText(String.fromCharCode(GAME.player.color == 'B' ? 'H'.charCodeAt(0) - point.x : 'A'.charCodeAt(0) + point.x), (point.x * GAME.conf.size.piece) + (GAME.conf.size.piece - 9), (point.y * GAME.conf.size.piece) + (GAME.conf.size.piece - 2));
    context.restore();
  }
}

function drawPiece() {
  for (var y = 0; y < 8; y++) {
    for (var x = 0; x < 8; x++) {
      if (GAME.repr.board[y][x] != '') {
        drawPieceX(GAME.elem.context,
            GAME.repr.board[y][x],
            {x: x, y: y});
      }
    }
  }
}

function drawPieceX(context, piece, point) {
  context.save();
  context.shadowOffsetX = 2;
  context.shadowOffsetY = 2;
  context.shadowBlur = 2;
  context.shadowColor = 'rgba(0, 0, 0, 0.5)';
  context.drawImage(GAME.loadedPiece[piece], point.x * GAME.conf.size.piece, point.y * GAME.conf.size.piece, GAME.conf.size.piece, GAME.conf.size.piece);
  context.restore();
}