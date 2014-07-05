"use strict";
(function() {
  var projectKey = "project_key";
  var postKey = "postkey";
  var postUrl = window.API_PREFIX + "/projects/" + projectKey + "/feed/";
  var getUrl = postUrl;
  var deleteUrl = getUrl + postKey;
  var getSpecificUrl = deleteUrl;

  var postContent = "Hello Feed!";
  var postItem = {key: postKey, content: postContent, date: 1388189244};
  var specificPostItem = angular.copy(postItem);
  specificPostItem.author = angular.copy(window.currentUser);
  delete specificPostItem.author.emails;
  specificPostItem.children = [{title: "Test", content: "Comment", date: 1388189244.0}];

  describe("FeedController", function() {
    var controller, scope, $httpBackend;

    beforeEach(angular.mock.module("projecto"));
    beforeEach(angular.mock.inject(function($rootScope, $controller, _$httpBackend_) {
      $httpBackend = _$httpBackend_;

      scope = $rootScope.$new();
      controller = $controller("FeedController", {
        $scope: scope,
        ProjectsService: commonMocked.ProjectsService
      });
      scope.currentProject = {key: projectKey};
    }));

    it("should initialize newpost and posts", function() {
      expect(scope.newpost).toBe("");
      expect(scope.posts.length).toBe(0);
    });

    it("should post a new post", function() {
      $httpBackend.when("POST", postUrl).respond(postItem);
      scope.newpost = postContent;
      scope.post();

      $httpBackend.expectPOST(postUrl, {content: postContent});
      $httpBackend.flush();

      expect(scope.newpost).toBe("");
      expect(scope.posts.length).toBe(1);
      expect(scope.posts[0].key).toBe(postItem.key);
      expect(scope.posts[0].content).toBe(postItem.content);
      expect(scope.posts[0].date).toBe(postItem.date);
      expect(scope.posts[0].author).toBe(window.currentUser);
    });

    it("should list all feed items", function() {
      $httpBackend.when("GET", getUrl).respond({feed: [postItem]});
      scope.update();

      $httpBackend.expectGET(getUrl);
      $httpBackend.flush();

      expect(scope.posts.length).toBe(1);
      expect(scope.posts[0].key).toBe(postItem.key);
      expect(scope.posts[0].content).toBe(postItem.content);
      expect(scope.posts[0].date).toBe(postItem.date);
    });
  });

  describe("FeedItemController", function() {
    var controller, scope, $httpBackend, $location;

    beforeEach(angular.mock.module("projecto"));
    beforeEach(angular.mock.inject(function($rootScope, $controller, _$httpBackend_) {
      $httpBackend = _$httpBackend_;

      $location = {};
      scope = $rootScope.$new();
      controller = $controller("FeedItemController", {
        $scope: scope,
        $window: commonMocked.$window,
        $location: $location,
        ProjectsService: commonMocked.ProjectsService
      });

      scope.currentProject = {key: projectKey};
    }));

    it("should delete feed item in context of a feed", function() {
      scope.posts = [postItem];
      $httpBackend.when("DELETE", deleteUrl).respond({status: "okay"});
      scope.deletePost(postItem);

      $httpBackend.expectDELETE(deleteUrl);
      $httpBackend.flush();

      expect(scope.posts.length).toBe(0);
    });

    it("should delete feed item in context of single view", function() {
      $location.path = jasmine.createSpy();
      $location.replace = jasmine.createSpy();
      delete scope.posts;

      $httpBackend.expectDELETE(deleteUrl).respond({status: "okay"});
      scope.deletePost(postItem);

      $httpBackend.flush();
      expect($location.path).toHaveBeenCalledWith("/projects/" + projectKey + "/feed");
      expect($location.replace).toHaveBeenCalled();
    });
  });

  describe("SingleFeedController", function() {
    var controller, scope, $httpBackend;

    beforeEach(angular.mock.module("projecto"));
    beforeEach(angular.mock.inject(function($rootScope, $controller, _$httpBackend_) {
      $httpBackend = _$httpBackend_;

      scope = $rootScope.$new();
      controller = $controller("SingleFeedController", {
        $scope: scope,
        ProjectsService: commonMocked.ProjectsService,
        $route: {current: {params: {feedId: postKey}}}
      });
      scope.currentProject = {key: projectKey};
    }));

    it("should initialize the scope", function() {
      expect(scope.hideCommentLink).toBe(true);
    });

    it("should get that feed item", function() {
      $httpBackend.when("GET", getSpecificUrl).respond(specificPostItem);
      scope.update();

      $httpBackend.expectGET(getSpecificUrl);
      $httpBackend.flush();

      expect(scope.post).toEqual(specificPostItem);
      expect(scope.commentsParent).toBe(scope.post);
      expect(scope.comments).toEqual(specificPostItem.children);
    });
  });
})();
