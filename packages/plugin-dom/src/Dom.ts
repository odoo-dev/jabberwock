import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { VNode, RelativePosition } from '../../core/src/VNodes/VNode';
import { VSelection, VSelectionDescription, Direction } from '../../core/src/VSelection';
import { DomMap } from './DomMap';
import { nodeLength } from '../../utils/src/utils';
import { DomSelectionDescription } from '../../core/src/EventNormalizer';
import { ParsingEngine } from '../../plugin-parser/src/ParsingEngine';
import { DomParsingEngine } from './DomParsingEngine';
import { DomRenderingEngine } from './DomRenderingEngine';
import { RenderingEngine } from '../../core/src/RenderingEngine';
import { Loadables } from '../../core/src/JWEditor';
import { Parser } from '../../plugin-parser/src/Parser';

interface DomConfig extends JWPluginConfig {
    autoFocus?: boolean;
    target?: HTMLElement;
}

export class Dom<T extends DomConfig = DomConfig> extends JWPlugin<T> implements Loadables<Parser> {
    static dependencies = [Parser];
    readonly renderingEngines = [DomRenderingEngine];
    readonly loadables = {
        parsingEngines: [DomParsingEngine],
    };
    configuration = this.configuration || {
        autoFocus: false,
    };
    commandHooks = {
        '*': this._renderInEditable.bind(this),
    };

    domMap = new DomMap();
    editable: HTMLElement;

    async start(): Promise<void> {
        const target = this.configuration.target;
        if (target) {
            this.domMap.set(this.editor.vDocument.root, target);
            // Deep clone the given editable node in order to break free of any
            // handler that might have been previously registered.
            this.editable = target.cloneNode(true) as HTMLElement;

            if (target.innerHTML !== '') {
                const parser = this.dependencies.get(Parser);
                const domParser = parser && parser.engines.dom;
                if (!domParser) {
                    // TODO: remove this when the editor can be instantiated on
                    // something else than DOM.
                    throw new Error(`No DOM parser installed.`);
                }
                const parsedEditable = await domParser.parse(target);
                for (const parsedNode of parsedEditable) {
                    for (const child of parsedNode.children.slice()) {
                        this.editor.vDocument.root.append(child);
                    }
                }
            }
        } else {
            this.editable = document.createElement('jw-editable');
            // Semantic elements are inline by default.
            // We need to guarantee it's a block so it can contain other blocks.
            this.editable.style.display = 'block';
            this.domMap.set(this.editor.vDocument.root, this.editable);
        }

        this.editable.setAttribute('contenteditable', 'true');

        // Construct DOM map from the parsing in order to parse the selection.
        const parser = this.dependencies.get(Parser);
        const engine = parser.engines.dom as ParsingEngine<Node>;
        for (const [domNode, nodes] of engine.parsingMap) {
            for (const node of nodes) {
                this.domMap.set(node, domNode);
            }
        }

        if (target) {
            // Parse the selection.
            const selection = target.ownerDocument.getSelection();
            const anchorNode = selection.anchorNode;
            const focusNode = selection.focusNode;
            if (
                (target === anchorNode || target.contains(anchorNode)) &&
                (target === focusNode || target.contains(focusNode))
            ) {
                this.editor.selection.set(this.parseSelection(selection));
            }

            // remove the target node (todo: re-insert when stop the editor)
            target.remove();
        }

        if (
            this.configuration.autoFocus &&
            (!this.editor.selection.range.start.parent || !this.editor.selection.range.end.parent)
        ) {
            this.editor.selection.setAt(this.editor.vDocument.root);
        }

        this.editor.el.appendChild(this.editable);

        return this._renderInEditable();
    }

    /**
     * Parse the dom selection into the description of a VSelection.
     *
     * @param selection
     * @param [direction]
     */
    parseSelection(selection: Selection | DomSelectionDescription): VSelectionDescription {
        const start = this._locate(selection.anchorNode, selection.anchorOffset);
        const end = this._locate(selection.focusNode, selection.focusOffset);
        const [startVNode, startPosition] = start;
        const [endVNode, endPosition] = end;

        let direction: Direction;
        if (selection instanceof Selection) {
            const domRange = selection.rangeCount && selection.getRangeAt(0);
            if (
                domRange.startContainer === selection.anchorNode &&
                domRange.startOffset === selection.anchorOffset
            ) {
                direction = Direction.FORWARD;
            } else {
                direction = Direction.BACKWARD;
            }
        } else {
            direction = selection.direction;
        }

        return {
            anchorNode: startVNode,
            anchorPosition: startPosition,
            focusNode: endVNode,
            focusPosition: endPosition,
            direction: direction,
        };
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

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Return a position in the VNodes as a tuple containing a reference
     * node and a relative position with respect to this node ('BEFORE' or
     * 'AFTER'). The position is always given on the leaf.
     *
     * @param container
     * @param offset
     */
    _locate(domNode: Node, offset: number): [VNode, RelativePosition] {
        let forceAfter = false;
        let forcePrepend = false;
        let container = domNode.childNodes[offset] || domNode;
        if (container === domNode && container.childNodes.length) {
            container = container.childNodes[container.childNodes.length - 1];
            forceAfter = true;
        }
        offset = container === domNode ? offset : 0;
        while (!this.domMap.fromDom(container)) {
            forceAfter = false;
            forcePrepend = false;
            if (container.previousSibling) {
                forceAfter = true;
                container = container.previousSibling;
                offset = nodeLength(container);
            } else {
                forcePrepend = true;
                offset = [].indexOf.call(container.parentNode.childNodes, container);
                container = container.parentNode;
            }
        }
        const nodes = this.domMap.fromDom(container);
        // When targetting the end of a node, the DOM gives an offset that is
        // equal to the length of the container. In order to retrieve the last
        // descendent, we need to make sure we target an existing node, ie. an
        // existing index.
        const isAfterEnd = offset >= nodeLength(container);
        let index = isAfterEnd ? nodeLength(container) - 1 : offset;
        // Move to deepest child of container.
        while (container.hasChildNodes()) {
            container = container.childNodes[index];
            index = isAfterEnd ? nodeLength(container) - 1 : 0;
            // Adapt the offset to be its equivalent within the new container.
            offset = isAfterEnd ? nodeLength(container) : index;
        }
        // Get the VNodes matching the container.
        let reference: VNode;
        if (container.nodeType === Node.TEXT_NODE) {
            // The reference is the index-th match (eg.: text split into chars).
            reference = forceAfter ? nodes[nodes.length - 1] : nodes[index];
        } else {
            reference = nodes[0];
        }
        if (forceAfter) {
            return [reference, RelativePosition.AFTER];
        }
        if (forcePrepend) {
            return [reference, RelativePosition.INSIDE];
        }
        return reference.locate(container, offset);
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
        const location = this.domMap.toDomLocation(reference);
        if (position === RelativePosition.AFTER) {
            // Increment the offset to be positioned after the reference node.
            location[1] += 1;
        }
        return location;
    }

    async _renderInEditable(): Promise<void> {
        this.editable.innerHTML = '';

        this.domMap.set(this.editor.vDocument.root, this.editable);
        const rendering = await this.editor.render<Node[]>('dom', this.editor.vDocument.root);
        if (rendering) {
            await this._generateDomMap();
            for (const renderedChild of rendering) {
                this.editable.appendChild(renderedChild);
            }
            this.renderSelection(this.editor.selection, this.editable);
        }
    }

    async _generateDomMap(): Promise<void> {
        this.domMap.clear();

        let node = this.editor.vDocument.root.lastLeaf();
        while (node) {
            const domEngine = this.editor.renderers.dom as RenderingEngine<Node[]>;
            await domEngine.render(node);
            const renderings = domEngine.renderings.get(node);
            const rendering = renderings[renderings.length - 1];
            const renderedNodes = await rendering[1];
            for (const domNode of renderedNodes) {
                this.domMap.set(node, domNode, -1, 'unshift');
                this._setChildNodes(node, domNode);
            }
            node = node.previous();
        }
    }

    async _setChildNodes(node: VNode, renderedNode: Node): Promise<void> {
        for (const renderedChild of renderedNode.childNodes) {
            const mapping = this.domMap.toDom(node);
            if (!mapping) {
                this.domMap.set(node, renderedChild, -1, 'unshift');
                this._setChildNodes(node, renderedChild);
            }
        }
    }
}
