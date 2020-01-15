import { expect } from 'chai';
import { createBasicEditor } from '../../bundles/basic';
import { Renderer } from '../src/Renderer';
import { testEditor } from '../../utils/src/testUtils';
import { CharNode } from '../../plugin-char/CharNode';

describe('utils', () => {
    describe('Renderer', () => {
        describe('_renderTextNode', () => {
            it('should insert 1 space and 1 nbsp instead of 2 spaces', () => {
                const element = document.createElement('p');
                element.innerHTML = 'a';
                document.body.appendChild(element);

                const editor = createBasicEditor(element);
                editor.start();
                editor.vDocument.root.append(new CharNode(' '));
                editor.vDocument.root.append(new CharNode(' '));
                editor.vDocument.root.append(new CharNode('b'));

                const renderer = new Renderer();
                renderer.render(editor.vDocument, editor.editable);
                expect(editor.editable.innerHTML).to.equal('a &nbsp;b');
                editor.stop();
                element.remove();
            });

            it('should insert 2 spaces and 2 nbsp instead of 4 spaces', () => {
                const element = document.createElement('p');
                element.innerHTML = 'a';
                document.body.appendChild(element);

                const editor = createBasicEditor(element);
                editor.start();
                editor.vDocument.root.append(new CharNode(' '));
                editor.vDocument.root.append(new CharNode(' '));
                editor.vDocument.root.append(new CharNode(' '));
                editor.vDocument.root.append(new CharNode(' '));
                editor.vDocument.root.append(new CharNode('b'));

                const renderer = new Renderer();
                renderer.render(editor.vDocument, editor.editable);
                expect(editor.editable.innerHTML).to.equal('a &nbsp; &nbsp;b');
                editor.stop();
                element.remove();
            });
        });
        describe('range', () => {
            it('should render text range at the beginning', async () => {
                const content = `<p>[a]bc</p>`;
                await testEditor({ contentBefore: content, contentAfter: content });
            });
            it('should render text range at the end', async () => {
                const content = `<p>ab[c]</p>`;
                await testEditor({ contentBefore: content, contentAfter: content });
            });
            it('should render text range in the whole tag', async () => {
                const content = `<p>[abc]</p>`;
                await testEditor({ contentBefore: content, contentAfter: content });
            });
            it('should render text range that is collapsed in the beginning', async () => {
                const content = `<p>[]abc</p>`;
                await testEditor({ contentBefore: content, contentAfter: content });
            });
            it('should render text range that is collapsed in the end', async () => {
                const content = `<p>abc[]</p>`;
                await testEditor({ contentBefore: content, contentAfter: content });
            });
            it('should render text range that is collapsed in the middle', async () => {
                const content = `<p>ab[]c</p>`;
                await testEditor({ contentBefore: content, contentAfter: content });
            });
            it('should render the range outside the tag', async () => {
                await testEditor({
                    contentBefore: '<p>[<b>a</b>]</p>',
                    contentAfter: '<p><b>[a]</b></p>',
                });
            });
        });
    });
});
