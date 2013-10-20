"use strict";

(function() {

  var module = angular.module("projecto");

  module.controller("FilesTreeController", ["$scope", "$route", "$location", "toast", "title", "FilesService", "ProjectsService", function($scope, $route, $location, toast, title, FilesService, ProjectsService) {
    title("Files", $scope.currentProject);

    var files = [];
    $scope.$on("files-added", function(e, element, fs) {
      files = [];
      for (var i=0; i<fs.length; i++) {
        files.push(fs[i]);
      }
    });

    $scope.currentProject = null;

    $scope.newDirectory = function() {
      var name = $.trim(prompt("Enter folder name"));
      if (name) {
        toast.info("Creating...");
        var req = FilesService.newDirectory($scope.currentProject, $route.current.params.path || "/", name);
        req.success(function(data, status, headers, config) {
          toast.close();
          $scope.update();
        });

        req.error(function(data, status, headers, config) {
          if (status === 404) {
            toast.error("Failed to create directory", "cannot modify a directory that does not exist");
          } else {
            toast.error("Failed to create directory", status);
          }
        });
      }
    };

    var resetFileUploads = function() {
      files = [];
      document.getElementById("files-file-upload").value = "";
    };

    $scope.newFile = function() {
      if (files.length === 0) {
        toast.warn("You need to select a file.");
      } else {
        toast.info("Uploading...");

        var req = FilesService.newFile($scope.currentProject, $route.current.params.path || "/", files[0]);
        req.success(function(data, status, headers, config) {
          toast.close();

          $scope.update();
          $("#files-new-file-modal").foundation("reveal", "close");
          resetFileUploads();
        });

        req.error(function(data, status, headers, config) {
          var message = "";
          if (data && data.error) {
            message = data.error;
          } else {
            message = status;
          }
          toast.error("Failed to upload file", message)
          resetFileUploads();
        });
      }
    };

    $scope.deleteDirectory = function() {
      if (confirm("Are you sure you want to delete this folder?")) {
        toast.info("Deleting...");
        var req = FilesService.delete($scope.currentProject, $scope.path);

        req.success(function() {
          toast.close();

          var oneLevelUp = $scope.path.substring(0, $scope.path.length - 1).split("/");
          oneLevelUp.pop();
          if (oneLevelUp.length > 0) {
            oneLevelUp = oneLevelUp.join("/");
            oneLevelUp = "/" + oneLevelUp + "/";
          } else {
            oneLevelUp = "/";
          }

          $location.path("/projects/" + $scope.currentProject.key + "/files" + oneLevelUp);
          $location.replace();
        });

        req.error(function(data, status) {
          toast.error("Failed to delete folder", status);
        });
      }
    };

    $scope.update = function() {
      if ($scope.currentProject) {
        $scope.notFound = false;
        title("Files", $scope.currentProject);
        var path = $route.current.params.path;

        // This is for parsing for the breadcrumbs.
        [$scope.currentDirectoryList, path] = FilesService.breadcrumbify(path);
        $scope.path = path;
        if ($scope.path.charAt($scope.path.length - 1) !== "/") {
          // TODO: this is what i mean that we need to combine view_file with file.
          // Having two is incredibly inefficient and causes duplicate code and things like this.
          $location.path("/projects/" + $scope.currentProject.key + "/view_file/" + $scope.path);
          $location.replace();
        }

        var req = FilesService.get($scope.currentProject, path);

        req.success(function(data, status, headers, config) {
          toast.loaded();
          $scope.files = data.children;
          var directories = [];
          var files = [];
          for (var i=0; i<$scope.files.length; i++) {
            var f = $scope.files[i];
            var path = f.path;
            f.is_directory = path.charAt(path.length - 1) === "/";
            var tmp = FilesService.trimSlashes(path).split("/");
            f.name = tmp[tmp.length-1];

            if (f.is_directory)
              directories.push(f);
            else
              files.push(f);
          }
          // TODO: this could be made more efficient by using insert that kept order... but oh well.
          var filenameComparer = function(a, b) {
            if (a.name.toLowerCase() > b.name.toLowerCase()) {
              return 1;
            } else if (a.name.toLowerCase() < b.name.toLowerCase()) {
              return -1;
            } else {
              console.log("WAT. Something horrible just happened.. Why are two filenames the same!", a, b);
              return 0;
            }
          };
          directories.sort(function(a, b) {  })
          directories.push.apply(directories, files);
          $scope.files = directories;
        });
        req.error(function(data, status, headers, config) {
          if (status === 404) {
            toast.error("Directory not found");
            $scope.notFound = true;
          } else {
            toast.error("Failed to list directory", status);
          }
        });
      }
    };

    toast.loading();
    ProjectsService.getCurrentProject().done(function(currentProject){
      $scope.currentProject = currentProject;
      $scope.update();

      $scope.$$phase || $scope.$apply();
    });
  }]);


  module.controller("FileViewController", ["$scope", "$route", "$location", "toast", "title", "FilesService", "ProjectsService", function($scope, $route, $location, toast, title, FilesService, ProjectsService) {

    // TODO: Really could use some refactoring with the FilesTreeController
    // Perhaps it is possible to reduce both of those things into a single controller
    var files = [];
    $scope.$on("files-added", function(e, element, fs) {
      files = [];
      for (var i=0; i<fs.length; i++) {
        files.push(fs[i]);
      }
    });

    var resetFileUploads = function() {
      files = [];
      document.getElementById("files-file-upload").value = "";
    };

    $scope.updateFile = function() {
      if (files.length === 0) {
        toast.warn("You need to select a file.");
      } else {
        toast.info("Updating...");
        var req = FilesService.updateFile($scope.currentProject, $route.current.params.path, files[0]);

        req.success(function(data, status, headers, config) {
          // Usually we will close the dialog only. Since in this view changes
          // are not really visible, we will just another toast.
          // However... this does not work right now.
          // Is probably a bug upstream: https://github.com/shuhaowu/awesome-statusmsg
          // TODO: fix this.
          toast.success("Updated!");
          $scope.update();
          $("#files-update-file-modal").foundation("reveal", "close");
          resetFileUploads();
        });

        req.error(function(data, status, headers, config) {
          var message = "";
          if (data && data.error) {
            message = data.error;
          } else {
            message = status;
          }
          toast.error("Failed to update file", message);
          resetFileUploads();
        });
      }
    };

    $scope.delete = function() {
      if (confirm("Are you sure you want to delete this file?")) {
        toast.info("Deleting...");
        var req = FilesService.delete($scope.currentProject, $scope.path);

        req.success(function() {
          toast.close();

          var oneLevelUp = $scope.path.split("/");
          oneLevelUp.pop();
          if (oneLevelUp.length > 0) {
            oneLevelUp = oneLevelUp.join("/");
            oneLevelUp = "/" + oneLevelUp + "/";
          } else {
            oneLevelUp = "/";
          }

          $location.path("/projects/" + $scope.currentProject.key + "/files" + oneLevelUp);
          $location.replace();
        });

        req.error(function(data, status) {
          toast.error("Failed to delete file", status)
        });
      }
    };

    $scope.update = function() {
      if ($scope.currentProject) {
        $scope.notFound = false;
        title("Files", $scope.currentProject);

        var path = $route.current.params.path;
        [$scope.currentDirectoryList, $scope.path] = FilesService.breadcrumbify(path);
        $scope.filename = $scope.currentDirectoryList[$scope.currentDirectoryList.length-1].name;

        var req = FilesService.get($scope.currentProject, $scope.path);

        req.success(function(data, status, headers, config) {
          toast.loaded();
          $scope.author = data.author;
          $scope.updated = data.date;
        });

        req.error(function(data, status, headers, config) {
          if (status === 404) {
            $scope.notFound = true;
          } else {
            toast.error("Failed to get file info", status);
          }
        });
      }
    };

    toast.loading();
    ProjectsService.getCurrentProject().done(function(currentProject){
      $scope.currentProject = currentProject;
      $scope.update();

      $scope.$$phase || $scope.$apply();
    });
  }]);

})();
