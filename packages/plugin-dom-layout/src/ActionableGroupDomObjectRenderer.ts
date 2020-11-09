import {
    DomObject,
    DomObjectRenderingEngine,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { ActionableGroupNode } from '../../plugin-layout/src/ActionableGroupNode';
import { Predicate } from '../../core/src/VNodes/VNode';

export class ActionableGroupDomObjectRenderer extends NodeRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate: Predicate = ActionableGroupNode;

    actionableGroupNodes = new Map<ActionableGroupNode, HTMLElement>();

    constructor(engine: DomObjectRenderingEngine) {
        super(engine);
        this.engine.editor.dispatcher.registerCommandHook(
            '@commit',
            this._updateActionableGroups.bind(this),
        );
    }

    async render(group: ActionableGroupNode): Promise<DomObject> {
        if (
            !group.descendants(node => !(node instanceof ActionableGroupNode) && node.tangible)
                .length
        ) {
            return { children: [] };
        } else if (group.ancestor(ActionableGroupNode)) {
            return this._renderBlockSelect(group);
        } else {
            return this._renderGroup(group);
        }
    }
    private _renderBlockSelect(group: ActionableGroupNode): DomObject {
        const mousedownHandler = (ev: MouseEvent): void => ev.preventDefault();

        let clickHandler: (ev: MouseEvent) => void;
        let open = false;
        const objectSelect: DomObject = {
            tag: 'JW-SELECT',
            children: [
                { tag: 'JW-BUTTON', children: [{ text: group.label || '\u00A0' }] },
                { tag: 'JW-GROUP', children: group.children() },
            ],
            attach: (el: HTMLElement): void => {
                clickHandler = (ev: MouseEvent): void => {
                    const inSelect =
                        (ev.target as Node).nodeType === Node.ELEMENT_NODE &&
                        (ev.target as Element).closest('jw-select') === el;
                    if ((!inSelect && open) || ev.currentTarget !== document) {
                        open = !open;
                        el.setAttribute('aria-pressed', open.toString());
                    }
                };
                el.addEventListener('mousedown', mousedownHandler);
                el.addEventListener('click', clickHandler);
                document.addEventListener('click', clickHandler);
                this.actionableGroupNodes.set(group, el);
            },
            detach: (el: HTMLElement): void => {
                el.removeEventListener('mousedown', mousedownHandler);
                el.removeEventListener('click', clickHandler);
                document.removeEventListener('click', clickHandler);
                this.actionableGroupNodes.delete(group);
            },
        };
        return objectSelect;
    }
    private _renderGroup(group: ActionableGroupNode): DomObject {
        const objectGroup: DomObject = {
            tag: 'JW-GROUP',
            attributes: { name: group.groupName },
            children: group.children(),
        };
        return objectGroup;
    }
    /**
     * Update option rendering after the command if the value of visible
     * changed.
     *
     */
    protected _updateActionableGroups(): void {
        for (const [groupNode, element] of this.actionableGroupNodes) {
            const editor = this.engine.editor;
            const invisible = !groupNode.visible(editor);
            const domInvisible = element.style.display === 'none';
            if (invisible !== domInvisible) {
                if (invisible) {
                    element.style.display = 'none';
                } else {
                    element.style.display = '';
                }
            }
        }
    }
}
