import { expect } from 'chai';
import JWEditor from '../../core/src/JWEditor';
import { VNode } from '../../core/src/VNodes/VNode';
import { Dom } from '../Dom';
import { Renderer } from '../../plugin-renderer/src/Renderer';

describe('DefaultDomRenderer', () => {
    describe('render', () => {
        it('should render a VNode', async () => {
            const editor = new JWEditor(document.createElement('p'));
            editor.load(Dom);
            await editor.start();
            const node = new VNode();
            editor.vDocument.root.append(node);
            const renderer = editor.plugins.get(Renderer);
            const element = await renderer.render<Node[]>('dom', editor.vDocument.root);
            if (expect(element).to.exist) {
                expect(element[0].firstChild.nodeName).to.equal('VNODE-' + node.id);
            }
        });
    });
});
