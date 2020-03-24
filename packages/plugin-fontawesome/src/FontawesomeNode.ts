import { InlineNode } from '../../plugin-inline/src/InlineNode';
import { RelativePosition } from '../../core/src/VNodes/VNode';
import { FontawesomeDomParser } from './FontawesomeDomParser';

export class FontawesomeNode extends InlineNode {
    static readonly atomic = true;
    constructor(public htmlTag = 'SPAN') {
        super();
    }

    //--------------------------------------------------------------------------
    // Lifecycle
    //--------------------------------------------------------------------------

    /**
     * @override
     */
    locate(domNode: Node, offset: number): [this, RelativePosition] {
        if (domNode.nodeType === Node.TEXT_NODE) {
            // We are targetting one of the invisible characters surrounding the
            // fontawesome node.
            if (FontawesomeDomParser.isFontawesome(domNode.previousSibling)) {
                // We are targetting the invisible character AFTER the
                // fontawesome node.
                if (offset === 0) {
                    // Moving from after the fontawesome node to before it.
                    // (DOM is `<invisible/><fontawesome/>[]<invisible/>` but
                    // should be `[]<invisible/><fontawesome/><invisible/>`).
                    return [this, RelativePosition.BEFORE];
                } else {
                    // Stay after the fontawesome node.
                    return [this, RelativePosition.AFTER];
                }
            } else {
                // We are targetting the invisible character BEFORE the
                // fontawesome node.
                if (offset === 1) {
                    // Moving from before the fontawesome node to after it.
                    // (DOM is `<invisible/>[]<fontawesome/><invisible/>` but
                    // should be `<invisible/><fontawesome/><invisible/>[]`).
                    return [this, RelativePosition.AFTER];
                } else {
                    // Stay before the fontawesome node.
                    return [this, RelativePosition.BEFORE];
                }
            }
        } else {
            // We should never reach this. It's a fallback to prevent a crash in
            // the eventuality that it would.
            return [this, RelativePosition.BEFORE];
        }
    }
}
