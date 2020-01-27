import { Renderer } from '../core/src/Renderer';
import { VDocumentMap } from '../core/src/VDocumentMap';
import { VDocument } from '../core/src/VDocument';
import { VNode, RelativePosition } from '../core/src/VNodes/VNode';
import { VSelection, Direction } from '../core/src/VSelection';
import { VElement } from '../core/src/VNodes/VElement';

export class DomRenderer extends Renderer<Node> {
    readonly id = 'dom';

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Render the contents of a root VNode into a given target element.
     *
     * @param root
     * @param target
     */
    async render(content: VDocument | VNode, target: Element): Promise<void> {
        const root = content instanceof VDocument ? content.root : content;
        if (content instanceof VDocument) {
            // TODO: the map should be on the VDocument.
            VDocumentMap.clear(); // TODO: update instead of recreate
            const fragment = document.createDocumentFragment();
            VDocumentMap.set(root, fragment);
            target.innerHTML = ''; // TODO: update instead of recreate
        }

        // Don't render `root` itself if already rendered, render its children.
        const domRoot = VDocumentMap.toDom(root);
        const domParent = domRoot ? domRoot : target;
        const firstNode = domRoot ? root.firstChild() : root;

        if (!firstNode) return;

        let node = firstNode;
        let rendered = [];
        while (node) {
            if (!rendered.includes(node)) {
                const mapping = await this.renderNode(node, domParent);
                rendered = [...rendered, ...mapping.keys()];
            }
            node = node.nextSibling();
        }

        if (content instanceof VDocument) {
            // Append the fragment corresponding to the VDocument to `target`.
            target.appendChild(domRoot);
            VDocumentMap.set(root, target);
            this._renderSelection(content.selection, target);
        }
    }
    /**
     * Render the element matching the current vNode and append it.
     */
    async renderNode(node: VNode, domParent: Node): Promise<Map<VNode, Node[]>> {
        let renderingMap: Map<VNode, Node[]>;
        for (const renderingFunction of this.renderingFunctions) {
            renderingMap = await renderingFunction(node, domParent);
            if (renderingMap) {
                break;
            }
        }

        if (!renderingMap) {
            renderingMap = await this._renderDefault(node, domParent);
        }

        // Map the parsed nodes to the DOM nodes they represent.
        let index = 0;
        renderingMap.forEach((domNodes: Node[], node: VNode) => {
            domNodes.forEach((domNode: Node) => {
                VDocumentMap.set(node, domNode, index);
            });
            index++;
        });

        return renderingMap;
    }
    async renderChildren(node: VNode, domParent: Node): Promise<void> {
        let rendered = [];
        for (const child of node.children) {
            if (!rendered.includes(child)) {
                const mapping = await this.renderNode(child, domParent);
                rendered = [...rendered, ...mapping.keys()];
            }
        }
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    async _renderDefault(node: VNode, domParent: Node): Promise<Map<VNode, Node[]>> {
        let tagName: string;
        if (node.is(VElement)) {
            tagName = node.htmlTag;
        } else {
            tagName = node.constructor.name.toUpperCase() + '-' + node.id;
        }
        const fragment = document.createDocumentFragment();
        const renderedDomNodes: Node[] = [];
        const renderedElement = document.createElement(tagName);
        if (node.attributes) {
            node.attributes.forEach((value: string, name: string) => {
                renderedElement.setAttribute(name, value);
            });
        }
        renderedDomNodes.push(renderedElement);
        fragment.appendChild(renderedElement);

        // If a node is empty but could accomodate children,
        // fill it to make it visible.
        if (!node.hasChildren() && !node.atomic) {
            const placeholderBr = document.createElement('BR');
            renderedElement.appendChild(placeholderBr);
            renderedDomNodes.push(placeholderBr);
        }

        await this.renderChildren(node, renderedElement);

        domParent.appendChild(fragment);
        return new Map([[node, renderedDomNodes]]);
    }
    /**
     * Render the given VSelection as a DOM selection in the given target.
     *
     * @param selection
     * @param target
     */
    _renderSelection(selection: VSelection, target: Element): void {
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
}
