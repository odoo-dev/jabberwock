import { InfoComponent } from './InfoComponent';
import { PathComponent } from './PathComponent';
import { TreeComponent } from './TreeComponent';
import { VNode } from '../../../core/stores/VNode';
import { Component } from 'owl-framework';

////////////////////////////// todo: use API ///////////////////////////////////

interface DevToolsState {
    closed: boolean; // Are the devtools open?
    height: number; // In px
    selectedNode: VNode;
    selectedPath: VNode[]; // From highest parent to currently selected node
}

export class DevToolsComponent extends Component<any, any, DevToolsState> {
    components = { InfoComponent, PathComponent, TreeComponent };
    state: DevToolsState = {
        closed: true,
        height: 300,
        selectedNode: this.env.editor.vDocument.contents,
        selectedPath: this._getPath(this.env.editor.vDocument.contents),
    };
    template = 'devtools';
    // For resizing/opening (see toggleClosed)
    _heightOnLastMousedown: number = this.state.height;

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Handle keyboard navigation in DevTools (arrows to move in the tree)
     *
     * @param {KeyboardEvent} event
     */
    onKeydown(event: KeyboardEvent): void {
        event.preventDefault();
        const selected: VNode = this.state.selectedNode;
        let newSelection: VNode;
        switch (event.code) {
            case 'ArrowDown':
                newSelection = selected.nextSibling || selected.firstChild;
                break;
            case 'ArrowUp':
                newSelection = selected.previousSibling || selected.parent;
                break;
            case 'ArrowLeft':
                newSelection = selected.previousSibling;
                break;
            case 'ArrowRight':
                newSelection = selected.nextSibling;
                break;
        }
        if (newSelection) {
            this._selectNode(newSelection);
        }
    }
    /**
     * Drag the DevTools to resize them
     *
     * @param {MouseEvent} event
     */
    startResize(event: MouseEvent): void {
        if (this.state.closed) {
            return; // Do not resize if the DevTools are closed
        }

        this._heightOnLastMousedown = this.state.height;
        const startY: number = event.pageY; // Y position of the mousedown

        /**
         * Perform the resizing on every mouse mouvement
         *
         * @param mouseMoveEvent
         */
        const doResize = (mouseMoveEvent: MouseEvent): void => {
            const currentY: number = mouseMoveEvent.pageY;
            const offset: number = startY - currentY;
            this.state.height = this._heightOnLastMousedown + offset;
        };
        /**
         * Stop resizing on mouse up
         */
        const stopResize = (): void => {
            window.removeEventListener('mousemove', doResize, false);
            window.removeEventListener('mouseup', stopResize, false);
        };

        window.addEventListener('mousemove', doResize);
        window.addEventListener('mouseup', stopResize);
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
    /**
     * Toggle the `closed` state of the DevTools (only on a simple click: not
     * if some resizing occurred between mousedown and mouseup)
     */
    toggleClosed(): void {
        const didJustResize = this._heightOnLastMousedown === this.state.height;
        if (didJustResize) {
            this.state.closed = !this.state.closed;
        }
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
