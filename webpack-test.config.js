const path = require('path');

module.exports = {
    mode: 'development',
    // entry: ['./src/index.ts', './test/foo.test.ts'],
    devtool: 'inline-source-map',
    module: {
        rules: [
            {
                test: /\.ts?$/,
                use: 'awesome-typescript-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    output: {
        filename: 'bundle-webpack.js',
        path: path.resolve(__dirname, 'build', 'webpack'),
    },
    optimization: {
        splitChunks: {
            chunks: 'all',
        },
    },
};
