"use strict";

let gulp = require('gulp');
let sass = require('gulp-sass');

gulp.task('sass', function () {
    return gulp.src('./public/lib/css/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('./public/lib/css'));
});


gulp.task('default', function() {
    gulp.watch('./public/lib/css/*.scss', ['sass']);
});