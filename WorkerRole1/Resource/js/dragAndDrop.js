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

    dragObj = possible;

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

    document.addEventListener('mousemove', mouseMoveEvent, false);
    document.addEventListener('mouseup', mouseUpEvent, false);
}

function mouseUpEvent(event) {
    var possible = isDropPossible(event);

    if (possible == false) { // �̵��� �Ұ��� ���
        drawPieceX(context, dragObj.piece, dragObj.point.x, dragObj.point.y);

        socket.emit('dragEnd', {
            myColor: myColor,
            possible: false,
            piece: dragObj.piece,
            point: dragObj.point
        });
    } else { // �̵��� ������ ���
        var nowPoint = possible;

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
        movePermission = false;
    }

    if (myColor == 'W') { // jQuery�� extend �޼ҵ�(Deep Copy)�� �̿��ϱ� ���� Ŭ���̾�Ʈ ���̵忡�� ȸ���Ͽ� ������.
        socket.emit('positionUpdate', { room: room, position: piecePosition });
    } else if (myColor == 'B') {
        socket.emit('positionUpdate', { room: room, position: rotateBoard(piecePosition) });
    }

    theDragCanvas.style.visibility = 'hidden';
    dragContext.clearRect(0, 0, theDragCanvas.width, theDragCanvas.height);

    document.removeEventListener('mousemove', mouseMoveEvent, false);
    document.removeEventListener('mouseup', mouseUpEvent, false);
}

function mouseMoveEvent(event) {
    setPointXY(event);

    socket.emit('drag', { // ü������ ���� ��� �𼭸��� �������� �� ��ǥ ����
        myColor: myColor,
        PIECE_SIZE: PIECE_SIZE,
        top: event.clientY - $(theCanvas).offset().top,
        left: event.clientX - $(theCanvas).offset().left
    });
}