import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { ThemeNode } from './ThemeNode';
import { Theme } from './Theme';
import { RenderingEngineWorker } from '../../plugin-renderer/src/RenderingEngineCache';

export class ThemeDomObjectRenderer extends NodeRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = ThemeNode;

    async render(themeNode: ThemeNode): Promise<DomObject> {
        const themePlugin = this.engine.editor.plugins.get(Theme);
        const component = themePlugin.themes[themeNode.themeName];
        const nodes = await component.render(this.engine.editor);
        const cache = await this.engine.render(nodes);
        const domObjects = nodes.map(node => cache.renderings.get(node));
        for (const domObject of domObjects) {
            await this._resolvePlaceholder(themeNode, domObject, cache.worker);
        }
        return { children: domObjects };
    }
    private async _resolvePlaceholder(
        theme: ThemeNode,
        domObject: DomObject,
        worker: RenderingEngineWorker<DomObject>,
    ): Promise<void> {
        await this.engine.resolveChildren(domObject, worker);
        let placeholderFound = false;
        const domObjects: DomObject[] = [domObject];
        for (const domObject of domObjects) {
            if ('tag' in domObject && domObject.tag === 'T-PLACEHOLDER') {
                if (!placeholderFound) {
                    delete domObject.tag;
                    domObject.children = theme.children();
                    placeholderFound = true;
                }
            } else if ('dom' in domObject) {
                if (!placeholderFound) {
                    for (const domNode of domObject.dom) {
                        const placeholder =
                            domNode instanceof Element && domNode.querySelector('T-PLACEHOLDER');
                        if (placeholder) {
                            for (const child of theme.children()) {
                                placeholder.parentNode.insertBefore(
                                    this.engine.renderPlaceholder(child),
                                    placeholder,
                                );
                            }
                            placeholder.parentNode.removeChild(placeholder);
                            placeholderFound = true;
                        }
                    }
                }
            } else if ('children' in domObject) {
                // Recursively apply on children in one stack.
                domObjects.push(...(domObject.children as DomObject[]));
            }
        }
    }
}
