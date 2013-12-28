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
