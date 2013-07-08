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

  angular.module("projecto").controller("ProjectMembershipController", ["$scope", "ManageService", "ProjectsService", function($scope, ManageService, ProjectsService) {
    $scope.owners = [];
    $scope.collaborators = [];
    $scope.unregisteredOwners = [];
    $scope.unregisteredCollaborators = [];

    var genericAdder = function(f) {
      var email = promptForAdd();
      if (email) {
        $("body").statusmsg("open", "Adding...");
        var addRequest = f($scope.currentProject, email);

        addRequest.success(function(data, status, headers) {
          $("body").statusmsg("open", "Added!", {type: "success", autoclose: 2000});
          $scope.update();
        });

        addRequest.error(function(data, status, headers) {
          $("body").statusmsg("open", "Adding failed: " + status, {type: "error", closable: true});
        });
      }
    };

    var genericRemover = function(email, i, f, list) {
      if (confirmForDelete()) {
        var removeRequest = f($scope.currentProject, email);
        removeRequest.success(function() {
          if (list)
            list.splice(i, 1);

          $("body").statusmsg("open", "Removed!", {type: "success", autoclose: 2000});
        });

        removeRequest.error(function(data, status) {
          $("body").statusmsg("open", "Removing failed: " + status, {type: "error", closable: true});
        });
      }
    };

    $scope.addOwner = function() {
      genericAdder(ManageService.addOwner);
    };

    $scope.removeOwner = function(i, owner) {
      if ($scope.owners.length <= 1) {
        $("body").statusmsg("open", "Cannot remove the last owner!", {type: "error", closable: true});
        return;
      }
      genericRemover(owner.email, i, ManageService.removeOwner, $scope.owners);
    };

    $scope.removeUnregisteredOwner = function(i, owner) {
      genericRemover(owner, i, ManageService.removeOwner, $scope.unregisteredOwners);
    };

    $scope.addCollaborator = function() {
      genericAdder(ManageService.addCollaborator);
    };

    $scope.removeCollaborator = function(i, collaborator) {
      genericRemover(collaborator.email, i, ManageService.removeCollaborator, $scope.collaborators);
    };

    $scope.removeUnregisteredCollaborator = function(i, collaborator) {
      genericRemover(collaborator, i, ManageService.removeCollaborator, $scope.unregisteredCollaborators);
    };

    $scope.update = function() {
      if ($scope.currentProject) {
        var listRequest = ManageService.listMembers($scope.currentProject);
        listRequest.success(function(data, status, header) {
          $scope.owners = data.owners;
          $scope.collaborators = data.collaborators;
          $scope.unregisteredCollaborators = data.unregistered_collaborators;
          $scope.unregisteredOwners = data.unregistered_owners;
        });

        listRequest.error(function(data, status, headers) {
          $("body").statusmsg("open", "Problem getting members. Try refreshing. (" + status + ")", {type: "error", closable: true});
        });
      }
    };

    $scope.currentProject = null;

    ProjectsService.getCurrentProject().done(function(currentProject){
      $scope.currentProject = currentProject;
      $scope.update();

      $scope.$$phase || $scope.$apply();
    });
  }]);
})();