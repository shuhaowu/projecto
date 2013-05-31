"use strict";

(function() {
  angular.module("projecto").controller(
    "ProjectSwitcher", ["$scope", "$location", "ProjectsService", function($scope, $location, ProjectsService) {
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
          $("body").statusmsg("open", "Project \""+projectName+"\" created!", {type: "success", autoclose: 2000});
        });

        promise.fail(function() {
          $("body").statusmsg("open", "Adding project failed (Error: " + xhr.status + ").", {type: "error", closable: true});
        });
      };
    }]
  );
})();