import { InfoComponent } from './InfoComponent';
import { PathComponent } from './PathComponent';
import { TreeComponent } from './TreeComponent';
import { OwlUIComponent } from '../../../owl-ui/src/OwlUIComponent';
import { VNode } from '../../../core/src/VNode';

////////////////////////////// todo: use API ///////////////////////////////////

interface InspectorState {
    selectedNode: VNode;
    selectedPath: VNode[]; // From highest parent to currently selected node
}

export class InspectorComponent extends OwlUIComponent<{}> {
    static components = { InfoComponent, PathComponent, TreeComponent };
    state: InspectorState = {
        selectedNode: this.env.editor.vDocument.root,
        selectedPath: this._getPath(this.env.editor.vDocument.root),
    };

    /**
     * Handle keyboard navigation in DevTools (arrows to move in the tree)
     *
     * @param {KeyboardEvent} event
     */
    onKeydown(event: KeyboardEvent): void {
        const selected: VNode = this.state.selectedNode;
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
        }
        if (newSelection) {
            event.preventDefault();
            this._selectNode(newSelection);
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
        this._selectNode(vNode);
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Return the path between the given `vNode` and the root vNode, as an array
     * of VNode, sorted from the highest parent (the root) to the given vNode.
     *
     * @param {VNode} vNode
     * @returns {VNode []}
     */
    _getPath(vNode: VNode): VNode[] {
        const path: VNode[] = [vNode];
        let parent: VNode = vNode.parent;
        while (parent) {
            path.unshift(parent);
            parent = parent.parent;
        }
        return path;
    }
    /**
     * Update the state to account for the selection of the given vNode
     *
     * @param {VNode} vNode
     */
    _selectNode(vNode: VNode): void {
        this.state.selectedNode = vNode;
        this.state.selectedPath = this._getPath(vNode);
    }
}
