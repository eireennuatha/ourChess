function dnd() {
  document.addEventListener('mousedown', mouseDownEvent, false);
  document.addEventListener("touchstart", mouseDownEvent, true);
}

function mouseDownEvent(e) {
  var event = bindEvent(e);
  var aboutEvent = isDragPossible(event);
  if (aboutEvent === false) { return; }

  GAME.pieceFocused = aboutEvent;

  socket.emit('dragStart', {
    myColor: GAME.player.color,
    drawSquare: GAME.pieceFocused.point,
    piece: GAME.pieceFocused.piece
  });

  socket.emit('drag', { // 체스판을 왼쪽 상단 모서리를 기준으로 한 좌표 전송   
    myColor: GAME.player.color,
    PIECE_SIZE: GAME.conf.size.piece,
    top: event.clientY - $(GAME.elem.canvas).offset().top,
    left: event.clientX - $(GAME.elem.canvas).offset().left
  });

  $(GAME.elem.dragCanvas).css('visibility', 'visible');

  setPointXY(event); // 드래그 캔버스의 위치를 현재 마우스 커서로 지정    

  drawSquare(GAME.elem.context,
      GAME.pieceFocused.point); // 캔버스에 드래그를 시작한 위치의 기물의 모습을 가림
  drawPieceX(GAME.elem.dragContext,
      GAME.pieceFocused.piece,
      {x: 0, y: 0}); // 드래그 캔버스에 기물의 이미지를 그림

  e.preventDefault();

  document.addEventListener('mousemove', mouseMoveEvent, false);
  document.addEventListener('mouseup', mouseUpEvent, false);

  document.addEventListener("touchmove", mouseMoveEvent, true);
  document.addEventListener("touchend", mouseUpEvent, true);
  document.addEventListener("touchcancel", mouseUpEvent, true);
}

function mouseMoveEvent(e) {
  var event = bindEvent(e);
  setPointXY(event);

  socket.emit('drag', { // 체스판을 왼쪽 상단 모서리를 기준으로 한 좌표 전송
    myColor: GAME.player.color,
    PIECE_SIZE: GAME.conf.size.piece,
    top: event.clientY - $(GAME.elem.canvas).offset().top,
    left: event.clientX - $(GAME.elem.canvas).offset().left
  });

  e.preventDefault();
}

function mouseUpEvent(e) {
  var event = bindEvent(e);
  var aboutEvent = isDropPossible(event);

  if (aboutEvent === false) { // 이동이 불가할 경우
    drawPieceX(GAME.elem.context,
        GAME.pieceFocused.piece,
        GAME.pieceFocused.point);

    socket.emit('dragEnd', {
      myColor: GAME.player.color,
      possible: false,
      piece: GAME.pieceFocused.piece,
      point: GAME.pieceFocused.point
    });
  } else { // 이동이 가능할 경우
    var nowPoint = aboutEvent;
    
    GAME.repr.prev = $.extend(true, [], GAME.repr.board);

    setPosition(GAME.repr.board,
        GAME.pieceFocused.point,
        nowPoint,
        GAME.pieceFocused.piece);
    drawSquare(GAME.elem.context,
        nowPoint); // 캡쳐된 기물 지우기 (todo. 페이드 효과 추가)
    drawPieceX(GAME.elem.context,
        GAME.pieceFocused.piece,
        nowPoint);

    socket.emit('dragEnd', {
      myColor: GAME.player.color,
      possible: true,
      start: GAME.pieceFocused.point,
      end: nowPoint,
      piece: GAME.pieceFocused.piece,
    });

    console.log('reached it');
    console.log(nowPoint);
    // 턴 종료
    socket.emit('endOfTurn', GAME.player.color);
    socket.emit('playSound', 'move');
    GAME.player.allowMove = false;
    console.log(GAME.player.allowMove);
  }

  $(GAME.elem.dragCanvas).css('visibility', 'hidden');
  GAME.elem.dragCanvas.width = GAME.elem.dragCanvas.width;
  GAME.elem.dragCanvas.height = GAME.elem.dragCanvas.height;

  e.preventDefault();

  document.removeEventListener('mousemove', mouseMoveEvent, false);
  document.removeEventListener('mouseup', mouseUpEvent, false);

  document.removeEventListener("touchmove", mouseMoveEvent, true);
  document.removeEventListener("touchend", mouseUpEvent, true);
  document.removeEventListener("touchcancel", mouseUpEvent, true);
}

function bindEvent(event) {
  try {
    return event.changedTouches[0];
  } catch (e) {
    return event;
  }
}