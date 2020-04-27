import { expect } from 'chai';
import JWEditor from '../../core/src/JWEditor';
import { ContainerNode } from '../../core/src/VNodes/ContainerNode';
import { Html } from '../src/Html';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { nodeName } from '../../utils/src/utils';

describe('DefaultDomRenderer', () => {
    describe('render', () => {
        it('should render a VNode', async () => {
            const editor = new JWEditor();
            editor.load(Html, { target: document.createElement('p') });
            await editor.start();
            const root = new ContainerNode();
            const node = new ContainerNode();
            root.append(node);
            const renderer = editor.plugins.get(Renderer);
            const element = await renderer.render<Node[]>('dom/html', root);
            if (expect(element).to.exist) {
                expect(nodeName(element[0].firstChild)).to.equal('CONTAINERNODE-' + node.id);
            }
        });
    });
});
