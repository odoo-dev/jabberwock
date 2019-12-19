import { VNode } from './VNode';
import { HTMLRendering } from '../BasicHtmlRenderingEngine';
import { ParsingContext } from '../Parser';
import { utils } from '../../../utils/src/utils';

export class VElement extends VNode {
    htmlTag: string;
    constructor(tagName: string) {
        super();
        this.htmlTag = tagName;
        this.name = tagName;
    }

    //--------------------------------------------------------------------------
    // Lifecycle
    //--------------------------------------------------------------------------

    static parse(context: ParsingContext): ParsingContext {
        return utils.contextToVNode(context, VElement, context.node.nodeName);
    }
    static render(node: VElement): HTMLRendering {
        const tagName = node.htmlTag;
        const fragment = document.createDocumentFragment();
        let renderedElements = [document.createElement(tagName)] as Node[];
        if (node.attributes.size) {
            node.attributes.forEach(attribute => {
                renderedElements = attribute.render(renderedElements);
            });
        }
        renderedElements.forEach(element => {
            fragment.appendChild(element);

            // If a node is empty but could accomodate children,
            // fill it to make it visible.
            if (!node.hasChildren() && !node.atomic) {
                element.appendChild(document.createElement('BR'));
            }
        });
        return { fragment: fragment, vNodes: [node] };
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Return a new VNode with the same type and attributes as this VNode.
     */
    shallowDuplicate(): VElement {
        return new VElement(this.htmlTag);
    }
}
