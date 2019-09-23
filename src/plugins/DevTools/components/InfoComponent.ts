import { VNode } from '../../../core/stores/VNode';
import { OwlUIComponent } from '../../../ui/JWOwlUIPlugin';

export class InfoComponent extends OwlUIComponent {
    /**
     * Log a `VNode` to the console.
     *
     * @param {VNode} vNode
     */
    logVNode(vNode: VNode): void {
        // Get from vDocument so we don't log a proxy
        console.log(this.env.editor.vDocument.find(vNode.id));
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
