"use strict";

(function(){
  // This service actual caches the projects
  angular.module("projecto").service("ProjectsService", ["$route", "$location", function($route, $location) {
    var projectAPIPrefix = window.API_PREFIX + "/projects";

    var self = this;

    this.new = function(name) {
      self._myProjects = null; // Invalidate so we need to refresh our projects and thereby the cache.
      return $.ajax({
        type: "POST",
        url: projectAPIPrefix + "/",
        dataType: "json",
        data: JSON.stringify({name: name}),
        contentType: "application/json"
      });
    };

    this.get = function(id) {
      return $.ajax({
        type: "GET",
        url: projectAPIPrefix + "/" + id,
      });
    };

    this.listMine = function() {
      if (!self._myProjects) {
        var promise = $.ajax({
          type: "GET",
          url: projectAPIPrefix + "/mine"
        });

        self._myProjects = promise;

        return promise;
      } else {
        return self._myProjects;
      }
    };

    // Cache
    this._projectIdsToProjects = null;

    this._buildCache = function() {
      return self.listMine().done(function(data) {
        self._projectIdsToProjects = {};

        var l;
        l = data.owned.length;
        for (var i=0; i<l; i++) {
          data.owned[i].owner = true;
          self._projectIdsToProjects[data.owned[i].key] = data.owned[i];
        }

        l = data.participating.length;
        for (var i=0; i<l; i++) {
          data.participating[i].owner = false;
          self._projectIdsToProjects[data.participating[i].key] = data.participating[i];
        }

      });
    }

    this.getCurrentProject = function() {
      if ($location.path().slice(0, 9) != "/projects" || !$route.current || !$route.current.params.id)
        return $.Deferred().reject("Not a project url");
      else {
        if (self._projectIdsToProjects === null) {
          var projectPromise = $.Deferred();
          this._buildCache().done(function() {
            projectPromise.resolve(self._projectIdsToProjects[$route.current.params.id]);
          });
          return projectPromise;
        } else {
          return $.when(self._projectIdsToProjects[$route.current.params.id]);
        }
      }
    };
  }]);
})();