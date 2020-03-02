import { expect } from 'chai';
import JWEditor from '../../core/src/JWEditor';
import { LineBreak } from '../LineBreak';
import { FragmentNode } from '../../core/src/VNodes/FragmentNode';
import { VElement } from '../../core/src/VNodes/VElement';
import { LineBreakNode } from '../LineBreakNode';
import { Dom } from '../../plugin-dom/Dom';
import { Renderer } from '../../plugin-renderer/src/Renderer';

describe('LineBreakDomRenderer', () => {
    describe('render', () => {
        let editor: JWEditor;
        let root: FragmentNode;
        beforeEach(async () => {
            editor = new JWEditor(document.createElement('div'));
            editor.loadPlugin(Dom);
            editor.loadPlugin(LineBreak);
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
                expect(domP.firstChild.nodeName).to.equal('BR');
                expect(domP.lastChild.nodeName).to.equal('BR');
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
                expect(domP.nodeName).to.equal('FAKE-P');
                expect(domP.childNodes.length).to.equal(2);
                expect(domP.firstChild.nodeName).to.equal('BR');
                expect(domP.childNodes[1].nodeName).to.equal('FAKE-CHAR');
            }
        });
    });
});
