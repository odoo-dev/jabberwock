const path = require('path');

module.exports = {
    mode: 'development',
    entry: {
        globals: './examples/globals.js',
        index: './examples/index.ts',
        devTools: './examples/devtools.ts',
    },
    devtool: 'inline-source-map',
    output: {
        path: path.resolve(__dirname, 'build/webpack'),
        filename: '[name].js',
        chunkFilename: '[name].chunk.js',
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    devServer: {
        contentBase: './',
    },
    // optimization
    optimization: {
        splitChunks: {
            cacheGroups: {
                default: false,
                vendors: false,
                // owl chunk
                owl: {
                    name: 'owl.lib',
                    // sync + async chunks
                    chunks: 'all',
                    // import file path containing node_modules
                    test: /owl/,
                },
                core: {
                    name: 'core',
                    // sync + async chunks
                    chunks: 'all',
                    // import file path containing node_modules
                    test: /core/,
                },
            },
        },
    },
};
