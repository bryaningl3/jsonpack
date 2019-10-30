const gulp = require('gulp');

const browserify = require('browserify'),
	buffer = require('vinyl-buffer'),
	bump = require('gulp-bump'),
	git = require('gulp-git'),
	glob = require('glob'),
	jasmine = require('gulp-jasmine'),
	jshint = require('gulp-jshint'),
	source = require('vinyl-source-stream');

const fs = require('fs');

function getVersionFromPackage() {
	return JSON.parse(fs.readFileSync('./package.json', 'utf8')).version;
}

function getVersionForComponent() {
	return getVersionFromPackage().split('.').slice(0, 2).join('.');
}

gulp.task('ensure-clean-working-directory', (cb) => {
	gitStatus((err, status) => {
		if (err, !status.clean) {
			throw new Error('Unable to proceed, your working directory is not clean.');
		}

		cb();
	});
});

gulp.task('bump-version', () => {
	return gulp.src(['./package.json'])
		.pipe(bump({type: 'patch'}))
		.pipe(gulp.dest('./'));
});

gulp.task('commit-changes', () => {
	return gulp.src([ './', './package.json', './index.js', ])
		.pipe(git.add())
		.pipe(git.commit('Release. Bump version number'));
});

gulp.task('push-changes', (cb) => {
	git.push('origin', 'master', cb);
});

gulp.task('create-tag', (cb) => {
	const version = getVersionFromPackage();

	git.tag(version, 'Release ' + version, (error) => {
		if (error) {
			return cb(error);
		}

		git.push('origin', 'master', { args: '--tags' }, cb);
	});
});

gulp.task('build-browser-tests', () => {
	return browserify({ entries: glob.sync('test/specs/**/*.js') })
		.transform('babelify', {presets: ['es2015']})
		.bundle()
		.pipe(source('jsonpack-tests-' + getVersionForComponent() + '.js'))
		.pipe(buffer())
		.pipe(gulp.dest('test/dist'));
});

gulp.task('execute-browser-tests', () => {
	return gulp.src('test/dist/jsonpack-tests-' + getVersionForComponent() + '.js')
		.pipe(jasmine());
});

gulp.task('execute-node-tests', () => {
	return gulp.src(['index.js', 'test/specs/**/*.js'])
		.pipe(jasmine());
});

gulp.task('execute-tests', gulp.series(
	'build-browser-tests',
	'execute-browser-tests',
	'execute-node-tests'
));

gulp.task('release', gulp.series(
		'ensure-clean-working-directory',
		'build-browser-tests',
		'execute-browser-tests',
		'execute-node-tests',
		'bump-version',
		'commit-changes',
		'push-changes',
		'create-tag'
));

gulp.task('lint', () => {
	return gulp.src([ './**/*.js', './test/specs/**/*.js', '!./node_modules/**', '!./dist/**', '!./test/dist/**' ])
		.pipe(jshint({'esversion': 6}))
		.pipe(jshint.reporter('default'));
});

gulp.task('test', gulp.series('execute-tests'));

gulp.task('default', gulp.series('lint'));