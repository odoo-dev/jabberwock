import { buildAPI, watchPages, buildPages } from './src/doc/BuildDoc';
import * as path from 'path';
import * as webpack from 'webpack';
import * as WebpackDevServer from 'webpack-dev-server/lib/Server';
import * as findFreePort from 'find-free-port';

const compiler = webpack({
    mode: 'development',
    entry: {
        'doc-index': './doc/doc-index.ts',
    },
    devtool: 'inline-source-map',
    output: {
        path: path.resolve(__dirname, 'build/doc/webpack'),
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
                test: /\.s[ac]ss$/i,
                use: ['style-loader', 'css-loader', 'sass-loader'],
            },
            {
                test: /\.xml$/i,
                use: ['text-loader'],
            },
            {
                test: /\.(png|jpe?g|gif)$/i,
                use: [
                    {
                        loader: 'file-loader',
                    },
                ],
            },
        ],
    },
    plugins: [
        {
            apply: (compiler): void => {
                compiler.hooks.done.tap('BuildAPI', () => {
                    // set a timeout so it logs after webpack print.
                    setTimeout(() => {
                        buildAPI();
                    });
                });
            },
        },
    ],
    resolve: {
        extensions: ['.ts', '.js'],
    },
    devServer: {
        contentBase: './build/doc',
    },
});
const server = new WebpackDevServer(compiler, {
    contentBase: './build/doc',
});

findFreePort(8080).then(([port]) => {
    server.listen(port, '127.0.0.1', () => {});
    buildPages();
    watchPages();
});
