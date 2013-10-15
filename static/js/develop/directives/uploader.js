"use strict";

(function() {
  angular.module("projecto").directive("uploader", [function() {
    return {
      restrict: "A",
      link: function(scope, element, attributes) {
        element.bind("change", function(e) {
          scope.$apply(function() {
            scope.$broadcast("files-added", element, e.target.files);
          });
        });
      }
    };
  }]);
})();
