function init(room, loadedPiece) {
  this.socket = io.connect();

  window.GAME = {
      elem: {
        canvas: document.getElementById('canvas'),
        context: document.getElementById('canvas').getContext('2d'),

        dragCanvas: document.getElementById('dragCanvas'),
        dragContext: document.getElementById('dragCanvas').getContext('2d'),

        record: $('#record'),
        textInput: $('#textInput'),

        boardDiv: $('#chessBoard'),
        audio: document.createElement('audio'),
        bgPopup: $("#bgPopup"),
        Popup: $("#Popup"),
        contents: $('#contents') },

      conf: {

        color: {
            black: '#b58863',
            white: '#f0d9b5'},

        size: {
            piece: null,
            board: null},

        inProcess: false,

        room: room},

      player: {
        id: null,
        color: null,
        allowMove: false,
        orientation: null,

        threefoldRepetition: false,

        check: false,
        castle: true,
        qCastle: true,
        kCastle: true},

      enemy: {color: null},

      repr: {
        board: null,
        prev: null,
        recording: []},

      pieceFocused: null,
      loadedPiece: loadedPiece
  }

/*
    room: room,

    theCanvas: document.getElementById('canvas'),
    context: document.getElementById('canvas').getContext('2d'),

    theDragCanvas: document.getElementById('dragCanvas'),
    dragContext: document.getElementById('dragCanvas').getContext('2d'),

    chessBoardDiv: $('#chessBoard'),
    record: $('#record'),
    textInput: $('#textInput'),

    blackColor: '#b58863',
    WhiteColor: '#f0d9b5',

    gameOn: false,

    myId: null,
    myColor: null,
    enemyColor: null,
    movePermission: false,

    PIECE_SIZE: null,
    BOARD_SIZE: null,
    orientation: null,

    oldPiecePosition: null,
    piecePosition: null,
    dragObj: null,



    recordingPosition: [],
    threefoldRepetition: false,

    check: false,
    castle: true,
    queenSideCastle: true,
    kingSideCastle: true,

audioElement: document.createElement('audio'),
bgPopup: $("#bgPopup"),
Popup: $("#Popup"),
contents: $('#contents')*/


  document.body.appendChild(GAME.elem.audio);

  dragDisable();
  basicEvent();

  GAME.elem.bgPopup.data("state", 0);

  GAME.elem.Popup.css('max-width', '50%');
  GAME.elem.Popup.css('paddingRight', GAME.elem.Popup.css('paddingLeft'));

  GAME.elem.Popup.on('click', function () { disablePopup(); });
  GAME.elem.bgPopup.on('click', function () { disablePopup(); });
  GAME.elem.Popup.on('touchstart', function () { disablePopup(); });

  GAME.elem.textInput.keyup(function (e) { // 엔터 입력시 메시지 전송
    if (e.keyCode == 13 && GAME.elem.textInput.val() != '') {
      socket.emit('sendMessage',
          { name: GAME.player.color == 'W' ? 'White' : GAME.player.color == 'B' ? 'Black' : 'Guest[' + GAME.player.id + ']',
           message: GAME.elem.textInput.val() });
      GAME.elem.textInput.val('');
    }
  });

  // $(':input').live('focus', function () { // 자동완성 금지
  //   $(this).attr('autocomplete', 'off');
  // });
}


function setRayout() {
  var isLandscape = $(window).width() > $(window).height();
  var sidebarWidth = GAME.player.orientation == 'portrait' ? ( GAME.conf.size.board / 2.5) + 22 : GAME.elem.textInput.outerWidth();
  var canvasWidth = $('#canvas').outerWidth();
  var canvas_sidebarMargin = Number(GAME.elem.textInput.css('marginLeft').replace('px', ''));
  var padding = Number(GAME.elem.boardDiv.css('paddingLeft').replace('px', '')) * 2;

  var isLandscapePossible = isLandscape && canvasWidth + sidebarWidth + canvas_sidebarMargin + padding < $(window).width();

  if (isLandscapePossible) { // 가로모드
    var realHeight = $(window).height() - padding - 8;
    // 8은 canvas border width * 2

    GAME.conf.size.piece = realHeight / 8 < 60 ? realHeight / 8 : 60;
    GAME.conf.size.board = GAME.conf.size.piece * 8;

    GAME.elem.record.css('margin', '0px 0px 4px 4px');
    GAME.elem.record.css('float', 'right');
    GAME.elem.textInput.css('margin', '0px 0px 0px 4px');
    GAME.elem.textInput.css('float', 'right');

    GAME.elem.record.css('width', GAME.conf.size.board/ 2.5);
    GAME.elem.textInput.css('width', GAME.conf.size.board / 2.5);
    // 임의의 사이드바 width

    GAME.elem.record.css('height', GAME.conf.size.board - GAME.elem.textInput.outerHeight() - 4 - 10);
    // margin bottom 4px + (padding 5px * 2). border width를 계산 안한 건 canvas border width가 BOARD_SIZE 사이즈에 더해지지 않아서

    GAME.elem.boardDiv.css('width', 'auto');

    GAME.player.orientation = 'landscape';
  } else { // 세로모드
    var realWidth = $(window).width() - padding - 8;

    GAME.conf.size.piece = realWidth / 8 < 60 ? realWidth / 8 : 60;
    GAME.conf.size.board = GAME.conf.size.piece * 8;

    GAME.elem.record.css('margin', '4px 0px 4px 0px');
    GAME.elem.record.css('float', 'left');
    GAME.elem.textInput.css('margin', '0');
    GAME.elem.textInput.css('float', 'left');

    GAME.elem.record.css('width',
        GAME.conf.size.board - 10);
    GAME.elem.textInput.css('width',
        GAME.conf.size.board - 10);
    // 10은 pading * 2

    GAME.elem.record.css('height',
        GAME.conf.size.board / 3.5);
    // 임의의 height

    GAME.elem.boardDiv.css('width',
        GAME.conf.size.board + 8);
    // width가 auto일 시 자동으로 조정되지 않아서 수동으로 사이즈 조절

    GAME.player.orientation = 'portrait';
  }

  GAME.elem.canvas.width = GAME.conf.size.board; // 캔버스 고유 API인 모양, jQuery의 css 메소드로 설정하면 캔버스가 깨짐
  GAME.elem.canvas.height = GAME.conf.size.board;
  GAME.elem.dragCanvas.width = GAME.conf.size.piece;
  GAME.elem.dragCanvas.height = GAME.conf.size.piece;

  GAME.elem.bgPopup.css("width", $(window).width());
  GAME.elem.bgPopup.css("height", $(window).height());
  GAME.elem.record.scrollTop(GAME.elem.record[0].scrollHeight);

  GAME.elem.boardDiv.center();
  GAME.elem.Popup.center();
}

jQuery.fn.center = function () {
  this.css("position", "absolute");
  this.css("top", Math.max(0, (($(window).height() - this.outerHeight()) / 2)));
  this.css("left", Math.max(0, (($(window).width() - this.outerWidth()) / 2)));
}

function dragDisable() {
  var t_preventDefault = function (evt) { evt.preventDefault(); };
  $(document).bind('dragstart', t_preventDefault)
    .bind('selectstart', t_preventDefault);
}

function cleartheCanvas() {
  GAME.elem.context.save();

  GAME.elem.context.setTransform(1, 0, 0, 1, 0, 0);
  GAME.elem.context.clearRect(0, 0,
      GAME.elem.canvas.width,
      GAME.elem.canvas.height);

  GAME.elem.context.restore();
}

function cleartheDragCanvas() {
  GAME.elem.dragContext.save();

  GAME.elem.dragContext.setTransform(1, 0, 0, 1, 0, 0);
  GAME.elem.dragContext.clearRect(0, 0,
      GAME.elem.dragCanvas.width,
      GAME.elem.dragCanvas.height);

  GAME.elem.dragContext.restore();
}

function onResize() {
  setRayout();
  draw(true);
  GAME.elem.boardDiv.center();
  GAME.elem.Popup.center();
  $('#progress').center();
}

function preloadImage(room) {
  $('#chessBoard').hide();

  var loader = new PxLoader();
  var progress = $('#progress');
  var progressbar = $('#progressbar');

  progress.css('width', $(window).width() / 2);
  progress.center();
  progress.show();

  var ret = {
    'BB': loader.addImage('/img/BB.png'),
    'BK': loader.addImage('/img/BK.png'),
    'BN': loader.addImage('/img/BN.png'),
    'BP': loader.addImage('/img/BP.png'),
    'BQ': loader.addImage('/img/BQ.png'),
    'BR': loader.addImage('/img/BR.png'),

    'WB': loader.addImage('/img/WB.png'),
    'WK': loader.addImage('/img/WK.png'),
    'WN': loader.addImage('/img/WN.png'),
    'WP': loader.addImage('/img/WP.png'),
    'WQ': loader.addImage('/img/WQ.png'),
    'WR': loader.addImage('/img/WR.png')
  };

  loader.addProgressListener(function (e) {
    progressbar.css('width', parseInt(progress.css('width').replace('px', '') * (e.completedCount / e.totalCount)));
  });

  loader.addCompletionListener(function () {
    init(room, ret);

    setTimeout(function () {
      progress.fadeOut(300);
    }, 500);
  });

  loader.start();
}