import { VDocument } from './VDocument';

export type RendererIdentifier = string;
export type RenderingFunction<Context = {}, T = {}> = (context: Context) => T;

export abstract class Renderer<Context = {}, T = {}> {
    readonly id: RendererIdentifier;
    renderingFunctions = new Set<RenderingFunction<Context, T>>();
    abstract render(vDocument: VDocument, target: Element): void;
    abstract renderNode(currentContext: Context): Context;
}
