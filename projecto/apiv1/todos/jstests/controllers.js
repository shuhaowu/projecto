"use strict";

(function() {
  var project_key = "project_key";
  var todo_key = "todo_key";
  var project = {key: project_key};
  var author = angular.copy(window.currentUser);
  delete author.emails;
  var returned_todo_data = {
    key: todo_key,
    author: author,
    title: "Test",
    content: {
      markdown: "yay todos!",
      html: "<p>yay todos!</p>\\n"
    },
    tags: [],
    due: null,
    done: false,
    assigned: null,
    milestone: null,
    date: 1388790824.0,
    children: []
  };

  // Turn off jquery effects, which means animations returns instantly
  jQuery.fx.off = true;

  var baseUrl = window.API_PREFIX + "/projects/" + project_key + "/todos/";

  describe("TodosController", function(){

  });

})();
