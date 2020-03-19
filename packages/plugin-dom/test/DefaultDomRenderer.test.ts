import { expect } from 'chai';
import JWEditor from '../../core/src/JWEditor';
import { VNode } from '../../core/src/VNodes/VNode';
import { Dom } from '../src/Dom';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { nodeName } from '../../utils/src/utils';

describe('DefaultDomRenderer', () => {
    describe('render', () => {
        it('should render a VNode', async () => {
            const editor = new JWEditor();
            editor.load(Dom, { target: document.createElement('p') });
            await editor.start();
            const node = new VNode();
            editor.vDocument.root.append(node);
            const renderer = editor.plugins.get(Renderer);
            const element = await renderer.render<Node[]>('dom', editor.vDocument.root);
            if (expect(element).to.exist) {
                expect(nodeName(element[0].firstChild)).to.equal('VNODE-' + node.id);
            }
        });
    });
});
