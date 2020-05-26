import { BasicEditor } from '../../bundles/BasicEditor';
import { jabberwocky } from '../utils/jabberwocky';
import { DevTools } from '../../packages/plugin-devtools/src/DevTools';
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
import { DomLayout } from '../../packages/plugin-dom-layout/src/DomLayout';
import { VNode } from '../../packages/core/src/VNodes/VNode';
import JWEditor from '../../packages/core/src/JWEditor';
import { Parser } from '../../packages/plugin-parser/src/Parser';
import { Shadow } from '../../packages/plugin-shadow/src/Shadow';

import '../utils/jabberwocky.css';
import headerTemplate from './header.xml';
import mainTemplate from './main.xml';
import otherTemplate from './other.xml';
import footerTemplate from './footer.xml';
import { ShadowNode } from '../../packages/plugin-shadow/src/ShadowNode';
import { MetadataNode } from '../../packages/plugin-metadata/src/MetadataNode';
import { parseEditable } from '../../packages/utils/src/configuration';

const target = document.getElementById('contentToEdit');
jabberwocky.init(target);

const editor = new BasicEditor();
editor.load(Shadow);
editor.configure(DomLayout, {
    components: [
        {
            id: 'domHeader',
            render(editor: JWEditor): Promise<VNode[]> {
                return editor.plugins.get(Parser).parse('text/html', headerTemplate);
            },
        },
        {
            id: 'domMain',
            render(editor: JWEditor): Promise<VNode[]> {
                return editor.plugins.get(Parser).parse('text/html', mainTemplate);
            },
        },
        {
            id: 'domOther',
            render(editor: JWEditor): Promise<VNode[]> {
                return editor.plugins.get(Parser).parse('text/html', otherTemplate);
            },
        },
        {
            id: 'domFooter',
            render(editor: JWEditor): Promise<VNode[]> {
                return editor.plugins.get(Parser).parse('text/html', footerTemplate);
            },
        },
        {
            id: 'editable',
            render: async (editor: JWEditor): Promise<VNode[]> => {
                const shadow = new ShadowNode();
                const style = new MetadataNode('STYLE');
                style.contents = '* {border: 1px #aaa dotted;}';
                const nodes = await parseEditable(editor, target);
                shadow.append(style, ...nodes);
                return [shadow];
            },
        },
    ],
    locations: [
        ['domHeader', [document.body, 'prepend']],
        ['domMain', [target, 'replace']],
        ['domOther', [target, 'after']],
        ['domFooter', [document.body, 'append']],
    ],
    componentZones: [['editable', 'main']],
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
editor.load(DevTools);
editor.start();
