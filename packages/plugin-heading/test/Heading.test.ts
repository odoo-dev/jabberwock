import { expect } from 'chai';
import { HeadingNode } from '../HeadingNode';

describe('plugin-heading', () => {
    describe('HeadingNode', () => {
        it('should create a heading', async () => {
            for (let i = 1; i <= 6; i++) {
                const vNode = new HeadingNode(i);
                expect(vNode.atomic).to.equal(false);
                expect(vNode.htmlTag).to.equal('H' + i);
                expect(vNode.level).to.equal(i);
            }
        });
    });
});
