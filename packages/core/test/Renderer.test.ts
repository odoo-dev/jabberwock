import { expect } from 'chai';
import { BasicEditor } from '../../../bundles/BasicEditor';
import { DomRenderer } from '../../plugin-dom/DomRenderer';
import { testEditor } from '../../utils/src/testUtils';
import { CharNode } from '../../plugin-char/CharNode';

describe('utils', () => {
    describe('Renderer', () => {
        describe('_renderTextNode', () => {
            it('should insert 1 space and 1 nbsp instead of 2 spaces', () => {
                const element = document.createElement('p');
                element.innerHTML = 'a';
                document.body.appendChild(element);

                const editor = new BasicEditor(element);
                editor.start();
                editor.vDocument.root.append(new CharNode(' '));
                editor.vDocument.root.append(new CharNode(' '));
                editor.vDocument.root.append(new CharNode('b'));

                const renderer = new DomRenderer();
                renderer.render(editor.vDocument, editor.editable);
                expect(editor.editable.innerHTML).to.equal('a &nbsp;b');
                editor.stop();
                element.remove();
            });

            it('should insert 2 spaces and 2 nbsp instead of 4 spaces', () => {
                const element = document.createElement('p');
                element.innerHTML = 'a';
                document.body.appendChild(element);

                const editor = new BasicEditor(element);
                editor.start();
                editor.vDocument.root.append(new CharNode(' '));
                editor.vDocument.root.append(new CharNode(' '));
                editor.vDocument.root.append(new CharNode(' '));
                editor.vDocument.root.append(new CharNode(' '));
                editor.vDocument.root.append(new CharNode('b'));

                const renderer = new DomRenderer();
                renderer.render(editor.vDocument, editor.editable);
                expect(editor.editable.innerHTML).to.equal('a &nbsp; &nbsp;b');
                editor.stop();
                element.remove();
            });
        });
        describe('selection', () => {
            it('should render textual selection at the beginning', async () => {
                const content = `<p>[a]bc</p>`;
                await testEditor(BasicEditor, { contentBefore: content, contentAfter: content });
            });
            it('should render textual selection at the end', async () => {
                const content = `<p>ab[c]</p>`;
                await testEditor(BasicEditor, { contentBefore: content, contentAfter: content });
            });
            it('should render textual selection in the whole tag', async () => {
                const content = `<p>[abc]</p>`;
                await testEditor(BasicEditor, { contentBefore: content, contentAfter: content });
            });
            it('should render textual selection that is collapsed in the beginning', async () => {
                const content = `<p>[]abc</p>`;
                await testEditor(BasicEditor, { contentBefore: content, contentAfter: content });
            });
            it('should render textual selection that is collapsed in the end', async () => {
                const content = `<p>abc[]</p>`;
                await testEditor(BasicEditor, { contentBefore: content, contentAfter: content });
            });
            it('should render textual selection that is collapsed in the middle', async () => {
                const content = `<p>ab[]c</p>`;
                await testEditor(BasicEditor, { contentBefore: content, contentAfter: content });
            });
            it('should render the selection outside the tag', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>[<b>a</b>]</p>',
                    contentAfter: '<p><b>[a]</b></p>',
                });
            });
        });
    });
});
