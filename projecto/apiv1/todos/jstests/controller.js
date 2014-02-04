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
      expect(scope.$emit).toHaveBeenCalledWith("enterEdit", todo.key);

      scope.$emit.reset();
      // should cancel the edits
      scope.editTodo(todo, 0);
      expect(scope.$emit).toHaveBeenCalledWith("exitEdit", todo.key);
      expect(scope.todoDraft).toBe(null);
    });

    it("should archive todos", function() {
      var todo = new TodoItem(todoKey, project);
      todo.data.title = "Test";
      spyOn(scope, "$emit");

      scope.archiveTodo(todo, 0);
      $httpBackend.expectDELETE(baseUrl + todoKey + "?archived=0&really=0").respond({status: "okay"});
      $httpBackend.flush();
      expect(scope.$emit).toHaveBeenCalledWith("archived", todo.key);
      expect(todo.archived).toBe(true);
    });

    it("should delete todos", function() {
      var todo = new TodoItem(todoKey, project, {title: "Test"});
      spyOn(scope, "$emit");

      scope.deleteTodo(todo, 0);
      $httpBackend.expectDELETE(baseUrl + todoKey + "?archived=0&really=1").respond({status: "okay"});
      $httpBackend.flush();
      expect(scope.$emit).toHaveBeenCalledWith("deleted", todo.key);

      scope.$emit.reset();
      todo.archived = true;
      scope.deleteTodo(todo, 0);
      $httpBackend.expectDELETE(baseUrl + todoKey + "?archived=1&really=1").respond({status: "okay"});
      $httpBackend.flush();
      expect(scope.$emit).toHaveBeenCalledWith("deleted", todo.key);
    });

    it("should save todos", function() {
      var todo = new TodoItem(todoKey, project, {title: "Test", content: "yay todos!"});
      spyOn(scope, "$emit");

      scope.editTodo(todo, 0);
      scope.saveTodo(todo);
      $httpBackend.expectPUT(baseUrl + todoKey).respond(returnedtododata);
      $httpBackend.flush();
      expect(scope.$emit).toHaveBeenCalledWith("saved", returnedtododata);
      expect(scope.$emit).toHaveBeenCalledWith("exitEdit", todo.key);
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
      expect(scope.$emit).toHaveBeenCalledWith("exitEdit", todo.key);
      expect($window.confirm).toHaveBeenCalled();

      scope.$emit.reset();
      $window.confirm.reset();

      scope.todoDraft = todo;
      scope.cancelEdit(todo.key, true);
      expect($window.confirm).not.toHaveBeenCalled();
      expect(scope.todoDraft).toBe(null);
      expect(scope.$emit).toHaveBeenCalledWith("exitEdit", todo.key);
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

    it("should remove todos on signal", function() {
      var list = [];
      for (var i=0; i<3; i++) {
        list.push(angular.copy(returnedtododata));
        list[i].key = list[i].key + i;
      }

      var key0 = list[0].key;
      var key1 = list[1].key;
      var key2 = list[2].key;
      scope.todolist.fetch();
      $httpBackend.expectGET(baseUrl + "filter?page=1&showdone=0&shownotdone=1").respond({
        todos: list,
        currentPage: 1,
        totalTodos: list.length,
        todosPerPage: 20
      });
      $httpBackend.flush();

      scope.$emit("deleted", key0);

      expect(scope.todolist.todos.length()).toBe(2);
      expect(scope.todolist.totalTodos).toBe(2);
      var list = scope.todolist.todos.listify();
      expect(list[0].key).toBe(key1);
      expect(list[1].key).toBe(key2);

      scope.$emit("archived", key1, 0);
      expect(scope.todolist.todos.length()).toBe(1);
      expect(scope.todolist.totalTodos).toBe(1);

      var list = scope.todolist.todos.listify();
      expect(list[0].key).toBe(key2);
    });

    it("should update todo on save signal", function() {
      var list = [];
      for (var i=0; i<3; i++) {
        list.push(angular.copy(returnedtododata));
        list[i].key = list[i].key + i;
      }

      scope.todolist.fetch();
      $httpBackend.expectGET(baseUrl + "filter?page=1&showdone=0&shownotdone=1").respond({
        todos: list,
        currentPage: 1,
        totalTodos: list.length,
        todosPerPage: 20
      });
      $httpBackend.flush();

      var todo1 = angular.copy(returnedtododata);
      todo1.key = todoKey + 1;
      todo1.title = "Modified title!";

      scope.$emit("saved", todo1);
      expect(scope.todolist.todos.get(todoKey + 1).data.title).toBe("Modified title!");
      expect(scope.todolist.todos.length()).toBe(3);

      var list = scope.todolist.todos.listify();
      expect(list.length).toBe(3);
      expect(list[1].key).toBe(todoKey + 1);
      expect(list[1].value.data.title).toBe("Modified title!");
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
      $httpBackend.flush();

      expect(scope.todolist.todos.length()).toBe(1);
      expect(scope.todolist.todos.get(newtodo.key)).toBe(newtodo);
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

      scope.todolist.fetch();
      $httpBackend.expectGET(baseUrl + "filter?page=1&showdone=0&shownotdone=1").respond({
        todos: list,
        currentPage: 1,
        totalTodos: 10,
        todosPerPage: 20
      });
      $httpBackend.flush();

      scope.clear_done();
      $httpBackend.expectDELETE(baseUrl + "done").respond({status: "okay"});
      $httpBackend.flush();

      expect(scope.todolist.todos.length()).toBe(6);
    });

    it("should update", function() {
      scope.todolist = new TodoList(project);
      spyOn(scope.todolist, "fetch").andCallThrough();
      scope.update(true);

      expect(scope.todolist.fetch).toHaveBeenCalledWith(true);

      $httpBackend.expectGET(baseUrl + "tags?archived=0").respond({
        tags: ["tag1", "tag2"]
      });

      var list = [];
      for (var i=0; i<10; i++) {
        list.push(angular.copy(returnedtododata));
        list[i].tags = ["tag1"];
        if (i % 3 == 0)
          list[i].tags = ["tag2"];

        list[i].key = list[i].key + i;
      }

      $httpBackend.expectGET(baseUrl + "filter?page=1&showdone=0&shownotdone=1&tags=tag1&tags=tag2").respond({
        todos: list,
        currentPage: 1,
        totalTodos: list.length,
        todosPerPage: 20
      });
      $httpBackend.flush();

      expect(scope.todolist.todos.length()).toBe(list.length);
    });

    it("should toggle filter tags", function() {
      scope.todolist = new TodoList(project);
      scope.todolist.fetch(true);

      $httpBackend.expectGET(baseUrl + "tags?archived=0").respond({
        tags: ["tag1", "tag2"]
      });
      $httpBackend.expectGET(baseUrl + "filter?page=1&showdone=0&shownotdone=1&tags=tag1&tags=tag2").respond({
        todos: [],
        currentPage: 1,
        totalTodos: 0,
        todosPerPage: 20
      });
      $httpBackend.flush();

      expect(scope.todolist.isTagFiltered("tag1")).toBe(true);
      expect(scope.todolist.isTagFiltered("tag2")).toBe(true);

      spyOn(scope, "update");

      scope.toggle_filter_tag("tag1");
      expect(scope.todolist.isTagFiltered("tag1")).toBe(false);
      expect(scope.todolist.isTagFiltered("tag2")).toBe(true);
      expect(scope.update).toHaveBeenCalled();

      scope.update.reset();
      scope.toggle_filter_tag("tag1");
      expect(scope.todolist.isTagFiltered("tag1")).toBe(true);
      expect(scope.todolist.isTagFiltered("tag2")).toBe(true);
      expect(scope.update).toHaveBeenCalled();

      scope.update.reset();
      scope.toggle_filter_tag("tag2");
      expect(scope.todolist.isTagFiltered("tag1")).toBe(true);
      expect(scope.todolist.isTagFiltered("tag2")).toBe(false);
      expect(scope.update).toHaveBeenCalled();

      scope.update.reset();
      scope.toggle_filter_tag("tag2");
      expect(scope.todolist.isTagFiltered("tag1")).toBe(true);
      expect(scope.todolist.isTagFiltered("tag2")).toBe(true);
      expect(scope.update).toHaveBeenCalled();
    });

    it("should toggle show done and show not done", function() {
      scope.todolist = new TodoList(project);
      scope.todolist.fetch(true);

      $httpBackend.expectGET(baseUrl + "tags?archived=0").respond({
        tags: ["tag1", "tag2"]
      });
      $httpBackend.expectGET(baseUrl + "filter?page=1&showdone=0&shownotdone=1&tags=tag1&tags=tag2").respond({
        todos: [],
        currentPage: 1,
        totalTodos: 0,
        todosPerPage: 20
      });
      $httpBackend.flush();

      expect(scope.todolist.showdone).toBe(false);
      expect(scope.todolist.shownotdone).toBe(true);

      spyOn(scope, "update");
      scope.toggle_show_done();
      expect(scope.todolist.showdone).toBe(true);
      expect(scope.update).toHaveBeenCalled();

      scope.update.reset();
      scope.toggle_show_done();
      expect(scope.todolist.showdone).toBe(false);
      expect(scope.update).toHaveBeenCalled();

      scope.update.reset();
      scope.toggle_show_notdone();
      expect(scope.todolist.shownotdone).toBe(false);
      expect(scope.update).toHaveBeenCalled();

      scope.update.reset();
      scope.toggle_show_notdone();
      expect(scope.todolist.shownotdone).toBe(true);
      expect(scope.update).toHaveBeenCalled();
    });
  });

  describe("SingleTodoController", function() {
    var $httpBackend, scope, controller, newcontroller, TodoItem;

    var $route = {
      current: {
        params: {
          todoId: todoKey
        }
      }
    };

    var tododiv = $("<div></div>");
    tododiv.attr("id", "todo-" + todoKey);
    $("body").append(tododiv);

    beforeEach(angular.mock.module("projecto"));
    beforeEach(angular.mock.inject(function($rootScope, $controller, _$httpBackend_, Todos) {
      $httpBackend = _$httpBackend_;
      TodoItem = Todos.TodoItem;
      newcontroller = $controller;

      scope = $rootScope.$new();
      controller = $controller("SingleTodoController", {
        $scope: scope,
        ProjectsService: commonMocked.ProjectsService,
        $route: $route
      });
      scope.currentProject = project;

      tododiv.css("display", "none");
    }));

    it("should subscribe to save signal", function() {
      spyOn(scope, "$on");

      newcontroller("SingleTodoController", {
        $scope: scope,
        ProjectsService: commonMocked.ProjectsService,
        $route: $route
      });

      expect(scope.$on).toHaveBeenCalledWith("saved", jasmine.any(Function));
    });

    it("should respond to save event by refreshing comments", function() {
      var newtodo = angular.copy(returnedtododata);

      // Not a valid children... but
      newtodo.children = [{title: null, content: "Test Content", author: {name: "Yay"}}];
      scope.$emit("saved", newtodo);

      expect(scope.comments).toBe(newtodo.children);
      expect(scope.commentsParent.key).toBe(newtodo.key);
      expect(scope.commentsParent).toBe(scope.todo);
      expect(scope.commentsParent.data).toBe(newtodo);
    });

    it("should update and initialize", function() {
      scope.update();
      $httpBackend.expectGET(baseUrl + todoKey + "?archived=0").respond(returnedtododata);
      $httpBackend.flush();

      expect(scope.todo.key).toBe(todoKey);
      expect(scope.todo.data).toBe(returnedtododata);
    });
  });
})();
