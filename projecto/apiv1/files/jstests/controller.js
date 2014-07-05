"use strict";

(function() {
  var projectKey = "projectkey";
  var project = {key: projectKey};
  var baseUrl = window.API_PREFIX + "/projects/" + projectKey + "/files/";
  var author = angular.copy(window.currentUser);
  delete author.emails;

  var dir1 = {author: author, path: "/dir1/", date: 1388189244.0};
  var file1 = {author: author, path: "/file1.txt", date: 1388189244.0};

  var rootFilesList = {
    path: "/",
    children: [
      dir1,
      file1
    ]
  };

  var route = {
    current: {
      params: {
        path: undefined
      }
    }
  };

  describe("FilesTreeController", function() {
    var controller, scope, service, $httpBackend, $window, location;

    beforeEach(angular.mock.module("projecto"));
    beforeEach(angular.mock.inject(function($rootScope, $controller, $location, _$httpBackend_, FilesService) {
      location = $location;
      $httpBackend = _$httpBackend_;
      service = FilesService;

      scope = $rootScope.$new();
      $window = angular.copy(commonMocked.$window);
      controller = $controller("FilesTreeController", {
        $scope: scope,
        ProjectsService: commonMocked.ProjectsService,
        $window: $window,
        $route: route,
        $location: $location
      });
      scope.currentProject = project;
    }));

    it("should create new directory", function() {
      $httpBackend.when("POST", baseUrl + "?path=%2Fdir1%2F").respond(dir1);
      spyOn(service, "newDirectory").andCallThrough();

      $window.prompt = function(p) {
        return "dir1";
      };

      scope.update = function() {};

      scope.newDirectory();
      expect(service.newDirectory).toHaveBeenCalledWith(project, "/", "dir1");
      $httpBackend.expectPOST(baseUrl + "?path=%2Fdir1%2F");
      $httpBackend.flush();
    });

    it("should create new file", function() {
      $httpBackend.when("POST", baseUrl + "?path=%2Ffile1.txt").respond(file1);
      spyOn(service, "newFile").andCallThrough();

      // Hacks!
      scope.update = function() {};
      var elem = document.createElement("div");
      elem.id = "files-file-upload";
      document.body.appendChild(elem);

      var blob = testutils.createBlob("file1.txt");
      scope.$broadcast("files-added", undefined, [blob]);
      scope.newFile();

      expect(service.newFile).toHaveBeenCalledWith(project, "/", blob);
      $httpBackend.expectPOST(baseUrl + "?path=%2Ffile1.txt");
      $httpBackend.flush();
    });

    it("should delete directory", function() {
      $httpBackend.when("DELETE", baseUrl + "?path=%2Fdir1%2F").respond({status: "okay"});
      spyOn(service, "delete").andCallThrough();
      spyOn(location, "path");
      spyOn(location, "replace").andCallThrough();

      // More hacks!
      scope.path = "/dir1/";

      scope.deleteDirectory();
      expect(service.delete).toHaveBeenCalledWith(project, "/dir1/");
      $httpBackend.expectDELETE(baseUrl + "?path=%2Fdir1%2F");
      $httpBackend.flush();
      expect(location.path).toHaveBeenCalledWith("/projects/" + projectKey + "/files/");
      expect(location.replace).toHaveBeenCalled();
    });

    it("should list directory on init", function() {
      $httpBackend.when("GET", baseUrl + "?path=%2F").respond(rootFilesList);
      spyOn(service, "get").andCallThrough();

      scope.update();
      expect(service.get).toHaveBeenCalledWith(project, "/");
      $httpBackend.expectGET(baseUrl + "?path=%2F");
      $httpBackend.flush();

      expect(scope.files.length).toBe(2);
      expect(scope.files[0].name).toBe("dir1");
      expect(scope.files[0].is_directory).toBe(true);
      expect(scope.files[1].name).toBe("file1.txt");
      expect(scope.files[1].is_directory).toBe(false);
      expect(scope.notFound).toBe(false);
    });

    it("should list directory on init but 404", function() {
      $httpBackend.when("GET", baseUrl + "?path=%2Fdir2%2F").respond(404, "");
      scope.path = "/dir2/";
      spyOn(service, "get").andCallThrough();

      scope.update();
      expect(service.get).toHaveBeenCalledWith(project, "/dir2/");

      $httpBackend.expectGET(baseUrl + "?path=%2Fdir2%2F");
      $httpBackend.flush();
      expect(scope.notFound).toBe(true);
    });

  });

  describe("FileViewController", function() {
    var controller, scope, service, $httpBackend, $window, location;

    beforeEach(angular.mock.module("projecto"));
    beforeEach(angular.mock.inject(function($rootScope, $controller, $location, _$httpBackend_, FilesService) {
      service = FilesService;
      location = $location;
      $httpBackend = _$httpBackend_;

      scope = $rootScope.$new();
      controller = $controller("FileViewController", {
        $scope: scope,
        $window: commonMocked.$window,
        ProjectsService: commonMocked.ProjectsService,
        $location: $location,
        $route: route
      });
      scope.currentProject = project;
    }));

    it("should update files", function() {
      $httpBackend.when("PUT", baseUrl + "?path=%2Ffile1.txt").respond(file1);
      spyOn(service, "updateFile").andCallThrough();

      // Hacks!
      scope.update = function() {};
      var elem = document.createElement("div");
      elem.id = "files-file-upload";
      document.body.appendChild(elem);

      scope.path = "/file1.txt";
      var blob = testutils.createBlob("file2.txt");
      scope.$broadcast("files-added", undefined, [blob]);
      scope.updateFile();

      expect(service.updateFile).toHaveBeenCalledWith(project, "/file1.txt", blob);
      $httpBackend.expectPUT(baseUrl + "?path=%2Ffile1.txt");
      $httpBackend.flush();
    });

    it("should delete files", function() {
      $httpBackend.when("DELETE", baseUrl + "?path=%2Ffile1.txt").respond({status: "okay"});
      spyOn(service, "delete").andCallThrough();
      spyOn(location, "path").andCallThrough();
      spyOn(location, "replace").andCallThrough();

      scope.path = "/file1.txt";
      scope.delete();
      expect(service.delete).toHaveBeenCalledWith(project, "/file1.txt");

      $httpBackend.expectDELETE(baseUrl + "?path=%2Ffile1.txt");
      $httpBackend.flush();
      expect(location.path).toHaveBeenCalledWith("/projects/" + projectKey + "/files/");
      expect(location.replace).toHaveBeenCalled();
    });

    it("should initialize controller and get file", function() {
      $httpBackend.when("GET", baseUrl + "?path=%2Ffile1.txt").respond(file1);

      spyOn(service, "get").andCallThrough();

      scope.path = "/file1.txt";
      scope.update();
      expect(service.get).toHaveBeenCalledWith(project, "/file1.txt");

      $httpBackend.flush();
      $httpBackend.expectGET(baseUrl + "?path=%2Ffile1.txt");
      expect(scope.author).toEqual(author);
      expect(scope.updated).toBe(file1.date);
      expect(scope.notFound).toBe(false);
    });

    it("should recognize file not found", function() {
      $httpBackend.when("GET", baseUrl + "?path=%2Ffile2.txt").respond(404, "");

      scope.path = "/file2.txt";
      scope.update();

      $httpBackend.flush();
      $httpBackend.expectGET(baseUrl + "?path=%2Ffile2.txt");
      expect(scope.notFound).toBe(true);
    });

  });
})();
