const path = require('path');

module.exports = function(config) {
    const coverageReporters = [];
    const coverageLoaders = [];

    if (config.coverage) {
        coverageReporters.push('coverage-istanbul');
        coverageLoaders.push({
            test: /\.ts$/,
            enforce: 'post',
            include: /packages\/[^\/]*\/src\.*/,
            use: [
                'cache-loader',
                {
                    loader: 'istanbul-instrumenter-loader',
                    options: { esModules: true }
                }
            ],
        });
    }

    const webpackConfig = {
        mode: 'development',
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    use: [
                        'cache-loader',
                        {
                            loader: 'ts-loader',
                            options: {
                                configFile: 'tsconfig-base.json',
                            },
                        },
                    ],
                },
                ...coverageLoaders,
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
        optimization: {
            removeAvailableModules: false,
            removeEmptyChunks: false,
            splitChunks: false,
        },
    }

    let port = 0;
    if (config.debug) {
        port = 9876;
        webpackConfig.devtool = 'inline-source-map';
    }

    config.set({
        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '',

        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['mocha', 'chai', 'sinon'],

        // list of files / patterns to load in the browser
        files: config.includeFiles ? config.includeFiles.split(',') : ['packages/**/test/**/*.ts'],

        // list of files / patterns to exclude
        exclude: [],

        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {
            'packages/**/test/**/*.ts': ['webpack'],
        },

        // test results reporter to use
        // possible values: 'dots', 'progress', 'spec'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: [...coverageReporters, 'mocha'],

        // web server port
        port: port,

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
        webpack: webpackConfig,

        coverageIstanbulReporter: {
            reports: [ 'html', 'text-summary', 'lcovonly' ],
            dir: path.join(__dirname, 'coverage'),
            fixWebpackSourcePaths: true,
            'report-config': {
                html: { outdir: 'html' }
            }
        },
        mochaReporter: {
            showDiff: true,
        },
    });
};
