"use strict";

(function() {
  var module = angular.module("projecto");

  module.service("TodosService", ["$http", function($http) {
    var apiUrl = function(project_id, postfix) {
      return window.API_PREFIX + "/projects/" + project_id + "/todos/" + (postfix ? postfix : "");
    };

    var convertBooleanToParamString = function(b) {
      if (b === undefined || b === "1" || b === "0") {
        return b;
      }

      return b ? "1" : "0";
    };

    this.new = function(project, todo) {
      return $http({
        method: "POST",
        url: apiUrl(project.key),
        data: todo
      });
    };

    this.index = function(project, params) {
      params["shownotdone"] = convertBooleanToParamString(params["shownotdone"]);
      params["showdone"] = convertBooleanToParamString(params["showdone"]);
      params["archived"] = convertBooleanToParamString(params["archived"]);
      return $http({
        method: "GET",
        url: apiUrl(project.key),
        params: params
      });
    };

    this.delete = function(project, todo, really, archived) {
      really = convertBooleanToParamString(really);
      archived = convertBooleanToParamString(archived);
      return $http({
        method: "DELETE",
        url: apiUrl(project.key, todo.key),
        params: {really: really, archived: archived}
      });
    };

    this.get = function(project, todoId, archived) {
      return $http({
        method: "GET",
        url: apiUrl(project.key, todoId),
        params: {archived: convertBooleanToParamString(archived)}
      });
    };

    this.put = function(project, todo) {
      // No archived as we cannot edit archived todos.
      var j = {};
      j["title"] = todo["title"];
      j["content"] = {markdown: $.type(todo["content"]) === "string" ? todo["content"] : (todo["content"]["markdown"] || "")};
      j["assigned"] = todo["assigned"];
      if (todo["due"]) {
        j["due"] = new Date(todo["due"]).getTime() / 1000;
      }

      j["tags"] = todo["tags"];

      return $http({
        method: "PUT",
        url: apiUrl(project.key, todo.key),
        data: j
      });
    };

    this.mark_done = function(project, todo, archived) {
      return $http({
        method: "POST",
        url: apiUrl(project.key, todo.key + "/markdone"),
        data: {done: !todo.done},
        params: {archived: convertBooleanToParamString(archived)}
      });
    };

    this.clear_done = function(project) {
      return $http({
        method: "DELETE",
        url: apiUrl(project.key, "done")
      });
    };

    this.list_tags = function(project, archived) {
      return $http({
        method: "GET",
        url: apiUrl(project.key, "tags/"),
        params: {archived: convertBooleanToParamString(archived)}
      });
    };
  }]);

  module.factory("Todos", ["$q", "TodosService", function($q, TodosService) {
    function TodoItem(key, project, data, archived) {
      this.key = key;
      this.project = project;
      this.data = data || {};
      this.archived = archived || false;
    }

    TodoItem.prototype.serialize = function() {
      var todo = angular.copy(this.data);
      todo.key = this.key;
      return todo;
    };

    TodoItem.prototype.refresh = function() {
      var deferred = $q.defer();

      if (!this.key)
        throw "You need a key in order to refresh!";

      var req = TodosService.get(this.project, this.key, this.archived);
      var that = this;
      req.success(function(data) {
        that.data = data;
        deferred.resolve(data);
      });

      req.error(function(data, status) {
        deferred.reject(data, status);
      });

      return deferred.promise;
    };

    TodoItem.prototype.validate = function(human_messages) {
      var invalids = {
        invalid: false
      };

      invalids["title"] = !this.data.title;
      invalids["invalid"] = invalids["title"];

      if (human_messages) {
        return {
          title: invalids["title"] ? "Todos must have a title." : undefined,
          invalid: invalids["invalid"]
        };
      } else {
        return invalids;
      }
    };

    TodoItem.prototype.save = function() {
      var deferred = $q.defer();
      if (!this.archived) {
        var that = this;
        var req;

        if (!this.key) {
          // New item and should be saved.
          req = TodosService.new(this.project, this.data);
          req.success(function(data) {
            that.key = data.key;
            that.data = data;
            deferred.resolve(data);
          });

          req.error(function(data, status) {
            deferred.reject(data, status);
          });
        } else {
          // Editted item should be saved.
          req = TodosService.put(this.project, this.serialize());
          req.success(function(data) {
            that.data = data;
            deferred.resolve(data);
          });

          req.error(function(data, status) {
            deferred.reject(data, status);
          });
        }
      } else {
        throw "Cannot save archived items.";
      }
      return deferred.promise;
    };

    TodoItem.prototype.done = function() {
      var deferred = $q.defer();
      if (!this.key) {
        throw "Cannot mark done items that are not saved.";
      } else {
        var todo = this.serialize();
        var req = TodosService.mark_done(this.project, todo, this.archived);
        var that = this;

        req.success(function(data) {
          that.data.done = !that.data.done;
          deferred.resolve(data);
        });

        req.error(function(data, status) {
          deferred.reject(data, status);
        });
      }
      return deferred.promise;
    };

    TodoItem.prototype.archive = function(really) {
      var deferred = $q.defer();

      if (!this.key) {
        throw "Cannot delete a todo that is not saved.";
      } else {
        var todo = this.serialize();
        var req = TodosService.delete(this.project, todo, really, this.archived);
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

      return deferred.promise;
    };

    TodoItem.prototype.delete = function() {
      return this.archive(true);
    };

    TodoItem.prototype.duplicate = function() {
      return new TodoItem(this.key, this.project, angular.copy(this.data), this.archived);
    };

    function TodoList(project) {
      this.project = project;
      this.loading = true;
      this.archived = false;

      this.todos = new datastructures.LinkedMap();
      this.todos_per_page = 0;
      this.total_todos = 0;
      this.total_pages = 0;
    }

    TodoList.prototype.refresh = function(route_params) {
      this.loading = true;
      var params = {};
      params["page"] = route_params["page"];
      params["amount"] = route_params["amount"];
      params["showdone"] = route_params["showdone"];
      params["shownotdone"] = route_params["shownotdone"];
      params["archived"] = route_params["archived"];
      params["tags"] = route_params["tags"];

      // TODO: verify that no tags are working
      if ($.type(params["tags"]) === "string") {
        params["tags"] = [params["tags"]];
      }

      this.archived = params["archived"];

      var deferred = $q.defer();

      var req = TodosService.index(this.project, params);
      var self = this;
      req.success(function(data) {
        self.todos = new datastructures.LinkedMap();
        for (var i=0, l=data.todos.length; i<l; i++) {
          var tododata = data.todos[i];
          var todokey = tododata.key;
          delete tododata.key;
          self.todos.put(todokey, new TodoItem(todokey, self.project, tododata, params["archived"] == "1"));
        }

        self.current_page = data.currentPage;
        self.total_todos = data.totalTodos;
        self.todos_per_page = data.todosPerPage;
        self.total_pages = Math.ceil(self.total_todos / self.todos_per_page);
        self.loading = false;
        deferred.resolve(data);
      });

      req.error(function(data, status) {
        self.loading = false;
        deferred.reject(data, status);
      });

      return deferred.promise;
    };

    TodoList.prototype.clear_done = function() {
      if (this.archived) {
        throw "Cannot clear done of an archived TodoList";
      }

      if (this.loading) {
        throw "Cannot clear done of a todo list that hasn't been loaded";
      }

      var deferred = $q.defer();
      var req = TodosService.clear_done(this.project);
      var self = this;

      req.success(function(data) {
        // TODO: add an iterator into LinkedMap
        var rawlist = self.todos.listify();
        for (var i=0; i<rawlist.length; i++) {
          if (rawlist[i].value.data.done) {
            self.todos.remove(rawlist[i].key);
          }
        }
        deferred.resolve(data);
      });

      req.error(function(data, status) {
        deferred.reject(data, status);
      });

      return deferred.promise;
    };

    TodoList.prototype.listify = function() {
      return this.todos.values();
    };

    return {
      TodoItem: TodoItem,
      TodoList: TodoList,
      list_tags: TodosService.list_tags,
    };
  }]);
})();
