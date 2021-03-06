import { BasicEditor } from '../../packages/bundle-basic-editor/BasicEditor';
import { FontAwesome } from '../../packages/plugin-fontawesome/src/FontAwesome';
import { DevTools } from '../../packages/plugin-devtools/src/DevTools';
import template from './odoo.xml';
import '../utils/editor.css';
import { Toolbar } from '../../packages/plugin-toolbar/src/Toolbar';
import { DomLayout } from '../../packages/plugin-dom-layout/src/DomLayout';
import { OdooVideo } from '../../packages/plugin-odoo-video/src/OdooVideo';

import '../../packages/plugin-toolbar/assets/Toolbar.css';
import '../utils/fontawesomeAssets';
import { OdooWebsiteEditor } from '../../packages/bundle-odoo-website-editor/OdooWebsiteEditor';

const target = document.getElementById('wrapper');
target.innerHTML = template;

const editor = new OdooWebsiteEditor({
    source: target,
});
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
        ['FontSizeInput'],
        ['BoldButton', 'ItalicButton', 'UnderlineButton'],
        ['AlignLeftButton', 'AlignCenterButton', 'AlignRightButton', 'AlignJustifyButton'],
        ['OrderedListButton', 'UnorderedListButton'],
        ['IndentButton', 'OutdentButton'],
    ],
});
editor.configure(OdooVideo, {
    autoFocus: true,
    source: target,
});

editor.start();
