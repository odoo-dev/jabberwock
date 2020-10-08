import { describePlugin } from '../../utils/src/testUtils';
import { FontAwesome } from '../src/FontAwesome';
import { BasicEditor } from '../../bundle-basic-editor/BasicEditor';
import JWEditor from '../../core/src/JWEditor';
import { Core } from '../../core/src/Core';
import { Char } from '../../plugin-char/src/Char';

const deleteForward = async (editor: JWEditor): Promise<void> => {
    await editor.execCommand<Core>('deleteForward');
};
const deleteBackward = async (editor: JWEditor): Promise<void> => {
    await editor.execCommand<Core>('deleteBackward');
};

describePlugin(FontAwesome, testEditor => {
    describe('parse/render', () => {
        it('should parse an old-school fontawesome', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p><i class="fa fa-star"></i></p>',
                contentAfter: '<p><i class="fa fa-star"></i></p>',
            });
        });
        it('should parse a brand fontawesome', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p><i class="fab fa-opera"></i></p>',
                contentAfter: '<p><i class="fab fa-opera"></i></p>',
            });
        });
        it('should parse a duotone fontawesome', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p><i class="fad fa-bus-alt"></i></p>',
                contentAfter: '<p><i class="fad fa-bus-alt"></i></p>',
            });
        });
        it('should parse a light fontawesome', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p><i class="fab fa-accessible-icon"></i></p>',
                contentAfter: '<p><i class="fab fa-accessible-icon"></i></p>',
            });
        });
        it('should parse a regular fontawesome', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p><i class="far fa-money-bill-alt"></i></p>',
                contentAfter: '<p><i class="far fa-money-bill-alt"></i></p>',
            });
        });
        it('should parse a solid fontawesome', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p><i class="fa fa-pastafarianism"></i></span></p>',
                contentAfter: '<p><i class="fa fa-pastafarianism"></i></p>',
            });
        });
        it('should parse a fontawesome in a <span>', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p><span class="fa fa-pastafarianism"></span></p>',
                contentAfter: '<p><span class="fa fa-pastafarianism"></span></p>',
            });
        });
        it('should parse a fontawesome in a <i>', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p><i class="fa fa-pastafarianism"></i></i></p>',
                contentAfter: '<p><i class="fa fa-pastafarianism"></i></p>',
            });
        });
        it('should parse a fontawesome with more classes', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p><i class="red fa bordered fa-pastafarianism big"></i></p>',
                contentAfter:
                    '<p><i class="red fa bordered fa-pastafarianism big"></i></p>',
            });
        });
        it('should parse a fontawesome with multi-line classes', async () => {
            await testEditor(BasicEditor, {
                contentBefore: `<p><i class="fa
                                fa-pastafarianism"></i></p>`,
                contentAfter: `<p><i class="fa fa-pastafarianism"></i></p>`,
            });
        });
        it('should parse a fontawesome with more multi-line classes', async () => {
            await testEditor(BasicEditor, {
                contentBefore: `<p><i class="red fa bordered
                                big fa-pastafarianism scary"></i></p>`,
                contentAfter: `<p><i class="red fa bordered big fa-pastafarianism scary"></i></p>`,
            });
        });
        it('should parse a fontawesome at the beginning of a paragraph', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p><i class="fa fa-pastafarianism"></i>a[b]c</p>',
                contentAfter: '<p><i class="fa fa-pastafarianism"></i>a[b]c</p>',
            });
        });
        it('should parse a fontawesome in the middle of a paragraph', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p>a[b]c<i class="fa fa-pastafarianism"></i>def</p>',
                contentAfter: '<p>a[b]c<i class="fa fa-pastafarianism"></i>def</p>',
            });
        });
        it('should parse a fontawesome at the end of a paragraph', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p>a[b]c<i class="fa fa-pastafarianism"></i></p>',
                contentAfter: '<p>a[b]c<i class="fa fa-pastafarianism"></i></p>',
            });
        });
        it('should insert navigation helpers when before a fontawesome, in an editable', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p>abc[]<i class="fa fa-pastafarianism"></i></p>',
                contentAfter: '<p>abc[]\u200B<i class="fa fa-pastafarianism"></i>\u200B</p>',
            });
            await testEditor(BasicEditor, {
                contentBefore: '<p>[]<i class="fa fa-pastafarianism"></i></p>',
                contentAfter: '<p>\u200B[]<i class="fa fa-pastafarianism"></i>\u200B</p>',
            });
        });
        it('should insert navigation helpers when after a fontawesome, in an editable', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p><i class="fa fa-pastafarianism"></i>[]abc</p>',
                contentAfter: '<p>\u200B<i class="fa fa-pastafarianism"></i>\u200B[]abc</p>',
            });
            await testEditor(BasicEditor, {
                contentBefore: '<p><i class="fa fa-pastafarianism"></i>[]</p>',
                contentAfter: '<p>\u200B<i class="fa fa-pastafarianism"></i>\u200B[]</p>',
            });
        });
        it('should not insert navigation helpers when not adjacent to a fontawesome, in an editable', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p>ab[]c<i class="fa fa-pastafarianism"></i></p>',
                contentAfter: '<p>ab[]c<i class="fa fa-pastafarianism"></i></p>',
            });
            await testEditor(BasicEditor, {
                contentBefore: '<p><i class="fa fa-pastafarianism"></i>a[]bc</p>',
                contentAfter: '<p><i class="fa fa-pastafarianism"></i>a[]bc</p>',
            });
        });
        it('should not insert navigation helpers when adjacent to a fontawesome in contenteditable=false container', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p contenteditable="false">abc[]<i class="fa fa-pastafarianism"></i></p>',
                contentAfter: '<p contenteditable="false">abc<i class="fa fa-pastafarianism"></i></p>',
            });
            await testEditor(BasicEditor, {
                contentBefore: '<p contenteditable="false"><i class="fa fa-pastafarianism"></i>[]abc</p>',
                contentAfter: '<p contenteditable="false"><i class="fa fa-pastafarianism"></i>abc</p>',
            });
        });
        it('should not insert navigation helpers when adjacent to a fontawesome in contenteditable=false format', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p contenteditable="true"><b contenteditable="false">abc[]<i class="fa fa-pastafarianism"></i></b></p>',
                contentAfter: '<p contenteditable="true"><b contenteditable="false">abc<i class="fa fa-pastafarianism"></i></b></p>',
            });
            await testEditor(BasicEditor, {
                contentBefore: '<p contenteditable="true"><b contenteditable="false"><i class="fa fa-pastafarianism"></i>[]abc</b></p>',
                contentAfter: '<p contenteditable="true"><b contenteditable="false"><i class="fa fa-pastafarianism"></i>abc</b></p>',
            });
        });
        it('should not insert navigation helpers when adjacent to a fontawesome in contenteditable=false format (nested)', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p contenteditable="true"><a contenteditable="true"><b contenteditable="false">abc[]<i class="fa fa-pastafarianism"></i></b></a></p>',
                contentAfter: '<p contenteditable="true"><a contenteditable="true"><b contenteditable="false">abc<i class="fa fa-pastafarianism"></i></b></a></p>',
            });
            await testEditor(BasicEditor, {
                contentBefore: '<p contenteditable="true"><a contenteditable="true"><b contenteditable="false"><i class="fa fa-pastafarianism"></i>[]abc</b></a></p>',
                contentAfter: '<p contenteditable="true"><a contenteditable="true"><b contenteditable="false"><i class="fa fa-pastafarianism"></i>abc</b></a></p>',
            });
        });
    });
    describe('deleteForward', () => {
        describe('Selection collapsed', () => {
            describe('Basic', () => {
                it('should delete a fontawesome', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab[]<i class="fa fa-pastafarianism"></i>cd</p>',
                        stepFunction: deleteForward,
                        contentAfter: '<p>ab[]cd</p>',
                    });
                });
                it('should not delete a fontawesome', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab<i class="fa fa-pastafarianism"></i>[]cd</p>',
                        stepFunction: deleteForward,
                        contentAfter:
                            '<p>ab\u200B<i class="fa fa-pastafarianism"></i>\u200B[]d</p>',
                    });
                });
            });
        });
        describe('Selection not collapsed', () => {
            describe('Basic', () => {
                it('should delete a fontawesome', async () => {
                    // Forward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab[<i class="fa fa-pastafarianism"></i>]cd</p>',
                        stepFunction: deleteForward,
                        contentAfter: '<p>ab[]cd</p>',
                    });
                    // Backward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab]<i class="fa fa-pastafarianism"></i>[cd</p>',
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
                        contentBefore: '<p>ab<i class="fa fa-pastafarianism"></i>[]cd</p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<p>ab[]cd</p>',
                    });
                });
                it('should not delete a fontawesome', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab[]<i class="fa fa-pastafarianism"></i>cd</p>',
                        stepFunction: deleteBackward,
                        contentAfter:
                            '<p>a[]\u200B<i class="fa fa-pastafarianism"></i>\u200Bcd</p>',
                    });
                });
            });
        });
        describe('Selection not collapsed', () => {
            describe('Basic', () => {
                it('should delete a fontawesome', async () => {
                    // Forward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab[<i class="fa fa-pastafarianism"></i>]cd</p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<p>ab[]cd</p>',
                    });
                    // Backward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab]<i class="fa fa-pastafarianism"></i>[cd</p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<p>ab[]cd</p>',
                    });
                });
            });
        });
    });
    describe('Text insertion', () => {
        it('should insert a character before', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p>ab[]<i class="fa fa-pastafarianism"></i>cd</p>',
                stepFunction: async editor => {
                    await editor.execCommand<Char>('insertText', { text: 's' });
                },
                contentAfter: '<p>abs[]\u200B<i class="fa fa-pastafarianism"></i>\u200Bcd</p>',
            });
        });
        it('should insert a character after', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p>ab<i class="fa fa-pastafarianism"></i>[]cd</p>',
                stepFunction: async editor => {
                    await editor.execCommand<Char>('insertText', { text: 's' });
                },
                contentAfter: '<p>ab<i class="fa fa-pastafarianism"></i>s[]cd</p>',
            });
        });
    });
});
