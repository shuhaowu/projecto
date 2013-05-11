"use strict";

(function(){
  angular.module("projecto").service("ProfileService", ["$rootScope", function($rootScope){
    var profileAPIPrefix = window.API_PREFIX + "/profile";

    this.changeName = function(newName) {
      return $.ajax({
        type: "POST",
        url: profileAPIPrefix + "/changename",
        dataType: "json",
        contentType: "application/json",
        data: JSON.stringify({name: newName})
      }).done(function(data){
        $rootScope.$apply(function(){
          $rootScope.currentUser.name = newName;
        });
        window.currentUser.name = newName;
      });
    };
  }]
  );
})();