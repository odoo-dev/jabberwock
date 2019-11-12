import { testEditor } from '../../../src/core/utils/testUtils';

describe('core', () => {
    describe('utils', () => {
        describe('testUtils', () => {
            describe('testEditor()', () => {
                it('content should be the same (without range)', () => {
                    let content;
                    content = 'a';
                    testEditor({
                        contentBefore: content,
                        contentAfter: content,
                        renderingOptions: {
                            renderTextualRange: false,
                        },
                    });

                    content = '<b>a</b>';
                    testEditor({
                        contentBefore: content,
                        contentAfter: content,
                        renderingOptions: {
                            renderTextualRange: false,
                        },
                    });
                });
            });
        });
    });
});
