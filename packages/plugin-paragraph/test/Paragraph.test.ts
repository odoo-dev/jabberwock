import { expect } from 'chai';
import { ParagraphNode } from '../src/ParagraphNode';
import { ContainerNode } from '../../core/src/VNodes/ContainerNode';

describe('plugin-paragraph', () => {
    describe('ParagraphNode', () => {
        it('should create a paragraph', async () => {
            const vNode = new ParagraphNode();
            expect(vNode instanceof ContainerNode).to.equal(true);
            expect(vNode.htmlTag).to.equal('P');
        });
    });
});
