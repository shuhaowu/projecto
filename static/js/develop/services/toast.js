"use strict";

(function() {
  angular.module("projecto").service("toast", [function() {
    // This module is mainly used so there is a consistent style of messages.

    var AUTOCLOSE_TIME = 2000; // 2 seconds for default

    /*
     * This has no closing button and will close automatically in 2 seconds.
     * The style is default (no additionall CSS).
     */
    this.info = function(message) {
      $("body").statusmsg("open", message);
    };

    /*
     * Closes the toast, mainly for info. As that one does not close or is
     * closable by user.
     */
    this.close = function() {
      $("body").statusmsg("close");
    };

    /*
     * Shortcut to .info("Loading...")
     * In the future this may do more
     */
    this.loading = function() {
      this.info("Loading...");
    };

    // Shortcut to close, to complement loading()
    this.loaded = this.close;

    // Autocloses with 2 sec, success style applied
    this.success = function(message) {
      $("body").statusmsg("open", message, {type: "success", autoclose: AUTOCLOSE_TIME});
    };

    // Autocloses with 2 seconds, warning style applied.
    // A warning is not severe enough to warrent the usable closable (which
    // means user has take action)
    this.warn = function(message) {
      $("body").statusmsg("open", message, {type: "warning", autoclose: AUTOCLOSE_TIME});
    };

    // Error is severe enough that it will not autoclose and a close button is
    // shown.
    // Event should be something like: Posting update failed
    // Reason should be some sort of reason
    this.error = function(event, reason) {
      if (reason != undefined)
        $("body").statusmsg("open", event + ": " + reason, {type: "error", closable: true});
      else
        $("body").statusmsg("open", event, {type: "error", closable: true});
    };

    // This shows that the page needs to be reloaded. The technical jargon is
    // currently logged into console, it could be uploaded to some sort of
    // logging service later.
    // This will be an error style and will not be closable (only way is to
    // reload)
    this.wtf = function(technical_jargon) {
      $("body").statusmsg("open", "Something terrible has happened :( Please try reloading the page", {type: "error"});
      console.error("WTF: " + technical_jargon);
    };


  }]);
})();
