"use strict";

(function(){
  angular.module("projecto").service(
    "TodosService", [function(){

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
        return $.ajax({
          type: "DELETE",
          url: apiUrl(project.key, todo.key),
          dataType: "json"
        });
      };

      this.get = function(project, todoId) {
        return $.ajax({
          type: "GET",
          url: apiUrl(project.key, todoId),
          dataType: "json"
        });
      };

      this.put = function(project, todo) {
        var j = {};
        j["title"] = todo["title"];
        j["content"] = {markdown: $.type(todo["content"]) === "string" ? todo["content"] : (todo["content"]["markdown"] || "")};
        j["assigned"] = todo["assigned"];
        j["due"] = new Date(todo["due"]).getTime() / 1000;
        j["tags"] = todo["tags"];

        return $.ajax({
          type: "PUT",
          url: apiUrl(project.key, todo.key),
          dataType: "json",
          contentType: "application/json",
          data: JSON.stringify(j)
        });
      };

      this.markDone = function(project, todo) {
        return $.ajax({
          type: "POST",
          url: apiUrl(project.key, todo.key + "/markdone"),
          dataType: "json",
          contentType: "application/json",
          data: JSON.stringify({done: !todo.done})
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