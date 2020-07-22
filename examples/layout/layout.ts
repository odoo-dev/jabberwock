import { BasicEditor } from '../../packages/bundle-basic-editor/BasicEditor';
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
import { parseEditable, createEditable } from '../../packages/utils/src/configuration';
import { Fullscreen } from '../../packages/plugin-fullsreen/src/Fullscreen';
import { Theme } from '../../packages/plugin-theme/src/Theme';
import { Toolbar, ToolbarConfig } from '../../packages/plugin-toolbar/src/Toolbar';

import '../utils/fontawesomeAssets';
import { Template } from '../../packages/plugin-template/src/Template';
import { ZoneNode } from '../../packages/plugin-layout/src/ZoneNode';
import { ParagraphNode } from '../../packages/plugin-paragraph/src/ParagraphNode';
import { ThemeNode } from '../../packages/plugin-theme/src/ThemeNode';
import { Iframe } from '../../packages/plugin-iframe/src/Iframe';

const target = document.getElementById('contentToEdit');
jabberwocky.init(target);

const editor = new BasicEditor();
editor.load(DevTools);
editor.load(Shadow);
editor.load(Iframe);
editor.configure(Template, {
    components: [
        {
            id: 'jabberwocky',
            render: async (editor: JWEditor): Promise<VNode[]> => {
                const nodes = await parseEditable(editor, target);
                const theme = new ThemeNode({ theme: 'custom' });
                theme.append(...nodes);
                return [theme];
            },
        },
        {
            id: 'empty-document',
            render: async (): Promise<VNode[]> => {
                const p = new ParagraphNode();
                const theme = new ThemeNode();
                theme.append(p);
                return [theme];
            },
        },
    ],
    templateConfigurations: {
        basic: {
            label: 'Empty document',
            componentId: 'empty-document',
            thumbnailZoneId: 'main',
            zoneId: 'content-editable',
            thumbnail: '/assets/img/basic_thumb_large.png',
        },
        default: {
            label: 'Jabberwocky',
            componentId: 'jabberwocky',
            thumbnailZoneId: 'main',
            zoneId: 'content-editable',
            thumbnail: '/assets/img/default_thumb_large.png',
        },
    },
});
editor.configure(Theme, {
    components: [
        {
            id: 'default',
            label: 'Theme table',
            render: async (editor: JWEditor): Promise<VNode[]> => {
                return editor.plugins.get(Parser).parse(
                    'text/html',
                    `<table width="100%">
                        <tr>
                            <td width="10%">TD cell</td>
                            <td width="80%" style="border: 1px solid red;"><t-placeholder/></td>
                            <td width="10%">TD cell</td>
                        </tr>
                    </table>`,
                );
            },
        },
        {
            id: 'custom',
            label: 'Theme color blue',
            render: async (editor: JWEditor): Promise<VNode[]> => {
                return editor.plugins
                    .get(Parser)
                    .parse(
                        'text/html',
                        `<div style="background: lightblue; height: 100%;"><t-placeholder/></div>`,
                    );
            },
        },
        {
            id: 'iframe',
            label: 'Theme color red in iframe',
            render: async (editor: JWEditor): Promise<VNode[]> => {
                return editor.plugins
                    .get(Parser)
                    .parse(
                        'text/html',
                        `<t-iframe style="border: 0; width: 100%;"><div style="background: #ffaaaa; height: 100%;"><t-placeholder/></div></t-iframe>`,
                    );
            },
        },
    ],
});
editor.configure(Fullscreen, { component: 'editable' });
editor.configure(DomLayout, {
    components: [
        {
            id: 'domHeader',
            render(editor: JWEditor): Promise<VNode[]> {
                return editor.plugins.get(Parser).parse('text/html', headerTemplate);
            },
        },
        {
            id: 'editor',
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
                const [node] = await createEditable(editor, true);
                const zone = new ZoneNode({ managedZones: ['content-editable'] });
                node.append(zone);
                shadow.append(style, node);
                return [shadow];
            },
        },
    ],
    locations: [
        ['domHeader', [document.body, 'prepend']],
        ['editor', [target, 'replace']],
        ['domOther', [target, 'after']],
        ['domFooter', [document.body, 'append']],
    ],
    componentZones: [['editable', ['main']]],
});

const toolbarConfig = editor.configuration.plugins.find(
    config => config[0] === Toolbar,
)[1] as ToolbarConfig;
toolbarConfig.layout.push(['ThemeButton'], ['TemplateSelector']);
editor.configure(Toolbar, toolbarConfig);

editor.start();
