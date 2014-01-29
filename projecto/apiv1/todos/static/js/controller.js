"use strict";

(function(){

  /*
   * So the structure is designed as follows:
   *
   * TodoItemController
   *   Controls a single item for the todo item. Handles the edit mode for
   *   a single todo. Handles showing and hiding the todo.
   * TodosController
   *   Controls a bunch of a TodoItemControllers. Has pagination, filtering,
   *   and creating new todos.
   * SingleTodoController
   *   Controls a single TodoItemController. Has commenting. Otherwise does
   *   not do much.
   */

  var module = angular.module("projecto");

  var toggleTodo = function(todo, force) {
    // TODO: All of this needs to be moved into a directive.
    var bodyElement = $("#todo-" + todo.key);
    if (bodyElement.css("display") === "none") {
      if (force != "close")
        bodyElement.slideDown();
    } else {
      if (force != "open")
        bodyElement.slideUp();
    }
  };

  var extractTags = function(tagstr) {
    if ($.type(tagstr) === "array")
      return tagstr;

    var tags = tagstr.split(",");
    for (var i=0; i<tags.length; i++) {
      tags[i] = $.trim(tags[i], " ");
      if (!tags[i]) {
        tags.splice(i, 1);
        i--;
      }
    }
    return tags;
  };

  module.controller("TodoItemController", ["$scope", "$window", "$filter", "$location", "toast", "Todos", function($scope, $window, $filter, $location, toast, Todos) {
    $scope.todoDraft = null;

    $scope.toggleTodo = function(todo, event) {
      event.preventDefault();
      event.stopPropagation();
      toggleTodo(todo);
    };

    $scope.markDone = function(todo) {
      var req = todo.done();
      var error = function(data, status) {
        toast.error("Failed to mark done", status);
      };
      req.then(undefined, error);
    };

    $scope.editTodo = function(todo, i) {
      if ($scope.todoDraft) {
        $scope.cancelEdit(todo.key);
      } else {
        toggleTodo(todo, "open");
        $scope.todoDraft = new Todos.TodoItem(todo.key, todo.project, angular.copy(todo.data), todo.archived);
        $scope.todoDraft.data.due = $filter("absoluteTime")(todo.data.due);
        // For restoring in the correct order later if we are on TodosController
        $scope.todoDraft._index = i;

        // In a truly concurrent program I would be concerned. However...
        $scope.$emit("enterEdit", todo.key, i);
      }
    };

    $scope.archiveTodo = function(todo, i) {
      if ($scope.currentProject) {
        toast.info("Archiving...");
        var req = todo.archive();
        var success = function() {
          toast.close();
          $scope.$emit("archived", todo.key, i);
        };

        var error = function(data, status) {
          toast.error("Failed to archive todo", status);
        };
        req.then(success, error);
      } else {
        window.notLoaded();
      }
    };

    $scope.deleteTodo = function(todo, i) {
      if (!$window.confirm("Are you sure you want to delete this todo?"))
        return;

      if ($scope.currentProject) {
        toast.info("Deleting...");
        var req = todo.delete();
        var success = function() {
          toast.close();
          $scope.$emit("deleted", todo.key, i);
        };

        var error = function(data, status) {
          toast.error("Failed to delete todo", status);
        };
        req.then(success, error);
      } else {
        window.notLoaded();
      }
    };

    $scope.saveTodo = function(todo, event) {
      if (!$scope.todoDraft) {
        toast.wtf("$scope.todoDraft does not exist while trying to save todo? Wat.");
        return;
      }

      if ($scope.currentProject) {
        if ($scope.todoDraft.data.tags)
          $scope.todoDraft.data.tags = extractTags($scope.todoDraft.data.tags);

        toast.info("Saving...");
        var req = $scope.todoDraft.save();
        var success = function(data) {
          $scope.$emit("saved", data, $scope.todoDraft._index);
          $scope.cancelEdit($scope.todoDraft.key, true);
          toast.success("Saved");
          toggleTodo(data, "open");
        };

        var error = function(data, status) {
          toast.error("Failed to save", status);
        };
        req.then(success, error);
      } else {
        window.notLoaded();
      }
    };

    $scope.cancelEdit = function(todoKey, justDoIt) { // Nike.
      if (justDoIt || $window.confirm("Are you sure you want to cancel? You will lose all changes!")) {
        $scope.$emit("exitEdit", $scope.todoDraft.key, $scope.todoDraft._index);
        $scope.todoDraft = null;
      }
    };
  }]);

  module.controller("TodosController", ["$scope", "$window", "toast", "title", "Todos", "ProjectsService", function($scope, $window, toast, title, Todos, ProjectsService) {
    $scope.newtodo = null;
    $scope.todolist = null;
    $scope.all_expanded = false;

    // Handling of events
    var currentlyEditing = [];
    $scope.$on("enterEdit", function(e, todoKey, i) {
      if (currentlyEditing.indexOf(todoKey) === -1)
        currentlyEditing.push(todoKey);
    });

    $scope.$on("exitEdit", function(e, todoKey, i) {
      var j = currentlyEditing.indexOf(todoKey);
      if (j >= 0)
        currentlyEditing.splice(j, 1);
    });

    var removed = function(e, todoKey, i) {
      $scope.todolist.todos.splice(i, 1);
      $scope.todolist.totalTodos--;
    };

    $scope.$on("deleted", removed);
    $scope.$on("archived", removed);

    $scope.$on("saved", function(e, newTodo, i) {
      $scope.todolist.todos[i] = newTodo;
    });

    $scope.expand_todos = function() {
      for (var i=0, l=$scope.todolist.todos.length; i<l; i++) {
        toggleTodo($scope.todolist.todos[i], "open");
      }
      $scope.all_expanded = true;
    };

    $scope.collapse_todos = function() {
      for (var i=0, l=$scope.todolist.todos.length; i<l; i++) {
        toggleTodo($scope.todolist.todos[i], "close");
      }
      $scope.all_expanded = false;
    };

    $scope.new_todo = function() {
      $scope.newtodo = new Todos.TodoItem(undefined, $scope.currentProject);
      $("#todos-new-todo").slideDown();
    };

    $scope.cancel_new_todo = function(force) {
      if ($.isEmptyObject($scope.newtodo.data) || force ||
          $window.confirm("Are you sure you want to cancel?")) {
        $scope.newtodo = null;
        $("#todos-new-todo").slideUp();
      }
    };

    $scope.create_todo = function() {
      var invalid_messages = $scope.newtodo.validate(true);
      if (!invalid_messages["invalid"]) {
        if ($scope.newtodo.data.tags)
          $scope.newtodo.data.tags = extractTags($scope.newtodo.data.tags);

        var req = $scope.newtodo.save();
        var success = function(data) {
          $scope.todolist.todos.unshift($scope.newtodo);
          $scope.cancel_new_todo(true);
        };

        var error = function(data, status) {
          toast.error("Failed to post", xhr.status);
        };
        req.then(success, error);
      } else {
        // TODO: Need a better way to display these messages in the future.
        toast.warn(invalid_messages["title"]);
      }
    };

    $scope.clear_done = function(todo) {
      var req = $scope.todolist.clearDone();
      var error = function(data, status) {
        toast.error("Failed to clear done", status);
      }
      req.then(undefined, error);
    };

    $scope.update = function(initial) {
      toast.info("Updating...");
      var req = $scope.todolist.fetch(initial);

      req.then(
        function(data) {
          toast.close();
        },
        function(data, status) {
          toast.error("Failed to update todos", status);
        }
      );
    };

    $scope.toggle_filter_tag = function(tag) {
      $scope.todolist.toggleFilterTag(tag);
      $scope.update();
    };

    $scope.toggle_show_done = function() {
      $scope.todolist.showdone = !$scope.todolist.showdone;
      $scope.update();
    };

    $scope.toggle_show_notdone = function() {
      $scope.todolist.shownotdone = !$scope.todolist.shownotdone;
      $scope.update();
    };

    $scope.goto = function(page) {
      $scope.todolist.gotopage(page);
    };

    $scope.currentProject = null;
    ProjectsService.getCurrentProject().done(function(currentProject){
      if (currentProject){
        $scope.currentProject = currentProject;
        $scope.todolist = new Todos.TodoList($scope.currentProject);
        title("Todos", $scope.currentProject);
        $scope.update();
        $scope.$$phase || $scope.$apply();
      } else {
        window.notLoaded();
      }
    });
  }]);

  module.controller("SingleTodoController", ["$scope", "$route", "$location", "toast", "title", "Todos", "ProjectsService", function($scope, $route, $location, toast, title, Todos, ProjectsService) {
    $scope.currentProject = null;
    $scope.todo = null;
    $scope.hideCommentLink = true;

    var removed = function(e, todo_key) {
      $location.path("/projects/" + $scope.currentProject.key + "/todos");
      $location.replace();
    };
    $scope.$on("deleted", removed);
    $scope.$on("archived", removed);

    var refresh_comments = function() {
      $scope.comments = $scope.todo.children;
      $scope.commentsParent = $scope.todo;
    };
    $scope.$on("saved", function(e, new_todo) {
      $scope.todo = new_todo;
      refresh_comments();
    });

    $scope.update = function() {
      $scope.todo = new Todos.TodoItem($route.current.params.todoId, $scope.currentProject);
      var req = $scope.todo.refresh();
      var success = function() {
        toast.loaded();
        refresh_comments();
        toggleTodo($scope.todo);
      };
      var error = function(data, status) {
        toast.error("Failed to load todos", status);
      };

      req.then(success, error);
    };

    ProjectsService.getCurrentProject().done(function(currentProject) {
      $scope.currentProject = currentProject;
      $scope.update();
      $scope.$$phase || $scope.$apply();
    }).fail(function(xhr) {
      toast.error("Failed to get project info", xhr.status);
    });
  }]);
})();
