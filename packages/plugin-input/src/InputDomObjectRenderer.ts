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

        let onCommit: () => void;
        let mousedown: (ev: MouseEvent) => void;
        let changeHandler: () => void;
        input.attach = (el: HTMLInputElement): void => {
            onCommit = this._onCommit.bind(this, node, el);
            changeHandler = (): void => {
                this.engine.editor.execCommand(() => {
                    node.value = el.value;
                    node.change(this.engine.editor);
                });
            };

            el.addEventListener('change', changeHandler);
            this.engine.editor.dispatcher.registerCommandHook('@commit', onCommit);
        };

        input.detach = (el: HTMLInputElement): void => {
            el.removeEventListener('change', changeHandler);
            el.removeEventListener('mousedown', mousedown);
            this.engine.editor.dispatcher.removeCommandHook('@commit', onCommit);
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
