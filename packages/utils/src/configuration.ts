import { ParsingEngine } from '../../plugin-parser/src/ParsingEngine';
import { DomMap } from './DomMap';
import JWEditor from '../../core/src/JWEditor';
import { VNode, RelativePosition, Point } from '../../core/src/VNodes/VNode';
import { Parser } from '../../plugin-parser/src/Parser';
import { nodeLength, isInstanceOf } from './utils';
import { ContainerNode } from '../../core/src/VNodes/ContainerNode';
import { Direction, VSelectionDescription } from '../../core/src/VSelection';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { TagNode } from '../../core/src/VNodes/TagNode';

export async function parseElement(editor: JWEditor, element: HTMLElement): Promise<VNode[]> {
    const parser = editor.plugins.get(Parser);
    const domParserEngine = parser.engines['dom/html'] as ParsingEngine<Node>;
    if (!domParserEngine) {
        throw new Error('To use this parsing utils you must add the Html plugin.');
    }
    const parsedVNodes = await domParserEngine.parse(element);
    const domSelection = element.ownerDocument.getSelection();
    const anchorNode = domSelection.anchorNode;
    if (element === anchorNode || element.contains(anchorNode)) {
        const domMap = new DomMap();

        // Construct DOM map from the parsing in order to parse the selection.
        for (const node of parsedVNodes) {
            domMap.set(node, element);
        }
        for (const [domNode, nodes] of domParserEngine.parsingMap) {
            for (const node of nodes) {
                domMap.set(node, domNode);
            }
        }

        const _locate = (domNode: Node, domOffset: number): Point => {
            /**
             * Return a position in the VNodes as a tuple containing a reference
             * node and a relative position with respect to this node ('BEFORE' or
             * 'AFTER'). The position is always given on the leaf.
             *
             * @param container
             * @param offset
             */
            let forceAfter = false;
            let forcePrepend = false;
            let container = domNode.childNodes[domOffset] || domNode;
            let offset = container === domNode ? domOffset : 0;
            if (container === domNode && container.childNodes.length) {
                container = container.childNodes[container.childNodes.length - 1];
                offset = nodeLength(container);
                forceAfter = true;
            }
            while (!domMap.fromDom(container)) {
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

            // When targetting the end of a node, the DOM gives an offset that is
            // equal to the length of the container. In order to retrieve the last
            // descendent, we need to make sure we target an existing node, ie. an
            // existing index.
            const isAfterEnd = offset >= nodeLength(container);
            let index = isAfterEnd ? nodeLength(container) - 1 : offset;
            // Move to deepest child of container.
            while (container.hasChildNodes()) {
                const child = container.childNodes[index];
                if (!domMap.fromDom(child)) {
                    break;
                }
                container = child;
                index = isAfterEnd ? nodeLength(container) - 1 : 0;
                // Adapt the offset to be its equivalent within the new container.
                offset = isAfterEnd ? nodeLength(container) : index;
            }

            const nodes = domMap.fromDom(container);

            // Get the VNodes matching the container.
            let reference: VNode;
            if (isInstanceOf(container, Text)) {
                // The reference is the index-th match (eg.: text split into chars).
                reference = forceAfter ? nodes[nodes.length - 1] : nodes[index];
            } else {
                reference = nodes[0];
            }
            if (forceAfter) {
                return [reference, RelativePosition.AFTER];
            }
            if (forcePrepend && reference instanceof ContainerNode) {
                return [reference, RelativePosition.INSIDE];
            }

            return reference.locate(container, offset);
        };

        // Parse the dom selection into the description of a VSelection.
        const start = _locate(domSelection.anchorNode, domSelection.anchorOffset);
        const end = _locate(domSelection.focusNode, domSelection.focusOffset);
        const [startVNode, startPosition] = start;
        const [endVNode, endPosition] = end;
        let direction: Direction;
        if (domSelection instanceof Selection) {
            const domRange = domSelection.rangeCount && domSelection.getRangeAt(0);
            if (
                domRange.startContainer === domSelection.anchorNode &&
                domRange.startOffset === domSelection.anchorOffset
            ) {
                direction = Direction.FORWARD;
            } else {
                direction = Direction.BACKWARD;
            }
        }
        const selection: VSelectionDescription = {
            anchorNode: startVNode,
            anchorPosition: startPosition,
            focusNode: endVNode,
            focusPosition: endPosition,
            direction: direction,
        };
        editor.selection.set(selection);

        domMap.clear();
    }

    return parsedVNodes;
}

export async function parseEditable(
    editor: JWEditor,
    element: HTMLElement,
    autofocus = false,
): Promise<VNode[]> {
    const nodes = await parseElement(editor, element);
    nodes[0].editable = false;
    nodes[0].breakable = false;
    nodes[0].modifiers.get(Attributes).set('contentEditable', 'true');
    if (autofocus && !editor.selection.anchor.parent) {
        if (nodes[0].hasChildren()) {
            editor.selection.setAt(nodes[0].firstChild(), RelativePosition.BEFORE);
        } else {
            editor.selection.setAt(nodes[0], RelativePosition.INSIDE);
        }
    }
    return nodes;
}

export async function createEditable(editor: JWEditor, autofocus = false): Promise<VNode[]> {
    const root = new TagNode({ htmlTag: 'jw-editable' });
    // Semantic elements are inline by default.
    // We need to guarantee it's a block so it can contain
    // other blocks.
    root.modifiers.get(Attributes).set('style', 'display: block;');
    root.editable = false;
    root.breakable = false;
    root.modifiers.get(Attributes).set('contentEditable', 'true');
    if (autofocus && !editor.selection.anchor.parent) {
        editor.selection.setAt(root, RelativePosition.INSIDE);
    }
    return [root];
}
