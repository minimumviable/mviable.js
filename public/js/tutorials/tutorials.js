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

  return {
    decorateCode: decorateCode
  };
})();

$(function () {
  tutorial.decorateCode();
});
