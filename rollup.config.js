import xml from 'rollup-plugin-xml';
import css from 'rollup-plugin-css-only';

export default {
    input: 'build/odoo/packages/bundle-odoo-website-editor/odoo-integration.js',
    output: {
        file: 'build/odoo/odoo-integration.js',
        format: 'iife',
        name: 'jabberwock',
        extend: true,
        external: ['@odoo/owl', 'owl'],
        globals: { '@odoo/owl': 'owl' },
        banner: "odoo.define('web_editor.jabberwock', (function(require) {\n'use strict';",
        footer: 'return this.jabberwock;\n}).bind(window));',
    },
    plugins: [
        xml({
            format: 'compact',
        }),
        css({ output: 'build/odoo/odoo-integration.css' }),
    ],
};
