import { testEditor } from '../src/testUtils';

describe('core', () => {
    describe('utils', () => {
        describe('testUtils', () => {
            describe('testEditor()', () => {
                it('content should be the same (without range)', async () => {
                    let content;
                    content = 'a';
                    await testEditor({
                        contentBefore: content,
                        contentAfter: content,
                    });

                    content = '<b>a</b>';
                    await testEditor({
                        contentBefore: content,
                        contentAfter: content,
                    });
                });
            });
        });
    });
});
