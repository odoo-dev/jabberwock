import { BasicEditor } from '../../bundles/BasicEditor';
import { jabberwocky } from '../utils/jabberwocky';
import { DevTools } from '../../packages/plugin-devtools/src/DevTools';
import { Dom } from '../../packages/plugin-dom/src/Dom';
import './jabberwocky.css';
import { Toolbar } from '../../packages/plugin-toolbar/src/Toolbar';
import { Indent } from '../../packages/plugin-indent/src/Indent';
import { ParagraphButton } from '../../packages/plugin-heading/src/HeadingButtons';
import { Heading1Button } from '../../packages/plugin-heading/src/HeadingButtons';
import { Heading2Button } from '../../packages/plugin-heading/src/HeadingButtons';
import { Heading3Button } from '../../packages/plugin-heading/src/HeadingButtons';
import { Heading4Button } from '../../packages/plugin-heading/src/HeadingButtons';
import { Heading5Button } from '../../packages/plugin-heading/src/HeadingButtons';
import { Heading6Button } from '../../packages/plugin-heading/src/HeadingButtons';
import { BoldButton } from '../../packages/plugin-bold/src/BoldButtons';
import { ItalicButton } from '../../packages/plugin-italic/src/ItalicButtons';
import { UnderlineButton } from '../../packages/plugin-underline/src/UnderlineButtons';
import { OrderedListButton } from '../../packages/plugin-list/src/ListButtons';
import { UnorderedListButton } from '../../packages/plugin-list/src/ListButtons';
import { IndentButton } from '../../packages/plugin-indent/src/IndentButtons';
import { OutdentButton } from '../../packages/plugin-indent/src/IndentButtons';

const target = document.createElement('div');
target.style.textAlign = 'center';
target.style.paddingTop = '100px';
jabberwocky.init(target);

const editor = new BasicEditor();
editor.configure(Dom, {
    autoFocus: true,
    target: target,
});
editor.configure({
    plugins: [[DevTools], [Indent]],
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
            ],
        ],
        [BoldButton, ItalicButton, UnderlineButton],
        [OrderedListButton, UnorderedListButton],
        [IndentButton, OutdentButton],
    ],
});

editor.start();
