function loadPopup(callback) {
  //loads popup only if it is disabled  
  if (GAME.elem.bgPopup.data("state") == 0) {
    GAME.elem.bgPopup.css({ "opacity": "0.7" });
    GAME.elem.bgPopup.fadeIn("medium");
    GAME.elem.Popup.fadeIn("medium");
    GAME.elem.bgPopup.data("state", 1);

    if (typeof callback != 'undefined') {
      callback();
    }
  }
}

function disablePopup() {
  if (GAME.elem.bgPopup.data("state") == 1) {
    GAME.elem.bgPopup.fadeOut("medium");
    GAME.elem.Popup.fadeOut("medium");
    GAME.elem.bgPopup.data("state", 0);
  }
}

function popup(message, type, doNotAutoClose) {
  GAME.elem.Popup.removeClass();

  switch (type) {
    case 'warning':
      GAME.elem.Popup.addClass("alert alert-block");
      break;
    case 'fail':
      GAME.elem.Popup.addClass("alert alert-error");
      break;
    case 'success':
      GAME.elem.Popup.addClass("alert alert-success");
      break;
    case 'information':
      GAME.elem.Popup.addClass("alert alert-info");
      break;
  }

  GAME.elem.contents.text(message);
  GAME.elem.Popup.center();
  loadPopup();

  if (!doNotAutoClose) {
    setTimeout(function () {
      disablePopup();
    }, 3000);
  }
}