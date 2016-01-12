function dnd() {
  document.addEventListener('mousedown', mouseDownEvent, false);
  document.addEventListener("touchstart", mouseDownEvent, true);
}

function mouseDownEvent(e) {
  var event = bindEvent(e);
  var aboutEvent = isDragPossible(event);
  if (aboutEvent === false) { return; }

  GAME.pieceFocused = aboutEvent;
  console.log(GAME.pieceFocused);
  console.log('!!!!!');

  socket.emit('dragStart', {
    myColor: GAME.player.color,
    drawSquare: GAME.pieceFocused.point,
    piece: GAME.pieceFocused.piece
  });

  socket.emit('drag', { // Ã¼½ºÆÇÀ» ¿ÞÂÊ »ó´Ü ¸ð¼­¸®¸¦ ±âÁØÀ¸·Î ÇÑ ÁÂÇ¥ Àü¼Û   
    myColor: GAME.player.color,
    PIECE_SIZE: GAME.conf.size.piece,
    top: event.clientY - $(GAME.elem.canvas).offset().top,
    left: event.clientX - $(GAME.elem.canvas).offset().left
  });

  $(GAME.elem.dragCanvas).css('visibility', 'visible');

  setPointXY(event); // µå·¡±× Äµ¹ö½ºÀÇ À§Ä¡¸¦ ÇöÀç ¸¶¿ì½º Ä¿¼­·Î ÁöÁ¤    

  drawSquare(GAME.elem.context,
      GAME.pieceFocused.point); // Äµ¹ö½º¿¡ µå·¡±×¸¦ ½ÃÀÛÇÑ À§Ä¡ÀÇ ±â¹°ÀÇ ¸ð½ÀÀ» °¡¸²
  drawPieceX(GAME.elem.dragContext,
      GAME.pieceFocused.piece,
      {x: 0, y: 0}); // µå·¡±× Äµ¹ö½º¿¡ ±â¹°ÀÇ ÀÌ¹ÌÁö¸¦ ±×¸²

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

  socket.emit('drag', { // Ã¼½ºÆÇÀ» ¿ÞÂÊ »ó´Ü ¸ð¼­¸®¸¦ ±âÁØÀ¸·Î ÇÑ ÁÂÇ¥ Àü¼Û
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


  if (aboutEvent === false) { // ÀÌµ¿ÀÌ ºÒ°¡ÇÒ °æ¿ì
    drawPieceX(GAME.elem.context,
        GAME.pieceFocused.piece,
        GAME.pieceFocused.point);

    socket.emit('dragEnd', {
      myColor: GAME.player.color,
      possible: false,
      piece: GAME.pieceFocused.piece,
      point: GAME.pieceFocused.point
    });
  } else if (aboutEvent.swap === true) {
    var endPiece = aboutEvent.endPiece;

    GAME.player.swapped = true;

    console.log('Reached drop=swap');


    GAME.repr.prev = $.extend(true, [], GAME.repr.board);

    applySwap(GAME.repr.board,
        GAME.pieceFocused.point,
        endPiece.point,
        GAME.pieceFocused.piece,
        endPiece.piece);

    restrictToSwapped(GAME.pieceFocused.point,
        endPiece.point);

    console.log('reached applySwap');

    drawSquare(GAME.elem.context,
        endPiece.point);
    
    drawSquare(GAME.elem.context,
        GAME.pieceFocused.point);

    drawPieceX(GAME.elem.context,
        GAME.pieceFocused.piece,
        endPiece.point);

    drawPieceX(GAME.elem.context,
        endPiece.piece,
        GAME.pieceFocused.point);

    socket.emit('dragEnd', {
      swap: true,
      myColor: GAME.player.color,
      possible: true,
      start: GAME.pieceFocused.point,
      end: endPiece.point,
      startPiece: GAME.pieceFocused.piece,
      endPiece: endPiece.piece
    });

  } else { // ÀÌµ¿ÀÌ °¡´ÉÇÒ °æ¿ì
    var nowPoint = aboutEvent;
    
    GAME.repr.prev = $.extend(true, [], GAME.repr.board);

    setPosition(GAME.repr.board,
        GAME.pieceFocused.point,
        nowPoint,
        GAME.pieceFocused.piece);
    drawSquare(GAME.elem.context,
        nowPoint); // Ä¸ÃÄµÈ ±â¹° Áö¿ì±â (todo. ÆäÀÌµå È¿°ú Ãß°¡)
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


    // ÅÏ Á¾·á
    socket.emit('endOfTurn', GAME.player.color);
    socket.emit('playSound', 'move');
    GAME.player.allowMove = false;

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