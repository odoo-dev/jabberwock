import { VNode } from './VNodes/VNode';
import { VDocument } from './VDocument';

export type RendererIdentifier = string;
export type RenderingFunction<To = {}> = (node: VNode, to: To) => Map<VNode, To[]>;

export abstract class Renderer<To = {}> {
    readonly id: RendererIdentifier;
    renderingFunctions = new Set<RenderingFunction<To>>();
    abstract render(content: VDocument | VNode, target: To): void;
    abstract renderNode(node: VNode, to: To): Map<VNode, To[]>;
}
