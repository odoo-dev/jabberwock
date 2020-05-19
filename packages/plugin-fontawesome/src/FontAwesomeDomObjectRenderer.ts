import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { FontAwesomeNode } from './FontAwesomeNode';
import {
    DomObjectRenderingEngine,
    DomObject,
    DomObjectFragment,
    DomObjectText,
    DomObjectElement,
} from '../../plugin-html/src/DomObjectRenderingEngine';
import { Attributes } from '../../plugin-xml/src/Attributes';

const zeroWidthSpace = '\u200b';

export class FontAwesomeDomObjectRenderer extends AbstractRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = FontAwesomeNode;

    async render(node: FontAwesomeNode): Promise<DomObject> {
        const fontawesome: DomObjectElement = { tag: node.htmlTag };
        this.engine.renderAttributes(Attributes, node, fontawesome);
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
                // If eventuality target the font-awsame from the parent offset
                // It's before.
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
