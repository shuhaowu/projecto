"use strict";
(function() {
  var projectKey = "project_key";
  var postUrl = window.API_PREFIX + "/project/" + projectKey + "/feed/";

  var postContent = "Hello Feed!";
  var postItem = {key: "postkey", content: postContent, date: 1388189244};

  describe("FeedController", function() {
    var controller, scope, $httpBackend;

    beforeEach(angular.mock.module("projecto"));
    beforeEach(angular.mock.inject(function($rootScope, $controller, _$httpBackend_) {
      $httpBackend = _$httpBackend_;

      scope = $rootScope.$new();
      scope.currentProject = {key: projectKey};
      controller = $controller("FeedController", {
        $scope: scope
      });
    }));

    it("should initialize newpost and posts", function() {
      expect(scope.newpost).toBe("");
      expect(scope.posts).toBe([]);
    });

    it("should post a new post", function() {
      $httpBackend.when("POST", postUrl).respond(postItem);
      scope.newpost = postContent;
      scope.post();

      $httpBackend.expectPOST(postUrl, {content: postContent});
      $httpBackend.flush();

      expect(scope.newpost).toBe("");
      expect(scope.posts[0].length).toBe(1);
      expect(scope.posts[0].key).toBe(postItem.key);
      expect(scope.posts[0].content).toBe(postItem.content);
      expect(scope.posts[0].date).toBe(postItem.date);
      expect(scope.posts[0].author).toBe(window.currentUser);
    });
  });


})();
