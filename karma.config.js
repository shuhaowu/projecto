module.exports = function(config) {
  config.set({

    // base path, that will be used to resolve files and exclude
    basePath: '',


    // frameworks to use
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [
      'static/js/vendor/jquery-1.9.1.min.js',
      'static/js/foundation.min.js',
      'static/js/vendor/statusmsg.js',
      'tests/jstests/testinit.js', // initialize the statusmsg stuff.
      'static/js/vendor/angular.min.js',
      'tests/jstests/angular-mocks.js',
      'static/js/develop/**/*.js',
      'projecto/apiv1/**/static/js/*.js',
      'projecto/apiv1/**/jstests/*.js',
      'tests/jstests/others/**/*.js',
      "projecto/apiv1/**/static/partials/*.html",
    ],

    preprocessors: {
      "projecto/apiv1/**/static/partials/*.html": ["ng-html2js"]
    },

    ngHtml2JsPreprocessor: {
      cacheIdFromPath: function(filepath) {
        filepath = filepath.replace("projecto/apiv1/", "/static/");
        filepath = filepath.replace("/static/partials/", "/partials/");
        return filepath;
      },
      moduleName: "projecto"
    },

    // list of files to exclude
    exclude: [

    ],


    // test results reporter to use
    // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera (has to be installed with `npm install karma-opera-launcher`)
    // - Safari (only Mac; has to be installed with `npm install karma-safari-launcher`)
    // - PhantomJS
    // - IE (only Windows; has to be installed with `npm install karma-ie-launcher`)
    browsers: ['Chrome', 'Firefox', 'PhantomJS'],


    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 60000,


    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false
  });
};
