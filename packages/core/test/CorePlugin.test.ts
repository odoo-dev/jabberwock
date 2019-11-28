import JWEditor from '../src/JWEditor';
import { testEditor } from '../../utils/src/testUtils';
import { OptionalRangeParams } from '../src/CorePlugin';

describe('utils', () => {
    describe('CorePlugin', () => {
        // todo: test with startPosition after
        // todo: test with endPosition after

        describe('deleteBackward', () => {
            it('should deleteBackward with a fake range', () => {
                testEditor({
                    contentBefore: '<p>abc[]</p>',
                    stepFunction: (editor: JWEditor) => {
                        const bNode = editor.vDocument.root.next(node => node.value === 'b');
                        const params: OptionalRangeParams = {
                            range: {
                                start: bNode,
                                end: bNode,
                            },
                        };

                        editor.execCommand('deleteBackward', params);
                        editor.renderer.render(editor.vDocument, editor.editable);
                    },
                    contentAfter: '<p>bc[]</p>',
                });
            });
        });
        describe('deleteForward', () => {
            it('should deleteForward with a fake range', () => {
                testEditor({
                    contentBefore: '<p>abc[]</p>',
                    stepFunction: (editor: JWEditor) => {
                        const bNode = editor.vDocument.root.next(node => node.value === 'b');
                        const params: OptionalRangeParams = {
                            range: {
                                start: bNode,
                                end: bNode,
                            },
                        };

                        editor.execCommand('deleteForward', params);
                        editor.renderer.render(editor.vDocument, editor.editable);
                    },
                    contentAfter: '<p>ac[]</p>',
                });
            });
        });
    });
});
