import { VNode } from './VNode';
import { ParsingContext } from '../Parser';
import { utils } from '../../../utils/src/utils';
import { RenderingContext } from '../Renderer';

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
        return utils.parse(context, VElement, context.node.nodeName);
    }
    static render(context: RenderingContext): RenderingContext {
        return utils.render(context, (context.currentVNode as VElement).htmlTag);
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
