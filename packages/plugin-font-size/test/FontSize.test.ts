import { describePlugin } from '../../utils/src/testUtils';
import { FontSize } from '../src/FontSize';
import { BasicEditor } from '../../bundle-basic-editor/BasicEditor';
import JWEditor from '../../core/src/JWEditor';

const setFontSize = (size: number) => {
    return async (editor: JWEditor): Promise<void> => {
        await editor.execCommand<FontSize>('setFontSize', { value: size });
    };
};

describePlugin(FontSize, testEditor => {
    describe('setFontSize', () => {
        it('should change the font size of a few characters', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p>ab[cde]fg</p>',
                stepFunction: setFontSize(10),
                contentAfter: '<p>ab[<span style="font-size: 10px;">cde]</span>fg</p>',
            });
        });
        it('should change the font size of a whole heading after a triple click', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<h1>[ab</h1><p>]cd</p>',
                stepFunction: setFontSize(36),
                contentAfter: '<h1><span style="font-size: 36px;">[ab</span></h1><p>]cd</p>',
            });
        });
    });
});
