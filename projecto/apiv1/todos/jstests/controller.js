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
        ProjectService: commonMocked.ProjectService,
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
    var $httpBackend, controller, scope, TodoItem, TodoList, $window, rootScope, newcontroller;

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
        ProjectService: commonMocked.ProjectService
      });
      scope.currentProject = project;

      this.addMatchers({
        toHaveBeenCalledPartiallyWith: function() {
          var spy = this.actual;
          var args;
          var foundArgs = false;

          for (var i=0; i<spy.argsForCall.length; i++) {
            var thisIsIt = true;
            args = spy.argsForCall[i];
            for (var j=0; j<args.length; j++) {
              if (args[j] === arguments[j] || arguments[j] === undefined) {
                continue;
              } else {
                thisIsIt = false;
                break;
              }
            }

            if (thisIsIt) {
              foundArgs = true;
              break;
            }
          }

          return foundArgs;
        }
      });
    }));

    it("should subscribe to signals", function() {
      var scope = rootScope.$new();
      spyOn(scope, "$on");

      var controller = newcontroller("TodosController", {
        $scope: scope,
        $window: commonMocked.$window,
        ProjectService: commonMocked.ProjectService
      });

      expect(scope.$on).toHaveBeenCalledPartiallyWith("saved");
      expect(scope.$on).toHaveBeenCalledPartiallyWith("archived");
      expect(scope.$on).toHaveBeenCalledPartiallyWith("deleted");
      expect(scope.$on).toHaveBeenCalledPartiallyWith("enterEdit");
      expect(scope.$on).toHaveBeenCalledPartiallyWith("exitEdit");
    });

  });
})();
