module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-run');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks("grunt-jsbeautifier");
    grunt.loadNpmTasks('grunt-open');


    grunt.initConfig({
        run: {
            options: {
                // Task-specific options go here.
                wait: false
            },
            node: {
                cmd: 'node',
                args: [
                    'app.js'
                ]
            }
        },
        open: {
            dev: {
                path: 'http://127.0.0.1:3000',
                app: 'Chrome'
            },
        },
        watch: {
            options: {
                spawn: false
            },
            beautify: {
                files: ['Gruntfile.js', './src/**/*.js'],
                tasks: ['jsbeautifier']
            }

        },
        jsbeautifier: {
            files: ['Gruntfile.js', './src/**/*.js'],
            options: {}
        }
    });


    grunt.registerTask('node', ['run:node']);
    grunt.registerTask('beautify', ['jsbeautifier']);
    grunt.registerTask('default', ['watch:beautify']);
};
