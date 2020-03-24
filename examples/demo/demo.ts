import { BasicEditor } from '../../bundles/BasicEditor';
import { Fontawesome } from '../../packages/plugin-fontawesome/src/Fontawesome';
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
import { BoldButton } from '../../packages/plugin-bold/src/BoldButtons';
import { ItalicButton } from '../../packages/plugin-italic/src/ItalicButtons';
import { UnderlineButton } from '../../packages/plugin-underline/src/UnderlineButtons';
import { OrderedListButton } from '../../packages/plugin-list/src/ListButtons';
import { UnorderedListButton } from '../../packages/plugin-list/src/ListButtons';
import { IndentButton } from '../../packages/plugin-indent/src/IndentButtons';
import { OutdentButton } from '../../packages/plugin-indent/src/IndentButtons';
import { AlignLeftButton, AlignCenterButton, AlignRightButton, AlignJustifyButton } from '../../packages/plugin-align/src/AlignButtons';
import '!style-loader!css-loader!@fortawesome/fontawesome-free/css/all.css';
import '!file-loader?name=./fonts/[name].[ext]!@fortawesome/fontawesome-free/webfonts/fa-brands-400.woff';
import '!file-loader?name=./fonts/[name].[ext]!@fortawesome/fontawesome-free/webfonts/fa-brands-400.woff2';
import '!file-loader?name=./fonts/[name].[ext]!@fortawesome/fontawesome-free/webfonts/fa-brands-400.ttf';
import '!file-loader?name=./fonts/[name].[ext]!@fortawesome/fontawesome-free/webfonts/fa-regular-400.woff';
import '!file-loader?name=./fonts/[name].[ext]!@fortawesome/fontawesome-free/webfonts/fa-regular-400.woff2';
import '!file-loader?name=./fonts/[name].[ext]!@fortawesome/fontawesome-free/webfonts/fa-regular-400.ttf';
import '!file-loader?name=./fonts/[name].[ext]!@fortawesome/fontawesome-free/webfonts/fa-solid-900.woff';
import '!file-loader?name=./fonts/[name].[ext]!@fortawesome/fontawesome-free/webfonts/fa-solid-900.woff2';
import '!file-loader?name=./fonts/[name].[ext]!@fortawesome/fontawesome-free/webfonts/fa-solid-900.ttf';

const target = document.createElement('div');
target.style.paddingTop = '40px';
target.style.paddingLeft = '8px';
target.innerHTML = template;

const editor = new BasicEditor();
editor.load(Fontawesome);
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
            ],
        ],
        [BoldButton, ItalicButton, UnderlineButton],
        [AlignLeftButton, AlignCenterButton, AlignRightButton, AlignJustifyButton],
        [OrderedListButton, UnorderedListButton],
        [IndentButton, OutdentButton],
    ],
});

editor.start();
