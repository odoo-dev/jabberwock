import { expect } from 'chai';
import JWEditor from '../../core/src/JWEditor';
import { VNode } from '../../core/src/VNodes/VNode';
import { Dom } from '../Dom';

describe('DefaultDomRenderer', () => {
    describe('render', () => {
        it('should render a VNode', async () => {
            const editor = new JWEditor(document.createElement('p'));
            editor.loadPlugin(Dom);
            await editor.start();
            const node = new VNode();
            editor.vDocument.root.append(node);
            const element = await editor.render<Node[]>('dom', editor.vDocument.root);
            if (expect(element).to.exist) {
                expect(element[0].firstChild.nodeName).to.equal('VNODE-' + node.id);
            }
        });
    });
});
