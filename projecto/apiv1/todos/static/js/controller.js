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
  }])

  module.controller(
    "TodosController", ["$scope", "$route", "toast", "title", "TodosService", "ProjectsService", function($scope, $route, toast, title, TodosService, ProjectsService){
      $scope.newtodoitem = {};
      $scope.todos = [];
      $scope.tags = [];
      $scope.tagsFiltered = {};
      $scope.showdone = "0";
      $scope.shownotdone = "1";

      $scope.currentPage = null;
      $scope.totalPages = null;
      $scope.todosPerPage = null;
      $scope.totalTodos = 0;
      $scope.pages = [];

      // Managed via the event enterEdit, exitEdit, new Todo's save success, and in Expand all.
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

      $scope.$on("deleted", function(e, todoKey, i) {
        $scope.todos.splice(i, 1);
        $scope.totalTodos--;
      });

      $scope.$on("saved", function(e, newTodo, i) {
        $scope.todos[i] = newTodo;
      });

      var recomputePages = function(totalTodos, todosPerPage) {
        $scope.totalTodos = totalTodos;
        $scope.totalPages = Math.ceil(totalTodos / todosPerPage);

        // NOTE: This array is used in the template, for pagination.
        //       It will be eliminated when the pagination template
        //       is made into a directive.
        $scope.pages = [];
        if ($scope.totalPages < 8) {
          for (var i=1; i<=$scope.totalPages; i++)
            $scope.pages.push(i);
        }
      };

      var showTodosUpdate = function(data, msg) {
        $scope.$apply(function(){
          $scope.todos = data.todos;
          $scope.todosPerPage = data.todosPerPage;
          $scope.currentPage = data.currentPage;
          recomputePages(data.totalTodos, data.todosPerPage);
          if (msg) {
            toast.success(msg);
          }
        });
      };


      $scope.expandTodos = function(e) {
        if ($(e.target).text() === "Expand All") {
          for (var i=0; i<$scope.todos.length; i++) {
            toggleTodo($scope.todos[i], "open");
          }
          $(e.target).text("Close All");
        } else {
          for (var i=0; i<$scope.todos.length; i++) {
            toggleTodo($scope.todos[i], "close");
            currentlyEditing = [];
          }
          $(e.target).text("Expand All");
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

      var cancelAction = function(action) {
        if (currentlyEditing.length > 0) {
          var msg = action ? "You are about to " + action + ".\n" : "Warning!\n";
          msg += "This action will reload the todo items, but you have items currently open for editing. ";
          msg += "Any unsaved changes will be lost.\nDo you wish to proceed?";
          if (!window.confirm(msg)) {
            return true;
          }
          currentlyEditing = [];
        }
        return false;
      };

      $scope.createTodo = function() {
        if (cancelAction("create a new todo")) return;

        if ($scope.newtodoitem.title) {
          if ($scope.newtodoitem.tags)
            $scope.newtodoitem.tags = extractTags($scope.newtodoitem.tags);

          TodosService.new($scope.currentProject, $scope.newtodoitem).done(function(data){
            $scope.update("Created");
            $scope.newTodo(); // hack. Closes the "New Todo" form.
            currentlyEditing = [];
          }).fail(function(xhr){
            toast.error("Failed to post", xhr.status);
          });
        } else {
          toast.warn("Todos must have a title.");
        }
      };

      var updateTags = function(data) {
        $scope.$apply(function() {
          $scope.tags = data.tags;
          $scope.tags.push(" ");

          // if we've received a new tag, set it to "checked"
          for (var i=0, l=data.tags.length; i < l; i++) {
            if ($scope.tagsFiltered[data.tags[i]] === undefined) {
              $scope.tagsFiltered[data.tags[i]] = true;
            }
          }
        });
      };

      var getFilterTags = function() {
        var tags = [];
        for (var t in $scope.tagsFiltered) {
          if ($scope.tagsFiltered[t])
            tags.push(t);
        }
        return tags;
      };

      var updateTodos = function(msg) {
        var params = {
          tags: getFilterTags(),
          showdone: $scope.showdone,
          shownotdone: $scope.shownotdone,
          page: ($scope.currentPage || 1)
        };

        TodosService.filter($scope.currentProject, params)
          .done(function(data) {
            showTodosUpdate(data, msg);
          })
          .fail(function(xhr){
            toast.error("Failed to list todo", xhr.status);
          });
      };

      $scope.update = function(msg) {
        TodosService.listTags($scope.currentProject)
          .done(function(data) {
            updateTags(data);
            updateTodos(msg);
          })
          .fail(function(xhr) {
            toast.error("Failed to list tags", xhr.status);
          });
      };

      $scope.clearDone = function(todo) {
        TodosService.clearDone($scope.currentProject).done(function(data) {
          $scope.$apply(function() {
            for (var i=0; i<$scope.todos.length; i++) {
              if ($scope.todos[i].done) {
                $scope.todos.splice(i, 1);
                i--;
              }
            }
          });
        }).fail(function(xhr) {
          toast.error("Failed to clear", xhr.status);
        });
      };

      $scope.checkTagFilter = function(tag) {
        if (cancelAction("change the filters")) return;
        $scope.tagsFiltered[tag] = !$scope.tagsFiltered[tag];
        $scope.update();
      };

      $scope.checkShowFilter = function(attr) {
        if (cancelAction("change the filters")) return;
        $scope[attr] = $scope[attr] === "1" ? "0" : "1";
        $scope.update();
      };

      $scope.goToPage = function(pageNo) {
        if (cancelAction("change the page")) return;
        $scope.currentPage = pageNo;
        $scope.update();
      };

      $scope.currentProject = null;

      ProjectsService.getCurrentProject().done(function(currentProject){
        if (currentProject){
          $scope.currentProject = currentProject;
          title("Todos", $scope.currentProject);
          $scope.update();
          $scope.$$phase || $scope.$apply();
        } else {
          window.notLoaded();
        }
      });
    }]
  );

  module.controller(
    "SingleTodoController", ["$scope", "$route", "$location", "$timeout", "toast", "title", "TodosService", "ProjectsService", function($scope, $route, $location, $timeout, toast, title, TodosService, ProjectsService) {
      $scope.currentProject = null;
      $scope.todo = {};
      $scope.hideCommentLink = true;

      var setupCommentStuff = function() {
        $scope.comments = $scope.todo.children;
        $scope.commentsParent = $scope.todo;
      };

      $scope.$on("deleted", function(e, todoKey) {
        $location.path("/projects/" + $scope.currentProject.key + "/todos");
        $location.replace();
      });

      $scope.$on("saved", function(e, newTodo) {
        $scope.todo = newTodo;
        setupCommentStuff();
      });

      $scope.update = function() {
        var req = TodosService.get($scope.currentProject, $route.current.params.todoId);

        req.success(function(data) {
          toast.loaded();
          $scope.todo = data;
          setupCommentStuff();

          // TODO: this is broken. It only sometimes works.
          toggleTodo($scope.todo);
        });

        req.error(function(data, status) {
          toast.error("Failed to load todo", status);
        });
      };

      toast.loading();
      ProjectsService.getCurrentProject().done(function(currentProject) {
        $scope.currentProject = currentProject;
        $scope.update();
        $scope.$$phase || $scope.$apply();
      }).fail(function(xhr) {
        toast.error("Failed to get project info", xhr.status);
      });

    }]
  );
})();