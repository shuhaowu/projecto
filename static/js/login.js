// Persona login script.. and some other bootstrap

window.notLoaded = function() {
  $("body").statusmsg("open", "The page has not been fully loaded yet. Please wait...", {type: "warning", closable: true});
};

$(function () {

  $("body").statusmsg();

  var LOGIN_TEXT = "Login with Persona";
  var LOGOUT_TEXT = "Logout";

  $.ajaxSetup({
    traditional: true,
    beforeSend: function(xhr, settings){
      xhr.setRequestHeader("X-CSRFToken", window.csrfToken);
    }
  });

  var rebindLogin = function() {
    var loginlink = $("#login-persona");
    if (loginlink.text() === LOGIN_TEXT) {
      loginlink.click(function(e) {
        e.preventDefault();
        navigator.id.request();
      });
    } else if (loginlink.text() === LOGOUT_TEXT) {
      loginlink.click(function(e) {
        e.preventDefault();
        navigator.id.logout();
      });
    }
  };

  rebindLogin();

  // TODO: Need to convert to enable multiemail signin
  var currentUserEmail = window.currentUser.emails ? window.currentUser.emails[0] : null;

  navigator.id.watch({
    loggedInUser: currentUserEmail,
    onlogin: function (assertion) {
      if ($("#login-persona").text() === LOGIN_TEXT)
        $("#login-persona").text("Signing in...");
      $.ajax({
        type: "POST",
        url: "/auth/login",
        data: {assertion: assertion},
        success: function (res, status, xhr) {
          var l = window.location.pathname.length;
          window.location.href = "/app/";
        },
        error: function (xhr, status, err) {
          navigator.id.logout();
          $("#login-persona").text(LOGIN_TEXT);
          alert("Error: Login failed with status " + xhr.status);
        }
      });
    },
    onlogout: function () {
      if ($("#login-persona").text(LOGOUT_TEXT))
        $("#login-persona").text("Signing out...");
      $.ajax({
        type: "POST",
        url: "/auth/logout",
        success: function (res, status, xhr) {
          if (window.location.pathname.length > 1)
            window.location.href = "/";
          $("#login-persona").text(LOGIN_TEXT);
        },
        error: function (xhr, status, err) {
          $("#login-persona").text(LOGOUT_TEXT);
        } // TODO: alert user.
      });
    }
  });
});