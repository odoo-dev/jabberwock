import { OwlUIComponent } from '../../../owl-ui/src/OwlUIComponent';
import { VNode } from '../../../core/src/VNode';
import { CharNode } from '../../../core/src/VNodes/CharNode';

export class PathComponent extends OwlUIComponent<{}> {
    getNodeRepr(vNode: VNode): string {
        const name: string = (vNode.type && vNode.type.toLowerCase()) || '?';
        let format = '';
        if (vNode instanceof CharNode) {
            if (vNode.bold) {
                format += '.b';
            }
            if (vNode.italic) {
                format += '.i';
            }
            if (vNode.underline) {
                format += '.u';
            }
            if (vNode.strikethrough) {
                format += '.s';
            }
            if (vNode.subscript) {
                format += '.sub';
            }
            if (vNode.superscript) {
                format += '.sup';
            }
            if (vNode.strong) {
                format += '.strong';
            }
            if (vNode.emphasis) {
                format += '.em';
            }
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
