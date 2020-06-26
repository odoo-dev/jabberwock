import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { HorizontalRuleNode } from './HorizontalRuleNode';
import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';

export class HorizontalRuleDomObjectRenderer extends NodeRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = HorizontalRuleNode;

    async render(): Promise<DomObject> {
        const horizontalRule: DomObject = {
            tag: 'HR',
        };
        return horizontalRule;
    }
}
