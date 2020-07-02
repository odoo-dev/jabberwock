import { BasicEditor } from '../../packages/bundle-basic-editor/BasicEditor';
import { FontAwesome } from '../../packages/plugin-fontawesome/src/FontAwesome';
import { DevTools } from '../../packages/plugin-devtools/src/DevTools';
import { DomLayout } from '../../packages/plugin-dom-layout/src/DomLayout';
import { DomEditable } from '../../packages/plugin-dom-editable/src/DomEditable';
import template from './modes.xml';
import '../utils/editor.css';
import '../utils/fontawesomeAssets';
import { DividerNode } from '../../packages/plugin-divider/src/DividerNode';
import { PreNode } from '../../packages/plugin-pre/src/PreNode';
import { ModeDefinition } from '../../packages/core/src/Mode';

const target = document.getElementById('wrapper');
target.innerHTML = template;

const editor = new BasicEditor({ editable: target });
editor.load(FontAwesome);
editor.load(DevTools);
editor.configure(DomLayout, {
    location: [target, 'replace'],
});
editor.configure(DomEditable, {
    autoFocus: true,
    source: target,
});

const modeDefinitions: ModeDefinition[] = [
    {
        id: 'demo',
        rules: [
            {
                selector: [DividerNode],
                editable: false,
            },
            {
                selector: [DividerNode, PreNode],
                editable: false,
            },
            {
                selector: [PreNode],
                editable: true,
            },
        ],
    },
];
editor.configure({ modes: modeDefinitions });
editor.configure({ mode: 'demo' });

editor.start();
