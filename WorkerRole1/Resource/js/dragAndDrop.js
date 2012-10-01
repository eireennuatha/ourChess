function dnd() {
  document.addEventListener('mousedown', mouseDownEvent, false);
  document.addEventListener("touchstart", mouseDownEvent, true);
}

function mouseDownEvent(e) {
  var event = bindEvent(e);
  var aboutEvent = isDragPossible(event);
  if (aboutEvent === false) { return; }

  dragObj = aboutEvent;

  socket.emit('dragStart', {
    myColor: myColor,
    drawSquare: dragObj.point,
    piece: dragObj.piece
  });

  socket.emit('drag', { // ü������ ���� ��� �𼭸��� �������� �� ��ǥ ����   
    myColor: myColor,
    PIECE_SIZE: PIECE_SIZE,
    top: event.clientY - $(theCanvas).offset().top,
    left: event.clientX - $(theCanvas).offset().left
  });

  theDragCanvas.style.visibility = 'visible';

  setPointXY(event); // �巡�� ĵ������ ��ġ�� ���� ���콺 Ŀ���� ����    

  drawSquare(context, dragObj.point.x, dragObj.point.y); // ĵ������ �巡�׸� ������ ��ġ�� �⹰�� ����� ����
  drawPieceX(dragContext, dragObj.piece, 0, 0); // �巡�� ĵ������ �⹰�� �̹����� �׸�

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

  socket.emit('drag', { // ü������ ���� ��� �𼭸��� �������� �� ��ǥ ����
    myColor: myColor,
    PIECE_SIZE: PIECE_SIZE,
    top: event.clientY - $(theCanvas).offset().top,
    left: event.clientX - $(theCanvas).offset().left
  });

  e.preventDefault();
}

function mouseUpEvent(e) {
  var event = bindEvent(e);
  var aboutEvent = isDropPossible(event);

  if (aboutEvent === false) { // �̵��� �Ұ��� ���
    drawPieceX(context, dragObj.piece, dragObj.point.x, dragObj.point.y);

    socket.emit('dragEnd', {
      myColor: myColor,
      possible: false,
      piece: dragObj.piece,
      point: dragObj.point
    });
  } else { // �̵��� ������ ���
    var nowPoint = aboutEvent;
    
    oldPiecePosition = $.extend(true, [], piecePosition);

    setPosition(piecePosition, dragObj.point, nowPoint, dragObj.piece);
    drawSquare(context, nowPoint.x, nowPoint.y); // ĸ�ĵ� �⹰ ����� (todo. ���̵� ȿ�� �߰�)
    drawPieceX(context, dragObj.piece, nowPoint.x, nowPoint.y);

    socket.emit('dragEnd', {
      myColor: myColor,
      possible: true,
      start: dragObj.point,
      end: nowPoint,
      piece: dragObj.piece,
    });

    // �� ����
    socket.emit('endOfTurn', myColor);
    socket.emit('playSound', 'move');
    movePermission = false;
  }

  theDragCanvas.style.visibility = 'hidden';
  theDragCanvas.width = theDragCanvas.width;
  theDragCanvas.height = theDragCanvas.height;

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