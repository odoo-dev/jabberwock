import {
    DomObject,
    DomObjectRenderingEngine,
    DomObjectElement,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { ActionableNode } from '../../plugin-layout/src/ActionableNode';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { Predicate } from '../../core/src/VNodes/VNode';

export type DomObjectActionable = DomObjectElement & { handler: () => void };

export class ActionableDomObjectRenderer extends NodeRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate: Predicate = ActionableNode;

    async render(button: ActionableNode): Promise<DomObjectActionable> {
        let updateButton: () => void;
        let clickHandler: (ev: MouseEvent) => void;
        let mousedownHandler: (ev: MouseEvent) => void;
        const objectButton: DomObjectActionable = {
            tag: 'BUTTON',
            attributes: {
                name: button.actionName,
            },
            handler: (): void => {
                if (button.commandId) {
                    this.engine.editor.execCommand(button.commandId, button.commandArgs);
                }
            },
            attach: (el: HTMLButtonElement): void => {
                clickHandler = (ev): void => {
                    ev.stopImmediatePropagation();
                    ev.stopPropagation();
                    ev.preventDefault();
                    objectButton.handler();
                };
                mousedownHandler = (ev: MouseEvent): void => {
                    ev.stopImmediatePropagation();
                    ev.stopPropagation();
                    ev.preventDefault();
                };
                el.addEventListener('click', clickHandler);
                el.addEventListener('mousedown', mousedownHandler);
                updateButton = this._updateButton.bind(this, button, el);
                updateButton();
                this.engine.editor.dispatcher.registerCommandHook('*', updateButton);
            },
            detach: (el: HTMLButtonElement): void => {
                el.removeEventListener('click', clickHandler);
                el.removeEventListener('mousedown', mousedownHandler);
                this.engine.editor.dispatcher.removeCommandHook('*', updateButton);
            },
        };
        const attributes = button.modifiers.find(Attributes);
        const className = attributes?.get('class');
        if (className?.includes(' fa-')) {
            if (!attributes.get('title')) {
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
        const visible = !!button.visible(editor);

        const attrSelected = element.getAttribute('aria-pressed');
        if (select.toString() !== attrSelected) {
            element.setAttribute('aria-pressed', select.toString());
            if (select) {
                element.classList.add('active');
            } else {
                element.classList.remove('active');
            }
        }
        const domEnable = !element.getAttribute('disabled');
        if (enable !== domEnable) {
            if (enable) {
                element.removeAttribute('disabled');
            } else {
                element.setAttribute('disabled', 'true');
            }
        }
        const domVisible = element.style.display !== 'none';
        if (visible !== domVisible) {
            if (visible) {
                element.style.display = 'inline-block';
            } else {
                element.style.display = 'none';
            }
        }
    }
}
