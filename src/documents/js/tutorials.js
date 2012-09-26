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

  return {
    decorateCode: decorateCode,
  };
})();

tutorials = {};

tutorials.auth = (function () {

// Not indented to preserve formatting

function connect() {
  mviable.login('google');
}

function showUserInfo() {
  $("#google-email")
    .text(mviable.userInfo().email);
}

  return {
    connect: connect,
    showUserInfo: showUserInfo
  };
})();

tutorials.sync = (function () {

function setData() {
  localStorage.greeting = "Hello!";
  $('#sync-status').text('Needs Sync!');
}

function sync() {
  mviable.events({
    syncSuccessful: function() {
      $('#sync-status')
        .text('MV says ' + localStorage.greeting);
    }
  });
  $('#sync-status').text('syncing...');
  mviable.sync();
}

  return {
    setData: setData,
    sync: sync
  };
})();
