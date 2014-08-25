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
    var $httpBackend, scope, compile, TodoItem, d, $d;

    var container = $("<div></div>");
    container.attr("id", "test-container");
    $("body").append(container);

    var directive = function(scope, hide_comment_link) {
      hide_comment_link = hide_comment_link ? true : false;
      var template = '<todo-item todo="todo" project="currentProject" hide-comment-link="'+hide_comment_link+'"></todo-item>';
      var d = compile(template)(scope);
      // $digest is necessary to finalize the directive generation
      scope.$digest();

      container.append(d);
      return d;
    };

    beforeEach(angular.mock.module("projecto"));
    beforeEach(angular.mock.inject(function($compile, $rootScope, Todos) {
      scope = $rootScope.$new();
      compile = $compile;
      TodoItem = Todos.TodoItem;

      scope.currentProject = project;
      scope.todo = new TodoItem(todo_key, project, returned_todo_data, false);
      d = directive(scope);
      $d = $(d);
    }));

    afterEach(function() {
      container.empty();
    });

    it("should create todoItem directive", function() {
      expect($d.find(".todos-todo-title").length).toBe(1);
      expect($d.find(".todos-todo-body").length).toBe(1);
      expect($d.find(".todos-todo-title a").text()).toBe(scope.todo.data.title);
      expect($d.find(".todos-todo-body").attr("id")).toBe("todo-"+todo_key);
      expect($d.find(".todos-todo-body").css("display")).toBe("none");
    });

    it("should display the correct controls and comment link", function() {
      var comment_link = $d.find(".todos-todo-comment-link");
      expect(comment_link.css("display")).not.toBe("none");
      expect($.trim(comment_link.text())).toBe("Comment");

      var controls = $d.find(".todos-todo-controls");
      expect(controls.css("display")).not.toBe("none");
      expect(controls.find("[title='Edit']").css("display")).not.toBe("none");
      expect(controls.find("[title='Archive']").css("display")).not.toBe("none");
      expect(controls.find("[title='Delete']").css("display")).toBe("none");

      // not owner and not author and 1 comment
      scope.currentProject.owner = false;
      scope.todo.data.author.key = "not_a_real_key";
      scope.todo.data.children = [{key: "key", content: "Hello Comment", date: 1388189244}];
      $d = $(directive(scope));

      comment_link = $d.find(".todos-todo-comment-link");
      expect(comment_link.css("display")).not.toBe("none");
      expect($.trim(comment_link.text())).toBe("1 comment");

      controls = $d.find(".todos-todo-controls");
      expect(controls.css("display")).toBe("none");

      // owner and archived
      scope.currentProject.owner = true;
      scope.todo.archived = true;
      $d = $(directive(scope));

      controls = $d.find(".todos-todo-controls");
      expect(controls.css("display")).not.toBe("none");
      expect(controls.find("[title='Edit']").css("display")).toBe("none");
      expect(controls.find("[title='Archive']").css("display")).toBe("none");
      expect(controls.find("[title='Delete']").css("display")).not.toBe("none");
    });


    it("should toggle todoItem", function() {
      var isolated_scope = d.isolateScope();
      spyOn(isolated_scope, "toggle").andCallThrough();

      var link = $d.find(".todos-todo-title a");
      expect(link.length).toBe(1);
      var body = $d.find(".todos-todo-body");

      link.click();
      expect(isolated_scope.toggle.callCount).toBe(1);
      expect(body.css("display")).toBe("block");

      link.click();
      expect(isolated_scope.toggle.callCount).toBe(2);
      expect(body.css("display")).toBe("none");

      isolated_scope.toggle(null, "close");
      expect(body.css("display")).toBe("none");

      isolated_scope.toggle(null, "open");
      expect(body.css("display")).toBe("block");

      isolated_scope.toggle(null, "open");
      expect(body.css("display")).toBe("block");
    });

    it("should enter edit", function() {
      var isolated_scope = d.isolateScope();
      spyOn(isolated_scope, "edit").andCallThrough();

      var edit_link = $d.find("[title='Edit']");
      expect(edit_link.length).toBe(1);

      edit_link.click();
      expect(isolated_scope.edit).toHaveBeenCalled();

      var body = $d.find(".todos-todo-body");
      var body_edit = $d.find(".todos-todo-body-edit");
      expect(body.css("display")).toBe("block");
      expect(body_edit.css("display")).toBe("block");

      expect(isolated_scope.draft).toEqual(isolated_scope.todo);
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
