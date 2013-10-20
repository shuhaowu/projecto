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

  angular.module("projecto").controller("ProjectMembershipController", ["$scope", "toast", "ManageService", "ProjectsService", function($scope, toast, ManageService, ProjectsService) {
    $scope.owners = [];
    $scope.collaborators = [];
    $scope.unregisteredOwners = [];
    $scope.unregisteredCollaborators = [];

    var genericAdder = function(f) {
      var email = promptForAdd();
      if (email) {
        toast.info("Adding...");
        var addRequest = f($scope.currentProject, email);

        addRequest.success(function(data, status, headers) {
          toast.close();
          $scope.update();
        });

        addRequest.error(function(data, status, headers) {
          toast.error("Failed to add", status);
        });
      }
    };

    var genericRemover = function(email, i, f, list) {
      if (confirmForDelete()) {
        toast.info("Removing...");
        var removeRequest = f($scope.currentProject, email);
        removeRequest.success(function() {
          if (list)
            list.splice(i, 1);

          toast.close();
        });

        removeRequest.error(function(data, status) {
          toast.error("Failed to remove", status);
        });
      }
    };

    $scope.addOwner = function() {
      genericAdder(ManageService.addOwner);
    };

    $scope.removeOwner = function(i, owner) {
      if ($scope.owners.length <= 1) {
        toast.error("Cannot remove the last owner!");
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
          toast.loaded();
          $scope.owners = data.owners;
          $scope.collaborators = data.collaborators;
          $scope.unregisteredCollaborators = data.unregistered_collaborators;
          $scope.unregisteredOwners = data.unregistered_owners;
        });

        listRequest.error(function(data, status, headers) {
          toast.error("Failed to list members", status);
        });
      }
    };

    $scope.currentProject = null;
    toast.loading();
    ProjectsService.getCurrentProject().done(function(currentProject){
      $scope.currentProject = currentProject;
      $scope.update();

      $scope.$$phase || $scope.$apply();
    });
  }]);
})();