import { utils } from '../../../../packages/utils/src/utils';
import { OwlUIComponent } from '../../../owl-ui/src/OwlUIComponent';
import { VNode } from '../../../core/src/VNodes/VNode';
import { VRangeDescription } from '../../../core/src/VRange';
import { Direction, RANGE_TAIL_CHAR, RANGE_HEAD_CHAR } from '../../../utils/src/range';
import { LineBreakNode } from '../../../core/src/VNodes/LineBreakNode';

interface NodeProps {
    isRoot: boolean;
    vNode: VNode;
    selectedPath: VNode[];
}

interface NodeState {
    folded: boolean;
}

/**
 * Note: `TreeComponent` requires three properties passed by the parent
 *       Component (`DevToolsComponent`) via the template (see `DevTools.xml`):
 *       - vNode: VNode
 *       - isRoot: boolean
 *       - selectedID: number (the ID of the selected VNode)
 */
export class TreeComponent extends OwlUIComponent<NodeProps> {
    // This is a recursive Component: each node of the tree is itself a tree
    static components = { TreeComponent };
    // User-friendly representation of the node
    repr: string = this._getNodeRepr(this.props.vNode);
    state: NodeState = {
        folded: !this.props.isRoot, // Fold everything but the root on init
    };

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Update `state.folded` when `props.selectedPath` changes if `props.vNode`
     * is in `props.selectedPath`, unless it is the last item. Also update
     * `state.folded` for the ancestors of the range nodes.
     */
    async willUpdateProps(nextProps: NodeProps): Promise<void> {
        // The selected node itself should stay folded even when selected. Only
        // the nodes in the path leading to it should actually be unfolded. By
        // construction, the last item of `selected path` is always the selected
        // node itself so it can safely be omitted from the check.
        const path = nextProps.selectedPath.slice(0, -1);
        if (path.some(node => node.id === nextProps.vNode.id)) {
            this.state.folded = false;
        }
        const rangePath = this._getRangeAncestors();
        if (rangePath.has(nextProps.vNode.id)) {
            this.state.folded = false;
        }
    }

    /**
     * Handle a click event on a node of the tree: toggle its fold on click its
     * caret, select it otherwise
     *
     * @param {MouseEvent} event
     */
    onClickNode(event: MouseEvent): void {
        const didClickCaret: boolean = event.offsetX < 10;
        if (didClickCaret) {
            this.toggleFolded();
        } else {
            this.trigger('node-selected', {
                vNode: this.props.vNode,
            });
        }
    }
    onDblClickNode(): void {
        const location: VRangeDescription = {
            start: this.props.vNode,
            end: this.props.vNode,
            direction: Direction.FORWARD,
        };
        this.env.editor.execCommand('setRange', { vRange: location });
    }
    /**
     * Handle folding/unfolding on press Enter
     *
     * @param {KeyboardEvent} event
     */
    onKeydown(event: KeyboardEvent): void {
        if (event.code === 'Enter') {
            event.preventDefault();
            this.toggleFolded();
            event.stopImmediatePropagation();
        }
    }
    /**
     * Unfold all of a node's direct ancestors on select it
     * TODO: find a way to do this cross-components
     *
     * @param {CustomEvent} event
     */
    selectNode(event: CustomEvent): void {
        if (event.detail.vNode.id !== this.props.vNode.id) {
            this.state.folded = false;
        }
    }
    /**
     * Toggle the `folded` propoerty of the state
     */
    toggleFolded(): void {
        this.state.folded = !this.state.folded;
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Return a user-friendly representation of the node
     *
     * @param {VNode} node
     * @returns {string}
     */
    _getNodeRepr(node: VNode): string {
        if (node === this.env.editor.vDocument.range.anchor) {
            return RANGE_TAIL_CHAR;
        }
        if (node === this.env.editor.vDocument.range.focus) {
            return RANGE_HEAD_CHAR;
        }
        if (node instanceof LineBreakNode) {
            return '↲';
        }
        if (node.name) {
            return utils.toUnicode(node.name);
        }
        return '?';
    }
    /**
     * Return a set of the IDs of all ancestors of both range nodes.
     */
    _getRangeAncestors(): Set<number> {
        const rangeAncestors = new Set<number>();
        let ancestor = this.env.editor.vDocument.range.end.parent;
        while (ancestor) {
            rangeAncestors.add(ancestor.id);
            ancestor = ancestor.parent;
        }
        ancestor = this.env.editor.vDocument.range.start.parent;
        while (ancestor) {
            rangeAncestors.add(ancestor.id);
            ancestor = ancestor.parent;
        }
        return rangeAncestors;
    }
}
