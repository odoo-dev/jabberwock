import { expect } from 'chai';
import JWEditor from '../../src/core/JWEditor';
import { Renderer } from '../../src/core/utils/Renderer';
import { VNode, VNodeType } from '../../src/core/stores/VNode';

describe('utils', () => {
    describe('Renderer', () => {
        describe('_renderTextNode', () => {
            it('should insert 1 space and 1 nbsp instead of 2 spaces', () => {
                const element = document.createElement('p');
                element.innerHTML = 'a';
                document.body.appendChild(element);

                const editor = new JWEditor(element);
                editor.start();
                editor.vDocument.root.append(new VNode(VNodeType.CHAR, '', ' '));
                editor.vDocument.root.append(new VNode(VNodeType.CHAR, '', ' '));
                editor.vDocument.root.append(new VNode(VNodeType.CHAR, '', 'b'));

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

                const editor = new JWEditor(element);
                editor.start();
                editor.vDocument.root.append(new VNode(VNodeType.CHAR, '', ' '));
                editor.vDocument.root.append(new VNode(VNodeType.CHAR, '', ' '));
                editor.vDocument.root.append(new VNode(VNodeType.CHAR, '', ' '));
                editor.vDocument.root.append(new VNode(VNodeType.CHAR, '', ' '));
                editor.vDocument.root.append(new VNode(VNodeType.CHAR, '', 'b'));

                const renderer = new Renderer();
                renderer.render(editor.vDocument, editor.editable);
                expect(editor.editable.innerHTML).to.equal('a &nbsp; &nbsp;b');
                editor.stop();
                element.remove();
            });
        });
    });
});
