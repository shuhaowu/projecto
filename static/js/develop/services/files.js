"use strict";

(function() {
  angular.module("projecto").service("FilesService", ["$http", function($http) {
    var apiUrl = function(project_id, postfix) {
      return window.API_PREFIX + "/projects/" + project_id + "/files/" + (postfix ? postfix : "");
    };

    this.get = function(project, path) {
      return $http({
        method: "GET",
        url: apiUrl(project.key),
        params: {path: path}
      });
    };

    this.downloadFile = function(project, path) {

    };

    this.newFile = function(project, path) {

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

    this.updateFile = function(project, path) {

    };

    this.move = function(project, path) {

    };

    this.trimSlashes = function(p) {
      return p.replace(/^[\s\/]+/, "").replace(/[\s\/]+$/, "");
    };

  }]);
})()