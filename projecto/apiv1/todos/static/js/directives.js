"use strict";

(function() {
  var module = angular.module("projecto");

  module.directive("todoItem", ["$window", "$filter", "toast", function($window, $filter, toast) {
    return {
      restrict: "E",
      replace: true,
      scope: {
        todo: "=",
        hide_comment_link: "=hideCommentLink",
        project: "=",
      },
      templateUrl: "/static/todos/partials/todoitem.html",
      link: function(scope, elem, attrs) {
        scope.draft = null;

        scope.done = function() {
          var req = scope.todo.done();
          req.catch(function(data, status) {
            toast.error("Failed to mark done", status);
          });
        };

        scope.toggle = function(event, force_state, noanimations) {
          if (event) {
            event.preventDefault();
          }

          var details = elem.children().children(".todos-todo-body");

          if (details.css("display") === "none") {
            if (force_state != "close") {
              if (noanimations) {
                details.show();
              } else {
                details.slideDown();
              }
            }
          } else {
            if (force_state != "open") {
              if (noanimations) {
                details.hide();
              } else {
                details.slideUp();
              }
            }
          }
        };

        scope.edit = function() {
          scope.toggle(null, "open");
          scope.draft = scope.todo.duplicate();
          if (scope.todo.data.due) {
            scope.draft.data.due = $filter("absoluteTime")(scope.todo.data.due);
          }

          scope.$emit("todo.enter_edit", scope.todo.key, scope.draft);
        };

        scope.cancel_edit = function(justDoIt) { // Nike.
          if (justDoIt || $window.confirm("Are you sure you want to cancel? You will lose all changes!")) {
            scope.$emit("todo.exit_edit", scope.draft.key);
            scope.draft = null;
          }
        };

        scope.save = function() {
          if (!scope.draft) {
            return toast.wtf("scope.draft does not exist while trying to save todo? Wat.");
          }

          if (scope.draft.data.tags)
            scope.draft.data.tags = helpers.ensure_array(scope.draft.data.tags);

          toast.info("Saving...");
          var req = scope.draft.save();
          var success = function(data) {
            scope.todo = scope.draft;
            scope.$emit("todo.saved", scope.todo);
            scope.cancel_edit(true);
            toast.success("Saved");
            scope.toggle(null, "open");
          };

          var error = function(data, status) {
            toast.error("Failed to save", status);
          };
          req.then(success, error);
        };

        scope.archive = function() {
          toast.info("Archiving...");
          var req = scope.todo.archive();
          var success = function() {
            toast.close();
            scope.$emit("todo.archived", scope.todo.key);
          };

          var error = function(data, status) {
            toast.error("Failed to archive todo", status);
          };
          req.then(success, error);
        };

        scope.delete = function() {
          if (!$window.confirm("Are you sure you want to delete this todo?")) {
            return;
          }

          toast.info("Deleting...");
          var req = scope.todo.delete();
          var success = function() {
            toast.close();
            scope.$emit("todo.deleted", scope.todo.key);
          };

          var error = function(data, status) {
            toast.error("Failed to delete todo", status);
          };
          req.then(success, error);
        };
      }
    };
  }]);
})();
