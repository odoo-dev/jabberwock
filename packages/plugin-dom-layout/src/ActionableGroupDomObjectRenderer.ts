import {
    DomObject,
    DomObjectRenderingEngine,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { ActionableGroupNode } from '../../plugin-layout/src/ActionableGroupNode';
import { ActionableNode } from '../../plugin-layout/src/ActionableNode';

export class ActionableGroupDomObjectRenderer extends NodeRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = ActionableGroupNode;

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
            return this._renderSelect(group);
        } else {
            return this._renderGroup(group);
        }
    }
    private _renderSelect(group: ActionableGroupNode): DomObject {
        const objectSelect: DomObject = {
            tag: 'SELECT',
            children: [{ tag: 'OPTION' }, ...group.children()],
            attach: (el: HTMLSelectElement): void => {
                this.actionableGroupNodes.set(group, el);
            },
            detach: (): void => {
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
     * @param actionable
     * @param element
     */
    protected _updateActionableGroups(): void {
        for (const [actionable, element] of this.actionableGroupNodes) {
            const editor = this.engine.editor;
            const invisible = actionable
                .descendants(ActionableNode)
                .every(n => n.visible && !n.visible(editor));
            const domInvisible = element.style.display === 'none';
            if (invisible !== domInvisible) {
                if (invisible) {
                    element.style.display = 'none';
                } else {
                    element.style.display = 'inline-block';
                }
            }
        }
    }
}
