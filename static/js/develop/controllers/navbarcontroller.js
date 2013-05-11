"use strict";

(function() {
  angular.module("projecto").controller(
    "NavbarController", ["$scope", "$location", "ProjectsService", function($scope, $location, ProjectsService) {
      $scope.currentProject = null;

      $scope.$on("$routeChangeSuccess", function(event, current, previous){
        ProjectsService.getCurrentProject().done(function(currentProject){
          $scope.currentProject = currentProject;
          $scope.$$phase || $scope.$apply();
        }).fail(function(){
          $scope.currentProject = null;
          $scope.$$phase || $scope.$apply();
        });
      });
    }]
  );
})();