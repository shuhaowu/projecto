"use strict";

(function(){
  var routes = function($routeProvider) {
    var feedPage = {
      templateUrl: "/static/partials/feed.html",
      controller: "FeedController",
    };

    $routeProvider.when("/projects/:id/", feedPage);
    $routeProvider.when("/projects/:id/feed/", feedPage);

    $routeProvider.when("/projects/:id/todos", {
      templateUrl: "/static/partials/todos.html",
      controller: "TodosController"
    });

    var profilePage = {
      templateUrl: "/static/partials/profile.html",
      controller: "ProfileController"
    };
    $routeProvider.when("/profile/", profilePage);
  };

  var app = angular.module("projecto", []);

  app.config(["$routeProvider", routes]);

  app.config(["$interpolateProvider", function($interpolateProvider, $rootScope) {
    $interpolateProvider.startSymbol("{[");
    $interpolateProvider.endSymbol("]}");
  }]);

  app.run(["$rootScope", "ProjectsService", function($rootScope, ProjectsService) {
    $rootScope.currentUser = window.currentUser;
  }]);
})();