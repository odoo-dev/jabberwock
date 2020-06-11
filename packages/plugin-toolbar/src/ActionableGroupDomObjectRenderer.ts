import {
    DomObject,
    DomObjectRenderingEngine,
} from '../../plugin-html/src/DomObjectRenderingEngine';
import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { ActionableGroupNode } from './ActionableGroupNode';

export class ActionableGroupDomObjectRenderer extends AbstractRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = ActionableGroupNode;

    async render(group: ActionableGroupNode): Promise<DomObject> {
        if (
            !group.descendants(node => !(node instanceof ActionableGroupNode) && node.tangible)
                .length
        ) {
            return { children: [] };
        } else if (group.parent instanceof ActionableGroupNode) {
            return this._renderSelect(group);
        } else {
            return this._renderGroup(group);
        }
    }
    private _renderSelect(group: ActionableGroupNode): DomObject {
        const objectSelect: DomObject = {
            tag: 'SELECT',
            children: [{ tag: 'OPTION' }, ...group.children()],
        };
        this.engine.renderAttributes(Attributes, group, objectSelect);
        return objectSelect;
    }
    private _renderGroup(group: ActionableGroupNode): DomObject {
        const objectGroup: DomObject = {
            tag: 'JW-GROUP',
            children: group.children(),
        };
        this.engine.renderAttributes(Attributes, group, objectGroup);
        return objectGroup;
    }
}