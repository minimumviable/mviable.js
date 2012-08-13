(function() {
  var clean = {};

  function merge(obj, other) {
    for(k in other) {
      obj[k] = other[k];
    }
    return obj;
  }

  function sync() {
    // FIXME Need to be smarter about what properies are synced
    var payload = {};
    for(k in localStorage) {
      if(! clean[k]) {
        payload[k] = localStorage[k];
      }
    };

    // FIXME Move this to another module for easy testing
    var request = new XMLHttpRequest();
    var host = localStorage.sosimplehost || 'cloud.sosimplestorage.com:8080'
    request.open('POST', 'http://' + host + '/store/sync');
    request.setRequestHeader("Content-Type", "text/plain");
    request.withCredentials = "true";
    
    // FIXME need to handle many more error states here
    // request.onerror = function() {
    //   console.log("error syncing");
    // }

    request.onload = function (e) {
      var newData = JSON.parse(e.target.response);
      merge(clean, payload);
      merge(localStorage, newData);
      merge(clean, newData);
    };
    request.send(JSON.stringify(payload)); 
  }

  function getObj(name) {
    var item = localStorage.getItem(name);
    if (item !== null)
      return JSON.parse(item);
  }

  function setObj(name, obj) {
    // FIXME This may throw QUOTA_EXCEEDED_ERR
    if (typeof(obj) == 'function') {
      obj = obj.apply(localStorage, [getObj(name)]);
    } 
    localStorage.setItem(name, JSON.stringify(obj));
  }

  function login(provider) {
    // CHECK window.location.assign
    window.location.assign("http://cloud.minimumviable.com:8080/login/" + provider + "?redirect=" + window.location.toString());
  }

  var exports = {
    login: login,
    sync: sync,
    getObj: getObj,
    setObj: setObj
  }
  Object.defineProperty(this, "sosimple", {value: exports}); // FIXME
  Object.defineProperty(this, "mviable", {value: exports});
})();

