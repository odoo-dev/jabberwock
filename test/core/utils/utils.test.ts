import { expect } from 'chai';
import { TestEnvironment } from '../../../src/core/utils/TestUtils';

let env: TestEnvironment;

describe('Utils', () => {
    before(() => {
        env = new TestEnvironment('<p>Test</p>');
    });
    after(() => {
        env.destroy();
    });
    it('should have vDocument', () => {
        expect(env.editor).to.have.property('vDocument');
        expect(env.editor.vDocument).to.have.property('contents');
    });
    it('should have template in vDocument', () => {
        expect(env.root.length).to.equal(3);
        expect(env.root.firstChild.type).to.equal('RANGE_START');
        expect(env.root.nthChild(1).type).to.equal('RANGE_END');
        expect(env.root.nthChild(2).type).to.equal('PARAGRAPH');
        expect(env.root.nthChild(2).children.length).to.equal(4);
        expect(env.root.nthChild(2).text()).to.equal('Test');
    });
});
