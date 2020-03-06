import { expect } from 'chai';
import { ParagraphNode } from '../src/ParagraphNode';

describe('plugin-paragraph', () => {
    describe('ParagraphNode', () => {
        it('should create a paragraph', async () => {
            const vNode = new ParagraphNode();
            expect(vNode.atomic).to.equal(false);
            expect(vNode.htmlTag).to.equal('P');
        });
    });
});
