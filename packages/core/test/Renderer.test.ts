/* eslint-disable max-nested-callbacks */
import { BasicEditor } from '../../../bundles/BasicEditor';
import { testEditor } from '../../utils/src/testUtils';

describe('utils', () => {
    describe('Renderer', () => {
        describe('selection', () => {
            it('should render textual selection at the beginning', async () => {
                const content = `<p>[a]bc</p>`;
                await testEditor(BasicEditor, { contentBefore: content, contentAfter: content });
            });
            it('should render textual selection at the end', async () => {
                const content = `<p>ab[c]</p>`;
                await testEditor(BasicEditor, { contentBefore: content, contentAfter: content });
            });
            it('should render textual selection in the whole tag', async () => {
                const content = `<p>[abc]</p>`;
                await testEditor(BasicEditor, { contentBefore: content, contentAfter: content });
            });
            it('should render textual selection that is collapsed in the beginning', async () => {
                const content = `<p>[]abc</p>`;
                await testEditor(BasicEditor, { contentBefore: content, contentAfter: content });
            });
            it('should render textual selection that is collapsed in the end', async () => {
                const content = `<p>abc[]</p>`;
                await testEditor(BasicEditor, { contentBefore: content, contentAfter: content });
            });
            it('should render textual selection that is collapsed in the middle', async () => {
                const content = `<p>ab[]c</p>`;
                await testEditor(BasicEditor, { contentBefore: content, contentAfter: content });
            });
            it('should render the selection outside the tag', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>[<b>a</b>]</p>',
                    contentAfter: '<p><b>[a]</b></p>',
                });
            });
        });
    });
});
