describe('tutor', function() {
  beforeEach(function() {
    // To get this to work you need to let Chrome 
    // fetch files from the file system. There's a commmand line switch 
    // for this, which you can use on OS X like so:
    //
    // open -a "Google Chrome" --args --allow-file-access-from-files
    //setFixtures($(readFixtures("tutorials")));
  });

  describe('runnable code snippets', function() {
    beforeEach(function() {
      delete window.hello;
      tutorials.test = {run: function() {
        hello = "world";
      }};
      setFixtures(sandbox().append('<code class="example" tutorial="test" fn="run">'));
      tutor.decorateCode();
    });

    it('adds a button to run the code', function() {
      expect($('button')).toHaveHtml("Run It!");
    });

    it('are executed when you click the run button', function() {
      $('button').trigger('click');
      expect(window.hello).toEqual('world');
    });
  });

  describe('builds a progress bar', function() {
    beforeEach(function() {
      $('body').append(
        $('<article id="tutor">').
          append($('<section id="step1">')).
          append($('<section id="step2">')));
    });

    it('hides tutor sections that have been completed', function() {
      // We need a library for this :-/
      tutor.complete('tutor', 'step1');
      expect($("#step1")).not.toBeVisible();
      expect($("#step2")).toBeVisible();
    });
  });
});
