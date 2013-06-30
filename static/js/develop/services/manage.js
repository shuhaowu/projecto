"use strict";

(function() {
  angular.module("projecto").service("ManageService", [function() {

    var apiUrl = function(project_id, postfix) {
      return window.API_PREFIX + "/projects/" + project_id + (postfix ? "/" + postfix : "");
    };

    this.listMembers = function(project) {
      return $.ajax({
        url: apiUrl(project.key, "members"),
        type: "GET",
        dataType: "json"
      });
    };

    this.addOwner = function(project, email) {
    };

    this.removeOwner = function(project, email) {

    };

    this.addCollaborator = function(project, email) {

    };

    this.removeCollaborator = function(project, email) {

    };

  }]);
})();