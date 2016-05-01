module.exports = function(config) {
	var browsers = {
		SL_Chrome: {
			base: 'SauceLabs',
			browserName: 'chrome'
		},
		SL_Chrome: {
			base: 'SauceLabs',
			browserName: 'firefox'
		},
		SL_Chrome: {
			base: 'SauceLabs',
			browserName: 'opera'
		},
		SL_IE9: {
			base: 'SauceLabs',
			browserName: 'internet explorer',
			version: '9'
		},
		SL_IE10: {
			base: 'SauceLabs',
			browserName: 'internet explorer',
			version: '10'
		},
	};

	config.set({
		basePath: '../',
		autoWatch: false,
		singleRun: true,
		logLevel: 'LOG_DEBUG',
		colors: true,
		frameworks: [ 'jasmine' ],
		browsers: Object.keys(browsers),
		reporters: [
			'progress',
			'coverage',
		],

		// https://github.com/karma-runner/karma-sauce-launcher/issues/73
		sauceLabs: {
			testName: 'Web App Unit Tests',
			tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER,
			username: process.env.SAUCE_USERNAME,
			accessKey: process.env.SAUCE_ACCESS_KEY,
			startConnect: false,
			connectOptions: {
				port: 5757,
				logfile: 'sauce_connect.log'
			}
		},

		files: [
			'bower_components/angular/angular.js',
			'bower_components/angular-mocks/angular-mocks.js',
			'bower_components/angular-i18n/angular-locale_ru.js',
			'src/*.js',
			'src/**/*.js',
			'test/unit/**/*.js'
		],

		preprocessors: {
			'src/**/*.js': ['coverage']
		},

		customLaunchers: browsers,

		plugins: [
			'karma-coverage',
			'karma-chrome-launcher',
			'karma-firefox-launcher',
			'karma-jasmine',
			'karma-webdriver-launcher',
			'karma-sauce-launcher'
		],

		junitReporter: {
			outputFile: 'test_out/unit.xml',
			suite: 'unit'
		},

		coverageReporter: {
			dir: 'test_out/coverage',
			subdir: function(browser) {
				return browser.toLowerCase().split(/[ /-]/)[0];
			},
			reporters: [{
				type: 'html',
					subdir: function(browser) {
						return browser.toLowerCase().split(/[ /-]/)[0];
					},
			}, {
				type: 'text'
			}, {
				type: 'cobertura'
			}]
		}

	});
};