import { BasicEditor } from '../../packages/bundle-basic-editor/BasicEditor';
import { FontAwesome } from '../../packages/plugin-fontawesome/src/FontAwesome';
import { DevTools } from '../../packages/plugin-devtools/src/DevTools';
import { DomLayout } from '../../packages/plugin-dom-layout/src/DomLayout';
import JWEditor, { JWEditorConfig, Loadables } from '../../packages/core/src/JWEditor';
import { Layout } from '../../packages/plugin-layout/src/Layout';
import { Parser } from '../../packages/plugin-parser/src/Parser';

import layout from './layout.xml';
import template from './demo.xml';
import './demo.css';
import { VNode } from '../../packages/core/src/VNodes/VNode';

import '../utils/fontawesomeAssets';
import '../../packages/plugin-toolbar/assets/Toolbar.css';

const target = document.getElementById('contentToEdit');
target.style.paddingTop = '40px';
target.style.paddingLeft = '8px';
target.innerHTML = template;

const editor = new BasicEditor({ editable: target });
editor.load(FontAwesome);
// editor.load(DevTools);
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
