import { DomObject } from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { ActionableGroupNode } from '../../plugin-layout/src/ActionableGroupNode';
import { ActionableGroupDomObjectRenderer } from '../../plugin-dom-layout/src/ActionableGroupDomObjectRenderer';
import { VNode } from '../../core/src/VNodes/VNode';

export class NativeSelectActionableGroupDomObjectRenderer extends ActionableGroupDomObjectRenderer {
    predicate = (node: VNode): boolean =>
        node instanceof ActionableGroupNode && !!node.ancestor(ActionableGroupNode);

    async render(group: ActionableGroupNode): Promise<DomObject> {
        if (
            !group.descendants(node => !(node instanceof ActionableGroupNode) && node.tangible)
                .length
        ) {
            return { children: [] };
        } else {
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
    }
}
