"use strict";

(function(){
  angular.module("projecto").directive(
    "profileName", ["ProfileService", function(ProfileService){
      return {
        template: '<p id="profile-name">{[ user.name ]}</p> <a href="" ng-click="editName()" id="profile-name-edit">Change</a> <a href="" ng-click="cancelEditName()" id="profile-name-edit-cancel">Cancel</a>',
        restrict: "EA",
        link: function link(scope, iElement, iAttrs, controller) {
          scope.editName = function() {
            var editLink = $("a#profile-name-edit", iElement);
            if (editLink.text() === "Change") {
              // Prevent line breaks. Note that this does not prevent copy paste line breaks
              $("#profile-name", iElement).attr("contenteditable", "true").keypress(function(e) { return e.which != 13; }).focus();
              editLink.text("Save");
              $("#profile-name-edit-cancel", iElement).show();
            } else if (editLink.text() === "Save") {
              // This way we have no line breaks.
              var newName = $("#profile-name", iElement).text();
              newName = $.trim(newName.replace("&nbsp;", " "));
              if (newName.length === 0) {
                $("body").statusmsg("open", "You must have a name!", {type: "warning", autoclose: 2000});
                $("#profile-name", iElement).text(scope.user.name).focus();
              } else {
                editLink.text("Saving...");
                // Change name will take care of changing rootScope and window.currentUser
                ProfileService.changeName(newName).done(function() {
                  scope.$apply(function(){
                    scope.user.name = newName;
                  });
                $("#profile-name", iElement).attr("content-editable", "false").off("keypress");
                editLink.text("Change");
                $("#profile-name-edit-cancel", iElement).hide();
                }).fail(function(xhr) {
                  $("body").statusmsg("open", "Name change failed: " + xhr.status, {type: "error", closable: true});
                  editLink.text("Save");
                });
              }
            }
          };

          scope.cancelEditName = function() {
            $("#profile-name").text(scope.user.name).off("keypress").attr("contenteditable", "false");
            $("#profile-name-edit").text("Change");
            $("#profile-name-edit-cancel").hide();
          };
        }
      };
    }]
  );


  angular.module("projecto").controller(
    "ProfileController", ["$scope", "ProfileService", "ProjectsService", function($scope, ProfileService, ProjectsService){
      $scope.user = angular.copy($scope.currentUser); // This can be changed later to view others.

      $scope.addEmail = $scope.removeEmail = $scope.updateEmail = function() {
        alert("This feature is not available yet :(");
      };
    }]
  );
})();