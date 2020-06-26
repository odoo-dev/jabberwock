import {
    RenderingEngineCache,
    RenderingEngineWorker,
} from '../../plugin-renderer/src/RenderingEngineCache';
import {
    DomObject,
    DomObjectElement,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { ShadowNode } from '../../plugin-shadow/src/ShadowNode';
import { MailObjectRenderingEngine } from './MailObjectRenderingEngine';
import { VNode } from '../../core/src/VNodes/VNode';

export type Styling = {
    current: Record<string, string>; // Evaluate css of the current domObject
    inherit: Record<string, string>; // Evaluate inherited css of the domObject
};
export type Hierarchy = { domObject: DomObjectElement; node: VNode }[];

export interface MailRenderingEngineWorker extends RenderingEngineWorker<DomObject> {
    getStyleFromCSSRules: (
        node: VNode,
        domObject: DomObject,
        rendering?: DomObject,
    ) => Promise<Styling>;
}

export class MailRenderingEngineCache extends RenderingEngineCache<DomObject> {
    readonly shadowRoots = new Map<ShadowNode, ShadowRoot>();
    readonly inheritedStyling: Map<DomObject, Styling> = new Map();
    readonly parented: Map<VNode | DomObject, Hierarchy> = new Map();
    readonly promiseHierarchy: Map<VNode | DomObject, Promise<Hierarchy>> = new Map();
    readonly defaultFontSize: Record<string, number> = {};
    worker?: MailRenderingEngineWorker;

    constructor(engine: MailObjectRenderingEngine) {
        super(engine);
        this.worker.getStyleFromCSSRules = engine.getStyleFromCSSRules.bind(engine, this);
    }
}
