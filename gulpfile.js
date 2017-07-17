var gulp = require('gulp');

var jshint = require('gulp-jshint');
var babel = require('gulp-babel');
var sass = require('gulp-sass');
var connect = require('gulp-connect');
var uglify = require('gulp-uglify');
var ngmin = require('gulp-ngmin');
var minifyHtml = require('gulp-minify-html');
var htmlmin = require('gulp-htmlmin');
var minifyCss = require('gulp-minify-css');
var usemin = require('gulp-usemin');
var rev = require('gulp-rev');
var clean = require('gulp-clean');
var del = require('del');

var paths = {
	scripts: 'src/**/*.js',
	html: [
	'./src/**/*.html',
	'!./src/index.html'
	],
	scss: './src/scss/*.scss',
	css: './src/css',
	index: './src/index.html',
	build: './build/'
};

// JavaScript linting
gulp.task('jshint', function(){
	return gulp.src(paths.scripts)
	.pipe(jshint())
	.pipe(jshint.reporter('default'));
});

// Compile SASS
gulp.task('sass', function(){
	return gulp.src(paths.scss)
	.pipe(sass())
	.pipe(gulp.dest(paths.css));
});

// Watch
gulp.task('watch', function(){
	gulp.watch(paths.scripts, ['jshint']);
	gulp.watch(paths.scss, ['sass']);
});

// Build
gulp.task('clean', function(){
	del(paths.build);
});

gulp.task('htmlmin', [ 'clean' ], function(){
	var allHtml = paths.index.concat(paths.html);
	return gulp.src( './src/**/*.html' )
		.pipe(htmlmin({collapseWhitespace: true}))
		.pipe(gulp.dest( paths.build ));
});

gulp.task('usemin', [ 'htmlmin' ], function(){
	return gulp.src( paths.index )
		.pipe(usemin({
			css: [ minifyCss(), 'concat' ],
			js: [ ngmin(), uglify() ]
		}))
		.pipe(gulp.dest( paths.build ));
});

gulp.task('indexmin', [ 'usemin' ], function(){
	var allHtml = paths.index.concat(paths.html);
	return gulp.src( './build/*.html' )
		.pipe(htmlmin({collapseWhitespace: true}))
		.pipe(gulp.dest( paths.build ));
});

gulp.task('build', ['indexmin']);

//Default
gulp.task('default', ['jshint', 'sass', 'watch']);

