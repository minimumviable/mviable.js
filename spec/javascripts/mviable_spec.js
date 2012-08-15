describe('mviable.js', function() {
  beforeEach(function() {
    localStorage.clear();
  });

  it('can store objects', function() {
    mviable.setObj('greeting', {Hello: "World"});
    expect(mviable.getObj('greeting')).toEqual({Hello: "World"});
  });

  it('can store booleans', function() {
    mviable.setObj('state', true);
    expect(mviable.getObj('state')).toEqual(true);
  });

  it('can store arrays', function() {
    mviable.setObj('greeting', ["Hello", "World"]);
    expect(mviable.getObj('greeting')).toEqual(["Hello", "World"]);
  });

  it('can store strings', function() {
    mviable.setObj('greeting', "Hello World");
    expect(mviable.getObj('greeting')).toEqual("Hello World");
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
    var send, open, setRequestHeader, dataSent, response, listener;

    beforeEach(function() {
      listener = jasmine.createSpy('listener');
      response = {};
      send = spyOn(XMLHttpRequest.prototype, 'send');
    });

    function request() {
      return JSON.parse(dataSent);
    }

    describe('successfully', function() {
      beforeEach(function() {
        send.andCallFake(function(sentMsg) {
          dataSent = sentMsg;
          this.onload({target: {response: JSON.stringify(response)}});
        });
      });

      it('uses a prefix to avoid colliding with other localStorage data', function() {
        localStorage.foo = "hello";
        mviable.setObj("foo", ["world"]);
        // expect(localStorage.foo).toEqual("hello"); FIXME
        //expect(mviable.getObj("foo")).toEqual(["world"]); 
      });

      it('submits a post back to the cloud', function() {
        var open = spyOn(XMLHttpRequest.prototype, 'open').andCallThrough();
        mviable.setObj('fiz', ["bang"]);
        mviable.sync();
        expect(open).toHaveBeenCalledWith('POST', "http://cloud.minimumviable.com:8080/store/sync");
      });

      it('uses text/plain as the content type to avoid additional browser security', function() {
        var setRequestHeader = spyOn(XMLHttpRequest.prototype, 'setRequestHeader').andCallThrough();
        mviable.sync();
        expect(setRequestHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');
      });

      it('fires event when a sync is complete', function() {
        mviable.events({ syncSuccessful: listener });
        mviable.sync();
        expect(listener).toHaveBeenCalled();
      });

      describe('after an item has been synced', function() {
        beforeEach(function() {
          mviable.setObj("foo", ["bar"]);
          mviable.sync();
        });
        
        it('sends the item to the server', function() {
          expect(request()).toEqual({foo: ["bar"]});
        });

        it('only syncs changed items', function() {
          mviable.setObj('baz', ["biz"]);
          mviable.sync();
          expect(request()).toEqual({baz: ["biz"]});
        });

        it('adds new items to local storage', function() {
          response.newItem = true;
          mviable.sync();
          expect(mviable.getObj("newItem")).toEqual(true);
        });

        it('marks incoming data as clean and doesnt re-sync it', function() {
          response.newItem = true;
          mviable.sync();
          mviable.sync();
          expect(request()).toEqual({});
        });
      });
    });

    describe('unsuccessfully', function() {
      beforeEach(function() {
        send.andCallFake(function(sentMsg) {
          dataSent = sentMsg;
          this.onerror({target: {response: JSON.stringify(response)}});
        });
      });

      it('fires event if the user has not logged in', function() {
        mviable.events({ loginRequired: listener });
        // Seems to freak out if you read the status field
        //mviable.sync(); FIXME Use sinonjs?
        //expect(listener).toHaveBeenCalled();
      });
      
      // FIXME If the request times out
    });

  });

  describe('logging in', function() {

    it('uses the current URL as the default redirect', function() {
      spyOn(window.location, 'assign').andCallFake(function(url) {
        expect(url).toEqual("http://cloud.minimumviable.com:8080/login/google?redirect=" + window.location.toString());
      });
    });

    xit('redirects to the specified URL on failure', function() {
      // FIXME
    });
  });

  // Submits dirty fields for syncronization
  // Updates fields returned in the response
  // Invokes the callback to resolve conflicts
  // Detects when a field is deleted
});
