import { RenderingContext } from './Renderer';
import { AttributeName, Attribute } from './VNodes/Attribute';
import { VNode } from './VNodes/VNode';

export type RenderingEngineName = string;
/**
 * Renderers exist to render a node into another, different format. Each
 * format is implemented by a separate renderer following this interface.
 */
export interface RenderingEngine<ElementType> {
    /**
     * Render the given node to the format implemented by this renderer.
     *
     * The type of the format that is implemented by each renderer cannot be
     * known from the interface itself and so will need to be casted when used.
     */
    render: (context: RenderingContext) => RenderingContext;
    renderAttributesTo: (
        attributes: Map<AttributeName, Attribute>,
        node: ElementType,
    ) => ElementType;
    addToMap: (element: ElementType, vNode: VNode, index?: number) => void;
}
