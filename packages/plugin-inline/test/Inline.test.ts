import { describePlugin } from '../../utils/src/testUtils';
import { Inline, FormatParams } from '../Inline';
import JWEditor from '../../core/src/JWEditor';
import { Constructor } from '../../utils/src/utils';
import { Format } from '../Format';
import { BasicEditor } from '../../../bundles/BasicEditor';
import { BoldFormat } from '../../plugin-bold/BoldFormat';

const toggleFormat = async (editor: JWEditor, FormatClass: Constructor<Format>): Promise<void> => {
    const formatParams: FormatParams = {
        FormatClass: FormatClass,
    };
    await editor.execCommand('toggleFormat', formatParams);
};

describePlugin(Inline, testEditor => {
    describe('InlineFormatDomParser', () => {
        it('should parse text with nested similar formats', async () => {
            await testEditor(BasicEditor, {
                contentBefore:
                    '<p>a<span class="outer">bc<span class="inner">de</span>fg</span>h</p>',
                contentAfter:
                    '<p>a<span class="outer">bc</span><span class="outer"><span class="inner">de</span></span><span class="outer">fg</span>h</p>',
            });
        });
        it('should parse some nested formats in order', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p>ab<b>cd<i>ef<u>gh</u>ij</i>kl</b>mn</p>',
                contentAfter:
                    '<p>ab<b>cd</b><b><i>ef</i></b><b><i><u>gh</u></i></b><b><i>ij</i></b><b>kl</b>mn</p>',
            });
        });
    });
    describe('toggleFormat', () => {
        // TODO: test that selection collapsed toggle format without char-plugin
        // indeed does nothing.
        describe('Selection not collapsed', () => {
            it('should be bold when selected is not bold', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: 'a[b]c',
                    stepFunction: async (editor: JWEditor) => {
                        await toggleFormat(editor, BoldFormat);
                    },
                    contentAfter: 'a[<b>b]</b>c',
                });
            });
            it('should not be bold when selected is bold', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: 'a<b>[b]</b>c',
                    stepFunction: async (editor: JWEditor) => {
                        await toggleFormat(editor, BoldFormat);
                    },
                    contentAfter: 'a[b]c',
                });
            });
            it('should be bold when one of the selected is bold', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: 'a<b>[b</b>c]',
                    stepFunction: async (editor: JWEditor) => {
                        await toggleFormat(editor, BoldFormat);
                    },
                    contentAfter: 'a[<b>bc]</b>',
                });
            });
            it('should not be bold but keep attributes when selected is bold with various attributes', async () => {
                await testEditor(BasicEditor, {
                    contentBefore:
                        'a<b style="color: red">b[cd</b><b style="color: green">ef]g</b>',
                    stepFunction: async (editor: JWEditor) => {
                        await toggleFormat(editor, BoldFormat);
                    },
                    contentAfter:
                        'a<b style="color: red">b[</b><span style="color: red">cd</span><span style="color: green">ef]</span><b style="color: green">g</b>',
                });
            });
        });
    });
});
