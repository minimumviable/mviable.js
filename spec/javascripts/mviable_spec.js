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
        localStorage.fiz = "bang";
        mviable.sync();
        expect(requests[0].url).toEqual("http://cloud.minimumviable.com:8080/store/sync");
        expect(requests[0].method).toEqual("POST");
        expect(JSON.parse(requests[0].requestBody)).toEqual({
          deletes: {},
          updates: {fiz: 'bang'}
        });
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
          localStorage.foo = "bar";
          mviable.sync();
          requests[0].respond(200, {}, JSON.stringify({newItem: true}));
        });
        
        it('sends the item to the server', function() {
          expect(requestBody().updates).toEqual({foo: "bar"});
        });

        it('removes deleted items', function() {
          delete localStorage.foo;
          mviable.sync();
          expect(requestBody(1).deletes).toEqual(["foo"]);
        });

        it('only syncs changed items', function() {
          localStorage.baz = "biz"
          mviable.sync();
          expect(requestBody(1).updates).toEqual({baz: "biz"});
        });

        it('adds new items to local storage', function() {
          expect(localStorage.newItem).toEqual("true");
        });

        it('marks incoming data as clean and doesnt re-sync it', function() {
          mviable.sync();
          requests[0].respond(200, {}, JSON.stringify({newItem: true}));

          mviable.sync();
          expect(requestBody().updates).toEqual({});
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
});
