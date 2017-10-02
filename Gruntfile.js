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
            testi: {
                files: [' app.js', './Gruntfile.js'],
                tasks: ['jsbeautifier', 'run:node'],
            },
            sourcesy: {
                files: ['Gruntfile.js', 'app.js', '**/*.js'],
                tasks: ['run:node']
            }

        },
        "jsbeautifier": {
            files: ["./src/**/*.js"],
            options: {}
        }
    });


    grunt.registerTask('node', ['run:node']);
    grunt.registerTask('default', ['jsbeautifier']);
    grunt.registerTask('watchify', ['watch:testi']);
};
