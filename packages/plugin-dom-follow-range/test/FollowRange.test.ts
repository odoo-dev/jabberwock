import { expect } from 'chai';
import { JWEditor } from '../../core/src/JWEditor';
import { Char } from '../../plugin-char/src/Char';
import { TagNode } from '../../core/src/VNodes/TagNode';
import { DomLayout } from '../../plugin-dom-layout/src/DomLayout';
import { FollowRange } from '../src/FollowRange';
import { Layout } from '../../plugin-layout/src/Layout';
import { VNode } from '../../core/src/VNodes/VNode';
import { Parser } from '../../plugin-parser/src/Parser';
import { BasicEditor } from '../../bundle-basic-editor/BasicEditor';
import { DomEditable } from '../../plugin-dom-editable/src/DomEditable';
import { setDomSelection } from '../../plugin-dom-editable/test/eventNormalizerUtils';
import { parseEditable } from '../../utils/src/configuration';
import { ShadowNode } from '../../plugin-shadow/src/ShadowNode';
import { MetadataNode } from '../../plugin-metadata/src/MetadataNode';
import { Shadow } from '../../plugin-shadow/src/Shadow';
import { Html } from '../../plugin-html/src/Html';

function waitToolbarRedraw(): Promise<void> {
    return new Promise(r => setTimeout(r, 20));
}

const container = document.createElement('div');
container.classList.add('container');
container.style.fontFamily = 'Arial';
container.style.fontSize = '20px';
container.style.lineHeight = '20px';
container.style.margin = '0';
container.style.padding = '0';
const section = document.createElement('section');

describe('FollowRange', async () => {
    let editor: JWEditor;
    before(() => {
        document.body.appendChild(container);
        container.appendChild(section);
    });
    after(() => {
        document.body.removeChild(container);
        container.innerHTML = '';
    });
    afterEach(async () => {
        await editor.stop();
        section.innerHTML = '';
    });

    it('should add a vNode in the follow range container', async () => {
        editor = new JWEditor();
        editor.load(Html);
        editor.load(Char);
        editor.load(FollowRange);
        editor.load(DomLayout, {
            components: [
                {
                    id: 'template',
                    async render(editor: JWEditor): Promise<VNode[]> {
                        const template = `<jw-editor>
                                <t-range><t t-zone="range"/></t-range>
                                <main><t t-zone="main"/></main>
                                <t t-zone="default"/>
                                </jw-editor>`;
                        return editor.plugins.get(Parser).parse('text/html', template);
                    },
                },
                {
                    id: 'aaa',
                    async render(): Promise<VNode[]> {
                        const div = new TagNode({ htmlTag: 'div' });
                        const area = new TagNode({ htmlTag: 'area' });
                        div.append(area);
                        return [div];
                    },
                },
                {
                    id: 'bbb',
                    async render(): Promise<VNode[]> {
                        return [new TagNode({ htmlTag: 'section' })];
                    },
                },
            ],
            componentZones: [['template', ['root']]],
            location: [section, 'replace'],
        });
        await editor.start();

        await editor.execCommand(async () => {
            await editor.plugins.get(Layout).append('aaa', 'range');
            await editor.plugins.get(Layout).append('bbb', 'range');
        });
        expect(container.innerHTML.replace(/[\s\n]+/g, ' ')).to.equal(
            [
                '<jw-editor>',
                '<jw-follow-range style="display: none;">',
                '<div><area></div>',
                '<section></section>',
                '</jw-follow-range>',
                '<main></main>',
                '</jw-editor>',
            ].join(''),
        );
    });
    it('should add automatically component in the follow range container', async () => {
        editor = new JWEditor();
        editor.load(Html);
        editor.load(Char);
        editor.load(FollowRange);
        editor.load(DomLayout, {
            components: [
                {
                    id: 'template',
                    async render(editor: JWEditor): Promise<VNode[]> {
                        const template = `<jw-editor>
                            <t-range><t t-zone="range"/></t-range>
                            <main><t t-zone="main"/></main>
                            <t t-zone="default"/>
                            </jw-editor>`;
                        return editor.plugins.get(Parser).parse('text/html', template);
                    },
                },
                {
                    id: 'custom',
                    async render(): Promise<VNode[]> {
                        return [new TagNode({ htmlTag: 'section' })];
                    },
                },
            ],
            componentZones: [
                ['template', ['root']],
                ['custom', ['range']],
            ],
            location: [section, 'replace'],
        });
        await editor.start();

        expect(container.innerHTML.replace(/[\s\n]+/g, ' ')).to.equal(
            [
                '<jw-editor>',
                '<jw-follow-range style="display: none;">',
                '<section></section>',
                '</jw-follow-range>',
                '<main></main>',
                '</jw-editor>',
            ].join(''),
        );
    });
    it('should display the follow range container when select a text', async () => {
        section.innerHTML = `
            <p style="margin: 0; padding: 0;">
                <span class="drop-cap">’T</span>was brillig, and the slithy toves<br/>
                Did gyre and gimble in the wabe:<br/>
                All mimsy were the borogoves,<br/>
                And the mome raths outgrabe.<br/>
                <br/>
                <i>“Beware the Jabberwock, my son!<br/>
                The jaws that bite, the claws that catch!<br/>
                Beware the Jubjub bird, and shun<br/>
                The frumious Bandersnatch!”</i><br/>
                <br/>
                He took his vorpal sword in hand;<br/>
                Long time the manxome foe he sought—<br/>
                So rested he by the Tumtum tree<br/>
                And stood awhile in thought.<br/>
                <br/>
            </p>
        `;

        editor = new BasicEditor();
        editor.load(DomEditable);
        editor.load(FollowRange);
        editor.load(DomLayout, {
            components: [
                {
                    id: 'editor',
                    async render(editor: JWEditor): Promise<VNode[]> {
                        const template = `<jw-editor>
                            <t-range><t t-zone="range"/></t-range>
                            <main><t t-zone="main"/></main>
                            <t t-zone="default"/>
                            </jw-editor>`;
                        return editor.plugins.get(Parser).parse('text/html', template);
                    },
                },
                {
                    id: 'editable',
                    render: async (editor: JWEditor): Promise<VNode[]> =>
                        parseEditable(editor, section),
                },
                {
                    id: 'custom',
                    async render(): Promise<VNode[]> {
                        const template = `<section style="width: 20px; height: 20px; background: red;">-</section>`;
                        return editor.plugins.get(Parser).parse('text/html', template);
                    },
                },
            ],
            componentZones: [
                ['editor', ['root']],
                ['editable', ['main']],
                ['custom', ['range']],
            ],
            location: [section, 'replace'],
        });
        await editor.start();

        const range = container.querySelector('jw-follow-range') as HTMLElement;

        const i = container.querySelector('p i');
        setDomSelection(i.firstChild, 10, i.firstChild, 10);
        await waitToolbarRedraw();
        expect(range.style.display).to.equal('none');

        setDomSelection(i.firstChild, 10, i.firstChild, 14);
        await waitToolbarRedraw();
        expect(range.style.display).to.equal('');
        expect(parseInt(range.style.top, 10)).to.be.within(135, 145);
        expect(parseInt(range.style.left, 10)).to.be.within(110, 120);

        setDomSelection(i.firstChild, 10, i.firstChild, 20);
        await waitToolbarRedraw();
        expect(range.style.display).to.equal('');
        expect(parseInt(range.style.top, 10)).to.be.within(135, 145);
        expect(parseInt(range.style.left, 10)).to.be.within(125, 135);

        setDomSelection(i.firstChild, 10, i.previousSibling.previousSibling.previousSibling, 10);
        await waitToolbarRedraw();
        expect(range.style.display).to.equal('');
        expect(parseInt(range.style.top, 10)).to.be.within(135, 145);
        expect(parseInt(range.style.left, 10)).to.be.within(80, 90);

        setDomSelection(i.firstChild, 20, i.firstChild, 20);
        await waitToolbarRedraw();
        expect(range.style.display).to.equal('none');
    });
    it('should display the follow range container when select a text in a shadow dom', async () => {
        section.innerHTML = `
            <p style="margin: 0; padding: 0;">
                <span class="drop-cap">’T</span>was brillig, and the slithy toves<br/>
                Did gyre and gimble in the wabe:<br/>
                All mimsy were the borogoves,<br/>
                And the mome raths outgrabe.<br/>
                <br/>
                <i>“Beware the Jabberwock, my son!<br/>
                The jaws that bite, the claws that catch!<br/>
                Beware the Jubjub bird, and shun<br/>
                The frumious Bandersnatch!”</i><br/>
                <br/>
                He took his vorpal sword in hand;<br/>
                Long time the manxome foe he sought—<br/>
                So rested he by the Tumtum tree<br/>
                And stood awhile in thought.<br/>
                <br/>
            </p>
        `;

        editor = new BasicEditor();
        editor.load(DomEditable);
        editor.load(FollowRange);
        editor.load(Shadow);
        editor.load(DomLayout, {
            components: [
                {
                    id: 'editor',
                    async render(editor: JWEditor): Promise<VNode[]> {
                        const template = `<jw-editor>
                            <t-range><t t-zone="range"/></t-range>
                            <main><t t-zone="main"/></main>
                            <t t-zone="default"/>
                            </jw-editor>`;
                        return editor.plugins.get(Parser).parse('text/html', template);
                    },
                },
                {
                    id: 'editable',
                    render: async (editor: JWEditor): Promise<VNode[]> => {
                        const shadow = new ShadowNode();
                        const style = new MetadataNode({ htmlTag: 'STYLE' });
                        style.contents = '* {margin: 0; padding: 0; border: 1px #aaa dotted;}';
                        const nodes = await parseEditable(editor, section);
                        shadow.append(style, ...nodes);
                        return [shadow];
                    },
                },
                {
                    id: 'custom',
                    async render(): Promise<VNode[]> {
                        const template = `<section style="width: 20px; height: 20px; background: red;">-</section>`;
                        return editor.plugins.get(Parser).parse('text/html', template);
                    },
                },
            ],
            componentZones: [
                ['editor', ['root']],
                ['editable', ['main']],
                ['custom', ['range']],
            ],
            location: [section, 'replace'],
        });
        await editor.start();

        const range = container.querySelector('jw-follow-range') as HTMLElement;
        const shadowRoot = container.querySelector('jw-shadow').shadowRoot;

        const i = shadowRoot.querySelector('p i');
        setDomSelection(i.firstChild, 10, i.firstChild, 10);
        await waitToolbarRedraw();
        expect(range.style.display).to.equal('none');

        setDomSelection(i.firstChild, 10, i.firstChild, 14);
        await waitToolbarRedraw();
        expect(range.style.display).to.equal('');
        expect(parseInt(range.style.top, 10)).to.be.within(135, 145);
        expect(parseInt(range.style.left, 10)).to.be.within(110, 120);

        setDomSelection(i.firstChild, 10, i.firstChild, 20);
        await waitToolbarRedraw();
        expect(range.style.display).to.equal('');
        expect(parseInt(range.style.top, 10)).to.be.within(135, 145);
        expect(parseInt(range.style.left, 10)).to.be.within(130, 140);

        setDomSelection(i.firstChild, 10, i.previousSibling.previousSibling.previousSibling, 10);
        await waitToolbarRedraw();
        expect(range.style.display).to.equal('');
        expect(parseInt(range.style.top, 10)).to.be.within(135, 145);
        expect(parseInt(range.style.left, 10)).to.be.within(80, 90);

        setDomSelection(i.firstChild, 20, i.firstChild, 20);
        await waitToolbarRedraw();
        expect(range.style.display).to.equal('none');
    });
});
