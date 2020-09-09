import { DomObjectRenderingEngine, DomObject } from './DomObjectRenderingEngine';
import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { TagNode } from '../../core/src/VNodes/TagNode';
import { AtomicTagNode } from '../../core/src/VNodes/AtomicTagNode';
import { Predicate } from '../../core/src/VNodes/VNode';

export class TagDomObjectRenderer extends NodeRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate: Predicate = node =>
        (node instanceof AtomicTagNode || node instanceof TagNode) && node.htmlTag[0] !== '#';

    async render(node: TagNode): Promise<DomObject> {
        return {
            tag: node.htmlTag,
            children: await this.engine.renderChildren(node),
        };
    }
}
