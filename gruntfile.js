var timer = require('grunt-timer');
module.exports = function (grunt) {
    timer.init(grunt, {
        // deferLogs: true,
        deferLogsAndWriteInLine: true,
        friendlyTime: true
    });

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        uglify: {
            build: {
                options: {
                    report: 'min'
                    // mangle: false,
                    // compress: {
                    //     keep_fnames: true,
                    //     sequences: false,
                    //     hoist_funs: false,
                    //     properties: false,
                    //     dead_code: false,
                    //     booleans: false,
                    //     unused: false,
                    //     join_vars: false,
                    //     cascade: false
                    // }
                },
                files: [{
                    expand: true,
                    cwd: 'public/js',
                    src: ['**/*.js', '!**/lib/angular.js', '!**displays/*.js'],//for now, ignore displays and angular, as it messes all sorts of stuff up
                    dest: 'dist/public/js'
                    // ext: '.js',
                    // rename: function (destBase, destPath) {
                    //     return destBase + destPath;
                    // }
                }]
            }
        },

        cssmin: {
            options: {
                report: 'min'
            },
            build: {
                files: [{
                    expand: true,
                    cwd: 'public/',
                    src: ['css/**/*.css'],
                    dest: 'dist/public/',
                    ext: '.css'
                }]
            }
        },

        cacheBust: {
            options: {
                assets: ['{js,css}/**/*.{js,css}'],
                baseDir: './public/',
                queryString: true,
                hash: 'ver=<%= pkg.version %>',
                jsonOutput: true
            },
            build: {
                files: [{
                    expand: true,
                    src: ['dist/views/**/*.jade']
                }]
            }
        },

        copy: {
            build: {
                files: [{
                    expand: true,
                    src: ['views/**/*.jade'],
                    dest: 'dist/',
                    filter: 'isFile'
                }]
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-cache-bust');
    grunt.loadNpmTasks('grunt-newer');

    grunt.registerTask('build', ['newer:uglify', 'newer:cssmin', 'copy', 'cacheBust']);
};