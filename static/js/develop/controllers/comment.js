"use strict";

(function(){
  var module = angular.module("projecto");

  module.controller("NewCommentController", ["$scope", function($scope) {
    $scope.commentText = "";

    $scope.post = function() {
      alert($scope.commentText);
    };
  }]);

})();