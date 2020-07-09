import { JWPluginConfig, JWPlugin } from '../../core/src/JWPlugin';
import {
    RenderingIdentifier,
    RenderingEngine,
    RenderingEngineConstructor,
} from './RenderingEngine';
import { VNode } from '../../core/src/VNodes/VNode';
import { ModifierRendererConstructor } from './ModifierRenderer';
import { RendererConstructor } from './NodeRenderer';

export class Renderer<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    loaders = {
        renderingEngines: this.loadRenderingEngines,
        renderers: this.loadRenderers,
    };
    engines: Record<RenderingIdentifier, RenderingEngine> = {};

    async render<T>(renderingId: string, node: VNode): Promise<T | void>;
    async render<T>(renderingId: string, nodes: VNode[]): Promise<T[] | void>;
    async render<T>(renderingId: string, nodes: VNode | VNode[]): Promise<T | T[] | void> {
        const engine = this.engines[renderingId] as RenderingEngine<T>;
        if (!engine) {
            // The caller might want to fallback on another rendering.
            return;
        }
        engine.clear();
        if (nodes instanceof Array) {
            return engine.render(nodes);
        } else {
            return (await engine.render([nodes]))[0];
        }
    }

    loadRenderingEngines(renderingEngines: RenderingEngineConstructor[]): void {
        for (const EngineClass of renderingEngines) {
            const id = EngineClass.id;
            if (this.engines[id]) {
                throw new Error(`Rendering engine ${id} already registered.`);
            }
            const engine = new EngineClass(this.editor);
            this.engines[id] = engine;
        }
    }

    loadRenderers(renderers: RendererConstructor[] | ModifierRendererConstructor[]): void {
        renderers = [...renderers].reverse() as RendererConstructor[];
        for (const RendererClass of renderers) {
            for (const id in this.engines) {
                const renderingEngine = this.engines[id];
                const supportedTypes = [id, ...renderingEngine.constructor.extends];
                if (supportedTypes.includes(RendererClass.id)) {
                    renderingEngine.register(RendererClass);
                }
            }
        }
    }
}
