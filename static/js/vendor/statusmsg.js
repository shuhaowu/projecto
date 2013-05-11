// Generated by CoffeeScript 1.6.2
(function() {
  var $, set_css, statusmsg;

  $ = jQuery;

  set_css = function(msgbox) {
    return msgbox.css("position", "fixed").css("left", ($(window).width() - msgbox.outerWidth()) / 2);
  };

  statusmsg = {
    init: (function(options) {
      if (options == null) {
        options = {};
      }
      statusmsg.id = options.id || "statusmsg";
      statusmsg.msgbox = $(document.createElement("div")).addClass("statusmsg").attr("id", statusmsg.id);
      this.append(statusmsg.msgbox);
      $(window).resize(function() {
        return set_css(statusmsg.msgbox);
      });
      return $(window).resize();
    }),
    open: (function(msg, options) {
      var autoclose, callback, closable, type;

      if (options == null) {
        options = {};
      }
      closable = options.closable || false;
      type = " " + (options.type || "");
      autoclose = options.autoclose || 0;
      callback = options.callback || function() {
        return null;
      };
      if (closable) {
        msg += "<a href=\"#\" class=\"closebtn\">&times;</a>";
      }
      statusmsg.msgbox.html(msg);
      statusmsg.msgbox.removeClass().addClass("statusmsg" + type);
      set_css(statusmsg.msgbox);
      if (closable) {
        $(".closebtn", statusmsg.msgbox).click(function(e) {
          e.preventDefault();
          return statusmsg.close();
        });
      }
      if (statusmsg.msgbox.css("display") === "none" || parseFloat(statusmsg.msgbox.css("opacity")) < 1) {
        statusmsg.msgbox.fadeIn(400, callback);
      } else {
        callback();
      }
      if (autoclose > 0) {
        return statusmsg._timeoutid = setTimeout((function() {
          return statusmsg.close();
        }), autoclose);
      }
    }),
    close: (function(options) {
      var callback;

      if (options == null) {
        options = {};
      }
      callback = options.callback || function() {
        return null;
      };
      if (statusmsg.msgbox.css("display") !== "none") {
        statusmsg.msgbox.fadeOut(400, callback);
      } else {
        callback();
      }
      return statusmsg.clear_events();
    }),
    clear_events: (function() {
      if (statusmsg._timeoutid) {
        clearTimeout(statusmsg._timeoutid);
        statusmsg._timeoutid = void 0;
        return $(".closebtn", statusmsg).off("click");
      }
    })
  };

  statusmsg["display"] = statusmsg["open"];

  statusmsg["close"] = statusmsg["close"];

  $.fn.extend({
    statusmsg: function(action) {
      if (statusmsg[action]) {
        return statusmsg[action].apply(this, Array.prototype.slice.call(arguments, 1));
      } else if (typeof action === "object" || !action) {
        return statusmsg.init.apply(this, arguments);
      } else {
        return $.error("Method " + action + " does not exist on jQuery.statusmsg");
      }
    }
  });

}).call(this);
