(function() {
  var clean = {};
  var handlers = {};

  function merge(obj, other) {
    for(k in other) {
      obj[k] = other[k];
    }
    return obj;
  }

  function buildPayload() {
    var payload = {};
    for(k in localStorage) {
      if(! clean[k]) {
        payload[k] = JSON.parse(localStorage[k]);
      }
    };
    return payload;
  }

  function trigger(name) {
    (handlers[name] || []).forEach(function(h) { h(); });
  }

  function syncComplete(request, payload) {
    switch(request.status) {
      case 401:
        trigger('loginRequired');
        break;
      case 200:
        var newData = JSON.parse(request.responseText);
        merge(clean, payload); // FIXME Don't need the data here, just keys
        merge(localStorage, newData);
        merge(clean, newData);
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
    var payload = buildPayload();

    var request = new XMLHttpRequest();
    var host = 'cloud.minimumviable.com:8080';
    request.open('POST', 'http://' + host + '/store/sync', true);
    request.setRequestHeader("Content-Type", "text/plain");
    request.withCredentials = "true";
    
    request.onreadystatechange = function (e) {
      if (request.readyState === 4) {
        syncComplete(request, payload);
      }
    };
    request.send(JSON.stringify(payload)); 
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

  function login(provider) {
    // CHECK window.location.assign
    window.location.assign("http://cloud.minimumviable.com:8080/login/" + provider + "?redirect=" + window.location.toString());
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
    getObj: getObj,
    setObj: setObj
  }

  if (Object.defineProperty) {
    Object.defineProperty(this, "mviable", {value: exports});
  } else {
    console.log("Sorry, mviable.js does not support legacy browsers.");
  }
})();

