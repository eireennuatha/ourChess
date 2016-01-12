function basicEvent() {
  socket.emit('join', GAME.conf.room);

  socket.on('id', function (data) {
    GAME.player.color = data.yourColor;
    GAME.player.id = data.yourId;

    if (GAME.player.color == 'Guest') {
      guestEvent();
      setTimeout(function () {
        popup('You are observer.', 'information');
      }, 800);
      socket.emit('sendMessage', { name: 'Server', message: 'Guest[' + GAME.player.id + '] connected. [' + data.length + ' in a room]' });
    } else {
      GAME.enemy.color = data.opponentColor;
      opponentEvent();
      dnd();

      if (GAME.player.color == 'W') {
        whiteEvent();
        setTimeout(function () {
          popup('Copy the URL, and Send it to your friends to invite them to this match.', 'information', true);
        }, 800);
        socket.emit('sendMessage', { name: 'Server', message: 'White connected. [' + data.length + ' in a room]' });
        socket.emit('sendMessage', { name: 'Server', message: 'Waiting for your opponent..' });
      } else {
        setTimeout(function () {
          popup('Game Start.', 'information');
        }, 800);
        socket.emit('sendMessage', { name: 'Server', message: 'Black connected. [' + data.length + ' in a room]' });
      }
    }
  });

  socket.on('setPosition', function (data) {
    GAME.repr.board = GAME.player.color == 'B' ? rotateBoard(data) : data;
    GAME.repr.prev = $.extend(true, [], GAME.repr.board);

    setTimeout(function () {
      GAME.elem.boardDiv.fadeIn(200);
      setRayout();
      draw();
    }, 500);
  });

  socket.on('gameStart', function (data) {
    if (GAME.player.color == 'W') {
      GAME.player.allowMove = true;
      GAME.player.allowSwap = true;
      GAME.repr.recording = [];
      GAME.repr.recording.push({ position: GAME.repr.board.toString(), repetition: 1 });
      popup('Black player connected. Game Start.', 'information');
    }

    GAME.conf.inProcess = true;
    GAME.player.check = false;
    GAME.player.castle = true;
    GAME.player.qCastle = true;
    GAME.player.kCastle = true;

    GAME.player.threefoldRepetition = false;

    GAME.repr.prev = $.extend(true, [], GAME.repr.board);
  });

  socket.on('check', function () {
    popup('Check!', 'warning');
  });

  socket.on('gameEnd', function (data) {
    var winner = GAME.player.color == 'Guest' || data.winner == 'draw' ? 'information' : GAME.player.color == data.winner ? 'success' : 'fail';

    if (GAME.conf.inProcess == true) {
      popup(data.reason + '. ' + data.message, winner);
    } else {
      popup(data.reason + '. ', 'warning');
    }

    GAME.player.allowMove = false;
    GAME.conf.inProcess = false;

    GAME.elem.record.text(GAME.elem.record.text() + 'Server : ' + data.reason + '. ' + data.message + '\n');
    GAME.elem.record.scrollTop(GAME.elem.record[0].scrollHeight);
  });

  socket.on('chatMessage', function (data) {
    GAME.elem.record.text(GAME.elem.record.text() + data.name + ' : ' + data.message + '\n');
    GAME.elem.record.scrollTop(GAME.elem.record[0].scrollHeight);
  });

  socket.on('playSoundGuys', function (data) {
    GAME.elem.audio.setAttribute('src', '/sound/' + data + 'Sound' + (Math.floor(Math.random() * 4) + 1) + '.mp3');
    GAME.elem.audio.play();
  });

  socket.on('error', function (data) {
    location = '/Error';
  });

  socket.on('roomBrokenByWhite', function () {
    location = '/Error';
  });
}

function whiteEvent() {
  socket.on('getPosition', function (data) {
    socket.emit('broadcastPosition', {
      id: data.id,
      position: GAME.repr.board});
  });
}

function opponentEvent() {
  socket.on('turnOff', function (data) {
    if (data == GAME.player.color) {
      GAME.player.allowMove = true;
      GAME.player.allowSwap = true;
      GAME.player.swapped = false;
    }
  });

  socket.on('castle_opponent', function (data) {
    drawSquare(GAME.elem.context,
        mirror(data.oldRook));
    drawPieceX(GAME.elem.context,
        data.myColor + 'R',
        mirror(data.newRook));
    setPosition(GAME.repr.board,
        mirror(data.oldRook),
        mirror(data.newRook),
        data.myColor + 'R');
  });

  socket.on('enPassant_opponent', function (data) {

    GAME.repr.board[mirror(data).y][mirror(data).x] = '';
    drawSquare(GAME.elem.context,
        mirror(data));
  });

  socket.on('dragStart_opponent', function (data) {

    drawSquare(GAME.elem.context,
        mirror(data.drawSquare));
    drawPieceX(GAME.elem.dragContext,
        data.piece,
        {x: 0, y: 0});
    $(GAME.elem.dragCanvas).css('visibility', 'visible');
  });

  socket.on('drag_opponent', function (data) {
    $(GAME.elem.dragCanvas).css('top',
        0 -
        (data.top * (GAME.conf.size.piece / data.PIECE_SIZE)) -
        (GAME.conf.size.piece / 2) +
        (GAME.conf.size.piece * 8) +
        ($(GAME.elem.canvas).outerWidth() - $(GAME.elem.canvas).width()) +
        Number(GAME.elem.boardDiv.css('paddingLeft').replace('px', ''))
      );
    $(GAME.elem.dragCanvas).css('left',
        0 -
        (data.left * (GAME.conf.size.piece / data.PIECE_SIZE)) -
        (GAME.conf.size.piece / 2) +
        (GAME.conf.size.piece * 8) +
        ($(GAME.elem.canvas).outerWidth() - $(GAME.elem.canvas).width()) +
        Number(GAME.elem.boardDiv.css('paddingLeft').replace('px', ''))
      );
  });

  socket.on('dragEnd_opponent', function (data) {
    if (data.possible == false) {
      drawPieceX(GAME.elem.context,
          data.piece,
          mirror(data.point));
    } else {
      GAME.repr.prev = $.extend(true, [], GAME.repr.board);

      console.log(data);

      if (data.swap == true) {

        applySwap(GAME.repr.board,
            mirror(data.start),
            mirror(data.end),
            data.startPiece,
            data.endPiece);

        drawSquare(GAME.elem.context,
            mirror(data.end));
    
        drawSquare(GAME.elem.context,
            mirror(data.start));

        drawPieceX(GAME.elem.context,
            data.startPiece,
            mirror(data.end));

        drawPieceX(GAME.elem.context,
            data.endPiece,
            mirror(data.start));
      } else {

        setPosition(GAME.repr.board,
            mirror(data.start),
            mirror(data.end),
            data.piece);
        drawSquare(GAME.elem.context,
            mirror(data.end)); // 캡쳐된 기물 지우기 (todo. 페이드 효과 추가)
        drawPieceX(GAME.elem.context,
            data.piece,
            mirror(data.end));
      }

      if (GAME.player.color == 'W') {
        var positionString = GAME.repr.board.toString();

        for (var i = 0, max = GAME.repr.recording.length; i < max; i++) {
          if (GAME.repr.recording[i].position == positionString) {
            GAME.repr.recording[i].repetition++;
            break;
          }

          if (i == max - 1) {
            GAME.repr.recording.push({
                position: positionString,
                repetition: 1});
          }
        }
      }
    }

    $(GAME.elem.dragCanvas).css('visibility', 'hidden');
    cleartheDragCanvas();

    var _isCheck = isDengerousOrSafe(GAME.repr.board, findMyKing(GAME.repr.board));
    if (_isCheck.bool) {
      if (isCheckmate(GAME.repr.board, findMyKing(GAME.repr.board), _isCheck.attacker).bool) {
        GAME.player.allowMove  = false;
        socket.emit('gameEnd', {
            reason: 'Checkmate',
            message: GAME.player.color == 'W' ? 'Black Wins!' : 'White Wins!',
            winner: GAME.enemy.color});
      } else {
        GAME.player.check = true;
        socket.emit('check');
        socket.emit('sendMessage', {
            name: 'Server',
            message: 'Check!'});
      }
    } else {
      var _isDraw = isDraw(GAME.repr.board);
      if (_isDraw.bool) {
        GAME.player.allowMove = false;
        socket.emit('gameEnd', {
          reason: _isDraw.reason,
          message: 'Draw',
          winner: 'draw'});
      } else {
        GAME.player.check = false;
      }
    }
  });
}

function guestEvent() {
  socket.on('castle_guest', function (data) {
    if (data.myColor == 'W') {
      drawSquare(GAME.elem.context,
          data.oldRook);
      drawPieceX(GAME.elem.context,
          data.myColor + 'R',
          data.newRook);
      setPosition(GAME.repr.board,
          oldRook,
          newRook,
          data.myColor + 'R');
    } else {
      drawSquare(GAME.elem.context,
          mirror(data.oldRook));
      drawPieceX(GAME.elem.context,
          data.drawPieceX_piece,
          mirror(data.newRook));
      setPosition(GAME.repr.board,
          mirror(data.oldRook),
          mirror(data.newRook),
          data.myColor + 'R');
    }
  });

  socket.on('enPassant_guest', function (data) {
    if (data.myColor == 'W') {
      GAME.repr.board[data.y][data.x] = '';
      drawSquare(GAME.elem.context,
          data);
    } else {
      GAME.repr.board[mirror(data).y][mirror(data).x] = '';
      drawSquare(GAME.elem.context,
          mirror(data));
    }
  });

  socket.on('dragStart_guest', function (data) {
    if (data.myColor == 'W') { // 백의 이동에 대한 게스트 보드의 움직임
      drawSquare(GAME.elem.context,
          data.drawSquare);
      drawPieceX(GAME.dragContext,
          data.piece,
          {x: 0, y: 0});
      $(GAME.elem.dragCanvas).css('visibility', 'visible');
    } else { // 흑의 이동에 대한 게스트 보드의 움직임
      drawSquare(GAME.elem.context,
          mirror(data.drawSquare));
      drawPieceX(GAME.dragContext,
          data.piece,
          {x: 0, y: 0});
      $(GAME.elem.dragCanvas).css('visibility', 'visible');
    }
  });

  socket.on('drag_guest', function (data) {
    if (data.myColor == 'W') { // 백의 이동에 대한 게스트 보드의 움직임
      $(GAME.elem.dragCanvas).css('top',
          (data.top * (GAME.conf.size.piece / data.PIECE_SIZE)) -
          (GAME.conf.size.piece / 2) +
          Number(GAME.elem.boardDiv.css('paddingLeft').replace('px', ''))
        );
      $(GAME.elem.dragCanvas).css('left',
          (data.left * (GAME.conf.size.piece / data.PIECE_SIZE)) -
          (GAME.conf.size.piece / 2) +
          Number(GAME.elem.boardDiv.css('paddingLeft').replace('px', ''))
        );
    } else  { // 흑의 이동에 대한 게스트 보드의 움직임
      $(GAME.elem.dragCanvas).css('top',
          0 -
          (data.top * (GAME.conf.size.piece / data.PIECE_SIZE)) -
          (GAME.conf.size.piece / 2) +
          (GAME.conf.size.piece * 8) +
          ($(GAME.elem.canvas).outerWidth() - $(GAME.elem.canvas).width()) +
          Number(GAME.elem.boardDiv.css('paddingLeft').replace('px', ''))
        );
      $(GAME.elem.dragCanvas).css('left',
          0 -
          (data.left * (GAME.conf.size.piece / data.PIECE_SIZE)) -
          (GAME.conf.size.piece / 2) +
          (GAME.conf.size.piece * 8) +
          ($(GAME.elem.canvas).outerWidth() - $(GAME.elem.canvas).width()) +
          Number(GAME.elem.boardDiv.css('paddingLeft').replace('px', ''))
        );
    }
  });

  socket.on('dragEnd_guest', function (data) {
    if (data.myColor == 'W') { // 백의 이동에 대한 게스트 보드의 움직임
      if (data.possible == false) {
        drawPieceX(GAME.elem.context,
            data.piece,
            data.point);
      } else {
        setPosition(GAME.repr.board,
            data.start,
            data.end,
            data.piece);
        drawSquare(GAME.elem.context,
            data.end); // 캡쳐된 기물 지우기 (todo. 페이드 효과 추가)
        drawPieceX(GAME.elem.context,
            data.piece,
            data.end);
      }
    } else { // 흑의 이동에 대한 게스트 보드의 움직임
      if (data.possible == false) {
        drawPieceX(GAME.elem.context,
            data.piece,
            mirror(data.point));
      } else {
        setPosition(GAME.repr.board,
            mirror(data.start),
            mirror(data.end),
            data.piece);
        drawSquare(GAME.elem.context,
            mirror(data.end)); // 캡쳐된 기물 지우기 (todo. 페이드 효과 추가)
        drawPieceX(GAME.elem.context,
            data.piece,
            mirror(data.end));
      }
    }

    $(GAME.elem.dragCanvas).css('visibility', 'hidden');
    cleartheDragCanvas();

    $(GAME.elem.dragCanvas).css('marginLeft', '0px');
    $(GAME.elem.dragCanvas).css('marginTop', '0px');
  });
}

function rotateBoard(board) {
  var origArr = $.extend(true, [], board);
  var tempArr = $.extend(true, [], board);
  for (var i = 0; i < 8; i++) {
    tempArr[i] = origArr[7 - i].reverse();
  }
  return tempArr;
}

function findMyKing(position) {
  for (var y = 0; y < 8; y++) {
    for (var x = 0; x < 8 ; x++) {
      if (position[y][x] == (GAME.player.color + 'K')) {
        return { x: x, y: y };
      }
    }
  }
}