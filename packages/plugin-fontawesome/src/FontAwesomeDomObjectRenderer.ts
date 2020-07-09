import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { FontAwesomeNode } from './FontAwesomeNode';
import {
    DomObjectRenderingEngine,
    DomObject,
    DomObjectFragment,
    DomObjectText,
    DomObjectElement,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';

const zeroWidthSpace = '\u200b';

export class FontAwesomeDomObjectRenderer extends NodeRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = FontAwesomeNode;

    async render(node: FontAwesomeNode): Promise<DomObject> {
        const fontawesome: DomObjectElement = { tag: node.htmlTag };
        // Surround the fontawesome with two invisible characters so the
        // selection can navigate around it.
        const domObject: DomObjectFragment = {
            children: [
                // We are targetting the invisible character BEFORE the
                // fontawesome node.
                // If offset 1:
                // Moving from before the fontawesome node to after it.
                // (DOM is `<invisible/>[]<fontawesome/><invisible/>` but
                // should be `<invisible/><fontawesome/><invisible/>[]`).
                // else:
                // Stay before the fontawesome node.
                { text: zeroWidthSpace },
                // If we are targetting the fontawesome directyle then stay
                // before the fontawesome node.
                fontawesome,
                // We are targetting the invisible character AFTER the
                // fontawesome node.
                // If offset 0:
                // Moving from after the fontawesome node to before it.
                // (DOM is `<invisible/><fontawesome/>[]<invisible/>` but
                // should be `[]<invisible/><fontawesome/><invisible/>`).
                // else:
                // Stay after the fontawesome node.
                { text: zeroWidthSpace },
            ],
        };

        this.engine.locate([node], domObject.children[0] as DomObjectText);
        this.engine.locate([node], fontawesome);
        this.engine.locate([node], domObject.children[2] as DomObjectText);

        return domObject;
    }
}
