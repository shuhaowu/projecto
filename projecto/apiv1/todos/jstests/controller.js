"use strict";

(function() {
  var projectKey = "projectkey";
  var todoKey = "todokey";
  var project = {key: projectKey};
  var author = angular.copy(window.currentUser);
  delete author.emails;
  var returnedtododata = {
    key: todoKey,
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


  var baseUrl = window.API_PREFIX + "/projects/" + projectKey + "/todos/";

  // Turn off jquery effects, which means animations returns instantly
  jQuery.fx.off = true;

  describe("TodoItemController", function() {
    var $httpBackend, controller, scope, TodoItem, TodoList, tododiv, $window;
    tododiv = $("<div></div>");
    tododiv.attr("id", "todo-" + todoKey);
    $("body").append(tododiv);

    $window = angular.copy(commonMocked.$window);

    beforeEach(angular.mock.module("projecto"));
    beforeEach(angular.mock.inject(function($rootScope, $controller, _$httpBackend_, Todos) {
      TodoItem = Todos.TodoItem;
      TodoList = Todos.TodoList;
      $httpBackend = _$httpBackend_;

      scope = $rootScope.$new();
      controller = $controller("TodoItemController", {
        $scope: scope,
        ProjectsService: commonMocked.ProjectsService,
        $window: $window
      });
      scope.currentProject = project;

      tododiv.css("display", "block");
    }));

    // As a working note. Right now a lot of infrastructure still depends on
    // jQuery. So therefore there will be a lot of hacks to hack around jquery
    // bits.

    it("should toggle todo", function() {
      var event = {
        preventDefault: function() { },
        stopPropagation: function() { }
      };

      var todo = new TodoItem(todoKey, project);
      scope.toggleTodo(todo, event);
      expect(tododiv.css("display")).toBe("none");

      scope.toggleTodo(todo, event);
      expect(tododiv.css("display")).toBe("block");
    });

    it("should mark todos as done", function() {
      var todo = new TodoItem(todoKey, project);

      scope.markDone(todo);
      $httpBackend.expectPOST(baseUrl + todoKey + "/markdone?archived=0", {done: true}).respond({status: "okay"});
      $httpBackend.flush();
      expect(todo.data.done).toBe(true);

      scope.markDone(todo);
      $httpBackend.expectPOST(baseUrl + todoKey + "/markdone?archived=0", {done: false}).respond({status: "okay"});
      $httpBackend.flush();
      expect(todo.data.done).toBe(false);
    });

    it("should start edit todos", function() {
      var todo = new TodoItem(todoKey, project);
      todo.data.title = "Test";
      spyOn(scope, "$emit");
      tododiv.css("display", "none");

      scope.editTodo(todo, 0);
      expect(tododiv.css("display")).toBe("block");
      expect(scope.todoDraft.data.title).toBe("Test");
      expect(scope.todoDraft._index).toBe(0);
      expect(scope.$emit).toHaveBeenCalledWith("enterEdit", todo.key, 0);

      scope.$emit.reset();
      // should cancel the edits
      scope.editTodo(todo, 0);
      expect(scope.$emit).toHaveBeenCalledWith("exitEdit", todo.key, 0);
      expect(scope.todoDraft).toBe(null);
    });

    it("should archive todos", function() {
      var todo = new TodoItem(todoKey, project);
      todo.data.title = "Test";
      spyOn(scope, "$emit");

      scope.archiveTodo(todo, 0);
      $httpBackend.expectDELETE(baseUrl + todoKey + "?archived=0&really=0").respond({status: "okay"});
      $httpBackend.flush();
      expect(scope.$emit).toHaveBeenCalledWith("archived", todo.key, 0);
      expect(todo.archived).toBe(true);
    });

    it("should delete todos", function() {
      var todo = new TodoItem(todoKey, project, {title: "Test"});
      spyOn(scope, "$emit");

      scope.deleteTodo(todo, 0);
      $httpBackend.expectDELETE(baseUrl + todoKey + "?archived=0&really=1").respond({status: "okay"});
      $httpBackend.flush();
      expect(scope.$emit).toHaveBeenCalledWith("deleted", todo.key, 0);

      scope.$emit.reset();
      todo.archived = true;
      scope.deleteTodo(todo, 0);
      $httpBackend.expectDELETE(baseUrl + todoKey + "?archived=1&really=1").respond({status: "okay"});
      $httpBackend.flush();
      expect(scope.$emit).toHaveBeenCalledWith("deleted", todo.key, 0);
    });

    it("should save todos", function() {
      var todo = new TodoItem(todoKey, project, {title: "Test", content: "yay todos!"});
      spyOn(scope, "$emit");

      scope.editTodo(todo, 0);
      scope.saveTodo(todo);
      $httpBackend.expectPUT(baseUrl + todoKey).respond(returnedtododata);
      $httpBackend.flush();
      expect(scope.$emit).toHaveBeenCalledWith("saved", returnedtododata, 0);
      expect(scope.$emit).toHaveBeenCalledWith("exitEdit", todo.key, 0);
      expect(scope.todoDraft).toBe(null);
    });

    it("should cancel edits", function() {
      var todo = new TodoItem(todoKey, project, {title: "Test", content: "yay todos!"});
      todo._index = 0;

      spyOn(scope, "$emit");
      spyOn($window, "confirm").andCallThrough();

      scope.todoDraft = todo;
      scope.cancelEdit(todo.key);
      expect(scope.todoDraft).toBe(null);
      expect(scope.$emit).toHaveBeenCalledWith("exitEdit", todo.key, 0);
      expect($window.confirm).toHaveBeenCalled();

      scope.$emit.reset();
      $window.confirm.reset();

      scope.todoDraft = todo;
      scope.cancelEdit(todo.key, true);
      expect($window.confirm).not.toHaveBeenCalled();
      expect(scope.todoDraft).toBe(null);
      expect(scope.$emit).toHaveBeenCalledWith("exitEdit", todo.key, 0);
    });

  });

  describe("TodosController", function() {
    var $httpBackend, controller, scope, TodoItem, TodoList, $window, rootScope, newcontroller, new_todo_box;

    beforeEach(angular.mock.module("projecto"));
    beforeEach(angular.mock.inject(function($rootScope, $controller, _$httpBackend_, Todos) {
      TodoItem = Todos.TodoItem;
      TodoList = Todos.TodoList;
      $httpBackend = _$httpBackend_;
      rootScope = $rootScope;
      newcontroller = $controller;

      scope = $rootScope.$new();
      controller = $controller("TodosController", {
        $scope: scope,
        $window: commonMocked.$window,
        ProjectsService: commonMocked.ProjectsService
      });
      scope.currentProject = project;
      scope.todolist = new TodoList(project);

      new_todo_box = $("<div id='todos-new-todo'></div>");
      new_todo_box.css("display", "none");
      $("body").append(new_todo_box);
    }));

    afterEach(function() {
      new_todo_box.remove();
      new_todo_box = null;
    });


    it("should subscribe to signals", function() {
      var scope = rootScope.$new();
      spyOn(scope, "$on");

      var controller = newcontroller("TodosController", {
        $scope: scope,
        $window: commonMocked.$window,
        ProjectsService: commonMocked.ProjectsService
      });

      expect(scope.$on).toHaveBeenCalledWith("saved", jasmine.any(Function));
      expect(scope.$on).toHaveBeenCalledWith("archived", jasmine.any(Function));
      expect(scope.$on).toHaveBeenCalledWith("deleted", jasmine.any(Function));
      expect(scope.$on).toHaveBeenCalledWith("enterEdit", jasmine.any(Function));
      expect(scope.$on).toHaveBeenCalledWith("exitEdit", jasmine.any(Function));
    });

    it("should expand and close new todo box", function() {
      scope.new_todo();
      expect(new_todo_box.css("display")).toBe("block");
      expect(scope.newtodo).not.toBe(null);
      expect(scope.newtodo instanceof TodoItem).toBe(true);
      expect(scope.newtodo.project).toBe(project);

      scope.cancel_new_todo();
      expect(new_todo_box.css("display")).toBe("none");
      expect(scope.newtodo).toBe(null);
    });

    it("should create a todo", function() {
      scope.new_todo();
      scope.newtodo.title = "Test";
      scope.newtodo.content = "yay todos!";
      spyOn(scope.newtodo, "save").andCallThrough();

      scope.create_todo();
      expect(scope.newtodo.save).toHaveBeenCalled();

      var newtodo = scope.newtodo;
      $httpBackend.expectPOST(baseUrl).respond(returnedtododata);
      // BUG: This seems to be workaround of a framework bug?
      $httpBackend.expectGET("/static/projects/partials/homepage.html").respond({});
      $httpBackend.flush();

      expect(scope.todolist.todos.length).toBe(1);
      expect(scope.todolist.todos[0]).toBe(newtodo);
      expect(scope.newtodo).toEqual(null);
    });

    it("should clear done", function() {
      scope.todolist = new TodoList(project);

      var list = [];
      for (var i=0; i<10; i++) {
        list.push(angular.copy(returnedtododata));
        list[i].key = list[i].key + i;
        if (i % 3 === 0) {
          list[i].done = true;
        }
      }

      $httpBackend.expectGET(baseUrl + "filter?page=1&showdone=0&shownotdone=1").respond({
        todos: list,
        currentPage: 1,
        totalTodos: 10,
        todosPerPage: 20
      });
      $httpBackend.flush();

    });

    it("should update", function() {

    });

    it("should toggle filter tags", function() {

    });

    it("should toggle show done", function() {

    });
  });
})();
