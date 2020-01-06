// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');

module.exports = {
    mode: 'development',
    entry: {
        'index': './examples/index/index.ts',
        'koi-example': './examples/koi/koi.ts',
        'get-keys-index': './examples/getKeys/index.ts',
    },
    devtool: 'inline-source-map',
    output: {
        path: path.resolve(__dirname, 'build/webpack'),
        filename: '[name].js',
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: [
                    {
                        loader: 'ts-loader',
                        options: { configFile: 'tsconfig.json' },
                    },
                ],
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
    devServer: {
        contentBase: './examples',
        disableHostCheck: true,
    },
    // We might require this configuration in the future to
    // bundle the differents parts of the editor.
    // We do not need the following configuration now.
    //
    // optimization: {
    //     splitChunks: {
    //         cacheGroups: {
    //             default: false,
    //             vendors: false,
    //             owl: {
    //                 name: 'owl.lib',
    //                 chunks: 'all',
    //                 test: /owl/,
    //             },
    //             core: {
    //                 name: 'core',
    //                 chunks: 'all',
    //                 test: /core/,
    //             },
    //         },
    //     },
    // },
};
