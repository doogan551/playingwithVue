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
                },
                files: [{
                    expand: true,
                    cwd: 'public/',
                    src: ['js/**/*.js'],
                    dest: 'dist/public/',
                    ext: '.js'
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