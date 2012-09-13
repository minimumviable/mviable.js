tutorial = (function () {
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

  function updateProgress() {
    $("article").each(function() {
      var article = $(this);
      var tutorialId = article.attr('id');
      (mviable.getObj(tutorialId) || []).forEach(function(completed) {
        var section = $("section#" + completed);
        section.hide();
        article.find("div.progress-bar").append(section.find('h3').clone());
        // FIXME Add this section to the article's progress bar
      });
    });
  }

  return {
    decorateCode: decorateCode,
    updateProgress: updateProgress
  };
})();

$(function () {
  tutorial.updateProgress();
  tutorial.decorateCode();
});
