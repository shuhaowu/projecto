"use strict";

(function(){
  var module = angular.module("projecto");

  module.controller("NewCommentController", ["$scope", "CommentsService", function($scope, CommentsService) {
    $scope.commentText = "";

    $scope.newComment = function() {
      var promise = CommentsService.post($scope.currentProject, $scope.post.key, $scope.commentText);
      $("body").statusmsg("open", "Posting...");
      promise.done(function(comment) {
        $("body").statusmsg("close");
        comment.author = window.currentUser;
        $scope.$apply(function() {
          $scope.commentText = "";
          $scope.post.children.push(comment);
        });
      }).fail(function(xhr){
        $("body").statusmsg("open", "Post error " + xhr.status, {type: "error", closable: true});
      });
    };

  }]);

})();