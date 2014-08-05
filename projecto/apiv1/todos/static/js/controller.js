"use strict";

(function() {
  var module = angular.module("projecto");

  module.controller("TodosController", ["$scope", "$routeParams", "$location", "$window", "toast", "ProjectsService", "Todos", function($scope, $routeParams, $location, $window, toast, ProjectsService, Todos) {
    $scope.newtodo = null;
    $scope.todolist = null;
    $scope.todolist_for_template = null;
    $scope.all_expanded = false;
    $scope.is_archived = $routeParams.archived == "1";
    $scope.tags = null;

    var add_tags = function(tags) {
      var tags_map = {};
      for (var i=0, l=$scope.tags.length; i<l; i++) {
        tags_map[$scope.tags[i]] = true;
      }

      for (i=0, l=tags.length; i<l; i++) {
        tags_map[tags[i]] = true;
      }

      $scope.tags = Object.keys(tags_map);
    };

    $scope.update = function() {
      // We initialize a new todolist so we can temporarily cache the old
      // todos so it can still be displayed. Makes things looks smoother.
      toast.info("Updating...");
      var todolist = new Todos.TodoList($scope.currentProject);
      var req = todolist.refresh($routeParams);

      req.then(function() {
        $scope.todolist = todolist;
        $scope.todolist_for_template = $scope.todolist.listify();
        toast.close();
      });

      req.catch(function(data, status) {
        toast.error("Failed to refresh todo list", status);
      });

      if ($scope.tags === null) {
        var tags_req = Todos.list_tags($scope.currentProject, $scope.is_archived);
        tags_req.success(function(data) {
          $scope.tags = data.tags;
          $scope.tags.push(" ");
        });

        tags_req.error(function(data, status) {
          toast.error("Failed to fetch tags", status);
        });
      }
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
        if ($scope.newtodo.data.tags) {
          $scope.newtodo.data.tags = helpers.ensure_array($scope.newtodo.data.tags);
        }

        var req = $scope.newtodo.save();
        var success = function(data) {
          $scope.todolist.todos.prepend($scope.newtodo.key, $scope.newtodo);
          $scope.todolist_for_template = $scope.todolist.listify();
          // add new tags into the the list filter
          $scope.cancel_new_todo(true);
        };

        var error = function(data, status) {
          toast.error("Failed to post", status);
        };
        req.then(success, error);
      } else {
        // TODO: Need a better way to display these messages in the future.
        toast.warn(invalid_messages["title"]);
      }
    };

    $scope.clear_done = function() {
      var req = $scope.todolist.clear_done();
      req.then(function() {
        $scope.todolist_for_template = $scope.todolist.listify();
      });

      req.catch(function(data, status) {
        toast.error("Failed to clear done", status);
      });
    };

    $scope.expand_todos = function() {

    };

    $scope.collapse_todos = function() {

    };

    $scope.toggle_filter_tag = function(tag) {
      var tags = $location.search().tag || [];
      var index = tags.indexOf(tag);
      if (index > -1) {
        tags.splice(index, 1);
      } else {
        tags.push(tag);
      }

      $location.search("tag", tags);
    };

    $scope.tag_filtered = function(tag) {
      return $location.search().tags.indexOf(tag) > -1;
    };

    $scope.toggle_show_done = function() {
      var showdone = $scope.show_done_filtered();
      $location.search("showdone", showdone ? null : "1");
    };

    $scope.show_done_filtered = function() {
      return $location.search().showdone === "1";
    };

    $scope.toggle_show_notdone = function() {
      var shownotdone = $scope.show_notdone_filtered();
      console.log(shownotdone);
      $location.search("shownotdone", shownotdone ? "0" : null);
    };

    $scope.show_notdone_filtered = function() {
      return $location.search().shownotdone !== "0";
    };

    $scope.goto = function(page) {
      $location.search("page", page);
    };

    $scope.$on("$routeUpdate", function() {
      $scope.update();
    });

    $scope.$on("todo.saved", function(e, todo) {
      $scope.todolist.todos.put(todo.key, todo);
      $scope.todolist_for_template = $scope.todolist.listify();
    });

    var remove_todo_from_list = function(e, todokey) {
      $scope.todolist.todos.remove(todokey);
      $scope.todolist_for_template = $scope.todolist.listify();
      $scope.todolist.total_todos--;
    };

    $scope.$on("todo.deleted", remove_todo_from_list);
    $scope.$on("todo.archived", remove_todo_from_list);

    $scope.currentProject = null;
    ProjectsService.getCurrentProject().done(function(currentProject) {
      $scope.currentProject = currentProject;
      $scope.update();
      $scope.$$phase || $scope.$apply();
    }).fail(function(xhr) {
      toast.error("Failed to get project info", xhr.status);
    });
  }]);
})();
