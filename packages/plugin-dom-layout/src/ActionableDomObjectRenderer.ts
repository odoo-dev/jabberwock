import {
    DomObject,
    DomObjectRenderingEngine,
    DomObjectElement,
} from '../../plugin-html/src/DomObjectRenderingEngine';
import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { ActionableNode } from '../../plugin-layout/src/ActionableNode';
import { Attributes } from '../../plugin-xml/src/Attributes';

export type DomObjectActionable = DomObjectElement & { handler: () => void };

export class ActionableDomObjectRenderer extends AbstractRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = ActionableNode;

    async render(button: ActionableNode): Promise<DomObjectActionable> {
        let updateButton: () => void;
        let handler: (ev: MouseEvent) => void;
        const objectButton: DomObjectActionable = {
            tag: 'BUTTON',
            attributes: {
                name: button.buttonName,
            },
            handler: (): void => {
                if (button.commandId) {
                    this.engine.editor.execCommand(button.commandId, button.commandArgs);
                }
            },
            attach: (el: HTMLButtonElement): void => {
                handler = (ev): void => {
                    ev.stopImmediatePropagation();
                    objectButton.handler();
                };
                el.addEventListener('click', handler);
                updateButton = this._updateButton.bind(this, button, el);
                updateButton();
                this.engine.editor.dispatcher.registerCommandHook('*', updateButton);
            },
            detach: (el: HTMLButtonElement): void => {
                el.removeEventListener('click', handler);
                this.engine.editor.dispatcher.removeCommandHook('*', updateButton);
            },
        };
        this.engine.renderAttributes(Attributes, button, objectButton);

        if (objectButton.attributes.class?.includes(' fa-')) {
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
        if (select.toString() !== attrSelected) {
            element.setAttribute('aria-pressed', select.toString());
            if (select) {
                element.classList.add('pressed');
            } else {
                element.classList.remove('pressed');
            }
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
