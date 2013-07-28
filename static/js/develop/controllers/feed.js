"use strict";

(function() {

  var module = angular.module("projecto");

  module.controller("FeedItemController", ["$scope", "FeedService", function($scope, FeedService) {
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
            $("body").statusmsg("open", "Delete error " + xhr.status, {type: "error", closable: true});
          });
        }
      } else {
        notLoaded();
      }
    };
  }]);

  module.controller(
    "FeedController", ["$scope", "title", "FeedService", "ProjectsService", function($scope, title, FeedService, ProjectsService) {
      $scope.posts = [];
      $scope.newpost = "";

      $scope.post = function() {
        if ($scope.newpost && $scope.currentProject) {
          $("body").statusmsg("open", "Posting...");
          FeedService.new($scope.currentProject, $scope.newpost).done(function(data){
            $("body").statusmsg("close");
            // The backend API won't transmit useless information to save
            // bandwidth.
            data.author = window.currentUser;
            data.children = [];
            $scope.$apply(function(){
              $scope.newpost = "";
              $scope.posts.splice(0, 0, data);
            });
          }).fail(function(xhr){
            $("body").statusmsg("open", "Error posting (" + xhr.status + "). Please try again later.", {type: "error", closable: true});
          })
        } else {
          if (!$scope.newpost) {
            $("body").statusmsg("open", "You can't post an empty message!", {type: "error", autoclose: 5000});
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
            $("body").statusmsg("open", "Updating feed failed: " + xhr.status, {type: "error", closable: true});
          });
        } else {
          $("body").statusmsg("open", "The page has not been fully loaded yet. Please wait...", {type: "warning", closable: true});
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

  module.controller("SingleFeedController", ["$scope", "$route", "title", "FeedService", "ProjectsService", function($scope, $route, title, FeedService, ProjectsService) {
    $scope.currentProject = null;

    $scope.update = function() {
      FeedService.get($scope.currentProject, $route.current.params.feedId).done(function(post) {
        $scope.$apply(function() {
          var t = post.content.slice(0, 20);
          if (post.content.length > 20) {
            t += " ...";
          }

          $scope.post = post;
          title(t, $scope.currentProject);
        });
      });
    };

    // so that feeditem.html knows what's going on.
    $scope.singlePost = true;

    ProjectsService.getCurrentProject().done(function(currentProject) {
      $scope.currentProject = currentProject;
      $scope.update();
      $scope.$$phase || $scope.$apply();
    });
  }]);

})();