import { expect } from 'chai';
import JWEditor from '../../core/src/JWEditor';
import { Char } from '../Char';
import { CharNode } from '../CharNode';
import { FragmentNode } from '../../core/src/VNodes/FragmentNode';

describe('CharDomRenderer', () => {
    describe('render', () => {
        let editor: JWEditor;
        let root: FragmentNode;
        beforeEach(async () => {
            editor = new JWEditor(document.createElement('p'));
            editor.addPlugin(Char);
            await editor.start();
            root = editor.vDocument.root;
        });
        afterEach(async () => {
            editor.stop;
        });
        it('should insert 1 space and 1 nbsp instead of 2 spaces', async () => {
            root.append(new CharNode('a'));
            root.append(new CharNode(' '));
            root.append(new CharNode(' '));
            root.append(new CharNode('b'));

            const [rendered] = await editor.render<Element[]>('dom', root);
            const innerHTMLContainer = document.createElement('p');
            innerHTMLContainer.append(rendered);
            expect(innerHTMLContainer.innerHTML).to.equal('a &nbsp;b');
        });
        it('should insert 2 spaces and 2 nbsp instead of 4 spaces', async () => {
            root.append(new CharNode('a'));
            root.append(new CharNode(' '));
            root.append(new CharNode(' '));
            root.append(new CharNode(' '));
            root.append(new CharNode(' '));
            root.append(new CharNode('b'));

            const [rendered] = await editor.render<Element[]>('dom', root);
            const innerHTMLContainer = document.createElement('p');
            innerHTMLContainer.append(rendered);
            expect(innerHTMLContainer.innerHTML).to.equal('a &nbsp; &nbsp;b');
        });
    });
});
