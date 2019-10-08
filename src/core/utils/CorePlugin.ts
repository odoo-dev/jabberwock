import { JWPlugin } from '../JWPlugin';
import { VDocument } from '../stores/VDocument';
import { VNode } from '../stores/VNode';

interface VPosition {
    ref: VNode;
    side: 'before' | 'after';
}

export class CorePlugin extends JWPlugin {
    vDocument: VDocument;
    handlers = {
        intents: {
            remove: 'onRemoveIntent', // names are just to show relationships here
            render: 'render',
            setRange: 'navigate',
        },
    };
    commands = {
        navigate: this.navigate.bind(this),
        onRemoveIntent: this.removeSide,
        render: this.render.bind(this),
    };
    constructor(dispatcher, vDocument) {
        super(dispatcher);
        this.vDocument = vDocument;
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    removeSide(intent: Intent): void {
        console.log('REMOVE SIDE:' + intent);
    }
    /**
     * Navigate to a given Range (in the payload of the Intent).
     *
     * @param intent
     */
    navigate(intent: Intent): void {
        this._setRange(intent.payload['value']);
    }
    /**
     * Render the `vDocument`.
     */
    render(): void {
        this.vDocument.renderer.render(this.vDocument.editable);
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Return a position in the `VDocument` as a tuple `[VNode, 'before' | 'after']`
     * (ie. the position is before or after a given `VNode`). The position is
     * always given on the leaf.
     *
     * @param container
     * @param offset
     */
    _getPosition(container: DOMElement | Node, offset: number): VPosition {
        const containers = this.vDocument.domMap.get(container);
        const isTextNode = container.nodeType === 3;
        if (isTextNode) {
            return this._positionToLeaf({
                ref: containers[offset] || containers[containers.length - 1],
                side: offset < containers.length ? 'before' : 'after',
            });
        }
        return this._positionToLeaf({ ref: containers[offset], side: 'before' });
    }
    /**
     * Return a tuple with the range nodes in ltr order (rtl if `reverse` is
     * true) and updates their `order` property accordingly.
     *
     * @param reverse
     */
    _orderedRangeNodes(reverse = false): [VNode, VNode] {
        const rangeNodes = this.vDocument.rangeNodes;
        const res: [VNode, VNode] = [rangeNodes.start, rangeNodes.end];
        if (reverse) {
            res.reverse();
        }
        res.forEach((rangeNode: VNode, i: 0 | 1) => {
            rangeNode.order = i;
        });
        return res;
    }
    /**
     * Move the position to its deepest first descendent.
     *
     * @param position
     */
    _positionToLeaf(position: VPosition): VPosition {
        while (position.ref.children.length) {
            position.ref = position.ref.firstChild;
            position.side = 'before';
        }
        return position;
    }
    /**
     * Move the `Range VNodes` to the position in `VDocument` corresponding to
     * the given DOM Range and trigger a rendering.
     *
     * @param range
     */
    _setRange(range: Range): void {
        const startPos: VPosition = this._getPosition(range.startContainer, range.startOffset);
        const endPos: VPosition = this._getPosition(range.endContainer, range.endOffset);
        const [first, last] = this._orderedRangeNodes(range['direction'] === 'rtl');

        // Move the range nodes. If the start has to be moved *after* its
        // reference node, the end should be moved first.
        if (startPos.side === 'after') {
            endPos.ref[endPos.side](last);
            startPos.ref[startPos.side](first);
        } else {
            startPos.ref[startPos.side](first);
            endPos.ref[endPos.side](last);
        }
        this.dispatcher.dispatch(this.intent({ name: 'render' }));
    }
}
