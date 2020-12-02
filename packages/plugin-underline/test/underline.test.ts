import { describePlugin } from '../../utils/src/testUtils';
import { BasicEditor } from '../../bundle-basic-editor/BasicEditor';
import JWEditor from '../../core/src/JWEditor';
import { Constructor } from '../../utils/src/utils';
import { Format } from '../../core/src/Format';
import { UnderlineFormat } from '../src/UnderlineFormat';
import { SpanFormat } from '../../plugin-span/src/SpanFormat';
import { Underline } from '../src/Underline';
import { Inline } from '../../plugin-inline/src/Inline';

const toggleFormat = async (editor: JWEditor, FormatClass: Constructor<Format>): Promise<void> => {
    await editor.execCommand<Inline>('toggleFormat', {
        FormatClass: FormatClass,
    });
};
describePlugin(Underline, testEditor => {
    describe('underline format', () => {
        it('should keep formats in order if not touched', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<span><u>g[]ga</u></span>',
                contentAfter: '<span><u>g[]ga</u></span>',
            });
        });
        it('should keep formats in order if not touched (2)', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<u><span>g[]ga</span></u>',
                contentAfter: '<u><span>g[]ga</span></u>',
            });
        });
        it('should put underline inside a span', async () => {
            await testEditor(BasicEditor, {
                contentBefore: 'a<span>b[cd]e</span>f',
                stepFunction: async (editor: JWEditor) => {
                    await toggleFormat(editor, UnderlineFormat);
                },
                contentAfter: 'a<span>b[<u>cd]</u>e</span>f',
            });
        });
        it('should put underline inside a span (2)', async () => {
            await testEditor(BasicEditor, {
                contentBefore: 'a[<span>bcde]</span>f',
                stepFunction: async (editor: JWEditor) => {
                    await toggleFormat(editor, UnderlineFormat);
                },
                contentAfter: 'a[<span><u>bcde]</u></span>f',
            });
        });
        it('should put underline inside a span (3)', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '[a<span>bcd]e</span>f',
                stepFunction: async (editor: JWEditor) => {
                    await toggleFormat(editor, UnderlineFormat);
                },
                contentAfter: '<u>[a</u><span><u>bcd]</u>e</span>f',
            });
        });
        it('should put underline inside a span (4)', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '[a<span>bc<span>xx</span>de</span>f]',
                stepFunction: async (editor: JWEditor) => {
                    await toggleFormat(editor, UnderlineFormat);
                },
                contentAfter:
                    '<u>[a</u><span><u>bc</u><span><u>xx</u></span><u>de</u></span><u>f]</u>',
            });
        });
        it('should put underline inside a span (5)', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<u>ab[cd]ef</u>',
                stepFunction: async (editor: JWEditor) => {
                    await toggleFormat(editor, SpanFormat);
                },
                contentAfter: '<u>ab[</u><span><u>cd]</u></span><u>ef</u>',
            });
        });
    });
});
