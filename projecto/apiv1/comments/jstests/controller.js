"use strict";
(function() {
  var projectKey = "project_key";
  var parentKey = "parent_key";
  var commentKey = "comment_key";
  var deleteUrl = window.API_PREFIX + "/projects/" + projectKey + "/comments/" + parentKey + "/" + commentKey;
  var postUrl = window.API_PREFIX + "/projects/" + projectKey + "/comments/" + parentKey + "/";

  var commentText = "Hello Comment!";
  var commentTime = 1388189244;
  var commentItem = {date: commentTime, content: commentText, key: commentKey};

  describe("CommentController", function() {
    var controller, scope, $httpBackend;

    beforeEach(angular.mock.module("projecto"));
    beforeEach(angular.mock.inject(function($rootScope, $controller, _$httpBackend_) {
      $httpBackend = _$httpBackend_;
      $httpBackend.when("DELETE", deleteUrl).respond({status: "okay"});

      scope = $rootScope.$new();
      scope.currentProject = {key: projectKey};
      scope.commentsParent = {key: parentKey};
      scope.comments = [commentItem];
      controller = $controller("CommentController",
                               {$scope: scope, $window: commonMocked.$window});
    }));

    it("should delete a comment", function() {
      scope.delete(0);
      $httpBackend.expectDELETE(deleteUrl);
      $httpBackend.flush();

      expect(scope.comments.length).toBe(0);
    });
  });

  describe("NewCommentController", function() {
    var controller, scope, $httpBackend;

    beforeEach(angular.mock.module("projecto"));
    beforeEach(angular.mock.inject(function($rootScope, $controller, _$httpBackend_) {
      $httpBackend = _$httpBackend_;
      $httpBackend.when("POST", postUrl).respond(commentItem);

      scope = $rootScope.$new();
      scope.currentProject = {key: projectKey};
      scope.commentsParent = {key: parentKey};
      scope.comments = [];
      controller = $controller("NewCommentController", {$scope: scope});
    }));

    it("should initialize the new comment text", function() {
      expect(scope.commentText).toBe("");
    });

    it("should create a new comment", function() {
      scope.commentText = commentText;
      scope.newComment();

      $httpBackend.expectPOST(postUrl, {content: commentText});
      $httpBackend.flush();

      expect(scope.comments.length).toBe(1);
    });
  });
})();
