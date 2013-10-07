"use strict";

(function() {
  angular.module("projecto").service("FilesService", ["$http", function($http) {
    var apiUrl = function(project_id, postfix) {
      return window.API_PREFIX + "/projects/" + project_id + "/files/" + (postfix ? postfix : "");
    };

    this.get = function(project, path) {
      if (path[0] !== "/") {
        path = "/" + path;
      }
      return $http({
        method: "GET",
        url: apiUrl(project.key),
        params: {path: path}
      });
    };

    this.downloadFile = function(project, path) {

    };

    this.newFile = function(project, directory, file) {
      var path = directory + file.name;
      var fd = new FormData();
      fd.append("file", file);
      return $http({
        method: "POST",
        url: apiUrl(project.key),
        params: {path: path},
        headers: {"Content-Type": false},
        data: fd,
        transformRequest: function(data) { return data; }
      });
    };

    this.newDirectory = function(project, path, name) {
      path = this.trimSlashes(path);
      path = "/" + path + "/" + name + "/";

      return $http({
        method: "POST",
        url: apiUrl(project.key),
        params: {path: path}
      });
    };

    this.updateFile = function(project, path, file) {
      var fd = new FormData();
      fd.append("file", file);
      return $http({
        method: "POST",
        url: apiUrl(project.key),
        params: {path: path},
        headers: {"Content-Type": false},
        data: fd,
        transformRequest: function(data) { return data; }
      });
    };

    this.move = function(project, path) {

    };

    this.trimSlashes = function(p) {
      return p.replace(/^[\s\/]+/, "").replace(/[\s\/]+$/, "");
    };

  }]);
})()