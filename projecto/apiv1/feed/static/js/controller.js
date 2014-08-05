"use strict";

(function() {

  var module = angular.module("projecto");

  module.controller("FeedItemController", ["$scope", "$window", "$location", "toast", "FeedService", function($scope, $window, $location, toast, FeedService) {
    $scope.deletePost = function(post) {
      if ($scope.currentProject) {
        if ($window.confirm("Are you sure you want to delete this post?")) {
          var req = FeedService.delete($scope.currentProject, post);
          req.success(function() {
            if ($scope.posts) {
              for (var i=0; i<$scope.posts.length; i++) {
                if ($scope.posts[i].key === post.key) {
                  $scope.posts.splice(i, 1);
                  break;
                }
              }
            } else {
              $location.path("/projects/" + $scope.currentProject.key + "/feed");
              $location.replace();
            }
          });
          req.error(function(data, status) {
            toast.error("Failed to delete post", status);
          });
        }
      } else {
        window.notLoaded();
      }
    };
  }]);

  module.controller(
    "FeedController", ["$scope", "toast", "title", "FeedService", "ProjectsService", function($scope, toast, title, FeedService, ProjectsService) {
      $scope.posts = [];
      $scope.newpost = "";

      $scope.post = function() {
        if ($scope.newpost && $scope.currentProject) {
          toast.info("Posting...");
          var req = FeedService.new($scope.currentProject, $scope.newpost);
          req.success(function(data) {
            toast.close();
            // The backend API won't transmit useless information to save
            // bandwidth.
            data.author = window.currentUser;
            data.children = [];
            $scope.newpost = "";
            $scope.posts.splice(0, 0, data);
          });

          req.error(function(data, status) {
            toast.error("Failed to post", status);
          });
        } else {
          if (!$scope.newpost) {
            toast.warn("You cannot post an empty message.");
          } else {
            window.notLoaded();
          }
        }
      };

      //   _________
      //  /_  ___   \
      // /@ \/@  \   \
      // \__/\___/   /
      //  \_\/______/
      //  /     /\\\\\
      // |     |\\\\\\\
      //  \      \\\\\\\
      //   \______/\\\\\\
      //     _||_||_

      $scope.update = function() {
        if ($scope.currentProject){
          title("Feed", $scope.currentProject);
          var req = FeedService.index($scope.currentProject);
          req.success(function(data) {
            $scope.posts = data.feed;
          });

          req.error(function(data, status) {
            toast.error("Failed to update feed", status);
          });
        } else {
          window.notLoaded();
        }
      };

      $scope.currentProject = null;

      ProjectsService.getCurrentProject().done(function(currentProject){
        $scope.currentProject = currentProject;
        $scope.update();
        $scope.$$phase || $scope.$apply();
      });
    }]
  );

  module.controller("SingleFeedController", ["$scope", "$route", "toast", "title", "FeedService", "ProjectsService", "CommentsService", function($scope, $route, toast, title, FeedService, ProjectsService, CommentsService) {
    $scope.currentProject = null;

    $scope.update = function() {
      var req = FeedService.get($scope.currentProject, $route.current.params.feedId);

      req.success(function(post) {
        var t = post.content.slice(0, 20);
        if (post.content.length > 20) {
          t += " ...";
        }

        $scope.post = $scope.commentsParent = post;
        $scope.comments = $scope.post.children;
        title(t, $scope.currentProject);
      });

      req.error(function(data, status) {
        toast.error("Failed to get item", status);
      });
    };

    // so that feeditem.html knows what's going on.
    $scope.hideCommentLink = true;

    ProjectsService.getCurrentProject().done(function(currentProject) {
      $scope.currentProject = currentProject;
      $scope.update();
      $scope.$$phase || $scope.$apply();
    });
  }]);

})();