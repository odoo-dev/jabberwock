import { expect } from 'chai';
import JWEditor from '../../core/src/JWEditor';
import { ContainerNode } from '../../core/src/VNodes/ContainerNode';
import { Html } from '../src/Html';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { testEditor } from '../../utils/src/testUtils';
import { BasicEditor } from '../../bundle-basic-editor/BasicEditor';
import { Parser } from '../../plugin-parser/src/Parser';

describe('Html', () => {
    describe('parser', () => {
        it('should parse special attribute and content', async () => {
            await testEditor(BasicEditor, {
                contentBefore:
                    '<div>&lt;poulet&gt; kot kot &lt;/poulet&gt; <span data="1 &lt; 2" tutu="b &nbsp; a">toto</span>&nbsp; a</div>',
                contentAfter:
                    '<div>&lt;poulet&gt; kot kot &lt;/poulet&gt; <span data="1 < 2" tutu="b &nbsp; a">toto</span>&nbsp; a</div>',
            });
        });
        it('should parse special attribute and content use text/html parser', async () => {
            const editor = new BasicEditor();
            editor.load(Html);
            await editor.start();
            const parser = editor.plugins.get(Parser);
            const nodes = await parser.parse(
                'text/html',
                '<div>&lt;poulet&gt; kot kot &lt;/poulet&gt; <span data="1 &lt; 2" tutu="b &nbsp; a">toto</span>&nbsp; a</div>',
            );

            const renderer = editor.plugins.get(Renderer);
            const rootItem = await renderer.render<Node[]>('dom/html', nodes[0]);

            expect(rootItem).to.exist;
            expect((rootItem[0] as Element).outerHTML).to.equal(
                '<div>&lt;poulet&gt; kot kot &lt;/poulet&gt; <span data="1 < 2" tutu="b &nbsp; a">toto</span>&nbsp; a</div>',
            );
        });
    });
    describe('DefaultDomObjectRenderer', () => {
        it('should render a VNode', async () => {
            const editor = new JWEditor();
            editor.load(Html);
            await editor.start();
            const root = new ContainerNode();
            const node = new ContainerNode();
            root.append(node);
            const renderer = editor.plugins.get(Renderer);
            const rootItem = await renderer.render<Node[]>('dom/html', root);
            expect(rootItem).to.exist;
            expect((rootItem[0] as Element).outerHTML).to.equal(
                '<containernode id="' +
                    root.id +
                    '"><containernode id="' +
                    node.id +
                    '"><br></containernode></containernode>',
            );
        });
        it('should render a VNode with style important', async () => {
            const editor = new JWEditor();
            editor.load(Html);
            await editor.start();
            const root = new ContainerNode();
            const node = new ContainerNode();
            root.append(node);
            node.modifiers.get(Attributes).style.set('border-radius', '10px !important');
            node.modifiers.get(Attributes).style.set('border', '10px !important');
            const renderer = editor.plugins.get(Renderer);
            const rootItem = (await renderer.render<Node[]>('dom/html', root)) as Element[];
            expect(rootItem[0].children[0].getAttribute('style')).to.equal(
                'border-radius: 10px !important;border: 10px !important;',
            );
        });
    });
});
