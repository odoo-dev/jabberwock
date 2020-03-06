import { OwlUIComponent } from '../../../owl-ui/src/OwlUIComponent';
import { VNode } from '../../../core/src/VNodes/VNode';
import { InlineNode } from '../../../plugin-inline/src/InlineNode'; // todo: remove dependency

export class PathComponent extends OwlUIComponent<{}> {
    getNodeRepr(vNode: VNode): string {
        let repr: string = vNode.name || '?';
        if (vNode instanceof InlineNode) {
            for (const format of vNode.formats) {
                repr += '.' + format.name;
            }
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
