(function() {
  var clean = {};
  var handlers = {};
  var host = 'cloud.minimumviable.com:8080';
  if (window.MViableUseLocalhost) {
    host = 'localhost:8080';
  }

  function setOption(name, value) {
    setObj("__mviable__", function(o) {
      o[name] = value;
      return o;
    });
  }

  function getOption(name, value) {
    return (getObj("__mviable__") || {})[name];
  }

  function mergeOption(name, other) {
    setObj("__mviable__", function(o) {
      return merge(o || {}, other);
    });
  }

  function merge(obj, other) {
    for(k in other) {
      obj[k] = other[k];
    }
    return obj;
  }

  function findUpdates() {
    var updates = {};
    for(k in localStorage) {
      if(!(k in clean)) {
        updates[k] = localStorage[k];
      }
    };
    return updates;
  }
  
  function findDeletes() {
    var deletes = [];
    for(k in clean) {
      if(!(k in localStorage)) {
        deletes.push(k);
      }
    };
    return deletes;
  }

  function trigger(name) {
    (handlers[name] || []).forEach(function(h) { h(); });
  }

  function syncComplete(request, updates) {
    switch(request.status) {
      case 401:
        trigger('loginRequired');
        break;
      case 200:
        var newData = JSON.parse(request.responseText);
        merge(clean, updates); // FIXME Don't need the data here, just keys
        merge(localStorage, newData.updates);
        merge(clean, newData.updates);
        mergeOption('versions', newData.versions);
        newData.deletes.forEach(function(k) {
          delete localStorage[k];
        })
        trigger('syncSuccessful');
        break;
      // FIXME need to handle many more error states here
      // 402 - Payment Required
      // 413 - Entity Too Large
      default:
        console.log("Error syncing. Unexpected status " + request.status);
    }
  }

  function sync() {
    var updates = findUpdates();

    var request = new XMLHttpRequest();
    request.open('POST', 'http://' + host + '/store/sync', true);
    request.setRequestHeader("Content-Type", "text/plain");
    request.withCredentials = "true";
    
    request.onreadystatechange = function (e) {
      if (request.readyState === 4) {
        syncComplete(request, updates);
      }
    };
    request.send(JSON.stringify({
      updates: updates,
      versions: getOption('versions'),
      deletes: findDeletes()
    })); 
  }

  function getObj(name) {
    var item = localStorage.getItem(name);
    if (item !== null)
      return JSON.parse(item);
  }

  function setObj(name, obj) {
    if (typeof(obj) == 'function') {
      obj = obj.apply(this, [getObj(name)]);
    } 
    // FIXME This may throw QUOTA_EXCEEDED_ERR
    localStorage.setItem(name, JSON.stringify(obj));
  }

  function hasAuth() {
    return false;
  }

  function login(provider) {
    // Untested 
    // https://groups.google.com/forum/?fromgroups#!topic/sinonjs/MMYrwKIZNUU%5B1-25%5D
    window.location.assign("http://" + host + "/login/" + provider + "?redirect=" + window.location.toString());
  }

  function events(newHandlers) {
    for(e in newHandlers) {
      handlers[e] = handlers[e] || [];
      handlers[e].push(newHandlers[e]);
    }
  }

  var exports = {
    login: login,
    sync: sync,
    events: events,
    hasAuth: hasAuth,
    getObj: getObj,
    setObj: setObj
  }

  if (window.localStorage) {
    Object.defineProperty(this, "mviable", {value: exports});
  } else {
    console.log("Sorry, mviable.js does not support browsers without Local Storage.");
  }
})();

