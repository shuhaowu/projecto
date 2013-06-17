"use strict";

(function() {
  angular.module("projecto").controller("ManageController", ["$scope", function($scope) {
    $(document).foundation("section", "reflow");
  }]);

  angular.module("projecto").controller("ProjectMembershipController", ["$scope", function($scope) {

  }]);

  angular.module("projecto").controller("ProjectOverviewController", ["$scope", "ProjectsService", function($scope, ProjectsService) {
    ProjectsService.getCurrentProjectStats().done(function(project) {
      $scope.name = project.name;

    });
  }]);
})();