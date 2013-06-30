"use strict";

(function() {
  angular.module("projecto").controller("ManageController", ["$scope", function($scope) {
    $(document).foundation("section", "reflow");
  }]);

  var promptForAdd = function() {
    return prompt("Enter an email address:");
  };

  var confirmForDelete = function() {
    return confirm("Are you sure you want to delete this user?");
  };

  angular.module("projecto").controller("ProjectMembershipController", ["$scope", function($scope) {
    $scope.managers = [];
    $scope.participants = [];
    $scope.unregisteredManagers = [];
    $scope.unregisteredParticipants = [];

    $scope.addManager = function() {

    };

    $scope.removeManager = function(i, manager) {

    };

    $scope.removeUnregisteredManager = function(i, manager) {

    };

    $scope.addCollaborator = function() {

    };

    $scope.removeCollaborator = function(i, collaborator) {

    };

    $scope.removeUnregisteredCollaborator = function(i, collaborator) {

    };


  }]);
})();