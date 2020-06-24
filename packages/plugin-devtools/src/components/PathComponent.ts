import { OwlComponent } from '../../../plugin-owl/src/OwlComponent';
import { VNode } from '../../../core/src/VNodes/VNode';
import { Format } from '../../../core/src/Format';

export class PathComponent extends OwlComponent<{}> {
    getNodeRepr(vNode: VNode): string {
        let repr: string = vNode.name || '?';
        for (const format of vNode.modifiers.filter(Format)) {
            repr += '.' + format.name;
        }
        return repr;
    }
    /**
     * Trigger a 'node-selected' custom event
     * with the given `vNode` to select it
     *
     * @param {VNode} vNode
     */
    selectNode(vNode: VNode): void {
        this.trigger('node-selected', {
            vNode: vNode,
        });
    }
}
