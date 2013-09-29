"use strict";

(function() {
  angular.module("projecto").service("FilesService", ["$http", function($http) {
    var apiUrl = function(project_id, postfix) {
      return window.API_PREFIX + "/projects/" + project_id + "/files/" + (postfix ? postfix : "");
    };

    this.ls = function(project, path) {

    };

    this.showFileDetails = function(project, path) {

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

    this.createFile = function(project, path) {

    };

    this.createDirectory = function(project, path) {

    };

    this.updateFile = function(project, path) {

    };

    this.move = function(project, path) {

    };

  }]);
})()