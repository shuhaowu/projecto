"use strict";

(function(){
  angular.module("projecto").directive(
    "profileName", ["toast", "title", "ProfileService", function(toast, title, ProfileService){
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
                toast.warn("You must have a name.");
                $("#profile-name", iElement).text(scope.user.name).focus();
              } else {
                editLink.text("Saving...");
                // Change name will take care of changing rootScope and window.currentUser

                var req = ProfileService.change_name(newName);
                req.success(function() {
                  scope.user.name = newName;
                  title(scope.user.name);

                  $("#profile-name", iElement).attr("contenteditable", "false").off("keypress");
                  editLink.text("Change");
                  $("#profile-name-edit-cancel", iElement).hide();
                  $("#name-change-alert").remove();
                });

                req.error(function(data, status) {
                  toast.error("Failed to change name", status);
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
    "ProfileController", ["$scope", "title", "ProfileService", function($scope, title, ProfileService){
      $scope.user = angular.copy($scope.currentUser); // This can be changed later to view others.

      title($scope.user.name);

      $scope.addEmail = $scope.removeEmail = $scope.updateEmail = function() {
        alert("This feature is not available yet :(");
      };
    }]
  );
})();