"use strict";

(function() {
  angular.module("projecto").controller(
    "ProjectSwitcher", ["$scope", "$location", "toast", "ProjectsService", function($scope, $location, toast, ProjectsService) {
      $scope.projectsOwned = [];

      $scope.projectsParticipating = [];

      // Get all the projects
      var promise = ProjectsService.listMine();
      promise.done(function(data, status, xhr) {
        $scope.$apply(function() {
          $scope.projectsOwned = data.owned;
          $scope.projectsParticipating = data.participating;
        });
      });

      $scope.newProject = function() {
        var projectName = prompt("Project name");
        if (!projectName) return;
        var promise = ProjectsService.new(projectName);

        promise.done(function(data, status, xhr) {
          $scope.$apply(function() {
            data.name = projectName;
            $scope.projectsOwned.push(data);
            $location.path("/projects/" + data.key + "/");
          });
          toast.success("Project \"" + projectName + "\" created!");
        });

        promise.fail(function() {
          toast.error("Failed to create project", xhr.status);
        });
      };
    }]
  );
})();