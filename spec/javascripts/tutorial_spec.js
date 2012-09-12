describe('tutorial', function() {
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
      $('body').append($('<code class="runnable">').text("window.hello = 'world';"));
      tutorial.decorateCode();
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
    
  });
});
