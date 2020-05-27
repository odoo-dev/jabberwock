import { BasicEditor } from '../../bundles/BasicEditor';
import { FontAwesome } from '../../packages/plugin-fontawesome/src/FontAwesome';
import { DevTools } from '../../packages/plugin-devtools/src/DevTools';
import { Toolbar } from '../../packages/plugin-toolbar/src/Toolbar';
import { ParagraphButton } from '../../packages/plugin-heading/src/HeadingButtons';
import { Heading1Button } from '../../packages/plugin-heading/src/HeadingButtons';
import { Heading2Button } from '../../packages/plugin-heading/src/HeadingButtons';
import { Heading3Button } from '../../packages/plugin-heading/src/HeadingButtons';
import { Heading4Button } from '../../packages/plugin-heading/src/HeadingButtons';
import { Heading5Button } from '../../packages/plugin-heading/src/HeadingButtons';
import { Heading6Button } from '../../packages/plugin-heading/src/HeadingButtons';
import { PreButton } from '../../packages/plugin-pre/src/PreButtons';
import { BoldButton } from '../../packages/plugin-bold/src/BoldButtons';
import { ItalicButton } from '../../packages/plugin-italic/src/ItalicButtons';
import { UnderlineButton } from '../../packages/plugin-underline/src/UnderlineButtons';
import { OrderedListButton } from '../../packages/plugin-list/src/ListButtons';
import { UnorderedListButton } from '../../packages/plugin-list/src/ListButtons';
import { IndentButton } from '../../packages/plugin-indent/src/IndentButtons';
import { OutdentButton } from '../../packages/plugin-indent/src/IndentButtons';
import {
    AlignLeftButton,
    AlignCenterButton,
    AlignRightButton,
    AlignJustifyButton,
} from '../../packages/plugin-align/src/AlignButtons';
import { DomLayout } from '../../packages/plugin-dom-layout/src/DomLayout';
import { DomEditable } from '../../packages/plugin-dom-editable/src/DomEditable';
import { OdooVideo } from '../../packages/plugin-odoo-video/src/OdooVideo';
import template from './modes.xml';
import '../utils/editor.css';
import { DividerNode } from '../../packages/plugin-divider/src/DividerNode';
import { PreNode } from '../../packages/plugin-pre/src/PreNode';
import { ModeDefinition } from '../../packages/plugin-mode/src/Mode';

const target = document.getElementById('wrapper');
target.innerHTML = template;

const editor = new BasicEditor();
editor.load(FontAwesome);
editor.load(DevTools);
editor.configure(DomLayout, {
    location: [target, 'replace'],
});
editor.configure(DomEditable, {
    autoFocus: true,
    source: target,
});
editor.configure(Toolbar, {
    layout: [
        [
            [
                ParagraphButton,
                Heading1Button,
                Heading2Button,
                Heading3Button,
                Heading4Button,
                Heading5Button,
                Heading6Button,
                PreButton,
            ],
        ],
        [BoldButton, ItalicButton, UnderlineButton],
        [AlignLeftButton, AlignCenterButton, AlignRightButton, AlignJustifyButton],
        [OrderedListButton, UnorderedListButton],
        [IndentButton, OutdentButton],
    ],
});

const modeDefinitions: ModeDefinition[] = [
    {
        id: 'demo',
        checkEditable: true,
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
editor.load({
    modes: modeDefinitions,
});

editor.configure({ mode: 'demo' });
editor.configure(OdooVideo, {
    autoFocus: true,
    source: target,
});

editor.start();
