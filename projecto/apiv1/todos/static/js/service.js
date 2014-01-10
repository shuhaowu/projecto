"use strict";

(function(){
  var module = angular.module("projecto");


  module.service("TodosService", ["$http", function($http){
    var apiUrl = function(project_id, postfix) {
      return window.API_PREFIX + "/projects/" + project_id + "/todos/" + (postfix ? postfix : "");
    };

    this.new = function(project, todo) {
      return $http({
        method: "POST",
        url: apiUrl(project.key),
        data: todo
      });
    };

    this.index = function(project, page, archived) {
      return $http({
        method: "GET",
        url: apiUrl(project.key),
        data: {page: page},
        params: {archived: archived ? "1" : "0"}
      });
    };

    this.filter = function(project, params) {
      return $http({
        method: "GET",
        url: apiUrl(project.key, "filter"),
        params: params
      });
    };

    this.delete = function(project, todo, really, archived) {
      return $http({
        method: "DELETE",
        url: apiUrl(project.key, todo.key),
        params: {really: really ? "1" : "0", archived: archived ? "1" : "0"}
      });
    };

    this.get = function(project, todoId, archived) {
      return $http({
        method: "GET",
        url: apiUrl(project.key, todoId),
        params: {archived: archived ? "1" : "0"}
      });
    };

    this.put = function(project, todo) {
      var j = {};
      j["title"] = todo["title"];
      j["content"] = {markdown: $.type(todo["content"]) === "string" ? todo["content"] : (todo["content"]["markdown"] || "")};
      j["assigned"] = todo["assigned"];
      if (todo["due"])
        j["due"] = new Date(todo["due"]).getTime() / 1000;

      j["tags"] = todo["tags"];

      return $http({
        method: "PUT",
        url: apiUrl(project.key, todo.key),
        data: j
      });
    };

    this.markDone = function(project, todo, archived) {
      return $http({
        method: "POST",
        url: apiUrl(project.key, todo.key + "/markdone"),
        data: {done: !todo.done},
        params: {archived: archived ? "1" : "0"}
      });
    };

    this.clearDone = function(project) {

      return $http({
        method: "DELETE",
        url: apiUrl(project.key, "done")
      });
    };

    this.listTags = function(project, archived) {
      return $http({
        method: "GET",
        url: apiUrl(project.key, "tags/")
      });
    };
  }]);

  module.factory("Todos", ["$q", "TodosService", function($q, TodosService) {
    function TodoItem(key, project, data, archived) {
      this.key = key;
      this.project = project;
      this.data = data;
      this.archived = archived || false;
    }

    TodoItem.prototype.serialize = function() {
      var todo = angular.copy(this.data);
      todo.key = this.key;
      return todo;
    };

    TodoItem.prototype.save = function() {
      var deferred = $q.defer();
      if (!this.archived) {

        if (!this.key) {
          // New item and should be saved.
          var req = TodosService.new(this.project, this.data);
          req.success(function(data) {
            deferred.resolve(data);
          });

          req.error(function(data, status) {
            deferred.reject(data, status);
          });
        } else {
          // Editted item should be saved.
          var todo = this.serialize();
          var req = TodosService.put(this.project, todo);
          req.success(function(data) {
            deferred.resolve(data);
          });

          req.error(function(data, status) {
            deferred.reject(data, status);
          });
        }
      } else {
        throw "Cannot save archived items.";
      }
      return deferred;
    };

    TodoItem.prototype.done = function() {
      var deferred = $q.defer();
      if (!this.archived) {
        if (!this.key) {
          throw "Cannot mark done items that are not saved.";
        } else {
          var todo = this.serialize();
          var req = TodosService.markDone(this.project, todo, this.archived);
          var that = this;

          req.success(function(data) {
            that.data.done = data.done;
            deferred.resolve(data);
          });

          req.error(function(data, status) {
            deferred.reject(data, status);
          });
        }
      }
      return deferred;
    };

    TodoItem.prototype.archive = function(really) {
      var deferred = $q.defer();

      if (!this.key) {
        throw "Cannot delete a todo that is not saved.";
      } else {
        var todo = this.serialize();
        var req = TodosService.delete(this.project, todo, really, todo.archived);
        var that = this;

        req.success(function(data) {
          deferred.resolve(data);
          if (!really)
            that.archived = true;
        });

        req.error(function(data, status) {
          deferred.reject(data, status);
        });
      }

      return deferred;
    };

    TodoItem.prototype.delete = function() {
      this.archive(true);
    };

    function TodoList(project, options) {
      options = options || {};
      this.project = project;
      this.archived = options.archived || false;
      this.currentPage = options.currentPage || 1;
      this.filterState = options.filterState || {};
      this.showdone = options.showdone || false;

      this.todos = [];
      this.tags = [];
      this.todosPerPage = -1;
      this.totalTodos = -1;
      this.totalPages = -1;
    }

    TodoList.prototype.checkFetched = function() {
      if (this.totalPages == -1)
        throw "TodoList has not been fetched.";
    };

    TodoList.prototype.fetch = function() {
      // Depending on archived state, we use filter or whatever.
      var deferred = $q.defer();

      // Refactored.
      var recomputeTodos = function(data) {
        this.todos = data.todos;
        this.currentPage = data.currentPage;
        this.totalTodos = data.totalTodos;
        this.todosPerPage = data.todosPerPage;
        this.totalPages = Math.ceil(this.totalTodos / this.todosPerPage);
      };

      recomputeTodos = recomputeTodos.bind(this);

      var self = this;
      if (this.archived) {
        var req = TodosService.index(this.project, this.currentPage, this.archived);
        req.success(function(data) {
          recomputeTodos(data);
          deferred.resolve(self);
        });

        req.error(function(data, status) {
          deferred.reject(data, status);
        });
      } else {
        var params = {
          tags: this.tags,
          showdone: this.showdone ? "1" : "0",
          shownotdone: this.shownotdone ? "0" : "1",
          page: this.currentPage
        };
        var req = TodosService.filter(this.project, params);
        req.success(function(data) {
          recomputeTodos(data);
          deferred.resolve(self);
        });

        req.error(function(data, status) {
          deferred.reject(data, status);
        });
      }
      return deferred;
    };

    TodoList.prototype.nextpage = function() {
      this.checkFetched();
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        return this.fetch();
      }
    };

    TodoList.prototype.prevpage = function() {
      this.checkFetched();
      if (this.currentPage > 1) {
        this.currentPage--;
        return this.fetch();
      }
    };

    TodoList.prototype.clearDone = function() {
      this.checkFetched();
      if (this.archived)
        throw "Cannot clear done of an archived TodoList";

      var deferred = $q.defer();
      var req = TodosService.clearDone(this.project);

      req.success(function(data) {
        deferred.resolve(data);
      });

      req.error(function(data, status) {
        deferred.reject(data, status);
      });
      return deferred;
    };

    return {
      TodoItem: TodoItem,
      TodoList: TodoList
    };

  }]);

})();