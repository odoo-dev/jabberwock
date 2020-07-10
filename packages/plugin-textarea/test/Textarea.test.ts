import { Textarea } from '../src/Textarea';
import { describePlugin } from '../../utils/src/testUtils';
import { BasicEditor } from '../../bundle-basic-editor/BasicEditor';

describePlugin(Textarea, testEditor => {
    describe('parser & renderer', () => {
        it('should parse and render textarea', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<textarea> a </textarea>',
                contentAfter: '<textarea> a </textarea>',
            });
        });
    });
});
