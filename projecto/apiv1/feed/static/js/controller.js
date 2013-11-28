"use strict";

(function() {

  var module = angular.module("projecto");

  module.controller("FeedItemController", ["$scope", "toast", "FeedService", function($scope, toast, FeedService) {
    $scope.deletePost = function(post) {
      if ($scope.currentProject) {
        if (confirm("Are you sure you want to delete this post?")) {
          FeedService.delete($scope.currentProject, post).done(function(){
            for (var i=0; i<$scope.posts.length; i++) {
              if ($scope.posts[i].key === post.key) {
                $scope.$apply(function(){
                  $scope.posts.splice(i, 1);
                });
                break;
              }
            }
          }).fail(function(xhr){
            toast.error("Failed to delete post", xhr.status);
          });
        }
      } else {
        notLoaded();
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
          FeedService.new($scope.currentProject, $scope.newpost).done(function(data){
            toast.close();
            // The backend API won't transmit useless information to save
            // bandwidth.
            data.author = window.currentUser;
            data.children = [];
            $scope.$apply(function(){
              $scope.newpost = "";
              $scope.posts.splice(0, 0, data);
            });
          }).fail(function(xhr){
            toast.error("Failed to post", xhr.status);
          })
        } else {
          if (!$scope.newpost) {
            toast.warn("You cannot post an empty message.");
          } else {
            notLoaded();
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
          FeedService.index($scope.currentProject).done(function(data){
            $scope.$apply(function(){
              $scope.posts = data.feed;
            });
          }).fail(function(xhr){
            toast.error("Failed to update feed", xhr.status);
          });
        } else {
          notLoaded();
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
      FeedService.get($scope.currentProject, $route.current.params.feedId).done(function(post) {
        $scope.$apply(function() {
          var t = post.content.slice(0, 20);
          if (post.content.length > 20) {
            t += " ...";
          }

          $scope.post = $scope.commentsParent = post;
          $scope.comments = $scope.post.children;
          title(t, $scope.currentProject);
        });
      }).fail(function(xhr) {
        toast.error("Failed to get item", xhr.status);
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