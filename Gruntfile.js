"use strict";

module.exports = function(grunt) {
  var JS_SOURCES = [
    "static/js/develop/app.js",
    "static/js/develop/**/*.js",
    "projecto/apiv1/**/static/js/*.js",
  ];

  var JS_TEST_SOURCES = [
    "tests/jstests/testinit.js",
    "projecto/apiv1/**/jstests/*.js",
    "tests/jstests/others/**/*.js"
  ];

  var ALL_OUR_JS_SOURCES = JS_SOURCES.concat(JS_TEST_SOURCES);

  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    jshint: {
      files: ALL_OUR_JS_SOURCES.concat(["Gruntfile.js"]),
      options: {
        browser: true,
        globalstrict: true,
        sub: true,
        expr: true,
        boss: true,
        globals: {
          // Jasmine
          afterEach: false,
          beforeEach: false,
          describe: false,
          expect: false,
          it: false,
          jasmine: false,
          spyOn: false,

          $: false,
          jQuery: false,
          angular: false,
          datastructures: false,
          module: false,
          // Include order issue?
          commonMocked: false,
          testutils: false,
          console: false,

          WebKitBlobBuilder: false
        }
      }
    }
  });

  grunt.loadNpmTasks("grunt-contrib-jshint");

  grunt.registerTask("default", ["jshint"]);
};