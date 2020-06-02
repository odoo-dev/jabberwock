import { expect } from 'chai';
import JWEditor from '../../core/src/JWEditor';
import { Char } from '../src/Char';
import { CharNode } from '../src/CharNode';
import { Html } from '../../plugin-html/src/Html';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { ContainerNode } from '../../core/src/VNodes/ContainerNode';

describe('CharDomRenderer', () => {
    describe('render', () => {
        let editor: JWEditor;
        beforeEach(async () => {
            editor = new JWEditor();
            editor.load(Html, { target: document.createElement('p') });
            editor.load(Char);
            await editor.start();
        });
        afterEach(async () => {
            await editor.stop();
        });
        it('should insert 1 space and 1 nbsp instead of 2 spaces', async () => {
            const root = new ContainerNode();
            root.append(new CharNode({ char: 'a' }));
            root.append(new CharNode({ char: ' ' }));
            root.append(new CharNode({ char: ' ' }));
            root.append(new CharNode({ char: 'b' }));

            const renderer = editor.plugins.get(Renderer);
            const rendered = await renderer.render<Element[]>('dom/html', root);
            if (expect(rendered).to.exist) {
                expect(rendered[0].innerHTML).to.equal('a &nbsp;b');
            }
        });
        it('should insert 2 spaces and 2 nbsp instead of 4 spaces', async () => {
            const root = new ContainerNode();
            root.append(new CharNode({ char: 'a' }));
            root.append(new CharNode({ char: ' ' }));
            root.append(new CharNode({ char: ' ' }));
            root.append(new CharNode({ char: ' ' }));
            root.append(new CharNode({ char: ' ' }));
            root.append(new CharNode({ char: 'b' }));

            const renderer = editor.plugins.get(Renderer);
            const rendered = await renderer.render<Element[]>('dom/html', root);
            if (expect(rendered).to.exist) {
                expect(rendered[0].innerHTML).to.equal('a &nbsp; &nbsp;b');
            }
        });
    });
});
