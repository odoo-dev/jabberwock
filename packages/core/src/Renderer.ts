import { VNode } from './VNodes/VNode';
import { VDocument } from './VDocument';

export type RendererIdentifier = string;
export type RenderingFunction<To = {}> = (node: VNode, to: To) => Promise<Map<VNode, To[]>>;

export abstract class Renderer<To = {}> {
    readonly id: RendererIdentifier;
    renderingFunctions = new Set<RenderingFunction<To>>();
    abstract async render(content: VDocument | VNode, to: To): Promise<void>;
    abstract async renderNode(node: VNode, to: To): Promise<Map<VNode, To[]>>;
    abstract async renderChildren(node: VNode, to: To): Promise<void>;
}
