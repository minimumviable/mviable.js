describe('So Simple Storage', function() {
  beforeEach(function() {
    localStorage.clear();
  });

  it('can store objects', function() {
    mviable.setObj('greeting', ["Hello", "World"]);
    expect(mviable.getObj('greeting')).toEqual(["Hello", "World"]);
  });

  it('can update objects with a function', function() {
    mviable.setObj('greeting', ["Hello", "World"]);
    mviable.setObj('greeting', function(greeting) {
      return greeting.concat("from mviable!");
    });
    expect(mviable.getObj('greeting')).toEqual(["Hello", "World", "from mviable!"]);
  });

  it('can still loop over the localStorage object', function() {
    mviable.setObj("item", {})
    items = [];
    for(k in localStorage) { items.push(k); }
    expect(items).toEqual(["item"]);
  });

  describe('when syncing items', function() {
    var send, open, setRequestHeader, dataSent, response;

    beforeEach(function() {
      response = {};
      send = spyOn(XMLHttpRequest.prototype, 'send');
      send.andCallFake(function(sentMsg) {
        dataSent = sentMsg;
        this.onload({target: {response: JSON.stringify(response)}});
      });
    });

    function request() {
      return JSON.parse(dataSent);
    }

    it('submits a post back to the cloud', function() {
      var open = spyOn(XMLHttpRequest.prototype, 'open').andCallThrough();
      localStorage.fiz = "bang";
      mviable.sync();
      expect(open).toHaveBeenCalledWith('POST', "http://cloud.minimumviable.com:8080/store/sync");
    });

    it('uses text/plain as the content type to avoid additional browser security', function() {
      var setRequestHeader = spyOn(XMLHttpRequest.prototype, 'setRequestHeader').andCallThrough();
      mviable.sync();
      expect(setRequestHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');
    });

    describe('after an item has been synced', function() {
      beforeEach(function() {
        localStorage.foo = "bar"
        mviable.sync();
      });
      
      it('sends the item to the server', function() {
        expect(request()).toEqual({foo: "bar"});
      });

      it('only syncs changed items', function() {
        localStorage.baz = "biz";
        expect(localStorage.foo).toEqual("bar");
        mviable.sync();
        expect(request()).toEqual({baz: "biz"});
      });

      it('adds new items to local storage', function() {
        response.newItem = true;
        mviable.sync();
        expect(localStorage.newItem).toEqual('true');
      });

      it('marks incoming data as clean and doesnt re-sync it', function() {
        response.newItem = true;
        mviable.sync();
        mviable.sync();
        expect(request()).toEqual({});
      });
    });
  });

  describe('logging in', function() {

    it('uses the current URL as the default redirect', function() {
      spyOn(window.location, 'assign');
      mviable.login('google');
      expect(window.location.assign).toHaveBeenCalledWith("http://cloud.minimumviable.com:8080/login/google?redirect=" + window.location.toString());
    });

    xit('redirects to the specified URL on failure', function() {
      // FIXME
    });
    // Uses the current location by default
    //
    // redirects to the specified URL on failure
  });

  // Submits dirty fields for syncronization
  // Updates fields returned in the response
  // Invokes the callback to resolve conflicts
  // Detects when a field is deleted
});
