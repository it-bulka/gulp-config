const gulp = require('gulp');

// HTML
const fileInclude = require('gulp-file-include');
const htmlclean = require('gulp-htmlclean');
const webpHTML = require('gulp-webp-html');

// SASS
const sass = require('gulp-sass')(require('sass'));
const sassGlob = require('gulp-sass-glob');
const autoprefixer = require('gulp-autoprefixer');
const csso = require('gulp-csso');
const webpCss = require('gulp-webp-css');

const server = require('gulp-server-livereload');
const clean = require('gulp-clean');
const fs = require('fs');
const sourceMaps = require('gulp-sourcemaps');
const groupMedia = require('gulp-group-css-media-queries');
const plumber = require('gulp-plumber');
const notify = require('gulp-notify');
const webpack = require('webpack-stream');
const babel = require('gulp-babel');
const changed = require('gulp-changed');

// Images
const imagemin = require('gulp-imagemin');
const avif = require('gulp-avif')
const webp = require('gulp-webp');
const svgSprite = require("gulp-svg-sprite");


gulp.task('clean:build', function (done) {
	if (fs.existsSync('./build/')) {
		return gulp
			.src('./build/', { read: false })
			.pipe(clean({ force: true }));
	}
	done();
});

const fileIncludeSetting = {
	prefix: '@@',
	basepath: '@file',
};

const plumberNotify = (title) => {
	return {
		errorHandler: notify.onError({
			title: title,
			message: 'Error <%= error.message %>',
			sound: false,
		}),
	};
};

gulp.task('html:build', function () {
	return gulp
		.src(['./src/html/**/*.html', '!./src/html/blocks/*.html'])
		.pipe(changed('./build/'))
		.pipe(plumber(plumberNotify('HTML')))
		.pipe(fileInclude(fileIncludeSetting))
		.pipe(webpHTML())
		.pipe(htmlclean())
		.pipe(gulp.dest('./build/'));
});

gulp.task('sass:build', function () {
	return gulp
		.src('./src/scss/*.scss')
		.pipe(changed('./build/css/'))
		.pipe(plumber(plumberNotify('SCSS')))
		.pipe(sourceMaps.init())
		.pipe(autoprefixer())
		.pipe(sassGlob())
		.pipe(webpCss())
		.pipe(groupMedia())
		.pipe(sass({ outputStyle: 'compressed' }))
		.pipe(csso())
		.pipe(sourceMaps.write())
		.pipe(gulp.dest('./build/css/'));
});

const svgSpriteConfig = {
	mode: {
		symbol: { // Це налаштування створює спрайт у форматі <symbol>
			sprite: "../sprite.svg", // Шлях до створеного спрайту
			example: false // Якщо потрібно, можна створити демо-сторінку з прикладами
		}
	}
};

gulp.task('images:build', function () {
	return gulp
		.src('./src/img/**/*')
		.pipe(changed('./build/img/'))
		.pipe(avif({ quality: 50 }))
		.pipe(gulp.dest('./build/img/'))
		.pipe(gulp.src('./src/img/**/*'))
		.pipe(changed('./build/img/'))
		.pipe(webp())
		.pipe(gulp.dest('./build/img/'))
		.pipe(gulp.src('./src/img/!**!/!*'))
		.pipe(changed('./build/img/'))
		.pipe(imagemin({ verbose: true }))
		.pipe(gulp.dest('./build/img/'));
});

gulp.task('sprite:build', function () {
	return gulp
		.src('./build/**/*.svg')
		.pipe(imagemin([
			imagemin.svgo({
				plugins: [
					{ removeViewBox: false },
					{ removeEmptyAttrs: true },
					{ removeAttrs: { attrs: '(fill|stroke|style|class)' } }
				]
			})
		]))
		.pipe(svgSprite(svgSpriteConfig))
		.pipe(gulp.dest('./build/img/'));
})

gulp.task('fonts:build', function () {
	return gulp
		.src('./src/fonts/**/*')
		.pipe(changed('./build/fonts/'))
		.pipe(gulp.dest('./build/fonts/'));
});

gulp.task('files:build', function () {
	return gulp
		.src('./src/files/**/*')
		.pipe(changed('./build/files/'))
		.pipe(gulp.dest('./build/files/'));
});

gulp.task('js:build', function () {
	return gulp
		.src('./src/js/*.js')
		.pipe(changed('./build/js/'))
		.pipe(plumber(plumberNotify('JS')))
		.pipe(babel())
		.pipe(webpack(require('./../webpack.config.js')))
		.pipe(gulp.dest('./build/js/'));
});

const serverOptions = {
	livereload: true,
	open: true,
};

gulp.task('server:build', function () {
	return gulp.src('./build/').pipe(server(serverOptions));
});
