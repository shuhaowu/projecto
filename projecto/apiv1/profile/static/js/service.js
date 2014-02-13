"use strict";

(function(){
  angular.module("projecto").service("ProfileService", ["$rootScope", "$http", function($rootScope, $http){
    var apiUrl = window.API_PREFIX + "/profile";

    this.change_name = function(new_name) {
      var req = $http({
        method: "POST",
        url: apiUrl + "/changename",
        data: {name: new_name}
      });

      req.success(function(data) {
        $rootScope.currentUser.name = new_name;
        window.currentUser.name = new_name;
      });
      return req;
    };
  }]
  );
})();