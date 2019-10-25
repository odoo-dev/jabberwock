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
        expect(env.editor.vDocument).to.have.property('root');
    });
    it('should have template in vDocument', () => {
        expect(env.root.length).to.equal(1);
        expect(env.root.firstLeaf.type).to.equal('RANGE_START');
        expect(env.root.firstLeaf.nextSibling.type).to.equal('RANGE_END');
        expect(env.root.firstChild.type).to.equal('PARAGRAPH');
        expect(env.root.firstChild.children.length).to.equal(6); // text + range
        expect(env.root.firstChild.text()).to.equal('Test');
    });
});
