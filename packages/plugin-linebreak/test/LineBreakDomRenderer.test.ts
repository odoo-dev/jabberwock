import { expect } from 'chai';
import JWEditor from '../../core/src/JWEditor';
import { LineBreak } from '../src/LineBreak';
import { VElement } from '../../core/src/VNodes/VElement';
import { LineBreakNode } from '../src/LineBreakNode';
import { Html } from '../../plugin-html/src/Html';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { nodeName } from '../../utils/src/utils';
import { ContainerNode } from '../../core/src/VNodes/ContainerNode';

describe('LineBreakDomRenderer', () => {
    describe('render', () => {
        let editor: JWEditor;
        beforeEach(async () => {
            editor = new JWEditor();
            editor.load(Html, { target: document.createElement('div') });
            editor.load(LineBreak);
            await editor.start();
        });
        afterEach(() => {
            editor.stop();
        });
        it('should render an ending lineBreak', async () => {
            const root = new ContainerNode();
            const p = new VElement({ htmlTag: 'fake-p' });
            const lineBreak = new LineBreakNode();
            p.append(lineBreak);
            root.append(p);
            const renderer = editor.plugins.get(Renderer);
            const element = await renderer.render<Node[]>('dom/html', root);
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
            const root = new ContainerNode();
            const p = new VElement({ htmlTag: 'FAKE-P' });
            const lineBreak = new LineBreakNode();
            p.append(lineBreak);
            const c = new VElement({ htmlTag: 'FAKE-CHAR' });
            p.append(c);
            root.append(p);
            const renderer = editor.plugins.get(Renderer);
            const element = await renderer.render<Node[]>('dom/html', root);
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
