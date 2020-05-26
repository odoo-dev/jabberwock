// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const glob = require('glob');

/**
 * Create an entry for each typescript file contained in the `examples` folder.
 */
const entries = glob.sync(__dirname + '/examples/**/*.ts').reduce((acc, file) => {
    const fileKey = file.slice((__dirname + '/examples/').length, -3);
    acc[fileKey] = file;
    return acc;
}, {});

module.exports = {
    mode: 'development',
    entry: entries,
    devtool: 'inline-source-map',
    output: {
        path: path.resolve(__dirname, 'build/examples'),
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
            {
                test: /\.(eot|svg|ttf|woff|woff2)$/,
                loader: 'file-loader?name=/fonts/[name].[ext]',
            },
            {
                test: /\.(png|jpe?g|gif)$/i,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            publicPath: '/',
                        },
                    },
                ],
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    devServer: {
        contentBase: './examples',
        // Webpack check that the host is `0.0.0.0` by default. Disable that
        // check to access the server from external devices.
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
