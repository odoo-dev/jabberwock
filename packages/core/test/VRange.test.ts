import { testEditor } from '../../utils/src/testUtils';
import { BasicEditor } from '../../../bundles/BasicEditor';

describe('VRange', () => {
    describe('split', () => {
        it('should split the range containers in place', async function() {
            await testEditor(BasicEditor, {
                contentBefore: '<v>abc<w>de[f<x>ghi<y>jkl<z>mno</z>pqr</y>stu</x>vw</w>xy]z</v>',
                stepFunction: async (editor: BasicEditor) => {
                    editor.dispatcher.registerCommand('refresh', { handler: () => {} });
                    const nodes = editor.selection.range.split();
                    editor.vDocument.root.lastChild().after(nodes[0]);
                    await editor.execCommand('refresh');
                },
                contentAfter:
                    '<v>abc<w>de</w></v><v>z</v><v><w>[f<x>ghi<y>jkl<z>mno</z>pqr</y>stu</x>vw</w>xy]</v>',
            });
        });
    });
});
