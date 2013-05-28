"use strict";

(function(){
  var routes = function($routeProvider) {
    var feedPage = {
      templateUrl: "/static/partials/feed.html",
      controller: "FeedController",
    };

    var todosPage = {
      templateUrl: "/static/partials/todos.html",
      controller: "TodosController"
    }
    $routeProvider.when("/projects/:id/", feedPage);
    $routeProvider.when("/projects/:id/feed/", feedPage);

    $routeProvider.when("/projects/:id/todos", todosPage);
    $routeProvider.when("/projects/:id/todos/pages/:page", todosPage)

    $routeProvider.when("/projects/:id/todos/:todoId", {
      templateUrl: "/static/partials/singletodo.html",
      controller: "SingleTodoController"
    });

    var profilePage = {
      templateUrl: "/static/partials/profile.html",
      controller: "ProfileController"
    };
    $routeProvider.when("/profile/", profilePage);
  };

  var app = angular.module("projecto", []);

  app.factory("absoluteTimeToJsDate", function(){
    return function(absoluteTime) {
      var splitted = absoluteTime.split(" ");
      if (splitted.length == 1) {
        return new Date(splitted[0]);
      } else if (splitted.length > 1) {
        var date = new Date(splitted[0]);
        var time = splitted[1].split(":");
        date.setHours(time[0]);
        date.setMinutes(time[1]);
        return date;
      } else {
        return null;
      }
    };
  });

  app.factory("title", ["$window", function($window) {
    return function(title, project) {
      if (!project)
        $window.document.title = title + " - Projecto";
      else
        $window.document.title = title + " · " + project.name + " - Projecto";
    };
  }]);

  app.config(["$routeProvider", routes]);

  app.config(["$interpolateProvider", function($interpolateProvider, $rootScope) {
    $interpolateProvider.startSymbol("{[");
    $interpolateProvider.endSymbol("]}");
  }]);

  app.run(["$rootScope", "ProjectsService", function($rootScope, ProjectsService) {
    $rootScope.currentUser = window.currentUser;
  }]);
})();