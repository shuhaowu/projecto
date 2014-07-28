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

  var PRODSTATIC_PATH = grunt.option("prodstatic_path") || "prod_static";
  var APP_MIN_JS_PATH = PRODSTATIC_PATH + "/js/app.min.js";
  var LOGIN_MIN_JS_PATH = PRODSTATIC_PATH + "/js/login.min.js";
  var APP_MIN_CSS_PATH = PRODSTATIC_PATH + "/css/app.min.css";

  var uglify_files = {};
  uglify_files[APP_MIN_JS_PATH] = JS_SOURCES;
  uglify_files[LOGIN_MIN_JS_PATH] = LOGIN_JS;

  var cssmin_files = {};
  cssmin_files[APP_MIN_CSS_PATH] = ALL_CSS_SOURCES;

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
          helpers: false,
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
        files: uglify_files
      }
    },
    cssmin: {
      prod: {
        files: cssmin_files
      }
    },
    copy: {
      prod: {
        files: [
          {
            cwd: "static/fonts/",
            src: "**",
            dest: PRODSTATIC_PATH + "/fonts/",
            flatten: true,
            expand: true
          },
          {
            cwd: "static/img/",
            src: "**",
            dest: PRODSTATIC_PATH + "/img/",
            flatten: true,
            expand: true
          },
          {
            cwd: "static/js/vendor/",
            src: "**",
            dest: PRODSTATIC_PATH + "/js/vendor/",
            flatten: true,
            expand: true
          },
          {
            cwd: "static/js/",
            src: "foundation.min.js",
            dest: PRODSTATIC_PATH + "/js/",
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