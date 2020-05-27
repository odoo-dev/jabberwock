import { LinkFormat } from '../src/LinkFormat';
import { expect } from 'chai';
describe('Link', () => {
    describe('LinkFormat', () => {
        describe('clone()', () => {
            it('should clone the link with proper url', () => {
                const format = new LinkFormat('/url');
                expect(format.clone().url).to.eql('/url');
            });
        });
    });
});
