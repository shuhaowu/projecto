"use strict";

(function() {
  angular.module("projecto").service("CommentsService", ["$http", function($http) {
    var apiUrl = function(projectId, parentId, postfix) {
      return window.API_PREFIX + "/projects/" + projectId + "/comments/" + parentId + "/" + (postfix ?  postfix : "");
    };

    this.post = function(project, parentId, commentText) {
      return $http({
        method: "POST",
        url: apiUrl(project.key, parentId),
        data: {content: commentText}
      });
    };

    this.delete = function(project, parentId, comment) {
      return $http({
        method: "DELETE",
        url: apiUrl(project.key, parentId, comment.key)
      });
    };
  }]);
})();