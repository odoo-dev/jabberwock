import { expect } from 'chai';
import { describePlugin } from '../../utils/src/testUtils';
import { Mail } from '../src/Mail';
import { BasicEditor } from '../../bundle-basic-editor/BasicEditor';
import { Layout } from '../../plugin-layout/src/Layout';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { FontAwesome } from '../../plugin-fontawesome/src/FontAwesome';

import '!style-loader!css-loader!@fortawesome/fontawesome-free/css/all.css';
import '!file-loader?name=./fonts/[name].[ext]!@fortawesome/fontawesome-free/webfonts/fa-brands-400.woff';
import '!file-loader?name=./fonts/[name].[ext]!@fortawesome/fontawesome-free/webfonts/fa-brands-400.woff2';
import '!file-loader?name=./fonts/[name].[ext]!@fortawesome/fontawesome-free/webfonts/fa-brands-400.ttf';
import '!file-loader?name=./fonts/[name].[ext]!@fortawesome/fontawesome-free/webfonts/fa-regular-400.woff';
import '!file-loader?name=./fonts/[name].[ext]!@fortawesome/fontawesome-free/webfonts/fa-regular-400.woff2';
import '!file-loader?name=./fonts/[name].[ext]!@fortawesome/fontawesome-free/webfonts/fa-regular-400.ttf';
import '!file-loader?name=./fonts/[name].[ext]!@fortawesome/fontawesome-free/webfonts/fa-solid-900.woff';
import '!file-loader?name=./fonts/[name].[ext]!@fortawesome/fontawesome-free/webfonts/fa-solid-900.woff2';
import '!file-loader?name=./fonts/[name].[ext]!@fortawesome/fontawesome-free/webfonts/fa-solid-900.ttf';

import testMailBase from './testMailBase.xml';
import testMailResult from './testMailResult.xml';

const styles = document.querySelectorAll('style');
const fontStyle = [...styles].find(style => style.textContent.includes('Font Awesome'));
const mailTemplate = testMailBase.replace('</style>', '</style>' + fontStyle.outerHTML);

class MailEditor extends BasicEditor {
    constructor(params?: { editable?: HTMLElement }) {
        super(params);
        this.load(FontAwesome);
        this.load(Mail);
    }
}

describePlugin(Mail, testEditor => {
    it('should render the VDom into a mail content', async () => {
        await testEditor(MailEditor, {
            contentBefore: '<t-shadow>' + mailTemplate + '</t-shadow>',
            stepFunction: async editor => {
                await new Promise(r => setTimeout(r, 1000)); // the browser must load the style.
                const [editable] = editor.plugins.get(Layout).engines.dom.components.editable;
                const shadowNode = editable.firstChild();
                const htmls = await editor.plugins
                    .get(Renderer)
                    .render<string>('text/mail', shadowNode.childVNodes);
                const result = htmls && htmls.filter(html => html.length).join('\n');
                if (result !== testMailResult) {
                    console.warn('the base64 does not have exactly the same rendering as the test');
                }
                expect(
                    // Remove base64 content because the test are maked on linux mint chrome but
                    // with mac, the base hase the same layout but the base64 is different.
                    result.replace(/data:image\/png;base64,[^"]+/gi, 'data:image/png;base64,'),
                ).to.equal(
                    testMailResult
                        .trim()
                        .replace(/data:image\/png;base64,[^"]+/gi, 'data:image/png;base64,'),
                );
            },
            contentAfter: '<jw-shadow></jw-shadow>',
        });
    });
});
