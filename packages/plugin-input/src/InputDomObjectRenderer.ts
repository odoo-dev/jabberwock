import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { InputNode } from './InputNode';
import { DomObjectElement } from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { Predicate } from '../../core/src/VNodes/VNode';
import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';

export class InputDomObjectRenderer extends NodeRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate: Predicate = InputNode;

    /**
     * Render the VNode to the given format.
     */
    async render(node: InputNode): Promise<DomObject> {
        const input: DomObjectElement = {
            tag: 'INPUT',
            attributes: {
                type: node.inputType,
                name: node.inputName,
                value: node.value,
            },
        };

        let onInputChange: () => void;
        let mousedown: (ev: MouseEvent) => void;
        let changeHandler: () => void;
        input.attach = (el: HTMLInputElement): void => {
            // todo: remove when the branch memory correct the bug of non
            //       editable zone that do not remove handler
            el.removeEventListener('change', changeHandler);
            el.removeEventListener('mousedown', mousedown);
            // todo: register to "@commit" when the branch memory will be merged
            this.engine.editor.dispatcher.removeCommandHook('*', onInputChange);

            onInputChange = this._onCommit.bind(this, node, el);
            changeHandler = (): void => {
                node.value = el.value;
                node.change(this.engine.editor);
            };
            mousedown = (ev: MouseEvent): void => {
                ev.stopImmediatePropagation();
                ev.stopPropagation();
            };

            el.addEventListener('change', changeHandler);
            el.addEventListener('mousedown', mousedown);
            // todo: register to "@commit" when the branch memory will be merged
            this.engine.editor.dispatcher.registerCommandHook('*', onInputChange);
        };

        input.detach = (el: HTMLInputElement): void => {
            el.removeEventListener('change', changeHandler);
            el.removeEventListener('mousedown', mousedown);
            // todo: unregister to "@commit" when the branch memory will be merged
            this.engine.editor.dispatcher.removeCommandHook('*', onInputChange);
        };
        return input;
    }

    /**
     * On input change handler.
     *
     * Meant to be overriden.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-empty-function
    _onCommit(node: InputNode, el: HTMLInputElement): void {}
}
