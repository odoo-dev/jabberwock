const path = require('path');

module.exports = function(config) {
    config.set({
        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '',

        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['mocha', 'chai', 'sinon'],

        // list of files / patterns to load in the browser
        files: config.includeFiles ? config.includeFiles.split(',') : ['test/**/*.test.ts'],

        // list of files / patterns to exclude
        exclude: [],

        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {
            'test/**/*.ts': ['webpack'],
        },

        // test results reporter to use
        // possible values: 'dots', 'progress', 'spec'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ['coverage-istanbul', 'spec'],

        // web server port
        port: 9876,

        // enable / disable colors in the output (reporters and logs)
        colors: true,

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,

        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,

        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: ['ChromeHeadless'],

        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: false,

        // Concurrency level
        // how many browser should be started simultaneous
        concurrency: Infinity,
        mine: {
            'text/x-typescript': ['ts'],
        },
        webpack: {
            mode: 'development',
            module: {
                rules: [
                    {
                        test: /\.ts$/,
                        use: [
                            {
                                loader: 'ts-loader',
                                options: { configFile: 'tsconfig-base.json' },
                            },
                        ],
                    },
                    {
                      test: /\.ts$/,
                      enforce: 'post',
                      include: path.resolve(`src/`),
                      exclude: [/node_modules/, path.resolve(__dirname, "test")],
                      loader: 'istanbul-instrumenter-loader',
                      options: { esModules: true }
                    },
                    {
                        test: /\.css$/i,
                        use: ['style-loader', 'css-loader'],
                    },
                    {
                        test: /\.xml$/i,
                        use: ['text-loader'],
                    },
                ],
            },
            resolve: {
                extensions: ['.ts', '.js'],
            },
        },

        coverageIstanbulReporter: {
            reports: [ 'html', 'text-summary', 'lcovonly' ],
            dir: path.join(__dirname, 'coverage'),
            fixWebpackSourcePaths: true,
            'report-config': {
                html: { outdir: 'html' }
            }
        },
    });
};
