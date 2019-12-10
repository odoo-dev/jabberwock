import { InfoComponent } from './InfoComponent';
import { PathComponent } from './PathComponent';
import { TreeComponent } from './TreeComponent';
import { OwlUIComponent } from '../../../owl-ui/src/OwlUIComponent';
import { VNode } from '../../../core/src/VNodes/VNode';

export class InspectorComponent extends OwlUIComponent<{}> {
    static components = { InfoComponent, PathComponent, TreeComponent };
    state = {
        selectedNodeID: 0,
    };
    selectedNode = this.env.editor.vDocument.root;

    /**
     * Handle keyboard navigation in DevTools (arrows to move in the tree)
     *
     * @param {KeyboardEvent} event
     */
    onKeydown(event: KeyboardEvent): void {
        const selected: VNode = this.selectedNode;
        let newSelection: VNode;
        switch (event.code) {
            case 'ArrowDown':
                newSelection = selected.nextSibling() || selected.firstChild();
                break;
            case 'ArrowUp':
                newSelection = selected.previousSibling() || selected.parent;
                break;
            case 'ArrowLeft':
                newSelection = selected.previousSibling();
                break;
            case 'ArrowRight':
                newSelection = selected.nextSibling();
                break;
            default:
                return;
        }
        if (newSelection) {
            event.preventDefault();
            this.selectedNode = newSelection;
            this.state.selectedNodeID = newSelection.id;
        }
    }
    /**
     * Handle the selection of a node. A subcomponent triggers a 'select-node'
     * custom event and this method listens to it, retrieves the `vNode` that it
     * passes in its `detail` key, and modifies its state to account for the
     * change in selection.
     *
     * @param {CustomEvent} event
     * @param {VNode} event.detail.vNode
     */
    selectNode(event: CustomEvent): void {
        const vNode: VNode = event.detail.vNode;
        this.selectedNode = vNode;
        this.state.selectedNodeID = vNode.id;
    }
    /**
     * Return the path between the given `vNode` and the root vNode, as an array
     * of VNode, sorted from the highest parent (the root) to the given vNode.
     *
     * @param {VNode} vNode
     * @returns {VNode []}
     */
    getPath(vNode: VNode): VNode[] {
        const path: VNode[] = [vNode];
        let parent: VNode = vNode.parent;
        while (parent) {
            path.unshift(parent);
            parent = parent.parent;
        }
        return path;
    }
}
