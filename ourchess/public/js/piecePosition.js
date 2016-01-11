function setPosition(position, start, end, piece) {
  position[start.y][start.x] = '';
  position[end.y][end.x] = piece;
}

function getPosition(point) {
  if (!isInBoard(point)) {
    return false;
  }

  return {
    piece: GAME.repr.board[point.y][point.x],
    point: { x: point.x, y: point.y },
    isEmpty: GAME.repr.board[point.y][point.x] == '' ? true : false
  }
}

function getPointXY(event) {
  var e = event.changedTouches === undefined ? event : event.changedTouches[0];

  return {
    x: Math.floor((
        e.pageX - $(GAME.elem.canvas).offset().left -
        Number($(GAME.elem.canvas).css('border-width').replace('px', ''))) /
        GAME.conf.size.piece
      ),

    y: Math.floor((
        e.pageY - $(GAME.elem.canvas).offset().top -
        Number($(GAME.elem.canvas).css('border-width').replace('px', ''))) /
        GAME.conf.size.piece
      )
  };
}

function setPointXY(event) {
  $(GAME.elem.dragCanvas).css('left',
     event.clientX - (GAME.conf.size.piece / 2) -
     $(GAME.elem.canvas).offset().left +
     Number(GAME.elem.boardDiv.css('paddingLeft').replace('px', ''))
   );
  $(GAME.elem.dragCanvas).css('top',
    event.clientY -
     (GAME.conf.size.piece / 2) -
     $(GAME.elem.canvas).offset().top +
     Number(GAME.elem.boardDiv.css('paddingLeft').replace('px', ''))
   );
}

function mirror(point) {
  var mirrored = {
    x: Math.abs(7 - point.x),
    y: Math.abs(7 - point.y)
  };
  return mirrored; 
}