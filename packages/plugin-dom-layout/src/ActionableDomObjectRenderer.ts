import {
    DomObject,
    DomObjectRenderingEngine,
    DomObjectElement,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { ActionableNode } from '../../plugin-layout/src/ActionableNode';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { Predicate } from '../../core/src/VNodes/VNode';
import { RenderingEngineWorker } from '../../plugin-renderer/src/RenderingEngineCache';

export type DomObjectActionable = DomObjectElement & { handler: () => void };

export class ActionableDomObjectRenderer extends NodeRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate: Predicate = ActionableNode;

    actionableNodes = new Map<ActionableNode, HTMLElement>();

    constructor(engine: DomObjectRenderingEngine) {
        super(engine);
        this.engine.editor.dispatcher.registerCommandHook(
            '@commit',
            this._updateActionables.bind(this),
        );
    }

    async render(
        button: ActionableNode,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        worker: RenderingEngineWorker<DomObject>,
    ): Promise<DomObjectActionable> {
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
                this.actionableNodes.set(button, el);
            },
            detach: (el: HTMLButtonElement): void => {
                el.removeEventListener('click', clickHandler);
                el.removeEventListener('mousedown', mousedownHandler);
                this.actionableNodes.delete(button);
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
     */
    protected _updateActionables(): void {
        const commandNames = this.engine.editor.memoryInfo.commandNames;
        if (commandNames.length === 1 && commandNames.includes('insertText')) {
            // By default the actionable buttons are not update for a text insertion.
            return;
        }
        for (const [actionable, element] of this.actionableNodes) {
            const editor = this.engine.editor;
            const select = !!actionable.selected(editor);
            const enable = !!actionable.enabled(editor);

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
                    element.removeAttribute('disabled');
                } else {
                    element.setAttribute('disabled', 'true');
                }
            }
        }
    }
}
