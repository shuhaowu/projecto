"use strict";

(function() {
  describe("todoItem directive", function() {
    var $httpBackend, scope, compile;

    var directive = function(scope, hide_comment_link) {
      hide_comment_link = hide_comment_link ? true : false;
      var template = '<todo-item todo="todo" project="currentProject" hide-comment-link="'+hide_comment_link+'"></todo-item>';
      var d = compile(template)(scope);
      // $digest is necessary to finalize the directive generation
      scope.$digest();
      return d;
    };


    beforeEach(angular.mock.module("projecto"));
    beforeEach(angular.mock.inject(function($compile, $rootScope) {
      scope = $rootScope.$new();
      compile = $compile;
    }));

    it("should create todoItem directive", function() {
      var d = directive(scope);
    });

    it("should toggle todoItem", function() {

    });

    it("should enter edit", function() {

    });

    it("should cancel edit", function() {

    });

    it("should save todo", function() {

    });

    it("should archive todo", function() {

    });

    it("should delete todo", function() {

    });

    it("should mark todo as done", function() {

    });

  });
})();
