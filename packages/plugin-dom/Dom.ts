import { JWPlugin } from '../core/src/JWPlugin';
import { VNode, RelativePosition } from '../core/src/VNodes/VNode';
import { VSelection, Direction } from '../core/src/VSelection';
import { VDocumentMap } from '../core/src/VDocumentMap';
import { DefaultDomRenderer } from './DefaultDomRenderer';
import { CharNode } from '../plugin-char/CharNode';
import { Char } from '../plugin-char/Char';
import JWEditor from '../core/src/JWEditor';
import { RenderingEngine } from '../core/src/RenderingEngine';

export class Dom extends JWPlugin {
    readonly renderingEngines = [new RenderingEngine<Node[]>('dom')];
    readonly renderers = {
        dom: [DefaultDomRenderer],
    };

    constructor(editor: JWEditor) {
        super(editor);
        this.editor.registerExecCommandHook(this._renderInEditable.bind(this));
    }

    async start(): Promise<void> {
        return this._renderInEditable();
    }

    /**
     * Render the given VSelection as a DOM selection in the given target.
     *
     * @param selection
     * @param target
     */
    renderSelection(selection: VSelection, target: Element): void {
        if (!selection.anchor.parent || !selection.focus.parent) return;
        const [anchorNode, anchorOffset] = this._getDomLocation(selection.anchor);
        const [focusNode, focusOffset] = this._getDomLocation(selection.focus);
        const domRange = target.ownerDocument.createRange();
        if (selection.direction === Direction.FORWARD) {
            domRange.setStart(anchorNode, anchorOffset);
            domRange.collapse(true);
        } else {
            domRange.setEnd(anchorNode, anchorOffset);
            domRange.collapse(false);
        }
        const domSelection = document.getSelection();
        domSelection.removeAllRanges();
        domSelection.addRange(domRange);
        domSelection.extend(focusNode, focusOffset);
    }

    /**
     * Return the location in the DOM corresponding to the location in the
     * VDocument of the given VNode. The location in the DOM is expressed as a
     * tuple containing a reference Node and a relative position with respect to
     * the reference Node.
     *
     * @param node
     */
    _getDomLocation(node: VNode): [Node, number] {
        let reference = node.previousSibling();
        let position = RelativePosition.AFTER;
        if (reference) {
            reference = reference.lastLeaf();
        } else {
            reference = node.nextSibling();
            position = RelativePosition.BEFORE;
        }
        if (reference) {
            reference = reference.firstLeaf();
        } else {
            reference = node.parent;
            position = RelativePosition.INSIDE;
        }
        // The location is a tuple [reference, offset] implemented by an array.
        const location = VDocumentMap.toDomLocation(reference);
        if (position === RelativePosition.AFTER) {
            // Increment the offset to be positioned after the reference node.
            location[1] += 1;
        }
        return location;
    }

    async _renderInEditable(): Promise<void> {
        this.editor.editable.innerHTML = '';
        VDocumentMap.clear();
        VDocumentMap.set(this.editor.vDocument.root, this.editor.editable);
        const rendering = await this.editor.render<Node[]>('dom', this.editor.vDocument.root);
        await this._generateDomMap();
        for (const renderedChild of rendering) {
            this.editor.editable.appendChild(renderedChild);
        }
        this.renderSelection(this.editor.vDocument.selection, this.editor.editable);
    }

    async _generateDomMap(): Promise<void> {
        let node = this.editor.vDocument.root.lastLeaf();
        while (node) {
            let offset = 0;
            if (node.is(CharNode)) {
                let previousSibling = node.previousSibling();
                while (previousSibling && Char.isSameTextNode(previousSibling, node)) {
                    offset++;
                    previousSibling = previousSibling.previousSibling();
                }
            }

            const renderedNode = (await this.editor.renderers.dom.render(node)) as Node[];
            for (const domNode of renderedNode) {
                VDocumentMap.set(node, domNode, offset);
                this._setChildNodes(node, domNode, offset);
            }
            node = node.previous();
        }
    }

    async _setChildNodes(node: VNode, renderedNode: Node, offset = 0): Promise<void> {
        for (const renderedChild of renderedNode.childNodes) {
            VDocumentMap.set(node, renderedChild, offset);
            this._setChildNodes(node, renderedChild, offset);
        }
    }
}
