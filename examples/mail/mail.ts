import { BasicEditor } from '../../packages/bundle-basic-editor/BasicEditor';
import { DevTools } from '../../packages/plugin-devtools/src/DevTools';
import { DomLayout } from '../../packages/plugin-dom-layout/src/DomLayout';
import { VNode } from '../../packages/core/src/VNodes/VNode';
import JWEditor, { JWEditorConfig, Loadables } from '../../packages/core/src/JWEditor';
import { Shadow } from '../../packages/plugin-shadow/src/Shadow';
import { Fullscreen } from '../../packages/plugin-fullscreen/src/Fullscreen';
import { Mail } from '../../packages/plugin-mail/src/Mail';
import { Parser } from '../../packages/plugin-parser/src/Parser';
import { Renderer } from '../../packages/plugin-renderer/src/Renderer';
import { Layout } from '../../packages/plugin-layout/src/Layout';
import { FontAwesome } from '../../packages/plugin-fontawesome/src/FontAwesome';
import { createEditable } from '../../packages/utils/src/configuration';
import { ZoneNode } from '../../packages/plugin-layout/src/ZoneNode';

import layout from './layout.xml';
import mail from './mail.xml';

import '../../packages/plugin-toolbar/assets/Toolbar.css';
import '../utils/fontawesomeAssets';

const styles = document.querySelectorAll('style');
const fontStyle = [...styles].find(style => style.textContent.includes('Font Awesome'));
const mailTemplate = mail.replace('</style>', '</style>' + fontStyle.outerHTML);

const target = document.getElementById('contentToEdit');

const editor = new BasicEditor({ editable: target });
editor.load(DevTools);
editor.load(Shadow);
editor.load(FontAwesome);
editor.load(Mail);
editor.configure(Fullscreen, { component: 'editable' });
editor.configure(DomLayout, {
    location: [target, 'replace'],
    components: [
        {
            id: 'editable',
            async render(editor: JWEditor): Promise<VNode[]> {
                const editable = await createEditable(editor);
                const zone = new ZoneNode({ managedZones: ['mail-editable'] });
                zone.editable = true;
                editable[0].append(zone);
                return editable;
            },
        },
    ],
});
const config: JWEditorConfig & { loadables: Loadables<Layout> } = {
    loadables: {
        components: [
            {
                id: 'editor',
                render(editor: JWEditor): Promise<VNode[]> {
                    return editor.plugins.get(Parser).parse('text/html', layout);
                },
            },
            {
                id: 'mail',
                async render(editor: JWEditor): Promise<VNode[]> {
                    const nodes = await editor.plugins.get(Parser).parse('text/html', mailTemplate);
                    console.log(nodes);
                    return nodes;
                },
            },
        ],
        componentZones: [
            ['editor', ['root']],
            ['mail', ['mail-editable']],
        ],
    },
};
editor.configure(config);

editor.dispatcher.registerCommandHook('@commit', () => {
    const shadowNode = document.querySelector('#shadow-preview');
    if (shadowNode) {
        const mailNodes = editor.plugins.get(Layout).engines.dom.components.mail;

        const timeout = setTimeout(() => {
            console.warn(
                'Mail rendering take more than 1 seconds to finish. It might be caused by a deadlock.\n' +
                    'Verify your promises.',
            );
        }, 1000);

        editor.plugins
            .get(Renderer)
            .render<string>('text/mail', mailNodes)
            .then(mailParts => {
                shadowNode.shadowRoot.innerHTML = mailParts ? mailParts.join('') : '';
                clearTimeout(timeout);
            })
            .catch(err => console.error(err));
    }
});

editor.start();
