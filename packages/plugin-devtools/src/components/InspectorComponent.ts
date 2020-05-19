import { InfoComponent } from './InfoComponent';
import { PathComponent } from './PathComponent';
import { TreeComponent } from './TreeComponent';
import { OwlComponent } from '../../../plugin-owl/src/ui/OwlComponent';
import { VNode } from '../../../core/src/VNodes/VNode';
import { Layout } from '../../../plugin-layout/src/Layout';
import { DomLayoutEngine } from '../../../plugin-dom-layout/src/ui/DomLayoutEngine';
import { caretPositionFromPoint } from '../../../utils/src/polyfill';
import { CharNode } from '../../../plugin-char/src/CharNode';

const hoverStyle = 'box-shadow: inset 0 0 0 100vh rgba(95, 146, 204, 0.5); cursor: pointer;';

export interface InspectorState {
    selectedID: number;
}

interface InspectorComponentProps extends InspectorState {
    root: VNode;
}

export class InspectorComponent extends OwlComponent<InspectorComponentProps> {
    static components = { InfoComponent, PathComponent, TreeComponent };
    domEngine = this.env.editor.plugins.get(Layout).engines.dom as DomLayoutEngine;

    private _hoveredTargets: {
        element: HTMLElement;
        oldStyle: string;
    }[] = [];

    state: InspectorState = {
        selectedID: this.domEngine.components.get('editable')[0]?.id,
    };
    selectedNode = this.getNode(this.state.selectedID);

    constructor(parent?: OwlComponent<{}>, props?: InspectorComponentProps) {
        super(parent, props);
        this._onInspectorMouseMove = this._onInspectorMouseMove.bind(this);
        this._onInspectorMouseLeave = this._onInspectorMouseLeave.bind(this);
        this._onInspectorMouseDown = this._onInspectorMouseDown.bind(this);
        this._onInspectorClick = this._onInspectorClick.bind(this);
    }
    willUnmount(): void {
        this._hoveredTargets = [];
        this.selectedNode = null;
    }

    /**
     * Handle keyboard navigation in DevTools (arrows to move in the tree)
     *
     * @param {KeyboardEvent} event
     */
    onKeydown(event: KeyboardEvent): void {
        const selected: VNode = this.getNode(this.state.selectedID);
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
            this.state.selectedID = newSelection.id;
            this.selectedNode = this.getNode(this.state.selectedID);
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
        this.state.selectedID = event.detail.vNode.id;
        this.selectedNode = this.getNode(this.state.selectedID);
    }
    getNode(id: number): VNode {
        return this.domEngine.root.descendants(node => node.id === id)[0] || this.domEngine.root;
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

    patched(): void {
        super.patched();
        const selected = this.el.querySelector('.selected');
        if (selected) {
            //selected.scrollIntoView();
        }
    }

    /**
     * Bind mouse handler to allow the selection of the node in the devtools inspector.
     * When the mouse will move, we add a class to highlight the targeted node (linked to VNode).
     * Will be unbind when the user click inside the dom.
     *
     * @param ev
     */
    inpectDom(): void {
        window.addEventListener('mousemove', this._onInspectorMouseMove, true);
        window.addEventListener('mouseleave', this._onInspectorMouseLeave, true);
        window.addEventListener('mousedown', this._onInspectorMouseDown, true);
        window.addEventListener('click', this._onInspectorClick, true);
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Add a class to highlight the targeted node (like to VNode).
     *
     * @param ev
     */
    private async _onInspectorMouseMove(ev: MouseEvent): Promise<void> {
        ev.stopImmediatePropagation();
        ev.preventDefault();
        for (const inspected of this._hoveredTargets) {
            inspected.element.setAttribute('style', inspected.oldStyle);
        }
        this._hoveredTargets = [];

        const elements: HTMLElement[] = [];
        for (const node of this._getNodeFromPosition(ev.clientX, ev.clientY)) {
            for (const domNode of this.domEngine.getDomNodes(node)) {
                const element = domNode instanceof HTMLElement ? domNode : domNode.parentElement;
                if (!elements.includes(element)) {
                    elements.push(element);
                }
            }
        }
        for (const element of elements) {
            const style = element.getAttribute('style') || '';
            this._hoveredTargets.push({
                element: element,
                oldStyle: style,
            });
            element.setAttribute('style', style + ';' + hoverStyle);
        }
    }
    /**
     * remove class to remove the highlight.
     *
     * @param ev
     */
    private _onInspectorMouseLeave(ev: MouseEvent): void {
        ev.stopImmediatePropagation();
        ev.preventDefault();
        for (const inspected of this._hoveredTargets) {
            if (inspected.element === ev.target) {
                this._hoveredTargets.splice(this._hoveredTargets.indexOf(inspected), 1);
                inspected.element.setAttribute('style', inspected.oldStyle);
            }
        }
    }
    /**
     * Prevent default behavior (domEditable normalisation).
     *
     * @param ev
     */
    private _onInspectorMouseDown(ev: MouseEvent): void {
        ev.stopImmediatePropagation();
        ev.preventDefault();
    }
    private _getNodeFromPosition(clientX: number, clientY: number): VNode[] {
        const caretPosition = caretPositionFromPoint(clientX, clientY);
        let node = caretPosition?.offsetNode;
        let nodes = [];
        while (!nodes.length && node) {
            nodes = this.domEngine.getNodes(node);
            node = node.parentNode;
        }
        if (nodes.length && nodes[0].is(CharNode) && nodes[caretPosition.offset]) {
            return [nodes[caretPosition.offset]];
        }
        return nodes;
    }
    /**
     * Select the targeted node in the devtools inspector and unbind the mouse handler
     *
     * @param ev
     */
    private async _onInspectorClick(ev: MouseEvent): Promise<void> {
        window.removeEventListener('mousemove', this._onInspectorMouseMove, true);
        window.removeEventListener('mouseleave', this._onInspectorMouseLeave, true);
        window.removeEventListener('mousedown', this._onInspectorMouseDown, true);
        window.removeEventListener('click', this._onInspectorClick, true);
        ev.stopImmediatePropagation();
        ev.preventDefault();
        for (const inspected of this._hoveredTargets) {
            inspected.element.setAttribute('style', inspected.oldStyle);
        }
        this._hoveredTargets = [];

        const nodes = this._getNodeFromPosition(ev.clientX, ev.clientY);
        if (nodes.length) {
            this.state.selectedID = nodes[0].id;
            this.selectedNode = this.getNode(this.state.selectedID);
        }
    }
}
