import { RenderingIdentifier } from './RenderingEngine';
import { RenderingEngine } from './RenderingEngine';
import { Modifier } from '../../core/src/Modifier';
import { ModifierPredicate } from '../../core/src/Modifier';
import { VNode } from '../../core/src/VNodes/VNode';
import { RenderingEngineWorker } from './RenderingEngineCache';

class SuperModifierRenderer<T> {
    constructor(public renderer: ModifierRenderer<T>) {}
    /**
     * Render the given modifier and return a list of DomObject witch
     * the applied modifier. The list can have an other len of the given
     * list of DomObject.
     *
     * @param modifier
     * @param contents
     * @param batch
     */
    render(
        modifier: Modifier,
        contents: T[],
        batch: VNode[],
        worker: RenderingEngineWorker<T>,
    ): Promise<T[]> {
        const nextRenderer = worker.getCompatibleModifierRenderer(modifier, this.renderer);
        return nextRenderer?.render(modifier, contents, batch, worker);
    }
}

export abstract class ModifierRenderer<T> {
    static id: RenderingIdentifier;
    readonly predicate?: ModifierPredicate;
    readonly engine: RenderingEngine<T>;
    readonly super: SuperModifierRenderer<T>;
    constructor(engine: RenderingEngine<T>) {
        this.engine = engine;
        this.super = new SuperModifierRenderer(this);
    }
    /**
     * Render the given modifier and return a list of DomObject witch
     * the applied modifier. The list can have an other len of the given
     * list of DomObject.
     *
     * @param modifier
     * @param contents
     * @param batch
     */
    abstract render(
        modifier: Modifier,
        renderings: T[],
        batch: VNode[],
        worker: RenderingEngineWorker<T>,
    ): Promise<T[]>;
}

export interface ModifierRenderer<T = {}> {
    constructor: ModifierRendererConstructor<T>;
}

export type ModifierRendererConstructor<T = {}> = {
    new (engine: RenderingEngine<T>): ModifierRenderer<T>;
    id: RenderingIdentifier;
};
