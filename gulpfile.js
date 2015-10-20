'use strict';

/**
 * Gulp dependencies.
 */

var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();

/**
 * Build variables.
 */

var paths = {
  src:   ['lib/**/*.js'],
  spec:  ['test/**/*.spec.js'],
  js:    ['lib/**/*.js', 'test/**/*.js']
};

/**
 * Helpers functions.
 */

var open = function(path) {
  return plugins.shell.task([
    'echo Opening ' + path,
    'open ' + path
  ]);
};

/**
 * Linting on source and tests.
 */

gulp.task('lint', function() {
  return gulp.src(paths.js.concat('gulpfile.js'))
    .pipe(plugins.jshint())
    .pipe(plugins.count('Linted (' + paths.js + ') ## files'))
    .pipe(plugins.jshint.reporter('jshint-stylish'))
    .pipe(plugins.jshint.reporter('fail'));
});

/**
 * Run mocha tests and istanbul coverage report.
 */

gulp.task('test', ['lint'], function(cb) {
  var istanbul = plugins.istanbul;
  gulp.src(paths.src)
    .pipe(istanbul({
      dir: './coverage',
      reporters: [ 'lcov', 'json', 'text', 'text-summary', 'clover' ],
      reportOpts: { dir: './coverage' }
    }))
    .pipe(istanbul.hookRequire())
    .on('finish', function () {
      return gulp.src(paths.spec)
        .pipe(plugins.mocha({
          reporter: 'spec',
          require: ['./test/helpers/chai']
        }))
        .pipe(istanbul.writeReports({
          reporters: [
            'lcov',
            'json',
            'text',
            'text-summary',
            'clover'
          ]
        }))
        .pipe(istanbul.enforceThresholds({ thresholds: { global: 90 } })) // Enforce a coverage of at least 90%
        .on('end', cb);
    });
});

/**
 * Open coverage report.
 */

gulp.task('coverage', ['test'], open('coverage/lcov-report/index.html'));


/**
 * Create docco documentation.
 */

gulp.task('docs', ['test'], function() {

  gulp.src(paths.src)
    .pipe(plugins.docco({
      layout: 'classic'
    }))
    .pipe(gulp.dest('./docs/docco'));

});

/**
 * Open coverage report.
 */

gulp.task('docs.open', ['docs'], open('docs/docco/index.html'));

/**
 * Watch source code and run default tasks.
 */

gulp.task('watch', ['default'], function() {
  gulp.watch(paths.js.concat(paths.spec), ['default']);
});

/**
 * Default tasks.
 */

gulp.task('default', ['lint','test']);
