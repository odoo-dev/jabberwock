import { expect } from 'chai';
import { ParagraphNode } from '../src/ParagraphNode';
import { ContainerNode } from '../../core/src/VNodes/ContainerNode';
import { isNodePredicate } from '../../core/src/VNodes/AbstractNode';

describe('plugin-paragraph', () => {
    describe('ParagraphNode', () => {
        it('should create a paragraph', async () => {
            const vNode = new ParagraphNode();
            expect(isNodePredicate(vNode, ContainerNode)).to.equal(true);
            expect(vNode.htmlTag).to.equal('P');
        });
    });
});
