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

  var toggleTodo = function(todo, force, noanimation) {
    // TODO: All of this needs to be moved into a directive.
    var bodyElement = $("#todo-" + todo.key);
    if (bodyElement.css("display") === "none") {
      if (force != "close") {
        if (noanimation)
          bodyElement.show();
        else
          bodyElement.slideDown();
      }
    } else {
      if (force != "open") {
        if (noanimation)
          bodyElement.hide();
        else
          bodyElement.slideUp();
      }
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

  module.controller("TodoItemController", ["$scope", "$window", "$timeout", "$filter", "$location", "toast", "Todos", function($scope, $window, $timeout, $filter, $location, toast, Todos) {
    $scope.todoDraft = null;
    $scope.displayed = false;
    $scope.is_archived = ($location.path().indexOf("archived_todos") !== -1)

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

    $scope.editTodo = function(todo, noanimation) {
      if ($scope.todoDraft) {
        $scope.cancelEdit(todo.key);
      } else {
        toggleTodo(todo, "open", noanimation);
        $scope.todoDraft = new Todos.TodoItem(todo.key, todo.project, angular.copy(todo.data), todo.archived);
        if (todo.data.due)
          $scope.todoDraft.data.due = $filter("absoluteTime")(todo.data.due);
        $scope.$emit("enterEdit", todo.key, $scope.todoDraft);
      }
    };

    $scope.archiveTodo = function(todo) {
      if ($scope.currentProject) {
        toast.info("Archiving...");
        var req = todo.archive();
        var success = function() {
          toast.close();
          $scope.$emit("archived", todo.key);
        };

        var error = function(data, status) {
          toast.error("Failed to archive todo", status);
        };
        req.then(success, error);
      } else {
        window.notLoaded();
      }
    };

    $scope.deleteTodo = function(todo) {
      if (!$window.confirm("Are you sure you want to delete this todo?"))
        return;

      if ($scope.currentProject) {
        toast.info("Deleting...");
        var req = todo.delete();
        var success = function() {
          toast.close();
          $scope.$emit("deleted", todo.key);
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
          $scope.$emit("saved", data);
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
        $scope.$emit("exitEdit", $scope.todoDraft.key);
        $scope.todoDraft = null;
      }
    };

    // restores the todos that's currently being edited.
    $timeout(function() {
      if ($scope.currently_editing && $scope.currently_editing.indexOf($scope.todo.key) > -1) {
        $scope.editTodo($scope.current_draft_objects[$scope.todo.key], true);
      }
    }, 0);
  }]);

  module.controller("TodosController", ["$scope", "$location", "$window", "toast", "title", "Todos", "ProjectsService", function($scope, $location, $window, toast, title, Todos, ProjectsService) {
    $scope.newtodo = null;
    $scope.todolist = null;
    $scope.todolist_for_template = null;
    $scope.all_expanded = false;
    $scope.is_archived = ($location.path().indexOf("archived_todos") !== -1)

    var regenerate_list_for_template = function() {
      $scope.todolist_for_template = $scope.todolist.todos.values();
    };

    $scope.currently_editing = [];
    // This stores a reference to the object for restoration of the draft
    // when we do some sort of operations on page.
    $scope.current_draft_objects = {};
    $scope.$on("enterEdit", function(e, todo_key, todo_draft) {
      if ($scope.currently_editing.indexOf(todo_key) === -1) {
        $scope.currently_editing.push(todo_key);
        $scope.current_draft_objects[todo_key] = todo_draft;
      }
    });

    var remove_from_currently_editing = function(todo_key) {
      var j = $scope.currently_editing.indexOf(todo_key);
      if (j > -1) {
        $scope.currently_editing.splice(j, 1);
        delete $scope.current_draft_objects[todo_key];
      }
    };

    $scope.$on("exitEdit", function(e, todo_key) {
      remove_from_currently_editing(todo_key);
    });

    var removed = function(e, todo_key) {
      $scope.todolist.todos.remove(todo_key);
      regenerate_list_for_template();
      $scope.todolist.totalTodos--;
      remove_from_currently_editing(todo_key);
    };

    $scope.$on("deleted", removed);
    $scope.$on("archived", removed);

    var add_to_tags_on_save = function(tags) {
      // WARNING: O(n^2) algorithm at least!
      // TODO: sort it, and then insert. O(nlogn) instead. Or when the list
      // is created it could be maintained in order O(nlogn) creation with
      // O(logn) insertion here.
      if (!tags)
        return;

      for (var i=0; i<tags.length; i++) {
        if ($scope.todolist.tags.indexOf(tags[i]) === -1) {
          // This line may push it to O(n^3)
          $scope.todolist.tags.unshift(tags[i]);
          $scope.todolist.toggleFilterTag(tags[i]);
        }
      }
    };

    $scope.$on("saved", function(e, newTodo) {
      var archived = false;
      if (newTodo.archived) {
        archived = newTodo.archived;
        delete newTodo.archived;
      }

      $scope.todolist.todos.put(newTodo.key, new Todos.TodoItem(newTodo.key, $scope.currentProject, newTodo, archived));
      regenerate_list_for_template();
      remove_from_currently_editing(newTodo.key);

      add_to_tags_on_save(newTodo.tags);
    });

    $scope.expand_todos = function() {
      regenerate_list_for_template();
      var list = $scope.todolist_for_template;
      for (var i=0, l=list.length; i<l; i++) {
        toggleTodo(list[i], "open");
      }
      $scope.all_expanded = true;
    };

    $scope.collapse_todos = function() {
      regenerate_list_for_template();
      var list = $scope.todolist_for_template;
      for (var i=0, l=list.length; i<l; i++) {
        toggleTodo(list[i], "close");
      }
      $scope.all_expanded = false;
    };

    $scope.new_todo = function() {
      $scope.newtodo = new Todos.TodoItem(undefined, $scope.currentProject, undefined, $scope.is_archived);
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
          $scope.todolist.todos.prepend($scope.newtodo.key, $scope.newtodo);
          regenerate_list_for_template();
          add_to_tags_on_save($scope.newtodo.data.tags);
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
      var success = function() {
        regenerate_list_for_template();
      };
      var error = function(data, status) {
        toast.error("Failed to clear done", status);
      }
      req.then(success, error);
    };

    $scope.update = function(initial) {
      toast.info("Updating...");
      var req = $scope.todolist.fetch(initial);

      req.then(
        function(data) {
          regenerate_list_for_template();
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
      var req = $scope.todolist.gotopage(page);
      req.then(function() {
        regenerate_list_for_template();
      });
    };

    $scope.currentProject = null;
    ProjectsService.getCurrentProject().done(function(currentProject){
      if (currentProject){
        $scope.currentProject = currentProject;
        $scope.todolist = new Todos.TodoList($scope.currentProject, {archived: $scope.is_archived});
        title("Todos", $scope.currentProject);
        $scope.update(true);
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
    $scope.is_archived = ($location.path().indexOf("archived_todos") !== -1)

    var removed = function(e, todo_key) {
      $location.path("/projects/" + $scope.currentProject.key + "/todos");
      $location.replace();
    };
    $scope.$on("deleted", removed);
    $scope.$on("archived", removed);

    var refresh_comments = function() {
      $scope.comments = $scope.todo.data.children;
      $scope.commentsParent = $scope.todo;
    };

    $scope.$on("saved", function(e, new_todo) {
      var archived = false;
      if (new_todo.archived) {
        archived = new_todo.archived;
        delete new_todo.archived;
      }

      $scope.todo = new Todos.TodoItem(new_todo.key, $scope.currentProject, new_todo, archived);
      refresh_comments();
    });

    $scope.update = function() {
      $scope.todo = new Todos.TodoItem($route.current.params.todoId, $scope.currentProject, undefined, $scope.is_archived);
      var req = $scope.todo.refresh();
      var success = function() {
        toast.loaded();
        refresh_comments();
        toggleTodo($scope.todo, "open", true);
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
