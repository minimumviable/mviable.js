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

  it('uses a prefix to avoid colliding with other localStorage data', function() {
    localStorage.foo = "hello";
    mviable.setObj("foo", ["world"]);
    // expect(localStorage.foo).toEqual("hello"); FIXME
    //expect(mviable.getObj("foo")).toEqual(["world"]); 
  });

  describe('when syncing items', function() {
    var listener, xhr, requests;

    beforeEach(function() {
      xhr = sinon.useFakeXMLHttpRequest();
      requests = [];
      xhr.onCreate = function (req) { requests.push(req); };
      
      listener = jasmine.createSpy('listener');
    });

    afterEach(function() {
      xhr.restore;
    })

    function requestBody(i) {
      i = i || 0;
      return JSON.parse(requests[i].requestBody);
    }

    describe('successfully', function() {
      it('submits a post back to the cloud', function() {
        mviable.setObj('fiz', ["bang"]);
        mviable.sync();
        expect(requests[0].url).toEqual("http://cloud.minimumviable.com:8080/store/sync");
        expect(requests[0].method).toEqual("POST");
        expect(requests[0].requestBody).toEqual(JSON.stringify({fiz: ['bang']}));
      });

      it('uses text/plain as the content type to avoid additional browser security', function() {
        mviable.sync();
        expect(requests[0].requestHeaders).toEqual({"Content-Type": 'text/plain;charset=utf-8'});
      });

      it('fires event when a sync is complete', function() {
        mviable.events({ syncSuccessful: listener });
        mviable.sync();
        requests[0].respond(200, {}, "{}");
        expect(listener).toHaveBeenCalled();
      });

      describe('after an item has been synced', function() {
        beforeEach(function() {
          mviable.setObj("foo", ["bar"]);
          mviable.sync();
          requests[0].respond(200, {}, JSON.stringify({newItem: true}));
        });
        
        it('sends the item to the server', function() {
          expect(requestBody()).toEqual({foo: ["bar"]});
        });

        it('only syncs changed items', function() {
          mviable.setObj('baz', ["biz"]);
          mviable.sync();
          expect(requestBody(1)).toEqual({baz: ["biz"]});
        });

        it('adds new items to local storage', function() {
          expect(mviable.getObj("newItem")).toEqual(true);
        });

        it('marks incoming data as clean and doesnt re-sync it', function() {
          mviable.sync();
          requests[0].respond(200, {}, JSON.stringify({newItem: true}));

          mviable.sync();
          expect(requestBody()).toEqual({});
        });
      });
    });

    describe('unsuccessfully', function() {
      it('fires event if the user has not logged in', function() {
        mviable.events({ loginRequired: listener });
        mviable.sync();
        requests[0].respond(401, {}, "You must log in first");
        expect(listener).toHaveBeenCalled();
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
