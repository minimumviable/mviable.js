tutor = (function () {
  function highlight(code) {
    return $("<code>").text(code);
  }

  function codeRunner(code) {
    return function() {
      $(this).attr("disabled", true);
      eval(code);
    };
  }

  function decorateCode() {
    $("code.runnable").replaceWith(function() {
      var code = $(this).html();
      return $('<div class="code-runner">').
        append(highlight(code)).
        append($("<button>Run It!</button>").
          click(codeRunner(code)));
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

tutorials = (function () {
  function auth() {
    tutor.decorateCode();
    if (mviable.connected()) {
      tutor.complete('authentication', 'begin');
      tutor.complete('authentication', 'login');
    }
  }

  return {
    auth: auth
  };
})();
