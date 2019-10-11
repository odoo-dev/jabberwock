import { expect } from 'chai';
import { TestEnvironment } from '../../../src/core/utils/TestUtils';
import template from './parser.test.template.xml';

let env: TestEnvironment;

describe('Parser', () => {
    before(() => {
        env = new TestEnvironment(template);
    });
    after(() => {
        env.destroy();
    });
    it('should have parsed properly', () => {
        const firstCharInLastPara = env.root.lastChild.firstChild;
        expect(firstCharInLastPara.value).to.equal('S');
        expect(firstCharInLastPara.format.italic).to.be.true;
    });
});
