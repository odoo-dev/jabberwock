import { expect } from 'chai';
import * as sinon from 'sinon';

describe('TestExample', () => {
    it('should run', () => {
        const callback = sinon.fake();
        callback();
        expect(callback.callCount).to.equal(1);
    });
});
