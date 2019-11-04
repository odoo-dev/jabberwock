import { expect } from 'chai';
import * as sinon from 'sinon';
import JWEditor from '../../src/core/JWEditor';
import { Renderer } from '../../src/core/utils/Renderer';
import { VNode, VNodeType } from '../../src/core/stores/VNode';

describe('utils', () => {
    describe('Renderer', () => {
        describe('_renderTextNode', () => {
            it('should insert 1 nbsp if 2 "space"', () => {
                const element = document.createElement('p');
                document.body.appendChild(element);
                element.innerHTML = 'a';

                const jwEditor = new JWEditor(element);
                jwEditor.start();
                jwEditor.vDocument.root.append(new VNode(VNodeType.CHAR, '', ' '));
                jwEditor.vDocument.root.append(new VNode(VNodeType.CHAR, '', ' '));
                jwEditor.vDocument.root.append(new VNode(VNodeType.CHAR, '', 'b'));

                const renderer = new Renderer();
                renderer.render(jwEditor.vDocument, jwEditor.editable);
                expect(jwEditor.editable.innerHTML).to.equal('a &nbsp;b');
                element.remove();
            });

            it('should insert 2 nbsp if 4 "space"', () => {
                const element = document.createElement('p');
                document.body.appendChild(element);
                element.innerHTML = 'a';

                const jwEditor = new JWEditor(element);
                jwEditor.start();
                jwEditor.vDocument.root.append(new VNode(VNodeType.CHAR, '', ' '));
                jwEditor.vDocument.root.append(new VNode(VNodeType.CHAR, '', ' '));
                jwEditor.vDocument.root.append(new VNode(VNodeType.CHAR, '', ' '));
                jwEditor.vDocument.root.append(new VNode(VNodeType.CHAR, '', ' '));
                jwEditor.vDocument.root.append(new VNode(VNodeType.CHAR, '', 'b'));

                const renderer = new Renderer();
                renderer.render(jwEditor.vDocument, jwEditor.editable);
                expect(jwEditor.editable.innerHTML).to.equal('a &nbsp; &nbsp;b');
                element.remove();
            });
        });
    });
});
