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

  var LOGIN_JS = ["static/js/login.js"];

  var ALL_OUR_JS_SOURCES = JS_SOURCES.concat(JS_TEST_SOURCES);

  var VENDOR_JS_SOURCES = [
    "static/js/vendor/**/*.js",
    "static/js/foundation.min.js",
    "tests/jstests/angular-mocks.js"
  ];

  var ALL_JS_SOURCES = ALL_OUR_JS_SOURCES.concat(LOGIN_JS).concat(VENDOR_JS_SOURCES);

  var ALL_CSS_SOURCES = [
    "static/css/base.css",
    "static/css/app.css",
    "projecto/apiv1/**/static/css/*.css"
  ];

  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    jshint: {
      files: ALL_OUR_JS_SOURCES.concat(["Gruntfile.js"]).concat(LOGIN_JS),
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
    },
    karma: {
      unit: {
        configFile: "karma.config.js",
        background: true
      },
      produnit: {
        configFile: "ci-karma.config.js"
      }
    },
    uglify: {
      prod: {
        files: {
          "prod_static/js/app.min.js": JS_SOURCES,
          "prod_static/js/login.min.js": LOGIN_JS
        }
      }
    },
    cssmin: {
      prod: {
        files: {
          "prod_static/css/app.min.css": ALL_CSS_SOURCES
        }
      }
    },
    copy: {
      prod: {
        files: [
          {
            cwd: "static/fonts/",
            src: "**",
            dest: "prod_static/fonts/",
            flatten: true,
            expand: true
          },
          {
            cwd: "static/img/",
            src: "**",
            dest: "prod_static/img/",
            flatten: true,
            expand: true
          },
          {
            cwd: "static/js/vendor/",
            src: "**",
            dest: "prod_static/js/vendor/",
            flatten: true,
            expand: true
          },
          {
            cwd: "static/js/",
            src: "foundation.min.js",
            dest: "prod_static/js/",
            flatten: true,
            expand: true
          }
        ],
      }
    },
    watch: {
      jswatch: {
        files: ALL_JS_SOURCES,
        tasks: ["karma:unit:run", "jshint"]
      }
    },
  });

  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-copy');

  grunt.registerTask("default", ["jshint", "karma:unit:start", "watch"]);
  grunt.registerTask("prod", ["uglify:prod", "cssmin:prod", "copy:prod", "karma:produnit"]);
};