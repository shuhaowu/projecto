"use strict";

(function() {
  var projectKey = "projectkey";
  var baseUrl = window.API_PREFIX + "/projects/" + projectKey + "/files/";
  var project = {key: projectKey};
  var author = angular.copy(window.currentUser);
  delete author.emails;

  var file1 = {author: author, path: "/file1.txt", date: 1388189244.0};
  var file1url = baseUrl + "?path=%2Ffile1.txt"

  var dir1 = {author: author, path: "/dir1/", date: 1388189244.0};
  var dir1url = baseUrl + "?path=%2Fdir1%2F";

  var nested_file = {author: author, path: "/dir1/file2.txt", date: 1388189244.0};
  var nested_file_url = baseUrl + "?path=%2Fdir1%2Ffile2.txt";

  var nested_dir = {author: author, path: "/dir1/dir2/", date: 1388189244.0};
  var nested_dir_url = baseUrl + "?path=%2Fdir1%2Fdir2%2F";

  describe("FilesService", function() {
    var service, $httpBackend;

    beforeEach(angular.mock.module("projecto"));
    beforeEach(angular.mock.inject(function(FilesService, _$httpBackend_) {
      $httpBackend = _$httpBackend_;
      service = FilesService;
    }));

    it("should get files", function() {
      $httpBackend.when("GET", file1url).respond(file1);
      service.get(project, file1.path);

      $httpBackend.expectGET(file1url);
      $httpBackend.flush();

      // Remove the slash in the beginning should work.
      service.get(project, file1.path.substring(1));
      $httpBackend.expectGET(file1url);
      $httpBackend.flush();
    });

    it("should delete files", function() {
      $httpBackend.when("DELETE", file1url).respond({status: "okay"});
      service.delete(project, file1.path);

      $httpBackend.expectDELETE(file1url);
      $httpBackend.flush();

      // Remove the slash in the beginning should work.
      service.delete(project, file1.path.substring(1));
      $httpBackend.expectDELETE(file1url);
      $httpBackend.flush();
    });

    it("should create new files", function() {
      $httpBackend.when("POST", file1url).respond(file1);
      $httpBackend.when("POST", nested_file_url).respond(nested_file);

      var blob = testutils.createBlob("file1.txt");
      service.newFile(project, "/", blob);
      $httpBackend.expectPOST(file1url);
      $httpBackend.flush();

      blob = testutils.createBlob("file2.txt");
      service.newFile(project, "/dir1/", blob);
      $httpBackend.expectPOST(nested_file_url);
      $httpBackend.flush();
    });


    it("should create new directories", function() {
      $httpBackend.when("POST", dir1url).respond(dir1);
      $httpBackend.when("POST", nested_dir_url).respond(nested_dir);

      service.newDirectory(project, "/", "dir1");
      $httpBackend.expectPOST(dir1url);
      $httpBackend.flush();

      service.newDirectory(project, "/dir1/", "dir2");
      $httpBackend.expectPOST(nested_dir_url);
      $httpBackend.flush();

    });

    it("should update files", function() {
      $httpBackend.when("PUT", file1url).respond(file1);
      $httpBackend.when("PUT", nested_file_url).respond(file1);

      var blob = testutils.createBlob("file2.txt");
      service.updateFile(project, file1.path, blob);
      $httpBackend.expectPUT(file1url);
      $httpBackend.flush();

      var blob = testutils.createBlob("file3.txt");
      service.updateFile(project, nested_file.path, blob);
      $httpBackend.expectPUT(nested_file_url);
      $httpBackend.flush();
    });
  });
})();
