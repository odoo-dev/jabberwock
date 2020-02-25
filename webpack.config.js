// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');

module.exports = {
    mode: 'development',
    entry: {
        'jabberwocky': './examples/jabberwocky/jabberwocky.ts',
        'jabberwockipedia': './examples/jabberwockipedia/jabberwockipedia.ts',
        'demo': './examples/demo/demo.ts',
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
        // Access to the normalizer tool through an ip other than '0.0.0.0'
        // (i.e. localhost) for external devices (e.g. mobile, Macbook).
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
