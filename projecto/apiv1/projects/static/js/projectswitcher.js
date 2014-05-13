"use strict";

(function() {
  angular.module("projecto").controller(
    "ProjectSwitcher", ["$scope", "$location", "$window", "toast", "title", "ProjectsService", function($scope, $location, $window, toast, title, ProjectsService) {
      $scope.projectsOwned = [];

      $scope.projectsParticipating = [];

      var path = $location.path();
      if (path === "" || path === "/" || path === "/home") {
        title("Dashboard");
      }

      // Get all the projects
      var req = ProjectsService.listMine();
      req.done(function(data, status, xhr) {
        $scope.projectsOwned = data.owned;
        $scope.projectsParticipating = data.participating;
        $scope.$$phase || $scope.$apply();
      });

      req.error(function(xhr) {
        toast.error("Failed to list projects", xhr.status);
      });


      $scope.newProject = function() {
        var projectName = $window.prompt("Project name");
        if (!projectName) return;

        toast.info("Creating...");
        var req = ProjectsService.new(projectName);

        req.success(function(data) {
          data.name = projectName;
          $scope.projectsOwned.push(data);
          $location.path("/projects/" + data.key + "/");
          toast.close();
        });

        req.error(function(data, status) {
          toast.error("Failed to create project", status);
        });
      };
    }]
  );
})();