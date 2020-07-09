import { RenderingIdentifier } from './RenderingEngine';
import { RenderingEngine } from './RenderingEngine';
import { Modifier } from '../../core/src/Modifier';
import { ModifierPredicate } from '../../core/src/Modifier';
import { VNode } from '../../core/src/VNodes/VNode';

class SuperModifierRenderer<T> {
    constructor(public renderer: ModifierRenderer<T>) {}
    /**
     * Render the given modifier and wrap the list of DomObject into a
     * formating DomObject.
     *
     * @param modifier
     * @param contents
     * @param batch
     */
    render(modifier: Modifier, contents: T[], batch: VNode[]): Promise<T> {
        const nextRenderer = this.renderer.engine.getCompatibleModifierRenderer(
            modifier,
            this.renderer,
        );
        return nextRenderer?.render(modifier, contents, batch);
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
     * Render the given modifier and wrap the list of DomObject into a
     * formating DomObject.
     *
     * @param modifier
     * @param contents
     * @param batch
     */
    abstract render(modifier: Modifier, renderings: T[], batch: VNode[]): Promise<T>;
}

export interface ModifierRenderer<T = {}> {
    constructor: ModifierRendererConstructor<T>;
}

export type ModifierRendererConstructor<T = {}> = {
    new (engine: RenderingEngine<T>): ModifierRenderer<T>;
    id: RenderingIdentifier;
};
