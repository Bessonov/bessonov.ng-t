module.exports = function(grunt) {

	grunt.registerTask('dev', [ 'karma:development' ]);

	grunt.registerTask('travis', [
		'clean',
		'sync',
		'jshint',
		'concat',
		'karma:build',
		'uglify',
	]);

	grunt.registerTask('build', [
		'clean',
		'travis',
	]);

	grunt.loadNpmTasks('grunt-karma');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-istanbul-coverage');
	grunt.loadNpmTasks('grunt-npm2bower-sync');
	grunt.loadNpmTasks('grunt-contrib-clean');

	grunt.initConfig({
		pkg : grunt.file.readJSON('package.json'),

		sources : [ 'src/*.js', 'src/**/*.js' ],
		targetDir : 'dist',
		targetFile : '<%= targetDir %>/<%= pkg.target %>.js',
		targetFile_min : '<%= targetDir %>/<%= pkg.target %>.min.js',


		clean: {
			dist: ['<%= targetDir %>', 'test_out'],
		},

		karma : {
			options : {
				configFile : 'test/karma.conf.js',
			},
			development : {
				options : {
					autoWatch : true,
					singleRun : false,
					colors : false,
				}
			},
			build : {
			},
			minified : {
				options : {
					files : [ 'bower_components/angular/angular.js',
					          'bower_components/angular-sanitize/angular-sanitize.js',
					          'bower_components/angular-mocks/angular-mocks.js',
					          'test/unit/**/*.js', '<%= targetFile_min %>' ],
				}
			}
		},

		jshint : {
			beforeconcat : [ '<%= sources %>' ],
		},

		concat : {
			options: {
				banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
					'<%= grunt.template.today("yyyy-mm-dd") %> */' +
					'/**\n' +
					'* The MIT License (MIT)\n' +
					'* Copyright (c) 2016-<%= grunt.template.today("yyyy") %> Anton Bessonov\n' +
					'*/'
			},
			dist : {
				src : [ '<%= sources %>' ],
				dest : '<%= targetFile %>'
			}
		},

		uglify : {
			dist : {
				options: {
					sourceMap: true,
					banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
						'<%= grunt.template.today("yyyy-mm-dd") %> */' +
						'/**\n' +
						'* The MIT License (MIT)\n' +
						'* Copyright (c) 2016-<%= grunt.template.today("yyyy") %> Anton Bessonov\n' +
						'*/'
				},
				files : {
					'<%= targetFile_min %>' : [ '<%= targetFile %>' ]
				}
			}
		},

		sync : {
			all : {
				options : {
					sync : [
						'author',
						'name',
						'version',
						'description'],
				}
			}
		},
	});
};
