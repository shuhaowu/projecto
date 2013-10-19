"use strict";

(function(){
  var module = angular.module("projecto");

  // These contr
  // Parent $scope needs .commentsParent and .comments attributes where
  // commentsParent is the parent of the comment with a .key attribute and
  // comments is just a list of the comments, which contains comment.

  module.controller("NewCommentController", ["$scope", "CommentsService", function($scope, CommentsService) {
    $scope.commentText = "";

    $scope.newComment = function() {
      $("body").statusmsg("open", "Posting...");
      var req = CommentsService.post($scope.currentProject, $scope.commentsParent.key, $scope.commentText);

      req.success(function(comment) {
        $("body").statusmsg("close");
        comment.author = window.currentUser;
        $scope.commentText = "";
        $scope.comments.push(comment);
      });

      req.error(function(data, status) {
        $("body").statusmsg("open", "Post error " + status, {type: "error", closable: true});
      });
    };

  }]);

  module.controller("CommentController", ["$scope", "CommentsService", function($scope, CommentsService) {
    // TODO: fix the hackness of this.
    $scope.delete = function(index) {
      if (confirm("Are you sure you want to delete this comment?")) {
        var req = CommentsService.delete($scope.currentProject, $scope.commentsParent.key, $scope.comments[index]);

        req.success(function() {
          $scope.comments.splice(index, 1);
        });

        req.error(function(data, status) {
          $("body").statusmsg("open", "Delete error " + status, {type: "error", closable: true});
        });
      }
    };
  }]);

})();