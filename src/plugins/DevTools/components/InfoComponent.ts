import { VNode } from '../../../core/stores/VNode';
import { OwlUIComponent } from '../../../ui/JWOwlUIPlugin';

export class InfoComponent extends OwlUIComponent {
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
