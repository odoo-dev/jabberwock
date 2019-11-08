import { VNode } from '../../../core/stores/VNode';
import { OwlUIComponent } from '../../../ui/OwlUIComponent';

export class PathComponent extends OwlUIComponent<{}> {
    getNodeRepr(vNode: VNode): string {
        const name: string = (vNode.type && vNode.type.toLowerCase()) || '?';
        let format = '';
        if (vNode.format.bold) {
            format += '.b';
        }
        if (vNode.format.italic) {
            format += '.i';
        }
        if (vNode.format.underline) {
            format += '.u';
        }
        return name + format;
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
