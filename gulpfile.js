var gulp = require("gulp");
var pegjs = require("gulp-pegjs");
var tspegjs = require("ts-pegjs");
var ext_replace = require("gulp-ext-replace");

gulp.task("generateParsers", function() {
  return gulp
    .src("src/**/*.pegjs")
    .pipe(
      pegjs({
        format: "commonjs",
        exportVar: "parser",
        plugins: []
      })
    )
    .pipe(ext_replace(".js"))
    .pipe(gulp.dest("dist"));
});
