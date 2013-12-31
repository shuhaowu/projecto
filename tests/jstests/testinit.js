window.API_PREFIX = "/api/v1";
window.currentUser = {
    "key": "testuser",
    "name": "Test User",
    "emails": ["test@test.com"],
    "avatar": "abcde"
};

$("body").statusmsg();

window.notLoaded = function() {
  $("body").statusmsg("open", "The page has not been fully loaded yet. Please wait...", {type: "warning", closable: true});
};

// Mocked services/factories/whatnot
var commonMocked = {};
commonMocked.$window = {
  confirm: function(msg) { return true; }
};

// Fuck yeah. l33thax.
commonMocked.ProjectsService = {
  getCurrentProject: function() {
    var o = {
      done: function(args) { return o; },
      fail: function(args) { return o; }
    };
    return o;
  }
};

var testutils = {
  // Get around PhantomJS bug 11013:
  // https://github.com/ariya/phantomjs/issues/11013
  createBlob: function(name) {
    var blob;
    if (typeof(Blob) === typeof(Function)) {
      blob = new Blob();
    } else {
      var builder = new WebKitBlobBuilder();
      blob = builder.getBlob();
    }
    blob.name = name;
    return blob;
  }
};
