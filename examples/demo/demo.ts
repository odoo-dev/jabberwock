import { BasicEditor } from '../../bundles/BasicEditor';
import { FontAwesome } from '../../packages/plugin-fontawesome/src/FontAwesome';
import { DevTools } from '../../packages/plugin-devtools/src/DevTools';
import { Dom } from '../../packages/plugin-dom/src/Dom';
import template from './demo.xml';
import './demo.css';
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
import { CheckboxListButton } from '../../packages/plugin-list/src/ListButtons';
import { IndentButton } from '../../packages/plugin-indent/src/IndentButtons';
import { OutdentButton } from '../../packages/plugin-indent/src/IndentButtons';
import { AlignLeftButton } from '../../packages/plugin-align/src/AlignButtons';
import { AlignCenterButton } from '../../packages/plugin-align/src/AlignButtons';
import { AlignRightButton } from '../../packages/plugin-align/src/AlignButtons';
import { AlignJustifyButton } from '../../packages/plugin-align/src/AlignButtons';

const target = document.createElement('div');
target.style.paddingTop = '40px';
target.style.paddingLeft = '8px';
target.innerHTML = template;

const editor = new BasicEditor();
editor.load(FontAwesome);
editor.load(DevTools);
editor.configure(Dom, {
    autoFocus: true,
    target: target,
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
        [OrderedListButton, UnorderedListButton, CheckboxListButton],
        [IndentButton, OutdentButton],
    ],
});

editor.start();
