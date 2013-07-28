"use strict";

(function() {
  angular.module("projecto").service("ManageService", ["$http", function($http) {

    var apiUrl = function(project_id, postfix) {
      return window.API_PREFIX + "/projects/" + project_id + "/" + (postfix ? postfix : "");
    };

    this.listMembers = function(project) {
      return $http({
        url: apiUrl(project.key, "members"),
        method: "GET",
      });
    };

    this.addOwner = function(project, email) {
      return $http({
        url: apiUrl(project.key, "addowners"),
        method: "POST",
        data: {emails: [email]}
      });
    };

    this.removeOwner = function(project, email) {
      return $http({
        url: apiUrl(project.key, "removeowners"),
        method: "POST",
        data: {emails: [email]}
      });
    };

    this.addCollaborator = function(project, email) {
      return $http({
        url: apiUrl(project.key, "addcollaborators"),
        method: "POST",
        data: {emails: [email]}
      });
    };

    this.removeCollaborator = function(project, email) {
      return $http({
        url: apiUrl(project.key, "removecollaborators"),
        method: "POST",
        data: {emails: [email]}
      });
    };

  }]);
})();