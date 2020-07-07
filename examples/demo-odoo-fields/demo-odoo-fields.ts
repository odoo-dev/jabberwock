import { Parser } from './../../packages/plugin-parser/src/Parser';
import { BasicEditor } from '../../packages/bundle-basic-editor/BasicEditor';
import { FontAwesome } from '../../packages/plugin-fontawesome/src/FontAwesome';
import { DevTools } from '../../packages/plugin-devtools/src/DevTools';
import template from './demo-odoo-fields.xml';
import './demo-odoo-fields.css';
import { DomLayout } from '../../packages/plugin-dom-layout/src/DomLayout';
import { JWEditorConfig, Loadables } from '../../packages/core/src/JWEditor';
import { Layout } from '../../packages/plugin-layout/src/Layout';
import { VNode } from '../../packages/core/src/VNodes/VNode';
import JWEditor from '../../packages/core/src/JWEditor';

import layout from './layout.xml';
import '../utils/fontawesomeAssets';

const target = document.getElementById('contentToEdit');
target.style.paddingTop = '40px';
target.style.paddingLeft = '8px';
target.innerHTML = template;

const editor = new BasicEditor({ editable: target });
editor.load(FontAwesome);
editor.load(DevTools);
editor.configure(DomLayout, {
    location: [target, 'replace'],
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
        ],
        componentZones: [['editor', ['root']]],
    },
};
editor.configure(config);

editor.start();
