"use strict";

(function() {
  angular.module("projecto").service(
    "FeedService", ["$http", function($http) {

      var apiUrl = function(project_id, postfix) {
        return window.API_PREFIX + "/projects/" + project_id + "/feed/" + (postfix ? postfix : "");
      };

      this.new = function(project, post) {
        return $http({
          method: "POST",
          url: apiUrl(project.key),
          data: {content: post}
        });
      };

      this.delete = function(project, post) {
        return $http({
          method: "DELETE",
          url: apiUrl(project.key, post.key),
        });
      };

      this.index = function(project) {
        return $http({
          method: "GET",
          url: apiUrl(project.key)
        });
      };

      this.get = function(project, post) {
        return $http({
          method: "GET",
          url: apiUrl(project.key, post)
        });
      };
    }]);
})();