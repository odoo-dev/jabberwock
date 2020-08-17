import { BasicEditor } from '../../packages/bundle-basic-editor/BasicEditor';
import { FontAwesome } from '../../packages/plugin-fontawesome/src/FontAwesome';
import { DevTools } from '../../packages/plugin-devtools/src/DevTools';
import { DomLayout } from '../../packages/plugin-dom-layout/src/DomLayout';
import JWEditor from '../../packages/core/src/JWEditor';
import { Layout } from '../../packages/plugin-layout/src/Layout';
import { Parser } from '../../packages/plugin-parser/src/Parser';

import layout from './layout.xml';
import template from './demo.xml';
import './demo.css';
import { VNode } from '../../packages/core/src/VNodes/VNode';

import '../utils/fontawesomeAssets';
import '../../packages/plugin-toolbar/assets/Toolbar.css';
import { Table } from '../../packages/plugin-table/src/Table';
import { DevicePreview } from '../../packages/plugin-device-preview/src/DevicePreview';
import { ThemeNode } from '../../packages/plugin-theme/src/ThemeNode';
import { parseEditable } from '../../packages/utils/src/configuration';
import { Toolbar } from '../../packages/plugin-toolbar/src/Toolbar';

const target = document.getElementById('contentToEdit');
target.style.paddingTop = '40px';
target.style.paddingLeft = '8px';
target.innerHTML = template;

const editor = new BasicEditor({ editable: target });
editor.load(FontAwesome);
// editor.load(DevTools);
editor.configure(DomLayout, {
    location: [target, 'replace'],
    components: [
        {
            id: 'editor',
            render(editor: JWEditor): Promise<VNode[]> {
                return editor.plugins.get(Parser).parse('text/html', layout);
            },
        },
        {
            id: 'editable',
            render: async (editor: JWEditor): Promise<VNode[]> => {
                const theme = new ThemeNode();
                const contents = await parseEditable(editor, target, true);
                theme.append(...contents);
                return [theme];
            },
        },
    ],
    componentZones: [
        ['editable', ['main']],
        ['editor', ['root']],
    ],
});
editor.configure(Table, {
    inlineUI: true,
});
editor.configure(DevicePreview, {
    getTheme(editor: JWEditor) {
        const layout = editor.plugins.get(Layout);
        const domLayout = layout.engines.dom;
        return domLayout.components.editable[0] as ThemeNode;
    },
});
editor.configure(Toolbar, {
    layout: [
        [
            [
                'ParagraphButton',
                'Heading1Button',
                'Heading2Button',
                'Heading3Button',
                'Heading4Button',
                'Heading5Button',
                'Heading6Button',
                'PreButton',
            ],
        ],
        ['FontSizeInput'],
        ['BoldButton', 'ItalicButton', 'UnderlineButton', 'RemoveFormatButton'],
        ['AlignLeftButton', 'AlignCenterButton', 'AlignRightButton', 'AlignJustifyButton'],
        ['OrderedListButton', 'UnorderedListButton', 'ChecklistButton'],
        ['IndentButton', 'OutdentButton'],
        ['LinkButton', 'UnlinkButton'],
        ['TableButton'],
        ['CodeButton'],
        ['UndoButton', 'RedoButton'],
        ['DevicePreviewButton'],
    ],
});

editor.start();
