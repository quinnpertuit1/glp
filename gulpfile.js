// https://hackernoon.com/how-to-automate-all-the-things-with-gulp-b21a3fc96885
// https://medium.com/superhighfives/deploying-to-github-pages-with-gulp-c06efc527de8

const gulp        = require('gulp');
const fs          = require('fs-extra');
const inject      = require('gulp-inject');
const bs          = require('browser-sync').create();
const htmlclean   = require('gulp-htmlclean');
const cleanCSS    = require('gulp-clean-css');
const concat      = require('gulp-concat');
const terser      = require('gulp-terser');
const del         = require('del');
const archieml    = require('gulp-archieml');

const sass        = require('gulp-sass');
sass.compiler     = require('node-sass');
const plugins     = require('gulp-load-plugins')();
const config = {};

const io          = require('indian-ocean');
const spelunk     = require('spelunk');

const ghPages = require('gulp-gh-pages');

var paths = {
  src: 'src/**/*',
  srcHTML: 'src/**/*.html',
  srcCSS: 'src/css/*.scss',
  srcAboutCSS: 'src/css/about/*.scss',
  srcJS: 'src/js/**/*.js',
  srcAssets: 'src/assets/**',
  srcData: 'src/_data/**/*.json',

  tmp: 'tmp',
  tmpIndex: 'tmp/index.html',
  tmpHTML: 'tmp/**/*.html',
  tmpCSS: 'tmp/*.css',
  tmpJS: 'tmp/**/*.js',
  tmpAssets: 'tmp/assets',
  tmpData: 'tmp/_data/',

  tmpAbout: 'tmp/about',

  dist: 'dist',
  distWork: 'dist/work',
  distWorkIndex: 'dist/work/**/index.html',
  distIndex: 'dist/index.html',
  distAboutIndex: 'dist/about/*.html',
  distAbout: 'dist/about',
  distCSS: 'dist/*.css',
  distJS: 'dist/**/*.js',
  distAssets: 'dist/assets',
  distData: 'dist/_data/'
};

gulp.task('html', function () {
  return gulp
    .src(paths.srcHTML)
    .pipe(plugins.ejs(config))
    .pipe(gulp.dest(paths.tmp));
});

gulp.task('css', function () {
  return gulp
    .src(paths.srcCSS)
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest(paths.tmp));
});

gulp.task('aboutcss', function () {
  return gulp
    .src(paths.srcAboutCSS)
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest(paths.tmpAbout));
});

gulp.task('js', function () {
  return gulp.src(paths.srcJS).pipe(gulp.dest(paths.tmp));
});

gulp.task('assets', function() {
  return gulp.src(paths.srcAssets).pipe(gulp.dest(paths.tmpAssets));
})

gulp.task('copy', gulp.series('html', 'css', 'js', 'assets','aboutcss'));

gulp.task('inject', gulp.series('copy', function () {
  var css = gulp.src(paths.tmpCSS);
  var js = gulp.src(paths.tmpJS);
  return gulp.src(paths.tmpHTML)
    .pipe(inject( css, { relative:true } ))
    .pipe(inject( js, { relative:true } ))
    .pipe(gulp.dest(paths.tmp));
}));

gulp.task('browser-sync', function () {
  bs.init({
    open: false,
    server: {
      baseDir: "./tmp/"
    }
  });
});

gulp.task('watch', gulp.parallel('browser-sync', function() {
  gulp.watch("src/*.html").on('change', gulp.series('html','inject',bs.reload));
  gulp.watch("src/_partials/*.html").on('change', gulp.series('html','inject',bs.reload));
  gulp.watch("src/css/*.scss").on('change', gulp.series('css','inject',bs.reload));
  gulp.watch("src/js/**.js").on('change', gulp.series('js','inject',bs.reload));
}));

gulp.task('html:dist', function () {
  return gulp.src(paths.srcHTML)
    .pipe(plugins.ejs(config))
    .pipe(htmlclean())
    .pipe(gulp.dest(paths.dist));
});

gulp.task('css:dist', function () {
  return gulp.src(paths.srcCSS)
    .pipe(concat('style.min.css'))
    .pipe(sass().on('error', sass.logError))
    .pipe(cleanCSS())
    .pipe(gulp.dest(paths.dist));
});

gulp.task('js:dist', function () {
  return gulp.src(paths.srcJS)
    .pipe(concat('script.min.js'))
    .pipe(terser())
    .pipe(gulp.dest(paths.dist));
});

gulp.task('assets:dist', function() {
  return gulp.src(paths.srcAssets).pipe(gulp.dest(paths.distAssets));
})

gulp.task('copy:dist', gulp.series('html:dist', 'css:dist', 'js:dist', 'assets:dist'));

gulp.task('inject:dist', gulp.series('copy:dist', function () {
  var css = gulp.src(paths.distCSS);
  var js = gulp.src(paths.distJS);
  return gulp.src(paths.distIndex)
    .pipe(inject( css, { relative:true } ))
    .pipe(inject( js, { relative:true } ))
    .pipe(gulp.dest(paths.dist));
}));

gulp.task('inject:distAbout', gulp.series('copy:dist','inject:dist',function () {
  var css = gulp.src(paths.distCSS);
  var js = gulp.src(paths.distJS);
  return gulp.src(paths.distAboutIndex)
    .pipe(inject( css, { relative:true } ))
    .pipe(inject( js, { relative:true } ))
    .pipe(gulp.dest(paths.distAbout));
}));

gulp.task('inject:distWork', gulp.series('copy:dist','inject:dist', 'inject:distAbout', function () {
  var css = gulp.src(paths.distCSS);
  var js = gulp.src(paths.distJS);
  return gulp.src(paths.distWorkIndex)
    .pipe(inject( css, { relative:true } ))
    .pipe(inject( js, { relative:true } ))
    .pipe(gulp.dest(paths.distWork));
}));

gulp.task('inject:distAll', gulp.series('inject:distWork'));

gulp.task('build', gulp.series('inject:distAll'));

gulp.task('deploy', gulp.series('build',function() {
  return ghpages.publish('dist', function(err) {});
}));

gulp.task('clean', function () {
  return del([paths.tmp, paths.dist, 'src/work/**']);
});

gulp.task('aml', () => gulp.src('src/aml/*.aml')
  .pipe(archieml())
  .pipe(gulp.dest('src/aml/json/')));

var ghpages = require('gh-pages');
