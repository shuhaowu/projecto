"use strict";

(function(){
  var routes = function($routeProvider) {
    var feedPage = {
      templateUrl: "/static/feed/partials/feed.html",
      controller: "FeedController",
    };

    var todosPage = {
      templateUrl: "/static/todos/partials/todos.html",
      controller: "TodosController",
      reloadOnSearch: false,
    };

    var filesTreePage = {
      templateUrl: "/static/files/partials/filestree.html",
      controller: "FilesTreeController"
    };

    var homePage = {
      templateUrl: "/static/projects/partials/homepage.html",
      controller: "ProjectSwitcher"
    };

    $routeProvider.when("/", homePage);
    $routeProvider.when("/home", homePage);

    $routeProvider.when("/projects/:id/", feedPage);
    $routeProvider.when("/projects/:id/feed/", feedPage);
    $routeProvider.when("/projects/:id/feed/:feedId", {
      templateUrl: "/static/feed/partials/singlefeed.html",
      controller: "SingleFeedController"
    });

    $routeProvider.when("/projects/:id/todos", todosPage);
    $routeProvider.when("/projects/:id/archived_todos", todosPage);

    var singleTodoPage = {
      templateUrl: "/static/todos/partials/singletodo.html",
      controller: "SingleTodoController"
    };
    $routeProvider.when("/projects/:id/todos/:todoId", singleTodoPage);
    $routeProvider.when("/projects/:id/archived_todos/:todoId", singleTodoPage);


    $routeProvider.when("/projects/:id/files/", filesTreePage);
    $routeProvider.when("/projects/:id/files/:path*", filesTreePage);

    $routeProvider.when("/projects/:id/view_file/:path*", {
      templateUrl: "/static/files/partials/viewfile.html",
      controller: "FileViewController"
    });

    $routeProvider.when("/projects/:id/manage", {
      templateUrl: "/static/projects/partials/manage.html",
      controller: "ManageController"
    });

    var profilePage = {
      templateUrl: "/static/profile/partials/profile.html",
      controller: "ProfileController"
    };
    $routeProvider.when("/profile/", profilePage);
  };

  var app = angular.module("projecto", ["ngRoute"]);

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
        $window.document.title = title + " \xb7 " + project.name + " - Projecto";
    };
  }]);

  app.config(["$routeProvider", routes]);

  app.config(["$interpolateProvider", "$httpProvider", function($interpolateProvider, $httpProvider) {
    $interpolateProvider.startSymbol("{[");
    $interpolateProvider.endSymbol("]}");

    $httpProvider.defaults.headers.common["X-CSRFToken"] = window.csrfToken;
  }]);

  app.run(["$rootScope", "$sce", function($rootScope, $sce) {
    $rootScope.currentUser = window.currentUser;
    $rootScope.range = function(n) {
      // To deal with -1 total pages in the beginning.
      if (n < 0) {
        return [];
      }

      var a = new Array(n);
      for (var i=0; i<n; i++) {
        a[i] = i;
      }
      return a;
    };
  }]);

  app.filter("trusted", ["$sce", function($sce) {
    return function(val) {
      return $sce.trustAsHtml(val);
    };
  }]);
})();
