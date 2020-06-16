import { BasicEditor } from '../../packages/bundle-basic-editor/BasicEditor';
import { FontAwesome } from '../../packages/plugin-fontawesome/src/FontAwesome';
import { DevTools } from '../../packages/plugin-devtools/src/DevTools';
import template from './demo-odoo-fields.xml';
import './demo-odoo-fields.css';
import { Toolbar } from '../../packages/plugin-toolbar/src/Toolbar';
import { DomLayout } from '../../packages/plugin-dom-layout/src/DomLayout';

import '../utils/fontawesomeAssets';

const target = document.getElementById('contentToEdit');
target.style.paddingTop = '40px';
target.style.paddingLeft = '8px';
target.innerHTML = template;

const editor = new BasicEditor();
editor.load(FontAwesome);
editor.load(DevTools);
editor.configure(DomLayout, {
    location: [target, 'replace'],
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
        ['BoldButton', 'ItalicButton', 'UnderlineButton'],
        ['AlignLeftButton', 'AlignCenterButton', 'AlignRightButton', 'AlignJustifyButton'],
        ['OrderedListButton', 'UnorderedListButton'],
        ['IndentButton', 'OutdentButton'],
    ],
});

editor.start();
