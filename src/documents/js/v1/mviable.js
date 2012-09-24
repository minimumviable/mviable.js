/** 
 * @namespace mviable 
 * @desc Minimum Viable's JavaScript API
 * */
(function() {
  var handlers = {};
  var host = 'cloud.minimumviable.com:8080';

  if (window.MViableUseLocalhost) {
    host = 'localhost:8080';
  }

  function extractQueryParam(name)
  {
    var queryRegex = new RegExp("[\\?&]" + name + "=([^&#]*)");
    var result = queryRegex.exec(window.location.search);
    if (result) {
      // May cause a refresh loop if we're not careful.
      var newUrl = window.location.href.replace(queryRegex, "");
      window.location.replace(newUrl);
      return decodeURIComponent(result[1].replace(/\+/g, " "));
    }
    return "";
  }

  function hashString(str){
    str = (str || "").toString();

    var hash = 0;
    for (i = 0; i < str.length; i++) {
      char = str.charCodeAt(i);
      hash = char + (hash << 6) + (hash << 16) - hash;
    }
    return hash;
  }

  function hashValues(obj) {
    var hashed = {};
    for(k in obj) {
      hashed[k] = hashString(obj[k]);
    }
    return hashed;
  }
  

  function setOption(name, value) {
    setObj("__mviable__", function(o) {
      o = o || {};
      o[name] = value;
      return o;
    });
  }

  function getOption(name) {
    return (getObj("__mviable__") || {})[name] || {};
  }

  function mergeOption(name, other) {
    setObj("__mviable__", function(o) {
      o = o || {};
      o[name] = o[name] || {};
      merge(o[name], other);
      return o;
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
    var v = getOption('versions');
    var hashes = getOption("hashes");
    for(k in localStorage) {
      if((hashes[k] !== hashString(localStorage[k])) && k !== "__mviable__") {
        updates[k] = localStorage[k];
        v[k] = v[k] || 0;
      }
    };
    setOption('versions', v);
    return updates;
  }
  
  function findDeletes() {
    var deletes = [];
    for(k in getOption('hashes')) {
      if(!(k in localStorage)) {
        deletes.push(k);
      }
    };
    return deletes;
  }

  /**
   * Fired when a sync fails because the user has not logged in
   *
   * @event
   * @name mviable#loginRequired
   * @see mviable#events
   */

  /**
   * Fired after a syncronization has successfully completed
   *
   * @event
   * @name mviable#syncSuccessful
   * @see mviable#events
   */
  function trigger(name) {
    (handlers[name] || []).forEach(function(h) { h(); });
  }

  function removeHash(k) {
    var h = getOption('hashes');
    delete h[k];
    setOption('hashes', h);
  }

  function syncComplete(request, updates, deletes) {
    switch(request.status) {
      case 401:
        if (connected()) {
          mviable.login(getOption('userInfo').provider);
        } else {
          trigger('loginRequired');
        }
        break;
      case 200:
        var newData = JSON.parse(request.responseText);
        newData.deletes.forEach(function(k) {
          delete localStorage[k];
          removeHash(k); // Untested
        });
        deletes.forEach(function(k) { removeHash(k); });

        // FIXME May fail here if storage is full
        merge(localStorage, newData.updates);

        mergeOption('hashes', hashValues(newData.updates)); 
        mergeOption('hashes', hashValues(updates)); 
        mergeOption('versions', newData.versions);
        trigger('syncSuccessful');
        break;
      // FIXME need to handle many more error states here
      // 402 - Payment Required
      // 413 - Entity Too Large
      default:
        console.log("Error syncing. Unexpected status " + request.status);
    }
  }

  /**
   * If the user is logged in, synchronizes data in localStorage with Minimum Viable's cloud storage.
   *
   * When a sync is triggered, each key/value pair in localStorage is inspected to see if it has changed.
   * A request is then made to Minimum Viable's cloud storage to save new/changed values, and fetch any 
   * values that may have been added or updated on other clients.
   *
   * @function 
   * @name mviable#sync
   */
  function sync() {
    var updates = findUpdates();
    var deletes = findDeletes();

    var request = new XMLHttpRequest();
    request.open('POST', 'http://' + host + '/store/sync', true);
    request.setRequestHeader("Content-Type", "text/plain");
    request.withCredentials = "true";
    
    request.onreadystatechange = function (e) {
      if (request.readyState === 4) {
        syncComplete(request, updates, deletes);
      }
    };
    request.send(JSON.stringify({
      updates: updates,
      versions: getOption('versions'),
      deletes: deletes
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

  /**
   * Redirects the user to the specififed OAuth2 provider's login page. When the login 
   * process is complete, the user will be redirected back to the current page.
   *
   * @function 
   * @name mviable#login
   * @param {String} provider OAuth2 provider. 'google' is currently the only supported option.
   */
  function login(provider) {
    // Untested because:
    // https://groups.google.com/forum/?fromgroups#!topic/sinonjs/MMYrwKIZNUU%5B1-25%5D
    window.location.assign("http://" + host + "/login/" + provider + "?redirect=" + window.location.toString());
  }

  /**
   * Registers one or more event listeners with mviable.
   *
   * @function 
   * @name mviable#events
   * @param {Object} handlers A config object where the keys represent event names, and the values 
   * are functions to be invoked when the event is fired.
   * @example
   * mviable.events({ 
   *   syncSuccessful: function() { console.log("Sync Successful"); }
   *   loginRequired: function() { console.log("Need to call mviable.login"); }
   * });
   * 
   */
  function events(newHandlers) {
    for(e in newHandlers) {
      handlers[e] = handlers[e] || [];
      handlers[e].push(newHandlers[e]);
    }
  }

  /**
   * Returns true if the user has connected using an OAuth2 provider. false otherwise.
   *
   * @function 
   * @name mviable#connected
   * @see mviable#login
   */
  function userInfo() {
    return getOption('userInfo', {});
  }

  /**
   * Returns true if the user has connected using an OAuth2 provider. false otherwise.
   *
   * @function 
   * @name mviable#connected
   */
  function connected() {
    return userInfo().provider !== undefined;
  }

  var exports = {
    login: login,
    sync: sync,
    connected: connected,
    userInfo: userInfo,
    events: events,
    getObj: getObj,
    setObj: setObj
  }

  // Untested
  var userInfoParam = extractQueryParam('userInfo');
  if (userInfoParam) {
    setOption('userInfo', JSON.parse(userInfoParam));
    // FIXME Remove userInfo from URL
  }

  if (window.localStorage) {
    Object.defineProperty(this, "mviable", {value: exports});
  } else {
    console.log("Sorry, mviable.js does not support browsers without Local Storage.");
  }
})();

