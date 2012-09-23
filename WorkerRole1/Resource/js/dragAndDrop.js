function dnd() {
    document.addEventListener('mousedown', mouseDownEvent, false);
    document.addEventListener("touchstart", touchHandler, true);
    document.addEventListener("touchmove", touchHandler, true);
    document.addEventListener("touchend", touchHandler, true);
    document.addEventListener("touchcancel", touchHandler, true);
}

function touchHandler(event) {
    var touches = event.changedTouches,
    first = touches[0],
    type = "";

    switch (event.type) {
        case "touchstart": type = "mousedown"; break;
        case "touchmove": type = "mousemove"; break;
        case "touchend": type = "mouseup"; break;
        default: return;
    }

    var simulatedEvent = document.createEvent("MouseEvent");
    simulatedEvent.initMouseEvent(type, true, true, window, 1, first.screenX, first.screenY, first.clientX, first.clientY, false, false, false, false, 0, null);

    first.target.dispatchEvent(simulatedEvent);
    event.preventDefault();
}

function mouseDownEvent(event) {
    var possible = isDragPossible(event);

    if (possible == false) {
        return;
    }

    var p = possible[0];
    dragObj = possible[1];

    socket.emit('dragStart', {
        myColor: myColor,
        drawSquare_x: Math.floor(p.x),
        drawSquare_y: Math.floor(p.y),
        drawPieceX_piece: dragObj.piece
    });

    socket.emit('drag', { // ü������ ���� ��� �𼭸��� �������� �� ��ǥ ����   
        myColor: myColor,
        PIECE_SIZE: PIECE_SIZE,
        topMargin: event.pageY - Number($(chessBoardDiv).offset().top),
        leftMargin: event.pageX - Number($(chessBoardDiv).offset().left)
    });

    theDragCanvas.style.visibility = 'visible';

    setPointXY(event); // �巡�� ĵ������ ��ġ�� ���� ���콺 Ŀ���� ����    

    drawSquare(context, Math.floor(p.x), Math.floor(p.y)); // ĵ������ �巡�׸� ������ ��ġ�� �⹰�� ����� ����
    drawPieceX(dragContext, dragObj.piece, 0, 0); // �巡�� ĵ������ �⹰�� �̹����� �׸�

    document.addEventListener('mousemove', mouseMoveEvent, false);
    document.addEventListener('mouseup', mouseUpEvent, false);
}

function mouseUpEvent(event) {
    var possible = isDropPossible(event);

    if (possible == false) { // �̵��� �Ұ��� ���
        drawPieceX(context, dragObj.piece, Math.floor(dragObj.p.y), Math.floor(dragObj.p.x));

        socket.emit('dragEnd', {
            myColor: myColor,
            possible: false,
            drawPiece_piece: dragObj.piece,
            drawPiece_x: Math.floor(dragObj.p.y),
            drawPiece_y: Math.floor(dragObj.p.x)
        });
    } else { // �̵��� ������ ���
        var p = possible;
        setPosition(piecePosition, dragObj.p, getPosition(p).p, dragObj.piece);
        drawSquare(context, Math.floor(p.x), Math.floor(p.y)); // ĸ�ĵ� �⹰ ����� (todo. ���̵� ȿ�� �߰�)
        drawPieceX(context, dragObj.piece, Math.floor(p.x), Math.floor(p.y));

        socket.emit('dragEnd', {
            myColor: myColor,
            possible: true,
            setPosition_p_x: dragObj.p.x,
            setPosition_p_y: dragObj.p.y,
            setPosition_getPosition_x: getPosition(p).p.x,
            setPosition_getPosition_y: getPosition(p).p.y,
            setPosition_piece: dragObj.piece,
            drawPieceAndSquare_piece: dragObj.piece,
            drawPieceAndSquare_x: Math.floor(p.x),
            drawPieceAndSquare_y: Math.floor(p.y)
        });

        // �� ����
        socket.emit('endOfTurn', myColor);
        movePermission = false;
    }

    if (myColor == 'W') { // jQuery�� extend �޼ҵ�(Deep Copy)�� �̿��ϱ� ���� Ŭ���̾�Ʈ ���̵忡�� ȸ���Ͽ� ������.
        socket.emit('positionUpdate', { room: room, position: piecePosition });
    } else if (myColor == 'B') {
        socket.emit('positionUpdate', { room: room, position: rotateBoard(piecePosition) });
    }

    theDragCanvas.style.visibility = 'hidden';
    dragContext.clearRect(0, 0, theDragCanvas.width, theDragCanvas.height);

    theDragCanvas.style.marginTop = '0px';
    theDragCanvas.style.marginLeft = '0px';

    document.removeEventListener('mousemove', mouseMoveEvent, false);
    document.removeEventListener('mouseup', mouseUpEvent, false);
}

function mouseMoveEvent(event) {
    setPointXY(event);

    socket.emit('drag', { // ü������ ���� ��� �𼭸��� �������� �� ��ǥ ����
        myColor: myColor,
        PIECE_SIZE: PIECE_SIZE,
        topMargin: event.pageY - Number($(chessBoardDiv).offset().top),
        leftMargin: event.pageX - Number($(chessBoardDiv).offset().left)
    });
}