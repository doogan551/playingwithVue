var gulp = require('gulp');
var uglify = require('gulp-uglify');
var minifyCss = require('gulp-minify-css');
var rimraf = require('rimraf');
var gulpRimraf = require('gulp-rimraf');
var zip = require('gulp-zip');
var watch = require('gulp-watch');
var batch = require('gulp-batch');
var changed = require('gulp-changed');

var bases = {
  app: '/**',
  dist: 'dist/',
};

var paths = {
  js: ['public/js/**/*.js', '!public/js/lib/**/*.js'],
  styles: ['public/css/**/*.css', '!public/css/lib/**/*.css'],
  html: ['public/js/**/*', '!public/js/**/*.js'],
  extras: ['*.js', 'web.config', 'config/**/*', 'controllers/**/*', 'helpers/**/*', 'lib/**/*', 'models/**/*', 'socket/**/*', 'views/**/*', 'public/img/**/*', 'public/js/lib/**/*', 'public/css/**/*', '!public/css/**/*.css'],
  cleanse: ['tmp/**/*.*', 'scripts/**/*', 'logs/**/*', 'dist/*']
};

gulp.task('clean', function() {
  return gulp.src(paths.cleanse, {
      read: false
    })
    .pipe(gulpRimraf());
});

gulp.task('compress', ['clean', 'copy'], function() {
  return gulp.src(paths.js, {
      base: "."
    })
    .pipe(uglify())
    .pipe(gulp.dest(bases.dist));
});

gulp.task('minify-css', ['clean', 'copy'], function() {
  return gulp.src(paths.styles, {
      base: "."
    })
    .pipe(minifyCss({
      compatibility: 'ie8',
      processImport: false
    }))
    .pipe(gulp.dest(bases.dist));
});

gulp.task('copy', ['clean'], function() {
  console.log('copy');
  var copies = paths.extras.concat(paths.cleanse.slice(0, paths.cleanse.length-1));
  // Copy html
  gulp.src(paths.html, {
      base: "."
    })
    .pipe(gulp.dest(bases.dist));

  gulp.src(copies, {
      base: "."
    })
    .pipe(gulp.dest(bases.dist));
});

gulp.task('zip', function() {
  return gulp.src('dist/**/*')
    .pipe(zip('archive.zip'))
    .pipe(gulp.dest('.'));
});

// A development task to run anytime a file changes
gulp.task('watch', function() {
  return gulp.src(paths.extras, {
      base: '.'
    })
    .pipe(watch(paths.extras))
    .pipe(gulp.dest(bases.dist));
});

gulp.task('default', ['copy', 'compress', 'minify-css']);