import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import {
    DomObjectRenderingEngine,
    DomObject,
    DomObjectFragment,
    DomObjectText,
    DomObjectElement,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { RenderingEngineWorker } from '../../plugin-renderer/src/RenderingEngineCache';
import { IconNode } from './IconNode';
import { Predicate } from '../../core/src/VNodes/VNode';

const zeroWidthSpace = '\u200b';

export class IconDomObjectRenderer extends NodeRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate: Predicate = IconNode;

    async render(node: IconNode, worker: RenderingEngineWorker<DomObject>): Promise<DomObject> {
        const icon: DomObjectElement = this._createIcon(node);
        // Surround the icon with two invisible characters so the
        // selection can navigate around it.
        const domObject: DomObjectFragment = {
            children: [
                // We are targetting the invisible character BEFORE the
                // icon node.
                // If offset 1:
                // Moving from before the icon node to after it.
                // (DOM is `<invisible/>[]<icon/><invisible/>` but
                // should be `<invisible/><icon/><invisible/>[]`).
                // else:
                // Stay before the icon node.
                { text: zeroWidthSpace },
                // If we are targetting the icon directyle then stay
                // before the icon node.
                icon,
                // We are targetting the invisible character AFTER the
                // icon node.
                // If offset 0:
                // Moving from after the icon node to before it.
                // (DOM is `<invisible/><icon/>[]<invisible/>` but
                // should be `[]<invisible/><icon/><invisible/>`).
                // else:
                // Stay after the icon node.
                { text: zeroWidthSpace },
            ],
        };

        worker.locate([node], domObject.children[0] as DomObjectText);
        worker.locate([node], icon);
        worker.locate([node], domObject.children[2] as DomObjectText);

        return domObject;
    }
    /**
     * Create the icon node.
     *
     * Meant to be overriden.
     */
    _createIcon(node: IconNode): DomObjectElement {
        const icon: DomObjectElement = {
            tag: node.htmlTag,
            attributes: {
                class: new Set(node.iconClasses),
            },
        };
        return icon;
    }
}
