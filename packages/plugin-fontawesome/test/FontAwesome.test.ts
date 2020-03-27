import { describePlugin } from '../../utils/src/testUtils';
import { FontAwesome } from '../src/FontAwesome';
import { BasicEditor } from '../../../bundles/BasicEditor';
import JWEditor from '../../core/src/JWEditor';
import { Core } from '../../core/src/Core';

const deleteForward = async (editor: JWEditor): Promise<void> =>
    await editor.execCommand<Core>('deleteForward');
const deleteBackward = async (editor: JWEditor): Promise<void> =>
    await editor.execCommand<Core>('deleteBackward');

describePlugin(FontAwesome, testEditor => {
    describe('parse/render', () => {
        it('should parse an old-school fontawesome', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p><i class="fa fa-star"></i></p>',
                contentAfter: '<p>\u200b<i class="fa fa-star"></i>\u200b</p>',
            });
        });
        it('should parse a brand fontawesome', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p><i class="fab fa-opera"></i></p>',
                contentAfter: '<p>\u200b<i class="fab fa-opera"></i>\u200b</p>',
            });
        });
        it('should parse a duotone fontawesome', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p><i class="fad fa-bus-alt"></i></p>',
                contentAfter: '<p>\u200b<i class="fad fa-bus-alt"></i>\u200b</p>',
            });
        });
        it('should parse a light fontawesome', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p><i class="fab fa-accessible-icon"></i></p>',
                contentAfter: '<p>\u200b<i class="fab fa-accessible-icon"></i>\u200b</p>',
            });
        });
        it('should parse a regular fontawesome', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p><i class="far fa-money-bill-alt"></i></p>',
                contentAfter: '<p>\u200b<i class="far fa-money-bill-alt"></i>\u200b</p>',
            });
        });
        it('should parse a solid fontawesome', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p><i class="fas fa-pastafarianism"></i></span></p>',
                contentAfter: '<p>\u200b<i class="fas fa-pastafarianism"></i>\u200b</p>',
            });
        });
        it('should parse a fontawesome in a <span>', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p><span class="fas fa-pastafarianism"></span></p>',
                contentAfter: '<p>\u200b<span class="fas fa-pastafarianism"></span>\u200b</p>',
            });
        });
        it('should parse a fontawesome in a <i>', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p><i class="fas fa-pastafarianism"></i></i></p>',
                contentAfter: '<p>\u200b<i class="fas fa-pastafarianism"></i>\u200b</p>',
            });
        });
        it('should parse a fontawesome with more classes', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p><i class="red fas bordered fa-pastafarianism big"></i></p>',
                contentAfter:
                    '<p>\u200b<i class="red fas bordered fa-pastafarianism big"></i>\u200b</p>',
            });
        });
        it('should parse a fontawesome with multi-line classes', async () => {
            await testEditor(BasicEditor, {
                contentBefore: `<p><i class="fas
                                fa-pastafarianism"></i></p>`,
                contentAfter: `<p>\u200b<i class="fas
                                fa-pastafarianism"></i>\u200b</p>`,
            });
        });
        it('should parse a fontawesome with more multi-line classes', async () => {
            await testEditor(BasicEditor, {
                contentBefore: `<p><i class="red fas bordered
                                big fa-pastafarianism scary"></i></p>`,
                contentAfter: `<p>\u200b<i class="red fas bordered
                                big fa-pastafarianism scary"></i>\u200b</p>`,
            });
        });
        it('should parse a fontawesome at the beginning of a paragraph', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p><i class="fas fa-pastafarianism"></i>a[b]c</p>',
                contentAfter: '<p>\u200b<i class="fas fa-pastafarianism"></i>\u200ba[b]c</p>',
            });
        });
        it('should parse a fontawesome in the middle of a paragraph', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p>a[b]c<i class="fas fa-pastafarianism"></i>def</p>',
                contentAfter: '<p>a[b]c\u200b<i class="fas fa-pastafarianism"></i>\u200bdef</p>',
            });
        });
        it('should parse a fontawesome at the end of a paragraph', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p>a[b]c<i class="fas fa-pastafarianism"></i></p>',
                contentAfter: '<p>a[b]c\u200b<i class="fas fa-pastafarianism"></i>\u200b</p>',
            });
        });
    });
    describe('deleteForward', () => {
        describe('Selection collapsed', () => {
            describe('Basic', () => {
                it('should delete a fontawesome', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab[]<i class="fas fa-pastafarianism"></i>cd</p>',
                        stepFunction: deleteForward,
                        contentAfter: '<p>ab[]cd</p>',
                    });
                });
                it('should not delete a fontawesome', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab<i class="fas fa-pastafarianism"></i>[]cd</p>',
                        stepFunction: deleteForward,
                        contentAfter:
                            '<p>ab\u200b<i class="fas fa-pastafarianism"></i>\u200b[]d</p>',
                    });
                });
            });
        });
        describe('Selection not collapsed', () => {
            describe('Basic', () => {
                it('should delete a fontawesome', async () => {
                    // Forward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab[<i class="fas fa-pastafarianism"></i>]cd</p>',
                        stepFunction: deleteForward,
                        contentAfter: '<p>ab[]cd</p>',
                    });
                    // Backward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab]<i class="fas fa-pastafarianism"></i>[cd</p>',
                        stepFunction: deleteForward,
                        contentAfter: '<p>ab[]cd</p>',
                    });
                });
            });
        });
    });
    describe('deleteBackward', () => {
        describe('Selection collapsed', () => {
            describe('Basic', () => {
                it('should delete a fontawesome', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab<i class="fas fa-pastafarianism"></i>[]cd</p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<p>ab[]cd</p>',
                    });
                });
                it('should not delete a fontawesome', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab[]<i class="fas fa-pastafarianism"></i>cd</p>',
                        stepFunction: deleteBackward,
                        contentAfter:
                            '<p>a[]\u200b<i class="fas fa-pastafarianism"></i>\u200bcd</p>',
                    });
                });
            });
        });
        describe('Selection not collapsed', () => {
            describe('Basic', () => {
                it('should delete a fontawesome', async () => {
                    // Forward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab[<i class="fas fa-pastafarianism"></i>]cd</p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<p>ab[]cd</p>',
                    });
                    // Backward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab]<i class="fas fa-pastafarianism"></i>[cd</p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<p>ab[]cd</p>',
                    });
                });
            });
        });
    });
});
