"use strict";

(function(){
  angular.module("projecto").controller(
    "TodosController", ["$scope", "$filter", "$route", "title", "TodosService", "ProjectsService", function($scope, $filter, $route, title, TodosService, ProjectsService){

      $scope.newtodoitem = {};
      $scope.todos = [];
      $scope.tags = [];
      $scope.tagsFiltered = {};
      $scope.showdone = "0";
      $scope.shownotdone = "1";
      $scope.editMode = {};

      $scope.currentPage = null;
      $scope.totalPages = null;
      $scope.todosPerPage = null;
      $scope.totalTodos = 0;
      $scope.pages = [];

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
            $("body").statusmsg("open", msg, {type: "success", autoclose: 500});
          }
        });
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
        console.log(tags);
        return tags;
      };

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

      $scope.expandTodos = function(e) {
        if ($(e.target).text() === "Expand All") {
          for (var i=0; i<$scope.todos.length; i++) {
            toggleTodo($scope.todos[i], "open");
          }
          $(e.target).text("Close All");
        } else {
          for (var i=0; i<$scope.todos.length; i++) {
            toggleTodo($scope.todos[i], "close");
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

      $scope.createTodo = function() {
        if ($scope.newtodoitem.title) {
          if ($scope.newtodoitem.tags)
            $scope.newtodoitem.tags = extractTags($scope.newtodoitem.tags);

          TodosService.new($scope.currentProject, $scope.newtodoitem).done(function(data){
            $scope.update("Created");
            $scope.newTodo(); // hack. Closes the "New Todo" form.
          }).fail(function(xhr){
            $("body").statusmsg("open", "Posting failed: " + xhr.status, {type: "error", closable: true});
          });
        } else {
          $("body").statusmsg("open", "Todos must have a title!", {type: "error", autoclose: 2000});
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
            $("body").statusmsg("open", "Updating todos failed: " + xhr.status, {type: "error", closable: true});
          });
      };

      $scope.update = function(msg) {
        console.log("Updating the todos list");
        TodosService.listTags($scope.currentProject)
          .done(function(data) {
            updateTags(data);
            updateTodos(msg);
          })
          .fail(function(xhr) {
            $("body").statusmsg("open", "Updating tags failed: " + xhr.status, {type: "error", closable: true});
          });
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

      $scope.clearDone = function(todo) {
        TodosService.clearDone($scope.currentProject).done(function(data) {
          console.log("test");
          $scope.$apply(function() {
            for (var i=0; i<$scope.todos.length; i++) {
              if ($scope.todos[i].done) {
                $scope.todos.splice(i, 1);
                i--;
              }
            }
          });
        }).fail(function(xhr) {
          $("body").statusmsg("open", "Clearing failed: " + xhr.status, {type: "error", closable: true});
        });
      };


      $scope.showTodo = function(todo, $event) {
        $event.preventDefault();
        $event.stopPropagation();

        toggleTodo(todo);
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

      var noCurrentEdits = function() {
        for (var key in $scope.editMode) {
          if ($scope.editMode.hasOwnProperty(key)) {
            // a key is present, so a todo is currently being edited.
            return false;
          }
        }
        return true;
      };

      $scope.saveTodo = function(todoKey) {
        if (!$scope.editMode[todoKey]) {
          $("body").statusmsg("open", "Something has gone wrong... Please refresh the page.", {type: "error"});
          return;
        }

        if ($scope.currentProject) {
          var tags = $scope.editMode[todoKey].tags;

          $scope.editMode[todoKey].tags = extractTags(tags);

          TodosService.put($scope.currentProject, $scope.editMode[todoKey]).done(function(data) {
            $scope.$apply(function() {
              var msg = "Saved";
              var i = $scope.editMode[todoKey]._index;
              delete $scope.editMode[todoKey];
              if (noCurrentEdits()) {
                $scope.update(msg);
              }
              else {
                $scope.todos[i] = data;
                $("body").statusmsg("open", msg, {type: "success", autoclose: 1000});
              }
            });
            toggleTodo(data, "open");

          }).fail(function(xhr) {
            $("body").statusmsg("open", "Saving error: " + xhr.status, {type: "error", closable: true});
          });
        } else {
          window.notLoaded();
        }
      };

      $scope.deleteTodo = function(todo, i) {
        if (!confirm("Are you sure you want to delete this todo item?"))
          return;

        if ($scope.currentProject) {
          TodosService.delete($scope.currentProject, todo).done(function() {
            $scope.update("Deleted");
          }).fail(function(xhr) {
            $("body").statusmsg("open", "Deletion failed: " + xhr.status, {type: "error", closable: true});
          });
        } else {
          window.notLoaded();
        }
      };

      $scope.checkTagFilter = function(tag) {
        $scope.tagsFiltered[tag] = !$scope.tagsFiltered[tag];
        $scope.update();
      };

      $scope.checkShowFilter = function(attr) {
        $scope[attr] = $scope[attr] === "1" ? "0" : "1";
        $scope.update();
      };

      $scope.goToPage = function(pageNo) {
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


// NOTE: Clicking any filter box will close any Edit form currently open. I believe that this is acceptable
//       behavior