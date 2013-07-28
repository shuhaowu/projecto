"use strict";

(function() {
  angular.module("projecto").service("CommentsService", function() {
    var apiUrl = function(projectId, parentId, postfix) {
      return window.API_PREFIX + "/projects/" + projectId + "/comments/" + parentId + "/" + (postfix ?  postfix : "");
    };

    this.post = function(project, parentId, commentText) {
      return $.ajax({
        type: "POST",
        url: apiUrl(project.key, parentId),
        dataType: "json",
        contentType: "application/json",
        data: JSON.stringify({content: commentText})
      });
    };
  });
})()