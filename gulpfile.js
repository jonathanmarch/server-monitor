var gulp = require('gulp');

var concat = require('gulp-concat');
var gulpif = require('gulp-if');
var jshint = require('gulp-jshint');
var ngAnnotate = require('gulp-ng-annotate');
var sass = require('gulp-sass');
var server = require('gulp-express');
var stylish = require('jshint-stylish');
var uglify = require('gulp-uglify');
var templateCache = require('gulp-angular-templatecache');

var compressing = false;

gulp.task('sass', function () {
  return gulp.src('client/sass/*.scss')
        .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
        .pipe(concat('production.css'))
        .pipe(gulp.dest('public/css'));
});

gulp.task('server', function () {
    server.run(['server/app.js'], [], false);
});

gulp.task('lint', function() {
  return gulp.src('client/js/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('scripts', function () {
  return gulp.src(['client/js/lib/*.js', 'client/js/*.js'])
        .pipe(ngAnnotate({ single_quotes: true }))
        .pipe(gulpif(compressing, uglify()))
        .pipe(concat('production.js'))
        .pipe(gulp.dest('public/js'));
});

gulp.task('templates', function () {
  return gulp.src('client/templates/**/*.html')
    .pipe(templateCache({ standalone: true }))
    .pipe(gulp.dest('client/js'));
});


gulp.task('watch', function() {
    gulp.watch('client/sass/**/*.scss', ['sass']);
    gulp.watch('client/templates/*.html', ['templates']);
    gulp.watch(['client/js/lib/*.js', 'client/js/*.js'], ['lint', 'scripts']);
    gulp.watch(['server/app.js','server/**/*.js'], ['server']);
});

gulp.task('default', ['server', 'sass', 'lint', 'scripts', 'templates', 'watch']);
