import { ModifierRenderer } from '../../plugin-renderer/src/ModifierRenderer';
import { Modifier } from '../../core/src/Modifier';
import { DomObjectRenderingEngine, DomObject } from './DomObjectRenderingEngine';

export class DefaultDomObjectModifierRenderer extends ModifierRenderer<DomObject> {
    static id = 'dom/object';
    engine: DomObjectRenderingEngine;

    /**
     * Default rendering for Modifier.
     *
     * @param modifier
     * @param contents
     */
    async render(modifier: Modifier, contents: DomObject[]): Promise<DomObject> {
        if (contents.length === 1) {
            return contents[0];
        } else {
            return { children: contents };
        }
    }
}
