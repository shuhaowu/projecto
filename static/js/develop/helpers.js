"use strict";

window.helpers = {};

helpers.ensure_array = function(s) {
  if ($.type(s) === "array")
    return s;

  var a = s.split(",");
  for (var i=0; i<a.length; i++) {
    a[i] = $.trim(a[i], " ");
    if (!a[i]) {
      a.splice(i, 1);
      i--;
    }
  }
  return a;
};
