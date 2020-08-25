import {
    DomObject,
    DomObjectRenderingEngine,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { ActionableNode } from '../../plugin-layout/src/ActionableNode';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { ActionableGroupNode } from '../../plugin-layout/src/ActionableGroupNode';
import { SeparatorNode } from '../../core/src/VNodes/SeparatorNode';
import { VNode } from '../../core/src/VNodes/VNode';
import { LabelNode } from '../../plugin-layout/src/LabelNode';
import { ZoneNode } from '../../plugin-layout/src/ZoneNode';
import { DomObjectActionable } from './ActionableDomObjectRenderer';
import { RenderingEngineWorker } from '../../plugin-renderer/src/RenderingEngineCache';

export class ActionableGroupSelectItemDomObjectRenderer extends NodeRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = (node: VNode): boolean => node.ancestors(ActionableGroupNode).length >= 2;

    actionableGroupSelectItemNodes = new Map<ActionableNode, HTMLElement>();

    constructor(engine: DomObjectRenderingEngine) {
        super(engine);
        this.engine.editor.dispatcher.registerCommandHook(
            '@commit',
            this._updateActionableGroupSelectItems.bind(this),
        );
    }

    async render(item: VNode, worker: RenderingEngineWorker<DomObject>): Promise<DomObject> {
        let domObject: DomObject;
        if (item instanceof ActionableNode) {
            let handler: (ev: Event) => void;
            const domObjectActionable: DomObjectActionable = {
                tag: 'OPTION',
                attributes: {
                    value: item.actionName,
                },
                children: item.label ? [{ text: item.label }] : [],
                handler: (): void => {
                    if (item.commandId) {
                        this.engine.editor.execCommand(item.commandId, item.commandArgs);
                    }
                },
                attach: (el: HTMLOptionElement): void => {
                    const select = el.closest('select') || el.parentElement;
                    handler = (ev: Event): void => {
                        const option = select.querySelector('option:checked');
                        if (option === el) {
                            ev.stopImmediatePropagation();
                            domObjectActionable.handler();
                        }
                    };
                    select.addEventListener('change', handler);
                    this.actionableGroupSelectItemNodes.set(item, el);
                },
                detach: (el: HTMLOptionElement): void => {
                    const select = el.closest('select') || el.parentElement;
                    select.removeEventListener('change', handler);
                    this.actionableGroupSelectItemNodes.delete(item);
                },
            };
            domObject = domObjectActionable;
        } else if (item instanceof ActionableGroupNode) {
            if (item.ancestors(ActionableGroupNode).length <= 2) {
                const title = item.modifiers.find(Attributes)?.get('title');
                domObject = {
                    tag: 'OPTGROUP',
                    attributes: {
                        name: item.groupName || null,
                        label: title || null,
                    },
                    children: item.children(),
                };
            } else {
                domObject = {
                    children: item.children(),
                };
            }
        } else if (item instanceof SeparatorNode) {
            domObject = {
                tag: 'OPTION',
                attributes: {
                    role: 'separator',
                    disabled: 'true',
                },
            };
        } else if (item instanceof LabelNode) {
            domObject = {
                tag: 'OPTION',
                attributes: {
                    class: new Set(['label']),
                    disabled: 'true',
                },
                children: [{ text: item.label }],
            };
        } else if (item instanceof ZoneNode) {
            domObject = await this.super.render(item, worker);
            if (!('tag' in domObject) || domObject.tag.toUpperCase() !== 'OPTION') {
                domObject = { children: item.children() };
            }
        } else {
            domObject = {
                tag: 'OPTION',
                children: [{ text: item.textContent }],
            };
        }
        return domObject;
    }

    /**
     * Update option rendering after the command if the value of selected,
     * enabled or visible changed.
     *
     * @param actionable
     * @param element
     */
    protected _updateActionableGroupSelectItems(): void {
        for (const [actionable, element] of this.actionableGroupSelectItemNodes) {
            const editor = this.engine.editor;
            const select = actionable.selected(editor);
            const enable = actionable.enabled(editor);
            const visible = !!actionable.visible(editor);
            const attrSelected = element.getAttribute('selected');
            if (select.toString() !== attrSelected) {
                if (select) {
                    element.setAttribute('selected', 'true');
                    element.closest('select').value = element.getAttribute('value');
                } else {
                    element.removeAttribute('selected');
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
}
