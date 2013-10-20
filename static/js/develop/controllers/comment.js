"use strict";

(function(){
  var module = angular.module("projecto");

  // These contr
  // Parent $scope needs .commentsParent and .comments attributes where
  // commentsParent is the parent of the comment with a .key attribute and
  // comments is just a list of the comments, which contains comment.

  module.controller("NewCommentController", ["$scope", "toast", "CommentsService", function($scope, toast, CommentsService) {
    $scope.commentText = "";

    $scope.newComment = function() {
      toast.info("Posting...");
      var req = CommentsService.post($scope.currentProject, $scope.commentsParent.key, $scope.commentText);

      req.success(function(comment) {
        toast.close();
        comment.author = window.currentUser;
        $scope.commentText = "";
        $scope.comments.push(comment);
      });

      req.error(function(data, status) {
        toast.error("Failed to post comment", status);
      });
    };

  }]);

  module.controller("CommentController", ["$scope", "toast", "CommentsService", function($scope, toast, CommentsService) {
    // TODO: fix the hackness of this.
    $scope.delete = function(index) {
      if (confirm("Are you sure you want to delete this comment?")) {
        toast.info("Deleting...");
        var req = CommentsService.delete($scope.currentProject, $scope.commentsParent.key, $scope.comments[index]);

        req.success(function() {
          toast.close();
          $scope.comments.splice(index, 1);
        });

        req.error(function(data, status) {
          toast.error("Failed to delete comment", status);
        });
      }
    };
  }]);

})();
