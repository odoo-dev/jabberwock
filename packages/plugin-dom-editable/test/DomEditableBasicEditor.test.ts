import { testEditor, nextTick } from '../../utils/src/testUtils';
import { BasicEditor } from '../../bundle-basic-editor/BasicEditor';

const deleteBackward = async (el: Element, domUpdate: () => void): Promise<void> => {
    el.dispatchEvent(
        new KeyboardEvent('keydown', {
            'key': 'Backspace',
            'code': 'Backspace',
        }),
    );
    el.dispatchEvent(
        new InputEvent('beforeinput', {
            'data': null,
            'inputType': 'deleteContentBackward',
        }),
    );
    el.dispatchEvent(
        new InputEvent('input', {
            'data': null,
            'inputType': 'deleteContentBackward',
        }),
    );
    domUpdate();
    await nextTick();
    el.dispatchEvent(
        new KeyboardEvent('keyup', {
            'key': 'Backspace',
            'code': 'Backspace',
        }),
    );
    await nextTick();
};

describe('DomEditable', () => {
    describe('BasicEditor', () => {
        describe('deleteBackward', () => {
            it('should merge a paragraph with text into a paragraph with text', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>ab</p><p>[]cd</p>',
                    stepFunction: async (): Promise<void> => {
                        const p = document.querySelector('p').nextElementSibling;
                        return deleteBackward(p, () => {
                            p.previousElementSibling.append(...p.childNodes);
                            p.remove();
                        });
                    },
                    contentAfter: '<p>ab[]cd</p>',
                });
            });
            it('should merge a paragraph with formated text into a paragraph with text', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>aa</p><p>[]a<i>bbb</i></p>',
                    stepFunction: async (): Promise<void> => {
                        const p = document.querySelector('p').nextElementSibling;
                        return deleteBackward(p, () => {
                            p.previousElementSibling.append(...p.childNodes);
                            p.remove();
                        });
                    },
                    contentAfter: '<p>aa[]a<i>bbb</i></p>',
                });
            });
        });
    });
});
