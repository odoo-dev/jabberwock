import { PreNode } from './PreNode';
import { VNode } from '../../core/src/VNodes/VNode';
import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import {
    DomObjectRenderingEngine,
    DomObject,
    DomObjectFragment,
} from '../../plugin-html/src/DomObjectRenderingEngine';

export class PreSeparatorDomObjectRenderer extends AbstractRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;

    predicate = (item: VNode): boolean => {
        const DefaultSeparator = this.engine.editor.configuration.defaults.Separator;
        return item.is(DefaultSeparator) && !!item.ancestor(PreNode);
    };

    /**
     * Render the VNode.
     */
    async render(node: VNode): Promise<DomObject> {
        const separators = (await this.super.render(node)) as DomObjectFragment;
        const rendering: DomObject = {
            children: separators.children.map(() => {
                const separator: DomObject = { text: '\n' };
                this.engine.locate([node], separator);
                return separator;
            }),
        };
        return rendering;
    }
}
