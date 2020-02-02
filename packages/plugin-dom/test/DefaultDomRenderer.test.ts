import { expect } from 'chai';
import JWEditor from '../../core/src/JWEditor';
import { VNode } from '../../core/src/VNodes/VNode';
import { Dom } from '../Dom';

describe('DefaultDomRenderer', () => {
    describe('render', () => {
        it('should render a VNode', async () => {
            const editor = new JWEditor(document.createElement('p'));
            editor.addPlugin(Dom);
            await editor.start();
            const node = new VNode();
            editor.vDocument.root.append(node);
            const [element] = await editor.render<Node[]>('dom', editor.vDocument.root);
            expect(element.firstChild.nodeName).to.equal('VNODE-' + node.id);
        });
    });
});
