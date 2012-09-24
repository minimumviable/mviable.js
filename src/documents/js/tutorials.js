tutor = (function () {
  function highlight(code) {
    return $("<div>").addClass("code-example").text(code.toString());
  }

  function decorateCode() {
    $("code.example").replaceWith(function() {
      var code = tutorials[$(this).attr('tutorial')][$(this).attr('fn')];
      return $('<div class="code-runner">').
        append(highlight(code)).
        append($("<button>Run It!</button>").
          click(function() {
            $(this).attr("disabled", true);
            code();
          }));
    });
  }

  function complete(articleId, tutorialId) {
    var article = $("#" + articleId);
    var section = $("section#" + tutorialId);
    section.hide();
    article.find("div.progress-bar").append($("<span>").text(section.find('h3').text()));
  }

  return {
    decorateCode: decorateCode,
    complete: complete
  };
})();

tutorials = {};

tutorials.auth = (function () {
  function connect() {
    mviable.login('google');
  }

  function showUserInfo() {
    $("#google-email").text(mviable.userInfo().email);
    $("#google-user-profile").show();
    tutor.complete('authentication', 'user-info');
  }

  function updateProgress() {
    if (mviable.connected()) {
      tutor.complete('authentication', 'login');
    }
    // FIXME Need a way to mark the user info tutorial as being completed
  }

  return {
    connect: connect,
    updateProgress: updateProgress,
    showUserInfo: showUserInfo
  };
})();
