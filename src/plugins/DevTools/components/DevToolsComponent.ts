import { Component } from '../../../../lib/owl/dist/owl.js';
import { InfoComponent } from './InfoComponent.js';
import { PathComponent } from './PathComponent.js';
import { TreeComponent } from './TreeComponent.js';
import { VNode } from '../../../core/stores/VNode.js';

////////////////////////////// todo: use API ///////////////////////////////////

interface DevToolsState {
    closed: boolean;
    height: number; // in px
    selectedNode: VNode;
    selectedPath: VNode[];
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
    _heightOnLastMousedown = this.state.height;

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

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
    startResize(event: MouseEvent): void {
        if (this.state.closed) {
            return;
        }
        const startHeight = this.state.height;
        this._heightOnLastMousedown = this.state.height;
        const resizePageY = event.pageY;
        const doResize = (event: MouseEvent): void => {
            this.state.height = startHeight + resizePageY - event.pageY;
        };
        const stopResize = (): void => {
            window.removeEventListener('mousemove', doResize, false);
            window.removeEventListener('mouseup', stopResize, false);
        };
        window.addEventListener('mousemove', doResize);
        window.addEventListener('mouseup', stopResize);
    }
    selectNode(event: CustomEvent): void {
        const vNode: VNode = event.detail.vNode;
        this._selectNode(vNode);
    }
    toggleOpen(): void {
        const didJustResize = this._heightOnLastMousedown === this.state.height;
        if (didJustResize) {
            this.state.closed = !this.state.closed;
        }
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    _getPath(vNode: VNode): VNode[] {
        const path: VNode[] = [vNode];
        let parent: VNode = vNode.parent;
        while (parent) {
            path.unshift(parent);
            parent = parent.parent;
        }
        return path;
    }
    _selectNode(vNode: VNode): void {
        this.state.selectedNode = vNode;
        this.state.selectedPath = this._getPath(vNode);
    }
}
