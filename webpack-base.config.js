/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const glob = require('glob');
const fs = require('fs');
/* eslint-enable @typescript-eslint/no-var-requires */

const integrationDevPath = path.resolve(
    __dirname,
    'packages/bundle-odoo-website-editor/odoo-integration.ts',
);

const mainConfig = {
    mode: 'development',
    devtool: 'inline-source-map',
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
                loader: 'file-loader',
                options: {
                    name: '[name].[ext]',
                    outputPath: '/fonts',
                    publicPath: 'http://localhost:8095/fonts',
                },
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
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
            'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
        },
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

// -----------------------------------------------------------------------------
// Examples
// -----------------------------------------------------------------------------

/**
 * Create an entry for each typescript file contained in the `examples` folder.
 */
const entries = glob.sync(__dirname + '/examples/**/*.ts').reduce((acc, file) => {
    const fileKey = file.slice((__dirname + '/examples/').length, -3);
    acc[fileKey] = file;
    return acc;
}, {});
entries['odoo-integration'] = integrationDevPath;

module.exports.examples = {
    ...mainConfig,
    entry: entries,
    output: {
        path: path.resolve(__dirname, 'build/examples'),
        filename: '[name].js',
        library: 'JWEditor',
    },
};

// -----------------------------------------------------------------------------
// Build for Odoo
// -----------------------------------------------------------------------------
const odooBuildPath = path.resolve(__dirname, 'build/odoo');
const odooBuildFilename = 'odoo-integration.js';
module.exports.odoo = {
    ...mainConfig,
    entry: {
        'odoo-integration': integrationDevPath,
    },
    output: {
        path: odooBuildPath,
        filename: odooBuildFilename,
        library: 'JWEditor',
    },
    plugins: [
        {
            apply: compiler => {
                compiler.hooks.afterEmit.tap('AfterEmitBuildOdooIntegration', async () => {
                    const filename = path.resolve(odooBuildPath, odooBuildFilename);
                    fs.readFile(filename, (error, content) => {
                        if (error) throw new Error(error);
                        const newContent = [
                            "odoo.define('web_editor.jabberwock', function(require) {",
                            "'use strict';",
                            content,
                            'return JWEditor',
                            '});',
                        ].join('\n');
                        fs.writeFile(filename, newContent, error => {
                            if (error) throw new Error(error);
                        });
                    });
                });
            },
        },
    ],
};
