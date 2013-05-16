"use strict";

(function() {
  angular.module("projecto").service(
    "FeedService", function() {

      var apiUrl = function(project_id, postfix) {
        return window.API_PREFIX + "/projects/" + project_id + "/feed/" + (postfix ? postfix : "");
      };

      this.new = function(project, post) {
        return $.ajax({
          type: "POST",
          url: apiUrl(project.key),
          dataType: "json",
          contentType: "application/json",
          data: JSON.stringify({content: post})
        });
      };

      this.delete = function(project, post) {
        return $.ajax({
          type: "DELETE",
          url: apiUrl(project.key, post.key),
          dataType: "json"
        });
      };

      this.index = function(project) {
        return $.ajax({
          type: "GET",
          url: apiUrl(project.key),
          dataType: "json"
        });
      };
    }
  );
})();