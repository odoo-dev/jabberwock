import {
    DomObject,
    DomObjectRenderingEngine,
} from '../../plugin-html/src/DomObjectRenderingEngine';
import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { ActionableNode } from '../../plugin-layout/src/ActionableNode';
import { Attributes } from '../../plugin-xml/src/Attributes';

export class ActionableDomObjectRenderer extends AbstractRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = ActionableNode;

    async render(button: ActionableNode): Promise<DomObject> {
        let updateButton: () => void;
        const selected = button.selected(this.engine.editor);
        const enabled = button.enabled(this.engine.editor);
        const execCommand = (): void => {
            this.engine.editor.execCommand(button.commandId, button.commandArgs);
        };
        const objectButton: DomObject = {
            tag: 'BUTTON',
            attributes: {
                name: button.buttonName,
                class: selected ? 'pressed' : '',
                'aria-pressed': selected ? 'true' : 'false',
                disabled: enabled ? null : 'true',
            },
            attach: (el: HTMLButtonElement): void => {
                el.addEventListener('click', execCommand);
                updateButton = this._updateButton.bind(this, button, el);
                this.engine.editor.dispatcher.registerCommandHook('*', updateButton);
            },
            detach: (el: HTMLButtonElement): void => {
                el.removeEventListener('click', execCommand);
                this.engine.editor.dispatcher.removeCommandHook('*', updateButton);
            },
        };
        this.engine.renderAttributes(Attributes, button, objectButton);

        if (objectButton.attributes.class.includes(' fa-')) {
            if (!objectButton.attributes.title) {
                objectButton.attributes.title = button.label;
            }
        } else {
            objectButton.children = [{ text: button.label }];
        }

        return objectButton;
    }
    /**
     * Update button rendering after the command if the value of selected or
     * enabled change.
     *
     * @param button
     * @param element
     */
    private _updateButton(button: ActionableNode, element: HTMLButtonElement): void {
        const editor = this.engine.editor;
        const select = !!button.selected(editor);
        const enable = !!button.enabled(editor);

        const attrSelected = element.getAttribute('aria-pressed');
        const domSelect = attrSelected === 'true';
        if (select !== domSelect) {
            element.setAttribute('aria-pressed', select.toString());
        }
        const domEnable = !element.getAttribute('disabled');
        if (enable !== domEnable) {
            if (enable) {
                element.removeAttribute('disable');
            } else {
                element.setAttribute('disable', 'true');
            }
        }
    }
}
