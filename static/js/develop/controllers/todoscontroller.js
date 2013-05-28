"use strict";

(function(){
  angular.module("projecto").controller(
    "TodosController", ["$scope", "$filter", "$route", "title", "TodosService", "ProjectsService", function($scope, $filter, $route, title, TodosService, ProjectsService){

      $scope.newtodoitem = {};
      $scope.todos = [];
      $scope.editMode = {}

      $scope.currentPage = null;
      $scope.totalPages = null;
      $scope.totalTodos = 0;
      $scope.pages = [];

      var showTodo = function(todo) {
        // TODO: All of this needs to be moved into a directive.
        var bodyElement = $("#todo-" + todo.key);
        if (bodyElement.css("display") === "none") {
          bodyElement.slideDown();
        } else {
          bodyElement.slideUp();
        }
      };

      $scope.newTodo = function() {
        // hack
        if ($("#todos-new-todo-btn").text() === "New Todo"){
          $("#todos-new-todo-btn").text("Cancel");
          $("#todos-new-todo").slideDown();
        } else if ($("#todos-new-todo-btn").text() === "Cancel") {
          $("#todos-new-todo-btn").text("New Todo");
          $("#todos-new-todo").slideUp();
          $scope.newtodoitem = {};
          $scope.$$phase || $scope.$apply; // needed because we call newTodo after an ajax in createTodo
        }
      };

      $scope.createTodo = function() {
        if ($scope.newtodoitem.title) {
          if ($scope.newtodoitem.tags) {
            $scope.newtodoitem.tags = $scope.newtodoitem.tags.split(",");
          }

          TodosService.new($scope.currentProject, $scope.newtodoitem).done(function(data){
            $scope.$apply(function(){
              $scope.todos.splice(0, 0, data);
            });
            $scope.newTodo(); // hack. Closes.
          }).fail(function(xhr){
            $("body").statusmsg("open", "Posting failed: " + xhr.status, {type: "error", closable: true});
          });
        } else {
          $("body").statusmsg("open", "Todos must have a title!", {type: "error", autoclose: 2000});
        }
      };

      $scope.update = function() {
        if ($scope.currentProject){
          title("Todos", $scope.currentProject);
          TodosService.index($scope.currentProject, $route.current.params.page || 1).done(function(data){
            $scope.$apply(function(){
              $scope.todos = data.todos;
              $scope.totalTodos = data.totalTodos;
              $scope.currentPage = data.currentPage;
              $scope.totalPages = Math.floor(data.totalTodos / data.todosPerPage) + (data.totalTodos % data.todosPerPage == 0 ? 0 : 1);
              $scope.pages = [];
              if ($scope.totalPages < 8) {
                for (var i=1; i<=$scope.totalPages; i++)
                  $scope.pages.push(i);
              }
            });
          }).fail(function(xhr){
            $("body").statusmsg("open", "Updating todos failed: " + xhr.status, {type: "error", closable: true});
          });
        } else {
          notLoaded();
        }
      };

      $scope.markDone = function(todo) {
        TodosService.markDone($scope.currentProject, todo).done(function(data) {
          $scope.$apply(function() {
            todo.done = !todo.done;
          });
        }).fail(function(xhr) {
          $("body").statusmsg("open", "Marking done failed: " + xhr.status, {type: "error", closable: true});
        });
      };


      $scope.showTodo = function(todo, $event) {
        $event.preventDefault();
        $event.stopPropagation();

        showTodo(todo);
      };

      $scope.editTodo = function(todo, index) {
        var bodyElement = $("#todo-"+todo.key);
        if ($scope.editMode[todo.key]) {
          delete $scope.editMode[todo.key];
        } else {
          if (bodyElement.css("display") === "none")
            bodyElement.slideDown();

          $scope.editMode[todo.key] = angular.copy(todo);
          $scope.editMode[todo.key]["due"] = $filter("absoluteTime")(todo["due"]);
          $scope.editMode[todo.key]["_index"] = index; // For restoring later when we save
        }
      };

      $scope.cancelEdit = function(todoKey) {
        if ($scope.editMode[todoKey])
          delete $scope.editMode[todoKey];
      };

      $scope.saveTodo = function(todoKey) {
        if (!$scope.editMode[todoKey]) {
          $("body").statusmsg("open", "Something has gone wrong... Please refresh the page.", {type: "error"});
          return;
        }

        if ($scope.currentProject) {
          var tags = $scope.editMode[todoKey].tags;

          if ($.type(tags) === "string" && tags.length > 0)
            $scope.editMode[todoKey].tags = tags.split(",");

          TodosService.put($scope.currentProject, $scope.editMode[todoKey]).done(function(data) {
            $scope.$apply(function() {
              var i = $scope.editMode[todoKey]._index;
              delete $scope.editMode[todoKey]._index;
              $scope.todos[i] = data;
              delete $scope.editMode[todoKey];
            });

            showTodo(data);
          }).fail(function(xhr) {
            $("body").statusmsg("open", "Saving error: " + xhr.status, {type: "error", closable: true});
          });
        } else {
          notLoaded();
        }
      };

      $scope.deleteTodo = function(todo, i) {
        if (!confirm("Are you sure you want to delete this todo item?"))
          return;

        if ($scope.currentProject) {
          TodosService.delete($scope.currentProject, todo).done(function() {
            $scope.$apply(function() {
              $scope.todos.splice(i, 1);
            });
          }).fail(function(xhr) {
            $("body").statusmsg("open", "Deletion failed: " + xhr.status, {type: "error", closable: true});
          });
        } else {
          notLoaded();
        }
      };

      $scope.currentProject = null;

      ProjectsService.getCurrentProject().done(function(currentProject){
        $scope.currentProject = currentProject;
        $scope.update();
        $scope.$$phase || $scope.$apply();
      });

    }]
  );

  angular.module("projecto").controller(
    "SingleTodoController", ["$scope", "$route", "title", "TodosService", "ProjectsService", function($scope, $route, title, TodosService, ProjectsService) {
      $scope.currentProject = null;
      $scope.todo = {};
      $("body").statusmsg("open", "Loading your page...");

      ProjectsService.getCurrentProject().done(function(currentProject) {
        $scope.currentProject = currentProject;
        TodosService.get(currentProject, $route.current.params.todoId).done(function(todo) {
          title(todo.title, currentProject);
          $("body").statusmsg("close");
          $scope.todo = todo;
          $scope.$$phase || $scope.$apply();
        }).fail(function(xhr) {
          $("body").statusmsg("open", "Loading todo failed: " + xhr.status, {type: "error", closable: true});
        });
      }).fail(function(xhr) {
        $("body").statusmsg("open", "Loading page failed on getting current project: " + xhr.status, {type: "error", closable: true});
      });

    }]
  );
})();