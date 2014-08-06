"use strict";

(function() {
  var project_key = "project_key";
  var todo_key = "todo_key";
  var project = {key: project_key};
  var author = angular.copy(window.currentUser);
  delete author.emails;
  var returned_todo_data = {
    key: todo_key,
    author: author,
    title: "Test",
    content: {
      markdown: "yay todos!",
      html: "<p>yay todos!</p>\\n"
    },
    tags: [],
    due: null,
    done: false,
    assigned: null,
    milestone: null,
    date: 1388790824.0,
    children: []
  };

  delete author.emails;
  describe("todoItem directive", function() {
    var $httpBackend, scope, compile, TodoItem;

    var directive = function(scope, hide_comment_link) {
      hide_comment_link = hide_comment_link ? true : false;
      var template = '<todo-item todo="todo" project="currentProject" hide-comment-link="'+hide_comment_link+'"></todo-item>';
      var d = compile(template)(scope);
      // $digest is necessary to finalize the directive generation
      scope.$digest();
      return d;
    };


    beforeEach(angular.mock.module("projecto"));
    beforeEach(angular.mock.inject(function($compile, $rootScope, Todos) {
      scope = $rootScope.$new();
      compile = $compile;
      TodoItem = Todos.TodoItem;
    }));

    it("should create todoItem directive", function() {
      var d = directive(scope);
      var $d = $(d);

      expect($d.find(".todos-todo-title").length).toBe(1);
      expect($d.find(".todos-todo-body").length).toBe(1);

      scope.currentProject = project;
      scope.todo = new TodoItem(todo_key, project, returned_todo_data, false);

      d = directive(scope);
      $d = $(d);

      expect($d.find(".todos-todo-title a").text()).toBe(scope.todo.data.title);
      expect($d.find(".todos-todo-body").attr("id")).toBe("todo-"+todo_key);
      expect($d.find(".todos-todo-body").css("display")).toBe("none");
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
