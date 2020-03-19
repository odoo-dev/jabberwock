import { expect } from 'chai';
import JWEditor from '../../core/src/JWEditor';
import { LineBreak } from '../src/LineBreak';
import { FragmentNode } from '../../core/src/VNodes/FragmentNode';
import { VElement } from '../../core/src/VNodes/VElement';
import { LineBreakNode } from '../src/LineBreakNode';
import { Dom } from '../../plugin-dom/src/Dom';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { nodeName } from '../../utils/src/utils';

describe('LineBreakDomRenderer', () => {
    describe('render', () => {
        let editor: JWEditor;
        let root: FragmentNode;
        beforeEach(async () => {
            editor = new JWEditor();
            editor.load(Dom, { target: document.createElement('div') });
            editor.load(LineBreak);
            await editor.start();
            root = editor.vDocument.root;
        });
        afterEach(() => {
            editor.stop();
        });
        it('should render an ending lineBreak', async () => {
            const p = new VElement('fake-p');
            const lineBreak = new LineBreakNode();
            p.append(lineBreak);
            root.append(p);
            const renderer = editor.plugins.get(Renderer);
            const element = await renderer.render<Node[]>('dom', root);
            if (expect(element).to.exist) {
                const domElement = element[0];
                expect(domElement.childNodes.length).to.equal(1);
                const domP = domElement.firstChild;
                expect(domP.childNodes.length).to.equal(2);
                expect(nodeName(domP.firstChild)).to.equal('BR');
                expect(nodeName(domP.lastChild)).to.equal('BR');
            }
        });
        it('should render a lineBreak with node after', async () => {
            const p = new VElement('FAKE-P');
            const lineBreak = new LineBreakNode();
            p.append(lineBreak);
            const c = new VElement('FAKE-CHAR');
            p.append(c);
            root.append(p);
            const renderer = editor.plugins.get(Renderer);
            const element = await renderer.render<Node[]>('dom', root);
            if (expect(element).to.exist) {
                const domElement = element[0];
                expect(domElement.childNodes.length).to.equal(1);
                const domP = domElement.firstChild;
                expect(nodeName(domP)).to.equal('FAKE-P');
                expect(domP.childNodes.length).to.equal(2);
                expect(nodeName(domP.firstChild)).to.equal('BR');
                expect(nodeName(domP.childNodes[1])).to.equal('FAKE-CHAR');
            }
        });
    });
});
