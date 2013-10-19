"use strict";

(function(){
  angular.module("projecto").service(
    "TodosService", ["$http", function($http){

      var apiUrl = function(project_id, postfix) {
        return window.API_PREFIX + "/projects/" + project_id + "/todos/" + (postfix ? postfix : "");
      };

      this.new = function(project, todo) {
        return $.ajax({
          type: "POST",
          url: apiUrl(project.key),
          dataType: "json",
          contentType: "application/json",
          data: JSON.stringify(todo)
        });
      };

      this.index = function(project, page) {
        return $.ajax({
          type: "GET",
          url: apiUrl(project.key),
          dataType: "json",
          data: {page: page}
        });
      };

      this.filter = function(project, params) {
        return $.ajax({
          type: "GET",
          url: apiUrl(project.key, "filter"),
          data: params
        })
      };

      this.delete = function(project, todo) {
        return $http({
          method: "DELETE",
          url: apiUrl(project.key, todo.key),
        });
      };

      this.get = function(project, todoId) {
        return $http({
          method: "GET",
          url: apiUrl(project.key, todoId)
        });
      };

      this.put = function(project, todo) {
        var j = {};
        j["title"] = todo["title"];
        j["content"] = {markdown: $.type(todo["content"]) === "string" ? todo["content"] : (todo["content"]["markdown"] || "")};
        j["assigned"] = todo["assigned"];
        j["due"] = new Date(todo["due"]).getTime() / 1000;
        j["tags"] = todo["tags"];

        return $http({
          method: "PUT",
          url: apiUrl(project.key, todo.key),
          data: j
        });
      };

      this.markDone = function(project, todo) {
        return $http({
          method: "POST",
          url: apiUrl(project.key, todo.key + "/markdone"),
          data: {done: !todo.done}
        });
      };

      this.clearDone = function(project) {
        return $.ajax({
          type: "DELETE",
          url: apiUrl(project.key, "done"),
          dataType: "json"
        });
      };

      this.listTags = function(project) {
        return $.ajax({
          type: "GET",
          url: apiUrl(project.key, "tags/"),
          dataType: "json"
        });
      };
    }]
  );
})();