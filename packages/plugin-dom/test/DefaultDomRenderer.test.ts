import { expect } from 'chai';
import JWEditor from '../../core/src/JWEditor';
import { VNode } from '../../core/src/VNodes/VNode';
import { Dom } from '../src/Dom';

describe('DefaultDomRenderer', () => {
    describe('render', () => {
        it('should render a VNode', async () => {
            const editor = new JWEditor();
            editor.loadPlugin(Dom, { target: document.createElement('p') });
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
