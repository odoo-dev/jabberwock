import { BasicEditor } from '../../bundles/BasicEditor';
import { jabberwocky } from '../utils/jabberwocky';
import { DevTools } from '../../packages/plugin-devtools/src/DevTools';
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
                const style = new MetadataNode({ htmlTag: 'STYLE' });
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

editor.load(DevTools);
editor.start();
