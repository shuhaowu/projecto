"use strict";

(function() {

  angular.module("projecto").controller("FilesTreeController", ["$scope", "$route", "title", "FilesService", "ProjectsService", function($scope, $route, title, FilesService, ProjectsService) {
    title("Files", $scope.currentProject);

    $scope.currentProject = null;

    $("body").statusmsg("open", "Loading...");

    $scope.newDirectory = function() {
      var name = input("Enter folder name");
    };

    $scope.newFile = function() {

    };

    $scope.update = function() {
      if ($scope.currentProject) {
        $scope.notFound = false;
        title("Files", $scope.currentProject);
        var path = $route.current.params.path;

        // This is for parsing for the breadcrumbs.
        $scope.currentDirectoryList = [{path: "/", name: "Root", last: true}];
        if (!path) {
          path = "/";
        } else {
          // stripping / from beginning and end of the path ..
          $scope.currentDirectoryList[0].last = false;
          var tmp = path.replace(/^[\s\/]+/).replace(/[\s\/]+$/).split("/");
          var currentPath;
          for (var i=0; i<tmp.length; i++) {
            currentPath = tmp.slice(0, i+1);
            currentPath = "/" + currentPath.join("/") + "/";
            $scope.currentDirectoryList.push({
              path: currentPath,
              name: tmp[i],
              last: i == tmp.length - 1
            });
          }
        }
        var req = FilesService.get($scope.currentProject, path);
        req.success(function(data, status, headers, config) {
          $("body").statusmsg("close");
          $scope.files = data.children;
          for (var i=0; i<$scope.files.length; i++) {
            var path = $scope.files[i].path;
            $scope.files[i].is_directory = path.charAt(path.length - 1) === "/";
            var tmp = path.replace(/^[\s\/]+/).replace(/[\s\/]+$/).split("/");
            $scope.files[i].name = tmp[tmp.length-1];
          }
        });
        req.error(function(data, status, headers, config) {
          if (status === 404) {
            $("body").statusmsg("open", "This directory is not found!", {type: "error", closable: true});
            $scope.notFound = true;
          } else {
            $("body").statusmsg("open", "List directory failed (" + status + ")!", {type: "error", closable: true});
          }
        });
      }
    };

    ProjectsService.getCurrentProject().done(function(currentProject){
      $scope.currentProject = currentProject;
      $scope.update();

      $scope.$$phase || $scope.$apply();
    });
  }]);

})();