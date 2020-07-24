import { expect } from 'chai';
import JWEditor from '../../core/src/JWEditor';
import { ContainerNode } from '../../core/src/VNodes/ContainerNode';
import { Html } from '../src/Html';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { Attributes } from '../../plugin-xml/src/Attributes';

describe('Html', () => {
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
